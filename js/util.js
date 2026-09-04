/**
 * Rate AI — Utilities
 * Pure helpers. Nothing here touches the network or the DOM.
 */

/* ==========================================================================
   Escaping
   Everything that reaches innerHTML goes through one of these first. Review
   text, tool names and domains are all reader-supplied, so treating them as
   trusted markup is how a rating site becomes a script-injection vector.
   ========================================================================== */

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape for use in element text or a quoted attribute value. */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/**
 * Escape for a URL used in href/src. Blocks javascript: and data: schemes,
 * which would otherwise survive plain HTML escaping.
 */
export function escUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^(?:javascript|data|vbscript|file):/i.test(raw.replace(/\s/g, ''))) return '';
  return esc(raw);
}

/* ==========================================================================
   Numbers
   ========================================================================== */

/** 1234 -> "1.2k", 1200000 -> "1.2M". Whole numbers stay whole. */
export function formatCount(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return '0';
  if (num >= 1_000_000) return trimZero(num / 1_000_000) + 'M';
  if (num >= 1_000) return trimZero(num / 1_000) + 'k';
  return String(Math.round(num));
}

function trimZero(n) {
  return n.toFixed(1).replace(/\.0$/, '');
}

/** Full thousands separators, for places where precision matters. */
export function formatExact(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('en-US');
}

