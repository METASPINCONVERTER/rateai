/**
 * Rate AI — AI Pricing & Subscription Explorer
 *
 * Cloudflare Dashboard-inspired architecture with left sidebar tool directory,
 * top account controls, and comprehensive subscription plan cards.
 */

import { initShell } from '../shell.js';
import { loadTools, invalidate, isMock } from '../store.js';
import { errorState } from '../components.js';
import { icon } from '../icons.js';
import { esc, reveal } from '../util.js';
import { mountNavAuth, onAuthChange, openAuthModal } from '../auth.js';

let allTools = [];
let selectedTool = null;
let billingPeriod = 'monthly'; // 'monthly' | 'yearly'
let searchQuery = '';
let authUnsub = null;

const el = {};

function queryElements() {
  el.layout = document.querySelector('[data-cf-layout]');
  el.sidebarGroups = document.querySelector('[data-cf-sidebar-groups]');
  el.search = document.querySelector('[data-cf-search]');
  el.main = document.querySelector('[data-cf-main]');
  el.accountEmail = document.querySelector('[data-account-email]');
  el.accountAvatar = document.querySelector('[data-account-avatar]');
  el.accountBtn = document.querySelector('[data-cf-account-btn]');
}

function formatPrice(amount, period) {
  if (amount === 0 || amount === '0') return 'Free';
  const num = Number(amount);
  if (Number.isFinite(num)) {
    return `$${num % 1 === 0 ? num : num.toFixed(2)}`;
  }
  return String(amount);
}

const CATEGORY_ICONS = {
  'LLMs & Chatbots': 'message',
  'Code & Development': 'compass',
  'Image & Art': 'grid',
  'Audio & Music': 'sparkles',
  'Video': 'sun',
  'Presentations & Slides': 'rows',
};

function renderSidebar() {
  if (!el.sidebarGroups) return;
  const q = searchQuery.trim().toLowerCase();

  const filtered = allTools.filter((t) => {
    if (!q) return true;
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.domain && t.domain.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q))
    );
  });

  // Group tools by category
  const groups = new Map();
  for (const tool of filtered) {
    const cat = tool.category || 'Other AI';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(tool);
  }

  let html = `
    <div class="cf-nav-group">
      <a class="cf-nav-item" href="index.html">
        <span class="cf-nav-item-left">
          <span class="cf-nav-item-icon">${icon('home', 'ic ic-sm')}</span>
          <span>Account home</span>
        </span>
      </a>
      <button class="cf-nav-item" type="button" data-nav-action="recents">
        <span class="cf-nav-item-left">
          <span class="cf-nav-item-icon">${icon('clock', 'ic ic-sm')}</span>
          <span>Recents</span>
        </span>
        <span class="cf-nav-item-icon">${icon('chevronRight', 'ic ic-sm')}</span>
      </button>
      <a class="cf-nav-item" href="explore.html">
        <span class="cf-nav-item-left">
          <span class="cf-nav-item-icon">${icon('globe', 'ic ic-sm')}</span>
          <span>All AI Models</span>
        </span>
        <span class="cf-nav-item-icon">${icon('chevronRight', 'ic ic-sm')}</span>
      </a>
    </div>
  `;

  if (!filtered.length) {
    html += `
      <div class="empty empty-sm">
        <p class="empty-title">No tools match "${esc(q)}"</p>
      </div>
    `;
    el.sidebarGroups.innerHTML = html;
    return;
  }

  html += `<p class="cf-nav-label">AI Categories &amp; Models</p>`;

  for (const [category, toolsInCat] of groups.entries()) {
    const catIcon = CATEGORY_ICONS[category] || 'sparkles';
    const isCatActive = selectedTool && selectedTool.category === category;

    html += `
      <div class="cf-accordion">
        <div class="cf-nav-item">
          <span class="cf-nav-item-left">
            <span class="cf-nav-item-icon">${icon(catIcon, 'ic ic-sm')}</span>
            <span>${esc(category)}</span>
          </span>
          <span class="cf-nav-item-icon">${icon('chevronDown', 'ic ic-sm')}</span>
        </div>
        <div class="cf-accordion-body">
          ${toolsInCat
            .map((tool) => {
              const isActive = selectedTool && selectedTool.domain === tool.domain;
              const subItemClass = isActive ? 'cf-sub-item is-active' : 'cf-sub-item';
              return `
                <button class="${subItemClass}" type="button" data-tool-domain="${esc(tool.domain)}">
                  <span>${esc(tool.name)}</span>
                  <span class="t-muted">${tool.hasFreeTier ? 'Free' : '$'}</span>
                </button>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  el.sidebarGroups.innerHTML = html;

  el.sidebarGroups.querySelectorAll('[data-tool-domain]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const domain = btn.getAttribute('data-tool-domain');
      const hit = allTools.find((t) => t.domain === domain);
      if (hit) {
        selectTool(hit);
      }
    });
  });
}

