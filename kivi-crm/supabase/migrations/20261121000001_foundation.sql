-- =============================================================================
-- KiviTronics CRM — 0001 foundation
-- Team membership, roles, domain enforcement and the audit log.
--
-- This migration creates NO data. A new installation has an empty app_users
-- table; the first administrator is provisioned with `npm run provision-user`
-- (see docs/SETUP.md).
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- Functions that must not be exposed through the PostgREST API live here.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Enumerations
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'member');
create type public.member_status as enum ('invited', 'active', 'disabled');

-- -----------------------------------------------------------------------------
-- Domain configuration (single source of truth in SQL)
-- -----------------------------------------------------------------------------
create or replace function private.allowed_domain()
returns text
language sql
immutable
set search_path = ''
as $$ select 'kivitronicsconsulting.com'::text $$;

create or replace function private.email_in_allowed_domain(p_email text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_email is not null
     and lower(p_email) ~ '^[a-z0-9._%+''-]+@[a-z0-9.-]+$'
     and lower(split_part(p_email, '@', 2)) = private.allowed_domain()
$$;

-- -----------------------------------------------------------------------------
-- Team members (explicit allowlist)
-- A Google account only becomes a CRM user when an administrator has created
-- a row here for its email address. Signing in links the auth identity to the
-- row (see public.claim_membership()).
-- -----------------------------------------------------------------------------
create table public.app_users (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid unique references auth.users (id) on delete set null,
  email            text not null unique,
  full_name        text check (full_name is null or char_length(full_name) between 1 and 120),
  role             public.app_role not null default 'member',
  status           public.member_status not null default 'invited',
  invited_by       uuid references public.app_users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  last_sign_in_at  timestamptz,
  constraint app_users_email_lowercase check (email = lower(email)),
  constraint app_users_email_domain check (private.email_in_allowed_domain(email))
);

comment on table public.app_users is
  'CRM team allowlist. Only rows created by an administrator grant access.';

alter table public.app_users enable row level security;

-- -----------------------------------------------------------------------------
-- Membership helpers used by every RLS policy.
-- SECURITY DEFINER so policies can consult app_users without recursion.
-- -----------------------------------------------------------------------------
create or replace function private.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id
    from public.app_users u
   where u.auth_user_id = auth.uid()
     and u.status = 'active'
     and private.email_in_allowed_domain(u.email)
$$;

create or replace function private.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select private.current_app_user_id() is not null $$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_users u
     where u.auth_user_id = auth.uid()
       and u.status = 'active'
       and u.role = 'admin'
  )
$$;

-- Trusted server context: service_role key or a direct database session with
-- no end-user JWT (migrations, provisioning scripts, background sync).
create or replace function private.is_trusted_backend()
returns boolean
language sql
stable
set search_path = ''
as $$
  select auth.uid() is null
     and (current_user in ('service_role', 'postgres', 'supabase_admin')
          or coalesce(auth.role(), '') = 'service_role')
$$;

grant execute on function private.current_app_user_id() to authenticated, service_role;
grant execute on function private.is_member() to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.is_trusted_backend() to authenticated, service_role;
grant execute on function private.allowed_domain() to authenticated, service_role;
grant execute on function private.email_in_allowed_domain(text) to authenticated, service_role;

-- Members may see the team list (for owner pickers). Nobody may write to it
-- directly: changes go through the admin_* functions below.
create policy app_users_select on public.app_users
  for select to authenticated
  using ((select private.is_member()));

revoke insert, update, delete on public.app_users from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Generic updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger app_users_touch before update on public.app_users
  for each row execute function private.touch_updated_at();

create or replace function private.normalize_app_user()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;

create trigger app_users_normalize before insert or update of email on public.app_users
  for each row execute function private.normalize_app_user();

-- -----------------------------------------------------------------------------
-- Audit log (security events and account management). Admin-readable only.
-- Inserted exclusively by SECURITY DEFINER functions and the trusted backend.
-- Never store tokens, secrets or message bodies here.
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id           bigint generated always as identity primary key,
  occurred_at  timestamptz not null default now(),
  actor_id     uuid references public.app_users (id) on delete set null,
  actor_email  text,
  action       text not null check (action ~ '^[a-z_.]{3,64}$'),
  target_type  text,
  target_id    text,
  details      jsonb not null default '{}'::jsonb
);

create index audit_log_occurred_idx on public.audit_log (occurred_at desc);
create index audit_log_action_idx on public.audit_log (action, occurred_at desc);

alter table public.audit_log enable row level security;

create policy audit_log_admin_select on public.audit_log
  for select to authenticated
  using ((select private.is_admin()));

revoke insert, update, delete on public.audit_log from anon, authenticated;

