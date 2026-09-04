/**
 * Rate AI — Firestore adapter
 *
 * The only module that knows about Firebase. Field names and collection names
 * match the live `rateai-7ace5` project exactly and must not be renamed:
 *   tools   { name, domain, description, category, company, website, pricing[],
 *             avgRating, totalRatings, totalReviews, ratingDistribution{1..5},
 *             verified, founded, twitter, createdAt, updatedAt }
 *   reviews { toolDomain, rating, title, body, userName, userPhoto, likes,
 *             createdAt }
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* A Firebase web config is a set of public client identifiers, not a secret. */
const firebaseConfig = {
  apiKey: 'AIzaSyBVe0utmbeYpX5ESnDWsaQuLAe6dpw7_Sc',
  authDomain: 'rateai-7ace5.firebaseapp.com',
  databaseURL: 'https://rateai-7ace5-default-rtdb.firebaseio.com',
  projectId: 'rateai-7ace5',
  storageBucket: 'rateai-7ace5.firebasestorage.app',
  messagingSenderId: '484707160070',
  appId: '1:484707160070:web:afe191006ea83fba0bb387',
  measurementId: 'G-PJKKWEHELL',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ==========================================================================
   Typed errors, so the interface can say what actually went wrong instead of
   showing one generic failure message for every cause. The definitions live in
   errors.js so the store can use them without loading this module.
   ========================================================================== */

import { DataError, classifyError as classify, assertOnline } from './errors.js';

export { DataError };

/* ==========================================================================
   Shaping
   ========================================================================== */

function normaliseDist(raw) {
  const out = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (raw && typeof raw === 'object') {
    for (let s = 1; s <= 5; s += 1) {
      const n = parseInt(raw[String(s)] ?? raw[s], 10);
      out[s] = Number.isFinite(n) && n > 0 ? n : 0;
    }
  }
  return out;
}

function shapeTool(docSnap) {
  const data = docSnap.data() ?? {};
  const domain = String(data.domain || docSnap.id || '').trim().toLowerCase();
  return {
    /* docId is kept separately from domain: the two are equal for tools we
       create, but seeded documents may use an auto-generated id. Losing it is
       what previously made rating updates fail silently. */
    docId: docSnap.id,
    domain,
    /* The stored spelling, case intact. `domain` is lowercased because it
       becomes a URL and a cache key, but reviews were filed under whatever
       the tool document says, so that string has to survive the read. */
    domainRaw: String(data.domain || docSnap.id || '').trim(),
    name: data.name || docSnap.id,
    description: data.description || '',
    category: data.category || 'Other',
    company: data.company || '',
    website: data.website || (domain ? `https://${domain}` : ''),
    pricing: Array.isArray(data.pricing)
      ? data.pricing.filter(Boolean)
      : data.pricing
        ? [data.pricing]
        : [],
    avgRating: Number.isFinite(Number(data.avgRating)) ? Number(data.avgRating) : 0,
    totalRatings: parseInt(data.totalRatings, 10) || 0,
    totalReviews: parseInt(data.totalReviews, 10) || 0,
    ratingDistribution: normaliseDist(data.ratingDistribution),
    verified: Boolean(data.verified),
    founded: data.founded || null,
    twitter: data.twitter || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

function shapeReview(docSnap) {
  const data = docSnap.data() ?? {};
  return {
    id: docSnap.id,
    toolDomain: data.toolDomain || '',
    rating: Math.min(5, Math.max(1, parseInt(data.rating, 10) || 5)),
    title: data.title || '',
    body: data.body || '',
    userName: data.userName || 'Anonymous',
    userPhoto: data.userPhoto || '',
    likes: parseInt(data.likes, 10) || 0,
    createdAt: data.createdAt || null,
  };
}

/* ==========================================================================
   Reads
   ========================================================================== */

/** Every tool in the catalogue. */
export async function getAllTools() {
  assertOnline();
  try {
    const snapshot = await getDocs(collection(db, 'tools'));
    const tools = [];
    snapshot.forEach((docSnap) => {
      const tool = shapeTool(docSnap);
      if (tool.domain) tools.push(tool);
    });
    return tools;
  } catch (error) {
    throw classify(error);
  }
}

/** A single tool, for a direct visit to a tool URL. */
export async function getToolByDomain(domain) {
  assertOnline();
  const key = String(domain ?? '').trim().toLowerCase();
  if (!key) return null;
  try {
    /* The common case: the document id is the domain. */
    const direct = await getDoc(doc(db, 'tools', key));
    if (direct.exists()) return shapeTool(direct);

    /* Otherwise find it by field. */
    const found = await getDocs(
      query(collection(db, 'tools'), where('domain', '==', key)),
    );
    let tool = null;
    found.forEach((docSnap) => {
      if (!tool) tool = shapeTool(docSnap);
    });
    return tool;
  } catch (error) {
    throw classify(error);
  }
}

/**
 * Reviews for one tool, newest first.
 *
 * `spellings` exists because Firestore equality is case-sensitive and this
 * project lowercases domains where the old site did not. A review filed against
 * "OpenAI.com" does not match a query for "openai.com", and the failure mode is
 * the worst kind: no error, just a tool page that says nobody has reviewed it.
 * So the caller passes any other spelling it has seen — in practice the tool
 * document's own `domain` field — and both are matched in one query.
 */
export async function getReviewsForTool(toolDomain, spellings = []) {
  assertOnline();
  const key = String(toolDomain ?? '').trim().toLowerCase();
  if (!key) return [];

  const candidates = [key];
  for (const spelling of spellings) {
    const value = String(spelling ?? '').trim();
    /* `in` takes up to ten values, which is nine more than this ever needs. */
    if (value && !candidates.includes(value) && candidates.length < 10) {
      candidates.push(value);
    }
  }

  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'reviews'),
        candidates.length > 1
          ? where('toolDomain', 'in', candidates)
          : where('toolDomain', '==', key),
      ),
    );
    const reviews = [];
    snapshot.forEach((docSnap) => reviews.push(shapeReview(docSnap)));
    return sortByNewest(reviews);
  } catch (error) {
    throw classify(error);
  }
}