function renderMainContent() {
  if (!el.main || !selectedTool) return;
  const tool = selectedTool;
  const plans = Array.isArray(tool.pricingPlans) && tool.pricingPlans.length
    ? tool.pricingPlans
    : [
        {
          name: 'Free Access',
          priceMonthly: 0,
          priceYearly: 0,
          billingText: 'forever free',
          popular: false,
          description: `Standard access to ${tool.name} for daily productivity.`,
          features: ['Standard model capabilities', 'Web application access', 'Standard rate limits', 'Community support'],
          limits: ['Standard speed during peak hours'],
          ctaText: 'Use Free',
          ctaUrl: tool.officialPricingUrl || tool.website || `https://${tool.domain}`
        },
        {
          name: 'Pro',
          priceMonthly: 20,
          priceYearly: 16,
          billingText: 'per month',
          popular: true,
          badge: 'Most Popular',
          description: `Unlimited generations, enhanced reasoning, and priority access for ${tool.name}.`,
          features: ['5x higher query volume', 'Fast priority queue', 'Workflow integrations & API access', 'Priority customer support'],
          limits: ['Single user license'],
          ctaText: 'Get Pro Plan',
          ctaUrl: tool.officialPricingUrl || tool.website || `https://${tool.domain}`
        },
        {
          name: 'Team / Enterprise',
          priceMonthly: 30,
          priceYearly: 25,
          billingText: 'per seat / month',
          popular: false,
          description: `Collaborative workspace, commercial data privacy, and admin tools for ${tool.name}.`,
          features: ['Commercial data protection', 'Centralized team management', 'Audit logging and priority support', 'Dedicated onboarding'],
          limits: ['Designed for teams'],
          ctaText: 'Contact Sales',
          ctaUrl: tool.officialPricingUrl || tool.website || `https://${tool.domain}`
        }
      ];
  const overview = tool.pricingOverview || tool.description || `Official subscription plans and licensing tiers for ${tool.name}.`;
  const ratingText = tool.totalRatings > 0 ? `${Number(tool.avgRating || 0).toFixed(1)} (${Number(tool.totalRatings).toLocaleString()} ratings)` : 'Unrated';
  const startingPriceText = tool.startingPrice ? `$${tool.startingPrice} / mo` : 'Free tier included';

  el.main.innerHTML = `
    <header class="cf-page-head">
      <p class="cf-eyebrow">${esc(tool.category || 'AI Intelligence')} &bull; Official Pricing</p>
      <h2 class="cf-title">${esc(tool.name)} Pricing &amp; Plans</h2>
      <p class="cf-subtitle">${esc(overview)}</p>
      <a class="cf-doc-link" href="${esc(tool.officialPricingUrl || tool.website || `https://${tool.domain}`)}" target="_blank" rel="noopener noreferrer">
        <span data-icon="book" data-icon-size="sm"></span>
        <span>${esc(tool.name)} Pricing documentation</span>
        ${icon('externalLink', 'ic ic-sm')}
      </a>
    </header>

    <!-- Cloudflare Hero Card -->
    <article class="cf-hero-card">
      <div class="cf-hero-left">
        <h3 class="cf-hero-title">Model Specifications &amp; Plan Access</h3>
        <p class="cf-hero-text">
          Review on-demand subscriptions, rate quotas, reasoning engines, and enterprise data security protocols.
        </p>
        <div>
          <a class="btn btn-primary" href="${esc(tool.officialPricingUrl || tool.website || `https://${tool.domain}`)}" target="_blank" rel="noopener noreferrer">
            <span>Explore ${esc(tool.name)} Plans</span> ${icon('externalLink', 'ic ic-sm')}
          </a>
        </div>
      </div>
      <div class="cf-hero-graphic" aria-hidden="true">
        <svg width="180" height="130" viewBox="0 0 180 130" fill="none">
          <ellipse cx="90" cy="65" rx="80" ry="45" stroke="var(--accent)" stroke-opacity="0.25" stroke-dasharray="4 4"/>
          <ellipse cx="90" cy="65" rx="55" ry="32" stroke="var(--accent)" stroke-opacity="0.5"/>
          <ellipse cx="90" cy="65" rx="30" ry="18" fill="var(--accent-wash)" stroke="var(--accent)"/>
          <rect x="75" y="45" width="30" height="40" rx="4" fill="var(--surface)" stroke="var(--border-strong)"/>
          <circle cx="90" cy="60" r="6" fill="var(--accent)"/>
          <path d="M85 73h10" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
    </article>

    <!-- Plans Overview Card -->
    <section class="cf-card" aria-label="Subscription Tiers">
      <div class="cf-card-header">
        <h3 class="cf-card-title">Plans &amp; Licensing Overview</h3>
        <div class="pricing-billing-toggle">
          <button class="pricing-billing-btn${billingPeriod === 'monthly' ? ' is-active' : ''}" type="button" data-billing="monthly">
            Monthly
          </button>
          <button class="pricing-billing-btn${billingPeriod === 'yearly' ? ' is-active' : ''}" type="button" data-billing="yearly">
            Yearly
            <span class="pricing-savings-pill">Save ~20%</span>
          </button>
        </div>
      </div>

      <!-- Metrics Row -->
      <div class="cf-metrics-row">
        <div class="cf-metric-col">
          <span class="cf-metric-label">
            <span class="cf-metric-dot-caution"></span>
            <span>Free Tier</span>
          </span>
          <p class="cf-metric-value">${tool.hasFreeTier ? 'Available' : 'Paid'}</p>
        </div>
        <div class="cf-metric-col">
          <span class="cf-metric-label">
            <span class="cf-metric-dot-accent"></span>
            <span>Starting Price</span>
          </span>
          <p class="cf-metric-value">${esc(startingPriceText)}</p>
        </div>
        <div class="cf-metric-col">
          <span class="cf-metric-label">
            <span>Community Rating</span>
          </span>
          <p class="cf-metric-value">${esc(ratingText)}</p>
        </div>

        <div class="cf-prog-bar" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">
          <div class="cf-prog-seg-caution cf-prog-35"></div>
          <div class="cf-prog-seg-accent cf-prog-65"></div>
        </div>
      </div>

      <!-- Subscription Cards Grid -->
      <div class="cf-card-body">
        <div class="pricing-cards-grid">
          ${plans.map((plan) => renderPlanCard(plan, tool)).join('')}
        </div>
      </div>

      <!-- Specifications Table -->
      <div class="cf-table-wrap">
        <table class="cf-table">
          <thead>
            <tr>
              <th>Plan Tier</th>
              <th>Monthly Price</th>
              <th>Annual Commitment</th>
              <th>Target Audience</th>
              <th>Direct Link</th>
            </tr>
          </thead>
          <tbody>
            ${plans
              .map((p) => `
                <tr>
                  <td><strong>${esc(p.name)}</strong></td>
                  <td>${esc(formatPrice(p.priceMonthly, 'monthly'))} / mo</td>
                  <td>${esc(formatPrice(p.priceYearly, 'yearly'))} / mo</td>
                  <td>${esc(p.description || 'Standard access')}</td>
                  <td>
                    <a class="btn btn-secondary btn-sm" href="${esc(p.ctaUrl || tool.website || `https://${tool.domain}`)}" target="_blank" rel="noopener noreferrer">
                      Get Plan ${icon('externalLink', 'ic ic-sm')}
                    </a>
                  </td>
                </tr>
              `)
              .join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  // Attach billing toggle listeners
  el.main.querySelectorAll('[data-billing]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-billing');
      if (mode && mode !== billingPeriod) {
        billingPeriod = mode;
        renderMainContent();
      }
    });
  });
}

function renderPlanCard(plan, tool) {
  const isYearly = billingPeriod === 'yearly';
  const price = isYearly && typeof plan.priceYearly === 'number' ? plan.priceYearly : plan.priceMonthly ?? 0;
  const priceDisplay = formatPrice(price, billingPeriod);
  const isFree = price === 0 || price === 'Free';
  const freqNote = isFree ? (plan.billingText || 'forever free') : isYearly ? 'per month, billed annually' : (plan.billingText || 'per month');

  const features = Array.isArray(plan.features) ? plan.features : [];
  const limits = Array.isArray(plan.limits) ? plan.limits : [];
  const ctaUrl = plan.ctaUrl || tool.officialPricingUrl || tool.website || `https://${tool.domain}`;
  const ctaText = plan.ctaText || (isFree ? 'Get Started Free' : 'Subscribe Now');

  return `
    <div class="pricing-card${plan.popular ? ' is-popular' : ''}">
      ${plan.popular ? `<span class="pricing-card-badge">${esc(plan.badge || 'Most Popular')}</span>` : ''}
      <div class="pricing-card-header">
        <h3 class="pricing-card-name">${esc(plan.name)}</h3>
        <p class="pricing-card-desc">${esc(plan.description || '')}</p>
      </div>

      <div class="pricing-card-price-box">
        <span class="pricing-card-price">${esc(priceDisplay)}</span>
        <div class="pricing-card-price-meta">
          <span class="pricing-card-price-freq">${esc(freqNote)}</span>
        </div>
      </div>

      <div class="pricing-card-action">
        <a class="btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}" href="${esc(ctaUrl)}" target="_blank" rel="noopener noreferrer">
          ${esc(ctaText)} ${icon('externalLink', 'ic ic-sm')}
        </a>
      </div>

      <div class="pricing-card-features">
        ${features.map((feat) => `
          <div class="pricing-card-feature-item">
            <span class="pricing-card-feature-icon">${icon('check', 'ic ic-sm')}</span>
            <span>${esc(feat)}</span>
          </div>
        `).join('')}

        ${limits.length ? `
          <div class="pricing-card-limits">
            <strong>Usage limits:</strong> ${esc(limits.join(' • '))}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function selectTool(tool) {
  selectedTool = tool;
  try {
    const url = new URL(window.location);
    url.searchParams.set('tool', tool.domain);
    window.history.replaceState({}, '', url);
  } catch {}

  renderSidebar();
  renderMainContent();
  if (el.main) {
    reveal(el.main);
  }
}

export async function initPage() {
  initShell({ isMock });
  mountNavAuth();
  queryElements();

  // Connect Google Auth with the Cloudflare Account Pill & Selector
  if (authUnsub) authUnsub();
  authUnsub = onAuthChange((user) => {
    if (!el.accountEmail) return;
    if (user) {
      el.accountEmail.textContent = user.email || user.displayName || 'Google Account';
      if (el.accountAvatar) el.accountAvatar.textContent = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
      if (el.accountBtn) {
        el.accountBtn.onclick = () => {
          openAuthModal({ prompt: `Signed in as ${user.email || user.displayName}.` });
        };
      }
    } else {
      const cached = localStorage.getItem('rateai.user');
      let localUser = null;
      try { localUser = cached ? JSON.parse(cached) : null; } catch {}
      if (localUser && localUser.email) {
        el.accountEmail.textContent = localUser.email;
        if (el.accountAvatar) el.accountAvatar.textContent = (localUser.displayName || localUser.email || 'A').charAt(0).toUpperCase();
      } else {
        el.accountEmail.textContent = 'Ayush12j13@gmail.c...';
        if (el.accountAvatar) el.accountAvatar.textContent = 'A';
      }
      if (el.accountBtn) {
        el.accountBtn.onclick = () => {
          openAuthModal({ prompt: 'Sign in with your Google account to access all AI models and rates.' });
        };
      }
    }
  });

  if (el.search) {
    el.search.value = searchQuery;
    el.search.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderSidebar();
    });

    // Keyboard shortcut Ctrl K or Cmd K
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        el.search?.focus();
      }
    });
  }

  // Fast load tools
  try {
    allTools = await loadTools();

    if (!Array.isArray(allTools) || !allTools.length) {
      const { MOCK_TOOLS } = await import('../dev/mock-data.js');
      allTools = MOCK_TOOLS;
    }

    // Determine initial tool from URL or default to OpenAI / Claude / Gemini
    const param = new URLSearchParams(window.location.search).get('tool');
    if (param) {
      selectedTool = allTools.find((t) => t.domain === param || t.docId === param) || null;
    }

    if (!selectedTool) {
      selectedTool =
        allTools.find((t) => t.domain === 'openai.com') ||
        allTools.find((t) => t.domain === 'claude.ai') ||
        allTools.find((t) => t.domain === 'gemini.google.com') ||
        allTools[0];
    }

    renderSidebar();
    renderMainContent();
  } catch (err) {
    console.error('Failed to load pricing catalogue:', err);
    try {
      const { MOCK_TOOLS } = await import('../dev/mock-data.js');
      allTools = MOCK_TOOLS;
      selectedTool = allTools[0];
      renderSidebar();
      renderMainContent();
    } catch {
      if (el.main) {
        el.main.innerHTML = errorState(err, { onRetry: () => { invalidate(); initPage(); } });
      }
    }
  }
}

initPage();
