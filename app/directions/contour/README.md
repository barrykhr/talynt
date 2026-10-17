# Direction C — "Contour"

An alternative TALYNT LABS website, for review beside the approved site (`/`) and
direction B (`/directions/passage`). Two journeys from one opening question:
**employers** who want TALYNT to find people, and **candidates** who want to find a
role, create a profile once and apply to several roles with an assessment built
for each. It uses the approved copy, the live role data and the existing two API
routes. Every page is `noindex`.

**The idea.** A person is never a dot. They sit inside context — team, role,
leadership, expectations — the way a point on a map sits inside contour lines.
Every graphic is built from three shapes: an irregular contour ring around a
person, the logo's rounded-square frame around a role, and the soft curve that
connects them.

## Run it

```bash
npm install
npm run dev                       # http://localhost:3000/directions/contour
npm run build && npm run start    # production
npm run lint && npm run typecheck
npm test                          # assessment engine and API route (Node's own test runner)
```

Optional configuration (nothing renders, and nothing is guessed, when unset):

| Variable | Effect |
|---|---|
| `NEXT_PUBLIC_TALYNT_WHATSAPP` | Verified business number, international digits (`9198…`). Shows a floating WhatsApp action, plus footer and contact links. |
| `NEXT_PUBLIC_TALYNT_LINKEDIN_URL` | `https://www.linkedin.com/company/<slug>/`. Shows LinkedIn in the footer and on the contact page. |
| `NEXT_PUBLIC_TALYNT_REQUIRE_APPROVED_ASSESSMENTS` | `1` serves only assessment material marked approved (see `lib/assessment/README.md`). |
| `CONTACT_WEBHOOK_URL` | Existing. Where employer enquiries go. |
| `CANDIDATE_WEBHOOK_URL` | Existing. Where applications go (falls back to `CONTACT_WEBHOOK_URL`). |

`NEXT_PUBLIC_*` values are read at build time, so rebuild after setting them.

## Pages

All routes are under `/directions/contour`.

| Route | What it is |
|---|---|
| `/` | **Entry.** "What brings you to TALYNT?" — two options, no navigation bar. The choice is remembered on the device and marked on return; it never redirects |
| `/employers` | Employer homepage: hero and sourcing drawing → the approved position → problem → philosophy → how TALYNT works (the approved six layers) → while you run the business → role-specific evaluation → a shortlist with context → the human decision → human + AI → enquiry → FAQ |
| `/employers/approach` | Every other approved client section: scale, context, sourcing, conversation, fit, quality, client visibility, TALYNT OS, capabilities, markets, enquiry |
| `/employers/assessment-review` | The employer-facing assessment review, full width — a labelled demonstration |
| `/candidates` | Candidate homepage: hero → the approved position → one profile, many applications → find opportunities → understand the role → career pathways → role-specific assessments → how applying works → your profile → FAQ → close |
| `/opportunities` | Search, location, work model, function and experience filters, all in the URL |
| `/opportunities/[slug]` | A role, read properly, with "Is this role right for me?" and the apply panel |
| `/profile` | Create the profile once (CV, about, experience, skills and education, preferences, review), then manage it |
| `/applications` | Every application on this device, the profile they share, saved roles |
| `/applications/[slug]` | One application: where it is, what was sent, the role's next steps |
| `/applications/[slug]/assessment` | The assessment for that application |
| `/faq`, `/contact`, `/about`, `/candidates/how-we-evaluate`, `/privacy`, `/terms` | As before |
| `/dashboard` | Redirects to `/applications` |

The entry screen lives at the root of this folder with no navigation; every other
page is in the `(main)` route group, which adds the navigation, footer and
contact action. The navigation follows the side a page belongs to, and on shared
pages the visitor's last choice; a switch on every page changes sides.

## Profile, application, assessment

Three things, kept apart:

