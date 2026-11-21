# Security model

## Who can do what

| | Anonymous | Workspace user not on the allowlist | Member | Admin |
|---|---|---|---|---|
| Sign in to the CRM | — | Denied, and the attempt is audited | ✓ | ✓ |
| Read and update shared records (companies, contacts, opportunities, requirements, activities) | — | — | ✓ | ✓ |
| Reassign a record owned by someone else | — | — | only if unassigned | ✓ |
| Hard-delete business records | — | — | ✗ (archive instead) | ✗ (archive instead) |
| Manage team members and roles; read the audit log | — | — | — | ✓ |
| See another user's Google tokens, mailbox or review queue | — | — | ✗ | ✗ |

Authorisation is enforced by **Postgres row-level security, triggers and
SECURITY DEFINER functions**. The Next.js server additionally checks membership
before every page, action and API route. Hiding UI controls is never the only
protection. `tests/db/authorization.test.ts` proves these rules against the real
migrations.

## Common web risks

| Risk | Mitigation |
|---|---|
| Domain spoofing at sign-in | The `hd` URL parameter is treated as a hint only. `claim_membership()` checks the verified Google identity's `hd` claim, `email_verified` and the email domain, plus an explicit allowlist. The optional sign-up hook rejects other domains even earlier. |
| Privilege escalation | `app_users` has no write grants for API roles. Role and status changes go through admin-only SQL functions, which also protect the last admin. `created_by` is stamped by the database. Owner changes are checked by trigger. |
| Insecure direct object references | Every query runs as the user under RLS. Synced mailbox data (`sync_review_items`, `sync_exclusions`) is restricted to `user_id = current user`. Google tokens live in a table with no API-role privileges. |
| SQL injection | Parameterised PostgREST queries and SQL functions only. No string-built SQL. Search escapes `%`, `_` and `\` and runs through a SQL function. |
| Cross-site scripting | React escapes all output. `dangerouslySetInnerHTML` is banned by lint. User text is rendered as plain text. A strict Content-Security-Policy is applied (no third-party scripts; `frame-ancestors 'none'`). |
| CSRF | Mutations are Next.js server actions, which check the request origin. Sign-out is a POST action. The Google OAuth callback requires an HMAC-signed, user-bound, expiring `state` plus an httpOnly nonce cookie. Cookies are `SameSite=Lax`. |
| Open redirects | Every post-login `next` value goes through `safeRedirectPath`: same-site paths only, with `//`, backslashes, control characters, `/auth/*` and `/api/*` rejected. This is covered by tests. |
| Secrets exposure | Only `NEXT_PUBLIC_*` values reach the browser, and the browser never calls Supabase or Google directly. Google refresh and access tokens are AES-256-GCM encrypted at rest. Logs redact tokens, secrets and message content. |
| Email header injection | The subject must be a single line and addresses are validated. Header values are sanitised again when the MIME message is built. Covered by tests. |
| Spreadsheet attacks | Uploads are capped at 5 MB and 2,000 rows. XLSX files are checked for the ZIP signature. Formulas are **never evaluated** (only cached values are read, and macros and `.xls`/`.xlsm` are refused). Cells are stored as text. CSV exports neutralise `= + - @` cells against CSV injection. |
| Accidental data loss | No delete permissions on business records. Archive and restore are available. Merges archive the duplicate and record `merged_into_id`. History and audit logs are append-only. |
| Clickjacking and sniffing | `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, HSTS, a strict `Referrer-Policy` and a minimal `Permissions-Policy`. |

## v2 additions

| Area | Control |
|---|---|
| Identity | Members are linked by Google's immutable subject id (`google_sub`). An email rename keeps access, and a different Google account can't take over a provisioned email. |
| Trusted backend | `private.is_trusted_backend()` trusts only the service-role JWT or a direct operator session. It never trusts anonymous or member requests, including inside SECURITY DEFINER functions (tested). |
| Research | Only the trusted backend can store results. Snapshots and findings are immutable apart from review fields. Inputs are minimised and shown on the snapshot. LinkedIn is blocked in the web tools. There is no automatic sending. Rate limited per user. |
| Monitoring fetches | https only, private and internal IPs blocked (checked on every redirect), 15-second timeout, 2 MB cap, polite retries. Feed text is stored as plain text and rendered escaped. |
| Revenue | No deletes. Payments are reversed rather than edited. Currency, overpayment and cancellation guards. History and audit triggers. |
| Settings | Members can read workspace settings; only admins can change them (RLS policy), and every change is audited with before and after values. |
| Public capture endpoint | Disabled by default, origin allow-list, IP rate limits stored as salted hashes, honeypot, timing and Turnstile checks, payload cap, inbox review before any record is created. |
| Notifications | In-app only, per-user RLS. Links are restricted to same-site paths. |
