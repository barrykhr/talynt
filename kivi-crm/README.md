# KiviTronics CRM

Internal CRM for the KiviTronics Consulting team: companies, contacts, the sales
pipeline, hiring requirements and delivery, activities and follow-ups,
spreadsheet import/export, reports, and per-user Gmail and Google Calendar.

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
| Google Workspace sign-in, allowlist, Admin and Member roles, audit log | Works once Supabase and Google sign-in are configured (docs/SETUP.md) |
| Companies, contacts, pipeline (list and board), requirements, activities and tasks, search, reports | Works |
| Duplicate detection and merging; archive and restore; record history | Works |
| CSV/XLSX import (mapping, preview, duplicate decisions, error report); CSV export | Works |
| WhatsApp | Logged manually as an activity type and lead source. There is **no** WhatsApp API integration. |
| Gmail: send from CRM records, metadata sync, review queue | Code is complete. **Inactive until** the Google Cloud OAuth client, `TOKEN_ENCRYPTION_KEY` and the service-role key are set. The Settings page says so clearly. |
| Google Calendar: event sync, create meetings | Same as Gmail |
| Scheduled background sync (every 30 min) | Needs `CRON_SECRET` and a host that runs crons (Vercel Pro for a 30-minute schedule) |

## Project layout

```
supabase/migrations/   schema, constraints, indexes, RLS, triggers, SQL functions (no data)
src/app/(auth)/        sign-in, access denied, sign-out
src/app/(crm)/         every signed-in page (overview, companies, contacts, pipeline, …)
src/app/api/           CSV export, import reports, Google OAuth connect/callback, cron sync, health
src/lib/actions/       server actions — every mutation is validated and authorised here
src/lib/google/        OAuth, encrypted token store, Gmail/Calendar clients, sync and matching
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
- Every company, contact, opportunity, requirement and task has **one accountable
  owner**. Only the current owner or an admin can reassign it; anyone can take an
  unassigned record. The database enforces this, not just the UI.
- Stage, status, owner, MSA, placement and archive changes are written to
  `record_history` by database triggers.
- Business records are **archived, never hard-deleted** by the app. Neither members
  nor admins have a delete permission on them.