- **The profile** is the Career Passport (`lib/candidate/passport-shape.ts`) — one
  document on this device, shared with the approved candidate pages. It now
  also carries a random `profileId` (assigned on first save), education and
  certifications. Applications read it and never write to it.
- **An application** (`lib/candidate/applications.ts`, `talynt.applications.v2`)
  is one per role: why this role, questions for the company, whether to include
  the full profile (off by default), the assessment, the answers, and what was
  sent.
- **An assessment** is built for the application when it starts, from that
  role's requirements, and kept — reopening never rebuilds it. How it is built,
  versioned, validated and evaluated is in `lib/assessment/README.md`.

When a candidate sends an application, the request carries the application id,
profile id and version, and the assessment. The server verifies the assessment
against the role before forwarding anything (see Backend contract).

## Copy

- `lib/contour/content.ts` — approved copy, word for word, each block naming
  its source. Every approved section the previous homepage carried still renders
  somewhere (the employer and candidate pages, or `/employers/approach`).
- `lib/contour/proposed.ts` — **every string new to this phase**: the entry
  question, the employer and candidate heroes, the "work continues" story, the
  evaluation and shortlist sections, the profile builder, the assessment and
  application screens. Wording supplied by the brief is used as given; the rest
  is marked "(ours)". All of it needs approval.
- `lib/assessment/bank.ts` — the assessment questions, guidance and rubric
  signals. PROPOSED.
- `lib/contour/faq.ts` — the FAQ, including new answers on profiles and
  assessments. PROPOSED; every answer describes only what the build does.

Two naming questions need a decision: the approved copy calls the profile the
**Career Passport** ("Not a profile. A record of what you want."), while the brief
asks for a **TALYNT profile**; and the approved close says the Passport "takes
about eight minutes", which this build hasn't measured.

## Design system

Tokens live in `contour.css`, scoped to `.ct`; nothing leaks into the approved site.

- **Ground:** `#FAFAF7` / `#F1F2EE`, text `#202321`, secondary `#5F6560`, lines `#DDE1DB`.
- **Green `#257461` — the system and the employer side.** Connections, interaction, focus.
- **Violet `#8589D9` (`#4F53A6` for text) — the candidate side.** Pathways, profile, applications.
- **Lime `#DCEB9B` — the highlighter.** Evidence quoted in an answer; what to notice.
- **Vermillion `#FF4D1C` — the brand node.** Only ever the person.
- **Type:** Source Serif 4 (the human voice), Geist (interface), Geist Mono (signals and metadata).
- **Motion:** one ease, drawn paths, once. `.ct-draw` / `.ct-appear` draw when a
  parent sets `data-drawn="true"`, and are simply complete under reduced motion or
  without script. Nothing animates to suggest work is happening that isn't.

Cascade notes for anyone extending this:

1. The approved `globals.css` has an unlayered `* { border-color: currentColor }`.
   Border colour here runs through a non-inheriting registered property, `--ct-bc`.
2. Component classes sit in `@layer components`, so Tailwind utilities passed alongside them win.
3. A `backdrop-filter` makes an element the containing block for fixed children;
   the header's blur sits on its own layer so the phone menu can fill the screen.

## Graphics

| | Component | Used on |
|---|---|---|
| Entry | `entry/EntryChoice.tsx` | Entry — a career pathway and a narrowing search, from one TALYNT mark |
| Sourcing progression | `graphics/SourcingProgression.tsx` | Employer hero — brief → requirements → market → relevant → shortlist (a concept, labelled) |
| Work continues | `employers/WorkContinues.tsx` | Employers — during the day, during the search, the next morning |
| Assessment flow and review | `assessment/Review.tsx` | Employers, the review page — requirement → competency → question → answer → evidence |
| One profile → roles | `graphics/ProfileToRoles.tsx`, `candidate/OneProfile.tsx` | Candidates — real roles and their real assessment competencies |
| Search signals | `graphics/SearchSignals.tsx` | `/employers/approach` |
| Career pathways | `graphics/CareerPathways.tsx` | Candidates |
| Role to talent | `graphics/RoleToTalent.tsx` | `/employers/approach`, How we evaluate |
| The meeting | `graphics/Meeting.tsx`, `MeetingOnScroll.tsx` | Footer, About, Contact, Human + AI |

