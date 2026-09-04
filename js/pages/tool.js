/**
 * Rate AI — Tool detail page
 *
 * Reads ?d=<domain>. The markup for this page is static in tool.html; this
 * module fills the slots, then wires the review form. Publishing folds the new
 * rating back into the store, so the score on screen and the score on the next
 * page agree without a reload.
 */

import { initShell, toast, setBusy } from '../shell.js';
import {
  isMock,
  loadTool,
  loadTools,
  loadReviews,
  publishReview,
  invalidate,
  relatedTools,
  sortTools,
} from '../store.js';
import { failureMessage } from '../errors.js';
import {
  scoreBlock,
  distList,
  toolMark,
  verifiedMark,
  reviewList,
  toolGrid,
  starInput,
  bindStarInput,
  emptyState,
  errorState,
  skeletonReviews,
  skeletonToolHead,
  categoryBadge,
  hydrateMarks,
} from '../components.js';
import {
  esc,
  escUrl,
  formatExact,
  formatDate,
  cleanDomain,
  exploreHref,
  compareHref,
  submitHref,
  toolHref,
  parseToolSlug,
  slugify,
  getParams,
  reveal,
  describedBy,
} from '../util.js';

initShell({ isMock });

const el = {
  loading: document.querySelector('[data-loading]'),
  error: document.querySelector('[data-error]'),
  content: document.querySelector('[data-content]'),
  mark: document.querySelector('[data-mark]'),
  name: document.querySelector('[data-name]'),
  verified: document.querySelector('[data-verified]'),
  meta: document.querySelector('[data-meta]'),
  website: document.querySelector('[data-website]'),
  compare: document.querySelector('[data-compare]'),
  rateJump: document.querySelector('[data-rate-jump]'),
  about: document.querySelector('[data-about]'),
  facts: document.querySelector('[data-facts]'),
  score: document.querySelector('[data-score]'),
  dist: document.querySelector('[data-dist]'),
  standing: document.querySelector('[data-standing]'),
  reviews: document.querySelector('[data-reviews]'),
  reviewCount: document.querySelector('[data-review-count]'),
  relatedSection: document.querySelector('[data-related-section]'),
  related: document.querySelector('[data-related]'),
  categoryLink: document.querySelector('[data-category-link]'),
  form: document.querySelector('[data-review-form]'),
  starSlot: document.querySelector('[data-star-slot]'),
  submit: document.querySelector('[data-submit-review]'),
  nameInput: document.querySelector('#rv-name'),
  titleInput: document.querySelector('#rv-title'),
  bodyInput: document.querySelector('#rv-body'),
  bodyCount: document.querySelector('[data-body-count]'),
};

