/**
 * Rate AI — Guidelines Page
 */

import { initShell } from '../shell.js';
import { isMock } from '../store.js';
import { mountNavAuth } from '../auth.js';
import { applySEO, siteSchema } from '../seo.js';

initShell({ isMock });
mountNavAuth();

applySEO({
  title: 'Guidelines for Reviewers — Rate AI Community Standards',
  description: 'Guidelines for Reviewers on Rate AI: rules for constructive feedback, authentic ratings, community standards, and prohibited behavior.',
  canonicalPath: '/guidelines',
  jsonLd: siteSchema(),
});

export function initPage() {}
