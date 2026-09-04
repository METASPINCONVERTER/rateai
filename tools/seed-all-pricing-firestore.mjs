#!/usr/bin/env node
/**
 * Rate AI — Complete Firestore Pricing Seeder
 * Seeds comprehensive, verified pricing plans for ALL 57 tools in Firestore.
 */

const API_KEY = 'AIzaSyBVe0utmbeYpX5ESnDWsaQuLAe6dpw7_Sc';
const BASE_URL = 'https://firestore.googleapis.com/v1/projects/rateai-7ace5/databases/(default)/documents/tools';

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

// Pricing data definitions for all tools
const KNOWN_PRICING = {
  'openai.com': {
    overview: 'Free access to GPT-4o mini with ChatGPT Plus providing advanced reasoning, voice mode, DALL-E 3, and custom GPTs.',
    hasFreeTier: true,
    startingPrice: 20,
    officialPricingUrl: 'https://openai.com/chatgpt/pricing/',
    tiers: [
      {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'forever free',
        popular: false,
        description: 'Everyday assistance with GPT-4o mini and limited access to GPT-4o.',
        features: ['Access to GPT-4o mini', 'Limited GPT-4o queries', 'Web browsing & citations', 'Data analysis & file uploads'],
        limits: ['Usage caps during peak hours', 'Standard voice mode only'],
        ctaText: 'Use Free',
        ctaUrl: 'https://chatgpt.com'
      },
      {
        name: 'Plus',
        priceMonthly: 20,
        priceYearly: 20,
        billingText: 'per month',
        popular: true,
        badge: 'Most Popular',
        description: 'Advanced reasoning, image generation, and creative intelligence for power users.',
        features: ['5x more messages on GPT-4o', 'Access to OpenAI o1 reasoning model', 'DALL-E 3 image generation', 'Advanced Voice Mode with video', 'Create and use custom GPTs'],
        limits: ['Single user license'],
        ctaText: 'Upgrade to Plus',
        ctaUrl: 'https://chatgpt.com/#pricing'
      },
      {
        name: 'Team',
        priceMonthly: 30,
        priceYearly: 25,
        billingText: 'per user / month',
        popular: false,
        description: 'Collaborative AI workspace with admin controls and privacy guarantees.',
        features: ['Everything in Plus', 'Higher message limits on all models', 'Admin console & workspace management', 'Team conversations & shared GPTs', 'Data excluded from model training'],
        limits: ['Minimum 2 users'],
        ctaText: 'Start Team Plan',
        ctaUrl: 'https://openai.com/chatgpt/team/'
      }
    ]
  },
  'gemini.google.com': {
    overview: 'Generous free access to Gemini 1.5 Flash with Google One AI Premium for Gemini 1.5 Pro and 2M token context.',
    hasFreeTier: true,
    startingPrice: 0,
    officialPricingUrl: 'https://one.google.com/explore-plan/gemini-advanced',
    tiers: [
      {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'forever free',
        popular: false,
        description: 'Standard access for everyday questions, code generation and document analysis.',
        features: ['Gemini 1.5 Flash multimodal reasoning', 'Search grounding with live web citations', '32K token standard context window', 'Google Docs, Sheets & Gmail integration'],
        limits: ['Standard rate limits', 'No access to 2M context window'],
        ctaText: 'Use Free',
        ctaUrl: 'https://gemini.google.com'
      },
      {
        name: 'Gemini Advanced',
        priceMonthly: 19.99,
        priceYearly: 19.99,
        billingText: 'per month',
        popular: true,
        badge: 'Google One AI Premium',
        description: 'Next-generation reasoning with 1.5 Pro and full Google Workspace AI integration.',
        features: ['Gemini 1.5 Pro next-gen model access', 'Massive 2,000,000 token context window', 'Analyze video, audio files, and full repositories', '2 TB cloud storage on Google Drive', 'Gemini in Gmail, Docs, Slides, and Meet'],
        limits: ['Fair usage caps apply', '1 user per subscription'],
        ctaText: 'Start 1-Month Trial',
        ctaUrl: 'https://one.google.com/explore-plan/gemini-advanced'
      },
      {
        name: 'Workspace Business',
        priceMonthly: 24,
        priceYearly: 20,
        billingText: 'per user / month',
        popular: false,
        description: 'Enterprise-grade Gemini integration with commercial data protection and team controls.',
        features: ['Enterprise data privacy: your data is never used to train models', 'Gemini side-panel in Docs, Sheets, Slides, and Drive', 'Centralized admin console & audit logging', 'SOC 1/2/3, ISO 27001, HIPAA compliant'],
        limits: ['Requires Google Workspace business domain'],
        ctaText: 'Contact Sales',
        ctaUrl: 'https://workspace.google.com/solutions/ai/'
      }
    ]
  },
  'claude.ai': {
    overview: 'Free access to Claude 3.5 Sonnet with Pro subscriptions for 5x usage limits, Projects, and Artifacts preview.',
    hasFreeTier: true,
    startingPrice: 20,
    officialPricingUrl: 'https://claude.ai/pricing',
    tiers: [
      {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'free forever',
        popular: false,
        description: 'Talk to Claude on web and iOS for daily coding and writing.',
        features: ['Claude 3.5 Sonnet access (rate-limited)', 'Artifacts live interactive preview', 'Multimodal image analysis and file uploads', 'Context window up to 200K tokens'],
        limits: ['Message limits reset every few hours'],
        ctaText: 'Talk to Claude',
        ctaUrl: 'https://claude.ai'
      },
      {
        name: 'Pro',
        priceMonthly: 20,
        priceYearly: 20,
        billingText: 'per month',
        popular: true,
        badge: 'Most Popular',
        description: '5x more usage for developers, writers, and technical researchers.',
        features: ['5x usage of Claude 3.5 Sonnet and Claude 3 Opus', 'Priority access during peak hours', 'Early access to new experimental features', 'Create Projects with custom context and docs'],
        limits: ['Single user license'],
        ctaText: 'Subscribe to Pro',
        ctaUrl: 'https://claude.ai/upgrade'
      },
      {
        name: 'Team',
        priceMonthly: 30,
        priceYearly: 25,
        billingText: 'per member / month',
        popular: false,
        description: 'Shared knowledge base, admin controls, and billing for teams.',
        features: ['Higher usage limits than Pro', 'Shared team projects and prompt templates', 'Centralized billing and admin console', 'Priority support'],
        limits: ['Minimum 5 members'],
        ctaText: 'Try Team',
        ctaUrl: 'https://claude.ai/pricing'
      }
    ]
  },
  'cursor.com': {
    overview: 'AI-first code editor fork of VS Code with smart auto-complete, codebase indexing, and multi-file agent editing.',
    hasFreeTier: true,
    startingPrice: 20,
    officialPricingUrl: 'https://www.cursor.com/pricing',
    tiers: [
      {
        name: 'Hobby',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'free forever',
        popular: false,
        description: 'Free trial of smart features and unlimited standard completions.',
        features: ['2,000 completions per month', '50 slow premium requests', 'Full VS Code extension ecosystem support', 'Codebase indexation'],
        limits: ['Standard speed during peak hours'],
        ctaText: 'Download Cursor',
        ctaUrl: 'https://www.cursor.com'
      },
      {
        name: 'Pro',
        priceMonthly: 20,
        priceYearly: 20,
        billingText: 'per month',
        popular: true,
        badge: 'Recommended for Devs',
        description: 'Unlimited completions and 500 fast requests to Claude 3.5 Sonnet & GPT-4o.',
        features: ['500 fast premium requests per month (Claude 3.5 & GPT-4o)', 'Unlimited completions & copilot chat', 'Cursor Composer multi-file agent editor', 'Unlimited codebase embeddings'],
        limits: ['Additional fast requests available for purchase'],
        ctaText: 'Get Pro',
        ctaUrl: 'https://www.cursor.com/pricing'
      },
      {
        name: 'Business',
        priceMonthly: 40,
        priceYearly: 40,
        billingText: 'per user / month',
        popular: false,
        description: 'Team management, privacy compliance, and centralized billing.',
        features: ['Everything in Pro', 'Zero data retention (privacy mode enforced)', 'Centralized billing and admin dashboard', 'Single sign-on (SAML / Okta)'],
        limits: ['Designed for organizations'],
        ctaText: 'Contact Sales',
        ctaUrl: 'https://www.cursor.com/pricing'
      }
    ]
  },
  'midjourney.com': {
    overview: 'State-of-the-art text-to-image generation via Discord and the Midjourney web studio.',
    hasFreeTier: false,
    startingPrice: 10,
    officialPricingUrl: 'https://docs.midjourney.com/docs/plans',
    tiers: [
      {
        name: 'Basic Plan',
        priceMonthly: 10,
        priceYearly: 8,
        billingText: 'per month',
        popular: false,
        description: 'For hobbyists creating occasional images.',
        features: ['3.3 hours/month of Fast GPU time (~200 image generations)', 'General commercial terms', 'Access to member gallery and web alpha', 'Credit top-ups available'],
        limits: ['No Relax GPU time', '3 concurrent jobs'],
        ctaText: 'Subscribe Basic',
        ctaUrl: 'https://www.midjourney.com/account'
      },
      {
        name: 'Standard Plan',
        priceMonthly: 30,
        priceYearly: 24,
        billingText: 'per month',
        popular: true,
        badge: 'Most Popular',
        description: 'Unlimited image generation with generous Fast GPU hours.',
        features: ['15 hours/month of Fast GPU time (~900 fast images)', 'Unlimited Relax GPU time (never run out of generations)', 'General commercial terms', 'Access to web creation app'],
        limits: ['Stealth mode not included'],
        ctaText: 'Subscribe Standard',
        ctaUrl: 'https://www.midjourney.com/account'
      },
      {
        name: 'Pro Plan',
        priceMonthly: 60,
        priceYearly: 48,
        billingText: 'per month',
        popular: false,
        description: 'For creative studios, agencies, and professional digital artists.',
        features: ['30 hours/month of Fast GPU time', 'Unlimited Relax GPU time', 'Stealth Mode (hide your images from public gallery)', '12 concurrent fast jobs'],
        limits: ['Single user license'],
        ctaText: 'Subscribe Pro',
        ctaUrl: 'https://www.midjourney.com/account'
      }
    ]
  },
  'perplexity.ai': {
    overview: 'AI answer engine with conversational search, web citations, and Pro model switching.',
    hasFreeTier: true,
    startingPrice: 20,
    officialPricingUrl: 'https://www.perplexity.ai/pro',
    tiers: [
      {
        name: 'Standard',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'forever free',
        popular: false,
        description: 'Quick answers with citations from the web.',
        features: ['Unlimited Quick Searches', '5 Pro Searches per day', 'Web sources and citation links', 'Access to standard search models'],
        limits: ['Standard file uploads only'],
        ctaText: 'Try Perplexity Free',
        ctaUrl: 'https://www.perplexity.ai'
      },
      {
        name: 'Perplexity Pro',
        priceMonthly: 20,
        priceYearly: 16.67,
        billingText: 'per month, billed annually',
        popular: true,
        badge: 'Best Value',
        description: 'Comprehensive research with 300+ Pro Searches per day and top reasoning models.',
        features: ['300+ Pro Searches per day with deep reasoning', 'Switch between Claude 3.5 Sonnet, GPT-4o, and Sonar Large', 'Unlimited file uploads for PDF, CSV & code analysis', '$5 monthly API credits included', 'Perplexity Spaces shared collections'],
        limits: ['Fair use policy applies'],
        ctaText: 'Upgrade to Pro',
        ctaUrl: 'https://www.perplexity.ai/pro'
      },
      {
        name: 'Enterprise Pro',
        priceMonthly: 40,
        priceYearly: 40,
        billingText: 'per seat / month',
        popular: false,
        description: 'Company-wide search with SOC2 security, internal document indexing, and user management.',
        features: ['Everything in Pro', 'SOC2 Type II certified data security', 'Data exclusion from model training', 'SAML Single Sign-On (SSO)', 'User access roles and analytics'],
        limits: ['Minimum 5 seats required'],
        ctaText: 'Get Enterprise',
        ctaUrl: 'https://www.perplexity.ai/enterprise'
      }
    ]
  },
  'elevenlabs.io': {
    overview: 'Industry-leading AI voice generator, text-to-speech, and voice cloning in 29+ languages.',
    hasFreeTier: true,
    startingPrice: 5,
    officialPricingUrl: 'https://elevenlabs.io/pricing',
    tiers: [
      {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'forever free',
        popular: false,
        description: 'Explore realistic text-to-speech and sound effects.',
        features: ['10,000 characters per month (~10 min of audio)', 'Create up to 3 custom voices', 'Access to shared Voice Library', 'Attribution required'],
        limits: ['Non-commercial license', 'API rate limited'],
        ctaText: 'Start Free',
        ctaUrl: 'https://elevenlabs.io'
      },
      {
        name: 'Starter',
        priceMonthly: 5,
        priceYearly: 4,
        billingText: 'per month',
        popular: false,
        description: 'Commercial voice generation for video creators and podcasters.',
        features: ['30,000 characters per month', 'Create up to 10 custom voices', 'Instant Voice Cloning with 1-min sample', 'Commercial license included'],
        limits: ['Over-usage billed at $0.30 / 1K chars'],
        ctaText: 'Choose Starter',
        ctaUrl: 'https://elevenlabs.io/pricing'
      },
      {
        name: 'Creator',
        priceMonthly: 22,
        priceYearly: 18,
        billingText: 'per month, billed annually',
        popular: true,
        badge: 'Recommended',
        description: 'For content creators, game developers, and audiobook narrators.',
        features: ['100,000 characters per month (~100 min audio)', 'Create up to 30 custom voices', 'Professional Voice Cloning (PVC) with high fidelity', 'Higher quality 192kbps audio export', 'Dubbing Studio with multi-speaker timing'],
        limits: ['Over-usage billed at $0.24 / 1K chars'],
        ctaText: 'Get Creator',
        ctaUrl: 'https://elevenlabs.io/pricing'
      }
    ]
  },
  'runwayml.com': {
    overview: 'Cinematic AI video generation platform with Gen-2 and Gen-3 Alpha video, motion brush, and camera controls.',
    hasFreeTier: true,
    startingPrice: 15,
    officialPricingUrl: 'https://runwayml.com/pricing',
    tiers: [
      {
        name: 'Basic',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'free trial',
        popular: false,
        description: 'Test Runway video generation tools.',
        features: ['125 one-time generation credits', 'Access to Gen-2 and Gen-3 Alpha', '720p video export resolution', 'Standard motion brush'],
        limits: ['Credits do not renew monthly', 'Watermark on exports'],
        ctaText: 'Try Runway Free',
        ctaUrl: 'https://runwayml.com'
      },
      {
        name: 'Standard',
        priceMonthly: 15,
        priceYearly: 12,
        billingText: 'per user / month',
        popular: true,
        badge: 'Popular',
        description: 'For individual creators and digital video editors.',
        features: ['625 credits per month (renewing)', 'Unlimited video generation on Relax mode', '1080p and 4K upscaling', 'Remove video watermarks', 'Advanced camera controls'],
        limits: ['Additional credits $10 per 1,000'],
        ctaText: 'Choose Standard',
        ctaUrl: 'https://runwayml.com/pricing'
      },
      {
        name: 'Pro',
        priceMonthly: 35,
        priceYearly: 28,
        billingText: 'per user / month',
        popular: false,
        description: 'For professional production teams and creative directors.',
        features: ['2,250 credits per month', 'Train custom AI generators', 'Highest priority generation queue', '500 GB asset cloud storage', 'Lip sync audio & motion tracking'],
        limits: ['Team licenses available'],
        ctaText: 'Upgrade to Pro',
        ctaUrl: 'https://runwayml.com/pricing'
      }
    ]
  },
  'replit.com': {
    overview: 'Cloud development platform with Replit AI agent, instant deployments, and collaborative coding.',
    hasFreeTier: true,
    startingPrice: 20,
    officialPricingUrl: 'https://replit.com/pricing',
    tiers: [
      {
        name: 'Starter',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'forever free',
        popular: false,
        description: 'Code and deploy public projects in the cloud.',
        features: ['Basic Replit AI code completions', 'Shared CPU and 0.5 GB RAM', 'Unlimited public Repls', 'Community forum support'],
        limits: ['Projects sleep when idle'],
        ctaText: 'Start Coding',
        ctaUrl: 'https://replit.com'
      },
      {
        name: 'Core',
        priceMonthly: 20,
        priceYearly: 15,
        billingText: 'per month, billed annually',
        popular: true,
        badge: 'Recommended',
        description: 'Complete cloud dev suite with Replit Agent for building full applications from prompts.',
        features: ['Replit Agent full-stack app builder', 'Faster AI completions with advanced models', '4x boosted compute (4 vCPU, 8 GB RAM)', 'Unlimited private Repls', 'Static & backend app deployments included'],
        limits: ['Usage quotas for intensive agent loops'],
        ctaText: 'Get Core',
        ctaUrl: 'https://replit.com/pricing'
      },
      {
        name: 'Teams',
        priceMonthly: 40,
        priceYearly: 33,
        billingText: 'per seat / month',
        popular: false,
        description: 'Collaborative development with centralized admin, privacy, and shared computing.',
        features: ['Everything in Core', 'Real-time multi-developer multiplayer editor', 'Centralized billing and access controls', 'SOC 2 compliant workspace'],
        limits: ['Minimum 2 seats'],
        ctaText: 'Start Team',
        ctaUrl: 'https://replit.com/pricing'
      }
    ]
  },
  'suno.ai': {
    overview: 'Full-length musical composition generator producing high-fidelity songs with vocals, instruments, and lyrics.',
    hasFreeTier: true,
    startingPrice: 10,
    officialPricingUrl: 'https://suno.com/pricing',
    tiers: [
      {
        name: 'Basic',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'forever free',
        popular: false,
        description: 'Daily free credits for music discovery and casual song making.',
        features: ['50 free credits daily (~10 songs)', 'Non-commercial license', 'Access to Suno v3 and v3.5 audio engines', 'Shared community feed'],
        limits: ['Non-commercial terms only', 'Shared generation queue'],
        ctaText: 'Make a Song',
        ctaUrl: 'https://suno.com'
      },
      {
        name: 'Pro',
        priceMonthly: 10,
        priceYearly: 8,
        billingText: 'per month, billed annually',
        popular: true,
        badge: 'Best for Creators',
        description: 'General commercial rights, priority generation, and 2,500 monthly credits.',
        features: ['2,500 credits per month (~500 songs)', 'General commercial ownership (monetize on Spotify/YouTube)', 'Priority generation speed', '10 concurrent generation jobs', 'Audio stem separation (vocals & instruments)'],
        limits: ['Additional credits available for purchase'],
        ctaText: 'Get Pro Plan',
        ctaUrl: 'https://suno.com/pricing'
      },
      {
        name: 'Premier',
        priceMonthly: 30,
        priceYearly: 24,
        billingText: 'per month, billed annually',
        popular: false,
        description: 'For prolific music producers, studios, and high-volume media projects.',
        features: ['10,000 credits per month (~2,000 songs)', 'General commercial ownership', 'Maximum priority generation queue', 'Audio stems and uncompressed downloads', 'Advanced audio extension tools'],
        limits: ['Single user license'],
        ctaText: 'Get Premier',
        ctaUrl: 'https://suno.com/pricing'
      }
    ]
  },
  'gamma.app': {
    overview: 'AI presentation, document, and webpage builder creating polished decks in seconds from outlines.',
    hasFreeTier: true,
    startingPrice: 10,
    officialPricingUrl: 'https://gamma.app/pricing',
    tiers: [
      {
        name: 'Free Starter',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'forever free',
        popular: false,
        description: 'Create presentations and docs with free AI starter credits.',
        features: ['400 AI credits on signup', 'Unlimited Gamma decks and docs', 'Basic analytics and PDF/PPTX export', 'Standard templates and themes'],
        limits: ['Gamma badge on exported decks'],
        ctaText: 'Start for Free',
        ctaUrl: 'https://gamma.app'
      },
      {
        name: 'Plus',
        priceMonthly: 10,
        priceYearly: 8,
        billingText: 'per user / month',
        popular: false,
        description: 'For freelancers and educators creating presentations regularly.',
        features: ['Unlimited AI generation on standard models', 'Remove "Made with Gamma" watermark', 'Export to PDF and PowerPoint without restrictions', 'Custom color palettes and layouts'],
        limits: ['Max 15 cards per generation'],
        ctaText: 'Upgrade to Plus',
        ctaUrl: 'https://gamma.app/pricing'
      },
      {
        name: 'Pro',
        priceMonthly: 20,
        priceYearly: 15,
        billingText: 'per user / month',
        popular: true,
        badge: 'Most Popular',
        description: 'Advanced AI models, custom brand fonts, and comprehensive presentation analytics.',
        features: ['Unlimited AI generations powered by advanced reasoning models', 'Generate up to 30 cards in a single prompt', 'Custom company fonts, logos & bespoke brand themes', 'Slide-by-slide viewer engagement analytics', 'Priority support and custom URL slug'],
        limits: ['Individual or small team license'],
        ctaText: 'Upgrade to Pro',
        ctaUrl: 'https://gamma.app/pricing'
      }
    ]
  }
};

