/**
 * Rate AI — Components
 *
 * Every repeated piece of interface is produced here, once. Pages compose these
 * and never write their own markup for a card, a row, a score or a state.
 *
 * Two rules hold throughout:
 *   1. Anything reader-supplied passes through esc() or escUrl() before it
 *      reaches innerHTML. Tool names, domains and review text all qualify.
 *   2. Aggregate scores are shown as numerals, never as stars. Stars encode one
 *      person's verdict; a 4.7 average is a measurement and reads as a number.
 */

import { icon } from './icons.js';
import {
  esc,
  escUrl,
  clamp,
  formatCount,
  formatExact,
  formatScore,
  plural,
  timeAgo,
  initial,
  faviconUrl,
  toolHref,
  exploreHref,
  starFillPx,
  distributionRows,
  distributionIsPartial,
} from './util.js';

/* ==========================================================================
   Stars — one person's rating, drawn as ink
   ========================================================================== */

/**
 * @param {number} rating 0–5, fractions allowed
 * @param {'sm'|'md'|'lg'} size
 */
export function stars(rating, size = 'sm') {
  const value = clamp(Number(rating) || 0, 0, 5);
  const sizeClass = size === 'sm' ? '' : ` stars-${size}`;
  const cls = value >= 3.8 ? 'stars-high' : value >= 2.8 ? 'stars-mid' : value > 0 ? 'stars-low' : '';
  const layer = icon('star').repeat(5);
  const fill = starFillPx(value, size);

  return (
    `<span class="stars${sizeClass} ${cls}" role="img" ` +
    `aria-label="${value.toFixed(1)} out of 5">` +
    `<span class="stars-layer stars-off">${layer}</span>` +
    `<span class="stars-layer stars-on" style="--fill:${fill.toFixed(2)}px">${layer}</span>` +
    `</span>`
  );
}

/**
 * 5 Ball Dots — circular rating marks matching mobile & webview mockup
 * @param {number} rating 0–5, fractions allowed
 */
export function ballDots(rating) {
  const value = clamp(Number(rating) || 0, 0, 5);
  const rounded = Math.round(value);
  const cls = value >= 3.8 ? 'balls-high' : value >= 2.8 ? 'balls-mid' : value > 0 ? 'balls-low' : '';
  let layer = '';
  for (let i = 1; i <= 5; i += 1) {
    layer += `<span class="ball${i <= rounded ? ' is-on' : ''}"></span>`;
  }
  return `<span class="balls ${cls}" role="img" aria-label="${value.toFixed(1)} out of 5">${layer}</span>`;
}

/* ==========================================================================
   Score
   ========================================================================== */

/** The bar under a score. Width is the rating as a share of five. */
export function meter(rating, { small = false, animate = false, cls = '' } = {}) {
  const percent = (clamp(Number(rating) || 0, 0, 5) / 5) * 100;
  const classes = [
    'meter',
    small ? 'meter-sm' : '',
    animate ? 'meter-animate' : '',
    cls,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    `<span class="${classes}"><span class="meter-fill" ` +
    `style="--fill:${percent.toFixed(2)}%"></span></span>`
  );
}

/**
 * The signature element: a large tabular numeral, the count beside it, and a
 * hairline meter beneath. Used on the tool page and in compare.
 */
export function scoreBlock(tool, { animate = true } = {}) {
  const score = formatScore(tool.avgRating);
  const ratings = Number(tool.totalRatings) || 0;

  if (!score) {
    return (
      `<div class="score-block">` +
      `<div class="score-row"><span class="score-new">Not yet rated</span></div>` +
      `<p class="t-meta t-muted">Be the first to publish a verdict.</p>` +
      `</div>`
    );
  }

  return (
    `<div class="score-block">` +
    `<div class="score-row">` +
    `<span class="score"><span class="score-num">${esc(score)}</span>` +
    `<span class="score-of">/ 5</span></span>` +
    `<span class="scorecard-count">${esc(formatExact(ratings))}<br>` +
    `${esc(plural(ratings, 'rating', 'ratings'))}</span>` +
    `</div>` +
    meter(tool.avgRating, { animate }) +
    `</div>`
  );
}

/* ==========================================================================
   Tool identity
   ========================================================================== */

