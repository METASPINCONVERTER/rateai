/**
 * PC Remote — Home Page Module
 * Interactive feature showcase tabs and smooth scrolling navigation.
 */

import { initShell } from '../shell.js';

function initShowcaseTabs() {
  const tabButtons = document.querySelectorAll('[data-showcase-tab]');
  const panels = document.querySelectorAll('[data-showcase-panel]');

  if (!tabButtons.length || !panels.length) return;

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetKey = button.dataset.showcaseTab;

      // Update button selection state
      tabButtons.forEach((btn) => {
        const isSelected = btn === button;
        btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      });

      // Update panel visibility
      panels.forEach((panel) => {
        const match = panel.dataset.showcasePanel === targetKey;
        panel.hidden = !match;
      });
    });
  });
}

function initAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
        history.pushState(null, '', targetId);
      }
    });
  });
}

export function initPage() {
  initShell();
  initShowcaseTabs();
  initAnchorScroll();
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  initPage();
}
