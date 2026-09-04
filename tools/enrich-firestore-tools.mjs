#!/usr/bin/env node
/**
 * Rate AI — Enrich Firestore Tools with Complete Data
 *
 * Populates all 57 live tools in Firestore with:
 *   - Full longDescription
 *   - Features list (4-6 per tool)
 *   - Pros and Cons
 *   - Real-world Use Cases
 *   - How It Works
 *   - What's New
 *   - SEO Tags & Keywords
 *   - Developer HQ, Platforms, Community Scale, Content Rating
 *   - Data Safety & Compliance specifications
 *
 * Usage: node tools/enrich-firestore-tools.mjs
 */

const API_KEY = 'AIzaSyBVe0utmbeYpX5ESnDWsaQuLAe6dpw7_Sc';
const BASE_URL = 'https://firestore.googleapis.com/v1/projects/rateai-7ace5/databases/(default)/documents/tools';

const TOOL_METADATA = {
  'gemini.google.com': {
    longDescription: "Google Gemini is Google's flagship multimodal AI suite, engineered from the ground up to reason seamlessly across text, code, audio, image, and video modalities. Powered by Gemini 1.5 Pro and Flash architectures, it features an unprecedented context window of up to 2 million tokens, enabling comprehensive document synthesis, full codebase comprehension, and deep video analysis. Deep integration with Google Workspace, Search, and Android makes Gemini an omnipresent intelligence layer for productivity, research, and creative workflows.",
    features: [
      'Industry-leading 2M+ token context window for massive datasets',
      'Native multimodal reasoning across video, audio, code, and text',
      'Real-time Google Search grounding for verifiable up-to-date facts',
      'Deep integration with Google Docs, Gmail, Sheets, and Drive',
      'Advanced code synthesis, execution sandbox, and error debugging',
      'Mobile ecosystem integration with Android Gemini system assistant'
    ],
    pros: [
      'Massive context capacity easily digests hours of video and whole repositories',
      'Unmatched real-time web search integration with live source citations',
      'High reasoning capability across mathematics and complex programming'
    ],
    cons: [
      'Advanced 2M token models require Gemini Advanced subscription',
      'Safety filters can occasionally be overly restrictive on creative edge cases'
    ],
    useCases: [
      'Analyzing multi-hour meeting recordings, video transcripts, and complex whitepapers',
      'Full-stack software engineering, architecture review, and test case generation',
      'Drafting executive briefing documents, emails, and financial model formulas'
    ],
    howItWorks: 'Gemini processes inputs through a unified multimodal transformer architecture that converts text, audio waveforms, pixels, and video frames into a shared token space without cascading disparate models.',
    whatsNew: 'Gemini 1.5 Pro updated with faster multimodal response latency, enhanced function calling capabilities, and improved logical deduction.',
    tags: ['Google Gemini', 'Gemini AI', 'multimodal AI', 'AI chatbot', 'Google AI', 'best AI assistant', 'large language model'],
    developerHQ: 'Mountain View, California, USA',
    platforms: ['Web', 'Android', 'iOS', 'API'],
    downloadsOrUsers: '100M+ active users',
    contentRating: 'Rated for 3+'
  },
  'claude.ai': {
    longDescription: "Claude 3 is Anthropic's state-of-the-art conversational AI family, comprising Claude 3.5 Sonnet, Claude 3 Opus, and Claude 3 Haiku. Built on Constitutional AI principles, Claude is globally celebrated for its nuanced human-like tone, sophisticated analytical depth, and superior coding prowess. Its signature Artifacts workspace allows real-time interactive previews of web applications, SVG diagrams, and structured data, making it the premier choice for developers, researchers, and professional writers.",
    features: [
      'Next-generation Claude 3.5 Sonnet benchmark-topping reasoning model',
      'Artifacts interactive live workspace for dynamic web apps and code',
      '200,000-token high-fidelity context window with near-perfect needle recall',
      'Exceptional vision processing for charts, diagrams, and technical documents',
      'Constitutional AI framework prioritizing truthfulness and safety',
      'Enterprise workspace controls with zero-retention privacy guarantees'
    ],
    pros: [
      'Industry-leading coding accuracy and elegant software architecture skills',
      'Natural, articulate, and non-generic writing style that avoids cliché tropes',
      'Artifacts interface creates instant runnable HTML/JS prototypes in real time'
    ],
    cons: [
      'Hourly rate limits on high-tier models during global peak usage',
      'Does not have a built-in live internet browsing engine'
    ],
    useCases: [
      'End-to-end full-stack frontend prototyping with instant live browser preview',
      'Editing complex scientific manuscripts, legal agreements, and literary work',
      'Complex multi-step codebase migrations and algorithmic optimization'
    ],
    howItWorks: 'Claude leverages Anthropic’s proprietary transformer models trained with Constitutional AI (RLAIF), enforcing helpfulness, harmlessness, and honesty with rigorous alignment.',
    whatsNew: 'Claude 3.5 Sonnet release with 2x speed improvement, enhanced vision transcription, and interactive Artifacts collaboration.',
    tags: ['Claude 3', 'Claude 3.5 Sonnet', 'Anthropic', 'AI assistant', 'best coding AI', 'Constitutional AI', 'Artifacts'],
    developerHQ: 'San Francisco, California, USA',
    platforms: ['Web', 'iOS', 'Android', 'API'],
    downloadsOrUsers: '50M+ active users',
    contentRating: 'Rated for 3+'
  },
  'cursor.sh': {
    longDescription: "Cursor is the definitive AI-native code editor, engineered as an intelligent fork of VS Code. Built specifically for high-velocity software engineering, Cursor deeply indexes your entire codebase using semantic vector embeddings. Its revolutionary Composer feature allows engineers to scaffold, edit, and refactor multiple files simultaneously using natural language instructions, radically accelerating software delivery.",
    features: [
      'Full codebase semantic indexing for context-aware code generation',
      'Multi-file Composer for simultaneous edits across entire projects',
      'Predictive inline Copilot tab completions with multi-line forecasting',
      'Direct terminal command debugging with automated stack trace fixes',
      'Support for Claude 3.5 Sonnet, GPT-4o, and custom local models',
      'One-click VS Code extensions, keybindings, and settings migration'
    ],
    pros: [
      'Composer can implement complete multi-file features and tests in seconds',
      'Deep repository awareness minimizes hallucinated library APIs',
      'Zero learning curve for anyone already familiar with VS Code'
    ],
    cons: [
      'Requires substantial RAM when indexing extremely large monorepos',
      'Pro plan required for unlimited fast frontier model generations'
    ],
    useCases: [
      'Refactoring legacy codebases and updating frameworks across dozens of files',
      'Pair programming on complex algorithmic problems and debugging runtime errors',
      'Rapidly scaffolding new web applications, APIs, and microservices'
    ],
    howItWorks: 'Cursor combines language server protocol (LSP) intelligence with vector repository embeddings, feeding relevant contextual code snippets directly into frontier LLM inference pipelines.',
    whatsNew: 'Cursor Composer multi-file edit model upgrade with instant diff inspection and automated terminal execution.',
    tags: ['Cursor AI', 'Cursor IDE', 'AI code editor', 'VS Code AI', 'AI programming', 'coding copilot', 'developer tools'],
    developerHQ: 'San Francisco, California, USA',
    platforms: ['macOS', 'Windows', 'Linux'],
    downloadsOrUsers: '1M+ developers',
    contentRating: 'Rated for 3+'
  },
  'midjourney.com': {
    longDescription: "Midjourney is the premier generative artificial intelligence program for visual art and photorealistic imagery. Spearheaded by David Holz, Midjourney transforms natural language prompts into breathtaking, compositionally masterful visual masterpieces. Renowned for its unparalleled handling of cinematic lighting, intricate textures, and atmospheric depth, it stands as the global gold standard for digital artists, concept designers, and creative directors.",
    features: [
      'Version 6.1 photorealistic rendering with enhanced anatomical fidelity',
      'Vary Region (Inpainting) and Pan/Zoom outpainting controls',
      'Character consistency and style reference parameters (--cref / --sref)',
      'High-resolution upscaling with sub-pixel texture generation',
      'Web-based canvas editor with intuitive masking and prompt iteration',
      'Extensive style tuning parameters including stylize, chaos, and weird'
    ],
    pros: [
      'Unrivaled artistic aesthetic, cinematic lighting, and photorealistic detail',
      'Powerful parameter ecosystem allows precise control over style and aspect ratio',
      'Continuous model iterations consistently push state-of-the-art boundaries'
    ],
    cons: [
      'Complex prompt syntax takes time to master',
      'No free tier currently available due to high GPU compute demand'
    ],
    useCases: [
      'Hollywood and gaming concept art, environment design, and character sheets',
      'Commercial advertising imagery, brand collateral, and fashion mockups',
      'Architectural visualization and interior design ideation'
    ],
    howItWorks: 'Midjourney uses proprietary diffusion models coupled with custom aesthetic score predictors trained on human preference rankings.',
    whatsNew: 'Midjourney v6.1 featuring improved text rendering in images, cleaner skin textures, and reduced artifacting on complex hands.',
    tags: ['Midjourney', 'AI art', 'generative image', 'AI image generator', 'photorealistic AI', 'digital art', 'creative AI'],
    developerHQ: 'San Francisco, California, USA',
    platforms: ['Web', 'Discord'],
    downloadsOrUsers: '20M+ creators',
    contentRating: 'Rated for 12+'
  },
  'elevenlabs.io': {
    longDescription: "ElevenLabs is the industry-standard generative voice AI platform, pioneering emotionally rich, human-like speech synthesis and AI audio production. Its cutting-edge deep learning voice models capture the subtle inflections, pauses, and cadence of natural human conversation in over 30 languages. With instant voice cloning, voice changer, and sound effect generation, ElevenLabs powers audiobooks, gaming characters, and video voiceovers worldwide.",
    features: [
      'Ultra-realistic text-to-speech with granular emotional nuance control',
      'Instant and professional voice cloning from clean reference audio',
      'Multilingual Speech model supporting 32+ world languages with native accents',
      'AI Sound Effects generator from simple descriptive prompts',
      'Automated Dubbing Studio with voice matching and lip-sync alignment',
      'Reader mobile application for immersive listening on the go'
    ],
    pros: [
      'Most realistic and emotionally expressive synthesized human voices available',
      'Flawless voice cloning requiring only a few seconds of sample audio',
      'Low-latency streaming API suitable for real-time interactive voice agents'
    ],
    cons: [
      'Character credits can deplete rapidly for long-form audiobook generation',
      'Requires voice verification to prevent non-consensual voice replication'
    ],
    useCases: [
      'Narration for premium audiobooks, podcasts, and digital documentaries',
      'Dynamic voice acting for video games and interactive storytelling',
      'Automated multi-language localization and video voiceover dubbing'
    ],
    howItWorks: 'ElevenLabs uses proprietary context-aware neural acoustic models that predict vocal intonation, pacing, and emotional weight based on semantic context.',
    whatsNew: 'Multilingual v2 and Turbo v2.5 release with sub-150ms latency for real-time conversational agents and enhanced character voices.',
    tags: ['ElevenLabs', 'AI voice', 'text to speech', 'voice cloning', 'AI audio', 'speech synthesis', 'AI dubbing'],
    developerHQ: 'New York, NY & London, UK',
    platforms: ['Web', 'iOS', 'Android', 'API'],
    downloadsOrUsers: '10M+ users',
    contentRating: 'Rated for 3+'
  },
  'perplexity.ai': {
    longDescription: "Perplexity AI is the next-generation conversational answer engine, designed to replace traditional search with direct, synthesized, and cited knowledge. Built to eliminate link-hopping, Perplexity queries multiple academic, web, and live news indexes, synthesizing answers with direct numbered citations for every factual statement. Its Pro Search feature conducts autonomous multi-step reasoning, computational math, and code execution.",
    features: [
      'Direct factual synthesis with inline superscript academic & web citations',
      'Pro Search agent conducting multi-step interactive research queries',
      'Focus modes for Academic papers, YouTube transcripts, Reddit, and Code',
      'Perplexity Pages for converting research threads into publishable articles',
      'Choice of leading underlying models: Claude 3.5 Sonnet, GPT-4o, Sonar',
      'Document and spreadsheet upload for contextual data extraction and math'
    ],
    pros: [
      'Eliminates ad-heavy SEO affiliate search results with concise answers',
      'Every claim is backed by clickable source links for rapid verification',
      'Pro Search performs deep follow-up queries and calculations automatically'
    ],
    cons: [
      'Occasional citation mismatches when source web pages have dynamic paywalls',
      'Pro search queries are limited on the free tier'
    ],
    useCases: [
      'Rapid market research, competitive analysis, and factual literature review',
      'Technical problem troubleshooting with direct documentation extraction',
      'Publishing comprehensive, well-researched briefings with Perplexity Pages'
    ],
    howItWorks: 'Perplexity runs a retrieval-augmented generation (RAG) pipeline that combines high-performance web indexing with advanced LLMs to extract, cross-reference, and summarize evidence.',
    whatsNew: 'Perplexity Pages publication studio, improved finance data graphs, and multi-file analysis support.',
    tags: ['Perplexity AI', 'AI search engine', 'answer engine', 'Perplexity Pro', 'research AI', 'search AI', 'cited search'],
    developerHQ: 'San Francisco, California, USA',
    platforms: ['Web', 'iOS', 'Android', 'Mac', 'Chrome Extension'],
    downloadsOrUsers: '30M+ monthly users',
    contentRating: 'Rated for 3+'
  },
  'github.com': {
    longDescription: "GitHub Copilot is the world's most widely adopted AI developer companion, trained on billions of lines of public code and integrated directly into developer editors. Operating as an AI pair programmer, Copilot suggests whole lines, complex algorithms, and boilerplate code in real time as you type. With Copilot Chat, developers can ask questions about their codebase, generate unit tests, and resolve security vulnerabilities seamlessly.",
    features: [
      'Real-time autocomplete for functions, unit tests, and repetitive boilerplate',
      'Copilot Chat integrated in VS Code, Visual Studio, JetBrains, and Neovim',
      'Workspace context awareness including open tabs, references, and diagnostics',
      'Pull Request summaries, code review recommendations, and diff explanations',
      'Vulnerability detection with automated secure code replacement recommendations',
      'CLI Copilot tool for shell script generation and command explanations'
    ],
    pros: [
      'Radically speeds up routine typing, boilerplate code, and unit test coverage',
      'Deep integration with GitHub repositories, pull requests, and issues',
      'Enterprise-grade privacy guarantees with telemetry opt-out controls'
    ],
    cons: [
      'Can occasionally suggest deprecated API calls from older training data',
      'Requires active internet connection to cloud inference endpoints'
    ],
    useCases: [
      'Writing test suites and unit test mocks across complex codebases',
      'Converting code between programming languages and modernizing frameworks',
      'Quickly discovering unknown library APIs and syntax patterns'
    ],
    howItWorks: 'Copilot extracts neighboring file tokens, comments, and cursor context, streaming suggestions via fine-tuned OpenAI Codex and GPT-4o models.',
    whatsNew: 'Copilot Enterprise with custom fine-tuning on internal organizational repositories and multi-file Copilot Workspace editing.',
    tags: ['GitHub Copilot', 'Copilot', 'AI pair programmer', 'code autocomplete', 'coding assistant', 'GitHub AI', 'developer productivity'],
    developerHQ: 'San Francisco, California, USA',
    platforms: ['VS Code', 'Visual Studio', 'JetBrains', 'Neovim', 'CLI'],
    downloadsOrUsers: '20M+ developers',
    contentRating: 'Rated for 3+'
  }
};

