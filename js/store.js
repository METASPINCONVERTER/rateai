/**
 * Rate AI — Data store
 *
 * One place that decides where data comes from, caches it for the session, and
 * derives the shapes the pages need. Pages never import js/firebase.js directly.
 *
 * Why a cache: this is a multi-page site, so every click is a fresh document.
 * Without it, moving from the leaderboard to a tool page and back would refetch
 * the whole catalogue twice and flash skeletons each time. sessionStorage is the
 * right scope — fresh on a new tab, warm while the reader browses.
 *
 * Offline mode: append ?mock=1 to any URL. Sample data is served instead of
 * Firestore for the rest of the session, which makes every state — including
 * loading, empty and error — reachable without a network.
 */

import { DataError } from './errors.js';

import {
  cleanDomain,
  distributionRows,
  distributionIsPartial,
  normaliseDistribution,
  toDate,
} from './util.js';

export { DataError };
export { distributionRows, distributionIsPartial };

/* ==========================================================================
   Mode
   ========================================================================== */

const MOCK_KEY = 'rateai.mock';
const CACHE_KEY = 'rateai.tools.v1';
const CACHE_TTL = 5 * 60 * 1000;

function readMockFlag() {
  try {
    const param = new URLSearchParams(window.location.search).get('mock');
    if (param === '1' || param === 'true') {
      sessionStorage.setItem(MOCK_KEY, '1');
      return true;
    }
    if (param === '0' || param === 'false') {
      sessionStorage.removeItem(MOCK_KEY);
      return false;
    }
    return sessionStorage.getItem(MOCK_KEY) === '1';
  } catch {
    return false;
  }
}

export const isMock = readMockFlag();

/* Both data sources load on demand. The Firestore adapter pulls the Firebase SDK
   over the network, so sample mode must never import it; and a production page
   must never ship the sample data. */
let fbPromise = null;
function fb() {
  if (!fbPromise) fbPromise = import('./firebase.js');
  return fbPromise;
}

let mockPromise = null;
function mock() {
  if (!mockPromise) mockPromise = import('./dev/mock-data.js');
  return mockPromise;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ==========================================================================
   In-memory + session cache
   ========================================================================== */

const memory = {
  tools: null,
  reviews: new Map(),
  recent: null,
  /* lowercase domain -> the spelling the database actually stores. See
     domainSpellings below. */
  spellings: new Map(),
};

/**
 * Records how the database spells a domain, so a review query can match the
 * stored casing as well as the lowercase form this project uses everywhere else.
 */
function noteSpellings(tools) {
  for (const tool of tools) {
    if (tool?.domain && tool.domainRaw && tool.domainRaw !== tool.domain) {
      memory.spellings.set(tool.domain, tool.domainRaw);
    }
  }
  return tools;
}

function domainSpellings(key) {
  const stored = memory.spellings.get(key);
  return stored ? [stored] : [];
}

function readSessionCache() {
  if (isMock) return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tools)) return null;
    if (Date.now() - parsed.at > CACHE_TTL) return null;
    return parsed.tools;
  } catch {
    return null;
  }
}

function writeSessionCache(tools) {
  if (isMock) return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), tools }));
  } catch {
    /* Quota or private mode. The in-memory copy still serves this page. */
  }
}

/** Drops every cached read. Used by the retry action on error states. */
export function invalidate() {
  memory.tools = null;
  memory.reviews.clear();
  memory.recent = null;
  memory.spellings.clear();
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* nothing to clear */
  }
}

/* ==========================================================================
   Reads
   ========================================================================== */

/**
 * The whole catalogue. Resolves from memory, then session cache, then network.
 * Throws a DataError so callers can render a state that matches the cause.
 */
export async function loadTools({ force = false } = {}) {
  if (!force && memory.tools) return memory.tools;

  if (!force) {
    const cached = readSessionCache();
    if (cached) {
      memory.tools = cached;
      return cached;
    }
  }

  if (isMock) {
    const { MOCK_TOOLS } = await mock();
    await wait(320); // long enough to see the skeletons
    memory.tools = MOCK_TOOLS.map((t) => ({ ...t }));
    return memory.tools;
  }

  const { getAllTools } = await fb();
  const tools = await getAllTools();
  memory.tools = noteSpellings(tools);
  writeSessionCache(tools);
  return tools;
}

