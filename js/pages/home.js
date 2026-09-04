/**
 * Rate AI — Overview page
 *
 * The dashboard: the leaderboard, recent activity, categories, and the tools
 * still waiting for a first verdict. One catalogue read serves all four.
 */

import { initShell, toast } from '../shell.js';
import {
  isMock,
  loadTools,
  loadRecentReviews,
  invalidate,
  leaderboard,
  categoriesOf,
  catalogueStats,
  awaitingRatings,
  filterTools,
  withTools,
} from '../store.js';
import {
  ledger,
  catGrid,
  feedList,
  toolGrid,
  emptyState,
  errorState,
  skeletonLedger,
  skeletonFeed,
  hydrateMarks,
} from '../components.js';
import {
  esc,
  formatExact,
  plural,
  exploreHref,
  toolHref,
  submitHref,
  debounce,
} from '../util.js';

initShell({ isMock });

const el = {
  stats: document.querySelector('[data-stats]'),
  leaderboard: document.querySelector('[data-leaderboard]'),
  leaderboardCount: document.querySelector('[data-leaderboard-count]'),
  activity: document.querySelector('[data-activity]'),
  categories: document.querySelector('[data-categories]'),
  awaiting: document.querySelector('[data-awaiting]'),
  awaitingSection: document.querySelector('[data-awaiting-section]'),
  search: document.querySelector('[data-search-input]'),
  suggest: document.querySelector('[data-suggest]'),
  suggestList: document.querySelector('[data-suggest-list]'),
  suggestEmpty: document.querySelector('[data-suggest-empty]'),
  suggestStatus: document.querySelector('[data-suggest-status]'),
};

const LEADERBOARD_SIZE = 10;

let allTools = [];

/* ==========================================================================
   Render
   ========================================================================== */

function renderStats(tools) {
  const stats = catalogueStats(tools);
  el.stats.innerHTML =
    `<span><b>${esc(formatExact(stats.tools))}</b> ` +
    `${esc(plural(stats.tools, 'tool', 'tools'))}</span>` +
    `<span><b>${esc(formatExact(stats.categories))}</b> ` +
    `${esc(plural(stats.categories, 'category', 'categories'))}</span>` +
    `<span><b>${esc(formatExact(stats.ratings))}</b> ` +
    `${esc(plural(stats.ratings, 'rating', 'ratings'))}</span>` +
    `<span><b>${esc(formatExact(stats.reviews))}</b> written ` +
    `${esc(plural(stats.reviews, 'review', 'reviews'))}</span>`;

  el.search.placeholder = `Search ${formatExact(stats.tools)} tools by name, category or domain`;
}

function renderLeaderboard(tools) {
  const top = leaderboard(tools, LEADERBOARD_SIZE);

  if (!top.length) {
    el.leaderboardCount.textContent = '';
    el.leaderboard.innerHTML = emptyState({
      mark: 'inbox',
      title: 'Nothing is ranked yet',
      text: 'The leaderboard fills in as soon as tools start collecting ratings.',
      actions:
        `<a class="btn btn-primary btn-sm" href="explore.html">Browse the catalogue</a>` +
        `<a class="btn btn-secondary btn-sm" href="submit.html">Add a tool</a>`,
    });
    return;
  }

  el.leaderboardCount.textContent = `top ${top.length}`;
  el.leaderboard.innerHTML = ledger(top);
  hydrateMarks(el.leaderboard);
}

function renderCategories(tools) {
  const categories = categoriesOf(tools);
  if (!categories.length) {
    el.categories.innerHTML = emptyState({
      mark: 'grid',
      title: 'No categories yet',
      text: 'Categories appear as tools are added.',
      small: true,
    });
    return;
  }
  el.categories.innerHTML = catGrid(categories);
}

function renderAwaiting(tools) {
  const waiting = awaitingRatings(tools, 3);
  if (!waiting.length) {
    el.awaitingSection.hidden = true;
    return;
  }
  el.awaitingSection.hidden = false;
  el.awaiting.innerHTML = toolGrid(waiting);
  hydrateMarks(el.awaiting);
}

async function renderActivity(tools) {
  try {
    const reviews = await loadRecentReviews(5);
    const entries = withTools(reviews, tools);

    if (!entries.length) {
      el.activity.innerHTML = emptyState({
        mark: 'message',
        title: 'No reviews yet',
        text: 'The first written review will show up here.',
        actions: `<a class="btn btn-primary btn-sm" href="explore.html">Find a tool to rate</a>`,
        small: true,
      });
      return;
    }

    el.activity.innerHTML = feedList(entries);
  } catch (error) {
    /* The rest of the page is fine — degrade this panel only. */
    el.activity.innerHTML = errorState(error, { retryLabel: 'Reload activity' });
  }
}

/* ==========================================================================
   Search suggestions
   ========================================================================== */

let suggestions = [];
let activeIndex = -1;

function closeSuggest() {
  el.suggest.hidden = true;
  el.suggestList.innerHTML = '';
  el.suggestEmpty.hidden = true;
  el.suggestStatus.textContent = '';
  el.search.setAttribute('aria-expanded', 'false');
  el.search.removeAttribute('aria-activedescendant');
  suggestions = [];
  activeIndex = -1;
}

