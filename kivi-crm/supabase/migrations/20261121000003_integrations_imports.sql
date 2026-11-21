-- =============================================================================
-- KiviTronics CRM — 0003 Google integrations and spreadsheet imports
-- =============================================================================

create type public.google_product as enum ('gmail', 'calendar');
create type public.connection_status as enum ('connected', 'needs_reauth', 'error', 'disconnected');

-- -----------------------------------------------------------------------------
-- Per-user Google connections. SERVER ONLY.
-- RLS is enabled with no policies and all privileges are revoked from the API
-- roles, so neither the browser nor another user can ever read a token.
-- Tokens are AES-256-GCM encrypted by the application before storage
-- (src/lib/crypto.ts) with a key that lives only in server env vars.
-- -----------------------------------------------------------------------------
create table public.google_connections (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.app_users (id) on delete cascade,
  product                  public.google_product not null,
  google_email             text not null,
  scopes                   text[] not null default '{}',
  refresh_token_enc        text,
  access_token_enc         text,
  access_token_expires_at  timestamptz,
  status                   public.connection_status not null default 'connected',
  sync_cursor              text,
  last_sync_at             timestamptz,
  last_sync_result         jsonb not null default '{}'::jsonb,
  last_error               text check (last_error is null or char_length(last_error) <= 500),
  connected_at             timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id, product)
);

alter table public.google_connections enable row level security;
revoke all on public.google_connections from anon, authenticated;

create trigger google_connections_touch before update on public.google_connections
  for each row execute function private.touch_updated_at();

-- Safe, token-free status for the signed-in user only.
create or replace function public.my_google_connections()
returns table (
  product public.google_product,
  google_email text,
  scopes text[],
  status public.connection_status,
  last_sync_at timestamptz,
  last_sync_result jsonb,
  last_error text,
  connected_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.product, c.google_email, c.scopes, c.status, c.last_sync_at,
         c.last_sync_result, c.last_error, c.connected_at
    from public.google_connections c
   where c.user_id = private.current_app_user_id()
$$;

revoke all on function public.my_google_connections() from public, anon;
grant execute on function public.my_google_connections() to authenticated;

-- -----------------------------------------------------------------------------
-- Sync review queue (private to each user).
-- Items found in a user's mailbox/calendar that look CRM-related but could not
-- be matched to a single contact wait here until the user logs or ignores them.
-- -----------------------------------------------------------------------------
create table public.sync_review_items (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.app_users (id) on delete cascade,
  product               public.google_product not null,
  external_id           text not null,
  external_thread_id    text,
  subject               text,
  participants          jsonb not null default '[]'::jsonb,
  occurred_at           timestamptz not null,
  suggested_company_id  uuid references public.companies (id) on delete set null,
  state                 text not null default 'pending' check (state in ('pending', 'logged', 'ignored')),
  activity_id           uuid references public.activities (id) on delete set null,
  created_at            timestamptz not null default now(),
  unique (user_id, product, external_id)
);

create index sync_review_pending_idx on public.sync_review_items (user_id, occurred_at desc)
  where state = 'pending';

alter table public.sync_review_items enable row level security;
create policy sync_review_own_select on public.sync_review_items
  for select to authenticated using (user_id = (select private.current_app_user_id()));
create policy sync_review_own_update on public.sync_review_items
  for update to authenticated
  using (user_id = (select private.current_app_user_id()))
  with check (user_id = (select private.current_app_user_id()));
revoke insert, delete, truncate on public.sync_review_items from anon, authenticated;
revoke all on public.sync_review_items from anon;

-- Threads / events a user has said are NOT CRM-related. Sync skips them.
create table public.sync_exclusions (
  user_id      uuid not null references public.app_users (id) on delete cascade,
  product      public.google_product not null,
  external_key text not null,  -- Gmail thread id or Calendar event id
  created_at   timestamptz not null default now(),
  primary key (user_id, product, external_key)
);

alter table public.sync_exclusions enable row level security;
create policy sync_exclusions_own_select on public.sync_exclusions
  for select to authenticated using (user_id = (select private.current_app_user_id()));
create policy sync_exclusions_own_insert on public.sync_exclusions
  for insert to authenticated with check (user_id = (select private.current_app_user_id()));
create policy sync_exclusions_own_delete on public.sync_exclusions
  for delete to authenticated using (user_id = (select private.current_app_user_id()));
revoke all on public.sync_exclusions from anon;

-- -----------------------------------------------------------------------------
-- Imports: one row per completed import, with a downloadable error report.
-- -----------------------------------------------------------------------------
create table public.imports (
  id             uuid primary key default gen_random_uuid(),
  entity         text not null check (entity in ('leads', 'companies', 'contacts')),
  filename       text not null check (char_length(filename) <= 255),
  created_by     uuid references public.app_users (id) on delete set null,
  created_at     timestamptz not null default now(),
  total_rows     integer not null default 0,
  created_count  integer not null default 0,
  updated_count  integer not null default 0,
  skipped_count  integer not null default 0,
  failed_count   integer not null default 0,
  mapping        jsonb not null default '{}'::jsonb,
  report         jsonb not null default '[]'::jsonb
);

create index imports_created_idx on public.imports (created_at desc);

alter table public.imports enable row level security;
create policy imports_select on public.imports
  for select to authenticated using ((select private.is_member()));
create policy imports_insert on public.imports
  for insert to authenticated
  with check ((select private.is_member()) and created_by = (select private.current_app_user_id()));
revoke update, delete, truncate on public.imports from anon, authenticated;
revoke all on public.imports from anon;
