-- =============================================================================
-- KiviTronics CRM — 0002 core records
-- Companies, contacts, opportunities, requirements, activities, history.
-- Business records are never hard-deleted by the application: they are
-- archived (archived_at) and can be restored.
-- =============================================================================

create type public.lead_source as enum
  ('spreadsheet', 'referral', 'linkedin', 'website', 'event', 'whatsapp', 'other');

create type public.opportunity_stage as enum
  ('new_lead', 'researching', 'ready_to_contact', 'contacted', 'in_conversation',
   'qualified', 'proposal_msa', 'won', 'nurture', 'lost');

create type public.msa_status as enum ('not_started', 'in_discussion', 'signed');

create type public.requirement_status as enum
  ('new_requirement', 'sourcing', 'candidates_shared', 'interviews', 'offer',
   'placed', 'on_hold', 'closed_filled');

create type public.activity_type as enum
  ('email', 'call', 'meeting', 'whatsapp', 'event', 'note', 'task');

create type public.activity_origin as enum ('manual', 'gmail', 'calendar', 'import');

create type public.reminder_state as enum ('none', 'scheduled', 'dismissed');

-- -----------------------------------------------------------------------------
-- Normalisation helpers (mirrored in src/lib/normalize.ts; tests keep them in sync)
-- -----------------------------------------------------------------------------
create or replace function private.normalize_company_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(regexp_replace(
           regexp_replace(
             regexp_replace(
               regexp_replace(lower(coalesce(p_name, '')), '&', ' and ', 'g'),
               '[^a-z0-9]+', ' ', 'g'),
             '\m(private|pvt|limited|ltd|llp|llc|inc|incorporated|corp|corporation|co|company|plc|gmbh|the)\M',
             ' ', 'g'),
           '\s+', ' ', 'g'))
$$;

create or replace function private.normalize_domain(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(trim(coalesce(p_value, ''))), '^[a-z]+://', ''),
        '^www\.', ''),
      '[/?#:].*$', ''),
    '')
$$;

create or replace function private.is_live_requirement(p_status public.requirement_status)
returns boolean
language sql
immutable
set search_path = ''
as $$ select p_status not in ('on_hold', 'closed_filled') $$;

grant execute on function private.normalize_company_name(text) to authenticated, service_role;
grant execute on function private.normalize_domain(text) to authenticated, service_role;
grant execute on function private.is_live_requirement(public.requirement_status) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Companies
-- -----------------------------------------------------------------------------
create table public.companies (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(trim(name)) between 1 and 200),
  normalized_name   text generated always as (private.normalize_company_name(name)) stored,
  domain            text check (domain is null or domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  website           text check (website is null or char_length(website) <= 300),
  industry          text check (industry is null or char_length(industry) <= 120),
  location          text check (location is null or char_length(location) <= 200),
  source            public.lead_source,
  source_detail     text check (source_detail is null or char_length(source_detail) <= 200),
  owner_id          uuid references public.app_users (id) on delete restrict,
  msa_status        public.msa_status not null default 'not_started',
  msa_signed_on     date,
  notes             text check (notes is null or char_length(notes) <= 20000),
  last_activity_at  timestamptz,
  created_by        uuid references public.app_users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  archived_at       timestamptz,
  archived_by       uuid references public.app_users (id) on delete set null,
  merged_into_id    uuid references public.companies (id) on delete set null,
  search_text       text generated always as (
    lower(coalesce(name, '') || ' ' || coalesce(domain, '') || ' ' || coalesce(location, '') || ' ' ||
          coalesce(industry, '') || ' ' || coalesce(notes, ''))) stored,
  constraint companies_not_merged_into_self check (merged_into_id is null or merged_into_id <> id)
);

create unique index companies_domain_unique on public.companies (domain)
  where archived_at is null and domain is not null;
