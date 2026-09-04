/**
 * Rate AI — Explore Page
 *
 * Search, category filter, sort and two layouts, all driven from the query
 * string so any view can be linked to or reloaded.
 */

import { initShell } from '../shell.js';
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
  hydrateFavButtons,
} from '../components.js';
import {
  esc,
  formatExact,
  plural,
  getParams,
  replaceParams,
  debounce,
} from '../util.js';
import { mountNavAuth, requireAuth } from '../auth.js';
import { applySEO, siteSchema } from '../seo.js';

initShell({ isMock });
mountNavAuth();

applySEO({
  title: 'Explore AI Tools — Directory, Ratings & Filters | Rate AI',
  description: 'Search, filter and sort every AI tool on Rate AI by rating, number of ratings, category, or date added. Complete directory with verified user scores.',
  canonicalPath: '/explore',
  jsonLd: siteSchema(),
});

const el = {};

const SORT_VALUES = SORTS.map((s) => s.value);

function queryElements() {
  el.search = document.querySelector('[data-filter-search]');
  el.sort = document.querySelector('[data-sort]');
  el.categories = document.querySelector('[data-categories]');
  el.viewSwitch = document.querySelector('[data-view-switch]');
  el.count = document.querySelector('[data-count]');
  el.results = document.querySelector('[data-results]');
}

const state = {
  q: '',
  category: 'All',
  sort: 'rating',
  view: 'grid',
};

let allTools = [];

function readUrl() {
  const params = getParams();
  state.q = (params.get('q') || '').trim();
  state.category = params.get('category') || 'All';
  const s = params.get('sort');
  state.sort = SORT_VALUES.includes(s) ? s : 'rating';
  const v = params.get('view');
  state.view = v === 'ledger' ? 'ledger' : 'grid';
}

function writeUrl() {
  replaceParams({
    q: state.q || null,
    category: state.category !== 'All' ? state.category : null,
    sort: state.sort !== 'rating' ? state.sort : null,
    view: state.view !== 'grid' ? state.view : null,
  });
}

function syncControls() {
  if (el.search && el.search.value !== state.q) el.search.value = state.q;
  if (el.sort && el.sort.value !== state.sort) el.sort.value = state.sort;

  if (el.categories) {
    el.categories.querySelectorAll('[data-cat]').forEach((chip) => {
      const active = chip.getAttribute('data-cat') === state.category;
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  if (el.viewSwitch) {
    el.viewSwitch.querySelectorAll('[data-view]').forEach((seg) => {
      const active = seg.getAttribute('data-view') === state.view;
      seg.classList.toggle('is-active', active);
      seg.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }
}

function renderCategoriesBar(tools) {
  const cats = categoriesOf(tools);
  const chips = [
    `<button class="chip" type="button" aria-pressed="${state.category === 'All' ? 'true' : 'false'}" data-cat="All">All <span class="chip-count">${tools.length}</span></button>`,
    ...cats.map(
      (c) =>
        `<button class="chip" type="button" aria-pressed="${state.category === c.name ? 'true' : 'false'}" data-cat="${esc(c.name)}">${esc(c.name)} <span class="chip-count">${formatExact(c.count)}</span></button>`,
    ),
  ].join('');

  el.categories.innerHTML = chips;
}

function renderResults() {
  const filtered = filterTools(allTools, { category: state.category, query: state.q });
  const sorted = sortTools(filtered, state.sort);

  el.count.textContent = `${formatExact(sorted.length)} ${plural(sorted.length, 'tool', 'tools')} shown`;

  if (!sorted.length) {
    el.results.innerHTML = emptyState({
      title: 'No tools match your criteria',
      message: 'Try adjusting your search terms, changing the category filter, or resetting.',
      actions: `<button class="btn btn-secondary btn-sm" type="button" data-reset-filters>Reset filters</button>`,
    });
    const reset = el.results.querySelector('[data-reset-filters]');
    if (reset) {
      reset.addEventListener('click', () => {
        state.q = '';
        state.category = 'All';
        state.sort = 'rating';
        writeUrl();
        syncControls();
        renderResults();
      });
    }
    return;
  }

  el.results.innerHTML =
    state.view === 'ledger' ? ledger(sorted, { head: true }) : toolGrid(sorted);
  hydrateMarks(el.results);
  hydrateFavButtons(el.results, { requireAuth });
}

function initEvents() {
  if (el.search) {
    el.search.addEventListener(
      'input',
      debounce((e) => {
        state.q = e.target.value.trim();
        writeUrl();
        renderResults();
      }, 150),
    );
  }

  if (el.sort) {
    el.sort.addEventListener('change', (e) => {
      state.sort = e.target.value;
      writeUrl();
      renderResults();
    });
  }

  if (el.categories) {
    el.categories.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      state.category = btn.getAttribute('data-cat') || 'All';
      writeUrl();
      syncControls();
      renderResults();
    });
  }

  if (el.viewSwitch) {
    el.viewSwitch.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-view]');
      if (!btn) return;
      state.view = btn.getAttribute('data-view') || 'grid';
      writeUrl();
      syncControls();
      renderResults();
    });
  }
}

async function boot({ force = false } = {}) {
  readUrl();
  syncControls();
  el.results.innerHTML = state.view === 'ledger' ? skeletonLedger(8) : skeletonCards(6);

  try {
    if (force) invalidate();
    allTools = await loadTools({ force });

    if (!allTools.length) {
      el.results.innerHTML = emptyState({
        title: 'The catalogue is empty',
        message: 'Rate AI is connected to its database, but there are no tools in it.',
      });
      return;
    }

    renderCategoriesBar(allTools);
    renderResults();
    initEvents();
  } catch (error) {
    el.results.innerHTML = errorState({
      title: 'Could not load tools',
      message: error.message || 'There was a problem loading tool data.',
      onRetry: () => boot({ force: true }),
    });
  }
}

export function initPage() {
  queryElements();
  if (el.results) {
    boot();
  }
}

initPage();
