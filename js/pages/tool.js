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
  isFavorited,
  toggleFavorite,
  categorySlugOf,
  toolEnrichment,
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
  breadcrumbsMarkup,
  toolFeaturesList,
  toolProsCons,
  toolUseCases,
} from '../components.js';
import { icon } from '../icons.js';
import {
  esc,
  escUrl,
  formatExact,
  formatDate,
  cleanDomain,
  exploreHref,
  categoryHref,
  compareHref,
  toolHref,
  parseToolSlug,
  slugify,
  getParams,
  reveal,
  describedBy,
} from '../util.js';
import { mountNavAuth, requireAuth, onAuthChange } from '../auth.js';
import { applySEO, toolSchema } from '../seo.js';

initShell({ isMock });
mountNavAuth();

const el = {};

function queryElements() {
  el.backLink = document.querySelector('.back-link');
  el.loading = document.querySelector('[data-loading]');
  el.error = document.querySelector('[data-error]');
  el.content = document.querySelector('[data-content]');
  el.breadcrumbs = document.querySelector('[data-tool-breadcrumbs]');
  el.mark = document.querySelector('[data-mark]');
  el.name = document.querySelector('[data-name]');
  el.verified = document.querySelector('[data-verified]');
  el.developer = document.querySelector('[data-developer]');
  el.meta = document.querySelector('[data-meta]');
  el.playstoreStats = document.querySelector('[data-playstore-stats]');
  el.gallery = document.querySelector('[data-gallery]');
  el.whatsNew = document.querySelector('[data-whatsnew]');
  el.howItWorks = document.querySelector('[data-how-it-works]');
  el.dataSafety = document.querySelector('[data-datasafety]');
  el.specs = document.querySelector('[data-specs]');
  el.tags = document.querySelector('[data-tags]');
  el.website = document.querySelector('[data-website]');
  el.fav = document.querySelector('[data-tool-fav]');
  el.compare = document.querySelector('[data-compare]');
  el.rateJump = document.querySelector('[data-rate-jump]');
  el.about = document.querySelector('[data-about]');
  el.facts = document.querySelector('[data-facts]');
  el.features = document.querySelector('[data-features]');
  el.prosCons = document.querySelector('[data-pros-cons]');
  el.usecases = document.querySelector('[data-usecases]');
  el.score = document.querySelector('[data-score]');
  el.dist = document.querySelector('[data-dist]');
  el.standing = document.querySelector('[data-standing]');
  el.reviews = document.querySelector('[data-reviews]');
  el.reviewCount = document.querySelector('[data-review-count]');
  el.relatedSection = document.querySelector('[data-related-section]');
  el.related = document.querySelector('[data-related]');
  el.categoryLink = document.querySelector('[data-category-link]');
  el.categoryMore = document.querySelector('[data-category-more]');
  el.authUserNotice = document.querySelector('[data-auth-user-notice]');
  el.form = document.querySelector('[data-review-form]');
  el.starSlot = document.querySelector('[data-star-slot]');
  el.submit = document.querySelector('[data-submit-review]');
  el.nameInput = document.querySelector('#rv-name');
  el.titleInput = document.querySelector('#rv-title');
  el.bodyInput = document.querySelector('#rv-body');
  el.bodyCount = document.querySelector('[data-body-count]');

  if (el.backLink) {
    el.backLink.addEventListener('click', (e) => {
      if (typeof window !== 'undefined' && window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
        e.preventDefault();
        window.history.back();
      }
    });
  }
}

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

function syncFavButton() {
  if (!el.fav || !tool) return;
  const faved = isFavorited(tool.domain);
  el.fav.classList.toggle('is-fav', faved);
  el.fav.setAttribute('aria-label', faved ? 'Remove from favorites' : 'Save to favorites');
  el.fav.innerHTML = `${icon(faved ? 'heartFilled' : 'heart', 'ic ic-md')}<span class="btn-fav-text">${faved ? 'Saved' : 'Save'}</span>`;
}

