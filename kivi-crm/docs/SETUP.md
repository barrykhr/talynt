# Setup guide

This guide takes the CRM from an empty Supabase project to
`https://crm.kivitronicsconsulting.com`. Steps marked **[owner]** need
credentials or console access that only KiviTronics has.

Order: §1 local → §2 Supabase → §3 migrations → §4 Google sign-in → §5 first admin
→ §6 deployment and domain → §7 Gmail and Calendar (optional, docs/GOOGLE.md).

---

## 1. Local development

Requirements: Node.js 20.9+ and npm. For local Supabase, also the
[Supabase CLI](https://supabase.com/docs/guides/cli) and Docker.

```bash
cd kivi-crm
cp .env.example .env.local
npm install
```

Choose one of these backends:

- **Local stack (recommended for development):** run `supabase start`. It applies
  `supabase/migrations` automatically. It loads **no** seed data, because
  `[db.seed] enabled = false`. Copy the printed API URL, anon key and service-role
  key into `.env.local`.
- **A separate Supabase "dev" project:** follow §2–§3 against it. Never develop
  against the production project.

Then run:

```bash
npm run dev            # http://localhost:3000
```

Optional development fixtures are clearly fake: they use a `[DEV]` prefix and
`example.com` addresses. They only load into a **local** stack:

```bash
ALLOW_DEV_SEED=true npm run dev:seed
ALLOW_DEV_SEED=true npm run dev:reset     # remove them again (see docs/OPERATIONS.md)
```

---

## 2. Create the Supabase project **[owner]**

1. Create a project at supabase.com. Pick the Mumbai (ap-south-1) region if it is
   offered, to stay close to the team. The **Pro plan** is recommended for daily
   backups (see docs/OPERATIONS.md).
2. Go to **Project Settings → API** and copy these values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` / secret key → `SUPABASE_SERVICE_ROLE_KEY` (server only, never in browser code)
3. Go to **Authentication → Sign In / Providers**:
   - Leave **Email** sign-in disabled. The app only offers Google, and the
     database rejects non-Google identities anyway.
   - Turn **"Allow new users to sign up"** on. Google sign-in needs it to create
     the auth user on a person's first visit. CRM access still depends on the
     allowlist (§5).

---

## 3. Apply the database migrations **[owner]**

Using the CLI:

```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase db push          # applies supabase/migrations/*.sql in order
```

Without the CLI, open each file in `supabase/migrations/`, in filename order, in
**SQL Editor** and run it.

The migrations create the schema, constraints, indexes, row-level security
policies, triggers and functions. They insert **no rows**: the CRM starts empty.

Later schema changes go in a new, timestamped migration file. Never edit a
migration that has already been applied to production.

---

## 4. Google sign-in **[owner]**

### 4a. Google Cloud OAuth client

Use a Google Cloud project that belongs to the `kivitronicsconsulting.com`
organisation.

1. Go to **APIs & Services → OAuth consent screen**:
   - Set **User type** to **Internal**. Only accounts in your Workspace can then
     sign in, and Google does not require app verification. See docs/GOOGLE.md for
     why this matters for Gmail scopes.
   - Set the app name ("KiviTronics CRM"), the support email and the authorised
     domain `kivitronicsconsulting.com`.
2. Go to **APIs & Services → Credentials → Create credentials → OAuth client ID**,
   and choose **Web application**. Add these **authorised redirect URIs**:
   - `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` (sign-in, through Supabase)
   - `https://crm.kivitronicsconsulting.com/api/integrations/google/callback` (Gmail and Calendar, §7)
   - `http://localhost:3000/api/integrations/google/callback` (local development)
3. Copy the client ID and secret.

### 4b. Supabase Google provider

1. Go to **Supabase → Authentication → Sign In / Providers → Google**. Enable it
   and paste the client ID and secret.
2. Go to **Authentication → URL Configuration**:
   - Set **Site URL** to `https://crm.kivitronicsconsulting.com`.
   - Add these **Redirect URLs**: `https://crm.kivitronicsconsulting.com/auth/callback`
     and `http://localhost:3000/auth/callback`.

### 4c. Recommended: the sign-up hook

Go to **Authentication → Hooks → Before User Created**, choose the Postgres
function `public.hook_before_user_created`, and save. Supabase then refuses to
create auth users for any email outside `kivitronicsconsulting.com`. The CRM
stays protected without the hook; this just keeps the auth user list clean.

### How access is decided

1. Google authenticates the person. The `hd` parameter in the sign-in URL only
   pre-selects the work account in Google's account chooser. It is **not**
   relied on for security.
2. `/auth/callback` exchanges the one-time code, then calls
   `public.claim_membership()` in the database. That function checks data that
   Supabase stored from Google's **verified ID token**:
   - the provider is Google;
   - `email_verified` is true;
   - the Workspace `hd` claim equals `kivitronicsconsulting.com`;
   - the email domain matches;
   - an admin has added that exact email to `app_users`.
3. If any check fails, the user is signed straight back out and sees a clear
   access-denied page. The attempt is written to the audit log.
4. Every row-level security policy asks `private.is_member()`, which requires an
   active, linked `app_users` row. If a member is disabled, they lose access on
   their next request.

**Troubleshooting:** if a legitimate user is told their account "isn't a
KiviTronics Workspace account", look at what Google returned:

```sql
select identity_data->'custom_claims' as claims, identity_data->>'email_verified' as verified
from auth.identities where provider = 'google'
order by updated_at desc limit 5;
```

`claims` should contain `"hd": "kivitronicsconsulting.com"`.

---

## 5. Provision the first administrator **[owner]**

The allowlist starts empty, so nobody can sign in until someone is added. Run
this once with the production environment variables:

```bash
# .env.local temporarily pointing at production, or export the two variables in your shell:
#   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
npm run provision-user -- yourname@kivitronicsconsulting.com --role admin --name "Your Name"
```

To add the admin without the CLI, run this in the SQL Editor:

```sql
insert into public.app_users (email, role, full_name) values ('yourname@kivitronicsconsulting.com', 'admin', 'Your Name');
```

The admin then signs in, opens **Team & audit**, and adds the other two people
as Members or Admins. Each person signs in with Google using exactly that
address. Their status changes from *Invited* to *Active* on their first sign-in.

---

## 6. Deploy to the KiviTronics domain **[owner]**

These steps use Vercel. Any Node 20+ host with environment variables works the
same way.

1. Import the GitHub repository into Vercel and set **Root Directory** to
   `kivi-crm`. Vercel detects the framework (Next.js) automatically.
2. Under **Environment variables** (Production), set:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://crm.kivitronicsconsulting.com` |
   | `NEXT_PUBLIC_SUPABASE_URL` | from §2 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from §2 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from §2 (mark as *Sensitive*) |
   | `CRON_SECRET` | random, at least 16 characters (`node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`) |
   | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY` | §7 (optional until Gmail and Calendar are enabled) |

   Never set `ALLOW_DEV_SEED` in any hosted environment.
3. Deploy.
4. **Custom domain:**
   - In Vercel, go to **Settings → Domains** and add `crm.kivitronicsconsulting.com`.
   - At your DNS provider, create the record Vercel shows. This is normally
     `CNAME crm → cname.vercel-dns.com`.
   - HTTPS is issued automatically once DNS resolves.
5. Confirm that the Supabase **Site URL** and **Redirect URLs** (§4b) and the
   Google **redirect URIs** (§4a) all use the final domain.
6. **Scheduled sync:** `vercel.json` schedules `/api/cron/sync` every 30 minutes.
   Vercel sends `Authorization: Bearer $CRON_SECRET` automatically. The Hobby plan
   only allows daily crons, so either use Pro or change the schedule.
7. **Smoke test:**
   - `https://crm.kivitronicsconsulting.com/api/health` returns `{"ok":true}`.
   - Sign in as the admin; you should see the empty "Add your first company" state.
   - Sign in with a non-allowlisted Workspace account; you should see "You haven't
     been added".
   - **Team & audit** shows both sign-in events.

Production deployment is only complete when these smoke tests pass on the real
domain.

---

## 7. Gmail and Google Calendar (optional, per user)

See **docs/GOOGLE.md**. In short:

1. Enable the Gmail API and Google Calendar API.
2. Set `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` and
   `TOKEN_ENCRYPTION_KEY`.
3. Each person opens **Settings & connections** and clicks **Connect Gmail** and
   **Connect Google Calendar**.

Until these are configured, the Settings page shows "awaiting Google Cloud
configuration" and lists exactly what is missing. Manual activity logging works
regardless.

---

## Environment variable reference

See `.env.example`. Only `NEXT_PUBLIC_*` values reach the browser. The
service-role key, OAuth client secret, token encryption key and cron secret are
read only in server code.