/** Latest reviews across all tools, for the activity feed. */
export async function getRecentReviews(count = 6) {
  assertOnline();
  try {
    const snapshot = await getDocs(
      query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(count)),
    );
    const reviews = [];
    snapshot.forEach((docSnap) => reviews.push(shapeReview(docSnap)));
    if (reviews.length) return reviews;
  } catch {
    /* An ordered query needs createdAt on every document and an index. If
       either is missing, fall through to sorting a plain read on the client —
       the collection is small enough that this is cheap. */
  }
  try {
    const snapshot = await getDocs(collection(db, 'reviews'));
    const reviews = [];
    snapshot.forEach((docSnap) => reviews.push(shapeReview(docSnap)));
    return sortByNewest(reviews).slice(0, count);
  } catch (error) {
    throw classify(error);
  }
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function sortByNewest(list) {
  return list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

/* ==========================================================================
   Writes
   ========================================================================== */

/**
 * Publish a review and fold its rating into the tool's aggregates.
 *
 * Two things are handled carefully here:
 *
 * 1. The average is updated incrementally from the stored average and count,
 *    not recomputed from ratingDistribution. Seeded tools carry a real average
 *    over thousands of ratings while their distribution map is empty, so
 *    deriving the average from the distribution alone would replace a 4.8 over
 *    12,000 ratings with 5.0 over 1.
 * 2. Read and write happen inside a transaction, so two reviews submitted at
 *    the same moment cannot overwrite each other's counts.
 */
export async function submitReviewToFirestore({
  toolDomain,
  toolId,
  rating,
  title,
  body,
  userName,
  userPhoto,
}) {
  assertOnline();
  const domain = String(toolDomain ?? '').trim().toLowerCase();
  const stars = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

  try {
    const review = {
      toolDomain: domain,
      rating: stars,
      title: String(title ?? '').trim(),
      body: String(body ?? '').trim(),
      userName: String(userName ?? '').trim() || 'Anonymous',
      likes: 0,
      createdAt: serverTimestamp(),
    };
    /* Only stored when supplied — the interface generates avatars locally. */
    if (userPhoto) review.userPhoto = userPhoto;

    const docRef = await addDoc(collection(db, 'reviews'), review);

    const aggregate = await updateToolAggregates(toolId || domain, domain, stars);
    return { success: true, id: docRef.id, aggregate };
  } catch (error) {
    throw classify(error);
  }
}

async function resolveToolRef(toolId, domain) {
  const byId = doc(db, 'tools', toolId);
  const snap = await getDoc(byId);
  if (snap.exists()) return byId;

  const found = await getDocs(
    query(collection(db, 'tools'), where('domain', '==', domain)),
  );
  let ref = null;
  found.forEach((d) => {
    if (!ref) ref = d.ref;
  });
  return ref;
}

/**
 * Returns the tool's new aggregate figures so the interface can update without
 * a refetch. Resolves to null if the tool document could not be found — the
 * review itself is already saved either way.
 */
async function updateToolAggregates(toolId, domain, stars) {
  let ref;
  try {
    ref = await resolveToolRef(toolId, domain);
  } catch {
    return null;
  }
  if (!ref) return null;

  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return null;
      const data = snap.data() ?? {};

      const prevTotal = parseInt(data.totalRatings, 10) || 0;
      const prevAvg = Number(data.avgRating) || 0;
      const dist = normaliseDist(data.ratingDistribution);
      dist[stars] += 1;

      const totalRatings = prevTotal + 1;
      const totalReviews = (parseInt(data.totalReviews, 10) || 0) + 1;
      const avgRating =
        prevTotal > 0
          ? Number(((prevAvg * prevTotal + stars) / totalRatings).toFixed(2))
          : stars;

      const next = {
        ratingDistribution: { 1: dist[1], 2: dist[2], 3: dist[3], 4: dist[4], 5: dist[5] },
        totalRatings,
        totalReviews,
        avgRating,
        updatedAt: serverTimestamp(),
      };
      tx.update(ref, next);
      return { ...next, ratingDistribution: dist, updatedAt: null };
    });
  } catch {
    /* The review is saved; only the cached aggregate is stale. */
    return null;
  }
}

/** Add a tool to the catalogue. The document id is its domain. */
export async function submitNewToolToFirestore(input) {
  assertOnline();
  const domain = String(input.domain ?? '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[/?#].*$/, '');

  if (!domain) throw new DataError('unknown', 'A domain is required.');

  try {
    const ref = doc(db, 'tools', domain);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new DataError(
        'duplicate',
        `${shapeTool(existing).name} is already listed.`,
      );
    }

    const record = {
      name: String(input.name ?? '').trim(),
      domain,
      description: String(input.description ?? '').trim(),
      category: input.category || 'Other',
      company: String(input.company ?? '').trim() || String(input.name ?? '').trim(),
      website: `https://${domain}`,
      pricing: Array.isArray(input.pricing)
        ? input.pricing
        : [input.pricing || 'Freemium'],
      avgRating: 0,
      totalRatings: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verified: false,
      founded: input.founded ? parseInt(input.founded, 10) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, record);

    return {
      success: true,
      id: domain,
      data: { ...record, docId: domain, createdAt: null, updatedAt: null },
    };
  } catch (error) {
    if (error instanceof DataError) throw error;
    throw classify(error);
  }
}

export { db };
