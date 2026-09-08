/**
 * PC Remote — Icon System
 * 24x24 SVG grid, 1.5px stroke weight, round caps and joins, currentColor.
 */

const PATHS = {
  // PC Remote brand logo icon: Desktop computer + Phone controller connection
  pcRemoteLogo:
    '<rect x="2" y="3" width="14" height="10" rx="1.5"/><path d="M6 13v3M12 13v3M4 16h10"/>' +
    '<rect x="15" y="9" width="7" height="12" rx="1.5"/><circle cx="18.5" cy="18" r="0.75" fill="currentColor"/>' +
    '<path d="M12 6.5a4 4 0 0 1 4 4" stroke-dasharray="2 2"/>',

  windows:
    '<path d="M3 5.5l7.5-1v7l-7.5.2v-6.2zm0 8.2l7.5.2v7l-7.5-1v-6.2zm8.5-9.3l9.5-1.4v8.5l-9.5.2v-7.3zm0 9.5l9.5.2v8.5l-9.5-1.4v-7.3z"/>',

  android:
    '<rect x="5" y="8" width="14" height="12" rx="2"/>' +
    '<path d="M9 4.5l-1.5-2M15 4.5l1.5-2M5 14H3M21 14h-2M9 12h.01M15 12h.01"/>' +
    '<circle cx="9" cy="12" r="0.5" fill="currentColor"/><circle cx="15" cy="12" r="0.5" fill="currentColor"/>',

  wifi:
    '<path d="M12 18h.01M5 12.5a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/>',

  usb:
    '<path d="M12 2v13M9 5l3-3 3 3M12 15a2.5 2.5 0 1 0 2.5 2.5"/>' +
    '<path d="M14.5 17.5H18a1.5 1.5 0 0 0 1.5-1.5V11M9.5 17.5H6A1.5 1.5 0 0 1 4.5 16V9.5"/>' +
    '<rect x="3" y="6.5" width="3" height="3" rx="0.5"/><circle cx="19.5" cy="9.5" r="1.5"/>',

  touchpad:
    '<rect x="3" y="4" width="18" height="16" rx="2"/>' +
    '<path d="M12 14v6M3 14h18"/>' +
    '<path d="M8 8l2.5 2.5M13.5 10.5L16 8"/>',

  keyboard:
    '<rect x="2" y="5" width="20" height="14" rx="2"/>' +
    '<path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 13h6"/>',

  monitor:
    '<rect x="3" y="4" width="18" height="12" rx="2"/>' +
    '<path d="M8 20h8M12 16v4"/>',

  media:
    '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>' +
    '<path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>',

  shield:
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' +
    '<path d="M9 12l2 2 4-4"/>',

  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',

  check:
    '<polyline points="20 6 9 17 4 12"/>',

  checkCircle:
    '<circle cx="12" cy="12" r="9"/><path d="M8 12.4l3 3 5.2-6"/>',

  chevronDown:
    '<path d="M6 9l6 6 6-6"/>',

  chevronRight:
    '<path d="M9 18l6-6-6-6"/>',

  arrowRight:
    '<path d="M5 12h14M12 5l7 7-7 7"/>',

  sun:
    '<circle cx="12" cy="12" r="4"/>' +
    '<path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2' +
    'M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/>',

  moon:
    '<path d="M20.5 13.3A8.5 8.5 0 1 1 10.7 3.5a6.6 6.6 0 0 0 9.8 9.8z"/>',

  menu:
    '<path d="M4 6h16M4 12h16M4 18h16"/>',

  close:
    '<path d="M6 6l12 12M18 6L6 18"/>',

  user:
    '<circle cx="12" cy="8" r="4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',

  info:
    '<circle cx="12" cy="12" r="9"/><path d="M12 16.5V11"/>' +
    '<circle cx="12" cy="7.75" r="1" fill="currentColor" stroke="none"/>',

  externalLink:
    '<path d="M10 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4"/>' +
    '<path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/>',

  play:
    '<polygon points="5 3 19 12 5 21 5 3"/>',

  power:
    '<path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/>',
};

/**
 * Returns an inline SVG string.
 * @param {string} name  key from PATHS
 * @param {string} [cls] size class, e.g. "ic ic-lg". Defaults to "ic".
 */
export function icon(name, cls = 'ic') {
  const body = PATHS[name];
  if (!body) {
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
