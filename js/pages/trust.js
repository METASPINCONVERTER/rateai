/**
 * Rate AI — Trust Page
 */

import { initShell } from '../shell.js';
import { isMock } from '../store.js';
import { mountNavAuth } from '../auth.js';
import { applySEO, siteSchema } from '../seo.js';

initShell({ isMock });
mountNavAuth();

applySEO({
  title: 'Trust & Review Integrity — Rate AI Trust Report',
  description: 'Read the Rate AI Trust Report: our anti-fraud systems, verified Google authentication, editorial neutrality, and authentic review safeguards.',
  canonicalPath: '/trust',
  jsonLd: siteSchema(),
});

export function initPage() {}
