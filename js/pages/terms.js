/**
 * Rate AI — Terms of Service Page
 */

import { initShell } from '../shell.js';
import { isMock } from '../store.js';
import { mountNavAuth } from '../auth.js';
import { applySEO, siteSchema } from '../seo.js';

initShell({ isMock });
mountNavAuth();

applySEO({
  title: 'Terms of Service — Community Review Guidelines | Rate AI',
  description: 'Rate AI terms of service. Community review guidelines, neutrality standards, acceptable use policies, and intellectual property terms.',
  canonicalPath: '/terms',
  jsonLd: siteSchema(),
});

export function initPage() {}
