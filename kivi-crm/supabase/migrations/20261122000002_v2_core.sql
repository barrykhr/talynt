-- =============================================================================
-- KiviTronics CRM — 0006 v2 core
--   * stable identity (Google subject id) for sign-in linking
--   * workspace settings (admin-editable rules)
--   * commercial agreements as the single source of MSA status
--   * opportunity qualification, priority, next action, nurture, value
--   * requirement commercial terms, acceptance, next action
--   * Won gating: MSA signed + live accepted requirement (enforced in SQL)
--   * notifications, rate limiting
-- Creates no business rows. Inserts exactly one row of default *settings*.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Stable identity: link members by Google's immutable subject id, not email.
-- -----------------------------------------------------------------------------
alter table public.app_users add column google_sub text unique;

create or replace function public.claim_membership()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_email    text;
  v_meta     jsonb;
  v_identity jsonb;
  v_sub      text;
  v_hd       text;
  v_verified boolean;
  v_member   public.app_users%rowtype;
  v_name     text;
begin
  if v_uid is null then
    return 'not_authenticated';
  end if;

  select lower(u.email), coalesce(u.raw_user_meta_data, '{}'::jsonb) into v_email, v_meta
    from auth.users u where u.id = v_uid;

  select i.identity_data, coalesce(i.provider_id, i.identity_data ->> 'sub')
    into v_identity, v_sub
    from auth.identities i
   where i.user_id = v_uid and i.provider = 'google'
   order by i.updated_at desc nulls last
   limit 1;

  if v_identity is null or v_sub is null then
    perform private.write_audit('auth.sign_in_denied', 'auth_user', v_uid::text,
      jsonb_build_object('reason', 'not_google_identity'), v_email);
    return 'not_google_identity';
  end if;

  v_hd := lower(coalesce(v_identity -> 'custom_claims' ->> 'hd', v_identity ->> 'hd', v_meta -> 'custom_claims' ->> 'hd'));
  v_verified := coalesce((v_identity ->> 'email_verified')::boolean, false);

  if not v_verified
     or v_hd is distinct from private.allowed_domain()
     or not private.email_in_allowed_domain(v_email)
     or lower(coalesce(v_identity ->> 'email', '')) <> v_email then
    perform private.write_audit('auth.sign_in_denied', 'auth_user', v_uid::text,
      jsonb_build_object('reason', 'domain_not_allowed', 'hd', v_hd, 'email_verified', v_verified), v_email);
    return 'domain_not_allowed';
  end if;

  -- 1) Already linked by the stable Google id (survives an email rename).
  select * into v_member from public.app_users where google_sub = v_sub for update;
  -- 2) First sign-in: match the admin-provisioned email.
  if not found then
    select * into v_member from public.app_users where email = v_email for update;
    if not found then
      perform private.write_audit('auth.sign_in_denied', 'auth_user', v_uid::text,
        jsonb_build_object('reason', 'not_provisioned'), v_email);
      return 'not_provisioned';
    end if;
    if v_member.google_sub is not null and v_member.google_sub <> v_sub then
      perform private.write_audit('auth.sign_in_denied', 'app_user', v_member.id::text,
        jsonb_build_object('reason', 'identity_mismatch'), v_email);
      return 'identity_mismatch';
    end if;
  end if;

  if v_member.status = 'disabled' then
    perform private.write_audit('auth.sign_in_denied', 'app_user', v_member.id::text,
      jsonb_build_object('reason', 'disabled'), v_email);
    return 'disabled';
  end if;

  if v_member.auth_user_id is not null and v_member.auth_user_id <> v_uid and v_member.google_sub is null then
    perform private.write_audit('auth.sign_in_denied', 'app_user', v_member.id::text,
      jsonb_build_object('reason', 'identity_mismatch'), v_email);
    return 'identity_mismatch';
  end if;

  v_name := nullif(trim(coalesce(v_identity ->> 'full_name', v_identity ->> 'name', '')), '');

  update public.app_users
     set auth_user_id = v_uid,
         google_sub = v_sub,
         email = case when private.email_in_allowed_domain(v_email) then v_email else email end,
         status = 'active',
         full_name = coalesce(full_name, left(v_name, 120)),
         last_sign_in_at = now()
   where id = v_member.id;

  insert into public.audit_log (actor_id, actor_email, action, target_type, target_id, details)
  values (v_member.id, v_email,
          case when v_member.status = 'invited' then 'auth.first_sign_in' else 'auth.sign_in' end,
          'app_user', v_member.id::text,
          case when v_member.email <> v_email then jsonb_build_object('email_changed_from', v_member.email) else '{}'::jsonb end);
  return 'ok';
