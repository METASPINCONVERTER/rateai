#!/usr/bin/env node
/**
 * PC Remote — verification harness
 *
 * Checks syntax, design tokens, raw colours, spacing grid, touch targets,
 * contrast ratios, icons, HTML integrity, and landmarks.
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
  if (!existsSync(join(ROOT, dir))) return out;
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
  'js/pages/privacy.js': 'privacy.html',
  'js/pages/terms.js': 'terms.html',
  'js/pages/notfound.js': '404.html',
};

/* Comments blanking */
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

function enclosingTemplate(text, index) {
  let start = -1;
  for (let i = 0; i < index; i++) {
    if (text[i] === '`' && text[i - 1] !== '\\') start = start === -1 ? i : -1;
  }
  return start === -1 ? '' : text.slice(start, index);
}

/* ==========================================================================
   CSS parsing
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
   1. Syntax
   ========================================================================== */

for (const path of [...JS, 'server.mjs', 'tools/verify.mjs']) {
  const out = spawnSync(process.execPath, ['--check', join(ROOT, path)], { encoding: 'utf8' });
  if (out.status !== 0) fail('js/syntax', `${path}: ${(out.stderr || '').trim().split('\n')[0]}`);
  ran();
}

for (const path of HTML) {
  const html = noHtmlComments(load(path));
  for (const tag of ['div', 'section', 'main', 'header', 'footer', 'nav', 'form', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'label', 'fieldset', 'aside', 'p', 'span', 'a', 'button', 'dl', 'dt', 'dd', 'details', 'summary', 'article']) {
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
    if (!dark) themes.dark.set(decl.prop, themes.dark.get(decl.prop) ?? decl.value);
  }
}

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