/**
 * A favicon holder that starts as a lettermark. hydrateMarks() swaps in the real
 * icon only once it has loaded, so a blocked or missing favicon leaves a clean
 * letter rather than a broken-image glyph.
 */
export function toolMark(tool, size = '') {
  const sizeClass = size ? ` tool-mark-${size}` : '';
  return (
    `<span class="tool-mark${sizeClass}" data-mark="${esc(tool.domain)}">` +
    `<span class="tool-mark-letter">${esc(initial(tool.name))}</span>` +
    `</span>`
  );
}

const markFailures = new Set();

/** Loads favicons for any marks inside `root` that have not been tried yet. */
export function hydrateMarks(root = document) {
  root.querySelectorAll('[data-mark]').forEach((holder) => {
    const domain = holder.dataset.mark;
    if (!domain || holder.dataset.hydrated === '1') return;
    holder.dataset.hydrated = '1';
    if (markFailures.has(domain)) return;

    const url = faviconUrl(domain);
    if (!url) return;

    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (img.naturalWidth < 8) return; // a placeholder globe, not a real icon
      img.alt = '';
      holder.replaceChildren(img);
    };
    img.onerror = () => markFailures.add(domain);
    img.src = url;
  });
}

export function verifiedMark(tool) {
  if (!tool.verified) return '';
  return (
    `<span class="verified" title="Listing confirmed by Rate AI">` +
    icon('shieldCheck', 'ic ic-sm') +
    `<span class="sr-only">Verified listing</span></span>`
  );
}

/**
 * The category, as a label.
 *
 * It used to be a link to the filtered list, in three separate copies of this
 * markup, and that was wrong twice over. A badge is 22px tall, which is half a
 * touch target, and inside a tool card it was a second destination competing
 * with the card's own — aim for the card on a phone, land on a filtered list.
 * So the rule is now flat: a badge labels, a chip or a link navigates. Getting
 * to a category is the explore chips' job, the home tiles' job, and the tool
 * page's "More in ..." link's job — all of them full-size controls.
 */
export function categoryBadge(tool) {
  return `<span class="badge">${esc(tool.category)}</span>`;
}

function pricingBadges(tool) {
  return (tool.pricing ?? [])
    .slice(0, 2)
    .map((tier) => `<span class="badge badge-plain">${esc(tier)}</span>`)
    .join('');
}

/* ==========================================================================
   Tool card
   ========================================================================== */

export function toolCard(tool) {
  const href = esc(toolHref(tool.domain, tool.name));
  const score = formatScore(tool.avgRating);
  const ratings = Number(tool.totalRatings) || 0;

  const scoreCell = score
    ? `<span class="tool-score" title="${esc(formatExact(ratings))} ${esc(
        plural(ratings, 'rating', 'ratings'),
      )}">${esc(score)}<span class="score-of">/ 5</span></span>`
    : `<span class="badge badge-count">Not rated</span>`;

  return (
    `<article class="tool-card">` +
    `<div class="tool-card-top">` +
    `<div class="tool-id">` +
    toolMark(tool) +
    `<div class="grow">` +
    `<h3 class="tool-name"><a class="tool-link truncate" href="${href}">` +
    `${esc(tool.name)}</a>` +
    verifiedMark(tool) +
    `</h3>` +
    `<span class="tool-domain truncate">${esc(tool.domain)}</span>` +
    `</div>` +
    `</div>` +
    scoreCell +
    `</div>` +
    (tool.description
      ? `<p class="tool-desc clamp-2">${esc(tool.description)}</p>`
      : `<p class="tool-desc t-muted">No description yet.</p>`) +
    `<div class="tool-tags">${categoryBadge(tool)}${pricingBadges(tool)}</div>` +
    `<div class="tool-card-foot">` +
    `<a class="btn btn-secondary btn-sm" href="${href}">` +
    (ratings
      ? `${esc(formatCount(tool.totalReviews))} ${esc(
          plural(tool.totalReviews, 'review', 'reviews'),
        )}`
      : 'Write the first review') +
    `</a>` +
    `<a class="btn btn-ghost btn-sm btn-icon" href="${escUrl(tool.website)}" ` +
    `target="_blank" rel="noopener noreferrer" ` +
    `aria-label="Open ${esc(tool.name)} in a new tab" title="Open ${esc(tool.name)}">` +
    icon('externalLink', 'ic ic-md') +
    `</a>` +
    `</div>` +
    `</article>`
  );
}

