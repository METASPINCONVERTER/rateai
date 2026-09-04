/**
 * Rate AI — Offline sample data
 *
 * Loaded only when the page is opened with ?mock=1 (see js/store.js). Lets the
 * whole interface — including every loading, empty and error state — be worked
 * on without a network connection or a write to the live database.
 *
 * The shape here matches what js/firebase.js returns, not the raw documents.
 */

export const MOCK_TOOLS = [
  {
    docId: 'claude.ai', domain: 'claude.ai', name: 'Claude',
    description: 'A conversational assistant built for long documents, careful reasoning and writing that needs to hold together across many pages.',
    category: 'Chatbot', company: 'Anthropic', website: 'https://claude.ai',
    pricing: ['Freemium'], avgRating: 4.72, totalRatings: 18420, totalReviews: 1240,
    ratingDistribution: { 1: 210, 2: 340, 3: 1120, 4: 4180, 5: 12570 },
    verified: true, founded: 2021, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'cursor.com', domain: 'cursor.com', name: 'Cursor',
    description: 'An editor that keeps your whole repository in context, so refactors and multi-file edits stop being guesswork.',
    category: 'Coding', company: 'Anysphere', website: 'https://cursor.com',
    pricing: ['Freemium', 'Paid'], avgRating: 4.61, totalRatings: 12880, totalReviews: 910,
    ratingDistribution: { 1: 180, 2: 300, 3: 980, 4: 3600, 5: 7820 },
    verified: true, founded: 2022, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'midjourney.com', domain: 'midjourney.com', name: 'Midjourney',
    description: 'Image generation with a strong house style. Excellent for concept work, less predictable when you need an exact composition.',
    category: 'Image', company: 'Midjourney', website: 'https://midjourney.com',
    pricing: ['Paid'], avgRating: 4.48, totalRatings: 22140, totalReviews: 1580,
    ratingDistribution: { 1: 420, 2: 780, 3: 2640, 4: 7100, 5: 11200 },
    verified: true, founded: 2021, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'chatgpt.com', domain: 'chatgpt.com', name: 'ChatGPT',
    description: 'The general-purpose assistant most people start with. Broad capability, a large plugin ecosystem and a free tier.',
    category: 'Chatbot', company: 'OpenAI', website: 'https://chatgpt.com',
    pricing: ['Freemium'], avgRating: 4.39, totalRatings: 48200, totalReviews: 3120,
    ratingDistribution: { 1: 1200, 2: 2100, 3: 6400, 4: 15600, 5: 22900 },
    verified: true, founded: 2022, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'github.com', domain: 'github.com', name: 'GitHub Copilot',
    description: 'Inline completion that lives in your editor. Strongest on boilerplate and tests, weaker on architectural decisions.',
    category: 'Coding', company: 'GitHub', website: 'https://github.com/features/copilot',
    pricing: ['Paid'], avgRating: 4.21, totalRatings: 31400, totalReviews: 2040,
    ratingDistribution: { 1: 900, 2: 1800, 3: 5200, 4: 11400, 5: 12100 },
    verified: true, founded: 2021, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'perplexity.ai', domain: 'perplexity.ai', name: 'Perplexity',
    description: 'Search that answers in prose and cites what it used. Good for orientation on an unfamiliar topic.',
    category: 'Search', company: 'Perplexity AI', website: 'https://perplexity.ai',
    pricing: ['Freemium'], avgRating: 4.34, totalRatings: 9640, totalReviews: 720,
    ratingDistribution: { 1: 240, 2: 420, 3: 1380, 4: 3200, 5: 4400 },
    verified: true, founded: 2022, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'elevenlabs.io', domain: 'elevenlabs.io', name: 'ElevenLabs',
    description: 'Speech synthesis and voice cloning with convincing prosody. Widely used for audiobooks and localisation.',
    category: 'Audio', company: 'ElevenLabs', website: 'https://elevenlabs.io',
    pricing: ['Freemium', 'Paid'], avgRating: 4.55, totalRatings: 7120, totalReviews: 480,
    ratingDistribution: { 1: 110, 2: 200, 3: 640, 4: 2000, 5: 4170 },
    verified: true, founded: 2022, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'runwayml.com', domain: 'runwayml.com', name: 'Runway',
    description: 'Video generation and editing aimed at production work, with camera control and per-shot consistency.',
    category: 'Video', company: 'Runway', website: 'https://runwayml.com',
    pricing: ['Freemium', 'Paid'], avgRating: 4.02, totalRatings: 5340, totalReviews: 360,
    ratingDistribution: { 1: 220, 2: 400, 3: 1100, 4: 1720, 5: 1900 },
    verified: false, founded: 2018, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'notion.so', domain: 'notion.so', name: 'Notion AI',
    description: 'Drafting and summarising inside the workspace where the source material already lives.',
    category: 'Productivity', company: 'Notion', website: 'https://notion.so/product/ai',
    pricing: ['Paid'], avgRating: 3.88, totalRatings: 14200, totalReviews: 980,
    ratingDistribution: { 1: 800, 2: 1400, 3: 3800, 4: 4600, 5: 3600 },
    verified: true, founded: 2016, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'figma.com', domain: 'figma.com', name: 'Figma AI',
    description: 'Generates and rearranges layers inside Figma. Useful for first passes, still needs a designer over it.',
    category: 'Design', company: 'Figma', website: 'https://figma.com',
    pricing: ['Freemium'], avgRating: 3.74, totalRatings: 4180, totalReviews: 290,
    ratingDistribution: { 1: 240, 2: 480, 3: 1200, 4: 1360, 5: 900 },
    verified: false, founded: 2012, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'grammarly.com', domain: 'grammarly.com', name: 'Grammarly',
    description: 'Line editing and tone adjustment across every text field you use. Conservative by design.',
    category: 'Copywriting', company: 'Grammarly', website: 'https://grammarly.com',
    pricing: ['Freemium'], avgRating: 4.12, totalRatings: 26800, totalReviews: 1640,
    ratingDistribution: { 1: 900, 2: 1900, 3: 5400, 4: 9800, 5: 8800 },
    verified: true, founded: 2009, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'gamma.app', domain: 'gamma.app', name: 'Gamma',
    description: 'Turns an outline into a presentation that does not look like a template. Export quality is the usual complaint.',
    category: 'Presentations', company: 'Gamma', website: 'https://gamma.app',
    pricing: ['Freemium'], avgRating: 4.18, totalRatings: 3260, totalReviews: 210,
    ratingDistribution: { 1: 120, 2: 220, 3: 700, 4: 1100, 5: 1120 },
    verified: false, founded: 2020, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'suno.com', domain: 'suno.com', name: 'Suno',
    description: 'Full songs from a text prompt, vocals included. Startling on first use, repetitive across long sessions.',
    category: 'Audio', company: 'Suno', website: 'https://suno.com',
    pricing: ['Freemium'], avgRating: 4.06, totalRatings: 6420, totalReviews: 410,
    ratingDistribution: { 1: 300, 2: 520, 3: 1400, 4: 2000, 5: 2200 },
    verified: false, founded: 2023, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'v0.dev', domain: 'v0.dev', name: 'v0',
    description: 'Generates React and Tailwind components from a description. Output is clean; you will still restructure it.',
    category: 'Coding', company: 'Vercel', website: 'https://v0.dev',
    pricing: ['Freemium'], avgRating: 3.96, totalRatings: 2840, totalReviews: 180,
    ratingDistribution: { 1: 140, 2: 260, 3: 640, 4: 900, 5: 900 },
    verified: false, founded: 2023, twitter: null, createdAt: null, updatedAt: null,
  },
  {
    docId: 'newtool.example', domain: 'newtool.example', name: 'Draftsmith',
    description: 'A long-form editing assistant that has just been added to the catalogue and has no ratings yet.',
    category: 'Copywriting', company: 'Draftsmith', website: 'https://newtool.example',
    pricing: ['Free'], avgRating: 0, totalRatings: 0, totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    verified: false, founded: 2026, twitter: null, createdAt: null, updatedAt: null,
  },
];