function renderSuggest(query) {
  const q = query.trim();
  if (!q) {
    closeSuggest();
    return;
  }

  suggestions = filterTools(allTools, { query: q }).slice(0, 6);
  activeIndex = -1;
  el.search.setAttribute('aria-expanded', 'true');
  el.suggest.hidden = false;
  el.search.removeAttribute('aria-activedescendant');

  if (!suggestions.length) {
    el.suggestList.innerHTML = '';
    el.suggestEmpty.innerHTML =
      `No tool matches “${esc(q)}”. ` +
      `<a class="link" href="${esc(submitHref({ name: q }))}">Add it</a>.`;
    el.suggestEmpty.hidden = false;
    el.suggestStatus.textContent = `No tools match ${q}.`;
    return;
  }

  el.suggestEmpty.hidden = true;
  /* Replaced on every keystroke, so a polite region only ever reads the count
     the reader stopped typing on. */
  el.suggestStatus.textContent =
    `${suggestions.length} ${plural(suggestions.length, 'tool', 'tools')} match. ` +
    `Use the arrow keys to review them.`;

  el.suggestList.innerHTML = suggestions
    .map((tool, i) => {
      const score = tool.totalRatings
        ? `<span class="suggest-score">${tool.avgRating.toFixed(1)}</span>`
        : `<span class="suggest-score t-muted">—</span>`;
      return (
        `<a class="suggest-item" id="suggest-${i}" role="option" aria-selected="false" ` +
        `href="${esc(toolHref(tool.domain, tool.name))}">` +
        `<span class="grow"><span class="suggest-name truncate">${esc(tool.name)}</span>` +
        `<span class="suggest-cat">${esc(tool.category)} · ${esc(tool.domain)}</span></span>` +
        score +
        `</a>`
      );
    })
    .join('');
}

function moveActive(delta) {
  const items = [...el.suggestList.querySelectorAll('.suggest-item')];
  if (!items.length) return;

  items[activeIndex]?.classList.remove('is-active');
  items[activeIndex]?.setAttribute('aria-selected', 'false');

  activeIndex = (activeIndex + delta + items.length) % items.length;

  const next = items[activeIndex];
  next.classList.add('is-active');
  next.setAttribute('aria-selected', 'true');
  next.scrollIntoView({ block: 'nearest' });
  el.search.setAttribute('aria-activedescendant', next.id);
}

function initSearch() {
  el.search.addEventListener(
    'input',
    debounce(() => renderSuggest(el.search.value), 120),
  );

  el.search.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Escape') {
      if (!el.suggest.hidden) {
        event.preventDefault();
        closeSuggest();
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const items = [...el.suggestList.querySelectorAll('.suggest-item')];
      if (activeIndex >= 0 && items[activeIndex]) {
        window.location.href = items[activeIndex].getAttribute('href');
      } else if (el.search.value.trim()) {
        /* No highlighted result: take the whole query to the full listing. */
        window.location.href = exploreHref({ q: el.search.value.trim() });
      }
    }
  });

  /* Clicking away closes, but a click on a result must be allowed to land. */
  document.addEventListener('click', (event) => {
    if (!el.suggest.contains(event.target) && event.target !== el.search) {
      closeSuggest();
    }
  });
}

/* ==========================================================================
   Load
   ========================================================================== */

function showLoading() {
  el.leaderboard.innerHTML = skeletonLedger(6);
  el.activity.innerHTML = skeletonFeed(4);
}

function showFailure(error) {
  el.stats.innerHTML = `<span class="t-muted">Catalogue unavailable</span>`;
  el.leaderboardCount.textContent = '';
  el.leaderboard.innerHTML = errorState(error);
  el.activity.innerHTML = '';
  el.categories.innerHTML = '';
  el.awaitingSection.hidden = true;
}

async function load({ force = false } = {}) {
  showLoading();
  try {
    if (force) invalidate();
    allTools = await loadTools({ force });

    if (!allTools.length) {
      el.stats.innerHTML = `<span class="t-muted">The catalogue is empty</span>`;
      el.leaderboard.innerHTML = emptyState({
        mark: 'inbox',
        title: 'No tools listed yet',
        text: 'Rate AI is connected to its database, but there are no tools in it. Add the first one and the leaderboard starts here.',
        actions: `<a class="btn btn-primary btn-sm" href="submit.html">Add the first tool</a>`,
      });
      el.activity.innerHTML = '';
      el.categories.innerHTML = '';
      el.awaitingSection.hidden = true;
      return;
    }

    renderStats(allTools);
    renderLeaderboard(allTools);
    renderCategories(allTools);
    renderAwaiting(allTools);
    await renderActivity(allTools);
  } catch (error) {
    showFailure(error);
  }
}

/* Retry buttons are rendered inside states, so the handler is delegated. */
document.addEventListener('click', (event) => {
  const retry = event.target.closest('[data-retry]');
  if (!retry) return;
  event.preventDefault();
  load({ force: true });
});

window.addEventListener('online', () => {
  if (!allTools.length) {
    toast('Back online — reloading the catalogue.', 'info');
    load({ force: true });
  }
});

initSearch();
load();