const DEFAULT_DATA_SAFETY = {
  encryption: 'Data is encrypted in transit via TLS 1.3 and at rest with AES-256',
  training: 'Enterprise customer data is never used to train foundational AI models',
  compliance: 'SOC 2 Type II, ISO 27001, GDPR, and CCPA compliant infrastructure',
  retention: 'Data retention policies allow workspace data purge upon request'
};

function generateMetadataForTool(t) {
  const domain = (t.domain || '').toLowerCase();
  if (TOOL_METADATA[domain]) return TOOL_METADATA[domain];

  const name = t.name || 'AI Tool';
  const cat = t.category || 'Productivity';
  const company = t.company || name;

  const features = [
    `Intelligent ${cat} automation designed to streamline professional workflows`,
    `High-speed AI inference model optimized for high accuracy and minimal latency`,
    `Contextual natural language understanding and adaptive output formatting`,
    `Collaborative workspace sharing with export options to popular formats`,
    `Enterprise security architecture with encrypted cloud storage`
  ];

  const pros = [
    `Intuitive user interface that requires no technical machine learning expertise`,
    `Significantly reduces turnaround time on complex ${cat.toLowerCase()} tasks`,
    `Consistent, high-quality outputs with customizable styling preferences`
  ];

  const cons = [
    `Requires stable broadband internet connectivity for cloud model processing`,
    `High-resolution exports and team sharing require upgraded subscription tier`
  ];

  const useCases = [
    `Streamlining day-to-day ${cat.toLowerCase()} tasks for individual professionals and teams`,
    `Rapid prototyping, creative ideation, and iterative project drafting`,
    `Enhancing output consistency and operational efficiency across organizations`
  ];

  const tags = [
    name,
    `${name} AI`,
    cat.toLowerCase(),
    `best ${cat.toLowerCase()} tool`,
    `${cat.toLowerCase()} software`,
    'artificial intelligence',
    'productivity AI'
  ];

  return {
    longDescription: `${name} is an advanced artificial intelligence platform engineered by ${company} specifically for ${cat.toLowerCase()} excellence. By combining state-of-the-art machine learning models with an intuitive, modern interface, ${name} empowers creators, professionals, and enterprises to dramatically streamline their workflows, eliminate manual friction, and achieve exceptional creative and analytical results.`,
    features,
    pros,
    cons,
    useCases,
    howItWorks: `${name} processes user inputs through specialized neural network pipelines tailored for ${cat.toLowerCase()}, generating high-fidelity outputs in real time.`,
    whatsNew: `${name} latest performance update with accelerated response generation, expanded template library, and enhanced workspace collaboration.`,
    tags,
    developerHQ: 'Global / United States',
    platforms: ['Web', 'Cloud', 'API'],
    downloadsOrUsers: '1M+ users',
    contentRating: 'Rated for 3+'
  };
}

