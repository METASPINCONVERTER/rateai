/**
 * Rate AI — Privacy Policy Page
 */

import { initShell } from '../shell.js';
import { isMock } from '../store.js';
import { mountNavAuth } from '../auth.js';
import { applySEO, siteSchema } from '../seo.js';

initShell({ isMock });
mountNavAuth();

applySEO({
  title: 'Privacy Policy — Data Protection & Privacy Rights | Rate AI',
  description: 'Rate AI privacy policy. Learn how we collect, store, and protect user information, rating submissions, and authentication data.',
  canonicalPath: '/privacy',
  jsonLd: siteSchema(),
});

export function initPage() {}
