/**
 * Rate AI — FAQ Page
 */

import { initShell } from '../shell.js';
import { isMock } from '../store.js';
import { mountNavAuth } from '../auth.js';
import { applySEO, siteSchema } from '../seo.js';

initShell({ isMock });
mountNavAuth();

applySEO({
  title: 'Help Center & FAQ — Rate AI',
  description: 'Frequently asked questions and support for Rate AI: ratings, reviews, account management, curation, and how to evaluate AI tools.',
  canonicalPath: '/faq',
  jsonLd: siteSchema(),
});

export function initPage() {}
