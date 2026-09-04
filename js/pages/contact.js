/**
 * Rate AI — Contact Page
 */

import { initShell, toast } from '../shell.js';
import { isMock } from '../store.js';
import { notice } from '../components.js';
import { mountNavAuth } from '../auth.js';
import { applySEO, siteSchema } from '../seo.js';

initShell({ isMock });
mountNavAuth();

applySEO({
  title: 'Contact Us — Platform Inquiries & Support | Rate AI',
  description: 'Get in touch with the Rate AI editorial and support team. Inquiries regarding directory indexing, data corrections, or platform feedback.',
  canonicalPath: '/contact',
  jsonLd: siteSchema(),
});

export function initPage() {
  const form = document.querySelector('[data-contact-form]');
  const status = document.querySelector('[data-contact-status]');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;

      setTimeout(() => {
        form.reset();
        if (btn) btn.disabled = false;
        if (status) {
          status.innerHTML = notice(
            'Thank you for contacting Rate AI. Our editorial team will review your inquiry and respond within 24–48 hours.',
            { kind: 'positive', title: 'Message received' },
          );
        }
        toast('Message received. Thank you!', 'success');
      }, 400);
    });
  }
}

initPage();
