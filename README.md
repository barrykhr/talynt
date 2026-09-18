# TALYNT LABS

Talent intelligence, built for hiring.

The marketing site for TALYNT LABS — a single-narrative homepage that argues the
company's position by demonstrating it, plus a small set of editorial sub-pages.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 — design tokens live in `app/globals.css` under `@theme` |
| Motion | Framer Motion |
| Type | Newsreader (editorial display), Geist (interface), Geist Mono (signals and data) |

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # eslint
npm run typecheck
```

## Design system

Two tones carry the whole site and both are declared as utilities in
`app/globals.css`:

- **`tone-ink`** — warm near-black. The system at work: sourcing, evaluation,
  the product, the convergence.
- **`tone-paper`** — warm off-white. The human argument: philosophy, context,
  quality, company scale, talent, the closing call.

One accent, `--color-signal` (vermillion), is reserved for interaction,
highlights, selected data and emphasis. It is never decoration.

Typography carries the brand's central idea: the serif is the human voice, the
mono is the machine, and the grotesk is the interface where they meet.

## Structure

```
app/                    routes, metadata, sitemap, robots, OG image, contact API
components/
  chrome/               navigation, footer, scroll progress
  primitives/           wordmark, section shell, headers, buttons, signal readouts
  cards/                candidate, context, transcript, signal panel, pipeline
  sections/             one file per beat of the homepage narrative
  visuals/              canvas and SVG systems (hero, sourcing, compatibility,
                        TALYNT OS, client dashboard, global network)
lib/                    copy and data models, motion tokens, helpers
```

`app/page.tsx` composes the narrative in order. Sections are self-contained and
can be reordered without touching each other.

## Illustrative content

Every interface on the site — TALYNT OS, the client dashboard, the conversation
transcript, the compatibility reading — uses **fictional** candidates, companies
and figures. They demonstrate how the work is presented; they are not client
data and they are not outcome claims. `app/terms/page.tsx` says so publicly.
Keep it that way unless real, approved figures are supplied.

## Contact form

`POST /api/contact` forwards enquiries to `CONTACT_WEBHOOK_URL`. **If that
variable is not set the route returns a 503 and the form falls back to a direct
email address** — deliberately, so a visitor is never told an enquiry was
received when it wasn't. Set the variable (CRM, inbox relay or automation
endpoint) before going live.

```bash
CONTACT_WEBHOOK_URL="https://..."
```

## Accessibility and motion

- Semantic landmarks, one `h1`, labelled sections, a skip link, visible focus
  rings in the accent colour.
- Every scroll-driven visual has a composed static end-state under
  `prefers-reduced-motion: reduce`, including the hero canvas, the sourcing
  field and the convergence sequence.
- Interactive visuals (transcript ↔ signals, shortlist, capability accordion)
  are keyboard-operable and expose `aria-pressed` / `aria-expanded`.
