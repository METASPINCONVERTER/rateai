/**
 * Rate AI — Authentication & User System
 *
 * Streamlined Google OAuth Authentication popup modal for rating,
 * reviewing, and saving AI tools. No manual email/passwords.
 */

import { icon } from './icons.js';
import { esc } from './util.js';
import { toast, setBusy } from './shell.js';
import {
  signInWithGoogle as fbSignInWithGoogle,
  signOutUser as fbSignOutUser,
  onAuthChange as fbOnAuthChange,
} from './firebase.js';

const AUTH_USER_KEY = 'rateai.user';
const listeners = new Set();
let currentUser = null;
let modalCallback = null;

// Read cached user session for immediate initial paint
try {
  const cached = localStorage.getItem(AUTH_USER_KEY);
  if (cached) currentUser = JSON.parse(cached);
} catch {
  currentUser = null;
}

// Real Firebase Auth listener
fbOnAuthChange((fbUser) => {
  if (fbUser) {
    currentUser = {
      uid: fbUser.uid,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
      email: fbUser.email || '',
      photoURL: fbUser.photoURL || '',
    };
  } else {
    currentUser = null;
  }
  notify(currentUser);
});

export function getUser() {
  return currentUser;
}

export function onAuthChange(cb) {
  listeners.add(cb);
  cb(currentUser);
  return () => listeners.delete(cb);
}

function notify(user) {
  currentUser = user;
  try {
    if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_USER_KEY);
  } catch {}

  document.dispatchEvent(new CustomEvent('rateai:auth-changed', { detail: { user } }));
  listeners.forEach((cb) => {
    try { cb(user); } catch (e) { console.error(e); }
  });
  updateNavAuth();
}

function friendlyAuthError(err) {
  const code = err?.code || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Sign-in cancelled. Please click "Sign in with Google" to try again.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your internet connection.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled in Firebase Console (Authentication > Sign-in method > Google).';
  }
  if (code === 'auth/internal-error') {
    return 'Google authentication service error. Please try again.';
  }
  return err?.message || 'Google sign-in failed. Please try again.';
}

export async function signInWithGoogle() {
  try {
    const user = await fbSignInWithGoogle();
    if (!user) return null;
    const formatted = {
      uid: user.uid,
      displayName: user.displayName || 'Google User',
      email: user.email || '',
      photoURL: user.photoURL || '',
    };
    notify(formatted);
    toast('Signed in successfully!', 'success');
    return formatted;
  } catch (error) {
    const msg = friendlyAuthError(error);
    toast(msg, 'error');
    throw new Error(msg);
  }
}

export async function signOutUser() {
  try {
    await fbSignOutUser();
  } catch {}
  notify(null);
  toast('Signed out.', 'info');
}

export function requireAuth(actionPrompt = 'perform this action', onAuthed = () => {}) {
  if (currentUser) {
    onAuthed(currentUser);
    return;
  }
  openAuthModal({
    prompt: `Sign in with Google to ${actionPrompt}`,
    onComplete: onAuthed,
  });
}

/* ==========================================================================
   Google Sign-In Modal UI
   ========================================================================== */

function ensureAuthModal() {
  let modal = document.querySelector('[data-auth-modal]');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.setAttribute('data-auth-modal', '');
  modal.className = 'modal-backdrop';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'auth-modal-title');

  modal.innerHTML =
    `<div class="modal-dialog">` +
    `<div class="modal-head">` +
    `<h2 class="modal-title" id="auth-modal-title">Sign in to Rate AI</h2>` +
    `<button class="modal-close btn-icon btn-sm" type="button" data-auth-close aria-label="Close dialog">` +
    icon('close', 'ic ic-sm') +
    `</button>` +
    `</div>` +
    `<div class="modal-body">` +
    `<div class="auth-icon-badge">` +
    icon('google', 'ic ic-xl') +
    `</div>` +
    `<p class="modal-sub t-muted" data-auth-prompt>Sign in with your Google account to publish ratings, write reviews, and save AI tools to your favorites.</p>` +
    `<div class="auth-error" data-auth-error hidden></div>` +
    `<button class="btn btn-google-auth" type="button" data-auth-google>` +
    icon('google', 'ic ic-md') +
    `<span>Sign in with Google</span>` +
    `</button>` +
    `<p class="auth-security-note t-meta t-muted">Secure one-click sign in. We only use your public profile name to display beside your review.</p>` +
    `</div>` +
    `</div>`;

  document.body.appendChild(modal);

  const errorEl = modal.querySelector('[data-auth-error]');
  const showError = (msg) => {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
    }
  };
  const clearError = () => {
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  };

  // Bind close events
  modal.querySelector('[data-auth-close]').addEventListener('click', closeAuthModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAuthModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeAuthModal();
  });

  // Bind Google
  const googleBtn = modal.querySelector('[data-auth-google]');
  googleBtn.addEventListener('click', async () => {
    clearError();
    try {
      setBusy(googleBtn, true, 'Opening Google…');
      const user = await signInWithGoogle();
      if (user) {
        closeAuthModal();
        if (modalCallback) {
          modalCallback(user);
          modalCallback = null;
        }
      }
    } catch (err) {
      showError(err.message || 'Google sign-in failed');
    } finally {
      setBusy(googleBtn, false);
    }
  });

  return modal;
}

