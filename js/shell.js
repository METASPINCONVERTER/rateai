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
import { esc, getSiteBase } from './util.js';

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
export function initShellIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((slot) => {
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
    `<span class="notice-icon">${icon('alertTriangle', 'ic ic-md')}</span>` +
    `<span><b class="notice-title">Sample data</b>` +
    `You're viewing sample data, not the live catalogue. ` +
    `<a class="link" href="${esc(stripMock())}">Switch to live data</a>.</span>`;
}

function stripMock() {
  const url = new URL(window.location.href);
  url.searchParams.set('mock', '0');
  return url.pathname + url.search;
}

/* ==========================================================================
   Ambient Background Animation Canvas
   Features:
   - Dynamic floating dots & connecting constellation lines
   - Flowing ambient wave lines
   - Interactive mouse tracking, particle attraction/repulsion & glow
   - Adaptive color palettes reflecting the site's top brand colors (--accent)
   ========================================================================== */

function parseHex(hex) {
  const clean = String(hex || '').replace(/[^0-9a-f]/gi, '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) || 0,
      parseInt(clean[1] + clean[1], 16) || 0,
      parseInt(clean[2] + clean[2], 16) || 0,
    ];
  }
  return [
    parseInt(clean.slice(0, 2), 16) || 0,
    parseInt(clean.slice(2, 4), 16) || 0,
    parseInt(clean.slice(4, 6), 16) || 0,
  ];
}

function toColor(rgb, alpha) {
  return ['rgb', 'a(', rgb[0], ',', rgb[1], ',', rgb[2], ',', alpha, ')'].join('');
}

