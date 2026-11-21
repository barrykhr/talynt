# KiviTronics CRM

Internal CRM and outreach workspace for the KiviTronics Consulting team.

- **Records:** leads, companies, contacts, the sales pipeline, hiring
  requirements and delivery, and commercial agreements (MSA).
- **Revenue:** pipeline, booked, earned, invoiced, realized and outstanding,
  kept as separate measures.
- **Research:** company research with per-claim sources and reviewable
  outreach drafts, plus monitoring of public signals.
- **Daily work:** tasks and follow-ups, imports and exports, reports, a website
  lead inbox, and per-user Gmail and Google Calendar.

A new installation is **genuinely empty**: there are no demo companies, sample
people or placeholder users in the database. The first screen invites you to add
a company or import leads.

| | |
|---|---|
| App | Next.js 16 (App Router, React 19, server actions), TypeScript (strict), Tailwind CSS v4 |
| Data & auth | Supabase: Postgres with row-level security, Supabase Auth (Google) |
| Hosting | Vercel (or any Node host), custom domain `crm.kivitronicsconsulting.com` |
| Tests | Vitest: unit tests plus database tests that run the real migrations on PostgreSQL |

## Documentation

| Guide | What it covers |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Local start, Supabase project, migrations, Google sign-in, first admin, deployment and the custom domain |
| [docs/GOOGLE.md](docs/GOOGLE.md) | Gmail and Calendar: Google Cloud setup, scopes, verification, how sync behaves |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Backups and restore, exports, clearing development data, key rotation, logs |
| [docs/SECURITY.md](docs/SECURITY.md) | Access model and how each common web risk is handled |
| [docs/RESEARCH.md](docs/RESEARCH.md) | Research providers (ported from the outreach agent), evidence rules, drafts, monitoring sources and schedule |
| [docs/REVENUE.md](docs/REVENUE.md) | Revenue definitions, Won/booked rules, invoices and partial payments |
| [docs/LEAD_CAPTURE.md](docs/LEAD_CAPTURE.md) | Website form endpoint, embed snippet and spam protection |

## Quick start (local)

```bash
cp .env.example .env.local     # then fill in the values (docs/SETUP.md §1)
npm install
npm run dev                    # http://localhost:3000
```

Checks:

```bash
npm run typecheck
npm run lint
npm test                       # unit + database tests
npm run build
```

Database tests need a disposable PostgreSQL 15+ server (they create and drop
their own databases). Set `TEST_DATABASE_URL` to an admin connection, for example
`postgres://postgres@localhost:5432/postgres`. Without one, those suites are skipped
and print a warning.

## What works today, and what needs configuration

| Area | Status |
|---|---|
| Google Workspace sign-in (linked by Google's stable account id), allowlist, Admin and Member roles, audit log | Works once Supabase and Google sign-in are configured (docs/SETUP.md) |
| Leads, companies, contacts, opportunities (qualification, priority, nurture, Won gating), requirements, agreements | Works |
| Pipeline board (drag and drop plus keyboard), saved views, no-next-action, lead inbox | Works |
| Tasks: My tasks, Team tasks, Due today, Overdue, No next action; activity timeline | Works |
| Revenue: placements, earned events, invoices, partial payments, credits, aging, yield, forecast | Works (operational reporting, not accounting) |
| Import (CSV/XLSX, mapping, preview, skip/link/update/create decisions, row-level error report); CSV exports with IDs | Works |
| Reports with definitions, date ranges and currencies; product and operations measures | Works |
| Monitoring: Greenhouse, Lever, RSS, manual signals; review queue; in-app notifications | Code complete, using public sources with no keys. Runs on the schedule once `CRON_SECRET` is set. Not yet run against live boards from this environment. |
| Company research and outreach drafts | Code complete. **Inactive until** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` or `OUTREACH_AGENT_URL` is set. Not run against a live model here. |
| Gmail and Calendar (send, sync with per-user privacy controls, meetings) | Code complete. **Inactive until** the Google Cloud OAuth client and `TOKEN_ENCRYPTION_KEY` are set |
| Website lead capture endpoint | Off until `LEAD_CAPTURE_ENABLED=true` |
| WhatsApp | Logged manually, and drafts can be copied for manual sending. There is **no** WhatsApp API integration. |

Every integration shows its real status under Settings → Workspace and Research updates → Sources & jobs.

## Starts empty

- **No business data:** migrations create one row of default *settings* and
  nothing else — no companies, contacts, revenue, research or users.
- **Tested:** `tests/db/*` check that every business table is empty on a fresh
  install.
- **Development fixtures:** `npm run dev:seed` exists only for development. It
  refuses to run unless `ALLOW_DEV_SEED=true` **and** the Supabase URL is local.
- **Resetting local data:** see docs/OPERATIONS.md. There is no "delete
  everything" control in the app.

## Project layout

```
supabase/migrations/   schema, constraints, indexes, RLS, triggers, SQL functions (no data)
src/app/(auth)/        sign-in, access denied, sign-out
src/app/(crm)/         every signed-in page (overview, companies, contacts, pipeline, …)
src/app/api/           CSV export, import reports, Google OAuth connect/callback, cron sync, health
src/lib/actions/       server actions — every mutation is validated and authorised here
src/lib/google/        OAuth, encrypted token store, Gmail/Calendar clients, sync and matching
src/lib/research/      research providers (ported outreach-agent logic), evidence rules, job runner
src/lib/monitoring/    public-signal adapters (Greenhouse, Lever, RSS), SSRF-safe fetch, run engine
src/lib/import/        spreadsheet parsing (no formula evaluation), mapping and duplicate planning
src/components/        UI primitives, forms, timeline, import wizard
scripts/               provision-user (first admin), dev-only seed and reset
tests/unit, tests/db   automated tests (see above)
```

## Business rules implemented

- **Active client** means the MSA is signed **and** the company has at least one live
  requirement. A requirement is live in every delivery status except *On hold* and
  *Closed / filled*; *Placed* stays live until it is closed, because one placement may
  not fill the whole hiring volume. Archived requirements never count. The rule is
  enforced in SQL (`company_overview`) and mirrored in `src/lib/domain/client-status.ts`.
- The **sales stage** (New lead → … → Won, plus Nurture and Lost) is tracked on
  opportunities. The **delivery status** (New requirement → … → Placed, On hold,
  Closed / filled) is tracked on requirements. **MSA status** is tracked on the company.
- **MSA status** comes only from agreement records. **Won** requires a signed MSA and a live,
  client-accepted requirement (enforced in SQL). See docs/REVENUE.md.
- Every company, contact, opportunity, requirement and task has **one accountable
  owner**. Only the current owner or an admin can reassign it; anyone can take an
  unassigned record. The database enforces this, not just the UI.
- Stage, status, owner, MSA, placement and archive changes are written to
  `record_history` by database triggers.
- Business records are **archived, never hard-deleted** by the app. Neither members
  nor admins have a delete permission on them.
