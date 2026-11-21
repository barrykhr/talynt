-- =============================================================================
-- KiviTronics CRM — 0008 company research, outreach drafts, monitoring
--
-- Principles enforced here:
--   * every finding keeps its source URL, title, publication date (if known),
--     retrieval date, an evidence excerpt and an evidence kind
--     (verified fact / source-reported claim / inference) and confidence;
--   * snapshots and findings are immutable — only review fields change;
--   * jobs and monitor runs are idempotent (unique keys) and retryable;
--   * signals are de-duplicated by fingerprint and never deleted on dismiss.
-- =============================================================================

create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');
create type public.finding_category as enum ('about', 'profile', 'announcement', 'funding', 'hiring', 'expansion', 'leadership', 'market', 'other');
create type public.evidence_kind as enum ('verified_fact', 'reported_claim', 'inference');
create type public.confidence as enum ('high', 'medium', 'low');
create type public.review_state as enum ('pending', 'accepted', 'dismissed', 'corrected');
create type public.signal_type as enum ('hiring', 'job_volume_change', 'announcement', 'funding', 'expansion', 'leadership', 'other');
create type public.signal_review as enum ('new', 'accepted', 'dismissed');

-- -----------------------------------------------------------------------------
-- Research jobs
-- -----------------------------------------------------------------------------
create table public.research_jobs (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies (id) on delete restrict,
  opportunity_id   uuid references public.opportunities (id) on delete set null,
  requested_by     uuid references public.app_users (id) on delete set null,
  provider         text not null check (provider ~ '^[a-z0-9_-]{2,40}$'),
  input            jsonb not null,           -- exactly what was sent to the provider
  idempotency_key  text not null unique,
  status           public.job_status not null default 'queued',
  attempts         integer not null default 0,
  max_attempts     integer not null default 3 check (max_attempts between 1 and 5),
  next_attempt_at  timestamptz not null default now(),
  started_at       timestamptz,
  finished_at      timestamptz,
  error            text check (error is null or char_length(error) <= 500),
  snapshot_id      uuid,
  created_at       timestamptz not null default now()
);
create index research_jobs_company_idx on public.research_jobs (company_id, created_at desc);
create index research_jobs_due_idx on public.research_jobs (next_attempt_at) where status in ('queued', 'failed');

create table public.research_snapshots (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null unique references public.research_jobs (id) on delete restrict,
  company_id      uuid not null references public.companies (id) on delete restrict,
  opportunity_id  uuid references public.opportunities (id) on delete set null,
  provider        text not null,
  model           text,
  checked_at      timestamptz not null default now(),
  about_brief     text check (about_brief is null or char_length(about_brief) <= 4000),
  outreach_angle  text check (outreach_angle is null or char_length(outreach_angle) <= 2000),
  draft_message   text check (draft_message is null or char_length(draft_message) <= 6000),
  warnings        text[] not null default '{}',
  sources_retrieved integer not null default 0,
  created_by      uuid references public.app_users (id) on delete set null
);
create index research_snapshots_company_idx on public.research_snapshots (company_id, checked_at desc);
alter table public.research_jobs add constraint research_jobs_snapshot_fk foreign key (snapshot_id) references public.research_snapshots (id);

create table public.research_findings (
  id                   uuid primary key default gen_random_uuid(),
  snapshot_id          uuid not null references public.research_snapshots (id) on delete restrict,
  company_id           uuid not null references public.companies (id) on delete restrict,
  position             integer not null,
  category             public.finding_category not null,
  statement            text not null check (char_length(statement) between 1 and 1000),
  evidence_kind        public.evidence_kind not null,
  confidence           public.confidence not null,
  source_url           text check (source_url is null or (source_url ~ '^https?://' and char_length(source_url) <= 1000)),
  source_title         text check (source_title is null or char_length(source_title) <= 300),
  published_on         date,
  retrieved_at         timestamptz not null,
  excerpt              text check (excerpt is null or char_length(excerpt) <= 1000),
  source_verified      boolean not null default false,   -- cited URL was actually retrieved by the provider
  conflict_note        text check (conflict_note is null or char_length(conflict_note) <= 500),
  review_state         public.review_state not null default 'pending',
  corrected_statement  text check (corrected_statement is null or char_length(corrected_statement) <= 1000),
  reviewed_by          uuid references public.app_users (id) on delete set null,
  reviewed_at          timestamptz,
  applied_to_field     text check (applied_to_field is null or applied_to_field in ('about', 'industry', 'employee_range')),
  unique (snapshot_id, position),
  constraint findings_facts_need_sources check (evidence_kind = 'inference' or (source_url is not null and excerpt is not null)),
  constraint findings_corrected_text check (review_state <> 'corrected' or corrected_statement is not null)
);
create index research_findings_company_idx on public.research_findings (company_id, review_state);

