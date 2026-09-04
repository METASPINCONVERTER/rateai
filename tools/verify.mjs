#!/usr/bin/env node
/**
 * Rate AI — verification harness
 *
 * There is no browser in this environment, so the class of mistake that would
 * normally be caught by opening the site has to be caught by reading it
 * instead. This script parses every HTML, CSS and JS file in the project and
 * checks the things that rot silently in a hand-written design system:
 *
 *   - a class used in markup that no CSS rule matches (and the reverse)
 *   - a var(--token) nobody defines, or a token nobody uses
 *   - a raw colour that bypasses the palette
 *   - a spacing value off the scale
 *   - a fixed width that cannot fit a 320px screen
 *   - a label, aria-* or href pointing at something that moved
 *   - a shell block (nav, footer, tab bar) that drifted on one page only
 *   - a hard-coded list of <option>s that drifted from its source array
 *   - a colour pair that fails WCAG AA
 *   - an emoji used as an interface element
 *
 * FAIL blocks the build. WARN is for review — some warnings are legitimate
 * one-offs, and the ones that are get added to the exception lists below with
 * a reason, so the list itself stays honest.
 *
 * Usage: node tools/verify.mjs [--verbose]
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VERBOSE = process.argv.includes('--verbose');

/* ==========================================================================
   Plumbing
   ========================================================================== */

const fails = [];
const warns = [];
let checked = 0;

const fail = (check, message) => fails.push([check, message]);
const warn = (check, message) => warns.push([check, message]);
const ran = () => { checked += 1; };

const src = new Map();
const load = (path) => {
  if (!src.has(path)) src.set(path, readFileSync(join(ROOT, path), 'utf8'));
  return src.get(path);
};

function walkDir(dir, ext, out = []) {
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walkDir(path, ext, out);
    else if (entry.name.endsWith(ext)) out.push(path);
  }
  return out;
}

const HTML = readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
const CSS = walkDir('css', '.css').sort();
const JS = walkDir('js', '.js').sort();
const ALL = [...HTML, ...CSS, ...JS];

/** Page module -> the one page that loads it. */
const PAGE_OF = {
  'js/pages/home.js': 'index.html',
  'js/pages/explore.js': 'explore.html',
  'js/pages/tool.js': 'tool.html',
  'js/pages/compare.js': 'compare.html',
  'js/pages/submit.js': 'submit.html',
  'js/pages/about.js': 'about.html',
  'js/pages/contact.js': 'contact.html',
  'js/pages/privacy.js': 'privacy.html',
  'js/pages/terms.js': 'terms.html',
  'js/pages/how-it-works.js': 'how-it-works.html',
  'js/pages/trust.js': 'trust.html',
  'js/pages/guidelines.js': 'guidelines.html',
  'js/pages/faq.js': 'faq.html',
  'js/pages/notfound.js': '404.html',
  'js/pages/pricing.js': 'pricing.html',
};

/* Comments are blanked rather than deleted so every byte offset — and so every
   reported line number — still lines up with the file on disk. */