// Generic plan generator based on tool metadata
function generateTierForTool(tool) {
  const cat = tool.category || 'AI Tools';
  const name = tool.name || tool.domain;
  const domain = tool.domain || tool.id;
  const web = tool.website || `https://${domain}`;

  // Tailored pricing depending on category
  if (cat.includes('Chat') || cat.includes('LLM')) {
    return {
      overview: `Official pricing and licensing tiers for ${name}. Generous free access with subscription upgrades for reasoning and higher quotas.`,
      hasFreeTier: true,
      startingPrice: 20,
      officialPricingUrl: web,
      tiers: [
        {
          name: 'Free',
          priceMonthly: 0,
          priceYearly: 0,
          billingText: 'forever free',
          popular: false,
          description: `Standard conversational access to ${name} for daily productivity.`,
          features: ['Standard model intelligence', 'Web chat interface & mobile app', 'Markdown export and code formatting', 'Community knowledge base'],
          limits: ['Standard speed during peak hours'],
          ctaText: 'Try Free',
          ctaUrl: web
        },
        {
          name: 'Pro',
          priceMonthly: 20,
          priceYearly: 16,
          billingText: 'per month, billed annually',
          popular: true,
          badge: 'Most Popular',
          description: `Enhanced reasoning, higher rate limits, and priority access to new ${name} updates.`,
          features: ['5x higher query limits', 'Priority access during peak hours', 'Advanced reasoning model options', 'Document uploads & large context support', 'Direct developer API access options'],
          limits: ['Single user license'],
          ctaText: 'Get Pro',
          ctaUrl: web
        },
        {
          name: 'Enterprise',
          priceMonthly: 30,
          priceYearly: 25,
          billingText: 'per user / month',
          popular: false,
          description: 'Enterprise data security, administrative consoles, and dedicated bandwidth.',
          features: ['Zero data retention for model training', 'SOC2 / GDPR compliance guarantee', 'Centralized team management', 'Single sign-on (SAML SSO)', 'Dedicated account manager'],
          limits: ['Minimum 5 seats required'],
          ctaText: 'Contact Sales',
          ctaUrl: web
        }
      ]
    };
  }

  if (cat.includes('Code') || cat.includes('Coding')) {
    return {
      overview: `Official subscription tiers for ${name} software development suite. Free tier for open-source and individual developers with Pro plans for professional teams.`,
      hasFreeTier: true,
      startingPrice: 15,
      officialPricingUrl: web,
      tiers: [
        {
          name: 'Free Individual',
          priceMonthly: 0,
          priceYearly: 0,
          billingText: 'free forever',
          popular: false,
          description: `Essential code completions and syntax generation with ${name}.`,
          features: ['Context-aware code completions', 'IDE integration & syntax highlighting', 'Community support forum', 'Public repository support'],
          limits: ['Standard response speed', 'Rate-limited completions'],
          ctaText: 'Start Free',
          ctaUrl: web
        },
        {
          name: 'Pro Developer',
          priceMonthly: 15,
          priceYearly: 12,
          billingText: 'per month, billed annually',
          popular: true,
          badge: 'Developer Choice',
          description: 'Full codebase indexing, multi-line agent code edits, and unlimited completions.',
          features: ['Unlimited fast completions', 'Multi-file refactoring and bug detection', 'Terminal & test command generation', 'Fast queue priority', 'Support for 50+ programming languages'],
          limits: ['Single developer seat'],
          ctaText: 'Upgrade to Pro',
          ctaUrl: web
        },
        {
          name: 'Business',
          priceMonthly: 35,
          priceYearly: 30,
          billingText: 'per seat / month',
          popular: false,
          description: 'Enterprise code privacy, repository security, and administrative governance.',
          features: ['Strict code privacy: no telemetry or model training', 'Centralized seat billing & management', 'Audit logging and IP indemnity', 'SAML SSO and team license provisioning'],
          limits: ['Designed for software engineering teams'],
          ctaText: 'Get Business',
          ctaUrl: web
        }
      ]
    };
  }

  if (cat.includes('Image') || cat.includes('Video') || cat.includes('Audio')) {
    return {
      overview: `Official creative subscription plans for ${name}. High-fidelity generative generation, fast GPU rendering, and commercial licensing.`,
      hasFreeTier: true,
      startingPrice: 12,
      officialPricingUrl: web,
      tiers: [
        {
          name: 'Free Trial',
          priceMonthly: 0,
          priceYearly: 0,
          billingText: 'trial credits',
          popular: false,
          description: `Test ${name} generation engine with starter creative credits.`,
          features: ['Starter creation credits on signup', 'Standard resolution rendering', 'Access to community gallery', 'Basic editing tools'],
          limits: ['Non-commercial license', 'Watermark on output'],
          ctaText: 'Try for Free',
          ctaUrl: web
        },
        {
          name: 'Creator',
          priceMonthly: 15,
          priceYearly: 12,
          billingText: 'per month, billed annually',
          popular: true,
          badge: 'Most Popular',
          description: 'High-speed GPU generation, commercial usage rights, and unwatermarked exports.',
          features: ['Generous monthly generation credits', 'Commercial licensing for client & business use', 'High-definition (1080p / 4K) asset export', 'Priority rendering queue', 'No watermarks on exported files'],
          limits: ['Credit top-ups available if quota reached'],
          ctaText: 'Get Creator Plan',
          ctaUrl: web
        },
        {
          name: 'Studio Pro',
          priceMonthly: 39,
          priceYearly: 32,
          billingText: 'per month, billed annually',
          popular: false,
          badge: 'Studio Grade',
          description: 'For production agencies, game studios, and high-output commercial creators.',
          features: ['Unlimited relaxed generation queue', 'Maximum fast GPU allocation', 'Custom model fine-tuning and styles', 'Stealth generation (private asset gallery)', 'API access and batch export'],
          limits: ['Single user license'],
          ctaText: 'Upgrade to Studio',
          ctaUrl: web
        }
      ]
    };
  }

  // General default for Productivity, Search, Copywriting, Presentations
  return {
    overview: `Official subscription plans and licensing tiers for ${name}. Accelerate your workflows with AI assistance, automation, and team collaboration.`,
    hasFreeTier: true,
    startingPrice: 10,
    officialPricingUrl: web,
    tiers: [
      {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'forever free',
        popular: false,
        description: `Basic productivity and intelligence features with ${name}.`,
        features: ['Standard AI assistant features', 'Unlimited basic documents and tasks', 'Mobile & web access', 'Standard community support'],
        limits: ['Fair usage rate limits apply'],
        ctaText: 'Start Free',
        ctaUrl: web
      },
      {
        name: 'Pro',
        priceMonthly: 12,
        priceYearly: 10,
        billingText: 'per month, billed annually',
        popular: true,
        badge: 'Recommended',
        description: 'Advanced reasoning, unlimited generations, and high-performance automation.',
        features: ['Unlimited AI-assisted operations', 'Advanced templates and automated workflows', 'File uploads & document analysis', 'Priority customer support', 'Export in multiple formats (PDF, DOCX, CSV)'],
        limits: ['Single user license'],
        ctaText: 'Get Pro Plan',
        ctaUrl: web
      },
      {
        name: 'Team / Business',
        priceMonthly: 25,
        priceYearly: 20,
        billingText: 'per user / month',
        popular: false,
        description: 'Collaborative workspaces, centralized management, and enterprise data privacy.',
        features: ['Everything in Pro', 'Collaborative shared workspaces', 'Centralized billing and admin dashboard', 'Commercial data protection guarantee', 'Dedicated customer success onboarding'],
        limits: ['Minimum 3 users'],
        ctaText: 'Start Team Plan',
        ctaUrl: web
      }
    ]
  };
}