end;
$$;

-- -----------------------------------------------------------------------------
-- Workspace settings: one row. Members read; admins update.
-- -----------------------------------------------------------------------------
create table public.app_settings (
  id                        boolean primary key default true check (id),
  stage_probabilities       jsonb not null default '{"new_lead":5,"researching":10,"ready_to_contact":10,"contacted":15,"in_conversation":25,"qualified":40,"proposal_msa":60,"nurture":5,"won":100,"lost":0}'::jsonb,
  booked_requires_msa       boolean not null default true,
  booked_requires_accepted  boolean not null default true,
  booked_requires_terms     boolean not null default true,
  placement_earned_on       text not null default 'joining' check (placement_earned_on in ('offer_accepted', 'joining')),
  default_currency          char(3) not null default 'INR',
  monitoring_enabled        boolean not null default true,
  monitoring_default_cadence_days integer not null default 7 check (monitoring_default_cadence_days between 1 and 90),
  research_enabled          boolean not null default true,
  updated_at                timestamptz not null default now(),
  updated_by                uuid references public.app_users (id) on delete set null
);
insert into public.app_settings (id) values (true);

alter table public.app_settings enable row level security;
create policy app_settings_select on public.app_settings for select to authenticated using ((select private.is_member()));
create policy app_settings_update on public.app_settings for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
revoke insert, delete, truncate on public.app_settings from anon, authenticated;
revoke all on public.app_settings from anon;

create or replace function private.audit_settings()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := private.current_app_user_id();
  perform private.write_audit('settings.changed', 'app_settings', 'workspace',
    jsonb_build_object('before', to_jsonb(old) - 'updated_at' - 'updated_by', 'after', to_jsonb(new) - 'updated_at' - 'updated_by'));
  return new;
end $$;
create trigger app_settings_audit before update on public.app_settings
  for each row execute function private.audit_settings();

create or replace function private.settings()
returns public.app_settings language sql stable security definer set search_path = '' as $$
  select * from public.app_settings where id
$$;
grant execute on function private.settings() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- History entity types grow with the model.
-- -----------------------------------------------------------------------------
alter table public.record_history drop constraint record_history_entity_type_check;
alter table public.record_history add constraint record_history_entity_type_check check (entity_type in (
  'company', 'contact', 'opportunity', 'requirement', 'activity', 'agreement', 'placement',
  'revenue_event', 'invoice', 'payment', 'credit', 'research_finding', 'signal', 'monitor'));

-- -----------------------------------------------------------------------------
-- Commercial agreements: the ONLY place MSA status is decided.
-- companies.msa_status / msa_signed_on become a trigger-maintained summary.
-- -----------------------------------------------------------------------------
create type public.agreement_kind as enum ('msa', 'sow', 'rate_card', 'nda', 'other');
create type public.agreement_status as enum ('not_started', 'in_discussion', 'signed', 'expired', 'terminated');

create table public.commercial_agreements (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies (id) on delete restrict,
  kind          public.agreement_kind not null default 'msa',
  status        public.agreement_status not null default 'in_discussion',
  title         text check (title is null or char_length(title) <= 200),
  signed_on     date,
  effective_on  date,
  expires_on    date,
  reference     text check (reference is null or char_length(reference) <= 300),
  terms         text check (terms is null or char_length(terms) <= 5000),
  owner_id      uuid references public.app_users (id) on delete restrict,
  created_by    uuid references public.app_users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  archived_at   timestamptz,
  archived_by   uuid references public.app_users (id) on delete set null,
  constraint agreements_signed_has_date check (status <> 'signed' or signed_on is not null),
  constraint agreements_dates check (expires_on is null or effective_on is null or expires_on >= effective_on)
);
create index agreements_company_idx on public.commercial_agreements (company_id, kind) where archived_at is null;

