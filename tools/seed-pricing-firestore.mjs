#!/usr/bin/env node
/**
 * Rate AI — Seed Firestore Pricing Database
 *
 * Populates real, verified AI tool subscription tiers into the Firestore
 * 'pricing' collection.
 *
 * Usage: node tools/seed-pricing-firestore.mjs
 */


export const PRICING_DATA = {
  'gemini.google.com': {
    toolName: 'Google Gemini',
    domain: 'gemini.google.com',
    category: 'LLMs & Chatbots',
    overview: 'Generous free access to Gemini 1.5 Flash with Google One AI Premium for Gemini 1.5 Pro and 2M token context.',
    hasFreeTier: true,
    startingPrice: 0,
    currency: 'USD',
    officialPricingUrl: 'https://one.google.com/explore-plan/gemini-advanced',
    tiers: [
      {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'forever free',
        popular: false,
        description: 'Standard access for everyday questions, code generation and document analysis.',
        features: [
          'Gemini 1.5 Flash fast multimodal reasoning',
          'Search grounding with live web citations',
          '32K token standard context window',
          'Google Docs, Sheets & Gmail integration'
        ],
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
        features: [
          'Gemini 1.5 Pro next-gen model access',
          'Massive 2,000,000 token context window',
          'Analyze video, audio files, and full repositories',
          '2 TB cloud storage on Google Drive',
          'Gemini in Gmail, Docs, Slides, and Meet'
        ],
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
        features: [
          'Enterprise data privacy: your data is never used to train models',
          'Gemini side-panel in Docs, Sheets, Slides, and Drive',
          'Centralized admin console & audit logging',
          'SOC 1/2/3, ISO 27001, HIPAA compliant'
        ],
        limits: ['Requires Google Workspace business domain'],
        ctaText: 'Contact Sales',
        ctaUrl: 'https://workspace.google.com/solutions/ai/'
      }
    ]
  },

  'claude.ai': {
    toolName: 'Anthropic Claude',
    domain: 'claude.ai',
    category: 'LLMs & Chatbots',
    overview: 'Free access to Claude 3.5 Sonnet with Pro subscriptions for 5x usage limits and Team workspaces.',
    hasFreeTier: true,
    startingPrice: 0,
    currency: 'USD',
    officialPricingUrl: 'https://claude.ai/pricing',
    tiers: [
      {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'free forever',
        popular: false,
        description: 'Talk to Claude on web and iOS for daily coding and writing.',
        features: [
          'Claude 3.5 Sonnet access (rate-limited)',
          'Artifacts live interactive code & diagrams preview',
          'Multimodal image analysis and file uploads',
          'Context window up to 200K tokens'
        ],
        limits: ['Daily message caps based on server load'],
        ctaText: 'Try Claude Free',
        ctaUrl: 'https://claude.ai'
      },
      {
        name: 'Claude Pro',
        priceMonthly: 20,
        priceYearly: 18,
        billingText: 'per month',
        popular: true,
        badge: 'Most Popular',
        description: 'For power users, software engineers, and researchers needing sustained capacity.',
        features: [
          '5x more usage compared to the free tier',
          'Priority bandwidth during peak operational hours',
          'Early access to new models (Opus, Sonnet upgrades)',
          'Create and share persistent Projects with reference docs',
          'Full Artifacts editor and live execution'
        ],
        limits: ['Single user personal account'],
        ctaText: 'Subscribe to Pro',
        ctaUrl: 'https://claude.ai/upgrade'
      },
      {
        name: 'Claude Team',
        priceMonthly: 30,
        priceYearly: 25,
        billingText: 'per user / month',
        popular: false,
        description: 'Collaborative workspaces with higher usage limits and administrative oversight.',
        features: [
          'Higher message capacity than Claude Pro',
          'Team-wide shared Projects and knowledge bases',
          'Centralized billing and team member management',
          'Priority customer support'
        ],
        limits: ['Minimum 5 users required'],
        ctaText: 'Get Team Plan',
        ctaUrl: 'https://claude.ai/team'
      }
    ]
  },

  'midjourney.com': {
    toolName: 'Midjourney',
    domain: 'midjourney.com',
    category: 'Image Generation',
    overview: 'Tiered subscription access for photorealistic image generation, parameter tuning, and commercial rights.',
    hasFreeTier: false,
    startingPrice: 10,
    currency: 'USD',
    officialPricingUrl: 'https://docs.midjourney.com/docs/plans',
    tiers: [
      {
        name: 'Basic Plan',
        priceMonthly: 10,
        priceYearly: 8,
        billingText: 'per month',
        popular: false,
        description: 'Entry-level creation for hobbyists and individual artists.',
        features: [
          '3.3 Fast GPU hours/month (~200 generations)',
          'General commercial usage rights',
          'Access to member gallery and community',
          'Web alpha generation access'
        ],
        limits: ['No Relax (unlimited) GPU time', 'No Stealth mode'],
        ctaText: 'Select Basic',
        ctaUrl: 'https://www.midjourney.com/account'
      },
      {
        name: 'Standard Plan',
        priceMonthly: 30,
        priceYearly: 24,
        billingText: 'per month',
        popular: true,
        badge: 'Best Value',
        description: 'Unlimited image generation for designers and active creators.',
        features: [
          '15 Fast GPU hours/month',
          'Unlimited Relaxed GPU generations (never run out)',
          'Full commercial licensing rights',
          'Concurrent job capacity up to 3 active generations'
        ],
        limits: ['No Stealth mode (images visible in public gallery)'],
        ctaText: 'Select Standard',
        ctaUrl: 'https://www.midjourney.com/account'
      },
      {
        name: 'Pro Plan',
        priceMonthly: 60,
        priceYearly: 48,
        billingText: 'per month',
        popular: false,
        description: 'High-volume studio production with private stealth image generation.',
        features: [
          '30 Fast GPU hours/month + Unlimited Relax',
          'Stealth Mode: hide your generations from public gallery',
          '12 Concurrent fast jobs at once',
          'Highest queue priority'
        ],
        limits: ['Single creator account'],
        ctaText: 'Select Pro',
        ctaUrl: 'https://www.midjourney.com/account'
      }
    ]
  },

  'perplexity.ai': {
    toolName: 'Perplexity AI',
    domain: 'perplexity.ai',
    category: 'Research & Search',
    overview: 'Next-generation AI answer engine with live search grounding and multi-model Pro selection.',
    hasFreeTier: true,
    startingPrice: 0,
    currency: 'USD',
    officialPricingUrl: 'https://www.perplexity.ai/pro',
    tiers: [
      {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'free forever',
        popular: false,
        description: 'Unlimited quick search queries with real-time web citations.',
        features: [
          'Unlimited standard Quick Search queries',
          '5 Pro Search queries per day',
          'Live source citations with web grounding',
          'Collections and search thread sharing'
        ],
        limits: ['5 Pro searches / day', 'Standard model selection'],
        ctaText: 'Start Searching',
        ctaUrl: 'https://www.perplexity.ai'
      },
      {
        name: 'Perplexity Pro',
        priceMonthly: 20,
        priceYearly: 16.67,
        billingText: 'per month ($200/yr)',
        popular: true,
        badge: 'Recommended',
        description: 'Comprehensive research engine with 300+ daily Pro queries and model switching.',
        features: [
          '300+ Pro Search queries every single day',
          'Switch models: Claude 3.5 Sonnet, GPT-4o, Sonar Large',
          'Unlimited file and PDF upload analysis',
          '$5 monthly API credit included',
          'Dedicated Pro support channel'
        ],
        limits: ['Individual license'],
        ctaText: 'Upgrade to Pro',
        ctaUrl: 'https://www.perplexity.ai/pro'
      },
      {
        name: 'Enterprise Pro',
        priceMonthly: 40,
        priceYearly: 40,
        billingText: 'per seat / month',
        popular: false,
        description: 'SOC2-certified research intelligence for enterprise knowledge discovery.',
        features: [
          'Internal company document search integration',
          'Zero data retention: queries not stored or used for training',
          'SSO / SAML authentication and SCIM provisioning',
          'Dedicated account manager'
        ],
        limits: ['Minimum 5 seats'],
        ctaText: 'Contact Enterprise',
        ctaUrl: 'https://www.perplexity.ai/enterprise'
      }
    ]
  },

  'elevenlabs.io': {
    toolName: 'ElevenLabs',
    domain: 'elevenlabs.io',
    category: 'Audio & Speech',
    overview: 'Industry-leading realistic AI voice cloning, text-to-speech, and sound effect generation.',
    hasFreeTier: true,
    startingPrice: 0,
    currency: 'USD',
    officialPricingUrl: 'https://elevenlabs.io/pricing',
    tiers: [
      {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'forever free',
        popular: false,
        description: 'Explore voice generation for personal and non-commercial projects.',
        features: [
          '10,000 characters per month (~10 mins audio)',
          'Create up to 3 custom voices',
          'Access to shared community voice library',
          'Automatic dubbing in 29 languages'
        ],
        limits: ['Attribution required', 'No commercial license'],
        ctaText: 'Get Started',
        ctaUrl: 'https://elevenlabs.io'
      },
      {
        name: 'Starter',
        priceMonthly: 5,
        priceYearly: 4.17,
        billingText: 'first month $1',
        popular: false,
        description: 'For creators publishing lightweight podcasts, audiobooks, and videos.',
        features: [
          '30,000 characters per month',
          'Commercial license included',
          'Instant voice cloning with 1-min audio samples',
          'Create up to 10 custom voices'
        ],
        limits: ['Standard character quotas apply'],
        ctaText: 'Start for $1',
        ctaUrl: 'https://elevenlabs.io/pricing'
      },
      {
        name: 'Creator',
        priceMonthly: 22,
        priceYearly: 18.33,
        billingText: 'first month $11',
        popular: true,
        badge: 'Most Popular',
        description: 'For content creators, game developers, and professional video narrators.',
        features: [
          '100,000 characters per month (~100 mins audio)',
          'Professional voice cloning with studio training',
          'Create up to 30 custom voices',
          'High-fidelity 192kbps audio output',
          'Priority queue generation'
        ],
        limits: ['Overages billed at $0.30 per 1,000 characters'],
        ctaText: 'Upgrade to Creator',
        ctaUrl: 'https://elevenlabs.io/pricing'
      },
      {
        name: 'Pro',
        priceMonthly: 99,
        priceYearly: 82.50,
        billingText: 'per month',
        popular: false,
        description: 'High-volume production for commercial publishers and media studios.',
        features: [
          '500,000 characters per month (~500 mins audio)',
          'Create up to 160 custom voices',
          'Highest tier audio rendering latency',
          'Dedicated API rate limit pool'
        ],
        limits: ['Overages billed at $0.24 per 1,000 characters'],
        ctaText: 'Select Pro',
        ctaUrl: 'https://elevenlabs.io/pricing'
      }
    ]
  },

  'runwayml.com': {
    toolName: 'Runway Gen-2 & Gen-3',
    domain: 'runwayml.com',
    category: 'Video Generation',
    overview: 'Hollywood-grade generative AI video synthesis, text-to-video, and motion control.',
    hasFreeTier: true,
    startingPrice: 0,
    currency: 'USD',
    officialPricingUrl: 'https://runwayml.com/pricing',
    tiers: [
      {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'one-time 125 credits',
        popular: false,
        description: 'Test Gen-2 and Gen-3 Alpha video generation capabilities.',
        features: [
          '125 one-time video generation credits',
          'Gen-3 Alpha and Gen-2 access',
          'Up to 3 video project slots',
          'Standard 720p export resolution'
        ],
        limits: ['Watermarked outputs', 'No credit replenishment'],
        ctaText: 'Try Runway',
        ctaUrl: 'https://runwayml.com'
      },
      {
        name: 'Standard',
        priceMonthly: 15,
        priceYearly: 12,
        billingText: 'per user / month',
        popular: false,
        description: 'For individual creators and social media video editors.',
        features: [
          '625 monthly credits (replenished every month)',
          'No watermarks on video outputs',
          '4K upscale and 1080p generation',
          'Motion Brush and Camera Control tools',
          'Buy extra credits as needed'
        ],
        limits: ['Single user workspace'],
        ctaText: 'Choose Standard',
        ctaUrl: 'https://runwayml.com/pricing'
      },
      {
        name: 'Pro',
        priceMonthly: 35,
        priceYearly: 28,
        billingText: 'per user / month',
        popular: true,
        badge: 'Recommended',
        description: 'For professional video artists, production agencies, and studios.',
        features: [
          '2,250 monthly credits',
          'Custom voice and style model training',
          'Unlimited video project assets',
          'All Gen-3 Alpha camera motions unlocked'
        ],
        limits: ['Fair usage policies apply'],
        ctaText: 'Choose Pro',
        ctaUrl: 'https://runwayml.com/pricing'
      },
      {
        name: 'Unlimited',
        priceMonthly: 95,
        priceYearly: 76,
        billingText: 'per user / month',
        popular: false,
        description: 'Unlimited relaxed video generation for heavy studio workloads.',
        features: [
          'Unlimited Relaxed video generations (never stop generating)',
          '2,250 Fast credits included per month',
          'First priority on high-demand GPU clusters',
          'Early access to experimental video models'
        ],
        limits: ['Commercial enterprise terms available'],
        ctaText: 'Go Unlimited',
        ctaUrl: 'https://runwayml.com/pricing'
      }
    ]
  },

  'openai.com': {
    toolName: 'ChatGPT (OpenAI)',
    domain: 'openai.com',
    category: 'LLMs & Chatbots',
    overview: 'Flagship conversational intelligence with GPT-4o, real-time voice, Canvas interactive workspaces, and DALL·E 3.',
    hasFreeTier: true,
    startingPrice: 0,
    currency: 'USD',
    officialPricingUrl: 'https://openai.com/chatgpt/pricing/',
    tiers: [
      {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'free forever',
        popular: false,
        description: 'Standard intelligence for day-to-day writing, questions, and web searches.',
        features: [
          'GPT-4o mini unlimited and limited GPT-4o access',
          'Standard voice conversations and file uploads',
          'Web browsing search grounding with real-time links',
          'Access to custom GPTs in the GPT Store'
        ],
        limits: ['Rate limits apply during peak hours', 'Limited DALL·E 3 generations'],
        ctaText: 'Start Free',
        ctaUrl: 'https://chatgpt.com'
      },
      {
        name: 'Plus',
        priceMonthly: 20,
        priceYearly: 20,
        billingText: 'per month',
        popular: true,
        description: 'Up to 5x higher limits on GPT-4o and access to advanced reasoning (OpenAI o1).',
        features: [
          'Access to OpenAI o1 reasoning model and o1-mini',
          '5x higher message limit for GPT-4o',
          'Advanced Voice Mode with real-time emotional inflections',
          'Canvas collaborative writing and coding canvas',
          'Unlimited DALL·E 3 image generations',
          'Early access to new experimental features'
        ],
        limits: ['Fair usage limits on advanced models'],
        ctaText: 'Upgrade to Plus',
        ctaUrl: 'https://chatgpt.com'
      },
      {
        name: 'Team',
        priceMonthly: 30,
        priceYearly: 25,
        billingText: 'per user / month (min 2 seats)',
        popular: false,
        description: 'Higher message caps, shared team workspaces, and enterprise data privacy guarantee.',
        features: [
          'Higher message caps on GPT-4o and o1 models',
          'Customer business data is excluded from model training',
          'Shared workspace for custom GPT creation & sharing',
          'Admin console, member management, and centralized billing'
        ],
        limits: ['Minimum 2 users'],
        ctaText: 'Start Team',
        ctaUrl: 'https://openai.com/chatgpt/team/'
      }
    ]
  },

  'cursor.sh': {
    toolName: 'Cursor AI',
    domain: 'cursor.sh',
    category: 'Code & Development',
    overview: 'The AI-first code editor built on VS Code with multi-file Composer editing and codebase indexing.',
    hasFreeTier: true,
    startingPrice: 0,
    currency: 'USD',
    officialPricingUrl: 'https://www.cursor.com/pricing',
    tiers: [
      {
        name: 'Hobby',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'free forever',
        popular: false,
        description: 'Two-week Pro trial followed by free usage for personal side projects.',
        features: [
          '2,000 completions per month',
          '50 slow premium requests',
          'Full VS Code extension ecosystem compatibility',
          'Local codebase index for single repositories'
        ],
        limits: ['Slow query queue during peak hours'],
        ctaText: 'Download Free',
        ctaUrl: 'https://www.cursor.com'
      },
      {
        name: 'Pro',
        priceMonthly: 20,
        priceYearly: 16,
        billingText: 'per month',
        popular: true,
        description: 'Fast premium models including Claude 3.5 Sonnet and Cursor Composer multi-file editor.',
        features: [
          '500 fast premium model requests/mo (Claude 3.5 Sonnet & GPT-4o)',
          'Unlimited slow premium requests',
          'Unlimited Cursor Tab completions',
          'Cursor Composer multi-file code editing',
          'High-speed codebase vector indexing'
        ],
        limits: ['Standard usage limits after 500 fast requests'],
        ctaText: 'Upgrade to Pro',
        ctaUrl: 'https://www.cursor.com/pricing'
      },
      {
        name: 'Business',
        priceMonthly: 40,
        priceYearly: 40,
        billingText: 'per user / month',
        popular: false,
        description: 'Team admin controls, privacy mode enforced, and centralized license pooling.',
        features: [
          'Enforced privacy mode across all organization members',
          'Centralized admin billing and user provisioning',
          'Pooled fast requests across the engineering team',
          'SAML / SSO integration'
        ],
        limits: ['Custom terms for enterprise fleets'],
        ctaText: 'Get Business',
        ctaUrl: 'https://www.cursor.com/pricing'
      }
    ]
  },

  'replit.com': {
    toolName: 'Replit AI',
    domain: 'replit.com',
    category: 'Code & Development',
    overview: 'Full-stack cloud IDE with Replit Agent for building and deploying software autonomously.',
    hasFreeTier: true,
    startingPrice: 0,
    currency: 'USD',
    officialPricingUrl: 'https://replit.com/pricing',
    tiers: [
      {
        name: 'Starter',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'free forever',
        popular: false,
        description: 'Core cloud workspaces and basic AI code suggestions.',
        features: [
          'Basic cloud development environment',
          'Public Repl workspaces',
          'Standard community computing power',
          'Limited AI code completion assistance'
        ],
        limits: ['Limited speed and public-only workspaces'],
        ctaText: 'Start Coding',
        ctaUrl: 'https://replit.com'
      },
      {
        name: 'Core',
        priceMonthly: 25,
        priceYearly: 20,
        billingText: 'per month billed annually',
        popular: true,
        description: 'Unlimited AI chat, advanced Replit Agent checkpoints, and 4x faster compute.',
        features: [
          'Replit Agent for autonomous full-stack development',
          'Unlimited basic AI chat & code completion',
          'Private Repls and custom domains',
          'High-performance cloud virtual machines (4 vCPU, 8GB RAM)'
        ],
        limits: ['Agent checkpoints billed per usage balance'],
        ctaText: 'Upgrade to Core',
        ctaUrl: 'https://replit.com/pricing'
      },
      {
        name: 'Teams',
        priceMonthly: 40,
        priceYearly: 35,
        billingText: 'per user / month',
        popular: false,
        description: 'Team collaboration, shared secrets management, and enterprise compute clusters.',
        features: [
          'Collaborative real-time multiplayer editing',
          'Shared organizational Repls and secrets store',
          'Team role-based access controls and analytics',
          'Priority compute and dedicated support'
        ],
        limits: ['Minimum 3 seats'],
        ctaText: 'Get Teams',
        ctaUrl: 'https://replit.com/pricing'
      }
    ]
  },

  'suno.ai': {
    toolName: 'Suno AI',
    domain: 'suno.ai',
    category: 'Audio & Music',
    overview: 'Generates full radio-ready songs with vocals, instruments, and mixing from plain text prompts.',
    hasFreeTier: true,
    startingPrice: 0,
    currency: 'USD',
    officialPricingUrl: 'https://suno.com/account',
    tiers: [
      {
        name: 'Basic',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'free forever',
        popular: false,
        description: 'Free daily credits for music enthusiasts to try songwriting.',
        features: [
          '50 credits renewed daily (approx 10 songs/day)',
          'Standard generation queue',
          'Non-commercial terms of use',
          'Suno v3 and v3.5 audio engine'
        ],
        limits: ['Non-commercial license', 'Cannot upload own audio'],
        ctaText: 'Create Music',
        ctaUrl: 'https://suno.com'
      },
      {
        name: 'Pro',
        priceMonthly: 10,
        priceYearly: 8,
        billingText: 'per month',
        popular: true,
        description: 'Commercial rights, 2,500 monthly credits, and priority generation speed.',
        features: [
          '2,500 credits per month (500 songs)',
          'Commercial copyright ownership of generated tracks',
          'High-priority generation queue',
          'Audio input feature: extend and remix your own audio',
          'Separate vocal and instrumental stems export'
        ],
        limits: ['Standard monthly credit cap'],
        ctaText: 'Upgrade to Pro',
        ctaUrl: 'https://suno.com'
      },
      {
        name: 'Premier',
        priceMonthly: 30,
        priceYearly: 24,
        billingText: 'per month',
        popular: false,
        description: 'Power user plan with 10,000 credits for music producers and video creators.',
        features: [
          '10,000 credits per month (2,000 songs)',
          'Full commercial licensing for streaming platforms (Spotify, Apple)',
          'Highest priority queue for instant rendering',
          'Stem separation and lossless WAV audio export'
        ],
        limits: ['Annual or monthly subscription'],
        ctaText: 'Get Premier',
        ctaUrl: 'https://suno.com'
      }
    ]
  },

  'gamma.app': {
    toolName: 'Gamma App',
    domain: 'gamma.app',
    category: 'Presentations & Slides',
    overview: 'Generates stunning interactive decks, documents, and web pages from simple outlines.',
    hasFreeTier: true,
    startingPrice: 0,
    currency: 'USD',
    officialPricingUrl: 'https://gamma.app/pricing',
    tiers: [
      {
        name: 'Free',
        priceMonthly: 0,
        priceYearly: 0,
        billingText: 'free forever',
        popular: false,
        description: '400 AI credits on signup to create initial presentations and docs.',
        features: [
          '400 AI generation credits upon sign-up',
          'Basic themes and slide layouts',
          'Export to PDF and PPTX',
          '7-day revision history'
        ],
        limits: ['Includes "Made with Gamma" badge', 'Credit balance does not refresh monthly'],
        ctaText: 'Start for Free',
        ctaUrl: 'https://gamma.app'
      },
      {
        name: 'Plus',
        priceMonthly: 10,
        priceYearly: 8,
        billingText: 'per user / month',
        popular: false,
        description: 'Removes branding and grants unlimited AI generations for individual creators.',
        features: [
          'Unlimited AI card generation & editing',
          'Remove "Made with Gamma" badge',
          'Custom card dimensions and widescreen formats',
          '30-day revision history'
        ],
        limits: ['Up to 15 cards per generation'],
        ctaText: 'Upgrade to Plus',
        ctaUrl: 'https://gamma.app/pricing'
      },
      {
        name: 'Pro',
        priceMonthly: 20,
        priceYearly: 15,
        billingText: 'per user / month',
        popular: true,
        description: 'Advanced AI models, custom brand fonts, and comprehensive presentation analytics.',
        features: [
          'Unlimited AI generations powered by advanced reasoning models',
          'Generate up to 30 cards in a single prompt',
          'Custom company fonts, logos & bespoke brand themes',
          'Slide-by-slide viewer engagement analytics',
          'Priority support and custom URL slug'
        ],
        limits: ['Individual or small team license'],
        ctaText: 'Upgrade to Pro',
        ctaUrl: 'https://gamma.app/pricing'
      }
    ]
  }
};

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
    console.error(`Failed to seed pricing for ${docId} (${res.status}): ${txt.slice(0, 150)}`);
    return false;
  }
  console.log(`✓ Seeded pricing for: ${docId} (${pricingData.toolName})`);
  return true;
}

async function main() {
  console.log('Seeding AI tool pricing database in Firestore tools collection...');
  let count = 0;
  for (const [id, data] of Object.entries(PRICING_DATA)) {
    const ok = await seedPricingForTool(id, data);
    if (ok) count++;
  }
  console.log(`Successfully seeded pricing for ${count} tools in Firestore!`);
}

main().catch((err) => {
  console.error('Fatal error during pricing seed:', err);
  process.exit(1);
});
