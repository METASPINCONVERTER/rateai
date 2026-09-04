# Rate AI — Design System

The reference for every visual decision in this codebase. If you are about to add a
value that is not in here, add it here first or use the one that already exists.

---

## 1. What this product is

Rate AI is a **reviews institution for AI tools**, not an AI product. The nearest
relatives are Wirecutter, Consumer Reports and the Michelin guide: a body of
opinion you consult before spending money. The reader's job is to arrive with a
question ("what should I use to write code?") and leave with a defensible answer.

That framing decides everything else. The interface has to feel like it has
**editorial authority** — considered, quiet, numerate, unhurried. It must not
look like the thing it is reviewing. An AI-tool directory dressed in neon
gradients and glowing brains has no credibility, because it looks like it was
made in an afternoon by the same generator as its subjects.

Design brief in one line: *a scorecard you would trust.*

---

## 2. Colour

Base neutrals are fixed by the brief. They are a warm paper-white family, which
is what gives the product its editorial rather than technical feeling.

| Token | Light | Role |
|---|---|---|
| `--bg` | `#F7F7F3` | page |
| `--surface` | `#FFFFFF` | cards, sheets, inputs |
| `--surface-subtle` | `#F2F2EE` | inset panels, table stripes, hover |
| `--surface-sunken` | `#EDEDE8` | wells, meter tracks |
| `--text-primary` | `#171717` | body and headings |
| `--text-secondary` | `#57574F` | supporting copy |
| `--text-muted` | `#6B6B64` | metadata, labels |
| `--border` | `#E5E5DF` | default 1px hairline |
| `--border-strong` | `#D8D8D1` | dividers that must read |
| `--border-control` | `#8C8C85` | the edge of anything you operate |

### Three departures from the brief's palette, and why

The brief specified `--text-secondary: #6F6F6A` and `--text-muted: #999993`.
Both ship darker, at `#57574F` and `#6B6B64`. The two cases are not equally
close.

`#999993` fails 4.5:1 on all four surfaces, and not narrowly: 2.86:1 on
`--surface`, 2.67:1 on `--bg`, 2.55:1 on `--surface-subtle`, 2.44:1 on
`--surface-sunken`. It is roughly half the contrast the standard asks for.
`#6F6F6A` is a closer call — it passes on three surfaces (5.05:1, 4.70:1, and
exactly 4.50:1 on `--surface-subtle`) and fails only on `--surface-sunken`, at
4.30:1. It was moved anyway, because a token that lands precisely on the line on
one surface and under it on another is a token that will fail the next time
someone nudges a background, and because the tier below it had to move regardless
— leaving `--text-secondary` where it was would have collapsed the gap between
the two quiet tiers to almost nothing.

The reason for choosing legibility over the specified tone is that metadata on
this site is content: a rating count, a category, a date, the number the reader
came for. Illegible metadata is not a subtle aesthetic; it is missing
information. Hierarchy is carried instead by size and weight, which cost nothing
in contrast. `--border` and `--border-strong` ship exactly as the brief
specified.

`--border-control` is an addition, at `#8C8C85` — 3.38:1 on white. A white
input on a near-white panel is identified by its border and nothing else, so
WCAG 1.4.11 asks 3:1 of that edge, and `--border` manages 1.26:1. The
decorative hairline cannot be strengthened to clear that bar without turning
every card and table row into a cage. Splitting the token is what lets the quiet
borders stay quiet.

`--star-off` is the same argument: on the rating form the unselected stars are
the targets, so they are held to 3:1 rather than left as a faint track.

All of these ratios are computed and enforced by `tools/verify.mjs`, against
every surface each token can legally sit on, in both themes.

### The accent

**`--accent: #1F5741`** — a deep spruce green.

Reasoning, since this is the one free axis in the brief and therefore the one
that decides whether the product looks chosen or defaulted:

- Green is the colour of **certification** — a pass mark, a seal, a verdict.
  That is literally this product's job.
- It is emphatically not the AI palette. Violet-to-blue gradients, cyan, and
  acid lime are the house style of the entire category we are reviewing.
- It sits well on warm paper: dark enough to carry white text at **8.4:1**, and
  cool enough to keep the paper looking warm by contrast.
- It was chosen over terracotta/clay (`#D97757` and neighbours), which is the
  reflexive pairing for a cream background and now reads as machine-made.

Supporting: `--accent-hover: #17422F`, `--accent-wash: #EDF1EC` (tinted panels),
`--accent-border: #CFDDD4`.

### Semantic colour

Used only where it carries meaning, never for decoration:
`--positive #1F5741` (reuses accent), `--caution #8A5A1B`, `--negative #9B2C2C`.

### Star ratings: semantic tier colour

Deliberate and purposeful. Rather than generic gold-with-a-glow stars, ratings carry explicit semantic meaning matching the scorecard:

- **Magnitude is typographic.** A score is a number, set large and tabular,
  against a hairline meter.