create trigger agreements_20_stamp before insert or update on public.commercial_agreements
  for each row execute function private.stamp_record();
create trigger agreements_30_owner before insert or update of owner_id on public.commercial_agreements
  for each row execute function private.enforce_ownership();

create or replace function private.history_agreements()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform private.record_change('agreement', new.id, 'status', null, new.kind || ':' || new.status);
  else
    if new.status is distinct from old.status then
      perform private.record_change('agreement', new.id, 'status', old.status::text, new.status::text);
    end if;
    if new.terms is distinct from old.terms or new.signed_on is distinct from old.signed_on or new.expires_on is distinct from old.expires_on then
      perform private.record_change('agreement', new.id, 'commercial_terms', null, 'updated');
    end if;
    if new.archived_at is distinct from old.archived_at then
      perform private.record_change('agreement', new.id, 'archived', (old.archived_at is not null)::text, (new.archived_at is not null)::text);
    end if;
  end if;
  return new;
end $$;
create trigger agreements_history after insert or update on public.commercial_agreements
  for each row execute function private.history_agreements();

-- Derive a company's MSA status from its agreements.
create or replace function private.refresh_company_msa(p_company uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_status public.msa_status;
  v_signed date;
begin
  select a.signed_on into v_signed
    from public.commercial_agreements a
   where a.company_id = p_company and a.kind = 'msa' and a.archived_at is null and a.status = 'signed'
     and (a.expires_on is null or a.expires_on >= current_date)
   order by a.signed_on desc limit 1;
  if found then
    v_status := 'signed';
  elsif exists (select 1 from public.commercial_agreements a
                 where a.company_id = p_company and a.kind = 'msa' and a.archived_at is null and a.status = 'in_discussion') then
    v_status := 'in_discussion';
  else
    v_status := 'not_started';
  end if;
  perform set_config('crm.msa_sync', 'on', true);
  update public.companies set msa_status = v_status, msa_signed_on = case when v_status = 'signed' then v_signed end
   where id = p_company and (msa_status is distinct from v_status or msa_signed_on is distinct from case when v_status = 'signed' then v_signed end);
  perform set_config('crm.msa_sync', 'off', true);
end $$;
grant execute on function private.refresh_company_msa(uuid) to authenticated, service_role;

create or replace function private.agreements_sync_msa()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.refresh_company_msa(new.company_id);
  if tg_op = 'UPDATE' and old.company_id <> new.company_id then
    perform private.refresh_company_msa(old.company_id);
  end if;
  return new;
end $$;
create trigger agreements_sync_msa after insert or update on public.commercial_agreements
  for each row execute function private.agreements_sync_msa();

-- Expiry is time-based: the scheduler calls this daily.
create or replace function public.refresh_all_msa_statuses()
returns integer language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  if not (private.is_trusted_backend() or private.is_admin()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  for r in select distinct company_id from public.commercial_agreements loop
    perform private.refresh_company_msa(r.company_id);
    n := n + 1;
  end loop;
  return n;
end $$;

-- companies.msa_status may only change through agreements.
create or replace function private.guard_company_msa()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.msa_status is distinct from old.msa_status or new.msa_signed_on is distinct from old.msa_signed_on)
     and coalesce(current_setting('crm.msa_sync', true), 'off') <> 'on' then
    raise exception 'MSA status is managed through the company''s agreements' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger companies_15_guard_msa before update of msa_status, msa_signed_on on public.companies
  for each row execute function private.guard_company_msa();

create or replace function private.guard_company_msa_insert()
returns trigger language plpgsql set search_path = '' as $$
begin
  if coalesce(current_setting('crm.msa_sync', true), 'off') <> 'on' then
    new.msa_status := 'not_started';
    new.msa_signed_on := null;
  end if;
  return new;
end $$;
create trigger companies_05_guard_msa_insert before insert on public.companies
  for each row execute function private.guard_company_msa_insert();

-- -----------------------------------------------------------------------------
-- Company profile fields that research can update (with history).
-- -----------------------------------------------------------------------------
alter table public.companies
  add column about text check (about is null or char_length(about) <= 5000),
  add column about_updated_at timestamptz,
  add column employee_range text check (employee_range is null or char_length(employee_range) <= 60);

create or replace function private.history_company_profile()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.about is distinct from old.about then
    perform private.record_change('company', new.id, 'about', left(old.about, 2000), left(new.about, 2000));
  end if;
  if new.industry is distinct from old.industry then
    perform private.record_change('company', new.id, 'industry', old.industry, new.industry);
  end if;
  if new.employee_range is distinct from old.employee_range then
    perform private.record_change('company', new.id, 'employee_range', old.employee_range, new.employee_range);
  end if;
  return new;
end $$;
create trigger companies_history_profile after update on public.companies
  for each row execute function private.history_company_profile();

-- company_overview selected c.* when it was created; recreate it so the new
-- company columns are included (views expand * at creation time).
drop view public.company_overview;
create view public.company_overview
with (security_invoker = true) as
select
  c.*,
  coalesce(r.live_requirements, 0)    as live_requirements,
  coalesce(r.total_requirements, 0)   as total_requirements,
  coalesce(o.open_opportunities, 0)   as open_opportunities,
  (c.msa_status = 'signed' and coalesce(r.live_requirements, 0) > 0) as is_active_client,
  case
    when c.msa_status = 'signed' and coalesce(r.live_requirements, 0) > 0 then 'active_client'
    when c.msa_status = 'signed' then 'msa_signed_no_live_requirement'
    else 'prospect'
  end as client_status
from public.companies c
left join lateral (
  select count(*) filter (where private.is_live_requirement(q.status)) as live_requirements, count(*) as total_requirements
    from public.requirements q where q.company_id = c.id and q.archived_at is null
) r on true
left join lateral (
  select count(*) as open_opportunities from public.opportunities p
   where p.company_id = c.id and p.archived_at is null and p.stage not in ('won', 'lost')
) o on true;
grant select on public.company_overview to authenticated;
revoke all on public.company_overview from anon;

-- -----------------------------------------------------------------------------
-- Opportunities: qualification, priority, next action, nurture, value.
-- -----------------------------------------------------------------------------
create type public.priority as enum ('low', 'normal', 'high');

alter table public.opportunities
  add column priority                   public.priority not null default 'normal',
  add column expected_close_on          date,
  add column next_action                text check (next_action is null or char_length(next_action) <= 300),
  add column nurture_reason             text check (nurture_reason is null or char_length(nurture_reason) <= 1000),
  add column revisit_on                 date,
  add column estimated_value            numeric(14,2) check (estimated_value is null or estimated_value >= 0),
  add column currency                   char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  add column probability_override       smallint check (probability_override is null or probability_override between 0 and 100),
  add column decision_maker_contact_id  uuid references public.contacts (id) on delete set null,
  add column hiring_timing              text check (hiring_timing is null or char_length(hiring_timing) <= 300),
  add column fee_basis_note             text check (fee_basis_note is null or char_length(fee_basis_note) <= 300),
  add column next_agreed_step           text check (next_agreed_step is null or char_length(next_agreed_step) <= 300),
  add constraint opportunities_nurture_needs_reason
    check (stage <> 'nurture' or char_length(trim(coalesce(nurture_reason, ''))) > 0);

create index opportunities_no_next_action_idx on public.opportunities (owner_id)
  where archived_at is null and next_follow_up_on is null and stage not in ('won', 'lost');

-- -----------------------------------------------------------------------------
-- Requirements: commercial terms, acceptance, next action, client contact.
-- -----------------------------------------------------------------------------
create type public.fee_basis as enum ('percent_first_year', 'fixed_fee', 'retainer_milestone', 'contract_margin', 'other');

alter table public.requirements
  add column client_contact_id     uuid references public.contacts (id) on delete set null,
  add column client_accepted_at    timestamptz,
  add column fee_basis             public.fee_basis,
  add column fee_percent           numeric(5,2) check (fee_percent is null or fee_percent between 0 and 100),
  add column expected_compensation numeric(14,2) check (expected_compensation is null or expected_compensation >= 0),
  add column fee_per_hire          numeric(14,2) check (fee_per_hire is null or fee_per_hire >= 0),
  add column estimated_total_fee   numeric(14,2) check (estimated_total_fee is null or estimated_total_fee >= 0),
  add column currency              char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  add column commercial_terms      text check (commercial_terms is null or char_length(commercial_terms) <= 5000),
  add column terms_agreed_at       timestamptz,
  add column probability           smallint check (probability is null or probability between 0 and 100),
  add column forecast_placement_on date,
  add column next_action           text check (next_action is null or char_length(next_action) <= 300),
  add column next_action_on        date,
  add column computed_total_fee    numeric(14,2) generated always as (
    coalesce(estimated_total_fee, fee_per_hire * hiring_volume,
             round(fee_percent / 100.0 * expected_compensation * hiring_volume, 2))) stored;

create index requirements_next_action_idx on public.requirements (next_action_on) where archived_at is null;

create or replace function private.history_requirement_commercial()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.client_accepted_at is null) is distinct from (old.client_accepted_at is null) then
    perform private.record_change('requirement', new.id, 'client_accepted', (old.client_accepted_at is not null)::text, (new.client_accepted_at is not null)::text);
  end if;
  if (new.terms_agreed_at is null) is distinct from (old.terms_agreed_at is null) then
    perform private.record_change('requirement', new.id, 'terms_agreed', (old.terms_agreed_at is not null)::text, (new.terms_agreed_at is not null)::text);
  end if;
  if new.computed_total_fee is distinct from old.computed_total_fee or new.fee_basis is distinct from old.fee_basis
     or new.currency is distinct from old.currency then
    perform private.record_change('requirement', new.id, 'commercial_value',
      coalesce(old.currency || ' ' || old.computed_total_fee::text, old.currency), coalesce(new.currency || ' ' || new.computed_total_fee::text, new.currency));
  end if;
  return new;