-- Immutability: snapshots never change; findings change only review fields.
create or replace function private.immutable_row()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception '% records are immutable', tg_table_name using errcode = '22023';
end $$;
create trigger research_snapshots_immutable before update on public.research_snapshots
  for each row execute function private.immutable_row();

create or replace function private.guard_finding_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (to_jsonb(new) - array['review_state', 'corrected_statement', 'reviewed_by', 'reviewed_at', 'applied_to_field'])
     is distinct from (to_jsonb(old) - array['review_state', 'corrected_statement', 'reviewed_by', 'reviewed_at', 'applied_to_field']) then
    raise exception 'Research findings are immutable; only their review can change' using errcode = '22023';
  end if;
  if new.review_state is distinct from old.review_state or new.corrected_statement is distinct from old.corrected_statement then
    new.reviewed_by := private.current_app_user_id();
    new.reviewed_at := now();
    perform private.record_change('research_finding', new.id, 'review_state', old.review_state::text, new.review_state::text);
    perform private.write_audit('research.finding_reviewed', 'research_finding', new.id::text,
      jsonb_build_object('company_id', new.company_id, 'from', old.review_state, 'to', new.review_state));
  end if;
  return new;
end $$;
create trigger research_findings_review before update on public.research_findings
  for each row execute function private.guard_finding_review();

-- Accept / dismiss / correct a finding. Accepting may update a company field;
-- the previous value is preserved by the company history trigger.
create or replace function public.review_research_finding(
  p_finding uuid, p_state public.review_state, p_corrected text default null, p_apply_to text default null
) returns void language plpgsql security invoker set search_path = '' as $$
declare f public.research_findings%rowtype; v_text text;
begin
  if p_state = 'pending' then
    raise exception 'Choose accept, dismiss or correct' using errcode = '22023';
  end if;
  select * into f from public.research_findings where id = p_finding for update;
  if not found then raise exception 'Finding not found' using errcode = 'P0002'; end if;
  if p_apply_to is not null and p_apply_to not in ('about', 'industry', 'employee_range') then
    raise exception 'Unsupported company field' using errcode = '22023';
  end if;
  update public.research_findings
     set review_state = p_state,
         corrected_statement = case when p_state = 'corrected' then nullif(trim(p_corrected), '') else corrected_statement end,
         applied_to_field = case when p_state in ('accepted', 'corrected') then p_apply_to end
   where id = p_finding;
  if p_state in ('accepted', 'corrected') and p_apply_to is not null then
    v_text := case when p_state = 'corrected' then trim(p_corrected) else f.statement end;
    if p_apply_to = 'about' then
      update public.companies set about = left(v_text, 5000), about_updated_at = now() where id = f.company_id;
    elsif p_apply_to = 'industry' then
      update public.companies set industry = left(v_text, 120) where id = f.company_id;
    else
      update public.companies set employee_range = left(v_text, 60) where id = f.company_id;
    end if;
  end if;
end $$;
revoke all on function public.review_research_finding(uuid, public.review_state, text, text) from public, anon;
grant execute on function public.review_research_finding(uuid, public.review_state, text, text) to authenticated;