/**
 * One tool. Uses the cached catalogue when it is already loaded, so arriving
 * from a listing page costs nothing; falls back to a single-document read for a
 * cold visit to a tool URL.
 */
export async function loadTool(domain) {
  const key = cleanDomain(domain);
  if (!key) return null;

  const cached = memory.tools ?? readSessionCache();
  if (cached) {
    memory.tools = cached;
    const hit = cached.find((t) => t.domain === key);
    if (hit) return hit;
  }

  if (isMock) {
    const { MOCK_TOOLS } = await mock();
    await wait(260);
    const hit = MOCK_TOOLS.find((t) => t.domain === key);
    return hit ? { ...hit } : null;
  }

  const { getToolByDomain } = await fb();
  const tool = await getToolByDomain(key);
  if (tool) noteSpellings([tool]);
  return tool;
}

export async function loadReviews(domain) {
  const key = cleanDomain(domain);
  if (!key) return [];
  if (memory.reviews.has(key)) return memory.reviews.get(key);

  let reviews;
  if (isMock) {
    const { MOCK_REVIEWS } = await mock();
    await wait(280);
    reviews = MOCK_REVIEWS.filter((r) => cleanDomain(r.toolDomain) === key).map((r) => ({ ...r }));
  } else {
    const { getReviewsForTool } = await fb();
    reviews = await getReviewsForTool(key, domainSpellings(key));
  }

  memory.reviews.set(key, reviews);
  return reviews;
}

export async function loadRecentReviews(count = 5) {
  if (memory.recent) return memory.recent.slice(0, count);

  let reviews;
  if (isMock) {
    const { MOCK_REVIEWS } = await mock();
    await wait(300);
    reviews = MOCK_REVIEWS.map((r) => ({ ...r }));
  } else {
    const { getRecentReviews } = await fb();
    reviews = await getRecentReviews(Math.max(count, 8));
  }

  memory.recent = reviews;
  return reviews.slice(0, count);
}

/* ==========================================================================
   Writes
   ========================================================================== */

/**
 * Publishes a review, then folds the result back into the cache so the page can
 * update immediately and a later navigation shows the same numbers.
 */
export async function publishReview({ tool, rating, title, body, userName }) {
  const stars = Math.min(5, Math.max(1, parseInt(rating, 10) || 0));
  if (!tool?.domain) throw new DataError('unknown', 'No tool selected.');
  if (!stars) throw new DataError('unknown', 'A rating is required.');

  let result;
  if (isMock) {
    await wait(520);
    result = {
      success: true,
      id: `mock-${Date.now()}`,
      aggregate: nextAggregate(tool, stars),
    };
  } else {
    const { submitReviewToFirestore } = await fb();
    result = await submitReviewToFirestore({
      toolDomain: tool.domain,
      toolId: tool.docId || tool.domain,
      rating: stars,
      title,
      body,
      userName,
    });
  }

  const review = {
    id: result.id,
    toolDomain: tool.domain,
    rating: stars,
    title: String(title ?? '').trim(),
    body: String(body ?? '').trim(),
    userName: String(userName ?? '').trim() || 'Anonymous',
    userPhoto: '',
    likes: 0,
    createdAt: new Date().toISOString(),
  };

  /* Prepend to the cached list for this tool. */
  const existing = memory.reviews.get(tool.domain);
  if (existing) memory.reviews.set(tool.domain, [review, ...existing]);
  if (memory.recent) memory.recent = [review, ...memory.recent];

  /* Apply the new aggregate, or compute it locally if the write could not
     confirm one — a stale count is a worse lie than an estimate. */
  const aggregate = result.aggregate ?? nextAggregate(tool, stars);
  applyAggregate(tool.domain, aggregate);

  return { review, aggregate };
}

function nextAggregate(tool, stars) {
  const prevTotal = Number(tool.totalRatings) || 0;
  const prevAvg = Number(tool.avgRating) || 0;
  const dist = normaliseDistribution(tool.ratingDistribution);
  dist[stars] += 1;
  const totalRatings = prevTotal + 1;
  return {
    avgRating:
      prevTotal > 0
        ? Number(((prevAvg * prevTotal + stars) / totalRatings).toFixed(2))
        : stars,
    totalRatings,
    totalReviews: (Number(tool.totalReviews) || 0) + 1,
    ratingDistribution: dist,
  };
}

