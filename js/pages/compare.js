/**
 * Rate AI — Compare
 *
 * Two pickers and one table. Every cell is a figure the catalogue already
 * stores; nothing is weighted or combined into an overall verdict. The accent
 * marks the larger of two numbers on the three numeric rows only — and never on
 * score unless both tools have actually been rated, because a tool with no
 * ratings has not lost anything.
 *
 * State lives in ?a=&b=, so any comparison can be linked or reloaded.
 */

import { initShell } from '../shell.js';
import { isMock, loadTools, invalidate } from '../store.js';
import {
  toolMark,
  verifiedMark,
  stars,
  emptyState,
  errorState,
  skeletonLines,
  categoryBadge,
  hydrateMarks,
} from '../components.js';
import { icon } from '../icons.js';
import {
  esc,
  escUrl,
  formatExact,
  formatScore,
  formatDate,
  plural,
  cleanDomain,
  toolHref,
  getParams,
  replaceParams,
} from '../util.js';
import { mountNavAuth } from '../auth.js';
import { applySEO } from '../seo.js';

initShell({ isMock });
mountNavAuth();

applySEO({
  title: 'Compare AI Tools Side-by-Side | Rate AI',
  description: 'Side by side comparison of artificial intelligence tools: scores, sample sizes, pricing, and category breakdowns.',
  canonicalPath: '/compare',
});

const el = {
  pick: {},
  slot: {},
};

function queryElements() {
  el.pick.a = document.querySelector('[data-pick="a"]');
  el.pick.b = document.querySelector('[data-pick="b"]');
  el.slot.a = document.querySelector('[data-slot="a"]');
  el.slot.b = document.querySelector('[data-slot="b"]');
  el.summary = document.querySelector('[data-summary]');
  el.swap = document.querySelector('[data-swap]');
  el.clear = document.querySelector('[data-clear]');
  el.out = document.querySelector('[data-cmp]');
}

const KEYS = ['a', 'b'];
const other = (key) => (key === 'a' ? 'b' : 'a');

let tools = [];
const state = {
  a: cleanDomain(getParams().get('a') ?? ''),
  b: cleanDomain(getParams().get('b') ?? ''),
};

const find = (domain) => tools.find((t) => t.domain === domain) ?? null;

/* ==========================================================================
   Pickers
   ========================================================================== */

/**
 * A flat list of sixty tools is hard to aim at, so the options are grouped by
 * category. The tool chosen on the other side is disabled rather than removed —
 * a list that changes length as you pick is disorienting.
 */
function optionMarkup(taken) {
  const byCategory = new Map();
  tools.forEach((tool) => {
    if (!byCategory.has(tool.category)) byCategory.set(tool.category, []);
    byCategory.get(tool.category).push(tool);
  });

  return [...byCategory.keys()]
    .sort((x, y) => x.localeCompare(y))
    .map((category) => {
      const options = byCategory
        .get(category)
        .slice()
        .sort((x, y) => x.name.localeCompare(y.name))
        .map(
          (tool) =>
            `<option value="${esc(tool.domain)}"` +
            `${tool.domain === taken ? ' disabled' : ''}>${esc(tool.name)}</option>`,
        )
        .join('');
      return `<optgroup label="${esc(category)}">${options}</optgroup>`;
    })
    .join('');
}

function renderPickers() {
  KEYS.forEach((key) => {
    const select = el.pick[key];
    select.innerHTML =
      `<option value="">Select a tool…</option>` + optionMarkup(state[other(key)]);
    select.value = state[key];
    select.disabled = false;
  });
}

function renderSlot(key) {
  const tool = find(state[key]);

  if (!tool) {
    el.slot[key].innerHTML = `<span class="t-meta t-muted">Nothing selected yet</span>`;
    return;
  }

  el.slot[key].innerHTML =
    toolMark(tool, 'sm') +
    `<span class="grow">` +
    `<a class="pick-name link" href="${esc(toolHref(tool.domain, tool.name))}">${esc(tool.name)}</a>` +
    `<span class="pick-domain">${esc(tool.domain)}</span>` +
    `</span>` +
    verifiedMark(tool);

  hydrateMarks(el.slot[key]);
}

/* ==========================================================================
   Table
   ========================================================================== */