end $$;
create trigger requirements_history_commercial after update on public.requirements
  for each row execute function private.history_requirement_commercial();

create or replace function private.history_opportunity_value()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.estimated_value is distinct from old.estimated_value or new.currency is distinct from old.currency then
    perform private.record_change('opportunity', new.id, 'estimated_value',
      old.currency || ' ' || coalesce(old.estimated_value::text, '—'), new.currency || ' ' || coalesce(new.estimated_value::text, '—'));
  end if;
  if new.nurture_reason is distinct from old.nurture_reason and new.stage = 'nurture' then
    perform private.record_change('opportunity', new.id, 'nurture_reason', old.nurture_reason, new.nurture_reason);
  end if;
  return new;
end $$;
create trigger opportunities_history_value after update on public.opportunities
  for each row execute function private.history_opportunity_value();

-- -----------------------------------------------------------------------------
-- Won gating: an opportunity may become Won only when its company's MSA is
-- signed AND at least one live, client-accepted requirement is linked to it.
-- -----------------------------------------------------------------------------
create or replace function private.won_conditions(p_opportunity uuid)
returns table (msa_signed boolean, accepted_live_requirements integer)
language sql stable security definer set search_path = '' as $$
  select (c.msa_status = 'signed'),
         (select count(*)::int from public.requirements r
           where r.opportunity_id = o.id and r.archived_at is null
             and r.client_accepted_at is not null and private.is_live_requirement(r.status))
    from public.opportunities o join public.companies c on c.id = o.company_id
   where o.id = p_opportunity
