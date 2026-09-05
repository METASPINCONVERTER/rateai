/**
 * Rate AI — SEO & Structured Data Architecture
 *
 * Manages technical SEO, GEO (Generative Engine Optimization), AEO (Answer Engine Optimization),
 * canonical URLs, page titles, meta descriptions, Open Graph, Twitter Cards, and Schema.org JSON-LD.
 */

export const SITE_URL = 'https://rateai.in';
export const DEFAULT_TITLE = 'Rate AI — Authentic AI Tool Ratings, Reviews & Comparison';
export const DEFAULT_DESC = 'Neutral, community-driven ratings and authentic verdicts for AI tools. Compare pricing, features, pros & cons, and Bayesian-ranked community scores.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/icons/icon-512.svg`;

function setMeta(attribute, name, content) {
  if (!content) return;
  let tag = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setJsonLd(schema) {
  if (!schema) return;
  let script = document.querySelector('script[data-schema="rateai"]');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-schema', 'rateai');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema);
}

export function applySEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  keywords = null,
  canonicalPath = window.location.pathname,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  jsonLd = null,
  robots = 'index, follow',
} = {}) {
  // 1. Page title
  document.title = title;

  // 2. Meta description & robots
  setMeta('name', 'description', description);
  setMeta('name', 'robots', robots);

  if (keywords) {
    const kwString = Array.isArray(keywords) ? keywords.join(', ') : String(keywords);
    setMeta('name', 'keywords', kwString);
  }

  // 3. Canonical URL
  const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const canonicalUrl = `${SITE_URL}${cleanPath}`;
  setCanonical(canonicalUrl);

  // 4. Open Graph
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', canonicalUrl);
  setMeta('property', 'og:type', ogType);
  setMeta('property', 'og:image', ogImage);
  setMeta('property', 'og:site_name', 'Rate AI');

  // 5. Twitter Card
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', ogImage);

  // 6. JSON-LD structured data
  if (jsonLd) {
    setJsonLd(jsonLd);
  }
}

/**
 * Organization & WebSite JSON-LD Schema with global entity signals
 */
export function siteSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Rate AI',
        legalName: 'Rate AI, Inc.',
        url: SITE_URL,
        logo: `${SITE_URL}/icons/icon-512.svg`,
        description: 'Neutral, transparent community review directory and comparison platform for artificial intelligence software and AI models.',
        foundingDate: '2024',
        sameAs: [
          'https://x.com',
          'https://github.com',
          'https://linkedin.com'
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'support@rateai.in',
          url: `${SITE_URL}/contact.html`
        }
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Rate AI',
        description: DEFAULT_DESC,
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/explore.html?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  };
}

/**
 * Returns BreadcrumbList JSON-LD schema
 * @param {Array<{name: string, url: string}>} items
 */
export function breadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`
    }))
  };
}

/**
 * Returns SoftwareApplication schema with AggregateRating if ratings exist
 */
export function toolSchema(tool) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    operatingSystem: 'All (Cloud, Web, Desktop, Mobile)',
    applicationCategory: tool.category || 'AI Tools',
    description: tool.description,
    url: tool.website || (tool.domain ? `https://${tool.domain}` : SITE_URL),
    author: {
      '@type': 'Organization',
      name: tool.company || tool.name,
    },
    offers: {
      '@type': 'Offer',
      price: (tool.pricing ?? []).includes('Free') || (tool.pricing ?? []).includes('Freemium') ? '0' : '9.99',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  if (tool.totalRatings > 0 && tool.avgRating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(tool.avgRating).toFixed(1),
      ratingCount: tool.totalRatings,
      reviewCount: tool.totalReviews || Math.max(1, Math.round(tool.totalRatings * 0.1)),
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

/**
 * Generates FAQPage JSON-LD schema
 */
export function faqSchema(faqPairs = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqPairs.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}
