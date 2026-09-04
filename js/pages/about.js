/**
 * Rate AI — About Page
 */

import { initShell } from '../shell.js';
import { isMock } from '../store.js';
import { mountNavAuth } from '../auth.js';
import { applySEO, siteSchema } from '../seo.js';

initShell({ isMock });
mountNavAuth();

applySEO({
  title: 'About Rate AI — Neutral Community AI Ratings & Methodology',
  description: 'Rate AI is an independent, community-driven AI discovery platform. Learn about our editorial charter, Bayesian rating methodology, and neutrality pledge.',
  canonicalPath: '/about',
  jsonLd: siteSchema(),
});

export function initPage() {}