$$;
grant execute on function private.won_conditions(uuid) to authenticated, service_role;

create or replace function public.opportunity_won_conditions(p_opportunity uuid)
returns table (msa_signed boolean, accepted_live_requirements integer)
language sql stable security invoker set search_path = '' as $$
  select * from private.won_conditions(p_opportunity)
   where exists (select 1 from public.opportunities where id = p_opportunity)
$$;
grant execute on function public.opportunity_won_conditions(uuid) to authenticated;

create or replace function private.enforce_won()
returns trigger language plpgsql set search_path = '' as $$
declare
  v record;
begin
  if new.stage = 'won' and (tg_op = 'INSERT' or old.stage is distinct from 'won') then
    if tg_op = 'INSERT' then
      raise exception 'Create the opportunity first; it can be marked Won once the MSA is signed and a requirement is accepted' using errcode = '23514';
    end if;
    select * into v from private.won_conditions(new.id);
    if not coalesce(v.msa_signed, false) then
      raise exception 'Cannot mark Won: the company''s MSA is not signed' using errcode = '23514';
    end if;
    if coalesce(v.accepted_live_requirements, 0) = 0 then
      raise exception 'Cannot mark Won: link at least one live requirement the client has accepted' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
create trigger opportunities_45_won before insert or update of stage on public.opportunities
  for each row execute function private.enforce_won();