- **Rating tier colors:**
  - **4 – 5 Stars (High):** `--star-high` (`#1F5741` light, `#7CCCA6` dark) — positive spruce / emerald.
  - **3 Stars (Mid):** `--star-mid` (`#B45309` light, `#F59E0B` dark) — warm amber / yellow.
  - **1 – 2 Stars (Low):** `--star-low` (`#9B2C2C` light, `#E58C8C` dark) — clear crimson / coral red.
- **Interactive rating input:** On hover and selection, the active stars preview and lock into their corresponding tier color with an accompanying status badge and micro-bounce feedback.
- **Empty stars:** `--star-off` (`#8C8C85` light, `#6D6D66` dark), held to WCAG 1.4.11 3:1 contrast so targets remain visible before choice.

---

## 3. Type

**Inter**, one family, `tabular-nums` enabled globally on numeric contexts. The
brief fixes the family; the *treatment* is where the personality goes.

| Token | Size / line-height | Tracking | Use |
|---|---|---|---|
| `--t-display` | 44px / 1.06 | −0.03em | page-defining headline, one per page |
| `--t-h1` | 30px / 1.15 | −0.02em | page title |
| `--t-h2` | 21px / 1.25 | −0.015em | section |
| `--t-h3` | 16px / 1.35 | −0.01em | card title |
| `--t-body` | 15px / 1.6 | 0 | prose |
| `--t-small` | 13.5px / 1.55 | 0 | secondary copy |
| `--t-label` | 12.5px / 1.3 | 0 | form labels, table headers |
| `--t-meta` | 12px / 1.3 | 0.005em | timestamps, counts |
| `--t-score` | 40px / 1 | −0.035em | the score numeral |

Rules:

- Measure caps at **68ch** for prose. Nothing runs the full width of a wide screen.
- Score numerals get negative tracking and tabular figures so that a column of
  them aligns to the decimal and can be scanned vertically.
- Weights: 400 body, 500 UI/labels, 600 headings and scores. 700 exists but is
  reserved for the score numeral only. No 800.
- **Sentence case everywhere.** No tracked-out uppercase eyebrow labels.

---

## 4. Space, radius, shadow, motion