/** @param {'a'|'b'|null} win */
function row(label, aValue, bValue, win = null) {
  const cell = (value, isWin) =>
    `<td${isWin ? ' class="cmp-win"' : ''}>${value}` +
    /* Colour alone must not carry the meaning. */
    `${isWin ? `<span class="sr-only"> — higher</span>` : ''}</td>`;

  return (
    `<tr><th scope="row">${esc(label)}</th>` +
    cell(aValue, win === 'a') +
    cell(bValue, win === 'b') +
    `</tr>`
  );
}

function bigger(x, y) {
  const nx = Number(x) || 0;
  const ny = Number(y) || 0;
  if (nx === ny) return null;
  return nx > ny ? 'a' : 'b';
}

function scoreCell(tool) {
  const score = formatScore(tool.avgRating);
  if (!score) return `<span class="t-muted">Not rated yet</span>`;
  return (
    `<span class="row"><span class="t-num t-semibold">${esc(score)}</span>` +
    stars(tool.avgRating, 'sm') +
    `</span>`
  );
}

function textCell(value) {
  return value ? esc(value) : `<span class="t-muted">—</span>`;
}

function identityCell(tool) {
  return (
    `<th scope="col"><span class="cmp-id">` +
    toolMark(tool, 'sm') +
    `<a class="link" href="${esc(toolHref(tool.domain, tool.name))}">${esc(tool.name)}</a>` +
    verifiedMark(tool) +
    `</span></th>`
  );
}

function pricingCell(tool) {
  const tiers = tool.pricing ?? [];
  if (!tiers.length) return `<span class="t-muted">—</span>`;
  return tiers.map((tier) => `<span class="badge badge-plain">${esc(tier)}</span>`).join(' ');
}

function categoryCell(tool) {
  return categoryBadge(tool);
}

function websiteCell(tool) {
  const href = escUrl(tool.website || `https://${tool.domain}`);
  if (!href) return textCell(tool.domain);
  /* link-inline, because base.css sets svg { display: block } and the arrow
     would otherwise drop onto a line of its own. */
  return (
    `<a class="link link-inline" href="${href}" target="_blank" rel="noopener noreferrer">` +
    `${esc(tool.domain)}${icon('externalLink', 'ic ic-sm')}</a>`
  );
}

function renderTable() {
  const a = find(state.a);
  const b = find(state.b);

  if (!a || !b) {
    const started = Boolean(state.a || state.b);
    el.out.innerHTML = emptyState({
      mark: 'compare',
      title: started ? 'One more to pick' : 'Pick two tools',
      text: started
        ? 'Choose a tool in the other list and the two will be lined up here.'
        : 'Choose a tool in each list above. Score, sample size, written reviews and pricing appear side by side.',
    });
    return;
  }

  /* A score gap only means something when both tools have been rated. */
  const comparable = a.totalRatings > 0 && b.totalRatings > 0;

  el.out.innerHTML =
    `<table class="cmp">` +
    `<caption class="sr-only">${esc(a.name)} compared with ${esc(b.name)}</caption>` +
    `<tr class="cmp-head">` +
    `<th scope="col"><span class="sr-only">Attribute</span></th>` +
    identityCell(a) +
    identityCell(b) +
    `</tr>` +
    row(
      'Score',
      scoreCell(a),
      scoreCell(b),
      comparable ? bigger(a.avgRating, b.avgRating) : null,
    ) +
    row(
      'Ratings',
      esc(formatExact(a.totalRatings)),
      esc(formatExact(b.totalRatings)),
      bigger(a.totalRatings, b.totalRatings),
    ) +
    row(
      'Written reviews',
      esc(formatExact(a.totalReviews)),
      esc(formatExact(b.totalReviews)),
      bigger(a.totalReviews, b.totalReviews),
    ) +
    row('Category', categoryCell(a), categoryCell(b)) +
    row('Pricing', pricingCell(a), pricingCell(b)) +
    row('Company', textCell(a.company), textCell(b.company)) +
    row(
      'Founded',
      textCell(a.founded ? String(a.founded) : ''),
      textCell(b.founded ? String(b.founded) : ''),
    ) +
    row('Listed', textCell(formatDate(a.createdAt)), textCell(formatDate(b.createdAt))) +
    row('Website', websiteCell(a), websiteCell(b)) +
    `</table>`;

  hydrateMarks(el.out);
}

/* ==========================================================================
   Summary line — the two or three sentences a reader would say out loud
   ========================================================================== */

