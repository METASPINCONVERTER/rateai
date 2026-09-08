/**
 * PC Remote — Shell behavior
 * Theme toggling, mobile menu toggle, icon hydration, download links, footer year.
 */

import { icon } from './icons.js';
import { CONFIG } from './config.js';

const THEME_KEY = 'pcremote.theme';
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

export function resolvedTheme() {
  return storedTheme() ?? systemTheme();
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme) root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
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
    /* Private mode */
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

  darkQuery?.addEventListener?.('change', () => {
    if (!storedTheme()) applyTheme(null);
  });
}

/** Hydrates icon placeholders in static HTML */
export function initShellIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((slot) => {
    const name = slot.dataset.icon;
    const size = slot.dataset.iconSize ? ` ic-${slot.dataset.iconSize}` : '';
    slot.innerHTML = icon(name, `ic${size}`);
  });
}

function initMobileMenu() {
  const toggle = document.querySelector('[data-mobile-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.contains('is-open');
    if (isOpen) {
      menu.classList.remove('is-open');
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    } else {
      menu.classList.add('is-open');
      menu.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
    }
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initDownloadLinks() {
  document.querySelectorAll('[data-download-link="windows"]').forEach((el) => {
    el.setAttribute('href', CONFIG.windowsDownloadUrl);
  });

  document.querySelectorAll('[data-download-link="android"]').forEach((el) => {
    el.setAttribute('href', CONFIG.androidDownloadUrl);
  });
}

function initFooterYear() {
  const el = document.querySelector('[data-year]');
  if (el) el.textContent = String(new Date().getFullYear());
}

let shellInitialized = false;

export function initShell() {
  if (shellInitialized) return;
  shellInitialized = true;
  initTheme();
  initShellIcons();
  initMobileMenu();
  initDownloadLinks();
  initFooterYear();
}

// Auto-run shell init when loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShell);
} else {
  initShell();
}