function extractRequestedDomain() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const match = path.match(/\/(?:reviewe|review|reviews)\/([^/?#]+)/i);
  if (match) {
    const slug = match[1];
    const parsed = parseToolSlug(slug);
    if (parsed) return parsed;
  }
  const params = getParams();
  if (params.get('d')) return cleanDomain(params.get('d'));
  if (params.get('slug')) return parseToolSlug(params.get('slug'));
  return '';
}

let domain = extractRequestedDomain();
const BODY_MIN = 10;

let tool = null;
let reviews = [];
let starApi = null;

/* ==========================================================================
   Page states
   ========================================================================== */

function showSkeleton() {
  el.loading.hidden = false;
  el.loading.innerHTML = skeletonToolHead();
}

function showError(html) {
  el.loading.hidden = true;
  el.content.hidden = true;
  el.error.hidden = false;
  el.error.innerHTML = html;
}

function showContent() {
  el.loading.hidden = true;
  el.error.hidden = true;
  el.content.hidden = false;
}

/* ==========================================================================
   Render
   ========================================================================== */

function renderIdentity() {
  document.title = `${tool.name} — Rate AI`;
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute(
      'content',
      `${tool.name}: community rating, score breakdown and written reviews on Rate AI.`,
    );
  }

  el.mark.innerHTML = toolMark(tool, 'lg');
  el.name.textContent = tool.name;
  el.verified.innerHTML = verifiedMark(tool);

  const pricing = (tool.pricing ?? [])
    .map((tier) => `<span class="badge badge-plain">${esc(tier)}</span>`)
    .join('');

  /* Category is a label here; the "More in ..." link below the reviews is the
     full-size control that navigates. */
  el.meta.innerHTML =
    categoryBadge(tool) +
    pricing +
    `<a class="link-quiet t-meta" href="${escUrl(tool.website)}" target="_blank" ` +
    `rel="noopener noreferrer">${esc(tool.domain)}</a>`;

  el.website.href = tool.website || `https://${tool.domain}`;
  el.website.setAttribute('aria-label', `Visit ${tool.name} in a new tab`);
  el.compare.href = compareHref(tool.domain, '');
  el.compare.setAttribute('aria-label', `Compare ${tool.name} with another tool`);
  el.categoryLink.href = exploreHref({ category: tool.category });

  hydrateMarks(el.mark);
}

function renderAbout() {
  if (tool.description) {
    el.about.textContent = tool.description;
    el.about.classList.remove('t-muted');
  } else {
    el.about.textContent = 'No description has been added for this tool yet.';
    el.about.classList.add('t-muted');
  }

  const facts = [
    ['Company', tool.company || '—'],
    ['Pricing', (tool.pricing ?? []).join(', ') || '—'],
    ['Founded', tool.founded ? String(tool.founded) : '—'],
    ['Listed', formatDate(tool.createdAt) || '—'],
  ];

  el.facts.innerHTML = facts
    .map(([term, value]) => `<div><dt>${esc(term)}</dt><dd>${esc(value)}</dd></div>`)
    .join('');
}

function renderScore() {
  el.score.innerHTML = scoreBlock(tool);
  el.dist.innerHTML = distList(tool);
}

/**
 * Where this tool sits among the rated ones. A rank is only meaningful against
 * the same ordering the leaderboard uses, so it comes from sortTools.
 */
function renderStanding(all) {
  if (!all || !all.length) {
    el.standing.hidden = true;
    return;
  }

  if (!tool.totalRatings) {
    el.standing.hidden = false;
    el.standing.innerHTML =
      `<h2 class="panel-title">Standing</h2>` +
      `<p class="t-small t-secondary">Not ranked yet. A tool joins the leaderboard ` +
      `with its first rating.</p>`;
    return;
  }

  const rated = all.filter((t) => t.totalRatings > 0);
  const overall = sortTools(rated, 'rating');
  const inCategory = overall.filter((t) => t.category === tool.category);
  const place = (list) => list.findIndex((t) => t.domain === tool.domain) + 1;

  /* A cold visit can load one tool that the catalogue read did not return; no
     position means no claim about position. */
  if (place(overall) === 0) {
    el.standing.hidden = true;
    return;
  }

  const rows = [
    ['Overall', `#${place(overall)} of ${formatExact(overall.length)}`],
    [`In ${tool.category}`, `#${place(inCategory)} of ${formatExact(inCategory.length)}`],
  ];

  el.standing.hidden = false;
  el.standing.innerHTML =
    `<h2 class="panel-title">Standing</h2>` +
    `<p class="panel-text">Among tools that have been rated.</p>` +
    `<dl class="facts">` +
    rows
      .map(([term, value]) => `<div><dt>${esc(term)}</dt><dd>${esc(value)}</dd></div>`)
      .join('') +
    `</dl>`;
}

function renderRelated(all) {
  if (!all || !all.length) return;
  const related = relatedTools(tool, all, 3);
  if (!related.length) return;

  el.relatedSection.hidden = false;
  el.related.innerHTML = toolGrid(related);
  hydrateMarks(el.related);
}

function renderReviews() {
  el.reviewCount.textContent = reviews.length ? formatExact(reviews.length) : '';

  if (!reviews.length) {
    el.reviews.innerHTML = emptyState({
      mark: 'message',
      title: 'No written reviews yet',
      text: `Nobody has written about ${tool.name} yet. Yours would be the first.`,
      actions: `<button class="btn btn-primary btn-sm" type="button" data-rate-jump>Write the first review</button>`,
      small: true,
    });
    return;
  }

  el.reviews.innerHTML = reviewList(reviews);
}

/* ==========================================================================
   Review form
   ========================================================================== */

/**
 * The control a message belongs to. The star group is built by starInput() when
 * the form initialises, so it is looked up on demand rather than captured with
 * the rest of the page's elements.
 */
function controlFor(key) {
  if (key === 'body') return el.bodyInput;
  if (key === 'rating') return el.starSlot.querySelector('[data-star-input]');
  return null;
}

function fieldError(key, message) {
  const holder = el.form.querySelector(`[data-error-for="${key}"]`);
  if (!holder) return;
  holder.hidden = !message;
  const text = holder.querySelector('[data-error-text]');
  if (text) text.textContent = message ?? '';

  const control = controlFor(key);
  if (!control) return;
  if (!holder.id) holder.id = `err-${key}`;
  if (message) control.setAttribute('aria-invalid', 'true');
  else control.removeAttribute('aria-invalid');
  describedBy(control, holder.id, Boolean(message));
}

function clearErrors() {
  ['rating', 'body'].forEach((key) => fieldError(key, ''));
}

/**
 * Focus first with preventScroll, then scroll the whole card into view — the
 * other order makes the browser jump to the star and cancel the smooth scroll.
 */
function focusRating() {
  el.starSlot.querySelector('[data-star][tabindex="0"]')?.focus({ preventScroll: true });
  reveal(document.getElementById('rate'));
}

function initForm() {
  el.starSlot.innerHTML = starInput({ name: 'rating' });
  starApi = bindStarInput(el.starSlot.querySelector('[data-star-input]'), (value) => {
    if (value) fieldError('rating', '');
  });

  el.bodyInput.addEventListener('input', () => {
    el.bodyCount.textContent = formatExact(el.bodyInput.value.length);
    if (el.bodyInput.value.trim().length >= BODY_MIN) fieldError('body', '');
  });

  el.form.addEventListener('submit', onSubmit);
}

async function onSubmit(event) {
  event.preventDefault();
  clearErrors();

  const rating = starApi.get();
  const body = el.bodyInput.value.trim();
  let firstBad = null;

  if (!rating) {
    fieldError('rating', 'Choose a rating from one to five stars.');
    firstBad = 'rating';
  }
  if (body.length < BODY_MIN) {
    fieldError('body', `Write at least ${BODY_MIN} characters so the rating has some reasoning behind it.`);
    firstBad = firstBad ?? 'body';
  }

  if (firstBad === 'rating') {
    focusRating();
    return;
  }
  if (firstBad === 'body') {
    el.bodyInput.focus();
    return;
  }

  setBusy(el.submit, true, 'Publishing…');

  try {
    const { review } = await publishReview({
      tool,
      rating,
      title: el.titleInput.value,
      body,
      userName: el.nameInput.value,
    });

    reviews = [review, ...reviews];

    /* The store rewrites the cached record, so re-read rather than mutating a
       reference that is now stale. */
    tool = (await loadTool(domain)) ?? tool;

    renderScore();
    renderReviews();

    el.form.reset();
    starApi.set(0);
    el.bodyCount.textContent = '0';
    toast('Review published. Thanks for rating.', 'success');

    /* The published review gets focus, not just the scroll position. Sighted
       readers are carried to their review by the scroll; without this a keyboard
       reader is left on a button beside a form that just emptied itself, with
       the toast as the only evidence anything happened. Focus first with
       preventScroll, then scroll — the other order cancels the smooth scroll. */
    const published = el.reviews.querySelector('.review');
    if (published) {
      published.tabIndex = -1;
      published.focus({ preventScroll: true });
      reveal(published);
    }
  } catch (error) {
    toast(failureMessage(error, 'your review'), 'error', 7000);
  } finally {
    setBusy(el.submit, false);
  }
}

/* Both the header button and the empty state offer to jump to the form. */
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-rate-jump]')) {
    event.preventDefault();
    focusRating();
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