-- -----------------------------------------------------------------------------
-- Merge must carry agreements across and may set MSA through the sync path.
-- -----------------------------------------------------------------------------
create or replace function public.merge_companies(p_keep uuid, p_merge uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  k public.companies%rowtype;
  m public.companies%rowtype;
begin
  if not private.is_member() then
    raise exception 'Not a CRM member' using errcode = '42501';
  end if;
  if p_keep = p_merge then
    raise exception 'Choose two different companies' using errcode = '22023';
  end if;
  select * into k from public.companies where id = p_keep and archived_at is null for update;
  if not found then raise exception 'Company to keep not found' using errcode = 'P0002'; end if;
  select * into m from public.companies where id = p_merge and archived_at is null for update;
  if not found then raise exception 'Company to merge not found' using errcode = 'P0002'; end if;

  update public.contacts      set company_id = p_keep where company_id = p_merge;
  update public.opportunities set company_id = p_keep where company_id = p_merge;
  update public.requirements  set company_id = p_keep where company_id = p_merge;
  update public.activities    set company_id = p_keep where company_id = p_merge;
  update public.commercial_agreements set company_id = p_keep where company_id = p_merge;
  update public.sync_review_items set suggested_company_id = p_keep where suggested_company_id = p_merge;

  update public.companies
     set archived_at = now(), merged_into_id = p_keep, domain = null, website = coalesce(website, m.domain)
   where id = p_merge;

  update public.companies set
    domain        = coalesce(k.domain, m.domain),
    website       = coalesce(k.website, m.website),
    industry      = coalesce(k.industry, m.industry),
    location      = coalesce(k.location, m.location),
    source        = coalesce(k.source, m.source),
    source_detail = coalesce(k.source_detail, m.source_detail),
    owner_id      = coalesce(k.owner_id, m.owner_id),
    about         = coalesce(k.about, m.about),
    notes         = nullif(concat_ws(E'\n\n', k.notes,
                      case when m.notes is not null then '— Merged from ' || m.name || E':\n' || m.notes end), ''),
    last_activity_at = greatest(k.last_activity_at, m.last_activity_at)
  where id = p_keep;

  perform private.refresh_company_msa(p_keep);
  perform private.refresh_company_msa(p_merge);
  perform private.write_audit('record.merged', 'company', p_keep::text,
    jsonb_build_object('merged_id', p_merge, 'merged_name', m.name));
end;
$$;

-- -----------------------------------------------------------------------------
-- In-app notifications (no external messages are ever sent from here).
-- -----------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.app_users (id) on delete cascade,
  kind        text not null check (kind ~ '^[a-z_]{3,40}$'),
  title       text not null check (char_length(title) <= 300),
  body        text check (body is null or char_length(body) <= 2000),
  link        text check (link is null or link ~ '^/[^/\\]'),
  company_id  uuid references public.companies (id) on delete cascade,
  dedupe_key  text,
  created_at  timestamptz not null default now(),
  read_at     timestamptz,
  unique (user_id, dedupe_key)
);
create index notifications_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
alter table public.notifications enable row level security;
create policy notifications_own_select on public.notifications for select to authenticated
  using (user_id = (select private.current_app_user_id()));
create policy notifications_own_update on public.notifications for update to authenticated
  using (user_id = (select private.current_app_user_id())) with check (user_id = (select private.current_app_user_id()));
revoke insert, delete, truncate on public.notifications from anon, authenticated;
revoke all on public.notifications from anon;