export function toolGrid(tools) {
  return `<div class="tool-grid">${tools.map(toolCard).join('')}</div>`;
}

/* ==========================================================================
   Ledger — the ranked table that is the product's primary surface
   ========================================================================== */

export function ledgerHead() {
  return '';
}

export function ledgerRow(tool, rank) {
  const score = formatScore(tool.avgRating);

  return (
    `<a class="ledger-row" href="${esc(toolHref(tool.domain, tool.name))}">` +
    `<span class="ledger-rank">${rank}</span>` +
    toolMark(tool, 'sm') +
    `<span class="ledger-info grow">` +
    `<span class="ledger-name"><span class="truncate">${esc(tool.name)}</span>` +
    verifiedMark(tool) +
    `</span>` +
    `<span class="ledger-domain truncate">${esc(tool.domain)}</span>` +
    `</span>` +
    `<span class="ledger-score-wrap">` +
    (score ? ballDots(tool.avgRating) : '') +
    `<span class="ledger-score">${esc(score || '—')}</span>` +
    `</span>` +
    `</a>`
  );
}

/** @param {{startAt?: number, head?: boolean}} options */
export function ledger(tools, { startAt = 1, head = true } = {}) {
  return (
    `<div class="ledger">` +
    (head ? ledgerHead() : '') +
    tools.map((tool, i) => ledgerRow(tool, startAt + i)).join('') +
    `</div>`
  );
}

/* ==========================================================================
   Category tiles
   ========================================================================== */

export function catTile(category) {
  return (
    `<a class="cat-tile" href="${esc(exploreHref({ category: category.name }))}">` +
    `<span class="truncate">${esc(category.name)}</span>` +
    `<span class="cat-tile-meta">${esc(formatCount(category.count))}</span>` +
    `</a>`
  );
}

export function catGrid(categories) {
  return `<div class="cat-grid">${categories.map(catTile).join('')}</div>`;
}

/* ==========================================================================
   Rating distribution
   ========================================================================== */

export function distList(tool) {
  const rows = distributionRows(tool);
  const recorded = rows.reduce((acc, row) => acc + row.count, 0);

  if (!recorded) {
    return (
      `<p class="t-small t-secondary">` +
      (tool.totalRatings
        ? 'The rating breakdown for this tool has not been recorded yet.'
        : 'No ratings yet, so there is nothing to break down.') +
      `</p>`
    );
  }

  const list =
    `<div class="dist">` +
    rows
      .map((row) => {
        const cls = row.stars >= 4 ? 'dist-row-high' : row.stars === 3 ? 'dist-row-mid' : 'dist-row-low';
        return (
          `<div class="dist-row ${cls}">` +
          `<span class="dist-label">${esc(row.stars)}${icon('star', 'ic ic-sm')}` +
          `<span class="sr-only">${esc(row.stars)} ${plural(row.stars, 'star', 'stars')}</span>` +
          `</span>` +
          `<span class="dist-track"><span class="dist-fill" ` +
          `style="--fill:${row.percent.toFixed(2)}%"></span></span>` +
          `<span class="dist-value">${esc(formatCount(row.count))}</span>` +
          `</div>`
        );
      })
      .join('') +
    `</div>`;

  /* Being straight about incomplete data is the whole point of a ratings site. */
  if (distributionIsPartial(tool)) {
    return (
      list +
      `<p class="field-hint">Based on ${esc(formatExact(recorded))} of ` +
      `${esc(formatExact(tool.totalRatings))} ratings — the rest predate the ` +
      `breakdown being recorded.</p>`
    );
  }
  return list;
}

/* ==========================================================================
   Reviews
   ========================================================================== */

/**
 * A reviewer's mark. A supplied photo when there is one, otherwise the initial
 * on a neutral chip — no generated image, no third-party avatar service, and it
 * follows the theme because it is drawn with tokens like everything else.
 */
function avatar(review) {
  if (review.userPhoto) {
    return (
      `<img class="avatar" src="${escUrl(review.userPhoto)}" alt="" ` +
      `width="32" height="32" loading="lazy" decoding="async">`
    );
  }
  return `<span class="avatar" aria-hidden="true">${esc(initial(review.userName))}</span>`;
}