create or replace function private.write_audit(
  p_action text,
  p_target_type text default null,
  p_target_id text default null,
  p_details jsonb default '{}'::jsonb,
  p_actor_email text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.current_app_user_id();
  v_email text := p_actor_email;
begin
  if v_email is null and v_actor is not null then
    select email into v_email from public.app_users where id = v_actor;
  end if;
  insert into public.audit_log (actor_id, actor_email, action, target_type, target_id, details)
  values (v_actor, v_email, p_action, p_target_type, p_target_id, coalesce(p_details, '{}'::jsonb));
end;
$$;

revoke all on function private.write_audit(text, text, text, jsonb, text) from public;
grant execute on function private.write_audit(text, text, text, jsonb, text) to service_role;

-- Lets the signed-in server code record a small, fixed set of events about
-- the caller (e.g. sign-out). Anything else is rejected.
create or replace function public.log_security_event(p_action text, p_details jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_action not in ('auth.sign_out', 'integration.connected', 'integration.disconnected',
                      'integration.revoked', 'export.csv', 'import.completed') then
    raise exception 'Unsupported audit action' using errcode = '22023';
  end if;
  if not private.is_member() then
    raise exception 'Not a CRM member' using errcode = '42501';
  end if;
  perform private.write_audit(p_action, null, null, p_details);
end;
$$;

revoke all on function public.log_security_event(text, jsonb) from public, anon;
grant execute on function public.log_security_event(text, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- Sign-in: link a verified Google Workspace identity to an allowlisted member.
--
-- Called by the server immediately after the OAuth code exchange. The checks
-- use data Supabase Auth stored from Google's verified ID token — never a
-- value the browser supplied:
--   * the identity provider must be Google;
--   * Google must report the email as verified;
--   * the Google Workspace `hd` (hosted domain) claim must equal the allowed
--     domain (Gmail consumer accounts have no `hd` claim);
--   * the email's domain must equal the allowed domain;
--   * an administrator must have provisioned that email.
-- Returns a status code string; only 'ok' grants access.
-- -----------------------------------------------------------------------------
create or replace function public.claim_membership()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := auth.uid();
  v_email      text;
  v_identity   jsonb;
  v_meta       jsonb;
  v_hd         text;
  v_verified   boolean;
  v_member     public.app_users%rowtype;
  v_name       text;
begin
  if v_uid is null then
    return 'not_authenticated';
  end if;

  select lower(u.email), coalesce(u.raw_user_meta_data, '{}'::jsonb)
    into v_email, v_meta
    from auth.users u
   where u.id = v_uid;

  select i.identity_data
    into v_identity
    from auth.identities i
   where i.user_id = v_uid
     and i.provider = 'google'
   order by i.updated_at desc nulls last
   limit 1;

  if v_identity is null then
    perform private.write_audit('auth.sign_in_denied', 'auth_user', v_uid::text,
      jsonb_build_object('reason', 'not_google_identity'), v_email);
    return 'not_google_identity';
  end if;

  v_hd := lower(coalesce(
    v_identity -> 'custom_claims' ->> 'hd',
    v_identity ->> 'hd',
    v_meta -> 'custom_claims' ->> 'hd'
  ));
  v_verified := coalesce((v_identity ->> 'email_verified')::boolean, false);

  if not v_verified
     or v_hd is distinct from private.allowed_domain()
     or not private.email_in_allowed_domain(v_email)
     or lower(coalesce(v_identity ->> 'email', '')) <> v_email then
    perform private.write_audit('auth.sign_in_denied', 'auth_user', v_uid::text,
      jsonb_build_object('reason', 'domain_not_allowed', 'hd', v_hd, 'email_verified', v_verified),
      v_email);
    return 'domain_not_allowed';
  end if;

  select * into v_member from public.app_users where email = v_email for update;

  if not found then
    perform private.write_audit('auth.sign_in_denied', 'auth_user', v_uid::text,
      jsonb_build_object('reason', 'not_provisioned'), v_email);
    return 'not_provisioned';
  end if;

  if v_member.status = 'disabled' then
    perform private.write_audit('auth.sign_in_denied', 'app_user', v_member.id::text,
      jsonb_build_object('reason', 'disabled'), v_email);
    return 'disabled';
  end if;

  if v_member.auth_user_id is not null and v_member.auth_user_id <> v_uid then
    perform private.write_audit('auth.sign_in_denied', 'app_user', v_member.id::text,
      jsonb_build_object('reason', 'identity_mismatch'), v_email);
    return 'identity_mismatch';
  end if;

  v_name := nullif(trim(coalesce(v_identity ->> 'full_name', v_identity ->> 'name', '')), '');

  update public.app_users
     set auth_user_id    = v_uid,
         status          = 'active',
         full_name       = coalesce(full_name, left(v_name, 120)),
         last_sign_in_at = now()
   where id = v_member.id;

  insert into public.audit_log (actor_id, actor_email, action, target_type, target_id, details)
  values (v_member.id, v_email,
          case when v_member.status = 'invited' then 'auth.first_sign_in' else 'auth.sign_in' end,
          'app_user', v_member.id::text, '{}'::jsonb);

  return 'ok';
end;
$$;

revoke all on function public.claim_membership() from public, anon;
grant execute on function public.claim_membership() to authenticated;

-- -----------------------------------------------------------------------------
-- Current user profile (safe fields only)
-- -----------------------------------------------------------------------------
create or replace function public.current_member()
returns table (id uuid, email text, full_name text, role public.app_role, status public.member_status)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email, u.full_name, u.role, u.status
    from public.app_users u
   where u.auth_user_id = auth.uid()
$$;

revoke all on function public.current_member() from public, anon;
grant execute on function public.current_member() to authenticated;

-- -----------------------------------------------------------------------------
-- Administration (admins only; every change is audited)
-- -----------------------------------------------------------------------------
create or replace function public.admin_invite_user(p_email text, p_full_name text, p_role public.app_role)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_email text := lower(trim(p_email));
begin
  if not private.is_admin() then
    raise exception 'Only administrators can add team members' using errcode = '42501';
  end if;
  if not private.email_in_allowed_domain(v_email) then
    raise exception 'Email must be a @% address', private.allowed_domain() using errcode = '22023';
  end if;
  if exists (select 1 from public.app_users where email = v_email) then
    raise exception 'That person is already on the team list' using errcode = '23505';
  end if;

  insert into public.app_users (email, full_name, role, status, invited_by)
  values (v_email, nullif(trim(p_full_name), ''), p_role, 'invited', private.current_app_user_id())
  returning id into v_id;

  perform private.write_audit('admin.user_invited', 'app_user', v_id::text,
    jsonb_build_object('email', v_email, 'role', p_role));
  return v_id;
end;
$$;

create or replace function public.admin_update_user(
  p_user_id uuid,
  p_role public.app_role,
  p_status public.member_status,
  p_full_name text default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.app_users%rowtype;
  v_active_admins int;
begin
  if not private.is_admin() then
    raise exception 'Only administrators can change team members' using errcode = '42501';
  end if;
  if p_status = 'invited' then
    raise exception 'Status can only be set to active or disabled' using errcode = '22023';
  end if;

  select * into v_old from public.app_users where id = p_user_id for update;
  if not found then
    raise exception 'Team member not found' using errcode = 'P0002';
  end if;

  -- An invited person stays invited until they sign in; admins may only disable them.
  if v_old.status = 'invited' and p_status = 'active' then
    p_status := 'invited';
  end if;

  -- Never leave the CRM without an active administrator.
  if v_old.role = 'admin' and v_old.status = 'active'
     and (p_role <> 'admin' or p_status <> 'active') then
    select count(*) into v_active_admins
      from public.app_users where role = 'admin' and status = 'active';
    if v_active_admins <= 1 then
      raise exception 'At least one active administrator is required' using errcode = '22023';
    end if;
  end if;

  update public.app_users
     set role = p_role,
         status = p_status,
         full_name = coalesce(nullif(trim(p_full_name), ''), full_name)
   where id = p_user_id;

  if v_old.role is distinct from p_role then
    perform private.write_audit('admin.role_changed', 'app_user', p_user_id::text,
      jsonb_build_object('email', v_old.email, 'from', v_old.role, 'to', p_role));
  end if;
  if v_old.status is distinct from p_status then
    perform private.write_audit('admin.status_changed', 'app_user', p_user_id::text,
      jsonb_build_object('email', v_old.email, 'from', v_old.status, 'to', p_status));
  end if;
end;
$$;

revoke all on function public.admin_invite_user(text, text, public.app_role) from public, anon;
revoke all on function public.admin_update_user(uuid, public.app_role, public.member_status, text) from public, anon;
grant execute on function public.admin_invite_user(text, text, public.app_role) to authenticated;
grant execute on function public.admin_update_user(uuid, public.app_role, public.member_status, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Optional Supabase Auth hook: "Before User Created".
-- Rejects sign-ups from outside the Workspace domain before an auth.users row
-- is even created. Enable it in Dashboard → Authentication → Hooks
-- (docs/SETUP.md §4). The CRM is still protected without it.
-- -----------------------------------------------------------------------------
create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_email text := lower(event -> 'user' ->> 'email');
begin
  if private.email_in_allowed_domain(v_email) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'Only KiviTronics Workspace accounts can use this CRM.'));
end;
$$;

revoke all on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    execute 'grant usage on schema private to supabase_auth_admin';
    execute 'grant execute on function private.email_in_allowed_domain(text) to supabase_auth_admin';
    execute 'grant execute on function private.allowed_domain() to supabase_auth_admin';
    execute 'grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin';
  end if;
end $$;
