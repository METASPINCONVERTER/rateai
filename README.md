# Rate AI

A directory of AI tools with community ratings and reviews. Plain HTML, CSS and
ES modules — no build step, no framework, no dependencies. Data lives in the
existing Firestore project `rateai-7ace5`.

## Running it

Each page loads its JavaScript as an ES module, which browsers refuse to do
over `file://`, so it needs an HTTP origin. There is a dependency-free server
in the repo:

```
node server.mjs          # http://localhost:3000
node server.mjs 4000     # another port
```

Nothing to install first. Any static host works in production; the server only
adds two conveniences that match what such a host does anyway — extensionless
URLs (`/explore` serves `explore.html`) and the site's own styled `404.html`
for a miss.

To work without a network or without touching real data, append `?mock=1` to
any URL. The store then imports `js/dev/mock-data.js` instead of Firestore and
remembers the choice for the tab, so links keep working as you click through.
Add `?mock=0` to leave it.

## Verifying it

```
node tools/verify.mjs
```

188 checks across 24 files: colour contrast computed for every token against
every surface it can legally sit on in both themes, touch-target sizes at phone
widths, the spacing scale, the icon system, the shape of the Firestore reads and
writes, unresolved imports, unused CSS, orphaned `data-` hooks, and more. It
exits non-zero on failure, so it is usable as a commit gate. One warning is
expected and explained in its output: `[data-star-input]` is rendered by
`starInput()` rather than sitting in static markup.

The harness exists because the sandbox this was built in has no browser. It is
a static reader — it parses the CSS and HTML and reasons about them — so it
catches the class of mistake that survives a visual check: a rule that another
rule silently outranks, a token whose contrast fails only in dark mode, a
control that is 40px on a phone, a field renamed on one side of a query.

## How the code is arranged

```
index.html  explore.html  tool.html  compare.html  submit.html  404.html
css/        tokens.css  base.css  components.css  layout.css
js/         shell.js  store.js  firebase.js  components.js  icons.js  util.js  errors.js
js/pages/   home.js  explore.js  tool.js  compare.js  submit.js  notfound.js
js/dev/     mock-data.js
tools/      verify.mjs
server.mjs  favicon.svg  DESIGN.md  README.md
```

Every page is a real document with real markup — its navigation, footer and
mobile tab bar are in the HTML, not injected, and the current page is marked
with `aria-current` in that markup rather than computed — so the chrome renders
correctly before any script runs. `shell.js` then adds the behaviour common to
all of them: the theme toggle, toasts, offline detection, button busy states,
icon hydration, the `/` shortcut into search, and the sample-data notice. Each
page's own module in `js/pages/` takes over from there. The Firestore adapter
and the mock data are both loaded with dynamic `import()`, so a page pays for
whichever one it actually uses and never both.

The four stylesheets are a stack, and the order matters: `tokens.css` declares
the variables and nothing else, `base.css` sets element defaults and utilities,
`components.css` holds reusable pieces, and `layout.css` holds page-specific
composition plus the responsive overrides. Selectors are flat single classes
almost everywhere; where a compound selector was unavoidable, a comment says
what it is outranking and why.

`store.js` is the only thing the pages talk to for data. It caches tools in
`sessionStorage` for five minutes, keeps the ranking maths in one place, and
falls back to mock data when asked. `firebase.js` is the only file that knows
Firestore exists. Swapping the backend means rewriting that one file.

The Firebase config in `js/firebase.js` is a set of public client identifiers,
not a secret — that is what the comment above it says, and it is worth reading
before anyone tries to hide it. Access is controlled by Firestore security
rules on the server, not by concealing the key.

## Design

`DESIGN.md` is the reasoning: the palette and the three places it departs from
the original brief, the type scale, the two-tier spacing policy, the 44px touch
policy and its provable exemptions, the badge-versus-chip affordance rule, and
the pinned data contract. Read it before changing a token — several of the
values are the way they are because a contrast ratio required it, and the
harness will say so if that is undone.

## Data

Two Firestore collections. `tools`, where a document's id is the tool's domain,
and `reviews`, linked back by `toolDomain`. Ratings are aggregated on the tool
document inside a transaction as each review lands, so the average never
depends on reading every review. Rankings use a Bayesian weighted score with a
25-rating floor, which is what stops a single five-star review from topping a
leaderboard.

Domain casing is handled defensively on read: Firestore equality is
case-sensitive and this build lowercases domains for use in URLs and cache
keys, so a review query matches the stored spelling as well as the lowercase
one. The failure it prevents is silent — a tool page that says nobody has
reviewed it.

## What is in `_backup-pre-redesign/`

The previous version of the site, kept as the reference for feature parity. It
is not served, not linked, and nothing reads it at runtime or at verify time —
the Firestore field names it defines were copied into `tools/verify.mjs` by
hand, deliberately, so that the check is an independent statement of the
contract rather than a comparison of the code against itself. Delete this
folder once you are confident nothing is missing.