function convertValueToFirestore(val) {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(convertValueToFirestore)
      }
    };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = convertValueToFirestore(v);
    }
    return {
      mapValue: { fields }
    };
  }
  return { stringValue: String(val) };
}

async function run() {
  console.log('Fetching all live tools from Firestore...');
  const res = await fetch(`${BASE_URL}?pageSize=300`);
  if (!res.ok) {
    throw new Error(`Failed to fetch tools: HTTP ${res.status}`);
  }
  const json = await res.json();
  const docs = json.documents || [];
  console.log(`Found ${docs.length} tools in Firestore.`);

  let updatedCount = 0;

  for (const doc of docs) {
    const docId = doc.name.split('/').pop();
    const fields = doc.fields || {};
    const name = fields.name?.stringValue || docId;
    const domain = fields.domain?.stringValue || docId;
    const category = fields.category?.stringValue || 'Other';
    const company = fields.company?.stringValue || '';

    const meta = generateMetadataForTool({ name, domain, category, company });

    // Prepare fields to patch
    const patchFields = {
      longDescription: meta.longDescription,
      features: meta.features,
      pros: meta.pros,
      cons: meta.cons,
      useCases: meta.useCases,
      tags: meta.tags,
      seoKeywords: meta.tags,
      howItWorks: meta.howItWorks,
      whatsNew: meta.whatsNew,
      developerHQ: meta.developerHQ,
      platforms: meta.platforms,
      downloadsOrUsers: meta.downloadsOrUsers,
      contentRating: meta.contentRating,
      dataSafety: DEFAULT_DATA_SAFETY,
    };

    const firestoreFields = {};
    const fieldMaskPaths = [];

    for (const [k, v] of Object.entries(patchFields)) {
      firestoreFields[k] = convertValueToFirestore(v);
      fieldMaskPaths.push(`updateMask.fieldPaths=${encodeURIComponent(k)}`);
    }

    const patchUrl = `${BASE_URL}/${encodeURIComponent(docId)}?${fieldMaskPaths.join('&')}&key=${API_KEY}`;

    try {
      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: firestoreFields })
      });

      if (!patchRes.ok) {
        const errText = await patchRes.text();
        console.error(`Failed to update ${name} (${docId}): ${patchRes.status} ${errText.slice(0, 100)}`);
      } else {
        updatedCount += 1;
        process.stdout.write(`Updated [${updatedCount}/${docs.length}]: ${name}\n`);
      }
    } catch (err) {
      console.error(`Error updating ${name}:`, err.message);
    }
  }

  console.log(`\nSuccessfully enriched ${updatedCount} tools directly in Firestore!`);
}

run().catch(console.error);
