/**
 * Rate AI — Not found
 *
 * Nothing to load. The shell is still needed for the theme toggle, the icons and
 * the footer year, so the page does not look half-built while it apologises.
 */

import { initShell } from '../shell.js';
import { isMock } from '../store.js';
import { mountNavAuth } from '../auth.js';
import { applySEO } from '../seo.js';

initShell({ isMock });
mountNavAuth();

applySEO({
  title: 'Page Not Found | Rate AI',
  description: 'The requested page could not be found on Rate AI.',
  canonicalPath: '/404',
});

export function initPage() {}