function summarise(a, b) {
  const parts = [];
  const scoreA = formatScore(a.avgRating);
  const scoreB = formatScore(b.avgRating);

  if (scoreA && scoreB) {
    if (a.avgRating === b.avgRating) {
      parts.push(`Both score ${scoreA}.`);
    } else {
      const ahead = a.avgRating > b.avgRating ? a : b;
      const behind = ahead === a ? b : a;
      const aheadScore = ahead === a ? scoreA : scoreB;
      const behindScore = ahead === a ? scoreB : scoreA;
      parts.push(`${ahead.name} scores higher, ${aheadScore} against ${behindScore}.`);
    }
  } else if (scoreA || scoreB) {
    const rated = scoreA ? a : b;
    const unrated = scoreA ? b : a;
    parts.push(`${unrated.name} has no ratings yet, so only ${rated.name} has a score.`);
  } else {
    parts.push('Neither tool has been rated yet.');
  }

  const countA = Number(a.totalRatings) || 0;
  const countB = Number(b.totalRatings) || 0;
  const high = Math.max(countA, countB);
  const low = Math.min(countA, countB);

  if (high > 0 && countA !== countB) {
    const larger = countA > countB ? a : b;
    parts.push(
      `${larger.name} rests on the larger sample: ${formatExact(high)} ` +
        `${plural(high, 'rating', 'ratings')} against ${formatExact(low)}.`,
    );
  }

  return parts.join(' ');
}

function renderSummary() {
  const a = find(state.a);
  const b = find(state.b);

  if (a && b) el.summary.textContent = summarise(a, b);
  else if (a || b) el.summary.textContent = 'One tool chosen. Pick a second to compare.';
  else el.summary.textContent = '';
}

/* ==========================================================================
   State
   ========================================================================== */

function render() {
  renderPickers();
  KEYS.forEach(renderSlot);
  renderSummary();
  renderTable();

  const anything = Boolean(state.a || state.b);
  el.clear.hidden = !anything;
  el.swap.hidden = !(state.a && state.b);
}

function commit() {
  replaceParams({ a: state.a, b: state.b });
  render();
}

function select(key, domain) {
  const value = cleanDomain(domain);
  state[key] = find(value) ? value : '';
  /* Comparing a tool with itself tells nobody anything, so the other side gives way. */
  if (state[key] && state[other(key)] === state[key]) state[other(key)] = '';
  commit();
}

KEYS.forEach((key) => {
  el.pick[key].addEventListener('change', (event) => select(key, event.target.value));
});

el.swap.addEventListener('click', () => {
  [state.a, state.b] = [state.b, state.a];
  commit();
  el.swap.focus();
});

el.clear.addEventListener('click', () => {
  state.a = '';
  state.b = '';
  commit();
  el.pick.a.focus();
});

el.out.addEventListener('click', (event) => {
  if (event.target.closest('[data-retry]')) {
    event.preventDefault();
    load({ force: true });
  }
});

/* ==========================================================================
   Load
   ========================================================================== */

function showLoading() {
  el.summary.textContent = '';
  el.out.innerHTML = skeletonLines();
}

function showFailure(error) {
  KEYS.forEach((key) => {
    el.pick[key].innerHTML = `<option value="">Unavailable</option>`;
    el.pick[key].disabled = true;
    el.slot[key].innerHTML = '';
  });
  el.summary.textContent = '';
  el.swap.hidden = true;
  el.clear.hidden = true;
  el.out.innerHTML = errorState(error, { retryLabel: 'Reload catalogue' });
}

async function load({ force = false } = {}) {
  showLoading();

  try {
    if (force) invalidate();
    tools = await loadTools();

    if (!tools.length) {
      el.out.innerHTML = emptyState({
        mark: 'inbox',
        title: 'Nothing to compare yet',
        text: 'The catalogue is empty, so there are no two tools to line up.',
        actions: `<a class="btn btn-primary btn-sm" href="submit.html">Add the first tool</a>`,
      });
      return;
    }

    /* A domain in the address bar that is not in the catalogue is dropped
       quietly — the picker shows nothing selected, which is the honest state. */
    KEYS.forEach((key) => {
      if (state[key] && !find(state[key])) state[key] = '';
    });
    if (state.a && state.a === state.b) state.b = '';

    commit();
  } catch (error) {
    showFailure(error);
  }
}

export function initPage() {
  queryElements();
  if (el.out) {
    load();
  }
}

initPage();