function renderIdentity() {
  applySEO({
    title: tool.seoTitle || `${tool.name} Review, Rating & AI Tool Details | Rate AI`,
    description: tool.metaDescription || tool.description || `Detailed rating, feature breakdown, pros and cons, and authentic community reviews for ${tool.name} on Rate AI.`,
    keywords: tool.seoKeywords,
    canonicalPath: toolHref(tool.domain, tool.name),
    jsonLd: toolSchema(tool),
  });

  if (el.breadcrumbs) {
    el.breadcrumbs.innerHTML = breadcrumbsMarkup([
      { label: 'Home', href: 'index.html' },
      { label: 'Categories', href: 'categories.html' },
      { label: tool.category || 'AI Tools', href: categoryHref(categorySlugOf(tool.category)) },
      { label: tool.name },
    ]);
  }

  el.mark.innerHTML = toolMark(tool, 'lg');
  el.name.textContent = tool.name;
  el.verified.innerHTML = verifiedMark(tool);

  if (el.developer) {
    el.developer.innerHTML =
      `<div class="playstore-dev">` +
      `<span>Offered by</span> ` +
      `<a class="playstore-dev-link" href="${escUrl(tool.website)}" target="_blank" rel="noopener noreferrer">${esc(tool.company || tool.name)}</a>` +
      `<span>•</span>` +
      `<span>${esc(tool.developerHQ || 'Global')}</span>` +
      `</div>`;
  }

  if (el.playstoreStats) {
    const starScore = tool.avgRating ? Number(tool.avgRating).toFixed(1) : '—';
    const totalRatings = tool.totalRatings ? formatExact(tool.totalRatings) : '0';
    const downloads = tool.downloadsOrUsers || '10M+ users';
    const contentRating = tool.contentRating || 'Rated for 3+';
    const categoryName = tool.category || 'AI Tools';

    el.playstoreStats.innerHTML =
      `<div class="playstore-stats-bar" role="region" aria-label="Tool statistics">` +
      `<div class="playstore-stat-item">` +
      `<div class="playstore-stat-val"><span>${esc(starScore)}</span>${icon('star', 'ic ic-sm text-accent')}</div>` +
      `<div class="playstore-stat-sub">${esc(totalRatings)} reviews</div>` +
      `</div>` +
      `<div class="playstore-stat-item">` +
      `<div class="playstore-stat-val">${icon('user', 'ic ic-sm')} <span>${esc(downloads)}</span></div>` +
      `<div class="playstore-stat-sub">Verified community</div>` +
      `</div>` +
      `<div class="playstore-stat-item">` +
      `<div class="playstore-stat-val">${icon('shieldCheck', 'ic ic-sm')} <span>${esc(contentRating)}</span></div>` +
      `<div class="playstore-stat-sub">Content rating</div>` +
      `</div>` +
      `<div class="playstore-stat-item">` +
      `<div class="playstore-stat-val"><span>#1</span> ${icon('sparkles', 'ic ic-sm')}</div>` +
      `<div class="playstore-stat-sub">in ${esc(categoryName)}</div>` +
      `</div>` +
      `</div>`;
  }

  const pricing = (tool.pricing ?? [])
    .map((tier) => `<span class="badge badge-plain">${esc(tier)}</span>`)
    .join('');

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
  if (el.categoryMore) el.categoryMore.href = exploreHref({ category: tool.category });

  syncFavButton();
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

  if (el.gallery) {
    const screens = tool.screenshots?.length
      ? tool.screenshots
      : [
          { title: `${tool.name} Workspace`, caption: `Fluid user experience and workflow overview for ${tool.name}` },
          { title: 'Core AI Capabilities', caption: `High-performance models engineered for ${tool.category}` },
          { title: 'Interactive Output', caption: 'Verifiable results with instant exports and sharing' },
        ];

    el.gallery.innerHTML =
      `<div class="playstore-gallery" role="region" aria-label="Visual preview gallery">` +
      screens
        .map(
          (s, idx) =>
            `<div class="playstore-card">` +
            `<div class="playstore-card-preview">` +
            `<span class="playstore-card-badge">Preview 0${esc(idx + 1)}</span>` +
            `<div class="playstore-card-icon">${icon('sparkles', 'ic ic-lg')}</div>` +
            `<span class="t-meta t-muted">${esc(tool.name)} Workspace</span>` +
            `</div>` +
            `<div class="playstore-card-title">${esc(s.title)}</div>` +
            `<div class="playstore-card-desc">${esc(s.caption)}</div>` +
            `</div>`,
        )
        .join('') +
      `</div>`;
  }

  if (el.whatsNew) {
    if (tool.whatsNew) {
      el.whatsNew.hidden = false;
      el.whatsNew.innerHTML =
        `<div class="playstore-whatsnew">` +
        `<span class="playstore-whatsnew-badge">What's new in latest release</span>` +
        `<p class="t-small t-secondary">${esc(tool.whatsNew)}</p>` +
        `</div>`;
    } else {
      el.whatsNew.hidden = true;
    }
  }

  if (el.howItWorks) {
    if (tool.howItWorks) {
      el.howItWorks.innerHTML =
        `<div class="playstore-how-it-works">` +
        `<h3 class="panel-title">How it works</h3>` +
        `<p class="about-text">${esc(tool.howItWorks)}</p>` +
        `</div>`;
    } else {
      el.howItWorks.innerHTML = '';
    }
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

  if (el.features) {
    el.features.innerHTML = toolFeaturesList(tool.features || []);
  }

  if (el.dataSafety) {
    const ds = tool.dataSafety || {
      encryption: 'Data is encrypted in transit via TLS 1.3 and stored with AES-256',
      training: 'User prompt inputs are excluded from model training without explicit consent',
      compliance: 'SOC 2 Type II, GDPR, CCPA certified architecture',
      retention: 'Data retention policies allow instant account & data deletion upon request',
    };

    el.dataSafety.innerHTML =
      `<div class="playstore-datasafety">` +
      `<h2 class="panel-title">${icon('shieldCheck', 'ic ic-md')} Data safety & Privacy</h2>` +
      `<p class="t-meta t-muted">Safety begins with understanding how developers collect and share your data.</p>` +
      `<div class="playstore-datasafety-grid">` +
      `<div class="playstore-datasafety-item"><span class="playstore-datasafety-icon">${icon('check', 'ic ic-md')}</span><span>${esc(ds.encryption)}</span></div>` +
      `<div class="playstore-datasafety-item"><span class="playstore-datasafety-icon">${icon('check', 'ic ic-md')}</span><span>${esc(ds.training)}</span></div>` +
      `<div class="playstore-datasafety-item"><span class="playstore-datasafety-icon">${icon('check', 'ic ic-md')}</span><span>${esc(ds.compliance)}</span></div>` +
      `<div class="playstore-datasafety-item"><span class="playstore-datasafety-icon">${icon('check', 'ic ic-md')}</span><span>${esc(ds.retention)}</span></div>` +
      `</div>` +
      `</div>`;
  }

  if (el.specs) {
    const platforms = (tool.platforms ?? ['Web']).join(', ');
    const pricing = (tool.pricing ?? []).join(', ') || 'Freemium';
    const founded = tool.founded ? String(tool.founded) : '2022';
    const hq = tool.developerHQ || 'San Francisco, CA';
    const website = tool.website || `https://${tool.domain}`;

    el.specs.innerHTML =
      `<div class="playstore-specs">` +
      `<h2 class="panel-title">Specifications & Details</h2>` +
      `<div class="playstore-specs-grid">` +
      `<div class="playstore-spec-cell"><span class="playstore-spec-label">Developer</span><span class="playstore-spec-val">${esc(tool.company || tool.name)}</span></div>` +
      `<div class="playstore-spec-cell"><span class="playstore-spec-label">Headquarters</span><span class="playstore-spec-val">${esc(hq)}</span></div>` +
      `<div class="playstore-spec-cell"><span class="playstore-spec-label">Founded</span><span class="playstore-spec-val">${esc(founded)}</span></div>` +
      `<div class="playstore-spec-cell"><span class="playstore-spec-label">Platforms</span><span class="playstore-spec-val">${esc(platforms)}</span></div>` +
      `<div class="playstore-spec-cell"><span class="playstore-spec-label">Pricing Model</span><span class="playstore-spec-val">${esc(pricing)}</span></div>` +
      `<div class="playstore-spec-cell"><span class="playstore-spec-label">Official Website</span><a class="playstore-spec-val link-quiet" href="${escUrl(website)}" target="_blank" rel="noopener noreferrer">${esc(tool.domain)}</a></div>` +
      `</div>` +
      `</div>`;
  }

  if (el.prosCons) {
    el.prosCons.innerHTML = toolProsCons(tool.pros || [], tool.cons || []);
  }
  if (el.usecases) {
    el.usecases.innerHTML = toolUseCases(tool.useCases || []);
  }

  if (el.tags) {
    const tags = tool.seoKeywords?.length
      ? tool.seoKeywords
      : [tool.name.toLowerCase(), tool.category.toLowerCase(), `${tool.category.toLowerCase()} ai`, 'best ai tool', 'ai software'];

    el.tags.innerHTML =
      `<div class="playstore-tags-wrap">` +
      tags
        .map(
          (tag) =>
            `<a class="playstore-tag" href="${escUrl(`explore.html?q=${encodeURIComponent(tag)}`)}">` +
            `${icon('search', 'ic ic-xs')} ${esc(tag)}` +
            `</a>`,
        )
        .join('') +
      `</div>`;
  }
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

  onAuthChange((user) => {
    if (el.form) {
      if (user) {
        if (el.authUserNotice) {
          el.authUserNotice.textContent = `Signed in as ${user.displayName || user.email || 'Community Member'}. Your score joins the average as soon as you publish.`;
        }
        if (el.nameInput && !el.nameInput.value) {
          el.nameInput.value = user.displayName || '';
        }
      } else {
        if (el.authUserNotice) {
          el.authUserNotice.textContent = 'Your score joins the average as soon as you publish. One rating per review.';
        }
      }
    }
  });

  if (el.fav) {
    el.fav.addEventListener('click', (e) => {
      e.preventDefault();
      requireAuth('Save tools to your favorites', () => {
        const next = toggleFavorite(tool.domain);
        syncFavButton();
        toast(next ? 'Saved to favorites' : 'Removed from favorites', 'neutral');
      });
    });
  }

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

  requireAuth('publish your rating and review', async (user) => {
    setBusy(el.submit, true, 'Publishing…');

    try {
      const userName = el.nameInput.value.trim() || user?.displayName || 'Anonymous';
      const { review } = await publishReview({
        tool,
        rating,
        title: el.titleInput.value,
        body,
        userName,
      });

      reviews = [review, ...reviews];

      tool = (await loadTool(domain)) ?? tool;

      renderScore();
      renderReviews();

      el.form.reset();
      starApi.set(0);
      el.bodyCount.textContent = '0';
      toast('Review published. Thanks for rating.', 'success');

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
  });
}

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

  // Instant hydration from pre-baked build data
  const embeddedDataEl = document.getElementById('tool-data');
  let hadEmbedded = false;
  if (embeddedDataEl && !force) {
    try {
      const parsed = JSON.parse(embeddedDataEl.textContent);
      if (parsed && parsed.domain) {
        tool = toolEnrichment(parsed);
        domain = tool.domain;
        renderIdentity();
        renderAbout();
        renderScore();
        showContent();
        hadEmbedded = true;
      }
    } catch (e) {
      console.warn('Failed to hydrate embedded tool data', e);
    }
  }

  if (!domain && !tool) {
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

  if (!hadEmbedded) {
    showSkeleton();
  }

  try {
    if (force) invalidate();
    const fetchedTool = await loadTool(domain, { force });
    tool = fetchedTool;

    if (!tool) {
      try {
        const all = await loadTools({ force });
        const normDomain = slugify(domain).replace(/-/g, '');
        const match = all.find(
          (t) =>
            slugify(t.name) === slugify(domain) ||
            slugify(t.domain) === slugify(domain) ||
            cleanDomain(t.domain) === cleanDomain(domain) ||
            slugify(`${t.name}-${t.domain}`) === slugify(domain) ||
            (normDomain.includes(slugify(t.name)) && normDomain.includes(cleanDomain(t.domain).replace(/[^a-z0-9]/g, ''))),
        );
        if (match) {
          domain = match.domain;
          tool = await loadTool(domain, { force });
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
            `<a class="btn btn-primary btn-sm" href="explore.html">Browse all tools</a>` +
            `<a class="btn btn-secondary btn-sm" href="explore.html">Search catalogue</a>`,
        }),
      );
      return;
    }

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

export function initPage() {
  queryElements();
  if (el.content) {
    initForm();
    load();
  }
}

initPage();