## Backend contract

`POST /api/candidate-application` — additive only. Callers that send none of the
new fields produce exactly the payload they always did, and the no-silent-success
behaviour is unchanged.

- `profile` (optional) — the profile, bounded and sanitised, only when the
  candidate chose to include it; now also `education` and `certifications`.
- `applicationId`, `profileId` (optional) — random ids from the candidate's device,
  so a downstream system can de-duplicate repeat sends without matching on names
  or file names. Anything that isn't the shape of a random id is dropped.
- `profileVersion` (optional).
- `assessment` (optional) — verified against the role's reviewed material: every
  question must belong to the role, every answer must be present and within its
  limit, or the route answers 422 and forwards nothing. The forwarded block adds
  the competency each answer speaks to, `stale` and the current versions.

Tested in `app/api/candidate-application/route.test.ts` against a local mock webhook.

## What a production backend needs

This site has no database, no accounts and no client portal, so it keeps the
candidate's data on their device and sends it only when they apply. To run the
same model for real — synced profiles, client access to assessments, recruiter
review — the smallest coherent extension is:

| Entity | Holds | Belongs to |
|---|---|---|
| Candidate | verified identity (email sign-in) | — |
| Profile, ProfileVersion | the profile; an immutable copy per version sent | Candidate |
| Job, RequirementsVersion | the role; an immutable copy of its requirements | Client |
| AssessmentDefinition | reviewed material, revision, `writtenFor`, status | Job |
| Application | candidate, job, status, timestamps — unique per (candidate, job) | Candidate, Job |
| Assessment | snapshot of competencies, questions, rubric; versions used | Application (1:1) |
| Response | one per question | Assessment |
| Evaluation | findings, rubric version, reviewer status, internal notes | Assessment |

Permissions, enforced on the server: a candidate reads and writes only their own
profile, applications, assessments and responses; a client reads only
applications to its own jobs, and only `clientView(evaluation)` — never internal
notes, never another client's data; recruiters read and write evaluations for the
jobs they work. `verifySubmission`, `validateEvaluation` and `clientView` are
written to move server-side unchanged.

## Analytics

There is no analytics in this repository, and none is added. Events worth
tracking once TALYNT chooses a tool and updates the privacy policy: audience
chosen, employer CTA, candidate CTA, opportunity search, role viewed, application
started, profile saved, assessment started, assessment sent, enquiry sent.

## Static copy

`scripts/export-static-site.mjs` builds this design as a self-contained static
site — every page a flat `.html` file, assets under `./assets`, links relative:

```bash
node scripts/export-static-site.mjs . /tmp/talynt-work /tmp/talynt-site
```

It works on a copy and never edits the repository. In the copy the design becomes
the whole site, the entry screen is `home.html`, links are plain anchors, and the
review-only labels are left out. With no server behind it, both forms take their
existing "delivery is not configured" path: nothing a visitor types is sent
anywhere, and they are given the email address instead.

## Known limitations

- No accounts and no database: the profile, applications and assessments live in
  the candidate's browser. They don't follow the candidate to another device, and
  clearing browser data clears them.
- No résumé parsing and no upload: only the CV's file name travels with an
  application, and the page says so.
- No model provider: assessments come from reviewed material (proposed, awaiting
  approval); nothing is generated or evaluated automatically.
- The employer review is a demonstration: the role and its assessment are real;
  the candidate, answers and evaluation are fictional and labelled.
- Roles are the static list in `lib/candidate/roles.ts`; their live status is
  unverified, and employment type isn't recorded, so it isn't a filter.
- Delivery depends on the webhook variables; without them every form says so.
- Talent alerts are not active, and the page says so.
- Tested in Chromium only.