function applyAggregate(domain, aggregate) {
  if (!aggregate) return;
  const patch = {
    avgRating: aggregate.avgRating,
    totalRatings: aggregate.totalRatings,
    totalReviews: aggregate.totalReviews,
    ratingDistribution: normaliseDistribution(aggregate.ratingDistribution),
  };

  if (memory.tools) {
    memory.tools = memory.tools.map((t) =>
      t.domain === domain ? { ...t, ...patch } : t,
    );
    writeSessionCache(memory.tools);
  }
}

/** Adds a tool to the catalogue and to the cache. */
export async function publishTool(input) {
  const domain = cleanDomain(input.domain);

  if (isMock) {
    const tools = await loadTools();
    if (tools.some((t) => t.domain === domain)) {
      throw new DataError('duplicate', `${input.name} is already listed.`);
    }
    await wait(560);
    const created = {
      docId: domain,
      domain,
      name: String(input.name ?? '').trim(),
      description: String(input.description ?? '').trim(),
      category: input.category || 'Other',
      company: String(input.company ?? '').trim() || String(input.name ?? '').trim(),
      website: `https://${domain}`,
      pricing: Array.isArray(input.pricing) ? input.pricing : [input.pricing || 'Freemium'],
      avgRating: 0,
      totalRatings: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verified: false,
      founded: input.founded ? parseInt(input.founded, 10) : null,
      twitter: null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    memory.tools = [created, ...(memory.tools ?? [])];
    return { success: true, id: domain, tool: created };
  }

  const { submitNewToolToFirestore } = await fb();
  const result = await submitNewToolToFirestore({ ...input, domain });
  const created = { ...result.data, docId: result.id, domain };
  if (memory.tools) {
    memory.tools = [created, ...memory.tools];
    writeSessionCache(memory.tools);
  }
  return { success: true, id: result.id, tool: created };
}

/* ==========================================================================
   Derived views
   The pages ask for a shape, not for a loop. Keeping the sorting rules here
   means the leaderboard, explore and compare pages can never disagree about
   what "top rated" means.
   ========================================================================== */

export const SORTS = [
  { value: 'rating', label: 'Highest rated' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'newest', label: 'Recently added' },
];

/**
 * The categories a submission may choose. This is the original list the live
 * catalogue was built with, so it stays fixed rather than being derived from
 * whatever happens to be listed today — categoriesOf() covers that case, and it
 * returns nothing at all when the catalogue is empty.
 *
 * submit.html repeats these as <option>s so the form works before JS runs;
 * tools/verify.mjs checks the two lists still agree.
 */
export const CATEGORIES = [
  'Coding',
  'Chatbot',
  'Image',
  'Video',
  'Audio',
  'Productivity',
  'Search',
  'Copywriting',
  'Presentations',
  'Other',
];

/** The pricing tiers a submission may choose. Same contract as CATEGORIES. */
export const PRICING = ['Free', 'Freemium', 'Paid'];


/**
 * Ranking needs a floor on sample size, otherwise a single five-star review
 * outranks a tool with eighteen thousand ratings — the fastest way to make a
 * ratings site untrustworthy. Below the floor a tool still appears, just not at
 * the top: its score is pulled toward the catalogue mean in proportion to how
 * little evidence there is (a Bayesian average).
 */
export const RANK_FLOOR = 25;

export function catalogueMean(tools) {
  const rated = tools.filter((t) => t.totalRatings > 0);
  if (!rated.length) return 0;
  const sum = rated.reduce((acc, t) => acc + t.avgRating * t.totalRatings, 0);
  const count = rated.reduce((acc, t) => acc + t.totalRatings, 0);
  return count ? sum / count : 0;
}

export function rankScore(tool, mean) {
  const n = Number(tool.totalRatings) || 0;
  if (n <= 0) return -1; // unrated tools sort last, never first
  const avg = Number(tool.avgRating) || 0;
  return (n * avg + RANK_FLOOR * mean) / (n + RANK_FLOOR);
}

export function sortTools(tools, sortBy = 'rating') {
  const list = [...tools];
  switch (sortBy) {
    case 'reviews':
      return list.sort(
        (a, b) => b.totalRatings - a.totalRatings || b.avgRating - a.avgRating,
      );
    case 'name':
      return list.sort((a, b) =>
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
      );
    case 'newest':
      return list.sort((a, b) => {
        const at = toDate(a.createdAt)?.getTime() ?? 0;
        const bt = toDate(b.createdAt)?.getTime() ?? 0;
        return bt - at || a.name.localeCompare(b.name);
      });
    case 'rating':
    default: {
      const mean = catalogueMean(list);
      return list.sort(
        (a, b) =>
          rankScore(b, mean) - rankScore(a, mean) ||
          b.totalRatings - a.totalRatings ||
          a.name.localeCompare(b.name),
      );
    }
  }
}

/** Substring match across the fields a reader would actually type. */
export function searchTools(tools, queryText) {
  const q = String(queryText ?? '').trim().toLowerCase();
  if (!q) return tools;
  const terms = q.split(/\s+/).filter(Boolean);
  return tools.filter((tool) => {
    const haystack = [tool.name, tool.domain, tool.category, tool.company, tool.description]
      .join(' ')
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export function filterTools(tools, { category = 'All', query = '' } = {}) {
  let list = tools;
  if (category && category !== 'All') list = list.filter((t) => t.category === category);
  return searchTools(list, query);
}

/** Categories with counts, busiest first. */
export function categoriesOf(tools) {
  const counts = new Map();
  tools.forEach((tool) => {
    const key = tool.category || 'Other';
    const entry = counts.get(key) ?? { name: key, count: 0, ratings: 0 };
    entry.count += 1;
    entry.ratings += Number(tool.totalRatings) || 0;
    counts.set(key, entry);
  });
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

/** Headline figures for the home page metadata line. */
export function catalogueStats(tools) {
  const ratings = tools.reduce((acc, t) => acc + (Number(t.totalRatings) || 0), 0);
  const reviews = tools.reduce((acc, t) => acc + (Number(t.totalReviews) || 0), 0);
  return {
    tools: tools.length,
    categories: categoriesOf(tools).length,
    ratings,
    reviews,
  };
}

/** Top of the leaderboard, rated tools only. */
export function leaderboard(tools, count = 8) {
  const rated = tools.filter((t) => t.totalRatings > 0);
  return sortTools(rated, 'rating').slice(0, count);
}

/**
 * "Gaining attention" — a share-of-reviews signal, not a fabricated trend line.
 * Tools whose review count is high relative to their rating count are the ones
 * people are actively writing about right now.
 */
export function gainingAttention(tools, count = 4) {
  return tools
    .filter((t) => t.totalReviews > 0)
    .map((tool) => ({
      tool,
      signal: tool.totalReviews / Math.max(tool.totalRatings, 1),
    }))
    .sort((a, b) => b.signal - a.signal || b.tool.totalReviews - a.tool.totalReviews)
    .slice(0, count)
    .map((entry) => entry.tool);
}

/** Tools listed but not yet rated — the honest "needs your verdict" shelf. */
export function awaitingRatings(tools, count = 4) {
  return tools.filter((t) => t.totalRatings === 0).slice(0, count);
}

/** Attaches the tool record to each review so a feed can link to it. */
export function withTools(reviews, tools) {
  const byDomain = new Map(tools.map((t) => [t.domain, t]));
  /* Through cleanDomain, not raw: a review whose toolDomain is stored with a
     capital letter would otherwise miss the map and be dropped from the feed
     by the filter below, with nothing to show that it happened. */
  return reviews
    .map((review) => ({ review, tool: byDomain.get(cleanDomain(review.toolDomain)) ?? null }))
    .filter((entry) => entry.tool !== null);
}

/**
 * Distribution percentages, computed against the real rating total rather than
 * the sum of the map. Seeded tools carry a rating count far larger than their
 * recorded distribution, and scaling to the map alone would draw five full bars
 * on a tool with two recorded ratings out of twelve thousand.
 *
 * The maths lives in util.js; re-exported above so pages have one import.
 */

/** Same category, best first, excluding the tool itself. */
export function relatedTools(tool, tools, count = 4) {
  return sortTools(
    tools.filter((t) => t.domain !== tool.domain && t.category === tool.category),
    'rating',
  ).slice(0, count);
}
