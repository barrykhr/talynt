# Company research, outreach drafts and monitoring

## Where the research logic came from

The existing outreach agent lives on branch `claude/zealous-pascal-10etms`, in
`outreach-agent/`. It is not on this branch, and nothing in it was changed.

- **`generate.js` is a plain module.** `generateOutreach()` builds a prompt from
  three personalisation levels (market / company / person), calls Claude (with
  web search and web fetch) or OpenAI (with web search), and parses a JSON
  reply.
- **`server.js`** exposes that over `POST /api/generate`, protected by Basic
  auth with `APP_PASSWORD`, and binds to `127.0.0.1:3030`.

The logic was already callable from a backend, so no UI automation was needed.
It is reused in two ways:

| Provider id | What it is | When to use |
|---|---|---|
| `claude` (default) | A port of `generate.js`'s Claude path into `src/lib/research/` (same model, web search/fetch tools, `pause_turn` resumption, refusal fallback, and the three level guides), with a stricter output contract. | Production. One deployable, credentials stay server-side. |
| `openai` | A port of the agent's OpenAI Responses path. | If you prefer OpenAI. Citations are **not** cross-checked (the API doesn't report retrieved pages); the UI says so. |
| `outreach-agent` | An HTTP adapter that calls the running agent's `POST /api/generate`. | Only if you want to keep the standalone agent as the engine. |

### Why the port changes the output contract

The agent returns `research_points` and `sources` as two separate lists, so
no statement can be tied to its source. The CRM requires **per-claim
evidence**. Every finding stores:

- the statement;
- its evidence kind: verified public fact, source-reported claim, or inference;
- a confidence level (high, medium or low);
- the source URL and title;
- the publication date, when known;
- the retrieval date;
- a short excerpt;
- whether the cited page was actually retrieved;
- a conflict note.

The evidence rules live in `src/lib/research/schema.ts` and are covered by unit
tests:

- A "fact" or "claim" without a URL and excerpt becomes a low-confidence
  **inference**.
- With Claude, every page the model retrieved is recorded. If a finding cites a
  page that **wasn't** retrieved, it is flagged "source not cross-checked",
  downgraded from "verified fact", and capped at medium confidence.
- Publication dates in the future are dropped. Duplicate statements are removed.

If you use the `outreach-agent` adapter, its points are stored as low-confidence
inferences, and its source list is shown as a warning on the snapshot.

## What is sent to the provider

`src/lib/research/input.ts` builds the minimum: company name, website, LinkedIn
company page (only if pasted on a contact), location, role, the contact's name
and title (if chosen), optional notes the user types, and the sender profile.

- **Conversation history** (dates, channels and subjects only, never bodies) is
  included only when the user ticks the box **and** has their own Google
  account connected.
- The exact payload is stored on the job and shown on the snapshot page under
  "What the CRM sent to the provider".

## Behaviour

- **Research runs as a job.** Starting it records the job, and the work runs
  after the response. The same input within 10 minutes reuses the same job
  (idempotency key).
- **Failures and retries.** Failures are stored with the error. Retryable
  errors (rate limits, timeouts, 5xx) retry with backoff: 5 minutes, then 15,
  then 45, up to 3 attempts. The scheduler and a "Retry now" button pick them
  up.
- **Snapshots are immutable.** Each run is a dated snapshot.
  `store_research_result` writes it atomically and idempotently, so a retry
  never creates a second snapshot.
- **Review.** Each finding can be **accepted**, **dismissed** or **corrected**.
  Accepting can write to the company's About, industry or employee range. The
  old value is kept in record history, and every review is in the audit log.
- **Drafts.**
  - Created by research, or by "Draft from accepted facts", which makes no new
    web calls and uses only reviewed facts.
  - Drafts are edited in place.
  - Email goes out only when a person clicks send, from **their own**
    connected Gmail.
  - WhatsApp drafts are copied to the clipboard and logged as a WhatsApp
    activity; the person sends them from their own phone.
  - **Nothing is ever sent automatically.**