/** A score always shows one decimal place so a column of them aligns. */
export function formatScore(n) {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num.toFixed(1);
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** Correct English for a count, without a stray "(s)". */
export function plural(n, one, many) {
  return Number(n) === 1 ? one : many;
}

/* ==========================================================================
   Dates
   Firestore hands back {seconds}, an ISO string, or nothing at all.
   ========================================================================== */

export function toDate(value) {
  if (!value) return null;
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value) {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** "3 days ago". Falls back to an absolute date beyond a month. */
export function timeAgo(value) {
  const d = toDate(value);
  if (!d) return '';
  const secs = Math.round((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} ${plural(mins, 'minute', 'minutes')} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} ${plural(hrs, 'hour', 'hours')} ago`;
  const days = Math.round(hrs / 24);
  if (days < 31) return `${days} ${plural(days, 'day', 'days')} ago`;
  return formatDate(value);
}

/* ==========================================================================
   Text
   ========================================================================== */

export function initial(name) {
  const s = String(name ?? '').trim();
  return s ? s.charAt(0).toUpperCase() : '?';
}

/** Strips scheme, www and any path so domains display consistently. */
export function cleanDomain(input) {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[/?#].*$/, '')
    .replace(/\.$/, '');
}

export function isValidDomain(input) {
  const d = cleanDomain(input);
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d);
}

/* ==========================================================================
   Rating helpers
   ========================================================================== */

/** Star geometry, mirrored by .stars in components.css. */
export const STAR_SIZES = {
  sm: { size: 14, gap: 2 },
  md: { size: 16, gap: 2 },
  lg: { size: 20, gap: 3 },
};

/**
 * Exact pixel width for the filled star layer. Percentages are wrong here:
 * the gaps between stars are not part of any star, so 4.5/5 is not 90%.
 */
export function starFillPx(rating, sizeKey = 'sm') {
  const { size, gap } = STAR_SIZES[sizeKey] ?? STAR_SIZES.sm;
  const value = clamp(Number(rating) || 0, 0, 5);
  const whole = Math.floor(value);
  const frac = value - whole;
  return whole * (size + gap) + frac * size;
}

/** Normalises whatever shape the distribution arrived in to counts 1..5. */
export function normaliseDistribution(dist) {
  const out = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (!dist || typeof dist !== 'object') return out;
  for (let star = 1; star <= 5; star += 1) {
    const raw = dist[String(star)] ?? dist[star];
    const n = parseInt(raw, 10);
    out[star] = Number.isFinite(n) && n > 0 ? n : 0;
  }
  return out;
}

export function distributionTotal(dist) {
  const d = normaliseDistribution(dist);
  return d[1] + d[2] + d[3] + d[4] + d[5];
}

/**
 * Distribution rows for a histogram, largest star first.
 *
 * Percentages are computed against the sum of the map, not the tool's stored
 * rating count. Seeded tools carry a rating total far larger than their recorded
 * breakdown, and scaling to the stored total would draw five nearly-empty bars
 * on a tool that has two recorded ratings out of twelve thousand.
 */
export function distributionRows(tool) {
  const dist = normaliseDistribution(tool.ratingDistribution);
  const total = distributionTotal(dist);
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: dist[stars],
    percent: total ? (dist[stars] / total) * 100 : 0,
  }));
}

/** True when the breakdown cannot account for every stored rating. */
export function distributionIsPartial(tool) {
  const mapTotal = distributionTotal(tool.ratingDistribution);
  const total = Number(tool.totalRatings) || 0;
  return total > 0 && mapTotal < total;
}

/* ==========================================================================
   URLs
   ========================================================================== */

export function faviconUrl(domain, size = 64) {
  const d = cleanDomain(domain);
  if (!d) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=${size}`;
}

export function slugify(text) {
  return String(text ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseToolSlug(rawSlug) {
  if (!rawSlug) return '';
  const slug = decodeURIComponent(String(rawSlug)).replace(/^\/+|\/+$/g, '').trim().toLowerCase();

  const lastHyphen = slug.lastIndexOf('-');
  if (lastHyphen !== -1) {
    const after = slug.slice(lastHyphen + 1);
    if (after.includes('.')) {
      return cleanDomain(after);
    }
  }

  return cleanDomain(slug);
}

export function toolSlug(domain, name = '') {
  let d = '';
  let n = '';
  if (typeof domain === 'object' && domain !== null) {
    n = domain.name ?? '';
    d = domain.domain ?? '';
  } else {
    d = String(domain ?? '');
    n = String(name ?? '');
  }
  d = cleanDomain(d);
  const namePart = slugify(n || d.split('.')[0] || 'tool');
  return d ? `${namePart}-${d}` : namePart;
}

export function toolHref(domain, name = '') {
  let d = '';
  let n = '';
  if (typeof domain === 'object' && domain !== null) {
    n = domain.name ?? '';
    d = domain.domain ?? '';
  } else {
    d = String(domain ?? '');
    n = String(name ?? '');
  }
  d = cleanDomain(d);
  if (!d) return 'explore.html';

  if (typeof window !== 'undefined' && window.location?.protocol === 'file:') {
    return `tool.html?d=${encodeURIComponent(d)}`;
  }

  const slug = toolSlug(d, n);
  return `/reviewe/${slug}/`;
}

export function exploreHref(params = {}) {
  const q = new URLSearchParams();
  if (params.q) q.set('q', params.q);
  if (params.category && params.category !== 'All') q.set('category', params.category);
  if (params.sort && params.sort !== 'rating') q.set('sort', params.sort);
  if (params.view && params.view !== 'ledger') q.set('view', params.view);
  const s = q.toString();
  return s ? `explore.html?${s}` : 'explore.html';
}

export function compareHref(a, b) {
  const q = new URLSearchParams();
  if (a) q.set('a', cleanDomain(a));
  if (b) q.set('b', cleanDomain(b));
  const s = q.toString();
  return s ? `compare.html?${s}` : 'compare.html';
}

/**
 * The submission form, optionally prefilled. Used wherever a reader has just
 * looked for something that is not listed — the search they typed is the best
 * guess at the name, and a missing tool page already knows the domain.
 */
export function submitHref({ domain = '', name = '' } = {}) {
  const q = new URLSearchParams();
  if (domain) q.set('domain', cleanDomain(domain));
  if (name) q.set('name', String(name).trim());
  const s = q.toString();
  return s ? `submit.html?${s}` : 'submit.html';
}

export function getParams() {
  return new URLSearchParams(window.location.search);
}

/** Rewrites the query string without adding a history entry. */
export function replaceParams(entries) {
  const url = new URL(window.location.href);
  Object.entries(entries).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  });
  window.history.replaceState({}, '', url);
}

/* ==========================================================================
   Accessible descriptions
   ========================================================================== */

/**
 * Adds or removes one id from an element's aria-describedby, keeping whatever
 * else is in there.
 *
 * Fields in this project already point at their hint text, so assigning the
 * attribute wholesale would silently drop the hint the moment a validation
 * message arrived — and put it back only if someone remembered to. An error
 * announced by role="alert" is heard once, as it appears; attaching it to the
 * control is what makes it readable again on the way back to the field.
 */
export function describedBy(element, id, on) {
  if (!element || !id) return;
  const ids = (element.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  const next = on ? [...new Set([...ids, id])] : ids.filter((existing) => existing !== id);
  if (next.length) element.setAttribute('aria-describedby', next.join(' '));
  else element.removeAttribute('aria-describedby');
}

/* ==========================================================================
   Motion
   ========================================================================== */

/**
 * Brings an element into view, and is the only place in the project allowed to
 * ask for a smooth scroll.
 *
 * The stylesheet sets scroll-behavior: auto under prefers-reduced-motion, but
 * that governs scrolling the browser initiates — an explicit behavior: 'smooth'
 * passed from script overrides it and animates anyway. So the preference has to
 * be read here, or a reader who asked for less motion gets a 600px glide every
 * time a form succeeds. tools/verify.mjs keeps the literal out of every other
 * module.
 */
export function reveal(element, block = 'center') {
  if (!element) return;
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  element.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block });
}

/* ==========================================================================
   Timing
   ========================================================================== */

export function debounce(fn, wait = 160) {
  let timer;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