function initBackgroundCanvas() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (document.getElementById('bg-canvas')) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.className = 'bg-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let animId = null;
  let isVisible = !document.hidden;

  const mouse = {
    x: -9999,
    y: -9999,
    targetX: -9999,
    targetY: -9999,
    active: false,
    radius: 160,
  };

  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  function getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    const accentHex = style.getPropertyValue('--accent').trim();
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      (!document.documentElement.getAttribute('data-theme') &&
        window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);

    const rgb = parseHex(accentHex);

    return {
      isDark,
      rgb,
    };
  }

  let colors = getThemeColors();

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    initParticles();
  }

  function initParticles() {
    particles = [];
    const count = Math.max(26, Math.min(75, Math.floor((width * height) / 22000)));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (prefersReduced ? 0.05 : 0.55),
        vy: (Math.random() - 0.5) * (prefersReduced ? 0.05 : 0.55),
        baseRadius: 1.3 + Math.random() * 1.5,
        pulseOffset: Math.random() * Math.PI * 2,
        alpha: 0.35 + Math.random() * 0.45,
      });
    }
  }

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    mouse.active = true;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      mouse.targetX = e.touches[0].clientX;
      mouse.targetY = e.touches[0].clientY;
      mouse.active = true;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    mouse.active = false;
  }, { passive: true });

  const observer = new MutationObserver(() => {
    colors = getThemeColors();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  window.matchMedia?.('(prefers-color-scheme: dark)')?.addEventListener('change', () => {
    colors = getThemeColors();
  });

  let waveTime = 0;
  function drawMovingWaves() {
    waveTime += 0.003;
    const waveCount = 2;
    const waveAlpha = colors.isDark ? 0.045 : 0.03;

    for (let w = 0; w < waveCount; w++) {
      ctx.beginPath();
      const offset = (w * Math.PI) / 2;
      const waveYBase = height * (0.35 + w * 0.3);

      ctx.moveTo(0, waveYBase + Math.sin(waveTime + offset) * 35);

      for (let x = 0; x <= width; x += 45) {
        const y =
          waveYBase +
          Math.sin(x * 0.0022 + waveTime * 1.2 + offset) * 38 +
          Math.cos(x * 0.0014 - waveTime * 0.8) * 22;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = toColor(colors.rgb, waveAlpha);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function render(time) {
    if (!isVisible) return;

    ctx.clearRect(0, 0, width, height);

    if (mouse.active) {
      mouse.x += (mouse.targetX - mouse.x) * 0.18;
      mouse.y += (mouse.targetY - mouse.y) * 0.18;
    } else {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    drawMovingWaves();

    const maxDist = 135;
    const maxDistSq = maxDist * maxDist;
    const mouseRadiusSq = mouse.radius * mouse.radius;
    const len = particles.length;
    const isDark = colors.isDark;

    for (let i = 0; i < len; i++) {
      const p1 = particles[i];

      if (!prefersReduced) {
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0) { p1.x = 0; p1.vx *= -1; }
        else if (p1.x > width) { p1.x = width; p1.vx *= -1; }
        if (p1.y < 0) { p1.y = 0; p1.vy *= -1; }
        else if (p1.y > height) { p1.y = height; p1.vy *= -1; }

        if (mouse.active) {
          const mdx = p1.x - mouse.x;
          const mdy = p1.y - mouse.y;
          const mDistSq = mdx * mdx + mdy * mdy;
          if (mDistSq < mouseRadiusSq && mDistSq > 1) {
            const mDist = Math.sqrt(mDistSq);
            const force = (1 - mDist / mouse.radius) * 0.75;
            p1.x += (mdx / mDist) * force;
            p1.y += (mdy / mDist) * force;
          }
        }
      }

      for (let j = i + 1; j < len; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const dist = Math.sqrt(distSq);
          const lineAlpha = (1 - dist / maxDist) * (isDark ? 0.35 : 0.28);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = toColor(colors.rgb, lineAlpha.toFixed(3));
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      if (mouse.active) {
        const mdx = p1.x - mouse.x;
        const mdy = p1.y - mouse.y;
        const mDistSq = mdx * mdx + mdy * mdy;
        if (mDistSq < mouseRadiusSq) {
          const mDist = Math.sqrt(mDistSq);
          const mouseLineAlpha = (1 - mDist / mouse.radius) * (isDark ? 0.6 : 0.45);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = toColor(colors.rgb, mouseLineAlpha.toFixed(3));
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      const pulse = Math.sin(time * 0.003 + p1.pulseOffset);
      const currentRadius = p1.baseRadius + pulse * 0.35;
      const dotAlpha = p1.alpha + pulse * 0.12;

      ctx.beginPath();
      ctx.arc(p1.x, p1.y, currentRadius * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = toColor(colors.rgb, isDark ? 0.22 : 0.12);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p1.x, p1.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = toColor(colors.rgb, dotAlpha.toFixed(3));
      ctx.fill();
    }

    if (mouse.active && mouse.x > 0 && mouse.y > 0) {
      const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 32);
      grad.addColorStop(0, toColor(colors.rgb, isDark ? 0.45 : 0.32));
      grad.addColorStop(1, ['rgb', 'a(0,0,0,0)'].join(''));
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 32, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = toColor(colors.rgb, 0.85);
      ctx.fill();
    }

    if (!prefersReduced) {
      animId = requestAnimationFrame(render);
    }
  }

  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
    if (isVisible && !prefersReduced) {
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(render);
    }
  });

  window.addEventListener('resize', () => {
    resize();
  }, { passive: true });

  resize();
  animId = requestAnimationFrame(render);
}

/* ==========================================================================
   SPA Router — Persistent layout, seamless content swap
   ========================================================================== */

function initRouter() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  async function runPageHandler(pathname) {
    const base = getSiteBase();
    let norm = pathname.toLowerCase();
    if (norm.startsWith(base.toLowerCase())) {
      norm = norm.slice(base.length);
    }
    norm = norm.replace(/^\//, '');

    try {
      if (norm === '' || norm === 'index.html') {
        const mod = await import('./pages/home.js');
        if (typeof mod.initPage === 'function') mod.initPage();
      } else if (norm === 'explore' || norm === 'explore.html') {
        const mod = await import('./pages/explore.js');
        if (typeof mod.initPage === 'function') mod.initPage();
      } else if (norm === 'compare' || norm === 'compare.html') {
        const mod = await import('./pages/compare.js');
        if (typeof mod.initPage === 'function') mod.initPage();
      } else if (norm === 'submit' || norm === 'submit.html') {
        const mod = await import('./pages/submit.js');
        if (typeof mod.initPage === 'function') mod.initPage();
      } else if (norm.startsWith('review/') || norm === 'tool.html') {
        const mod = await import('./pages/tool.js');
        if (typeof mod.initPage === 'function') mod.initPage();
      } else if (norm === 'about' || norm === 'about.html') {
        const mod = await import('./pages/about.js');
        if (typeof mod.initPage === 'function') mod.initPage();
      } else if (norm === 'contact' || norm === 'contact.html') {
        const mod = await import('./pages/contact.js');
        if (typeof mod.initPage === 'function') mod.initPage();
      } else if (norm === 'privacy' || norm === 'privacy.html') {
        const mod = await import('./pages/privacy.js');
        if (typeof mod.initPage === 'function') mod.initPage();
      } else if (norm === 'terms' || norm === 'terms.html') {
        const mod = await import('./pages/terms.js');
        if (typeof mod.initPage === 'function') mod.initPage();
      } else if (norm === 'pricing' || norm === 'pricing.html' || norm === 'pricing/index.html' || norm.startsWith('pricing')) {
        const mod = await import('./pages/pricing.js');
        if (typeof mod.initPage === 'function') mod.initPage();
      } else if (norm === '404' || norm === '404.html') {
        const mod = await import('./pages/notfound.js');
        if (typeof mod.initPage === 'function') mod.initPage();
      }
    } catch (err) {
      console.error('SPA route transition handler error:', err);
    }
  }

  function updateActiveNav(pathname) {
    const base = getSiteBase();
    let norm = pathname;
    if (norm.startsWith(base)) {
      norm = norm.slice(base.length);
    }
    const cleanPath = norm.replace(/^\//, '') || 'index.html';
    const isHome = cleanPath === 'index.html' || cleanPath === '';

    document.querySelectorAll('.nav-link, .tabbar-link').forEach((link) => {
      const linkHref = link.getAttribute('href') || '';
      const linkClean = linkHref.replace(/^\//, '').split('?')[0].split('#')[0];
      const match = (isHome && (linkClean === '' || linkClean === 'index.html')) ||
                    (!isHome && linkClean && cleanPath.startsWith(linkClean));

      if (match) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  async function navigate(href, { push = true } = {}) {
    const targetUrl = new URL(href, window.location.href);

    updateActiveNav(targetUrl.pathname);

    try {
      const res = await fetch(targetUrl.href);
      if (!res.ok) {
        window.location.href = targetUrl.href;
        return;
      }

      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newMain = doc.querySelector('#main');

      if (!newMain) {
        window.location.href = targetUrl.href;
        return;
      }

      if (push) {
        window.history.pushState({}, '', targetUrl.href);
      }

      if (doc.title) {
        document.title = doc.title;
      }

      const newDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content');
      if (newDesc) {
        const curDesc = document.querySelector('meta[name="description"]');
        if (curDesc) curDesc.setAttribute('content', newDesc);
      }

      const newCanonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
      if (newCanonical) {
        const curCanonical = document.querySelector('link[rel="canonical"]');
        if (curCanonical) curCanonical.setAttribute('href', newCanonical);
      }

      const curMain = document.getElementById('main');
      if (curMain) {
        curMain.className = newMain.className;
        curMain.innerHTML = newMain.innerHTML;
      }

      window.scrollTo(0, 0);

      initShellIcons(document.getElementById('main'));

      document.dispatchEvent(new CustomEvent('rateai:route-changed', {
        detail: { url: targetUrl.href, pathname: targetUrl.pathname }
      }));

      await runPageHandler(targetUrl.pathname);

    } catch {
      window.location.href = targetUrl.href;
    }
  }

  document.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;

    const link = e.target.closest('a[href]');
    if (!link) return;

    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;
    if (link.getAttribute('rel')?.includes('external')) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    const targetUrl = new URL(link.href, window.location.href);
    if (targetUrl.origin !== window.location.origin) return;

    if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search && targetUrl.hash) {
      return;
    }

    e.preventDefault();
    navigate(link.href, { push: true });
  });

  window.addEventListener('popstate', () => {
    navigate(window.location.href, { push: false });
  });
}

let shellInitialized = false;

/** Call once per page, as early as the module runs. */
export function initShell({ isMock = false } = {}) {
  if (shellInitialized) return;
  shellInitialized = true;
  initTheme();
  initShellIcons();
  initFooterYear();
  initKeyboard();
  initConnection();
  initModeNotice(isMock);
  initBackgroundCanvas();
  initRouter();
}