- **Rate limits.** Each user can start 20 research runs and 40 drafts per hour.
- **Switches.** Admins can switch research off in Settings → Workspace.

## Setup [owner]

1. Choose a provider.
   - **Claude (recommended):** set `ANTHROPIC_API_KEY`. The model defaults to
     `claude-opus-5-5`; override it with `RESEARCH_CLAUDE_MODEL`. Web search
     and web fetch must be enabled for your Anthropic organisation in the
     Console.
   - **OpenAI:** set `OPENAI_API_KEY`, and optionally `OPENAI_MODEL`.
   - **Existing agent:**
     - Set `OUTREACH_AGENT_URL` and `OUTREACH_AGENT_PASSWORD` (the agent's
       `APP_PASSWORD`).
     - The agent binds to `127.0.0.1`, so the CRM server must reach it. On a
       hosted CRM that means deploying the agent somewhere reachable over HTTPS.
     - Its `npm run share` tunnel URL changes on every restart, so it is not
       suitable for production.
2. Optionally set `SENDER_PITCH` and `SENDER_CTA`, the same meaning as the
   agent's `SENDER_*`. The sender name is the signed-in user.
3. Check **Research updates → Sources & jobs**. It shows which provider is in
   use, or exactly which variable is missing.

**Not verified in this build:** live calls to Claude, OpenAI or the agent,
because no keys were available. The parsing, evidence rules, storage,
idempotency and retries are tested with stubs and against a real database.

## Monitoring public signals

Monitoring is per company, set up in Company → Public signals & monitoring.
You choose the signal types, a cadence (default weekly; admins set the
default) and the sources:

| Source | How it is read | Key needed |
|---|---|---|
| Greenhouse job board | `boards-api.greenhouse.io/v1/boards/{token}/jobs` (public Job Board API) | No |
| Lever postings | `api.lever.co/v0/postings/{company}?mode=json` (public) | No |
| RSS / Atom newsroom feeds | Up to 5 `https` feeds per company | No |
| Manual entry | A person adds a signal with its source link | — |

**Job postings**
- They are diffed against the previous observation set. The first check is a
  baseline and creates no alert.
- New postings create one "hiring" signal, worded as hiring *activity*, not
  completed hires.
- A large change in the open-postings count (at least 25% and at least 3
  postings) creates a volume signal.

**Feeds**
- Feed items from the last 30 days become signals.
- They are classified by headline keywords, so confidence is low, or medium
  when the feed is on the company's own domain.

**Reliability**
- **Idempotency:** each run's key is its scheduled window (or the minute, for
  a manual refresh). Signals are unique per company by fingerprint, so retries
  and overlapping schedulers never duplicate an alert.
- **Failures:** each source fails independently. Rate limits and 5xx responses
  retry, honouring `Retry-After`. A run where every source fails backs off
  exponentially and is marked failing or stale in the UI. 404s and malformed
  feeds are shown as configuration problems.
- **Safety:** https only, private and internal addresses are blocked and
  re-checked on every redirect, 15-second timeout, 2 MB cap. LinkedIn is never
  fetched.

**Review and notification**
- The review queue (Research updates) offers Accept, Dismiss and Create
  follow-up task.
- Dismissed signals stay in history, and a signal's evidence can't be edited.
- The company owner gets an **in-app** notification. No external messages are
  sent.

**Controls**
- Pause monitoring per company, or globally in Settings → Workspace.
- **Paid providers** (for example Crunchbase funding data, news APIs) are
  **not** implemented. Add an adapter in `src/lib/monitoring/providers.ts` only
  once a subscription and its terms are in place; the review flow doesn't
  change.

The scheduler (`/api/cron/sync`, every 30 minutes on Vercel) runs at most 10
due monitors per pass.