create index companies_owner_idx on public.companies (owner_id) where archived_at is null;
create index companies_msa_idx on public.companies (msa_status) where archived_at is null;
create index companies_name_trgm on public.companies using gin (normalized_name extensions.gin_trgm_ops);
create index companies_search_trgm on public.companies using gin (search_text extensions.gin_trgm_ops);
create index companies_created_idx on public.companies (created_at desc);

-- -----------------------------------------------------------------------------
-- Contacts
-- -----------------------------------------------------------------------------
create table public.contacts (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid references public.companies (id) on delete restrict,
  full_name         text not null check (char_length(trim(full_name)) between 1 and 160),
  role_title        text check (role_title is null or char_length(role_title) <= 160),
  email             text check (email is null or (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone             text check (phone is null or char_length(phone) <= 40),
  linkedin_url      text check (linkedin_url is null or char_length(linkedin_url) <= 300),
  location          text check (location is null or char_length(location) <= 200),
  source            public.lead_source,
  owner_id          uuid references public.app_users (id) on delete restrict,
  notes             text check (notes is null or char_length(notes) <= 20000),
  last_activity_at  timestamptz,
  created_by        uuid references public.app_users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  archived_at       timestamptz,
  archived_by       uuid references public.app_users (id) on delete set null,
  merged_into_id    uuid references public.contacts (id) on delete set null,
  search_text       text generated always as (
    lower(coalesce(full_name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(role_title, '') || ' ' ||
          coalesce(phone, '') || ' ' || coalesce(location, '') || ' ' || coalesce(notes, ''))) stored
);

create unique index contacts_email_unique on public.contacts (email)
  where archived_at is null and email is not null;
create index contacts_company_idx on public.contacts (company_id);
create index contacts_owner_idx on public.contacts (owner_id) where archived_at is null;
create index contacts_search_trgm on public.contacts using gin (search_text extensions.gin_trgm_ops);
create index contacts_created_idx on public.contacts (created_at desc);

-- -----------------------------------------------------------------------------
-- Opportunities (commercial sales pipeline)
-- -----------------------------------------------------------------------------
create table public.opportunities (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies (id) on delete restrict,
  title              text not null check (char_length(trim(title)) between 1 and 200),
  stage              public.opportunity_stage not null default 'new_lead',
  source             public.lead_source,
  owner_id           uuid references public.app_users (id) on delete restrict,
  hiring_need        text check (hiring_need is null or char_length(hiring_need) <= 300),
  hiring_volume      integer check (hiring_volume is null or hiring_volume between 1 and 100000),
  location           text check (location is null or char_length(location) <= 200),
  budget             text check (budget is null or char_length(budget) <= 300),
  next_follow_up_on  date,
  loss_reason        text check (loss_reason is null or char_length(loss_reason) <= 1000),
  notes              text check (notes is null or char_length(notes) <= 20000),
  stage_changed_at   timestamptz not null default now(),
  won_at             timestamptz,
  lost_at            timestamptz,
  last_activity_at   timestamptz,
  created_by         uuid references public.app_users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  archived_at        timestamptz,
  archived_by        uuid references public.app_users (id) on delete set null,
  search_text        text generated always as (
    lower(coalesce(title, '') || ' ' || coalesce(hiring_need, '') || ' ' || coalesce(location, '') || ' ' ||
          coalesce(notes, ''))) stored,
  constraint opportunities_lost_needs_reason
    check (stage <> 'lost' or char_length(trim(coalesce(loss_reason, ''))) > 0)
);

create index opportunities_company_idx on public.opportunities (company_id);
create index opportunities_stage_idx on public.opportunities (stage) where archived_at is null;
create index opportunities_owner_idx on public.opportunities (owner_id) where archived_at is null;
create index opportunities_follow_up_idx on public.opportunities (next_follow_up_on) where archived_at is null;
create index opportunities_search_trgm on public.opportunities using gin (search_text extensions.gin_trgm_ops);
create index opportunities_created_idx on public.opportunities (created_at desc);

create table public.opportunity_contacts (
  opportunity_id  uuid not null references public.opportunities (id) on delete cascade,
  contact_id      uuid not null references public.contacts (id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (opportunity_id, contact_id)
);
create index opportunity_contacts_contact_idx on public.opportunity_contacts (contact_id);

-- -----------------------------------------------------------------------------
-- Requirements (delivery — distinct from the commercial stage)
-- -----------------------------------------------------------------------------
create table public.requirements (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies (id) on delete restrict,
  opportunity_id      uuid references public.opportunities (id) on delete set null,
  role_title          text not null check (char_length(trim(role_title)) between 1 and 200),
  hiring_volume       integer not null default 1 check (hiring_volume between 1 and 100000),
  positions_filled    integer not null default 0 check (positions_filled >= 0),
  location            text check (location is null or char_length(location) <= 200),
  budget_notes        text check (budget_notes is null or char_length(budget_notes) <= 1000),
  owner_id            uuid references public.app_users (id) on delete restrict,
  expected_start_on   date,
  timeline_notes      text check (timeline_notes is null or char_length(timeline_notes) <= 300),
  status              public.requirement_status not null default 'new_requirement',
  status_changed_at   timestamptz not null default now(),
  notes               text check (notes is null or char_length(notes) <= 20000),
  last_activity_at    timestamptz,
  created_by          uuid references public.app_users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  archived_at         timestamptz,
  archived_by         uuid references public.app_users (id) on delete set null,
  search_text         text generated always as (
    lower(coalesce(role_title, '') || ' ' || coalesce(location, '') || ' ' || coalesce(budget_notes, '') || ' ' ||
          coalesce(notes, ''))) stored,
  constraint requirements_filled_within_volume check (positions_filled <= hiring_volume)
);

create index requirements_company_idx on public.requirements (company_id);
create index requirements_status_idx on public.requirements (status) where archived_at is null;
create index requirements_owner_idx on public.requirements (owner_id) where archived_at is null;
create index requirements_search_trgm on public.requirements using gin (search_text extensions.gin_trgm_ops);
create index requirements_created_idx on public.requirements (created_at desc);

create table public.requirement_contacts (
  requirement_id  uuid not null references public.requirements (id) on delete cascade,
  contact_id      uuid not null references public.contacts (id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (requirement_id, contact_id)
);
create index requirement_contacts_contact_idx on public.requirement_contacts (contact_id);

-- -----------------------------------------------------------------------------
-- Activities, follow-ups and tasks
-- -----------------------------------------------------------------------------
create table public.activities (
  id                  uuid primary key default gen_random_uuid(),
  type                public.activity_type not null,
  subject             text not null check (char_length(trim(subject)) between 1 and 300),
  body                text check (body is null or char_length(body) <= 20000),
  occurred_at         timestamptz not null default now(),
  company_id          uuid references public.companies (id) on delete restrict,
  contact_id          uuid references public.contacts (id) on delete restrict,
  opportunity_id      uuid references public.opportunities (id) on delete restrict,
  requirement_id      uuid references public.requirements (id) on delete restrict,
  owner_id            uuid references public.app_users (id) on delete restrict,
  -- Tasks
  due_at              timestamptz,
  completed_at        timestamptz,
  completed_by        uuid references public.app_users (id) on delete set null,
  reminder_at         timestamptz,
  reminder_state      public.reminder_state not null default 'none',
  -- Meetings
  starts_at           timestamptz,
  ends_at             timestamptz,
  meeting_location    text check (meeting_location is null or char_length(meeting_location) <= 300),
  -- Synced items (Gmail / Calendar). Metadata only; never message bodies.
  origin              public.activity_origin not null default 'manual',
  external_owner_id   uuid references public.app_users (id) on delete set null,
  external_id         text,
  external_thread_id  text,
  external_meta       jsonb not null default '{}'::jsonb,
  created_by          uuid references public.app_users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  archived_at         timestamptz,
  archived_by         uuid references public.app_users (id) on delete set null,
  search_text         text generated always as (lower(coalesce(subject, '') || ' ' || coalesce(body, ''))) stored,
  constraint activities_linked
    check (num_nonnulls(company_id, contact_id, opportunity_id, requirement_id) > 0),
  constraint activities_task_fields
    check (type <> 'task' or (due_at is not null and owner_id is not null)),
  constraint activities_meeting_times
    check (ends_at is null or starts_at is null or ends_at >= starts_at),
  constraint activities_external_consistent
    check ((origin in ('manual', 'import')) or (external_id is not null and external_owner_id is not null))
);

create unique index activities_external_unique on public.activities (origin, external_owner_id, external_id)
  where external_id is not null;
create index activities_company_idx on public.activities (company_id, occurred_at desc);
create index activities_contact_idx on public.activities (contact_id, occurred_at desc);
create index activities_opportunity_idx on public.activities (opportunity_id, occurred_at desc);
create index activities_requirement_idx on public.activities (requirement_id, occurred_at desc);
create index activities_occurred_idx on public.activities (occurred_at desc) where archived_at is null;
create index activities_open_tasks_idx on public.activities (owner_id, due_at)
  where type = 'task' and completed_at is null and archived_at is null;
create index activities_thread_idx on public.activities (external_owner_id, external_thread_id)
  where external_thread_id is not null;
create index activities_search_trgm on public.activities using gin (search_text extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Record history (stage, status, owner, MSA, archive changes). Member-readable,
-- written only by triggers. Never updated or deleted by the application.
-- -----------------------------------------------------------------------------
create table public.record_history (
  id           bigint generated always as identity primary key,
  entity_type  text not null check (entity_type in ('company', 'contact', 'opportunity', 'requirement', 'activity')),
  entity_id    uuid not null,
  field        text not null,
  old_value    text,
  new_value    text,
  changed_by   uuid references public.app_users (id) on delete set null,
  changed_at   timestamptz not null default now()
);

create index record_history_entity_idx on public.record_history (entity_type, entity_id, changed_at desc);
create index record_history_field_idx on public.record_history (field, changed_at desc);

-- -----------------------------------------------------------------------------
-- Trigger functions
-- -----------------------------------------------------------------------------

-- Stamp creator / updater and prevent tampering with immutable columns.
create or replace function private.stamp_record()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_me uuid := private.current_app_user_id();
begin
  if tg_op = 'INSERT' then
    if not private.is_trusted_backend() then
      new.created_by := v_me;
    end if;
    new.created_at := now();
    new.updated_at := now();
    if new.archived_at is not null then
      raise exception 'New records cannot be created archived' using errcode = '22023';
    end if;
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.updated_at := now();
    if new.archived_at is distinct from old.archived_at then
      new.archived_by := case when new.archived_at is null then null else v_me end;
    end if;
  end if;
  return new;
end;
$$;

-- Ownership rules (enforced for every client, regardless of UI):
--   * a new owner must be an active team member;
--   * an existing owner can be changed only by that owner or an admin;
--   * anyone can take or assign an unassigned record.
create or replace function private.enforce_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_me uuid := private.current_app_user_id();
begin
  if new.owner_id is not null and not exists (
       select 1 from public.app_users where id = new.owner_id and status = 'active') then
    raise exception 'The owner must be an active team member' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' and new.owner_id is distinct from old.owner_id
     and not private.is_trusted_backend()
     and old.owner_id is not null
     and old.owner_id is distinct from v_me
     and not private.is_admin() then
    raise exception 'Only the current owner or an administrator can reassign this record'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function private.record_change(
  p_entity text, p_id uuid, p_field text, p_old text, p_new text
) returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.record_history (entity_type, entity_id, field, old_value, new_value, changed_by)
  values (p_entity, p_id, p_field, p_old, p_new, private.current_app_user_id())
$$;

create or replace function private.history_companies()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform private.record_change('company', new.id, 'created', null, new.name);
    return new;
  end if;
  if new.owner_id is distinct from old.owner_id then
    perform private.record_change('company', new.id, 'owner_id', old.owner_id::text, new.owner_id::text);
  end if;
  if new.msa_status is distinct from old.msa_status then
    perform private.record_change('company', new.id, 'msa_status', old.msa_status::text, new.msa_status::text);
  end if;
  if new.archived_at is distinct from old.archived_at then
    perform private.record_change('company', new.id, 'archived',
      (old.archived_at is not null)::text, (new.archived_at is not null)::text);
  end if;
  if new.merged_into_id is distinct from old.merged_into_id then
    perform private.record_change('company', new.id, 'merged_into', old.merged_into_id::text, new.merged_into_id::text);
  end if;
  return new;
end $$;

create or replace function private.history_contacts()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform private.record_change('contact', new.id, 'created', null, new.full_name);
    return new;
  end if;
  if new.owner_id is distinct from old.owner_id then
    perform private.record_change('contact', new.id, 'owner_id', old.owner_id::text, new.owner_id::text);
  end if;
  if new.company_id is distinct from old.company_id then
    perform private.record_change('contact', new.id, 'company_id', old.company_id::text, new.company_id::text);
  end if;
  if new.archived_at is distinct from old.archived_at then
    perform private.record_change('contact', new.id, 'archived',
      (old.archived_at is not null)::text, (new.archived_at is not null)::text);
  end if;
  if new.merged_into_id is distinct from old.merged_into_id then
    perform private.record_change('contact', new.id, 'merged_into', old.merged_into_id::text, new.merged_into_id::text);
  end if;
  return new;
end $$;

create or replace function private.history_opportunities()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform private.record_change('opportunity', new.id, 'stage', null, new.stage::text);
    return new;
  end if;
  if new.stage is distinct from old.stage then
    perform private.record_change('opportunity', new.id, 'stage', old.stage::text, new.stage::text);
  end if;
  if new.owner_id is distinct from old.owner_id then
    perform private.record_change('opportunity', new.id, 'owner_id', old.owner_id::text, new.owner_id::text);
  end if;
  if new.loss_reason is distinct from old.loss_reason and new.stage = 'lost' then
    perform private.record_change('opportunity', new.id, 'loss_reason', old.loss_reason, new.loss_reason);
  end if;
  if new.archived_at is distinct from old.archived_at then
    perform private.record_change('opportunity', new.id, 'archived',
      (old.archived_at is not null)::text, (new.archived_at is not null)::text);
  end if;
  return new;
end $$;

create or replace function private.history_requirements()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform private.record_change('requirement', new.id, 'status', null, new.status::text);
    return new;
  end if;
  if new.status is distinct from old.status then
    perform private.record_change('requirement', new.id, 'status', old.status::text, new.status::text);
  end if;
  if new.owner_id is distinct from old.owner_id then
    perform private.record_change('requirement', new.id, 'owner_id', old.owner_id::text, new.owner_id::text);
  end if;
  if new.positions_filled is distinct from old.positions_filled then
    perform private.record_change('requirement', new.id, 'positions_filled',
      old.positions_filled::text, new.positions_filled::text);
  end if;
  if new.archived_at is distinct from old.archived_at then
    perform private.record_change('requirement', new.id, 'archived',
      (old.archived_at is not null)::text, (new.archived_at is not null)::text);
  end if;
  return new;
end $$;

create or replace function private.history_activities()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.owner_id is distinct from old.owner_id and new.type = 'task' then
      perform private.record_change('activity', new.id, 'owner_id', old.owner_id::text, new.owner_id::text);
    end if;
    if (new.completed_at is null) is distinct from (old.completed_at is null) then
      perform private.record_change('activity', new.id, 'completed',
        (old.completed_at is not null)::text, (new.completed_at is not null)::text);
    end if;
    if new.archived_at is distinct from old.archived_at then
      perform private.record_change('activity', new.id, 'archived',
        (old.archived_at is not null)::text, (new.archived_at is not null)::text);
    end if;
  end if;
  return new;
end $$;

-- Opportunity stage bookkeeping.
create or replace function private.opportunity_stage_dates()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.stage is distinct from old.stage then
    new.stage_changed_at := now();
    if new.stage = 'won' then new.won_at := coalesce(new.won_at, now()); end if;
    if new.stage = 'lost' then new.lost_at := now(); end if;
    if new.stage not in ('won') then new.won_at := null; end if;
    if new.stage not in ('lost') then new.lost_at := null; end if;
  end if;
  return new;
end $$;

create or replace function private.requirement_status_dates()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end $$;

-- Normalise company/contact input.
create or replace function private.normalize_company()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.name := trim(new.name);
  new.domain := private.normalize_domain(coalesce(new.domain, new.website));
  if new.msa_status = 'signed' and new.msa_signed_on is null then
    new.msa_signed_on := current_date;
  end if;
  return new;
end $$;

create or replace function private.normalize_contact()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.full_name := regexp_replace(trim(new.full_name), '\s+', ' ', 'g');
  new.email := nullif(lower(trim(coalesce(new.email, ''))), '');
  return new;
end $$;

-- Fill in the company of an activity from its other links, check that links
-- agree, and keep tasks/creators consistent.
create or replace function private.prepare_activity()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_company uuid;
begin
  if new.company_id is null and new.contact_id is not null then
    select company_id into new.company_id from public.contacts where id = new.contact_id;
  end if;
  if new.company_id is null and new.opportunity_id is not null then
    select company_id into new.company_id from public.opportunities where id = new.opportunity_id;
  end if;
  if new.company_id is null and new.requirement_id is not null then
    select company_id into new.company_id from public.requirements where id = new.requirement_id;
  end if;

  if new.opportunity_id is not null then
    select company_id into v_company from public.opportunities where id = new.opportunity_id;
    if v_company is distinct from new.company_id then
      raise exception 'The opportunity belongs to a different company' using errcode = '23514';
    end if;
  end if;
  if new.requirement_id is not null then
    select company_id into v_company from public.requirements where id = new.requirement_id;
    if v_company is distinct from new.company_id then
      raise exception 'The requirement belongs to a different company' using errcode = '23514';
    end if;
  end if;

  if new.type <> 'task' then
    new.due_at := null;
    new.reminder_at := null;
    new.reminder_state := 'none';
    if new.owner_id is null then
      new.owner_id := coalesce(private.current_app_user_id(), new.external_owner_id);
    end if;
  else
    if new.reminder_at is null then
      new.reminder_state := 'none';
    elsif tg_op = 'INSERT' or new.reminder_at is distinct from old.reminder_at then
      new.reminder_state := 'scheduled';
    end if;
    if new.completed_at is not null and (tg_op = 'INSERT' or old.completed_at is null) then
      new.completed_by := private.current_app_user_id();
    elsif new.completed_at is null then
      new.completed_by := null;
    end if;
  end if;
  return new;
end $$;

-- Keep last_activity_at current on linked records (never for open tasks).
create or replace function private.bump_last_activity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_at timestamptz := new.occurred_at;
begin
  if new.archived_at is not null or (new.type = 'task' and new.completed_at is null) then
    return new;
  end if;
  if new.type = 'task' then v_at := new.completed_at; end if;
  if new.company_id is not null then
    update public.companies set last_activity_at = greatest(coalesce(last_activity_at, v_at), v_at)
     where id = new.company_id;
  end if;
  if new.contact_id is not null then
    update public.contacts set last_activity_at = greatest(coalesce(last_activity_at, v_at), v_at)
     where id = new.contact_id;
  end if;
  if new.opportunity_id is not null then
    update public.opportunities set last_activity_at = greatest(coalesce(last_activity_at, v_at), v_at)
     where id = new.opportunity_id;
  end if;
  if new.requirement_id is not null then
    update public.requirements set last_activity_at = greatest(coalesce(last_activity_at, v_at), v_at)
     where id = new.requirement_id;
  end if;
  return new;
end $$;

-- Wire up triggers ------------------------------------------------------------
create trigger companies_10_normalize before insert or update on public.companies
  for each row execute function private.normalize_company();
create trigger companies_20_stamp before insert or update on public.companies
  for each row execute function private.stamp_record();
create trigger companies_30_owner before insert or update of owner_id on public.companies
  for each row execute function private.enforce_ownership();
create trigger companies_history after insert or update on public.companies
  for each row execute function private.history_companies();

create trigger contacts_10_normalize before insert or update on public.contacts
  for each row execute function private.normalize_contact();
create trigger contacts_20_stamp before insert or update on public.contacts
  for each row execute function private.stamp_record();
create trigger contacts_30_owner before insert or update of owner_id on public.contacts
  for each row execute function private.enforce_ownership();
create trigger contacts_history after insert or update on public.contacts
  for each row execute function private.history_contacts();

create trigger opportunities_20_stamp before insert or update on public.opportunities
  for each row execute function private.stamp_record();
create trigger opportunities_30_owner before insert or update of owner_id on public.opportunities
  for each row execute function private.enforce_ownership();
create trigger opportunities_40_stage before insert or update of stage on public.opportunities
  for each row execute function private.opportunity_stage_dates();
create trigger opportunities_history after insert or update on public.opportunities
  for each row execute function private.history_opportunities();

create trigger requirements_20_stamp before insert or update on public.requirements
  for each row execute function private.stamp_record();
create trigger requirements_30_owner before insert or update of owner_id on public.requirements
  for each row execute function private.enforce_ownership();
create trigger requirements_40_status before insert or update of status on public.requirements
  for each row execute function private.requirement_status_dates();
create trigger requirements_history after insert or update on public.requirements
  for each row execute function private.history_requirements();

create trigger activities_10_prepare before insert or update on public.activities
  for each row execute function private.prepare_activity();
create trigger activities_20_stamp before insert or update on public.activities
  for each row execute function private.stamp_record();
create trigger activities_30_owner before insert or update of owner_id on public.activities
  for each row execute function private.enforce_ownership();
create trigger activities_history after update on public.activities
  for each row execute function private.history_activities();
create trigger activities_bump after insert or update of occurred_at, completed_at on public.activities
  for each row execute function private.bump_last_activity();

-- -----------------------------------------------------------------------------
-- Row-level security: every active member can read and update shared records.
-- There are deliberately NO delete policies: records are archived instead.
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['companies', 'contacts', 'opportunities', 'requirements', 'activities'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select private.is_member()))',
                   t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_member()))',
                   t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.is_member())) with check ((select private.is_member()))',
                   t || '_update', t);
    execute format('revoke delete, truncate on public.%I from anon, authenticated', t);
  end loop;

  foreach t in array array['opportunity_contacts', 'requirement_contacts'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select private.is_member()))',
                   t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_member()))',
                   t || '_insert', t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_member()))',
                   t || '_delete', t);
    execute format('revoke update, truncate on public.%I from anon, authenticated', t);
  end loop;
end $$;

alter table public.record_history enable row level security;
create policy record_history_select on public.record_history
  for select to authenticated using ((select private.is_member()));
revoke insert, update, delete, truncate on public.record_history from anon, authenticated;

-- Anonymous visitors never touch CRM data.
revoke all on public.companies, public.contacts, public.opportunities, public.requirements,
              public.activities, public.opportunity_contacts, public.requirement_contacts,
              public.record_history, public.app_users, public.audit_log from anon;
