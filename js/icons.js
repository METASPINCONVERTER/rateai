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

  plus:  '<path d="M12 5v14M5 12h14"/>',

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
