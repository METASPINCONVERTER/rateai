/**
 * Rate AI — Page shell
 *
 * The navigation, footer and tab bar are written into each page as real markup
 * rather than injected here. That is deliberate: static markup cannot shift the
 * layout after paint, and the site stays navigable if a module fails to load.
 *
 * This module supplies the behaviour those pieces need — theme, toasts,
 * busy buttons — and nothing else.
 */

import { icon } from './icons.js';
import { esc } from './util.js';

/* ==========================================================================
   Theme
   Three states: light, dark, and auto (follow the system). The stored value is
   only ever 'light' or 'dark'; absence means auto.

   A small inline script in each page's <head> applies the stored value before
   first paint, so there is no flash of the wrong theme. This module keeps the
   toggle, the icon and the address-bar colour in sync with it.
   ========================================================================== */

const THEME_KEY = 'rateai.theme';
const darkQuery = window.matchMedia?.('(prefers-color-scheme: dark)');

function storedTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function systemTheme() {
  return darkQuery?.matches ? 'dark' : 'light';
}

/** What the reader is actually looking at right now. */
export function resolvedTheme() {
  return storedTheme() ?? systemTheme();
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme) root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    /* Read the resulting background rather than hardcoding it, so the address
       bar always matches whatever tokens.css says. */
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (bg) meta.setAttribute('content', bg);
  }
  syncThemeButtons();
}

function setTheme(theme) {
  try {
    if (theme) localStorage.setItem(THEME_KEY, theme);
    else localStorage.removeItem(THEME_KEY);
  } catch {
    /* Private mode: the choice applies to this page view only. */
  }
  applyTheme(theme);
}

function syncThemeButtons() {
  const next = resolvedTheme() === 'dark' ? 'light' : 'dark';
  const label = next === 'dark' ? 'Switch to dark theme' : 'Switch to light theme';
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.innerHTML = icon(next === 'dark' ? 'moon' : 'sun', 'ic ic-md');
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
  });
}

function initTheme() {
  applyTheme(storedTheme());

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      setTheme(resolvedTheme() === 'dark' ? 'light' : 'dark');
    });
  });

  /* Follow the system while in auto mode. */
  darkQuery?.addEventListener?.('change', () => {
    if (!storedTheme()) applyTheme(null);
  });
}

/* ==========================================================================
   Toasts
   ========================================================================== */

const TOAST_ICONS = {
  success: 'checkCircle',
  error: 'alertCircle',
  info: 'info',
};

function toastHost() {
  let host = document.querySelector('.toasts');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toasts';
    /* Announced politely: a confirmation should not interrupt what the reader
       is reading, but it must reach a screen reader. */
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  return host;
}

/** @param {'success'|'error'|'info'} kind */
export function toast(message, kind = 'info', duration = 4200) {
  const host = toastHost();
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.innerHTML =
    `<span class="toast-icon">${icon(TOAST_ICONS[kind] ?? 'info', 'ic ic-md')}</span>` +
    `<span>${esc(message)}</span>`;
  host.appendChild(el);

  requestAnimationFrame(() => el.classList.add('is-shown'));

  const remove = () => {
    el.classList.remove('is-shown');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    /* Belt and braces: if the transition never fires, still clean up. */
    setTimeout(() => el.remove(), 400);
  };
  setTimeout(remove, duration);
  return remove;
}

/* ==========================================================================
   Connection
   ========================================================================== */

/**
 * Losing the network is a state, and the reader should hear about it when it
 * happens rather than when a write fails. The data layer already refuses to
 * write while offline and says so; this is the ambient half of the same fact.
 *
 * A timed toast rather than a permanent bar: the bar would need a dismiss
 * control, a slot on every page and a decision about what it pushes down, and
 * the condition it reports is re-stated by every load and every failed submit
 * anyway. "Back online" is only worth saying to someone who saw it break.
 */
function initConnection() {
  let wasOffline = false;

  window.addEventListener('offline', () => {
    wasOffline = true;
    toast('You are offline. Nothing you submit will save until you reconnect.', 'error', 7000);
  });

  window.addEventListener('online', () => {
    if (!wasOffline) return;
    wasOffline = false;
    toast('Back online.', 'success');
  });
}

/* ==========================================================================
   Busy buttons
   ========================================================================== */

/**
 * Puts a button into a submitting state without changing its width enough to
 * make the row jump, and restores the exact original label afterwards.
 */
export function setBusy(button, busy, busyLabel = 'Working…') {
  if (!button) return;
  if (busy) {
    if (!button.dataset.label) button.dataset.label = button.innerHTML;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.innerHTML = `<span class="btn-spinner"></span><span>${esc(busyLabel)}</span>`;
  } else {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if (button.dataset.label) {
      button.innerHTML = button.dataset.label;
      delete button.dataset.label;
    }
  }
}

/* ==========================================================================
   Shell
   ========================================================================== */

function initFooterYear() {
  const el = document.querySelector('[data-year]');
  if (el) el.textContent = String(new Date().getFullYear());
}

/** Renders the icons the static shell markup asks for by name. */
function initShellIcons() {
  document.querySelectorAll('[data-icon]').forEach((slot) => {
    const name = slot.dataset.icon;
    const size = slot.dataset.iconSize ? ` ic-${slot.dataset.iconSize}` : '';
    slot.innerHTML = icon(name, `ic${size}`);
  });
}

function initKeyboard() {
  document.addEventListener('keydown', (event) => {
    /* "/" jumps to search — a convention readers of reference sites expect. */
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (document.activeElement?.isContentEditable) return;
      const search = document.querySelector('[data-search-input]');
      if (search) {
        event.preventDefault();
        search.focus();
        search.select?.();
      }
    }
  });
}

/**
 * Marks a "mock data" strip when the page is running on sample data, so a
 * screenshot can never be mistaken for the live catalogue.
 */
function initModeNotice(isMock) {
  if (!isMock) return;
  const host = document.querySelector('[data-mode-notice]');
  if (!host) return;
  host.hidden = false;
  host.innerHTML =
    `<span class="notice-icon">${icon('info', 'ic ic-md')}</span>` +
    `<span><b class="notice-title">Sample data</b>` +
    `This page is showing built-in example tools, not the live catalogue. ` +
    `<a class="link" href="${esc(stripMock())}">Load live data</a>.</span>`;
}

function stripMock() {
  const url = new URL(window.location.href);
  url.searchParams.set('mock', '0');
  return url.pathname + url.search;
}

/** Call once per page, as early as the module runs. */
export function initShell({ isMock = false } = {}) {
  initTheme();
  initShellIcons();
  initFooterYear();
  initKeyboard();
  initConnection();
  initModeNotice(isMock);
}
