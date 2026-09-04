/**
 * Rate AI — SEO & Structured Data
 *
 * Manages technical SEO at runtime: canonical URLs, page titles, meta descriptions,
 * Open Graph, Twitter Cards, and valid JSON-LD schemas.
 */

const SITE_URL = 'https://rateai.in';
const DEFAULT_TITLE = 'Rate AI — Community ratings for AI tools';
const DEFAULT_DESC = 'Ratings for AI tools, written by the people using them. Every score is an average of individual verdicts with transparent Bayesian weighting.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon.svg`;

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
} = {}) {
  // 1. Page title
  document.title = title;

  // 2. Meta description & keywords
  setMeta('name', 'description', description);
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
 * Returns WebSite and Organization JSON-LD schema
 */
export function siteSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Rate AI',
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.svg`,
        description: 'Impartial reviews and community ratings for artificial intelligence tools.',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Rate AI',
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
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
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    })),
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
    operatingSystem: (tool.platforms ?? ['Web']).join(', '),
    applicationCategory: tool.category,
    description: tool.metaDescription || tool.description,
    url: tool.website,
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

  if (tool.features?.length) {
    schema.featureList = tool.features.join(', ');
  }

  if (tool.seoKeywords?.length) {
    schema.keywords = tool.seoKeywords.join(', ');
  }

  if (tool.totalRatings > 0 && tool.avgRating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(tool.avgRating).toFixed(1),
      ratingCount: tool.totalRatings,
      reviewCount: tool.totalReviews || Math.round(tool.totalRatings * 0.08),
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}