Spacing scale, no other values permitted:
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80`

Radii, assigned by element size so that curvature is information rather than a
uniform coat of paint: `--r-sm 8px` (badges, chips, inputs), `--r-md 10px`
(buttons), `--r-lg 12px` (cards), `--r-xl 16px` (sheets, hero panels).

**Border first, shadow second.** Every surface is defined by its 1px hairline.
Shadow appears only when an element genuinely floats above the page: dropdowns,
dialogs, the sticky mobile bar. `--shadow-sm` is almost invisible by design;
there is no large ambient shadow token because nothing needs one.

Motion: `--dur-fast 120ms`, `--dur 180ms`, `--dur-slow 240ms`, all on
`cubic-bezier(.2,.7,.3,1)`. Motion answers actions — opening, expanding,
confirming. There are no scroll-triggered section reveals and no hover
animations beyond a colour or border change. One orchestrated exception: on a
tool page, the score meter draws from 0 to its value once, because it shows the
measurement being taken. Everything is disabled under
`prefers-reduced-motion`.

---

## 5. Layout

The organising idea is a **ledger**. Content aligns to a strict left grid with
hairline rules between rows, and every number lives in the same column position
so the eye can run down it. Comparison is the reader's real task, so the layout
is built for scanning rather than for browsing pretty tiles.

```
┌──────────────────────────────────────────────────────────┐
│  ▤ Rate AI      Home  Explore  Compare        Submit ▸   │  56px, hairline base
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Which AI tools are actually worth it?          ← display│
│  ───────────────────────────────────────────             │
│  [ ⌕ Search 61 tools                              ]      │
│  61 tools · 9 categories · 550k ratings         ← quiet  │
│                                                          │
│  Highest rated                             View all ▸    │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 1 ▪ Claude          Chatbot        4.8 ▰▰▰▰▰▰▱  12k│  │  ← the ledger:
│  │ 2 ▪ Cursor          Coding         4.7 ▰▰▰▰▰▰▱  9k │  │    scores in one
│  │ 3 ▪ Midjourney      Image          4.6 ▰▰▰▰▰▱▱  8k │  │    column, hairline
│  └────────────────────────────────────────────────────┘  │    rows, no cards
│                                                          │
│  Browse by category          Recently reviewed           │
│  ┌──────────┬──────────┐     ── Alex on Cursor      4★   │
│  │ Coding 12│ Chatbot 9│     ── Dana on Claude      5★   │
│  └──────────┴──────────┘     ── Sam on Runway       3★   │
└──────────────────────────────────────────────────────────┘
```

Everything is **left-aligned**. Centred hero text is the default gesture of a
marketing page; this is a reference work, so it reads like one — the eye returns
to a single left margin all the way down. The only centred content is inside
empty states, where a small block floating in a large void is correct.

Grid: 1152px max content width, 24px gutters, single column below 768px.

### Where boldness is spent

One place: **the ranked ledger and the score treatment**. That is the memorable
thing. Everything around it — nav, cards, forms, footer — is deliberately quiet
so the numbers carry the page. On `explore.html` the ledger is a first-class
view mode alongside the card grid, because for 61 comparable items a dense
aligned table genuinely beats tiles, and almost no directory site offers one
that survives a 320px screen.

---

## 6. Self-critique before building

Checked against the known cluster of generated-design tells:

| Tell | Verdict |
|---|---|
| Cream bg + serif display + terracotta accent | Cream is mandated by the brief; the other two avoided. Sans throughout, spruce accent. |
| Identical rounded cards, one radius, same grey shadow on each | Radius varies by element size; primary content surface is a hairline ledger, not cards; shadows only on floating layers. |
| ALL-CAPS tracked eyebrow above every heading | None. Sentence case throughout. |
| `A · B · C` middle-dot meta strings | The old code did exactly this (`• by Google • Est. 2020`). Replaced with a real definition list on the tool page. |
| `→` appended to button labels | None. Icons carry direction, and only where direction is the point. |
| One word of the headline in an accent colour | The old hero did this (`Rate AI Tools` in a gradient). Removed; headline is one colour. |
| Big-number-plus-label stat row as the hero | Old hero had three of them with dividers. Demoted to one quiet metadata line; the hero now leads with the actual top-ranked tool, because real content beats vanity metrics. |
| Fade-and-slide-up on every section | None. One deliberate score-meter reveal. |
| Monospace for small data labels | None. Inter with tabular figures does the job. |

Revised as a result of this pass: the hero (was heading for a centred
headline + three big gradient stats — the exact default), and the decision to
make the ledger rather than a card grid the primary content surface.

---

## 7. Copy voice

Plain, specific, unhurried. Active voice. Buttons name their outcome, and the
name survives into the confirmation — "Publish review" produces "Review
published." Errors say what happened and what to do; they never apologise and
are never vague. Empty states are invitations, not moods. No exclamation marks.

---

## 8. Rules that are not about looks

Four policies that shaped more of the build than the palette did. Each is
machine-checked, because a rule nobody can verify is a rule that decays.

### Space: two tiers, not one

Anything that pushes elements apart — margin, padding, gap, inset — takes one of
eleven rungs: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80. Anything that *sizes* an
element — height, width, min/max — is free of the rungs but must sit on the 4px
grid, because a control's height answers to what it contains, not to a rhythm.
The leaderboard's header row is 36px, which is correct and is not a spacing
value. Mixing the two tiers is what produces the "close enough" measurements
that make an interface feel unplanned. Glyph-scale exceptions are named
(`--badge-h: 22px`, the mark sizes) rather than sprinkled as literals, so that
every unexplained number is a bug.

### Targets: 44px on a phone, no exceptions that cannot be proved

Every control a phone renders is at least 44px in both axes — buttons, icon
buttons, chips, selects, star options, footer links, the logo, the tab bar,
the small variant of everything. Three kinds of exemption exist and all three
are verified rather than asserted: a control that is `display: none` below
768px is held to the 24px mouse standard instead (and the harness checks that
it really is hidden); a child stretched by its parent inherits the parent's
height (and the harness checks the parent clears 44px); and a link inside a
sentence takes WCAG 2.5.5's inline exception (and is listed by name with its
reason). Text inputs additionally take `font-size: 1rem` on phones, because
below 16px iOS Safari zooms the viewport on focus and does not zoom back —
which produces exactly the sideways scrolling the brief forbids.

### Affordance: a badge labels, a chip navigates

The category used to be a link everywhere it appeared, including inside tool
cards. That is wrong twice: a badge is 22px tall, which is half a target, and
inside a card it competes with the card's own destination — aim for the card
on a phone, land on a filtered list. So the rule is flat. A badge is a `span`
and states a fact. A chip, a button or a full-size link navigates. Getting to
a category is the explore chips' job, the home tiles' job, and the tool page's
"More in …" link's job, all of which are real controls. The corollary is that
a card's whole surface is its target: the name's link is stretched over the
card with `::after`, so the hover state tells the truth.

### The data contract is pinned

The collection names, the field names read by `shapeTool` and `shapeReview`,
the field names written on submit, and the convention that a tool document's id
is its domain are all written out in `tools/verify.mjs` and compared against the
code. They come from the original site, not from the rewrite. This is the one
part of the project where a mistake is silent: a renamed field reads as
`undefined` and renders as a dash, a renamed collection reads as empty and
renders as "no tools yet", and nothing throws. Domain casing is handled the
same way — Firestore equality is case-sensitive, this build lowercases domains
where the old site did not, so a review query matches both spellings rather
than assuming.