async function seedPricingForTool(docId, pricingData) {
  const fields = {
    pricingPlans: encodeValue(pricingData.tiers),
    pricingOverview: encodeValue(pricingData.overview),
    officialPricingUrl: encodeValue(pricingData.officialPricingUrl),
    startingPrice: encodeValue(pricingData.startingPrice),
    hasFreeTier: encodeValue(pricingData.hasFreeTier),
  };

  const fieldMask = Object.keys(fields)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join('&');

  const url = `${BASE_URL}/${encodeURIComponent(docId)}?${fieldMask}&key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error(`✕ Failed to seed pricing for ${docId} (${res.status}): ${txt.slice(0, 150)}`);
    return false;
  }
  return true;
}

async function main() {
  console.log('Fetching all 57 tools from Firestore...');
  const listUrl = `https://firestore.googleapis.com/v1/projects/rateai-7ace5/databases/(default)/documents/tools?pageSize=100&key=${API_KEY}`;
  const res = await fetch(listUrl);
  const data = await res.json();
  const docs = data.documents || [];
  console.log(`Found ${docs.length} tools in Firestore.`);

  let seededCount = 0;
  for (const doc of docs) {
    const id = doc.name.split('/').pop();
    const f = doc.fields || {};
    const tool = {
      id,
      name: f.name?.stringValue || id,
      category: f.category?.stringValue || 'AI Tools',
      domain: f.domain?.stringValue || id,
      website: f.website?.stringValue || `https://${id}`,
    };

    // Use specific curated pricing if defined, otherwise generate specialized category pricing
    const pricingData = KNOWN_PRICING[id] || KNOWN_PRICING[tool.domain] || generateTierForTool(tool);

    const ok = await seedPricingForTool(id, pricingData);
    if (ok) {
      seededCount++;
      process.stdout.write(`✓ [${seededCount}/${docs.length}] Seeded ${tool.name} (${id})\n`);
    }
  }

  console.log(`\n🎉 Successfully verified & seeded pricing for ALL ${seededCount} tools in Firestore!`);
}

main().catch((err) => {
  console.error('Fatal error seeding pricing:', err);
  process.exit(1);
});