async function loadReviewsFor() {
  el.reviews.innerHTML = skeletonReviews(2);
  try {
    reviews = await loadReviews(domain);
    renderReviews();
  } catch (error) {
    el.reviews.innerHTML = errorState(error, { retryLabel: 'Reload reviews' });
  }
}

async function load({ force = false } = {}) {
  if (!domain) domain = extractRequestedDomain();

  if (!domain) {
    showError(
      emptyState({
        mark: 'search',
        title: 'No tool specified',
        text: 'This page needs a tool in its address. Pick one from the catalogue.',
        actions: `<a class="btn btn-primary btn-sm" href="explore.html">Browse all tools</a>`,
      }),
    );
    return;
  }

  showSkeleton();

  try {
    if (force) invalidate();
    tool = await loadTool(domain);

    if (!tool) {
      try {
        const all = await loadTools();
        const match = all.find(
          (t) =>
            slugify(t.name) === slugify(domain) ||
            slugify(t.domain) === slugify(domain) ||
            cleanDomain(t.domain) === cleanDomain(domain)
        );
        if (match) {
          domain = match.domain;
          tool = await loadTool(domain);
        }
      } catch {
        /* proceed to not found check */
      }
    }

    if (!tool) {
      showError(
        emptyState({
          mark: 'search',
          title: 'That tool is not listed',
          text: `Nothing in the catalogue matches ${domain}. It may have been removed, or never added.`,
          actions:
            `<a class="btn btn-primary btn-sm" href="${esc(submitHref({ domain }))}">` +
            `Add this tool</a>` +
            `<a class="btn btn-secondary btn-sm" href="explore.html">Browse all tools</a>`,
        }),
      );
      return;
    }

    // Synchronize browser tab bar / address bar URL to /reviewe/(tool name with domain)/
    if (typeof window !== 'undefined' && window.location.protocol !== 'file:') {
      const canonical = toolHref(tool.domain, tool.name);
      const search = window.location.search ?? '';
      if (!window.location.pathname.endsWith(canonical) && window.location.pathname !== canonical) {
        window.history.replaceState(null, '', `${canonical}${search}`);
      }
    }

    renderIdentity();
    renderAbout();
    renderScore();
    showContent();

    /* Reviews and the catalogue-wide figures are secondary: the record is
       already readable without them, so they load after and fail quietly. */
    loadReviewsFor();

    try {
      const all = await loadTools();
      renderStanding(all);
      renderRelated(all);
    } catch {
      el.standing.hidden = true;
    }
  } catch (error) {
    showError(errorState(error));
  }
}

initForm();
load();
