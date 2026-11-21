# Operations

## Backups

The CRM's data lives in Supabase Postgres. Plan for two layers.

1. **Supabase managed backups.** The Pro plan takes daily backups and keeps them
   for 7 days. Add **Point-in-Time Recovery** if losing up to a day of work is not
   acceptable. The Free plan has no downloadable backups, so do not run
   production on it.
2. **Your own logical backup**, at least weekly, stored outside Supabase (for
   example an access-restricted Shared Drive):

   ```bash
   supabase db dump --linked -f kivi-crm-schema-$(date +%F).sql
   supabase db dump --linked --data-only -f kivi-crm-data-$(date +%F).sql
   ```

   Alternatively, use `pg_dump` with the connection string from **Project
   Settings → Database**. These files contain client data, so treat them as
   confidential. Google OAuth tokens in them are encrypted and are useless
   without `TOKEN_ENCRYPTION_KEY`.

CSV exports (**Import & export**, or **Team & audit → Data**) are a convenient
human-readable copy. They are **not** a full backup: history, audit log and links
between records are not included.

### Restore

- **To a point in time, or the last daily backup:** go to **Supabase Dashboard →
  Database → Backups**. Restoring replaces the whole database, so first export
  anything entered since the backup.
- **From a logical dump into a fresh project:**
  1. Create the project.
  2. Run `supabase db push`, which applies the migrations.
  3. Load the data file:

     ```bash
     psql "$NEW_DB_URL" -f kivi-crm-data-YYYY-MM-DD.sql
     ```

  4. Point the environment variables at the new project.
  5. Re-run docs/SETUP.md §4b, since auth settings are per project.

  Users simply sign in again. Their `app_users` rows re-link automatically by
  email. If an auth user was recreated, an admin may need to clear
  `auth_user_id` for that person.
- **Test a restore once a quarter** into a scratch project.

## Clearing development data

- **Local stack:**
  - `supabase db reset` rebuilds the database from migrations, with no seed data.
  - `ALLOW_DEV_SEED=true npm run dev:reset` removes CRM records but keeps team
    members.
  - Add `-- --include-users` to also remove team members, connections and the
    audit log.
  - It also clears research, monitoring, revenue, agreements, imports and web
    submissions. Workspace settings are kept.
- Both scripts **refuse to run** unless:
  - `ALLOW_DEV_SEED=true`;
  - `NODE_ENV` and `VERCEL_ENV` are not `production`; and
  - the Supabase URL is a local host.
- There is intentionally **no "wipe everything" control in the production app**.
  Individual records are archived and can be restored. Deleting production data
  wholesale is a deliberate database operation by the owner (SQL editor), done
  after a backup.

## Day-to-day administration

- **Add or remove people:** use **Team & audit**. Disabling someone takes effect
  on their next request; their records keep their owner for history. Reassign
  their open work by filtering lists by owner. The database refuses to disable or
  demote the last active admin.
- **Audit log:** **Team & audit** shows sign-ins, denied sign-ins, team changes,
  Google connections, merges, imports and exports.
- **Record history:** each record shows its own stage, status, owner, MSA,
  placement and archive changes.

## Logs and monitoring

- Server logs are structured JSON lines (`{ts, level, event, …}`) in the host's
  log viewer. They never contain tokens, secrets, cookies or email content;
  `src/lib/log.ts` redacts them, and tests cover it.
- Scheduled run: `GET /api/cron/sync` returns per-step results (`msa_refresh`, `earnings_refresh`,
  `research_retries`, `monitors`, `google_sync`). A failed step is logged as `cron.step_failed` and never
  blocks the others. Monitor and research health is visible in Research updates → Sources & jobs.
- Useful events to watch: `research.job_failed`, `monitor.run`, `capture.rejected`,
  - `auth.access_denied`
  - `google.token_revoked`
  - `google.sync.failed`
  - `cron.sync`
  - `import.completed`
  - `db.error`
- Liveness: `GET /api/health`.

## Rotating secrets

| Secret | How |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Rotate in Supabase (API keys), update the env var, redeploy. |
| Google OAuth client secret | Add a new secret in Google Cloud, update both Supabase (Google provider) and `GOOGLE_OAUTH_CLIENT_SECRET`, redeploy, then delete the old secret. |
| `TOKEN_ENCRYPTION_KEY` | Changing it makes stored Google tokens unreadable. Connections switch to *Reconnect needed* and each person reconnects. Nothing else is affected. |
| `CRON_SECRET` | Update the env var and redeploy. Vercel sends the new value automatically. |

## Schema changes

Add a new file under `supabase/migrations/` (timestamp prefix). Run `npm test`,
which applies all migrations to a fresh database and runs the authorisation
tests. Then run `supabase db push`. Never edit a migration that has already been
applied.