const day = 86_400_000;
const ago = (days) => new Date(Date.now() - days * day).toISOString();

export const MOCK_REVIEWS = [
  {
    id: 'r1', toolDomain: 'cursor.com', rating: 5,
    title: 'The first tool that understood our monorepo',
    body: 'We moved a 400-file service over to a new router and it held the whole dependency graph in view the entire time. The diff review step is what makes it trustworthy — nothing lands without me seeing it.',
    userName: 'Alex Rivera', userPhoto: '', likes: 24, createdAt: ago(1),
  },
  {
    id: 'r2', toolDomain: 'claude.ai', rating: 5,
    title: 'Holds a long argument together',
    body: 'I use it for contract review. It keeps track of definitions across sixty pages, which is exactly where the others start contradicting themselves.',
    userName: 'Dana Whitfield', userPhoto: '', likes: 18, createdAt: ago(2),
  },
  {
    id: 'r3', toolDomain: 'runwayml.com', rating: 3,
    title: 'Great shots, unpredictable cost',
    body: 'When it works the footage is genuinely usable. Getting there took far more credits than I budgeted, and there is no way to preview cheaply first.',
    userName: 'Sam Okafor', userPhoto: '', likes: 9, createdAt: ago(3),
  },
  {
    id: 'r4', toolDomain: 'midjourney.com', rating: 4,
    title: 'Unmatched for mood, awkward for briefs',
    body: 'Everything it makes is beautiful and about eighty percent of what I asked for. Fine for exploration, frustrating when a client has already approved a layout.',
    userName: 'Priya Nair', userPhoto: '', likes: 31, createdAt: ago(5),
  },
  {
    id: 'r5', toolDomain: 'notion.so', rating: 2,
    title: 'Summaries I have to check line by line',
    body: 'It confidently restated a decision our team never made. Convenient that it sits next to the docs, but I stopped trusting the output unattended.',
    userName: 'Tomas Weber', userPhoto: '', likes: 12, createdAt: ago(6),
  },
  {
    id: 'r6', toolDomain: 'elevenlabs.io', rating: 5,
    title: 'Narration our listeners cannot pick out',
    body: 'Twelve hours of audiobook, two rounds of notes. The pronunciation dictionary is what sold it — proper nouns stay correct across the whole run.',
    userName: 'Marta Lindqvist', userPhoto: '', likes: 15, createdAt: ago(8),
  },
  {
    id: 'r7', toolDomain: 'claude.ai', rating: 4,
    title: 'Careful, occasionally too careful',
    body: 'The writing quality is the best of the group. It does sometimes hedge on questions that had one clear answer, which means an extra round of prompting.',
    userName: 'Ibrahim Souza', userPhoto: '', likes: 7, createdAt: ago(11),
  },
  {
    id: 'r8', toolDomain: 'cursor.com', rating: 4,
    title: 'Worth it once you turn the noise down',
    body: 'Out of the box it suggests too much. After narrowing the rules file to our conventions it became the fastest way to work through a backlog of small fixes.',
    userName: 'Chen Wei', userPhoto: '', likes: 11, createdAt: ago(14),
  },
];
