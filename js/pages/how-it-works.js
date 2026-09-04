/**
 * Rate AI — How It Works Page
 */

import { initShell } from '../shell.js';
import { isMock } from '../store.js';
import { mountNavAuth } from '../auth.js';
import { applySEO, siteSchema } from '../seo.js';

initShell({ isMock });
mountNavAuth();

applySEO({
  title: 'How Rate AI Works — Community Ratings, Scoring & Curation',
  description: 'Discover how Rate AI works: authentic community reviews, Bayesian weighted ratings, developer-curated directories, and spam prevention.',
  canonicalPath: '/how-it-works',
  jsonLd: siteSchema(),
});

export function initPage() {}
