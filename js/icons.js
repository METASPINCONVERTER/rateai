/**
 * Rate AI — Icons
 *
 * One icon system for the whole product: a 24x24 grid, 1.5px stroke (set in
 * CSS so it scales with the size class), round caps and joins, currentColor.
 * No emoji is used as an interface element anywhere in this codebase.
 *
 * Every icon defined here is used. If you remove the last usage of one,
 * remove the icon too — tools/verify.mjs reports unused entries.
 */

const PATHS = {
  search:
    '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5 21 21"/>',

  close:
    '<path d="M6 6l12 12M18 6L6 18"/>',

  checkCircle:
    '<circle cx="12" cy="12" r="9"/><path d="M8 12.4l3 3 5.2-6"/>',

  alertCircle:
    '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/>' +
    '<circle cx="12" cy="16.5" r="1" fill="currentColor" stroke="none"/>',

  alertTriangle:
    '<path d="M10.29 4.36 2.53 18a2 2 0 0 0 1.71 3h15.52a2 2 0 0 0 1.71-3L13.71 4.36a2 2 0 0 0-3.42 0z"/>' +
    '<path d="M12 9.5v4"/>' +
    '<circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>',

  info:
    '<circle cx="12" cy="12" r="9"/><path d="M12 16.5V11"/>' +
    '<circle cx="12" cy="7.75" r="1" fill="currentColor" stroke="none"/>',

  /* The only filled glyph in the set. Rating marks read as solid ink. */
  star:
    '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" ' +
    'fill="currentColor" stroke="none"/>',

  arrowRight:   '<path d="M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5"/>',
  arrowLeft:    '<path d="M19.5 12h-15M11 5.5 4.5 12l6.5 6.5"/>',

  externalLink:
    '<path d="M10 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4"/>' +
    '<path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/>',

  home:
    '<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/>' +
    '<path d="M9.5 20.5v-5.5h5v5.5"/>',

  compass:
    '<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z"/>',

  /* Two bars of different heights: side-by-side measurement */
  compare:
    '<rect x="4" y="9" width="6" height="11" rx="1.5"/>' +
    '<rect x="14" y="4" width="6" height="16" rx="1.5"/>',


  sun:
    '<circle cx="12" cy="12" r="4"/>' +
    '<path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2' +
    'M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/>',

  moon:
    '<path d="M20.5 13.3A8.5 8.5 0 1 1 10.7 3.5a6.6 6.6 0 0 0 9.8 9.8z"/>',

  grid:
    '<rect x="4" y="4" width="7" height="7" rx="1.5"/>' +
    '<rect x="13" y="4" width="7" height="7" rx="1.5"/>' +
    '<rect x="4" y="13" width="7" height="7" rx="1.5"/>' +
    '<rect x="13" y="13" width="7" height="7" rx="1.5"/>',

  rows:
    '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/>' +
    '<path d="M3.5 9.5h17M3.5 14.5h17"/>',

  shieldCheck:
    '<path d="M12 21.5c5-1.6 8.5-5.2 8.5-9.7V5.8L12 2.5 3.5 5.8v6c0 4.5 3.5 8.1 8.5 9.7z"/>' +
    '<path d="M8.75 11.9l2.35 2.35 4.15-4.5"/>',

  refresh:
    '<path d="M20.5 12a8.5 8.5 0 1 1-2.49-6.01"/><path d="M20.5 4.5v5h-5"/>',

  inbox:
    '<rect x="3.5" y="4" width="17" height="5" rx="1.5"/>' +
    '<path d="M5.5 9v9.5A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5V9"/>' +
    '<path d="M10 13h4"/>',

  message:
    '<path d="M20.5 12.2c0 3.9-3.8 7-8.5 7-1 0-2-.14-2.92-.4L4.5 20.5l1.15-3.13A6.75 6.75 0 0 1 3.5 12.2c0-3.87 3.8-7 8.5-7s8.5 3.13 8.5 7z"/>',

  user:
    '<circle cx="12" cy="8" r="4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',

  bookmark:
    '<path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z"/>',

  heart:
    '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',

  heartFilled:
    '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" stroke="none"/>',

  filter:
    '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',

  check:
    '<polyline points="20 6 9 17 4 12"/>',

  sparkles:
    '<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM19 15l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/>',

  logOut:
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',

  google:
    '<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" stroke="none"/>' +
    '<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" stroke="none"/>' +
    '<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="currentColor" stroke="none"/>' +
    '<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="currentColor" stroke="none"/>',

  chevronRight:
    '<path d="M9 18l6-6-6-6"/>',

  chevronDown:
    '<path d="M6 9l6 6 6-6"/>',

  chevronsUpDown:
    '<path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>',

  clock:
    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',

  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a14.5 14.5 0 0 0 0 18 14.5 14.5 0 0 0 0-18"/>',

  helpCircle:
    '<circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>',

  book:
    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
};

/**
 * Returns an inline SVG string.
 * @param {string} name  key from PATHS
 * @param {string} [cls] size class, e.g. "ic ic-lg". Defaults to "ic".
 */
export function icon(name, cls = 'ic') {
  const body = PATHS[name];
  if (!body) {
    // Loud in development, invisible to the reader in production.
    console.warn(`[icons] unknown icon: ${name}`);
    return '';
  }
  return (
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ` +
    `focusable="false">${body}</svg>`
  );
}

export const iconNames = Object.keys(PATHS);