export function reviewItem(review) {
  return (
    `<article class="review">` +
    `<div class="review-head">` +
    `<div class="review-author">` +
    avatar(review) +
    `<div class="grow">` +
    `<div class="review-name truncate">${esc(review.userName)}</div>` +
    `<div class="review-date">${esc(timeAgo(review.createdAt) || 'Recently')}</div>` +
    `</div>` +
    `</div>` +
    stars(review.rating, 'md') +
    `</div>` +
    (review.title ? `<h4 class="review-title">${esc(review.title)}</h4>` : '') +
    (review.body ? `<p class="review-body">${esc(review.body)}</p>` : '') +
    `</article>`
  );
}

export function reviewList(reviews) {
  return `<div class="reviews">${reviews.map(reviewItem).join('')}</div>`;
}

/** Compact line for the dashboard activity feed. */
export function feedItem({ review, tool }) {
  return (
    `<article class="feed-item">` +
    `<div class="grow">` +
    `<a class="feed-title link-quiet" href="${esc(toolHref(tool.domain, tool.name))}">` +
    `${esc(tool.name)}</a>` +
    `<div class="feed-meta">${esc(review.userName)} · ` +
    `${esc(timeAgo(review.createdAt) || 'Recently')}</div>` +
    `</div>` +
    stars(review.rating, 'sm') +
    (review.title || review.body
      ? `<p class="feed-quote clamp-2">${esc(review.title || review.body)}</p>`
      : '') +
    `</article>`
  );
}

export function feedList(entries) {
  return `<div class="feed">${entries.map(feedItem).join('')}</div>`;
}

/* ==========================================================================
   Star rating input — a real radiogroup, operable from the keyboard
   ========================================================================== */

export function starInput({ name = 'rating', value = 0 } = {}) {
  const tier = value ? (value <= 2 ? 'low' : value === 3 ? 'mid' : 'high') : '';
  const tierAttr = tier ? ` data-tier="${tier}" data-rating="${value}"` : '';
  const options = [1, 2, 3, 4, 5]
    .map((n) => {
      const on = n <= value;
      /* Roving tabindex: one stop for the whole group, arrows move within it. */
      const focusable = value ? n === value : n === 1;
      return (
        `<span class="star-option${on ? ' is-on' : ''}" role="radio" ` +
        `aria-checked="${on && n === value ? 'true' : 'false'}" ` +
        `tabindex="${focusable ? '0' : '-1'}" data-star="${n}" ` +
        `aria-label="${n} ${plural(n, 'star', 'stars')}">` +
        icon('star') +
        `</span>`
      );
    })
    .join('');

  /* row-wrap because at 320px the five 44px stars and a readout as long as
     "2 of 5 — Below average" do not fit on one line, and the stars are targets
     that must not give way. */
  return (
    `<div class="row row-wrap">` +
    `<div class="star-input" role="radiogroup" aria-label="Your rating" ` +
    `data-star-input data-name="${esc(name)}"${tierAttr}>${options}</div>` +
    `<span class="star-value"${tier ? ` data-tier="${tier}"` : ''} data-star-value>` +
    (value ? `${value} of 5 — ${STAR_WORDS[value]}` : 'Select a rating') +
    `</span>` +
    `</div>`
  );
}

