# Direction C — "Contour"

An alternative design direction for TALYNT LABS, for review beside the approved
site (`/`) and direction B (`/directions/passage`). It uses the same approved copy,
the same candidate data, the same Career Passport storage and the same two API
routes. It is a design-review build: every page is `noindex`.

**The idea.** A person is never a dot. They sit inside context — team, role,
leadership, expectations — the way a point on a map sits inside contour lines.
TALYNT reads the terrain, not the dot. Every graphic is built from three shapes:
an irregular contour ring around a person, the logo's rounded-square frame around
a role, and the soft curve that connects them.

## Run it

```bash
npm install
npm run dev                       # http://localhost:3000/directions/contour
npm run build && npm run start    # production
npm run lint && npm run typecheck
```

Optional configuration (nothing renders, and nothing is guessed, when unset):

| Variable | Effect |
|---|---|
| `NEXT_PUBLIC_TALYNT_WHATSAPP` | Verified business number, international digits (`9198…`). Shows a floating WhatsApp action, plus footer and contact links. |
| `NEXT_PUBLIC_TALYNT_LINKEDIN_URL` | `https://www.linkedin.com/company/<slug>/`. Shows LinkedIn in the footer and on the contact page. |
| `CONTACT_WEBHOOK_URL` | Existing. Where employer enquiries go. |
| `CANDIDATE_WEBHOOK_URL` | Existing. Where applications go (falls back to `CONTACT_WEBHOOK_URL`). |

`NEXT_PUBLIC_*` values are read at build time, so rebuild after setting them.

## Pages

| Route | What it is |
|---|---|
| `/directions/contour` | Home: position → problem → philosophy → the search, drawn → two journeys → product → human element → how it works → next step → FAQ preview |
| `/employers` | The full employer story: scale, context, sourcing, conversation, fit, quality, how we work, client visibility, capabilities, markets, enquiry form |
| `/candidates` | The candidate argument, career pathways wired to real roles, latest roles, commitments, how evaluation works |
| `/opportunities` | Role discovery: keyword search, location / work model / function / experience filters, all in the URL |
| `/opportunities/[slug]` | Role detail with a sticky facts rail, "Is this role right for me?", and the six-step application |
| `/profile` | Submit your profile: the same flow in profile mode, sent with a role the candidate chooses |
| `/dashboard` | Career Passport (past · present · future), applications sent from this device, saved roles, data controls |
| `/faq` | Searchable, categorised, deep-linkable (`/faq#question-id`) |
| `/contact` | Enquiry form, candidate routes, addresses |

Privacy, Terms, About and How we evaluate are shared with the approved site, so
there is one version of each.

## Design system

Tokens live in `contour.css`, scoped to `.ct`; nothing leaks into the approved site.

- **Ground:** `#FAFAF7` / `#F1F2EE`, text `#202321`, secondary `#5F6560`, lines `#DDE1DB`.
- **Green `#257461` — the system.** Connections, interaction, focus, the employer journey.
  The brief proposed `#287C68`; that measures 4.47:1 on the tinted ground, so the
  system uses a slightly deeper step that clears WCAG AA everywhere it is used.
- **Violet `#8589D9` (`#4F53A6` for text) — pathways.** The candidate journey.
- **Lime `#DCEB9B` — the highlighter.** What the reader should notice, and the overlap
  where a role and a person meet.
- **Vermillion `#FF4D1C` — the brand node from the logo.** Only ever the person. Never text,
  never a fill larger than a dot.
- **Type:** Source Serif 4 (display: the human voice), Geist (interface — the wordmark's own
  face), Geist Mono (signals and metadata).
- **Shape:** 6 / 10 / 14px radii, echoing the logo's frame. Hairlines, not cards, by default.
- **Motion:** one ease (`cubic-bezier(.16,1,.3,1)`), drawn paths, a single slow ripple on the
  hero's focal person. Every graphic has a composed end state under reduced motion.

Two cascade notes for anyone extending this:

1. The approved `globals.css` has an unlayered `* { border-color: currentColor }`, which beats
   every Tailwind border-colour utility. Here, border colour runs through a non-inheriting
   registered property, `--ct-bc`: use `ct-b2`, `ct-b-green`, `ct-hb-ink`… or set `--ct-bc`.
2. Component classes sit in `@layer components`, so Tailwind utilities passed alongside them
   always win.

## Graphics

| | Component | Used on |
|---|---|---|
| A — Talent map | `graphics/TalentMap.tsx` | Home hero |
| B — Search signals | `graphics/SearchSignals.tsx` | Home, Employers (conceptual, labelled as such) |
| C — Career pathways | `graphics/CareerPathways.tsx` | Candidates — selecting a direction lists real roles and can save it to the Passport |
| D — Role to talent | `graphics/RoleToTalent.tsx` | Home (two-sided connection), Employers (compatibility reading) |
| E — The meeting | `graphics/Meeting.tsx`, `MeetingOnScroll.tsx` | Footer, Employers, Contact, Human section, confirmations |
| Four lenses | `graphics/FourLenses.tsx` | Home — profile → skills → requirement → context |

## Content

`lib/contour/content.ts` holds every approved string this direction uses, word for
word, each block naming its source file. Typography is the only change (straight
apostrophes set as ’). Copy that is new to this direction — navigation labels,
the candidate process steps, the profile-flow step intros, the FAQ — is marked
`PROPOSED` in place and needs sign-off before going live.

## Backend contract

One additive change: `POST /api/candidate-application` now accepts an optional
`profile` object (the Career Passport) and forwards it, bounded and sanitised,
only when the candidate chose to include it. Callers that don't send it produce
exactly the payload they always did. The no-silent-success behaviour is unchanged.

## Known limitations

- Roles are the static list in `lib/candidate/roles.ts`, as on the approved candidate pages.
- The Passport, saved roles and sent applications live in this browser. There are no accounts.
- A CV is never uploaded — only its file name travels with an application.
- Talent alerts are not active, and the page says so.
- Product interfaces are illustrative, as `/terms` states.