const blank = (text, re) => text.replace(re, (m) => m.replace(/[^\n]/g, ' '));
const noCssComments = (css) => blank(css, /\/\*[\s\S]*?\*\//g);
const noHtmlComments = (html) => blank(html, /<!--[\s\S]*?-->/g);
const noJsComments = (js) => blank(blank(js, /\/\*[\s\S]*?\*\//g), /(^|[^:\\])\/\/[^\n]*/g);

function lineIndex(text) {
  const arr = new Int32Array(text.length + 1);
  let line = 1;
  for (let i = 0; i < text.length; i++) {
    arr[i] = line;
    if (text[i] === '\n') line += 1;
  }
  arr[text.length] = line;
  return arr;
}

const uniq = (list) => [...new Set(list)];
const matches = (text, re) => [...text.matchAll(re)];

/**
 * Blanks `${...}` holes with brace matching. A regex cannot do this: a nested
 * hole such as `${a ? `<b>${x}</b>` : ''}` ends at the first `}` it finds and
 * leaves `: ''}` behind, which then gets swept into whatever attribute follows.
 */
function blankHoles(text) {
  const out = [...text];
  for (let i = 0; i < out.length - 1; i++) {
    if (out[i] !== '$' || out[i + 1] !== '{') continue;
    let depth = 0;
    let j = i + 1;
    for (; j < out.length; j++) {
      if (out[j] === '{') depth += 1;
      else if (out[j] === '}' && --depth === 0) break;
    }
    for (let k = i; k <= Math.min(j, out.length - 1); k++) {
      if (out[k] !== '\n') out[k] = ' ';
    }
    i = j;
  }
  return out.join('');
}

/** The template literal a position sits in, or '' if it sits in none. */
function enclosingTemplate(text, index) {
  let start = -1;
  for (let i = 0; i < index; i++) {
    if (text[i] === '`' && text[i - 1] !== '\\') start = start === -1 ? i : -1;
  }
  return start === -1 ? '' : text.slice(start, index);
}

/* ==========================================================================
   CSS parsing
   A tolerant walker: enough structure to know the selector, the at-rule
   context, the declarations and the line of each, without pulling in a parser.
   ========================================================================== */

function walkCss(path) {
  const css = noCssComments(load(path));
  const ln = lineIndex(css);
  const rules = [];
  const stack = [];
  let start = 0;

  const flush = (end) => {
    const slice = css.slice(start, end);
    const at = start + (slice.length - slice.trimStart().length);
    const chunk = slice.trim();
    start = end + 1;
    if (!chunk || !stack.length) return;
    const top = stack[stack.length - 1];
    if (top.prelude.startsWith('@')) return;
    const colon = chunk.indexOf(':');
    if (colon > 0) {
      top.decls.push({
        prop: chunk.slice(0, colon).trim(),
        value: chunk.slice(colon + 1).trim(),
        line: ln[at],
      });
    }
  };

  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      const slice = css.slice(start, i);
      const at = start + (slice.length - slice.trimStart().length);
      stack.push({ prelude: slice.trim().replace(/\s+/g, ' '), line: ln[at], decls: [] });
      start = i + 1;
    } else if (ch === '}') {
      flush(i);
      const done = stack.pop();
      if (!done) {
        fail('css/braces', `${path}:${ln[i]} stray closing brace`);
      } else if (!done.prelude.startsWith('@')) {
        rules.push({
          path,
          selector: done.prelude,
          line: done.line,
          at: stack.map((s) => s.prelude),
          decls: done.decls,
        });
      }
      start = i + 1;
    } else if (ch === ';') {
      flush(i);
    }
  }

  if (stack.length) {
    const first = stack[0];
    fail('css/braces', `${path}: ${stack.length} unclosed block(s); outermost opens line ${first.line} (${first.prelude})`);
  }
  return rules;
}

const RULES = CSS.flatMap(walkCss);
ran();

/* ==========================================================================
   1. Syntax: every module parses
   ========================================================================== */

for (const path of [...JS, 'server.mjs', 'tools/verify.mjs']) {
  const out = spawnSync(process.execPath, ['--check', join(ROOT, path)], { encoding: 'utf8' });
  if (out.status !== 0) fail('js/syntax', `${path}: ${(out.stderr || '').trim().split('\n')[0]}`);
  ran();
}

/* Rough structural balance. Not a parser — but an unclosed <div> in a
   hand-written page is exactly the bug this catches, and it catches it cheaply. */
for (const path of HTML) {
  const html = noHtmlComments(load(path));
  for (const tag of ['div', 'section', 'main', 'header', 'footer', 'nav', 'form', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'label', 'fieldset', 'aside', 'p', 'span', 'a', 'button', 'dl', 'dt', 'dd']) {
    const open = matches(html, new RegExp(`<${tag}(?=[\\s>])`, 'g')).length;
    const close = matches(html, new RegExp(`</${tag}>`, 'g')).length;
    if (open !== close) fail('html/balance', `${path}: <${tag}> opened ${open}x, closed ${close}x`);
  }
  ran();
}

/* ==========================================================================
   2. Design tokens
   ========================================================================== */

const TOKENS_FILE = 'css/tokens.css';

/** Custom properties declared anywhere, and the values declared in tokens.css. */
const declaredTokens = new Set();
const themes = { light: new Map(), dark: new Map() };

for (const rule of RULES) {
  for (const decl of rule.decls) {
    if (!decl.prop.startsWith('--')) continue;
    declaredTokens.add(decl.prop);
    if (rule.path !== TOKENS_FILE) continue;
    const dark =
      rule.selector.includes('[data-theme="dark"]') ||
      rule.at.some((a) => a.includes('prefers-color-scheme: dark'));
    themes[dark ? 'dark' : 'light'].set(decl.prop, decl.value);
    /* The light block is the base for both themes: dark only overrides. */
    if (!dark) themes.dark.set(decl.prop, themes.dark.get(decl.prop) ?? decl.value);
  }
}

/* Re-apply dark overrides after the base fill above, in source order. */
for (const rule of RULES) {
  if (rule.path !== TOKENS_FILE) continue;
  const dark =
    rule.selector.includes('[data-theme="dark"]') ||
    rule.at.some((a) => a.includes('prefers-color-scheme: dark'));
  if (!dark) continue;
  for (const decl of rule.decls) {
    if (decl.prop.startsWith('--')) themes.dark.set(decl.prop, decl.value);
  }
}

const usedTokens = new Map(); // token -> Set of files
for (const path of ALL) {
  const text = path.endsWith('.css') ? noCssComments(load(path)) : load(path);
  for (const m of matches(text, /var\(\s*(--[\w-]+)/g)) {
    if (!usedTokens.has(m[1])) usedTokens.set(m[1], new Set());
    usedTokens.get(m[1]).add(path);
  }
}

/**
 * A custom property assigned in a style attribute is declared at runtime. This
 * is the one place the project writes an inline style on purpose: a per-instance
 * measurement (a star's fill width, a meter's percentage) is data, not styling,
 * and a custom property is the only way to hand data to a stylesheet.
 */
for (const path of [...JS, ...HTML]) {
  for (const m of matches(load(path), /style\s*=\s*["'][^"']*?(--[\w-]+)\s*:/g)) {
    declaredTokens.add(m[1]);
  }
}

for (const [token, where] of usedTokens) {
  if (!declaredTokens.has(token)) {
    fail('tokens/undefined', `var(${token}) used in ${[...where].join(', ')} but never declared`);
  }
}
for (const token of declaredTokens) {
  if (!usedTokens.has(token)) warn('tokens/unused', `${token} is declared but never used`);
}
ran();

/* Both themes must define exactly the same colour tokens, or one theme silently
   inherits a light value. */
const colourish = (name) =>
  /^--(bg|surface|text|border|accent|positive|caution|negative|star|focus|shadow|scrim)/.test(name);
for (const token of themes.light.keys()) {
  if (colourish(token) && !themes.dark.has(token)) {
    fail('tokens/theme-gap', `${token} is defined for light but not dark`);
  }
}
for (const token of themes.dark.keys()) {
  if (colourish(token) && !themes.light.has(token)) {
    fail('tokens/theme-gap', `${token} is defined for dark but not light`);
  }
}
ran();

/* The two dark blocks — the media query and the manual override — must agree,
   or the toggle and the OS setting produce different sites. */
{
  const blocks = RULES.filter(
    (r) =>
      r.path === TOKENS_FILE &&
      (r.selector.includes('[data-theme="dark"]') ||
        r.at.some((a) => a.includes('prefers-color-scheme: dark'))),
  );
  if (blocks.length !== 2) {
    fail('tokens/dark-blocks', `expected 2 dark token blocks, found ${blocks.length}`);
  } else {
    const [a, b] = blocks.map((r) => r.decls.map((d) => `${d.prop}:${d.value}`).sort().join('|'));
    if (a !== b) fail('tokens/dark-drift', 'the @media dark block and :root[data-theme="dark"] do not declare the same values');
  }
  ran();
}

/* ==========================================================================
   3. Raw colours outside the palette
   ========================================================================== */

const COLOUR_RE = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/g;
for (const path of ALL) {
  if (path === TOKENS_FILE) continue;
  const text = path.endsWith('.css')
    ? noCssComments(load(path))
    : path.endsWith('.html')
      ? noHtmlComments(load(path))
      : noJsComments(load(path));
  const ln = lineIndex(text);
  for (const m of matches(text, COLOUR_RE)) {
    const before = text.slice(Math.max(0, m.index - 90), m.index);
    /* An id selector or a URL fragment is not a colour. */
    if (/(?:href|src|url\(|xlink:href)\s*=?\s*["']?[^"'\s]*$/.test(before)) continue;
    /* theme-color paints the browser's own chrome. It is read before any
       stylesheet loads, so it cannot be a var() — the value has to be literal,
       and it is checked against the palette by tokens/theme-color below. */
    if (/name="theme-color"[^>]*$/.test(before)) continue;
    fail('colour/raw', `${path}:${ln[m.index]} raw colour ${m[0]} — use a token`);
  }
  ran();
}

/* Since theme-color must repeat a literal, verify it repeats the right one. */
for (const path of HTML) {
  const html = noHtmlComments(load(path));
  const tags = matches(html, /<meta name="theme-color"[^>]*>/g).map((m) => m[0]);
  const want = [
    ['light', themes.light.get('--bg')],
    ['dark', themes.dark.get('--bg')],
  ];
  if (tags.length !== 2) {
    fail('tokens/theme-color', `${path}: expected one theme-color per scheme, found ${tags.length}`);
  } else {
    for (const [scheme, value] of want) {
      const tag = tags.find((t) => t.includes(`prefers-color-scheme: ${scheme}`));
      if (!tag) fail('tokens/theme-color', `${path}: no theme-color for ${scheme}`);
      else if (!tag.toUpperCase().includes(String(value).toUpperCase())) {
        fail('tokens/theme-color', `${path}: ${scheme} theme-color should be ${value}`);
      }
    }
  }
  ran();
}

/* ==========================================================================
   4. Spacing scale, fixed widths and touch targets
   ========================================================================== */

/* Two rules rather than one list.
 *
 * The first draft of this check was a single set of permitted pixel values plus
 * a growing table of exceptions. The table reached twenty-seven entries, which
 * was the check telling me it had the wrong shape: a card's 272px minimum and a
 * 24px gap are not the same kind of number, and no single scale can hold both.
 *
 * So the scale governs *space* — the eleven rungs, and nothing else, because
 * that is what makes rhythm read as deliberate. Everything with a *size* is
 * held to the 4px grid instead: free to be 272px or 104px, never 30px or 42px.
 * Below 4px nothing is spacing at all — it is optical alignment against a
 * hairline or a text baseline — so those are allowed and named as such.
 */
const SPACE_PROP =
  /^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left|scroll-margin|scroll-padding|text-indent)(-|$)/;
const HAIRLINE_PROP =
  /^(border|outline|box-shadow|text-shadow|letter-spacing|word-spacing)(-|$)/;

const SPACE_RUNGS = new Set([0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80]);

/* Marks and glyphs are drawn art, not boxes in the layout grid, so their
   diameters are their own short scale. Each one is a thing you can point at. */
const MARK_PX = new Map([
  [5, 'the chevron drawn inside a select, as two 45° gradient corners'],
  [6, 'meter track height, and the concentric inner radius of a segment (8 − 2 padding)'],
  [10, 'scrollbar width'],
  [14, 'small icon and the busy spinner'],
  [18, 'icon inside a badge'],
  [22, 'favicon inside a tool mark — half the 44px touch target'],
  [26, 'the brand mark, at its viewBox size'],
]);

const SAFE_MIN_WIDTH = 288; /* 320px viewport minus two 16px gutters. */

for (const rule of RULES) {
  if (rule.path === TOKENS_FILE) continue;
  const inMinWidthQuery = rule.at.some((a) => /min-width/.test(a));
  for (const decl of rule.decls) {
    if (decl.prop.startsWith('--')) continue;

    for (const m of matches(decl.value, /(-?\d*\.?\d+)px/g)) {
      const px = Math.abs(Number(m[1]));
      const where = `${rule.path}:${decl.line}`;
      const what = `${decl.prop}: ${m[0]} (${rule.selector})`;

      if (SPACE_PROP.test(decl.prop)) {
        /* Sub-4px in a spacing property is a nudge, not a step. */
        if (SPACE_RUNGS.has(px) || px < 4) continue;
        warn('space/off-rung', `${where} ${what} is not on the spacing scale`);
      } else if (HAIRLINE_PROP.test(decl.prop)) {
        if (px <= 3 || px === 999 || SPACE_RUNGS.has(px) || MARK_PX.has(px)) continue;
        warn('space/hairline', `${where} ${what} is thicker than a hairline`);
      } else {
        /* 1px rules, 1px clip boxes and 1px optical shifts are hairlines
           wherever they appear, so the grid does not apply to them either. */
        if (px % 4 === 0 || px < 4 || px === 999 || MARK_PX.has(px)) continue;
        warn('space/off-grid', `${where} ${what} is off the 4px grid`);
      }
    }

    if (/^(width|min-width)$/.test(decl.prop) && !inMinWidthQuery) {
      const m = decl.value.match(/^(\d+)px$/);
      if (m && Number(m[1]) > SAFE_MIN_WIDTH) {
        fail('responsive/fixed-width', `${rule.path}:${decl.line} ${rule.selector} sets ${decl.prop}: ${m[0]} outside a min-width query — cannot fit 320px`);
      }
    }
  }
}
ran();

/* Every breakpoint should be one the project actually designed for. */
const BREAKPOINTS = new Set([359, 360, 479, 480, 639, 640, 767, 768, 859, 860, 1023, 1024, 1279, 1280]);
for (const path of CSS) {
  const css = noCssComments(load(path));
  const ln = lineIndex(css);
  for (const m of matches(css, /@media[^{]*?\(\s*(?:min|max)-width:\s*(\d+)px/g)) {
    if (!BREAKPOINTS.has(Number(m[1]))) {
      warn('responsive/breakpoint', `${path}:${ln[m.index]} unexpected breakpoint ${m[1]}px`);
    }
  }
  ran();
}

/* --------------------------------------------------------------------------
   Touch targets.

   44px is the brief's floor and WCAG 2.5.5's, and a control's height is written
   in CSS, so this is checkable rather than a matter of eyeballing. The set of
   controls is not a hand-written list — it is derived from the markup: every
   class that appears on a button, link, input, select or textarea. So a new
   control is covered the moment it is used, which is the only way a rule like
   this survives.

   Height only. Width is set by a label, and padding a three-letter pill out to
   a 44px square would be worse design, not better — WCAG's own exception for
   inline links reflects the same reasoning. Elements with no height in CSS are
   sized by their content and are not the failure mode this is looking for.
   -------------------------------------------------------------------------- */

const TOUCH_MIN = 44;

/* Control sizes come from the media-query-free :root block. The phone overrides
   in tokens.css move type and gutters; deliberately never a control height, so
   that a control's size is one number wherever you read it. */
const SIZE_TOKENS = new Map();
for (const rule of RULES) {
  if (rule.path !== TOKENS_FILE || rule.at.length) continue;
  for (const decl of rule.decls) {
    const m = decl.value.trim().match(/^(\d+)px$/);
    if (m) SIZE_TOKENS.set(decl.prop, Number(m[1]));
  }
}

const asPx = (value) => {
  const token = value.trim().match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (token) return SIZE_TOKENS.get(token[1]);
  const literal = value.trim().match(/^(\d+(?:\.\d+)?)px$/);
  return literal ? Number(literal[1]) : undefined;
};

const phoneQuery = (at) =>
  at.some((a) => {
    const m = a.match(/max-width:\s*(\d+)px/);
    return m && Number(m[1]) <= 767;
  });

/* Classes worn by something you can actually operate. A class interpolated by
   JS (`class="btn ${variant}"`) contributes the literal parts and skips the
   hole, which is what the ${} guard is for. */
const CONTROL_TAG =
  /<(?:button|a|input|select|textarea)\b[^>]*?\bclass\s*=\s*["'`]([^"'`]+)["'`]/g;
const controlClasses = new Set();
for (const path of [...HTML, ...JS]) {
  for (const m of matches(load(path), CONTROL_TAG)) {
    for (const cls of m[1].split(/\s+/)) {
      if (cls && !cls.includes('$') && !cls.includes('{')) controlClasses.add(cls);
    }
  }
}

/* Per class: the height it ends up with on a phone, and the height it has
   otherwise. Later declarations overwrite earlier ones within each tier, which
   is how the cascade resolves the equal-specificity single-class rules this
   stylesheet is built from. */
const measured = new Map();
for (const rule of RULES) {
  if (rule.at.some((a) => /min-width/.test(a))) continue;
  const tier = phoneQuery(rule.at) ? 'phone' : 'base';
  for (const decl of rule.decls) {
    if (decl.prop !== 'height' && decl.prop !== 'min-height') continue;
    const px = asPx(decl.value);
    if (px === undefined) continue;
    for (const part of rule.selector.split(',')) {
      const subject = part.trim().split(/\s+/).pop() || '';
      for (const m of matches(subject, /\.([\w-]+)/g)) {
        if (!controlClasses.has(m[1])) continue;
        const entry = measured.get(m[1]) ?? {};
        entry[tier] = { px, where: `${rule.path}:${decl.line}`, selector: rule.selector };
        measured.set(m[1], entry);
      }
    }
  }
}

/* A control a phone never renders is held to the pointer that does reach it —
   2.5.8's 24px, which both of these clear. The exemption names the element that
   does the hiding so the claim can be checked rather than trusted. */
const DESKTOP_ONLY = [
  ['nav-link', 'nav-links', 'the desktop nav row; the tab bar replaces it below 768px'],
  ['segment', 'segmented', 'the result-layout switch; mobile always gets the ledger'],
];

const hiddenOnPhone = new Set();
for (const rule of RULES) {
  if (!phoneQuery(rule.at)) continue;
  if (!rule.decls.some((d) => d.prop === 'display' && d.value.trim() === 'none')) continue;
  for (const m of matches(rule.selector, /\.([\w-]+)/g)) hiddenOnPhone.add(m[1]);
}

for (const [cls, hider, why] of DESKTOP_ONLY) {
  if (!hiddenOnPhone.has(hider)) {
    fail('touch/exempt', `.${cls} is exempt from the ${TOUCH_MIN}px floor because ${why}, but .${hider} is never display:none below 768px`);
  } else if ((measured.get(cls)?.phone ?? measured.get(cls)?.base)?.px >= TOUCH_MIN) {
    warn('touch/exempt', `.${cls} no longer needs its desktop-only exemption`);
  }
  ran();
}

const exempt = new Set(DESKTOP_ONLY.map(([cls]) => cls));
for (const [cls, tiers] of measured) {
  const hit = tiers.phone ?? tiers.base;
  if (!hit || hit.px >= TOUCH_MIN || exempt.has(cls) || hiddenOnPhone.has(cls)) continue;
  fail('touch/target', `${hit.where} ${hit.selector} gives .${cls} a ${hit.px}px height on a phone, under the ${TOUCH_MIN}px minimum`);
}
ran();

/* --------------------------------------------------------------------------
   The gap the check above leaves: it can only judge a height that exists.
   A standalone link with no height at all is the more common defect — it ends
   up as tall as one line of 13px text, about 21px, and reads as fine on a
   desktop because a mouse does not care. Six of those shipped before this
   check existed.

   Judged per element rather than per class, because sizing is normally carried
   by one class of several (.btn sizes, .btn-primary colours), and an element is
   reachable if any of its classes gives it a target.
   -------------------------------------------------------------------------- */

/* A child stretched by its parent has a target without a height of its own.
   The parent is named so the claim can be checked, and it is: the height it
   inherits has to clear the floor too. */
const SIZED_BY_PARENT = [
  ['tabbar-link', 'tabbar', 'a grid item filling the fixed bar'],
];

for (const [cls, parent, why] of SIZED_BY_PARENT) {
  const rule = RULES.find(
    (r) => phoneQuery(r.at) &&
      r.selector.split(',').some((p) => p.trim() === `.${parent}`) &&
      r.decls.some((d) => d.prop === 'height'),
  );
  const value = rule?.decls.findLast((d) => d.prop === 'height')?.value ?? '';
  /* calc(var(--tabbar-h) + env(safe-area-inset-bottom)) — the token carries
     the height and the env() only ever adds to it. */
  const token = value.match(/var\(\s*(--[\w-]+)\s*\)/);
  const px = token ? SIZE_TOKENS.get(token[1]) : asPx(value);

  if (px === undefined) {
    fail('touch/parent', `.${cls} is exempt because it is ${why}, but .${parent} has no measurable height on a phone`);
  } else if (px < TOUCH_MIN) {
    fail('touch/parent', `.${cls} inherits ${px}px from .${parent}, under the ${TOUCH_MIN}px minimum`);
  }
  ran();
}

/* WCAG 2.5.5 exempts a target that is "in a sentence or block of text". These
   are the links that qualify, plus the two that are sized by something other
   than a stylesheet rule. Anything not listed has to be a real target. */
const INLINE_OK = new Map([
  ['link', 'prose links, inside a sentence — 2.5.5 inline exception'],
  ['link-quiet', 'metadata beside a heading, inline in its row'],
  ['skip-link', 'reachable only by keyboard, where a target size means nothing'],
  ['sr-only', 'never painted'],
  ['tool-link', 'stretched by ::after over the whole card, which is the target'],
  ['star-value', 'a readout, not a control'],
]);

for (const path of HTML) {
  const html = noHtmlComments(load(path));
  const ln = lineIndex(html);
  for (const m of matches(html, CONTROL_TAG)) {
    const classes = m[1].split(/\s+/).filter((c) => c && !c.includes('$') && !c.includes('{'));
    if (!classes.length) continue;
    if (classes.some((c) => hiddenOnPhone.has(c) || exempt.has(c) || INLINE_OK.has(c) ||
      SIZED_BY_PARENT.some(([child]) => child === c))) continue;

    const heights = classes
      .map((c) => measured.get(c))
      .map((tiers) => tiers && (tiers.phone ?? tiers.base)?.px)
      .filter((px) => px !== undefined);

    if (!heights.length) {
      fail('touch/unsized', `${path}:${ln[m.index]} .${classes.join('.')} is a control with no height on a phone — it will be as tall as its text`);
    } else if (Math.max(...heights) < TOUCH_MIN) {
      fail('touch/unsized', `${path}:${ln[m.index]} .${classes.join('.')} resolves to ${Math.max(...heights)}px on a phone, under the ${TOUCH_MIN}px minimum`);
    }
  }
}
ran();

/* ==========================================================================
   5. Contrast
   ========================================================================== */

function parseHex(hex) {
  const h = hex.trim().replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const TEXT_TOKENS = ['--text-primary', '--text-secondary', '--text-muted', '--accent-text', '--positive', '--caution', '--negative'];
const SURFACE_TOKENS = ['--bg', '--surface', '--surface-subtle', '--surface-sunken'];
const PAIRS = [
  ['--accent-contrast', '--accent'],
  ['--accent-contrast', '--accent-hover'],
  ['--accent-contrast', '--accent-active'],
  ['--accent-text', '--accent-wash'],
  ['--positive', '--positive-wash'],
  ['--caution', '--caution-wash'],
  ['--negative', '--negative-wash'],
  ['--text-inverse', '--text-primary'],
  ['--star-on', '--surface'],
  ['--star-on', '--bg'],
];

/* WCAG 1.4.11 draws a line, and this table has to draw the same one: 3:1 is
 * required of anything whose shape identifies a control or one of its states,
 * and is not required of decoration.
 *
 * A card's hairline is decoration. The card is identified by its contents, and a
 * quiet edge is the whole point of "border first, shadow second" — so --border
 * and --border-strong are deliberately below 3:1 and are not listed here.
 *
 * A text field's border is the opposite: the field is white on a near-white
 * panel, so its border is the only thing saying "type here". That is what
 * --border-control is for, and it has to hold against every surface a control
 * can sit on — its own fill and whatever surrounds it.
 *
 * An empty star is decoration on a printed rating, where the numeral is right
 * beside it, but a target on the rating form. One token serves both, so it is
 * held to the stricter reading.
 */
const NON_TEXT_PAIRS = [
  ['--focus-ring', '--bg', 3],
  ['--focus-ring', '--surface', 3],
  ['--accent', '--surface', 3],
  ['--border-control', '--surface', 3],
  ['--border-control', '--bg', 3],
  ['--border-control', '--surface-subtle', 3],
  ['--star-off', '--surface', 3],
  ['--star-off', '--bg', 3],
];

/* The hairline ladder has to stay in order. Nothing above proves that --border
   is quieter than --border-strong, so a single careless hex could leave a
   "strong" border looking weaker than a plain one. */
const HAIRLINE_LADDER = ['--border', '--border-strong', '--border-control'];

for (const theme of ['light', 'dark']) {
  const value = (token) => themes[theme].get(token);
  const check = (fg, bg, min, label) => {
    const a = value(fg);
    const b = value(bg);
    if (!a || !b || !a.startsWith('#') || !b.startsWith('#')) return;
    const ratio = contrast(a, b);
    const line = `${theme}: ${fg} on ${bg} = ${ratio.toFixed(2)}:1`;
    if (min > 0 && ratio < min) fail('contrast', `${line} (needs ${min}:1) ${label}`);
    else if (VERBOSE || min === 0) warn('contrast/info', line);
  };

  for (const fg of TEXT_TOKENS) for (const bg of SURFACE_TOKENS) check(fg, bg, 4.5, 'text');
  for (const [fg, bg] of PAIRS) check(fg, bg, 4.5, 'pair');
  for (const [fg, bg, min] of NON_TEXT_PAIRS) check(fg, bg, min, 'non-text');

  const rungs = HAIRLINE_LADDER.map((t) => [t, value(t)]).filter(([, v]) => v?.startsWith('#'));
  for (let i = 1; i < rungs.length; i += 1) {
    const [prevName, prev] = rungs[i - 1];
    const [name, cur] = rungs[i];
    const [a, b] = [contrast(prev, value('--surface')), contrast(cur, value('--surface'))];
    if (b <= a) {
      fail('contrast/ladder', `${theme}: ${name} (${b.toFixed(2)}:1) is not stronger than ${prevName} (${a.toFixed(2)}:1) on --surface`);
    }
  }
  ran();
}

/* ==========================================================================
   6. Classes: markup <-> stylesheet
   ========================================================================== */

/** Class names a CSS rule matches. */
const cssClasses = new Set();
for (const rule of RULES) {
  for (const m of matches(rule.selector, /\.(-?[A-Za-z_][\w-]*)/g)) cssClasses.add(m[1]);
}

/**
 * Class names the product actually puts on elements.
 *
 * Two passes, because neither alone is right. The strict pass reads
 * hole-blanked text, so `class="btn btn-${v}"` yields `btn` and nothing false —
 * that pass is allowed to fail the build. The loose pass reads the raw text and
 * any class-shaped string literal, which catches classes written inside a hole
 * (`${win ? ' class="cmp-win"' : ''}`) or passed as an argument
 * (`icon('star', 'ic ic-sm')`); it can only ever mark a class as *used*, so a
 * stray token there suppresses a warning at worst and can never hide a missing
 * rule.
 */
const usedClasses = new Map();
const mentioned = new Set();
const CLASS_NAME = /^-?[A-Za-z_][\w-]*$/;

const noteClass = (name, where) => {
  if (!CLASS_NAME.test(name ?? '')) return;
  if (!usedClasses.has(name)) usedClasses.set(name, new Set());
  usedClasses.get(name).add(where);
  mentioned.add(name);
};

for (const path of [...HTML, ...JS]) {
  const text = path.endsWith('.html') ? noHtmlComments(load(path)) : noJsComments(load(path));
  const strict = blankHoles(text);

  for (const m of matches(strict, /class\s*=\s*"([^"]*)"|class\s*=\s*'([^']*)'/g)) {
    (m[1] ?? m[2] ?? '').split(/\s+/).forEach((c) => noteClass(c, path));
  }
  for (const m of matches(strict, /classList\.(?:add|remove|toggle|contains)\(([^)]*)\)/g)) {
    for (const s of matches(m[1], /['"]([^'"]+)['"]/g)) noteClass(s[1], path);
  }
  for (const m of matches(strict, /querySelector(?:All)?\(\s*['"]([^'"$`]+)['"]/g)) {
    for (const s of matches(m[1], /\.(-?[A-Za-z_][\w-]*)/g)) noteClass(s[1], path);
  }

  /* Loose pass — "used" only. */
  for (const m of matches(text, /class\s*=\s*\\?["']([^"'`]*)["']/g)) {
    m[1].split(/\s+/).forEach((c) => { if (CLASS_NAME.test(c)) mentioned.add(c); });
  }
  /* Any quoted or backticked run of class-shaped words. Backticks count because
     classes are also assigned as templates, and the run is trimmed first because
     a fragment spliced into an attribute carries its own leading space
     (`${small ? ' empty-sm' : ''}`) — which an anchored pattern would reject. */
  for (const m of matches(text, /['"`]([\w \t-]*)['"`]/g)) {
    const parts = m[1].trim().split(/\s+/).filter(Boolean);
    if (parts.length && parts.every((p) => CLASS_NAME.test(p))) parts.forEach((p) => mentioned.add(p));
  }
  /* A class assembled around a hole — `toast toast-${kind}`, ` stars-${size}` —
     names a family rather than one class, so every rule sharing the literal
     prefix counts as applied: the suffix is a runtime value and no static
     reading can enumerate the values it takes. Every backtick run is searched,
     not just the ones sitting after `class=`, because the fragment is often
     built into a variable first and interpolated later. The prefix has to be
     substantial, or a hole at position 0 would vacuously excuse every rule in
     the stylesheet. */
  /* A class assembled around a hole — `toast toast-${kind}`, ` stars-${size}`,
     `notice-${kind}` — names a family rather than one class, so every rule
     sharing the literal stem counts as applied: the suffix is a runtime value
     and no static reading can enumerate the values it takes. The stem is matched
     directly rather than by locating the enclosing template, because these
     fragments are routinely nested (`class="notice${k ? ` notice-${k}` : ''}"`)
     and pairing backticks across a nested literal reads the wrong text. A family
     also implies its own base class, which is how the constant half of
     `toast toast-${kind}` gets seen. */
  for (const m of matches(text, /([A-Za-z_][\w-]*)-\$\{/g)) {
    const base = m[1];
    if (cssClasses.has(base)) mentioned.add(base);
    for (const c of cssClasses) if (c.startsWith(`${base}-`)) mentioned.add(c);
  }
  ran();
}

for (const [name, where] of usedClasses) {
  if (!cssClasses.has(name)) {
    fail('class/no-rule', `.${name} is used in ${[...where].join(', ')} but no CSS rule matches it`);
  }
}
for (const name of cssClasses) {
  if (!mentioned.has(name)) warn('class/unused', `.${name} is styled but never applied`);
}
ran();

/* ==========================================================================
   7. Icons
   ========================================================================== */

const iconSource = load('js/icons.js');
const iconNames = new Set(
  matches(iconSource.slice(iconSource.indexOf('const PATHS'), iconSource.indexOf('export function icon')), /^\s{2}([A-Za-z]\w*):/gm).map((m) => m[1]),
);

/**
 * Two questions, two passes. "Is every icon we ask for defined?" may only look
 * at unambiguous call sites — a literal name — or a ternary like
 * icon(dark ? 'moon' : 'sun') would report the condition as a missing icon.
 * "Is every defined icon used?" may look at every quoted word inside an icon()
 * call, because a false positive there only silences a warning.
 */
const iconsRequested = new Map();
const iconsMentioned = new Set();

for (const path of [...HTML, ...JS]) {
  if (path === 'js/icons.js') continue;
  const text = path.endsWith('.html') ? noHtmlComments(load(path)) : noJsComments(load(path));
  for (const m of [
    ...matches(text, /\bicon\(\s*['"](\w+)['"]\s*[,)]/g),
    ...matches(text, /data-icon\s*=\s*"(\w+)"/g),
    ...matches(text, /\bmark:\s*['"](\w+)['"]/g),
  ]) {
    if (!iconsRequested.has(m[1])) iconsRequested.set(m[1], new Set());
    iconsRequested.get(m[1]).add(path);
    iconsMentioned.add(m[1]);
  }
  /* Any quoted word anywhere in the file that names an icon counts as a use. */
  for (const m of matches(text, /['"](\w+)['"]/g)) {
    if (iconNames.has(m[1])) iconsMentioned.add(m[1]);
  }
}
for (const [name, where] of iconsRequested) {
  if (!iconNames.has(name)) {
    fail('icon/missing', `icon "${name}" requested in ${[...where].join(', ')} but not defined in js/icons.js`);
  }
}
for (const name of iconNames) {
  if (!iconsMentioned.has(name)) warn('icon/unused', `icon "${name}" is defined but never used`);
}
ran();

/* ==========================================================================
   8. Data slots: every element a page module reaches for must exist
   ========================================================================== */

const RENDERED = [...JS].map((p) => noJsComments(load(p))).join('\n');

for (const [module, page] of Object.entries(PAGE_OF)) {
  const text = noJsComments(load(module));
  const html = noHtmlComments(load(page));
  const wanted = uniq(
    matches(text, /querySelector(?:All)?\(\s*['"]\[(data-[\w-]+)[\]=]/g).map((m) => m[1]),
  );
  for (const attr of wanted) {
    if (html.includes(attr)) continue;
    if (RENDERED.includes(attr)) {
      warn('slot/rendered', `${module} queries [${attr}], absent from ${page} but rendered by JS`);
      continue;
    }
    fail('slot/missing', `${module} queries [${attr}] but ${page} has no such element`);
  }
  ran();
}

/* Dead slots: markup carrying a hook nothing reads. */
for (const path of HTML) {
  const html = noHtmlComments(load(path));
  for (const attr of uniq(matches(html, /\s(data-[\w-]+)/g).map((m) => m[1]))) {
    if (attr === 'data-icon' || attr === 'data-icon-size' || attr === 'data-theme') continue;
    if (!RENDERED.includes(attr)) warn('slot/dead', `${path} declares [${attr}] but no module reads it`);
  }
  ran();
}

/* ==========================================================================
   9. HTML integrity: ids, labels, links, landmarks
   ========================================================================== */

const idsOf = (html) => matches(html, /\sid\s*=\s*"([^"]+)"/g).map((m) => m[1]);

for (const path of HTML) {
  const html = noHtmlComments(load(path));
  const ln = lineIndex(html);
  const ids = idsOf(html);
  const idSet = new Set(ids);

  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  for (const id of uniq(dupes)) fail('html/duplicate-id', `${path}: id="${id}" appears more than once`);

  /* Every reference resolves — in the page, or in a module that renders it. */
  for (const attr of ['for', 'aria-describedby', 'aria-labelledby', 'aria-controls', 'aria-owns']) {
    for (const m of matches(html, new RegExp(`\\s${attr}\\s*=\\s*"([^"]+)"`, 'g'))) {
      for (const ref of m[1].trim().split(/\s+/)) {
        if (idSet.has(ref)) continue;
        if (RENDERED.includes(`id="${ref}"`) || RENDERED.includes(`"${ref}"`)) {
          warn('html/idref-dynamic', `${path}:${ln[m.index]} ${attr}="${ref}" resolves only once JS has rendered`);
          continue;
        }
        fail('html/idref', `${path}:${ln[m.index]} ${attr}="${ref}" points at no such id`);
      }
    }
  }

  /* Local links must lead somewhere. */
  for (const m of matches(html, /\shref\s*=\s*"([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(href)) continue;
    const file = href.split(/[?#]/)[0];
    if (!file) continue;
    if (!existsSync(join(ROOT, file))) fail('html/dead-link', `${path}:${ln[m.index]} href="${href}" — no such file`);
  }

  /* Landmarks and page basics. */
  const one = (re, label) => {
    const n = matches(html, re).length;
    if (n !== 1) fail('html/structure', `${path}: expected exactly one ${label}, found ${n}`);
  };
  one(/<main[\s>]/g, '<main>');
  one(/<h1[\s>]/g, '<h1>');
  one(/<title>/g, '<title>');
  one(/<header class="nav">/g, 'site header');
  one(/<footer class="footer">/g, 'site footer');
  one(/<nav class="tabbar"/g, 'tab bar');
  one(/class="skip-link"/g, 'skip link');
  one(/<meta name="viewport"/g, 'viewport meta');
  one(/<meta name="description"/g, 'description meta');
  one(/<html lang="en">/g, 'lang attribute');

  if (!html.includes('id="main"')) fail('html/structure', `${path}: skip link target #main is missing`);

  /* Heading order must not skip a level. */
  let previous = 0;
  for (const m of matches(html, /<h([1-6])[\s>]/g)) {
    const level = Number(m[1]);
    if (previous && level > previous + 1) {
      fail('a11y/heading-order', `${path}:${ln[m.index]} h${level} follows h${previous}`);
    }
    previous = level;
  }

  /* Inline styles: the design system exists precisely so these are not needed. */
  for (const m of matches(html, /\sstyle\s*=\s*"/g)) {
    fail('css/inline-style', `${path}:${ln[m.index]} inline style attribute`);
  }

  /* New tabs need the opener severed; images need alt text. */
  for (const m of matches(html, /<a\b[^>]*target\s*=\s*"_blank"[^>]*>/g)) {
    if (!/rel\s*=\s*"[^"]*noopener/.test(m[0])) {
      fail('html/target-blank', `${path}:${ln[m.index]} target="_blank" without rel="noopener"`);
    }
  }
  for (const m of matches(html, /<img\b[^>]*>/g)) {
    if (!/\salt\s*=/.test(m[0])) fail('a11y/img-alt', `${path}:${ln[m.index]} <img> without alt`);
  }

  /* A control with no text needs a name from somewhere. */
  for (const m of matches(html, /<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const text = m[2].replace(/<[^>]*>/g, '').trim();
    const named = /aria-label\s*=|aria-labelledby\s*=/.test(m[1]);
    const slot = /data-[\w-]+/.test(m[1]);
    if (!text && !named && !slot) fail('a11y/button-name', `${path}:${ln[m.index]} <button> has no accessible name`);
  }

  /* Every field needs a label: a for=, an aria-label, or a wrapping <label>. */
  const labelSpans = matches(html, /<label\b[^>]*>[\s\S]*?<\/label>/g).map((m) => [m.index, m.index + m[0].length]);
  const wrapped = (index) => labelSpans.some(([a, b]) => index > a && index < b);
  const labelledIds = new Set(matches(html, /<label\b[^>]*\sfor\s*=\s*"([^"]+)"/g).map((m) => m[1]));
  for (const m of matches(html, /<(input|select|textarea)\b([^>]*)>/g)) {
    const attrs = m[2];
    if (/type\s*=\s*"(hidden|submit|button|reset)"/.test(attrs)) continue;
    const id = attrs.match(/\sid\s*=\s*"([^"]+)"/)?.[1];
    if (id && labelledIds.has(id)) continue;
    if (/aria-label\s*=|aria-labelledby\s*=/.test(attrs)) continue;
    if (wrapped(m.index)) continue;
    fail('a11y/label', `${path}:${ln[m.index]} <${m[1]}> has no label`);
  }

  /* Positive tabindex reorders the document unpredictably. */
  for (const m of matches(html, /tabindex\s*=\s*"([1-9]\d*)"/g)) {
    fail('a11y/tabindex', `${path}:${ln[m.index]} tabindex="${m[1]}" — only 0 and -1 are safe`);
  }

  /* Current page marked once for the desktop nav and once for the tab bar.
     Secondary utility pages without primary navigation links have 0. */
  const current = matches(html, /aria-current="page"/g).length;
  const zeroCurrentPages = [
    '404.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html',
    'tool.html', 'submit.html', 'how-it-works.html', 'trust.html', 'guidelines.html', 'faq.html',
  ];
  const expected = zeroCurrentPages.includes(path) ? 0 : 2;
  if (current !== expected) {
    fail('a11y/current', `${path}: ${current} aria-current="page" (expected ${expected})`);
  }
  ran();
}

/* ==========================================================================
   10. Shell drift: the pieces repeated on every page must be identical
   ========================================================================== */

const SHELL_BLOCKS = [
  ['head/styles', /<link rel="stylesheet" href="css[\s\S]*?<script>\(function/],
  ['nav', /<header class="nav">[\s\S]*?<\/header>/],
  ['footer', /<footer class="footer">[\s\S]*?<\/footer>/],
  ['tabbar', /<nav class="tabbar"[\s\S]*?<\/nav>/],
];

for (const [label, re] of SHELL_BLOCKS) {
  const seen = new Map();
  for (const path of HTML) {
    const block = noHtmlComments(load(path)).match(re)?.[0];
    if (!block) {
      fail('shell/missing', `${path}: no ${label} block`);
      continue;
    }
    /* The only permitted per-page difference is which item is current. */
    const normal = block
      .replace(/\saria-current="page"/g, '')
      .replace(/\sclass="([^"]*)\bis-current\b([^"]*)"/g, ' class="$1$2"')
      .replace(/\s+/g, ' ')
      .trim();
    if (!seen.has(normal)) seen.set(normal, []);
    seen.get(normal).push(path);
  }
  if (seen.size > 1) {
    const groups = [...seen.values()].map((g) => g.join('+')).join('  vs  ');
    fail('shell/drift', `${label} differs across pages: ${groups}`);
  }
  ran();
}

/* ==========================================================================
   11. Hard-coded option lists must match their source arrays
   ========================================================================== */

function arrayLiteral(source, name) {
  const start = source.indexOf(`export const ${name}`);
  if (start < 0) return null;
  const open = source.indexOf('[', start);
  const close = source.indexOf('];', open);
  if (open < 0 || close < 0) return null;
  return source.slice(open, close + 1);
}

const storeSource = load('js/store.js');

function optionValues(html, selectId) {
  const block = html.slice(html.indexOf(selectId));
  const end = block.indexOf('</select>');
  if (end < 0) return [];
  return matches(block.slice(0, end), /<option value="([^"]*)"/g).map((m) => m[1]).filter(Boolean);
}

{
  const explore = noHtmlComments(load('explore.html'));
  const sorts = uniq(matches(arrayLiteral(storeSource, 'SORTS') ?? '', /value:\s*'([^']+)'/g).map((m) => m[1]));
  const options = optionValues(explore, 'data-sort');
  if (sorts.join(',') !== options.join(',')) {
    fail('drift/sorts', `explore.html sort options [${options}] != SORTS [${sorts}]`);
  }
  ran();
}

{
  const submit = noHtmlComments(load('submit.html'));
  const cats = uniq(matches(arrayLiteral(storeSource, 'CATEGORIES') ?? '', /'([^']+)'/g).map((m) => m[1]));
  const options = optionValues(submit, 'id="tl-category"');
  if (cats.join(',') !== options.join(',')) {
    fail('drift/categories', `submit.html categories [${options}] != CATEGORIES [${cats}]`);
  }
  const tiers = uniq(matches(arrayLiteral(storeSource, 'PRICING') ?? '', /'([^']+)'/g).map((m) => m[1]));
  const radios = matches(submit, /name="pricing"[^>]*value="([^"]+)"|value="([^"]+)"[^>]*name="pricing"/g)
    .map((m) => m[1] ?? m[2]);
  if (tiers.join(',') !== radios.join(',')) {
    fail('drift/pricing', `submit.html pricing [${radios}] != PRICING [${tiers}]`);
  }
  ran();
}

{
  if (!existsSync(join(ROOT, 'site.webmanifest'))) {
    fail('manifest/missing', 'site.webmanifest is missing');
  } else {
    try {
      const manifest = JSON.parse(load('site.webmanifest'));
      if (!manifest.name || !manifest.icons?.length) {
        fail('manifest/invalid', 'site.webmanifest missing name or icons');
      }
    } catch {
      fail('manifest/json', 'site.webmanifest is not valid JSON');
    }
  }
  if (!existsSync(join(ROOT, 'robots.txt'))) {
    fail('seo/robots', 'robots.txt is missing');
  }
  if (!existsSync(join(ROOT, 'sitemap.xml'))) {
    fail('seo/sitemap', 'sitemap.xml is missing');
  }
  ran();
}

{
  const toolDir = join(ROOT, 'review');
  if (existsSync(toolDir)) {
    const slugs = readdirSync(toolDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const titles = new Set();
    const descs = new Set();

    for (const slug of slugs) {
      const indexPath = `review/${slug}/index.html`;
      if (!existsSync(join(ROOT, indexPath))) {
        fail('seo/page', `${indexPath} missing`);
        continue;
      }
      const content = load(indexPath);
      const titleMatch = content.match(/<title>([^<]+)<\/title>/);
      const descMatch = content.match(/<meta name="description" content="([^"]+)">/);
      const jsonLdMatch = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

      if (!titleMatch) {
        fail('seo/title', `${indexPath} missing <title>`);
      } else {
        const title = titleMatch[1].trim();
        if (titles.has(title)) {
          fail('seo/title-duplicate', `${indexPath} duplicate title: ${title}`);
        }
        titles.add(title);
      }

      if (!descMatch) {
        fail('seo/desc', `${indexPath} missing meta description`);
      } else {
        const desc = descMatch[1].trim();
        if (descs.has(desc)) {
          fail('seo/desc-duplicate', `${indexPath} duplicate description: ${desc}`);
        }
        descs.add(desc);
      }

      if (!jsonLdMatch) {
        fail('seo/jsonld', `${indexPath} missing JSON-LD`);
      } else {
        try {
          const parsed = JSON.parse(jsonLdMatch[1]);
          if (!parsed['@context'] || !parsed['@type']) {
            fail('seo/jsonld-invalid', `${indexPath} JSON-LD missing @context or @type`);
          }
        } catch {
          fail('seo/jsonld-syntax', `${indexPath} invalid JSON-LD syntax`);
        }
      }
    }
  }
  ran();
}

/* ==========================================================================
   12. Module graph
   ========================================================================== */

/** Every name the project's own modules export, and where from. */
const EXPORTED = new Map();
for (const path of JS) {
  for (const m of matches(
    noJsComments(load(path)),
    /export\s+(?:async\s+)?(?:function|class|const|let)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    EXPORTED.set(m[1], path);
  }
}

for (const path of JS) {
  const text = noJsComments(load(path));
  const dir = dirname(path);
  for (const m of matches(text, /from\s+['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]/g)) {
    const target = resolve(join(ROOT, dir), m[1] ?? m[2]);
    if (!existsSync(target)) fail('js/import', `${path} imports ${m[1] ?? m[2]} — no such file`);
  }

  /* The mirror of the check below: a name this module uses, that a sibling
     module exports, and that it neither imported nor declared itself. Node's
     --check parses but does not resolve, so an import deleted by hand or a
     helper called before it was wired up is a ReferenceError that only shows
     up when a reader clicks the thing. */
  const localNames = new Set(
    [...matches(text, /(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]),
  );
  /* `const { getAllTools } = await fb()` binds a name too, and that pattern is
     how the store reaches the lazily imported Firestore adapter. */
  for (const m of matches(text, /(?:const|let|var)\s*\{([^}]*)\}\s*=/g)) {
    for (const part of m[1].split(',')) localNames.add(part.split(':').pop().trim());
  }
  const importedNames = new Set(
    [...matches(text, /import\s*(?:\{([^}]*)\}|([A-Za-z_$][\w$]*))\s*from/g)].flatMap((m) =>
      (m[1] ?? m[2] ?? '').split(',').map((part) => part.split(/\sas\s/).pop().trim()),
    ),
  );
  /* The lookbehind keeps `thing.method()` out of it: a property call resolves
     against an object, not against this module's scope. */
  for (const m of matches(text, /(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
    const name = m[1];
    if (!EXPORTED.has(name) || EXPORTED.get(name) === path) continue;
    if (localNames.has(name) || importedNames.has(name)) continue;
    fail('js/unresolved', `${path}:${lineIndex(text)[m.index]} calls ${name}(), exported by ${EXPORTED.get(name)}, without importing it`);
  }

  /* An import nothing calls is the residue of a refactor. It costs a fetch of
     nothing and it tells the next reader that a dependency exists which does
     not, so it counts as unused code — the kind that is invisible precisely
     because the name still looks plausible at the top of the file. */
  const body = text.replace(/^\s*import\s[\s\S]*?from\s+['"][^'"]+['"];?/gm, '');
  for (const m of matches(text, /^\s*import\s*\{([^}]*)\}\s*from/gm)) {
    for (const part of m[1].split(',')) {
      const name = part.split(/\sas\s/).pop().trim();
      if (!name) continue;
      if (!new RegExp(`\\b${name}\\b`).test(body)) {
        fail('js/unused-import', `${path} imports ${name} but never uses it`);
      }
    }
  }
  ran();
}

for (const path of HTML) {
  const html = noHtmlComments(load(path));
  for (const m of matches(html, /<script[^>]*src="([^"]+)"/g)) {
    if (/^https?:/.test(m[1])) continue;
    if (!existsSync(join(ROOT, m[1]))) fail('html/dead-script', `${path}: script src="${m[1]}" not found`);
  }
  for (const m of matches(html, /<link[^>]*href="([^"]+)"/g)) {
    if (/^https?:/.test(m[1])) continue;
    if (!existsSync(join(ROOT, m[1]))) fail('html/dead-link', `${path}: link href="${m[1]}" not found`);
  }
  /* Every page must load exactly one page module. */
  const modules = matches(html, /<script type="module" src="(js\/pages\/[\w-]+\.js)"/g);
  if (modules.length !== 1) fail('html/structure', `${path}: expected 1 page module, found ${modules.length}`);
  ran();
}

/* A smooth scroll asked for in script ignores the stylesheet's reduced-motion
   rule, so util.js's reveal() reads the preference and every other module goes
   through it. */
for (const path of JS) {
  if (path === 'js/util.js') continue;
  const text = noJsComments(load(path));
  const ln = lineIndex(text);
  for (const m of matches(text, /behavior:\s*['"]smooth['"]/g)) {
    fail('a11y/motion', `${path}:${ln[m.index]} asks for a smooth scroll directly — use reveal() from util.js`);
  }
  ran();
}

/* ==========================================================================
   13. Emoji and stray symbols used as interface elements
   ========================================================================== */

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2049}\u{203C}]/u;
for (const path of ALL) {
  const text = load(path);
  const ln = lineIndex(text);
  for (const [i, ch] of [...text].entries()) {
    if (EMOJI_RE.test(ch)) fail('a11y/emoji', `${path}:${ln[i]} contains "${ch}" — icons come from js/icons.js`);
  }
  ran();
}

/* ==========================================================================
   14. Escaping: anything reaching innerHTML goes through esc()
   ========================================================================== */

/**
 * Producers that emit markup they have already escaped themselves, plus the
 * escapers. A hole filled by one of these is safe by construction.
 */
const SAFE_PRODUCERS = [
  'esc', 'escUrl', 'icon', 'stars', 'toolMark', 'verifiedMark', 'scoreBlock',
  'distList', 'emptyState', 'errorState', 'ledger', 'toolGrid', 'catGrid',
  'feedList', 'reviewList', 'reviewItem', 'feedItem', 'toolCard', 'catTile',
  'starInput', 'notice', 'meter', 'skeletonCards', 'skeletonLedger',
  'skeletonFeed', 'skeletonReviews', 'skeletonToolHead', 'skeletonLines',
  'bar', 'line', 'card', 'row', 'item', 'cell',
  'scoreCell', 'textCell', 'identityCell', 'pricingCell', 'categoryCell',
  'websiteCell', 'optionMarkup', 'chip', 'categoryBadge', 'pricingBadges',
  'formatExact', 'formatScore', 'formatDate', 'plural', 'avatar', 'ballDots',
  'richCatCard', 'richCatGrid', 'favoriteButton', 'breadcrumbsMarkup',
  'toolFeaturesList', 'toolProsCons', 'toolUseCases',
];

for (const path of JS) {
  const text = noJsComments(load(path));
  const ln = lineIndex(text);
  for (const m of matches(text, /\$\{/g)) {
    /* Only holes inside a template literal that has already opened a tag are
       markup. Reading the enclosing literal rather than the preceding 300
       characters is what keeps assignments like `el.x.href = ...` out. */
    const template = enclosingTemplate(text, m.index);
    if (!/<[a-z][^`]*$/i.test(template)) continue;

    let depth = 0;
    let end = m.index + 1;
    for (; end < text.length; end++) {
      if (text[end] === '{') depth += 1;
      else if (text[end] === '}' && --depth === 0) break;
    }
    const expr = text.slice(m.index + 2, end).trim();
    const callee = expr.match(/^([\w$]+)\s*\(/)?.[1];
    const safe =
      (callee && SAFE_PRODUCERS.includes(callee)) ||
      /^['"`]/.test(expr) ||                                    // literal
      /^\d/.test(expr) ||                                       // number
      /\.toFixed\(|\.length\b|^Number\(|^Math\.|\.repeat\(/.test(expr) ||
      /^(?:i|n|index|size|small|cls|tag|level|width|value|options|actions|layer|classes|kind|body|rank|sizeClass|mark)$/.test(expr) ||
      /(?:Href|href|Url|url)\b/.test(expr) ||                    // built and escaped by util
      /\?\s*['"`]/.test(expr) ||                                 // ternary over literals
      /\.map\([\w.]+\)\.join\(/.test(expr) ||                     // list of producers
      /^esc/.test(expr);
    if (!safe) {
      warn('security/escape', `${path}:${ln[m.index]} \${${expr.replace(/\s+/g, ' ').slice(0, 60)}} inside markup — confirm it is escaped`);
    }
  }
  ran();
}

/* ==========================================================================
   15. The Firestore contract
   The one thing in this project that a stylesheet cannot describe and a test
   cannot exercise: the names in the live database. Every other check here reads
   the code and asks whether it is consistent with itself. This one holds the
   field names the ORIGINAL site read and wrote, taken from
   _backup-pre-redesign/js/firebase.js, and asks whether the rewrite still
   speaks to the same documents.

   It matters because getting a name wrong is silent. A renamed field reads as
   undefined and renders as a dash; a renamed collection reads as empty and
   renders as "no tools yet". Nothing throws, so nothing here would notice —
   which is why the names are written out below rather than derived from the
   code they are meant to police.
   ========================================================================== */
{
  const path = 'js/firebase.js';
  const text = noJsComments(load(path));

  /* Strings blanked to their own quote character: same length, so offsets and
     line numbers survive, but no braces or colons inside a template literal
     can be mistaken for object structure. */
  const flat = text.replace(
    /`(?:\\[\s\S]|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/g,
    (m) => m[0].repeat(m.length),
  );

  const COLLECTIONS = ['reviews', 'tools'];

  /* Read by shapeTool / shapeReview. Every one of these must still be read: a
     field that stops being read is a field that stops being displayed. */
  const TOOL_READ = [
    'avgRating', 'category', 'company', 'createdAt', 'description', 'domain',
    'founded', 'iconUrl', 'name', 'pricing', 'ratingDistribution', 'totalRatings',
    'totalReviews', 'twitter', 'updatedAt', 'verified', 'website',
  ];
  const REVIEW_READ = [
    'body', 'createdAt', 'likes', 'rating', 'title', 'toolDomain', 'uid', 'userName',
    'userPhoto',
  ];

  /* Written by the two submit paths. */
  const TOOL_WRITE = [
    'avgRating', 'category', 'company', 'createdAt', 'description', 'domain',
    'founded', 'name', 'pricing', 'ratingDistribution', 'totalRatings',
    'totalReviews', 'updatedAt', 'verified', 'website',
  ];
  const REVIEW_WRITE = [
    'body', 'createdAt', 'likes', 'rating', 'title', 'toolDomain', 'uid', 'userName',
  ];
  /* Deliberately not required: the original always stored a generated avatar
     URL, this build stores one only if it is given one and draws a lettermark
     otherwise. Allowed, so writing it is not drift; not required, so not
     writing it is not drift either. */
  const REVIEW_WRITE_OPTIONAL = ['userPhoto'];

  /**
   * A top-level function body, brace-balanced.
   *
   * The parameter list has to be stepped over first: two of these functions
   * take a destructured object, so the first `{` after the signature opens the
   * pattern, not the body, and balancing from there returns the arguments.
   * Offsets are returned as well as text, because `flat` and `text` are the
   * same length — so a slice of one locates the same bytes in the other.
   */
  const bodyOf = (signature) => {
    const at = flat.indexOf(signature);
    if (at < 0) return null;

    let depth = 0;
    let i = flat.indexOf('(', at);
    for (; i < flat.length; i += 1) {
      if (flat[i] === '(') depth += 1;
      else if (flat[i] === ')') {
        depth -= 1;
        if (depth === 0) break;
      }
    }

    depth = 0;
    for (let j = flat.indexOf('{', i); j < flat.length; j += 1) {
      if (flat[j] === '{') depth += 1;
      else if (flat[j] === '}') {
        depth -= 1;
        if (depth === 0) return { body: flat.slice(i, j + 1), raw: text.slice(i, j + 1) };
      }
    }
    return null;
  };

  /** Keys at the top level of the object literal following `prefix`. */
  const objectKeys = (scope, prefix) => {
    const at = scope.indexOf(prefix);
    if (at < 0) return null;
    const keys = [];
    let depth = 0;
    for (let i = scope.indexOf('{', at); i < scope.length; i += 1) {
      const ch = scope[i];
      if (ch === '{' || ch === '[' || ch === '(') depth += 1;
      else if (ch === '}' || ch === ']' || ch === ')') {
        depth -= 1;
        if (depth === 0) break;
      } else if (depth === 1 && /[A-Za-z_$]/.test(ch)) {
        const rest = scope.slice(i);
        /* Position decides, not shape. `domain,` is a shorthand property and
           `false,` is a value, and the two are the same token followed by the
           same comma — what separates them is that a property can only begin
           just after the brace or just after a comma. */
        const before = scope.slice(0, i).trimEnd().slice(-1);
        const key = (before === '{' || before === ',')
          ? /^([A-Za-z_$][\w$]*)\s*[:,}]/.exec(rest)
          : null;
        if (key) {
          keys.push(key[1]);
          i += key[0].length - 1;
        } else {
          /* Step over the whole identifier, so a value is never read as a key */
          const token = /^[\w$.]+/.exec(rest);
          i += (token ? token[0].length : 1) - 1;
        }
      }
    }
    return keys;
  };

  const compare = (check, label, expected, actual, { extraFails = true } = {}) => {
    if (!actual) {
      fail(check, `${path}: could not find ${label} — the check cannot see the contract`);
      return;
    }
    const found = new Set(actual);
    for (const field of expected) {
      if (!found.has(field)) {
        fail(check, `${path}: ${label} no longer includes "${field}", which the original site used`);
      }
    }
    if (!extraFails) return;
    for (const field of found) {
      if (!expected.includes(field)) {
        fail(check, `${path}: ${label} adds "${field}", which is not in the pinned contract`);
      }
    }
  };

  /* --- Collections ------------------------------------------------------- */
  /* text, not flat: blanking is what makes the brace scanning above safe, and
     it is exactly wrong here, where the string contents are the subject. */
  const used = [...new Set(
    [...matches(text, /(?:collection|doc)\(\s*db\s*,\s*(['"])([^'"]+)\1/g)].map((m) => m[2]),
  )].sort();
  for (const name of used) {
    if (!COLLECTIONS.includes(name)) {
      fail('data/collection', `${path}: reads or writes collection "${name}", which the original site never had`);
    }
  }
  for (const name of COLLECTIONS) {
    if (!used.includes(name)) {
      fail('data/collection', `${path}: no longer touches the "${name}" collection`);
    }
  }
  ran();

  /* --- Read paths -------------------------------------------------------- */
  const readFields = (signature) => {
    const found = bodyOf(signature);
    if (!found) return null;
    return [...new Set([...matches(found.body, /\bdata\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]))];
  };

  compare('data/tool-fields', 'shapeTool', TOOL_READ, readFields('function shapeTool('));
  compare('data/review-fields', 'shapeReview', REVIEW_READ, readFields('function shapeReview('));
  ran();

  /* --- Write paths ------------------------------------------------------- */
  const toolWrite = bodyOf('export async function submitNewToolToFirestore(');
  compare('data/tool-write', 'the tool document written on submit', TOOL_WRITE,
    toolWrite && objectKeys(toolWrite.body, 'const record ='));

  /* The document id is the domain. Change that and every tool page that reads
     by id starts missing, falling back to the slower query — or not resolving
     at all for tools written under the new convention. */
  if (toolWrite && !/doc\(\s*db\s*,\s*(['"])tools\1\s*,\s*domain\s*\)/.test(toolWrite.raw)) {
    fail('data/tool-write', `${path}: the tool document id is no longer its domain`);
  }

  const reviewWrite = bodyOf('export async function submitReviewToFirestore(');
  const reviewKeys = reviewWrite && [
    ...(objectKeys(reviewWrite.body, 'const review =') ?? []),
    ...[...matches(reviewWrite.body, /\breview\.([A-Za-z_$][\w$]*)\s*=[^=]/g)].map((m) => m[1]),
  ];
  compare('data/review-write', 'the review document written on submit',
    REVIEW_WRITE, reviewKeys && reviewKeys.filter((k) => !REVIEW_WRITE_OPTIONAL.includes(k)));
  for (const key of reviewKeys ?? []) {
    if (!REVIEW_WRITE.includes(key) && !REVIEW_WRITE_OPTIONAL.includes(key)) {
      fail('data/review-write', `${path}: writes "${key}" to a review, which is not in the pinned contract`);
    }
  }
  ran();

  /* --- The distribution map's keys are strings in the database ----------- */
  /* { 1: 0 } and { "1": 0 } are the same document, so both spellings are fine;
     what is not fine is the map losing a rung. */
  const distScopes = [
    ['written', toolWrite?.body],
    ['read', bodyOf('function normaliseDist(')?.body],
  ];
  for (const [label, scope] of distScopes) {
    if (!scope) continue;
    for (let star = 1; star <= 5; star += 1) {
      if (!new RegExp(`["']?${star}["']?\\s*[:\\]]`).test(scope) && !/s\s*<=\s*5/.test(scope)) {
        fail('data/distribution', `${path}: the ${label} rating distribution has no ${star}-star rung`);
      }
    }
  }
  ran();
}

/* ==========================================================================
   Report
   ========================================================================== */

const group = (list) => {
  const byCheck = new Map();
  for (const [check, message] of list) {
    if (!byCheck.has(check)) byCheck.set(check, []);
    byCheck.get(check).push(message);
  }
  return [...byCheck.entries()].sort((a, b) => a[0].localeCompare(b[0]));
};

const show = (label, list) => {
  if (!list.length) return;
  process.stdout.write(`\n${label} (${list.length})\n`);
  for (const [check, items] of group(list)) {
    process.stdout.write(`\n  ${check}  ×${items.length}\n`);
    for (const item of items) process.stdout.write(`    ${item}\n`);
  }
};

process.stdout.write(`Rate AI verification — ${ALL.length} files, ${RULES.length} CSS rules, ${checked} checks\n`);
show('WARN', warns);
show('FAIL', fails);

if (fails.length) {
  process.stdout.write(`\n${fails.length} failure(s)\n`);
  process.exit(1);
}
process.stdout.write(`\nAll clear${warns.length ? ` (${warns.length} warning(s) to review)` : ''}\n`);