-- Store a provider result atomically and idempotently (retries never create a
-- second snapshot). Validation of the payload happens in the app (zod) AND
-- here (constraints). Only the trusted backend may store results.
create or replace function public.store_research_result(p_job uuid, p_result jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  j public.research_jobs%rowtype;
  v_snapshot uuid;
  f jsonb;
  i int := 0;
begin
  if not private.is_trusted_backend() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  select * into j from public.research_jobs where id = p_job for update;
  if not found then raise exception 'Job not found' using errcode = 'P0002'; end if;
  if j.snapshot_id is not null then
    return j.snapshot_id;   -- idempotent: already stored
  end if;

  insert into public.research_snapshots (job_id, company_id, opportunity_id, provider, model, checked_at,
                                         about_brief, outreach_angle, draft_message, warnings, sources_retrieved, created_by)
  values (j.id, j.company_id, j.opportunity_id, j.provider, p_result ->> 'model',
          coalesce((p_result ->> 'checked_at')::timestamptz, now()),
          left(p_result ->> 'about_brief', 4000), left(p_result ->> 'outreach_angle', 2000), left(p_result ->> 'draft_message', 6000),
          coalesce((select array_agg(left(w, 300)) from jsonb_array_elements_text(coalesce(p_result -> 'warnings', '[]')) w), '{}'),
          coalesce((p_result ->> 'sources_retrieved')::int, 0), j.requested_by)
  returning id into v_snapshot;

  for f in select * from jsonb_array_elements(coalesce(p_result -> 'findings', '[]')) loop
    i := i + 1;
    insert into public.research_findings (snapshot_id, company_id, position, category, statement, evidence_kind, confidence,
                                          source_url, source_title, published_on, retrieved_at, excerpt, source_verified, conflict_note)
    values (v_snapshot, j.company_id, i, (f ->> 'category')::public.finding_category, f ->> 'statement',
            (f ->> 'evidence_kind')::public.evidence_kind, (f ->> 'confidence')::public.confidence,
            f ->> 'source_url', left(f ->> 'source_title', 300), (f ->> 'published_on')::date,
            coalesce((f ->> 'retrieved_at')::timestamptz, now()), left(f ->> 'excerpt', 1000),
            coalesce((f ->> 'source_verified')::boolean, false), left(f ->> 'conflict_note', 500));
  end loop;

  update public.research_jobs set status = 'succeeded', snapshot_id = v_snapshot, finished_at = now(), error = null where id = j.id;
  insert into public.activities (type, subject, body, company_id, opportunity_id, owner_id, created_by, origin)
  values ('research_update', 'Company research completed',
          i || ' finding(s) to review from ' || j.provider || '. Nothing was sent to anyone.',
          j.company_id, j.opportunity_id, j.requested_by, j.requested_by, 'manual');
  return v_snapshot;
end $$;
revoke all on function public.store_research_result(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.store_research_result(uuid, jsonb) to service_role;

-- Claim the next attempt for a job (used by the runner and retries).
create or replace function public.claim_research_job(p_job uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not private.is_trusted_backend() then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.research_jobs
     set status = 'running', attempts = attempts + 1, started_at = now(), error = null
   where id = p_job and snapshot_id is null
     and (status = 'queued' or (status = 'failed' and attempts < max_attempts and next_attempt_at <= now())
          or (status = 'running' and started_at < now() - interval '15 minutes'));
  get diagnostics n = row_count;
  return n = 1;
end $$;

create or replace function public.fail_research_job(p_job uuid, p_error text, p_retryable boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_trusted_backend() then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.research_jobs
     set status = 'failed', finished_at = now(), error = left(p_error, 500),
         max_attempts = case when p_retryable then max_attempts else attempts end,
         next_attempt_at = now() + make_interval(mins => (5 * power(3, greatest(attempts - 1, 0)))::int)
   where id = p_job and snapshot_id is null;
end $$;
revoke all on function public.claim_research_job(uuid) from public, anon, authenticated;
revoke all on function public.fail_research_job(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.claim_research_job(uuid) to service_role;
grant execute on function public.fail_research_job(uuid, text, boolean) to service_role;

-- -----------------------------------------------------------------------------
-- Outreach drafts: reviewed and edited by a person; never sent automatically.
-- -----------------------------------------------------------------------------
create table public.outreach_drafts (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies (id) on delete restrict,
  opportunity_id      uuid references public.opportunities (id) on delete set null,
  contact_id          uuid references public.contacts (id) on delete set null,
  snapshot_id         uuid references public.research_snapshots (id) on delete set null,
  channel             text not null check (channel in ('email', 'whatsapp')),
  level               text not null default 'company' check (level in ('market', 'company', 'person')),
  subject             text check (subject is null or char_length(subject) <= 250),
  body                text not null check (char_length(body) between 1 and 6000),
  used_finding_ids    uuid[] not null default '{}',
  used_activity_ids   uuid[] not null default '{}',
  status              text not null default 'draft' check (status in ('draft', 'sent_email', 'copied_whatsapp', 'discarded')),
  sent_activity_id    uuid references public.activities (id) on delete set null,
  created_by          uuid references public.app_users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index outreach_drafts_company_idx on public.outreach_drafts (company_id, created_at desc);
create trigger outreach_drafts_20_stamp before insert or update on public.outreach_drafts
  for each row execute function private.stamp_simple();

-- -----------------------------------------------------------------------------
-- Monitoring
-- -----------------------------------------------------------------------------
create table public.company_monitors (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null unique references public.companies (id) on delete restrict,
  enabled               boolean not null default true,
  signal_types          public.signal_type[] not null default '{hiring,job_volume_change,announcement,funding,expansion}',
  cadence_days          integer not null default 7 check (cadence_days between 1 and 90),
  sources               jsonb not null default '{}'::jsonb,   -- {greenhouse_board, lever_company, rss_urls[]}
  next_run_at           timestamptz not null default now(),
  last_run_at           timestamptz,
  last_success_at       timestamptz,
  status                text not null default 'idle' check (status in ('idle', 'ok', 'partial', 'error', 'no_sources')),
  consecutive_failures  integer not null default 0,
  last_error            text check (last_error is null or char_length(last_error) <= 500),
  created_by            uuid references public.app_users (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index company_monitors_due_idx on public.company_monitors (next_run_at) where enabled;
create trigger company_monitors_20_stamp before insert or update on public.company_monitors
  for each row execute function private.stamp_simple();

create table public.monitor_runs (
  id               uuid primary key default gen_random_uuid(),
  monitor_id       uuid not null references public.company_monitors (id) on delete cascade,
  company_id       uuid not null references public.companies (id) on delete restrict,
  idempotency_key  text not null unique,
  trigger          text not null check (trigger in ('schedule', 'manual')),
  status           public.job_status not null default 'running',
  attempts         integer not null default 1,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz,
  results          jsonb not null default '{}'::jsonb,
  new_signals      integer not null default 0,
  error            text check (error is null or char_length(error) <= 500)
);
create index monitor_runs_monitor_idx on public.monitor_runs (monitor_id, started_at desc);

-- What each provider last reported (the "prior snapshot" used for diffing).
create table public.monitor_observations (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies (id) on delete restrict,
  provider       text not null,
  external_id    text not null,
  title          text,
  url            text,
  location       text,
  published_at   timestamptz,
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  present        boolean not null default true,
  unique (company_id, provider, external_id)
);

create table public.company_signals (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies (id) on delete restrict,
  signal_type      public.signal_type not null,
  summary          text not null check (char_length(summary) between 1 and 1000),
  source_url       text check (source_url is null or source_url ~ '^https?://'),
  source_title     text,
  provider         text not null,
  published_at     timestamptz,
  first_seen_at    timestamptz not null default now(),
  last_checked_at  timestamptz not null default now(),
  confidence       public.confidence not null,
  fingerprint      text not null,
  details          jsonb not null default '{}'::jsonb,
  review_state     public.signal_review not null default 'new',
  reviewed_by      uuid references public.app_users (id) on delete set null,
  reviewed_at      timestamptz,
  task_id          uuid references public.activities (id) on delete set null,
  run_id           uuid references public.monitor_runs (id) on delete set null,
  created_by       uuid references public.app_users (id) on delete set null,
  unique (company_id, fingerprint)
);
create index company_signals_review_idx on public.company_signals (review_state, first_seen_at desc);
create index company_signals_company_idx on public.company_signals (company_id, first_seen_at desc);

create or replace function private.guard_signal()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (to_jsonb(new) - array['review_state', 'reviewed_by', 'reviewed_at', 'task_id', 'last_checked_at'])
     is distinct from (to_jsonb(old) - array['review_state', 'reviewed_by', 'reviewed_at', 'task_id', 'last_checked_at']) then
    raise exception 'Signals keep their original evidence; only review fields can change' using errcode = '22023';
  end if;
  if new.review_state is distinct from old.review_state then
    new.reviewed_by := private.current_app_user_id();
    new.reviewed_at := now();
    perform private.record_change('signal', new.id, 'review_state', old.review_state::text, new.review_state::text);
  end if;
  return new;
end $$;
create trigger company_signals_guard before update on public.company_signals
  for each row execute function private.guard_signal();

create or replace function private.stamp_signal_creator()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not private.is_trusted_backend() then new.created_by := private.current_app_user_id(); end if;
  new.first_seen_at := now();
  new.last_checked_at := now();
  new.review_state := 'new';
  return new;
end $$;
create trigger company_signals_stamp before insert on public.company_signals
  for each row execute function private.stamp_signal_creator();

-- Start a monitor run idempotently. Returns the run id, or NULL when this
-- window's run already exists (retries/concurrent schedulers do nothing).
create or replace function public.start_monitor_run(p_monitor uuid, p_trigger text, p_key text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare m public.company_monitors%rowtype; v_run uuid; v_existing public.monitor_runs%rowtype;
begin
  if not private.is_trusted_backend() then raise exception 'Not allowed' using errcode = '42501'; end if;
  select * into m from public.company_monitors where id = p_monitor for update;
  if not found then raise exception 'Monitor not found' using errcode = 'P0002'; end if;
  select * into v_existing from public.monitor_runs where idempotency_key = p_key;
  if found then
    if v_existing.status = 'failed' then
      update public.monitor_runs set status = 'running', attempts = attempts + 1, started_at = now(), error = null
       where id = v_existing.id;
      return v_existing.id;
    end if;
    return null;
  end if;
  insert into public.monitor_runs (monitor_id, company_id, idempotency_key, trigger)
  values (m.id, m.company_id, p_key, p_trigger) returning id into v_run;
  return v_run;
end $$;

-- Record provider observations for a run, diff them against what was seen
-- before and create de-duplicated signals. Idempotent per (company, fingerprint).
--   p_observations: [{provider, external_id, title, url, location, published_at}]
--   p_providers:    {provider: {ok: bool, error?: text, complete: bool}}
--   p_signals:      extra signals (e.g. feed items) [{signal_type, summary, source_url,
--                   source_title, provider, published_at, confidence, fingerprint, details}]
create or replace function public.finish_monitor_run(p_run uuid, p_observations jsonb, p_providers jsonb, p_signals jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  r public.monitor_runs%rowtype;
  m public.company_monitors%rowtype;
  o jsonb; s jsonb; prov text; pinfo jsonb;
  v_new int := 0; v_ids text[]; v_titles text[]; v_prev int; v_now int; v_first boolean;
  v_ok int := 0; v_fail int := 0; v_owner uuid; v_company_name text; v_inserted boolean;
begin
  if not private.is_trusted_backend() then raise exception 'Not allowed' using errcode = '42501'; end if;
  select * into r from public.monitor_runs where id = p_run for update;
  if r.status = 'succeeded' then return r.new_signals; end if;
  select * into m from public.company_monitors where id = r.monitor_id for update;
  select owner_id, name into v_owner, v_company_name from public.companies where id = m.company_id;

  for prov, pinfo in select * from jsonb_each(coalesce(p_providers, '{}')) loop
    if coalesce((pinfo ->> 'ok')::boolean, false) then v_ok := v_ok + 1; else v_fail := v_fail + 1; continue; end if;

    -- Job postings: compare with the previous observation set for this provider.
    select count(*) into v_prev from public.monitor_observations
     where company_id = m.company_id and provider = prov and present;
    v_first := not exists (select 1 from public.monitor_observations where company_id = m.company_id and provider = prov);

    v_ids := '{}'; v_titles := '{}';
    for o in select * from jsonb_array_elements(coalesce(p_observations, '[]')) x where x ->> 'provider' = prov loop
      insert into public.monitor_observations (company_id, provider, external_id, title, url, location, published_at)
      values (m.company_id, prov, o ->> 'external_id', left(o ->> 'title', 300), o ->> 'url', left(o ->> 'location', 200),
              (o ->> 'published_at')::timestamptz)
      on conflict (company_id, provider, external_id) do update
        set last_seen_at = now(), present = true, title = excluded.title, url = excluded.url
      returning (xmax = 0) into v_inserted;
      if v_inserted then
        v_ids := v_ids || (o ->> 'external_id');
        v_titles := v_titles || left(o ->> 'title', 120);
      end if;
    end loop;

    -- Only mark postings as gone when the provider says the listing is complete.
    if coalesce((pinfo ->> 'complete')::boolean, false) then
      update public.monitor_observations set present = false
       where company_id = m.company_id and provider = prov and present and last_seen_at < r.started_at;
    end if;
    select count(*) into v_now from public.monitor_observations where company_id = m.company_id and provider = prov and present;

    -- The first observation establishes a baseline; it is not "new hiring".
    if not v_first and array_length(v_ids, 1) > 0 and 'hiring' = any (m.signal_types) then
      insert into public.company_signals (company_id, signal_type, summary, source_url, source_title, provider, confidence,
                                          fingerprint, details, run_id)
      values (m.company_id, 'hiring',
              array_length(v_ids, 1) || ' new public job posting(s): ' || array_to_string(v_titles[1:5], '; ')
                || case when array_length(v_ids, 1) > 5 then '…' else '' end
                || '. New postings indicate hiring activity, not completed hires.',
              coalesce((select x ->> 'url' from jsonb_array_elements(p_observations) x
                         where x ->> 'provider' = prov and x ->> 'external_id' = v_ids[1]), null),
              prov || ' job board', prov, 'high',
              prov || ':new:' || md5(array_to_string((select array_agg(e order by e) from unnest(v_ids) e), ',')),
              jsonb_build_object('new_posting_ids', to_jsonb(v_ids), 'previous_open', v_prev, 'now_open', v_now), r.id)
      on conflict (company_id, fingerprint) do update set last_checked_at = now()
      returning (xmax = 0) into v_inserted;
      if v_inserted then v_new := v_new + 1; end if;
    end if;

    if not v_first and 'job_volume_change' = any (m.signal_types) and v_prev >= 3
       and abs(v_now - v_prev) >= greatest(3, ceil(v_prev * 0.25)) then
      insert into public.company_signals (company_id, signal_type, summary, provider, confidence, fingerprint, details, run_id, source_title)
      values (m.company_id, 'job_volume_change',
              'Open public job postings changed from ' || v_prev || ' to ' || v_now || ' on ' || prov || '.',
              prov, 'medium', prov || ':volume:' || v_prev || '->' || v_now || ':' || to_char(now(), 'IYYY-IW'),
              jsonb_build_object('previous_open', v_prev, 'now_open', v_now), r.id, prov || ' job board')
      on conflict (company_id, fingerprint) do update set last_checked_at = now()
      returning (xmax = 0) into v_inserted;
      if v_inserted then v_new := v_new + 1; end if;
    end if;
  end loop;

  for s in select * from jsonb_array_elements(coalesce(p_signals, '[]')) loop
    continue when not ((s ->> 'signal_type')::public.signal_type = any (m.signal_types));
    insert into public.company_signals (company_id, signal_type, summary, source_url, source_title, provider, published_at,
                                        confidence, fingerprint, details, run_id)
    values (m.company_id, (s ->> 'signal_type')::public.signal_type, left(s ->> 'summary', 1000), s ->> 'source_url',
            left(s ->> 'source_title', 300), s ->> 'provider', (s ->> 'published_at')::timestamptz,
            (s ->> 'confidence')::public.confidence, s ->> 'fingerprint', coalesce(s -> 'details', '{}'), r.id)
    on conflict (company_id, fingerprint) do update set last_checked_at = now()
    returning (xmax = 0) into v_inserted;
    if v_inserted then v_new := v_new + 1; end if;
  end loop;

  update public.monitor_runs
     set status = case when v_ok = 0 and v_fail > 0 then 'failed'::public.job_status else 'succeeded'::public.job_status end,
         finished_at = now(), results = coalesce(p_providers, '{}'), new_signals = v_new,
         error = case when v_fail > 0 then v_fail || ' source(s) failed' end
   where id = r.id;

  update public.company_monitors
     set last_run_at = now(),
         last_success_at = case when v_ok > 0 then now() else last_success_at end,
         status = case when v_ok = 0 and v_fail = 0 then 'no_sources' when v_fail = 0 then 'ok' when v_ok > 0 then 'partial' else 'error' end,
         consecutive_failures = case when v_ok > 0 then 0 else consecutive_failures + 1 end,
         last_error = case when v_fail > 0 then left((select string_agg(k || ': ' || coalesce(v ->> 'error', 'failed'), '; ')
                                                        from jsonb_each(p_providers) e(k, v) where not coalesce((v ->> 'ok')::boolean, false)), 500) end,
         -- Back off exponentially (max one cadence) after repeated total failures.
         next_run_at = case when v_ok = 0 and v_fail > 0
                            then now() + least(make_interval(days => m.cadence_days), make_interval(hours => (power(2, least(m.consecutive_failures + 1, 8)))::int))
                            else now() + make_interval(days => m.cadence_days) end
   where id = m.id;

  if v_new > 0 then
    perform private.notify(v_owner, 'new_signals', v_new || ' new public signal(s) for ' || v_company_name,
      'Review them in Research updates.', '/research?company=' || m.company_id, m.company_id, 'signals:' || r.id);
  end if;
  return v_new;
end $$;

revoke all on function public.start_monitor_run(uuid, text, text) from public, anon, authenticated;
revoke all on function public.finish_monitor_run(uuid, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.start_monitor_run(uuid, text, text) to service_role;
grant execute on function public.finish_monitor_run(uuid, jsonb, jsonb, jsonb) to service_role;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.research_jobs enable row level security;
alter table public.research_snapshots enable row level security;
alter table public.research_findings enable row level security;
alter table public.outreach_drafts enable row level security;
alter table public.company_monitors enable row level security;
alter table public.monitor_runs enable row level security;
alter table public.monitor_observations enable row level security;
alter table public.company_signals enable row level security;

create policy research_jobs_select on public.research_jobs for select to authenticated using ((select private.is_member()));
create policy research_jobs_insert on public.research_jobs for insert to authenticated
  with check ((select private.is_member()) and requested_by = (select private.current_app_user_id()) and status = 'queued' and snapshot_id is null);
create policy research_snapshots_select on public.research_snapshots for select to authenticated using ((select private.is_member()));
create policy research_findings_select on public.research_findings for select to authenticated using ((select private.is_member()));
create policy research_findings_update on public.research_findings for update to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));
create policy outreach_drafts_select on public.outreach_drafts for select to authenticated using ((select private.is_member()));
create policy outreach_drafts_insert on public.outreach_drafts for insert to authenticated with check ((select private.is_member()));
create policy outreach_drafts_update on public.outreach_drafts for update to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));
create policy company_monitors_select on public.company_monitors for select to authenticated using ((select private.is_member()));
create policy company_monitors_insert on public.company_monitors for insert to authenticated with check ((select private.is_member()));
create policy company_monitors_update on public.company_monitors for update to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));
create policy monitor_runs_select on public.monitor_runs for select to authenticated using ((select private.is_member()));
create policy monitor_obs_select on public.monitor_observations for select to authenticated using ((select private.is_member()));
create policy company_signals_select on public.company_signals for select to authenticated using ((select private.is_member()));
-- Members may add a signal by hand (manual source entry) and review signals.
create policy company_signals_insert on public.company_signals for insert to authenticated
  with check ((select private.is_member()) and provider = 'manual' and run_id is null);
create policy company_signals_update on public.company_signals for update to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));

revoke update, delete, truncate on public.research_jobs, public.research_snapshots, public.monitor_runs, public.monitor_observations from authenticated;
revoke delete, truncate on public.research_findings, public.outreach_drafts, public.company_monitors, public.company_signals from authenticated;
revoke all on public.research_jobs, public.research_snapshots, public.research_findings, public.outreach_drafts,
              public.company_monitors, public.monitor_runs, public.monitor_observations, public.company_signals from anon;