export function openAuthModal({ prompt = '', onComplete = null } = {}) {
  const modal = ensureAuthModal();
  const promptEl = modal.querySelector('[data-auth-prompt]');
  const errorEl = modal.querySelector('[data-auth-error]');

  if (prompt && promptEl) promptEl.textContent = prompt;
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }

  modalCallback = onComplete;
  modal.hidden = false;
  modal.querySelector('[data-auth-google]')?.focus();
}

export function closeAuthModal() {
  const modal = document.querySelector('[data-auth-modal]');
  if (modal) modal.hidden = true;
  modalCallback = null;
}

/**
 * Renders or updates the auth trigger in `<header class="nav">`
 */
export function updateNavAuth() {
  const slots = document.querySelectorAll('[data-nav-auth]');
  slots.forEach((slot) => {
    if (!currentUser) {
      slot.innerHTML =
        `<button class="btn btn-secondary btn-sm" type="button" data-auth-open>` +
        icon('user', 'ic ic-sm') +
        `<span class="nav-auth-label">Sign in</span>` +
        `</button>`;
      slot.querySelector('[data-auth-open]')?.addEventListener('click', () => {
        openAuthModal({ prompt: 'Sign in with your Google account to rate, review, and bookmark AI tools.' });
      });
    } else {
      const initial = (currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase();
      slot.innerHTML =
        `<div class="user-menu" data-user-menu>` +
        `<button class="btn btn-ghost btn-sm user-menu-trigger" type="button" data-user-toggle aria-expanded="false" aria-label="User menu">` +
        `<span class="avatar avatar-sm">${esc(initial)}</span>` +
        `<span class="user-menu-name truncate">${esc(currentUser.displayName || currentUser.email)}</span>` +
        `</button>` +
        `<div class="user-dropdown" data-user-dropdown hidden>` +
        `<div class="user-dropdown-head">` +
        `<span class="user-dropdown-name truncate">${esc(currentUser.displayName || 'User')}</span>` +
        `<span class="user-dropdown-email truncate t-meta t-muted">${esc(currentUser.email || '')}</span>` +
        `</div>` +
        `<div class="user-dropdown-links">` +
        `<a class="user-dropdown-item" href="explore.html">${icon('compass', 'ic ic-sm')}Explore tools</a>` +
        `<button class="user-dropdown-item btn-signout" type="button" data-signout>${icon('logOut', 'ic ic-sm')}Sign out</button>` +
        `</div>` +
        `</div>` +
        `</div>`;

      const menu = slot.querySelector('[data-user-menu]');
      const toggle = menu.querySelector('[data-user-toggle]');
      const dropdown = menu.querySelector('[data-user-dropdown]');
      const signoutBtn = menu.querySelector('[data-signout]');

      toggle?.addEventListener('click', () => {
        const isHidden = dropdown.hidden;
        dropdown.hidden = !isHidden;
        toggle.setAttribute('aria-expanded', String(isHidden));
      });

      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target)) {
          dropdown.hidden = true;
          toggle.setAttribute('aria-expanded', 'false');
        }
      });

      signoutBtn?.addEventListener('click', async () => {
        await signOutUser();
      });
    }
  });
}

/**
 * Initializes auth UI on the page
 */
export function initAuth() {
  updateNavAuth();
  ensureAuthModal();
  document.querySelectorAll('[data-auth-trigger]').forEach((el) => {
    el.addEventListener('click', () => {
      openAuthModal({ prompt: 'Sign in with your Google account to rate, review, and bookmark AI tools.' });
    });
  });
}

export const mountNavAuth = initAuth;
