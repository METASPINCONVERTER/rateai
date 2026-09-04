/**
 * Rate AI — Explore page
 *
 * Search, category filter, sort and two layouts, all driven from the query
 * string so any view can be linked to or reloaded.
 */

import { initShell, toast } from '../shell.js';
import {
  isMock,
  loadTools,
  invalidate,
  filterTools,
  sortTools,
  categoriesOf,
  SORTS,
} from '../store.js';
import {
  ledger,
  toolGrid,
  emptyState,
  errorState,
  skeletonLedger,
  skeletonCards,
  hydrateMarks,
} from '../components.js';
import {
  esc,
  formatExact,
  plural,
  submitHref,
  getParams,
  replaceParams,
  debounce,
} from '../util.js';

initShell({ isMock });

const el = {
  search: document.querySelector('[data-search-input]'),
  clear: document.querySelector('[data-search-clear]'),
  sort: document.querySelector('[data-sort]'),
  chips: document.querySelector('[data-chips]'),
  segments: [...document.querySelectorAll('[data-view]')],
  count: document.querySelector('[data-count]'),
  reset: document.querySelector('[data-reset]'),
  results: document.querySelector('[data-results]'),
};

const SORT_VALUES = SORTS.map((s) => s.value);
const VIEWS = ['ledger', 'cards'];

let allTools = [];

const params = getParams();
const state = {
  q: params.get('q') ?? '',
  category: params.get('category') ?? 'All',
  sort: SORT_VALUES.includes(params.get('sort')) ? params.get('sort') : 'rating',
  view: VIEWS.includes(params.get('view')) ? params.get('view') : 'ledger',
};

/* ==========================================================================
   Controls
   ========================================================================== */

function syncControls() {
  if (el.search.value !== state.q) el.search.value = state.q;
  el.clear.hidden = !state.q;
  el.sort.value = state.sort;

  el.segments.forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.view === state.view));
  });

  el.chips.querySelectorAll('.chip').forEach((chip) => {
    chip.setAttribute('aria-pressed', String(chip.dataset.category === state.category));
  });

  el.reset.hidden = !state.q && state.category === 'All';

  replaceParams({
    q: state.q,
    category: state.category === 'All' ? '' : state.category,
    sort: state.sort === 'rating' ? '' : state.sort,
    view: state.view === 'ledger' ? '' : state.view,
  });
}

function renderChips() {
  const categories = categoriesOf(allTools);
  const chip = (name, count) =>
    `<button class="chip" type="button" data-category="${esc(name)}" aria-pressed="false">` +
    `${esc(name)}<span class="chip-count">${esc(formatExact(count))}</span></button>`;

  el.chips.innerHTML =
    chip('All', allTools.length) + categories.map((c) => chip(c.name, c.count)).join('');
}

/** Keeps the selected chip visible in the horizontally scrolling row. */
function revealActiveChip() {
  const active = el.chips.querySelector('.chip[aria-pressed="true"]');
  if (active && active.dataset.category !== 'All') {
    active.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
}

/* ==========================================================================
   Results
   ========================================================================== */

function describe(shown, total) {
  if (shown === total) {
    return `${formatExact(total)} ${plural(total, 'tool', 'tools')}`;
  }
  return `${formatExact(shown)} of ${formatExact(total)} ${plural(total, 'tool', 'tools')}`;
}

function renderResults() {
  const filtered = filterTools(allTools, { category: state.category, query: state.q });
  const sorted = sortTools(filtered, state.sort);

  el.count.textContent = describe(sorted.length, allTools.length);

  if (!sorted.length) {
    const what = state.q
      ? `“${state.q}”`
      : state.category !== 'All'
        ? `the ${state.category} category`
        : 'this filter';
    el.results.innerHTML = emptyState({
      mark: 'search',
      title: 'No tools match',
      text: `Nothing in the catalogue matches ${what}. Try a shorter search, or add the tool yourself.`,
      actions:
        `<button class="btn btn-secondary btn-sm" type="button" data-reset-inline>Clear filters</button>` +
        `<a class="btn btn-primary btn-sm" href="${esc(submitHref({ name: state.q }))}">Add a tool</a>`,
    });
    return;
  }

  el.results.innerHTML =
    state.view === 'cards' ? toolGrid(sorted) : ledger(sorted, { head: true });
  hydrateMarks(el.results);
}

function update({ reveal = false } = {}) {
  syncControls();
  renderResults();
  if (reveal) revealActiveChip();
}

/* ==========================================================================
   Events
   ========================================================================== */

const runSearch = debounce(() => {
  state.q = el.search.value;
  update();
}, 160);

el.search.addEventListener('input', runSearch);

el.search.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && el.search.value) {
    event.preventDefault();
    el.search.value = '';
    state.q = '';
    update();
  }
});

el.clear.addEventListener('click', () => {
  el.search.value = '';
  state.q = '';
  update();
  el.search.focus();
});

el.sort.addEventListener('change', () => {
  state.sort = SORT_VALUES.includes(el.sort.value) ? el.sort.value : 'rating';
  update();
});

el.segments.forEach((btn) => {
  btn.addEventListener('click', () => {
    state.view = btn.dataset.view;
    update();
  });
});

el.chips.addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if (!chip) return;
  state.category = chip.dataset.category;
  update();
});

function resetFilters() {
  state.q = '';
  state.category = 'All';
  el.search.value = '';
  update({ reveal: true });
}

el.reset.addEventListener('click', resetFilters);

/* The empty state renders its own reset button, so that one is delegated. */
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-reset-inline]')) {
    event.preventDefault();
    resetFilters();
    el.search.focus();
    return;
  }
  if (event.target.closest('[data-retry]')) {
    event.preventDefault();
    load({ force: true });
  }
});

/* ==========================================================================
   Load
   ========================================================================== */

async function load({ force = false } = {}) {
  el.count.textContent = 'Loading…';
  el.results.innerHTML = state.view === 'cards' ? skeletonCards(6) : skeletonLedger(8);

  try {
    if (force) invalidate();
    allTools = await loadTools({ force });

    if (!allTools.length) {
      el.count.textContent = '0 tools';
      el.chips.innerHTML = '';
      el.reset.hidden = true;
      el.results.innerHTML = emptyState({
        mark: 'inbox',
        title: 'The catalogue is empty',
        text: 'No tools have been added yet. The first submission starts the list.',
        actions: `<a class="btn btn-primary btn-sm" href="submit.html">Add the first tool</a>`,
      });
      return;
    }

    renderChips();

    /* A category in the URL that no longer exists would show an empty list with
       no explanation, so fall back to All and say nothing about it. */
    const known = new Set(['All', ...categoriesOf(allTools).map((c) => c.name)]);
    if (!known.has(state.category)) state.category = 'All';

    update({ reveal: true });
  } catch (error) {
    el.count.textContent = 'Could not load the catalogue';
    el.chips.innerHTML = '';
    el.reset.hidden = true;
    el.results.innerHTML = errorState(error);
  }
}

window.addEventListener('online', () => {
  if (!allTools.length) {
    toast('Back online — reloading the catalogue.', 'info');
    load({ force: true });
  }
});

load();