const usedTokens = new Map();
for (const path of ALL) {
  const text = path.endsWith('.css') ? noCssComments(load(path)) : load(path);
  for (const m of matches(text, /var\(\s*(--[\w-]+)/g)) {
    if (!usedTokens.has(m[1])) usedTokens.set(m[1], new Set());
    usedTokens.get(m[1]).add(path);
  }
}

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
   3. Raw colours
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
    if (/(?:href|src|url\(|xlink:href)\s*=?\s*["']?[^"'\s]*$/.test(before)) continue;
    if (/name="theme-color"[^>]*$/.test(before)) continue;
    fail('colour/raw', `${path}:${ln[m.index]} raw colour ${m[0]} — use a token`);
  }
  ran();
}

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
   4. Spacing scale & Touch targets
   ========================================================================== */

const SPACE_PROP =
  /^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left|scroll-margin|scroll-padding|text-indent)(-|$)/;
const HAIRLINE_PROP =
  /^(border|outline|box-shadow|text-shadow|letter-spacing|word-spacing)(-|$)/;

const SPACE_RUNGS = new Set([0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80]);

const MARK_PX = new Map([
  [5, 'the chevron drawn inside a select, as two 45° gradient corners'],
  [6, 'meter track height, and the concentric inner radius of a segment'],
  [10, 'scrollbar width'],
  [14, 'small icon'],
  [18, 'icon inside a badge'],
  [22, 'favicon inside a mark'],
  [26, 'the brand mark, at its viewBox size'],
  [28, 'brand mark size'],
  [52, 'icon container size'],
]);

const SAFE_MIN_WIDTH = 288;

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
        if (SPACE_RUNGS.has(px) || px < 4) continue;
        warn('space/off-rung', `${where} ${what} is not on the spacing scale`);
      } else if (HAIRLINE_PROP.test(decl.prop)) {
        if (px <= 3 || px === 999 || SPACE_RUNGS.has(px) || MARK_PX.has(px)) continue;
        warn('space/hairline', `${where} ${what} is thicker than a hairline`);
      } else {
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

const TOUCH_MIN = 44;

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

const DESKTOP_ONLY = [
  ['nav-link', 'nav-links', 'the desktop nav row'],
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

const INLINE_OK = new Map([
  ['link', 'prose links, inside a sentence'],
  ['link-quiet', 'metadata beside heading'],
  ['skip-link', 'reachable only by keyboard'],
  ['sr-only', 'never painted'],
  ['brand', 'brand link'],
  ['back-link', 'back link'],
  ['nav-mobile-link', 'mobile navigation link'],
]);

for (const path of HTML) {
  const html = noHtmlComments(load(path));
  const ln = lineIndex(html);
  for (const m of matches(html, CONTROL_TAG)) {
    const classes = m[1].split(/\s+/).filter((c) => c && !c.includes('$') && !c.includes('{'));
    if (!classes.length) continue;
    if (classes.some((c) => hiddenOnPhone.has(c) || exempt.has(c) || INLINE_OK.has(c))) continue;

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
  ['--star-on', '--surface'],
  ['--star-on', '--bg'],
];

const NON_TEXT_PAIRS = [
  ['--focus-ring', '--bg', 3],
  ['--focus-ring', '--surface', 3],
  ['--accent', '--surface', 3],
  ['--border-control', '--surface', 3],
  ['--border-control', '--bg', 3],
  ['--border-control', '--surface-subtle', 3],
];

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

const cssClasses = new Set();
for (const rule of RULES) {
  for (const m of matches(rule.selector, /\.(-?[A-Za-z_][\w-]*)/g)) cssClasses.add(m[1]);
}

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

  for (const m of matches(text, /class\s*=\s*\\?["']([^"'`]*)["']/g)) {
    m[1].split(/\s+/).forEach((c) => { if (CLASS_NAME.test(c)) mentioned.add(c); });
  }
  for (const m of matches(text, /['"`]([\w \t-]*)['"`]/g)) {
    const parts = m[1].trim().split(/\s+/).filter(Boolean);
    if (parts.length && parts.every((p) => CLASS_NAME.test(p))) parts.forEach((p) => mentioned.add(p));
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

const iconsRequested = new Map();
const iconsMentioned = new Set();

for (const path of [...HTML, ...JS]) {
  if (path === 'js/icons.js') continue;
  const text = path.endsWith('.html') ? noHtmlComments(load(path)) : noJsComments(load(path));
  for (const m of [
    ...matches(text, /\bicon\(\s*['"](\w+)['"]\s*[,)]/g),
    ...matches(text, /data-icon\s*=\s*"(\w+)"/g),
  ]) {
    if (!iconsRequested.has(m[1])) iconsRequested.set(m[1], new Set());
    iconsRequested.get(m[1]).add(path);
    iconsMentioned.add(m[1]);
  }
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
   8. Data slots
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

for (const path of HTML) {
  const html = noHtmlComments(load(path));
  for (const attr of uniq(matches(html, /\s(data-[\w-]+)/g).map((m) => m[1]))) {
    if (attr === 'data-icon' || attr === 'data-icon-size' || attr === 'data-theme' || attr === 'data-year' || attr === 'data-download-btn' || attr === 'data-download-link' || attr === 'data-mobile-toggle' || attr === 'data-mobile-menu' || attr === 'data-theme-toggle' || attr === 'data-showcase-tab' || attr === 'data-showcase-panel') continue;
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

  for (const attr of ['for', 'aria-describedby', 'aria-labelledby', 'aria-controls', 'aria-owns']) {
    for (const m of matches(html, new RegExp(`\\s${attr}\\s*=\\s*"([^"]+)"`, 'g'))) {
      for (const ref of m[1].trim().split(/\s+/)) {
        if (idSet.has(ref)) continue;
        fail('html/idref', `${path}:${ln[m.index]} ${attr}="${ref}" points at no such id`);
      }
    }
  }

  for (const m of matches(html, /\shref\s*=\s*"([^"]+)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(href)) continue;
    const file = href.split(/[?#]/)[0];
    if (!file) continue;
    if (!existsSync(join(ROOT, file))) fail('html/dead-link', `${path}:${ln[m.index]} href="${href}" — no such file`);
  }

  const one = (re, label) => {
    const n = matches(html, re).length;
    if (n !== 1) fail('html/structure', `${path}: expected exactly one ${label}, found ${n}`);
  };
  one(/<main[\s>]/g, '<main>');
  one(/<h1[\s>]/g, '<h1>');
  one(/<title>/g, '<title>');
  one(/<header class="nav">/g, 'site header');
  one(/<footer class="footer">/g, 'site footer');
  one(/class="skip-link"/g, 'skip link');
  one(/<meta name="viewport"/g, 'viewport meta');
  one(/<meta name="description"/g, 'description meta');
  one(/<html lang="en">/g, 'lang attribute');

  if (!html.includes('id="main"')) fail('html/structure', `${path}: skip link target #main is missing`);

  let previous = 0;
  for (const m of matches(html, /<h([1-6])[\s>]/g)) {
    const level = Number(m[1]);
    if (previous && level > previous + 1) {
      fail('a11y/heading-order', `${path}:${ln[m.index]} h${level} follows h${previous}`);
    }
    previous = level;
  }

  for (const m of matches(html, /\sstyle\s*=\s*"/g)) {
    fail('css/inline-style', `${path}:${ln[m.index]} inline style attribute`);
  }

  for (const m of matches(html, /<a\b[^>]*target\s*=\s*"_blank"[^>]*>/g)) {
    if (!/rel\s*=\s*"[^"]*noopener/.test(m[0])) {
      fail('html/target-blank', `${path}:${ln[m.index]} target="_blank" without rel="noopener"`);
    }
  }

  for (const m of matches(html, /<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const text = m[2].replace(/<[^>]*>/g, '').trim();
    const named = /aria-label\s*=|aria-labelledby\s*=/.test(m[1]);
    const slot = /data-[\w-]+/.test(m[1]);
    if (!text && !named && !slot) fail('a11y/button-name', `${path}:${ln[m.index]} <button> has no accessible name`);
  }

  const current = matches(html, /aria-current="page"/g).length;
  const zeroCurrentPages = ['404.html', 'privacy.html', 'terms.html'];
  const expected = zeroCurrentPages.includes(path) ? 0 : 1;
  if (current !== expected) {
    fail('a11y/current', `${path}: ${current} aria-current="page" (expected ${expected})`);
  }
  ran();
}

/* ==========================================================================
   10. Shell drift
   ========================================================================== */

const SHELL_BLOCKS = [
  ['head/styles', /<link rel="stylesheet" href="css[\s\S]*?<script>\(function/],
  ['nav', /<header class="nav">[\s\S]*?<\/header>/],
  ['footer', /<footer class="footer">[\s\S]*?<\/footer>/],
];

for (const [label, re] of SHELL_BLOCKS) {
  const seen = new Map();
  for (const path of HTML) {
    const block = noHtmlComments(load(path)).match(re)?.[0];
    if (!block) {
      fail('shell/missing', `${path}: no ${label} block`);
      continue;
    }
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

/* ==========================================================================
   12. Module graph
   ========================================================================== */

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
  ran();
}

/* ==========================================================================
   13. Emoji check
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

process.stdout.write(`PC Remote verification — ${ALL.length} files, ${RULES.length} CSS rules, ${checked} checks\n`);
show('WARN', warns);
show('FAIL', fails);

if (fails.length) {
  process.stdout.write(`\n${fails.length} failure(s)\n`);
  process.exit(1);
}
process.stdout.write(`\nAll clear${warns.length ? ` (${warns.length} warning(s) to review)` : ''}\n`);