create or replace function private.notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text, p_company uuid, p_dedupe text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, kind, title, body, link, company_id, dedupe_key)
  select p_user, p_kind, left(p_title, 300), left(p_body, 2000), p_link, p_company, p_dedupe
   where p_user is not null
  on conflict (user_id, dedupe_key) do nothing
$$;

-- -----------------------------------------------------------------------------
-- Rate limiting (fixed window), usable by server code for auth callbacks,
-- research, monitoring refresh and the public capture endpoint.
-- -----------------------------------------------------------------------------
create table public.rate_limits (
  bucket        text not null,
  window_start  timestamptz not null,
  hits          integer not null default 0,
  primary key (bucket, window_start)
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create or replace function private.rate_limit_hit(p_bucket text, p_max integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits int;
begin
  insert into public.rate_limits (bucket, window_start, hits) values (p_bucket, v_start, 1)
  on conflict (bucket, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;
  delete from public.rate_limits where window_start < now() - interval '2 days';
  return v_hits <= p_max;
end $$;

-- For signed-in members: buckets are always scoped to the caller.
create or replace function public.consume_rate_limit(p_action text, p_max integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_member() then
    raise exception 'Not a CRM member' using errcode = '42501';
  end if;
  if p_action !~ '^[a-z_.]{3,40}$' or p_max < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit' using errcode = '22023';
  end if;
  return private.rate_limit_hit(p_action || ':' || private.current_app_user_id()::text, p_max, p_window_seconds);
end $$;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.consume_rate_limit(text, integer, integer) to authenticated;

create or replace function public.consume_public_rate_limit(p_bucket text, p_max integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_trusted_backend() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return private.rate_limit_hit('public:' || left(p_bucket, 120), p_max, p_window_seconds);
end $$;
revoke all on function public.consume_public_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_public_rate_limit(text, integer, integer) to service_role;

-- -----------------------------------------------------------------------------
-- Per-user sync preferences (privacy controls for Gmail / Calendar).
-- -----------------------------------------------------------------------------
create table public.sync_preferences (
  user_id              uuid primary key references public.app_users (id) on delete cascade,
  gmail_sync_enabled   boolean not null default true,
  gmail_mode           text not null default 'contacts_and_review' check (gmail_mode in ('contacts_only', 'contacts_and_review')),
  history_window_days  integer not null default 30 check (history_window_days in (7, 30, 90)),
  calendar_sync_enabled boolean not null default true,
  updated_at           timestamptz not null default now()
);
alter table public.sync_preferences enable row level security;
create policy sync_prefs_own_select on public.sync_preferences for select to authenticated
  using (user_id = (select private.current_app_user_id()));
create policy sync_prefs_own_insert on public.sync_preferences for insert to authenticated
  with check (user_id = (select private.current_app_user_id()));
create policy sync_prefs_own_update on public.sync_preferences for update to authenticated
  using (user_id = (select private.current_app_user_id())) with check (user_id = (select private.current_app_user_id()));
revoke delete, truncate on public.sync_preferences from anon, authenticated;
revoke all on public.sync_preferences from anon;

-- RLS for agreements: shared like other business records, no deletes.
alter table public.commercial_agreements enable row level security;
create policy agreements_select on public.commercial_agreements for select to authenticated using ((select private.is_member()));
create policy agreements_insert on public.commercial_agreements for insert to authenticated with check ((select private.is_member()));
create policy agreements_update on public.commercial_agreements for update to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));
revoke delete, truncate on public.commercial_agreements from anon, authenticated;
revoke all on public.commercial_agreements from anon;

-- -----------------------------------------------------------------------------
-- Hardening: decide "trusted backend" from the request, not current_user
-- (inside SECURITY DEFINER functions current_user is the function owner).
-- Trusted = the service-role JWT via the API, or a direct database session
-- with no JWT at all (migrations, operator scripts). Anonymous and
-- authenticated API requests are never trusted.
-- -----------------------------------------------------------------------------
create or replace function private.is_trusted_backend()
returns boolean
language sql
stable
set search_path = ''
as $$
  select auth.uid() is null
     and (
       coalesce(auth.role(), '') = 'service_role'
       or (nullif(current_setting('request.jwt.claims', true), '') is null
           and session_user not in ('authenticator', 'anon', 'authenticated'))
     )
$$;