const STAR_WORDS = {
  1: 'Poor',
  2: 'Below average',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

/**
 * Wires a star group. Click, arrow keys, Home/End and Space/Enter all work, and
 * the chosen value is reported through onChange.
 */
export function bindStarInput(root, onChange) {
  if (!root) return { get: () => 0, set: () => {} };
  const options = [...root.querySelectorAll('[data-star]')];
  const readout = root.parentElement?.querySelector('[data-star-value]');
  let current = 0;

  const tierOf = (v) => (!v ? '' : v <= 2 ? 'low' : v === 3 ? 'mid' : 'high');

  function updateReadout(val) {
    if (!readout) return;
    const tier = tierOf(val);
    if (tier) {
      readout.dataset.tier = tier;
      readout.textContent = `${val} of 5 — ${STAR_WORDS[val]}`;
    } else {
      delete readout.dataset.tier;
      readout.textContent = 'Select a rating';
    }
  }

  function clearPreview() {
    root.classList.remove('is-previewing');
    delete root.dataset.previewTier;
    options.forEach((opt) => opt.classList.remove('is-preview'));
    updateReadout(current);
  }

  function preview(n) {
    const tier = tierOf(n);
    root.classList.add('is-previewing');
    root.dataset.previewTier = tier;
    options.forEach((opt, i) => {
      opt.classList.toggle('is-preview', i + 1 <= n);
    });
    if (readout) {
      readout.dataset.tier = tier;
      readout.textContent = `${n} of 5 — ${STAR_WORDS[n]}`;
    }
  }

  function paint(value, focusIndex = null) {
    current = value;
    clearPreview();
    const tier = tierOf(value);
    if (tier) {
      root.dataset.tier = tier;
      root.dataset.rating = String(value);
    } else {
      delete root.dataset.tier;
      delete root.dataset.rating;
    }

    options.forEach((option, i) => {
      const n = i + 1;
      option.classList.toggle('is-on', n <= value);
      option.setAttribute('aria-checked', n === value ? 'true' : 'false');
      option.tabIndex = n === (value || 1) ? 0 : -1;
    });

    updateReadout(value);
    if (focusIndex !== null) options[focusIndex]?.focus();
    onChange?.(value);
  }

  options.forEach((option, i) => {
    const n = i + 1;
    option.addEventListener('mouseenter', () => preview(n));
    option.addEventListener('click', () => paint(n));
    option.addEventListener('keydown', (event) => {
      const keys = {
        ArrowRight: Math.min(i + 1, 4),
        ArrowUp: Math.min(i + 1, 4),
        ArrowLeft: Math.max(i - 1, 0),
        ArrowDown: Math.max(i - 1, 0),
        Home: 0,
        End: 4,
      };
      if (event.key in keys) {
        event.preventDefault();
        paint(keys[event.key] + 1, keys[event.key]);
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        paint(n);
      }
    });
  });

  root.addEventListener('mouseleave', clearPreview);

  return {
    get: () => current,
    set: (value) => paint(clamp(parseInt(value, 10) || 0, 0, 5)),
  };
}

/* ==========================================================================
   States — empty, error, loading
   ========================================================================== */

/**
 * @param {{mark?:string,title:string,text?:string,actions?:string,small?:boolean}} o
 */
export function emptyState({ mark = 'inbox', title, text = '', actions = '', small = false }) {
  return (
    `<div class="empty${small ? ' empty-sm' : ''}">` +
    `<span class="empty-mark">${icon(mark, 'ic ic-lg')}</span>` +
    `<h3 class="empty-title">${esc(title)}</h3>` +
    (text ? `<p class="empty-text">${esc(text)}</p>` : '') +
    (actions ? `<div class="empty-actions">${actions}</div>` : '') +
    `</div>`
  );
}

const ERRORS = {
  offline: {
    mark: 'alertTriangle',
    title: 'You appear to be offline',
    text: 'Rate AI needs a connection to read the catalogue. Reconnect and try again.',
  },
  permission: {
    mark: 'alertCircle',
    title: 'The database refused the request',
    text: 'The catalogue exists but this browser is not allowed to read it. Check the Firestore security rules for the tools and reviews collections.',
  },
  unavailable: {
    mark: 'alertTriangle',
    title: 'The catalogue did not respond',
    text: 'The database took too long to answer. This is usually temporary.',
  },
  unknown: {
    mark: 'alertCircle',
    title: 'Something went wrong',
    text: 'The catalogue could not be loaded.',
  },
};

/** A failure state that names the cause and offers the one useful action. */
export function errorState(error, { retryLabel = 'Try again' } = {}) {
  const kind = error?.kind && ERRORS[error.kind] ? error.kind : 'unknown';
  const spec = ERRORS[kind];
  const detail =
    kind === 'unknown' && error?.message ? ` ${String(error.message)}` : '';

  return emptyState({
    mark: spec.mark,
    title: spec.title,
    text: spec.text + detail,
    actions:
      `<button class="btn btn-primary btn-sm" type="button" data-retry>` +
      icon('refresh', 'ic ic-sm') +
      `<span>${esc(retryLabel)}</span></button>`,
  });
}

/* ==========================================================================
   Skeletons — the same shape as the content they stand in for, so nothing
   jumps when the real thing arrives.

   Every shape is a class in css/components.css. The only things decided here
   are how many bars there are and how long each one is, because ragged line
   lengths are what make a stack of bars read as text.
   ========================================================================== */

/** One placeholder bar: `cls` picks the shape, `w` the length. */
const bar = (w, cls) => `<span class="skel ${cls}" style="--w:${esc(w)}"></span>`;

/**
 * A bar standing in for a line of body text — the common case, and the only
 * one safe to hand to `map`, which passes the array index as a second argument
 * and would otherwise land it in `bar`'s shape slot.
 */
const line = (w) => bar(w, 'skel-line');

export function skeletonCards(count = 6) {
  const card =
    `<div class="skel-card">` +
    `<div class="row"><span class="skel skel-mark"></span>` +
    `<span class="grow">${bar('58%', 'skel-line-lg')}</span></div>` +
    line('100%') +
    line('74%') +
    `<div class="row">${bar('72px', 'skel-badge')}${bar('64px', 'skel-badge')}</div>` +
    `</div>`;
  return `<div class="tool-grid">${card.repeat(count)}</div>`;
}

export function skeletonLedger(count = 8) {
  const row =
    `<div class="skel-row">` +
    `<span class="skel skel-mark-sm"></span>` +
    `<span class="grow">${line('42%')}</span>` +
    line('64px') +
    `</div>`;
  return `<div class="ledger">${row.repeat(count)}</div>`;
}

export function skeletonFeed(count = 4) {
  const item =
    `<div class="feed-item">` +
    `<span class="grow skel-lines">${line('46%')}${line('70%')}</span>` +
    line('78px') +
    `</div>`;
  return `<div class="feed">${item.repeat(count)}</div>`;
}

export function skeletonReviews(count = 3) {
  const item =
    `<div class="skel-card">` +
    `<div class="row"><span class="skel skel-avatar"></span>` +
    `<span class="grow">${line('34%')}</span>${line('84px')}</div>` +
    bar('56%', 'skel-line-lg') +
    line('100%') +
    line('88%') +
    `</div>`;
  return `<div class="reviews">${item.repeat(count)}</div>`;
}

/**
 * The tool page's identity block. It stands in for a mark, a page heading, a
 * domain line and the start of the description.
 */
export function skeletonToolHead() {
  return (
    `<div class="skel-card">` +
    `<div class="row"><span class="skel skel-mark-lg"></span>` +
    `<span class="grow skel-lines">${bar('38%', 'skel-line-xl')}${line('24%')}</span>` +
    `</div>` +
    `<div class="skel-lines">${line('100%')}${line('92%')}${line('64%')}</div>` +
    `</div>`
  );
}

/**
 * A card of plain text lines, for a panel whose real shape isn't known until
 * the data lands — the comparison table being the case in point.
 */
export function skeletonLines(widths = ['36%', '58%', '48%', '62%', '40%']) {
  return `<div class="skel-card">${widths.map(line).join('')}</div>`;
}

/* ==========================================================================
   Small shared bits
   ========================================================================== */

export function sectionHead({ title, count = null, action = null, id = null }) {
  return (
    `<div class="section-head">` +
    `<h2 class="section-title"${id ? ` id="${esc(id)}"` : ''}>` +
    `${esc(title)}` +
    (count !== null ? `<span class="section-count">${esc(String(count))}</span>` : '') +
    `</h2>` +
    (action
      ? `<a class="section-action" href="${esc(action.href)}">${esc(action.label)}` +
        icon('arrowRight', 'ic ic-sm') +
        `</a>`
      : '') +
    `</div>`
  );
}

export function notice(message, { kind = '', title = '' } = {}) {
  const mark = kind === 'error' ? 'alertCircle' : kind === 'caution' ? 'alertTriangle' : 'info';
  return (
    `<div class="notice${kind ? ` notice-${kind}` : ''}">` +
    `<span class="notice-icon">${icon(mark, 'ic ic-md')}</span>` +
    `<span>${title ? `<b class="notice-title">${esc(title)}</b>` : ''}${esc(message)}</span>` +
    `</div>`
  );
}
