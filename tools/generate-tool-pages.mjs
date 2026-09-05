#!/usr/bin/env node
/**
 * Rate AI — Static Tool Pages & SEO Generator
 *
 * Pre-renders static HTML files for every AI tool from Firestore into:
 *   review/<slug>/index.html
 *
 * Each generated file contains:
 *   - Unique <title> and meta description
 *   - Canonical <link rel="canonical">
 *   - Open Graph and Twitter Card tags with logo image
 *   - Schema.org JSON-LD (SoftwareApplication + AggregateRating)
 *   - Embedded <script type="application/json" id="tool-data"> for instant hydration
 *
 * Also outputs:
 *   - sitemap.xml
 *   - robots.txt
 *
 * Usage: node tools/generate-tool-pages.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { toolSlug, cleanDomain, esc, escUrl } from '../js/util.js';
import { MOCK_TOOLS } from '../js/dev/mock-data.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE_URL = 'https://rateai.in';

function parseFirestoreField(field) {
  if (!field) return null;
  if ('stringValue' in field) return field.stringValue;
  if ('integerValue' in field) return parseInt(field.integerValue, 10);
  if ('doubleValue' in field) return parseFloat(field.doubleValue);
  if ('booleanValue' in field) return field.booleanValue;
  if ('timestampValue' in field) return field.timestampValue;
  if ('arrayValue' in field) {
    return (field.arrayValue.values || []).map(parseFirestoreField);
  }
  if ('mapValue' in field) {
    const res = {};
    const sub = field.mapValue.fields || {};
    for (const k of Object.keys(sub)) {
      res[k] = parseFirestoreField(sub[k]);
    }
    return res;
  }
  return null;
}

function parseFirestoreDoc(doc) {
  const fields = doc.fields || {};
  const data = {};
  for (const k of Object.keys(fields)) {
    data[k] = parseFirestoreField(fields[k]);
  }
  const id = doc.name ? doc.name.split('/').pop() : '';
  const domain = String(data.domain || id || '').trim().toLowerCase();
  return {
    docId: id,
    domain,
    name: data.name || id,
    description: data.description || '',
    category: data.category || 'Other',
    company: data.company || '',
    website: data.website || (domain ? `https://${domain}` : ''),
    pricing: Array.isArray(data.pricing) ? data.pricing : data.pricing ? [data.pricing] : ['Freemium'],
    avgRating: Number.isFinite(Number(data.avgRating)) ? Number(data.avgRating) : 0,
    totalRatings: parseInt(data.totalRatings, 10) || 0,
    totalReviews: parseInt(data.totalReviews, 10) || 0,
    ratingDistribution: data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    verified: Boolean(data.verified),
    founded: data.founded || null,
    twitter: data.twitter || null,
    iconUrl: data.iconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

async function fetchAllTools() {
  try {
    const endpoint = 'https://firestore.googleapis.com/v1/projects/rateai-7ace5/databases/(default)/documents/tools?pageSize=300';
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.documents || !json.documents.length) throw new Error('No documents found in Firestore');
    const tools = json.documents.map(parseFirestoreDoc).filter((t) => t.domain && t.name);
    console.log(`Fetched ${tools.length} live tools from Firestore.`);
    return tools;
  } catch (err) {
    console.warn(`Firestore read failed (${err.message}). Falling back to mock dataset.`);
    return MOCK_TOOLS.map((t) => ({
      ...t,
      iconUrl: t.iconUrl || `https://www.google.com/s2/favicons?domain=${t.domain}&sz=128`,
    }));
  }
}

function buildJsonLd(tool) {
  const metaDesc = tool.description || `Authentic community ratings, reviews, and features for ${tool.name} on Rate AI.`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    operatingSystem: 'All (Cloud, Web, Desktop, Mobile)',
    applicationCategory: tool.category || 'AI Tools',
    description: metaDesc,
    url: tool.website || (tool.domain ? `https://${tool.domain}` : SITE_URL),
    author: {
      '@type': 'Organization',
      name: tool.company || tool.name,
    },
    offers: {
      '@type': 'Offer',
      price: (tool.pricing || []).includes('Paid') ? '9.99' : '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  if (tool.totalRatings > 0 && tool.avgRating > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(tool.avgRating).toFixed(1),
      ratingCount: tool.totalRatings,
      reviewCount: tool.totalReviews || Math.max(1, Math.round(tool.totalRatings * 0.1)),
      bestRating: '5',
      worstRating: '1',
    };
  }

  return jsonLd;
}

function generatePageHtml(templateHtml, tool) {
  const slug = toolSlug(tool.domain, tool.name);
  const canonicalUrl = `${SITE_URL}/review/${slug}/`;
  const seoTitle = `${tool.name} — Reviews, Rating & Pricing | Rate AI`;
  const metaDesc = (tool.description && tool.description.trim())
    ? `${tool.name}: ${tool.description.trim()}`
    : `Authentic user reviews, community score, pricing, and features for ${tool.name} (${tool.domain}).`;
  const iconUrl = tool.iconUrl || `https://www.google.com/s2/favicons?domain=${tool.domain}&sz=128`;
  const jsonLd = buildJsonLd(tool);

  // Replace title and description in template
  let html = templateHtml;

  // Replace <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(seoTitle)}</title>`);

  // Replace meta description
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(metaDesc)}">`);

  // Ensure base path points to root correctly regardless of where the site is hosted (GitHub Pages subpaths)
  html = html.replace(/<base href="\/">/, `<base href="../../">`);

  // Build meta tags block
  const metaTags = [
    `<!-- Primary Canonical & SEO Meta -->`,
    `<link rel="canonical" href="${escUrl(canonicalUrl)}">`,
    `<!-- Open Graph / Facebook -->`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Rate AI">`,
    `<meta property="og:url" content="${escUrl(canonicalUrl)}">`,
    `<meta property="og:title" content="${esc(seoTitle)}">`,
    `<meta property="og:description" content="${esc(metaDesc)}">`,
    `<meta property="og:image" content="${escUrl(iconUrl)}">`,
    `<!-- Twitter Card -->`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:url" content="${escUrl(canonicalUrl)}">`,
    `<meta name="twitter:title" content="${esc(seoTitle)}">`,
    `<meta name="twitter:description" content="${esc(metaDesc)}">`,
    `<meta name="twitter:image" content="${escUrl(iconUrl)}">`,
    `<!-- Structured Data (JSON-LD) -->`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
    `<!-- Embedded Pre-fetched Tool Data for Instant Hydration -->`,
    `<script type="application/json" id="tool-data">${JSON.stringify(tool)}</script>`,
  ].join('\n');

  // Insert before </head>
  html = html.replace('</head>', `${metaTags}\n</head>`);

  return { html, slug, canonicalUrl };
}

function generateSitemap(tools) {
  const staticPages = [
    { url: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' },
    { url: `${SITE_URL}/explore.html`, priority: '0.9', changefreq: 'daily' },
    { url: `${SITE_URL}/compare.html`, priority: '0.8', changefreq: 'weekly' },
    { url: `${SITE_URL}/pricing/index.html`, priority: '0.9', changefreq: 'daily' },
    { url: `${SITE_URL}/how-it-works.html`, priority: '0.8', changefreq: 'monthly' },
    { url: `${SITE_URL}/trust.html`, priority: '0.8', changefreq: 'monthly' },
    { url: `${SITE_URL}/guidelines.html`, priority: '0.7', changefreq: 'monthly' },
    { url: `${SITE_URL}/faq.html`, priority: '0.8', changefreq: 'monthly' },
    { url: `${SITE_URL}/about.html`, priority: '0.6', changefreq: 'monthly' },
    { url: `${SITE_URL}/contact.html`, priority: '0.5', changefreq: 'monthly' },
    { url: `${SITE_URL}/privacy.html`, priority: '0.3', changefreq: 'yearly' },
    { url: `${SITE_URL}/terms.html`, priority: '0.3', changefreq: 'yearly' },
  ];

  const now = new Date().toISOString().split('T')[0];

  const staticXml = staticPages
    .map(
      (p) =>
        `  <url>\n    <loc>${p.url}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
    )
    .join('\n');

  const slugMap = new Map();
  for (const tool of tools) {
    const slug = toolSlug(tool.domain, tool.name);
    const lastmod = tool.updatedAt
      ? new Date(tool.updatedAt).toISOString().split('T')[0]
      : tool.createdAt
        ? new Date(tool.createdAt).toISOString().split('T')[0]
        : now;
    slugMap.set(slug, lastmod);
  }

  const sortedSlugs = Array.from(slugMap.keys()).sort();
  const toolsXml = sortedSlugs
    .map((slug) => {
      const url = `${SITE_URL}/review/${slug}/`;
      const lastmod = slugMap.get(slug) || now;
      return `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticXml}\n${toolsXml}\n</urlset>\n`;
}

function generateRobots() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

async function main() {
  const templatePath = join(ROOT, 'tool.html');
  const templateHtml = readFileSync(templatePath, 'utf8');

  const tools = await fetchAllTools();
  console.log(`Generating pages for ${tools.length} tools...`);

  const liveSlugs = new Set();
  let count = 0;
  for (const tool of tools) {
    const { html, slug } = generatePageHtml(templateHtml, tool);
    liveSlugs.add(slug);

    // Canonical static tool route: review/<slug>/index.html
    const dir = join(ROOT, 'review', slug);
    mkdirSync(dir, { recursive: true });

    // Write freshly generated HTML containing full Firestore data
    const targetFile = join(dir, 'index.html');
    writeFileSync(targetFile, html, 'utf8');
    count += 1;
  }

  // Prune any deleted tools from review/ directory
  const reviewDir = join(ROOT, 'review');
  let prunedCount = 0;
  if (existsSync(reviewDir)) {
    const diskDirs = readdirSync(reviewDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    for (const diskSlug of diskDirs) {
      if (!liveSlugs.has(diskSlug)) {
        console.log(`Pruning deleted tool directory: review/${diskSlug}`);
        rmSync(join(reviewDir, diskSlug), { recursive: true, force: true });
        prunedCount += 1;
      }
    }
  }
  if (prunedCount > 0) {
    console.log(`Pruned ${prunedCount} deleted tool(s) from disk.`);
  }

  // Write sitemap.xml
  const sitemapXml = generateSitemap(tools);
  writeFileSync(join(ROOT, 'sitemap.xml'), sitemapXml, 'utf8');
  console.log(`Generated sitemap.xml with ${tools.length + 8} URLs.`);

  // Write robots.txt
  const robotsTxt = generateRobots();
  writeFileSync(join(ROOT, 'robots.txt'), robotsTxt, 'utf8');
  console.log('Generated robots.txt.');

  console.log(`Successfully generated/synced ${tools.length} tool static pages!`);
}

main().catch((e) => {
  console.error('Fatal error generating tool pages:', e);
  process.exit(1);
});
