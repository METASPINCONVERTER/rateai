#!/usr/bin/env node
/**
 * Rate AI — Populate Dedicated Firestore 'pricing' Collection
 * Creates and fills documents in the 'pricing' collection in Firestore.
 */

const API_KEY = 'AIzaSyBVe0utmbeYpX5ESnDWsaQuLAe6dpw7_Sc';
const BASE_TOOLS_URL = 'https://firestore.googleapis.com/v1/projects/rateai-7ace5/databases/(default)/documents/tools';
const BASE_PRICING_URL = 'https://firestore.googleapis.com/v1/projects/rateai-7ace5/databases/(default)/documents/pricing';

function encodeValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(encodeValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = encodeValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function decodeField(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(decodeField);
  }
  if ('mapValue' in val) {
    const obj = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      obj[k] = decodeField(v);
    }
    return obj;
  }
  return null;
}

async function main() {
  console.log('Fetching all 57 tools from Firestore "tools" collection...');
  const res = await fetch(`${BASE_TOOLS_URL}?pageSize=100&key=${API_KEY}`);
  const data = await res.json();
  const docs = data.documents || [];
  console.log(`Fetched ${docs.length} tool documents.`);

  let seededCount = 0;
  for (const doc of docs) {
    const id = doc.name.split('/').pop();
    const f = doc.fields || {};

    const toolName = decodeField(f.name) || id;
    const domain = decodeField(f.domain) || id;
    const category = decodeField(f.category) || 'AI Tools';
    const description = decodeField(f.description) || '';
    const website = decodeField(f.website) || `https://${domain}`;
    const pricingOverview = decodeField(f.pricingOverview) || description || `Official subscription plans and licensing tiers for ${toolName}.`;
    const officialPricingUrl = decodeField(f.officialPricingUrl) || website;
    const startingPrice = typeof decodeField(f.startingPrice) === 'number' ? decodeField(f.startingPrice) : 0;
    const hasFreeTier = Boolean(decodeField(f.hasFreeTier));
    const pricingPlans = decodeField(f.pricingPlans) || [
      {
        name: 'Free Access',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'forever free',
        popular: false,
        description: `Standard access to ${toolName} for daily productivity.`,
        features: ['Standard model capabilities', 'Web application access', 'Standard rate limits', 'Community support'],
        limits: ['Standard speed during peak hours'],
        ctaText: 'Use Free',
        ctaUrl: officialPricingUrl
      },
      {
        name: 'Pro Plan',
        priceMonthly: 20,
        priceYearly: 16,
        billingText: 'per month',
        popular: true,
        badge: 'Most Popular',
        description: `Unlimited generations, enhanced reasoning, and priority access for ${toolName}.`,
        features: ['5x higher query volume', 'Fast priority queue', 'Workflow integrations & API access', 'Priority customer support'],
        limits: ['Single user license'],
        ctaText: 'Get Pro',
        ctaUrl: officialPricingUrl
      },
      {
        name: 'Enterprise',
        priceMonthly: 30,
        priceYearly: 25,
        billingText: 'per seat / month',
        popular: false,
        description: `Collaborative workspace, commercial data privacy, and admin tools for ${toolName}.`,
        features: ['Commercial data protection', 'Centralized team management', 'Audit logging and priority support', 'Dedicated onboarding'],
        limits: ['Designed for teams'],
        ctaText: 'Contact Sales',
        ctaUrl: officialPricingUrl
      }
    ];

    // Document in the dedicated 'pricing' collection
    const pricingDocFields = {
      toolName: encodeValue(toolName),
      toolDomain: encodeValue(domain),
      category: encodeValue(category),
      pricingOverview: encodeValue(pricingOverview),
      officialPricingUrl: encodeValue(officialPricingUrl),
      startingPrice: encodeValue(startingPrice),
      hasFreeTier: encodeValue(hasFreeTier),
      pricingPlans: encodeValue(pricingPlans),
      updatedAt: encodeValue(new Date().toISOString()),
    };

    const url = `${BASE_PRICING_URL}/${encodeURIComponent(domain)}?key=${API_KEY}`;
    const patchRes = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: pricingDocFields }),
    });

    if (patchRes.ok) {
      seededCount++;
      process.stdout.write(`✓ [${seededCount}/${docs.length}] Populated pricing/${domain} (${toolName})\n`);
    } else {
      const errTxt = await patchRes.text();
      console.error(`✕ Failed to write pricing/${domain}: ${errTxt.slice(0, 120)}`);
    }
  }

  console.log(`\n🎉 Successfully populated Firestore "pricing" collection with all ${seededCount} tool documents!`);
}

main().catch((err) => {
  console.error('Fatal error populating pricing collection:', err);
  process.exit(1);
});
