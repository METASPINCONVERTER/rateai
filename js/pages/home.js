/**
 * Rate AI — Overview & Discovery Homepage
 *
 * Polished discovery homepage with hero search, live catalogue statistics,
 * Bayesian leaderboard, recent verified reviews feed, visual categories,
 * and awaiting-verdict shelf.
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
  emptyState,
  errorState,
  skeletonLedger,
  skeletonFeed,
  hydrateMarks,
  hydrateFavButtons,
} from '../components.js';
import {
  esc,
  formatExact,
  formatScore,
  plural,
  toolHref,
  searchHref,
  debounce,
} from '../util.js';
import { mountNavAuth, requireAuth } from '../auth.js';
import { applySEO, siteSchema } from '../seo.js';

initShell({ isMock });
mountNavAuth();

applySEO({
  title: 'Rate AI — Community ratings for AI tools',
  description: 'Ratings for AI tools, written by the people using them. Every score is an average of individual verdicts with transparent Bayesian weighting.',
  canonicalPath: '/',
  jsonLd: siteSchema(),
});

const el = {};

const LEADERBOARD_SIZE = 10;
let allTools = [];

function queryElements() {
  el.stats = document.querySelector('[data-stats]');
  el.leaderboard = document.querySelector('[data-leaderboard]');
  el.leaderboardCount = document.querySelector('[data-leaderboard-count]');
  el.activity = document.querySelector('[data-activity]');
  el.categories = document.querySelector('[data-categories]');
  el.awaiting = document.querySelector('[data-awaiting]');
  el.awaitingSection = document.querySelector('[data-awaiting-section]');
  el.search = document.querySelector('[data-search-input]');
  el.searchClear = document.querySelector('[data-search-clear]');
  el.suggest = document.querySelector('[data-suggest]');
  el.suggestList = document.querySelector('[data-suggest-list]');
  el.suggestEmpty = document.querySelector('[data-suggest-empty]');
  el.suggestStatus = document.querySelector('[data-suggest-status]');
}

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
        `<a class="btn btn-secondary btn-sm" href="categories.html">Explore categories</a>`,
    });
    return;
  }

  el.leaderboardCount.textContent = `top ${top.length}`;
  el.leaderboard.innerHTML = ledger(top);
  hydrateMarks(el.leaderboard);
  hydrateFavButtons(el.leaderboard, { requireAuth });
}

function renderCategories(tools) {
  const cats = categoriesOf(tools);
  if (!cats.length) {
    el.categories.innerHTML = `<p class="t-small t-muted">No categories listed yet.</p>`;
    return;
  }
  el.categories.innerHTML = catGrid(cats.slice(0, 8));
}

function renderAwaiting(tools) {
  const unrated = awaitingRatings(tools, 4);
  if (!unrated.length) {
    el.awaitingSection.hidden = true;
    el.awaiting.innerHTML = '';
    return;
  }
  el.awaitingSection.hidden = false;
  el.awaiting.innerHTML = ledger(unrated, { startAt: 1, head: false });
  hydrateMarks(el.awaiting);
  hydrateFavButtons(el.awaiting, { requireAuth });
}

async function renderActivity(tools) {
  el.activity.innerHTML = skeletonFeed(3);

  try {
    const reviews = await loadRecentReviews(5);
    const enriched = withTools(reviews, tools);

    if (!enriched.length) {
      el.activity.innerHTML = emptyState({
        mark: 'inbox',
        title: 'No reviews yet',
        text: 'The activity feed updates as people write reviews across the site.',
      });
      return;
    }

    el.activity.innerHTML = feedList(enriched);
  } catch (err) {
    el.activity.innerHTML = errorState({
      title: 'Could not load recent reviews',
      message: 'Failed to retrieve recent community feedback.',
      onRetry: () => renderActivity(tools),
    });
  }
}

/* ==========================================================================
   Home page search suggestions
   ========================================================================== */

let activeIndex = -1;
let suggestions = [];

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
      `<a class="link" href="${esc(searchHref(q))}">Search all tools</a>.`;
    el.suggestEmpty.hidden = false;
    el.suggestStatus.textContent = `No tools match ${q}.`;
    return;
  }

  el.suggestEmpty.hidden = true;
  el.suggestStatus.textContent =
    `${suggestions.length} ${plural(suggestions.length, 'tool', 'tools')} match. ` +
    `Use the arrow keys to review them.`;

  el.suggestList.innerHTML = suggestions
    .map((tool, i) => {
      const href = toolHref(tool.domain, tool.name);
      return (
        `<a class="suggest-item" id="suggest-${i}" role="option" ` +
        `aria-selected="false" href="${esc(href)}" data-href="${esc(href)}">` +
        `<span class="grow"><span class="suggest-name truncate">${esc(tool.name)}</span>` +
        `<span class="suggest-cat">${esc(tool.category || '')}</span></span>` +
        `<span class="suggest-score">${formatScore(tool.avgRating)}</span>` +
        `</a>`
      );
    })
    .join('');
}

function closeSuggest() {
  el.suggest.hidden = true;
  el.search.setAttribute('aria-expanded', 'false');
  el.search.removeAttribute('aria-activedescendant');
  activeIndex = -1;
}

function moveActive(delta) {
  const items = el.suggestList.querySelectorAll('.suggest-item');
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
  const handleInput = debounce((val) => renderSuggest(val), 120);

  el.search.addEventListener('input', () => {
    if (el.searchClear) el.searchClear.hidden = !el.search.value;
    handleInput(el.search.value);
  });

  if (el.searchClear) {
    el.searchClear.addEventListener('click', () => {
      el.search.value = '';
      el.searchClear.hidden = true;
      el.search.focus();
      closeSuggest();
    });
  }

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
      const active = el.suggestList.querySelector('.suggest-item.is-active');
      if (active) {
        event.preventDefault();
        window.location.href = active.getAttribute('data-href');
      } else if (el.search.value.trim()) {
        event.preventDefault();
        window.location.href = searchHref(el.search.value.trim());
      }
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.hero-search') && !event.target.closest('.suggest')) {
      closeSuggest();
    }
  });
}

/* ==========================================================================
   Boot
   ========================================================================== */

function showSkeletons() {
  el.leaderboard.innerHTML = skeletonLedger(LEADERBOARD_SIZE);
  el.activity.innerHTML = skeletonFeed(3);
}

function showFailure(error) {
  el.stats.innerHTML = `<span class="t-muted">Could not load the catalogue</span>`;
  el.leaderboard.innerHTML = errorState({
    title: 'Could not load the leaderboard',
    message: error.message || 'There was a problem loading tool data.',
    onRetry: () => boot({ force: true }),
  });
  el.activity.innerHTML = '';
  el.categories.innerHTML = '';
  el.awaitingSection.hidden = true;
  toast('Could not connect to the catalogue.', 'error');
}

async function boot({ force = false } = {}) {
  showSkeletons();
  initSearch();

  try {
    if (force) invalidate();
    allTools = await loadTools({ force });

    if (!allTools.length) {
      el.stats.innerHTML = `<span class="t-muted">The catalogue is empty</span>`;
      el.leaderboard.innerHTML = emptyState({
        mark: 'inbox',
        title: 'No tools listed yet',
        text: 'Rate AI is connected to its database, but there are no tools in it.',
        actions: `<a class="btn btn-primary btn-sm" href="explore.html">Browse the catalogue</a>`,
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

export function initPage() {
  queryElements();
  if (el.leaderboard) {
    boot();
  }
}

initPage();
