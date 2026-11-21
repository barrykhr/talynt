-- =============================================================================
-- KiviTronics CRM — 0009 import row results, website lead inbox, v2 reports
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Import row-level results (replaces the JSON report column).
-- -----------------------------------------------------------------------------
create table public.import_rows (
  id           bigint generated always as identity primary key,
  import_id    uuid not null references public.imports (id) on delete cascade,
  row_number   integer not null,
  outcome      text not null check (outcome in ('created', 'updated', 'skipped', 'failed')),
  decision     text check (decision in ('link', 'update', 'skip', 'create')),
  message      text not null check (char_length(message) <= 2000),
  company_id   uuid references public.companies (id) on delete set null,
  contact_id   uuid references public.contacts (id) on delete set null,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  values       jsonb,
  unique (import_id, row_number)
);
create index import_rows_import_idx on public.import_rows (import_id, outcome);
alter table public.import_rows enable row level security;
create policy import_rows_select on public.import_rows for select to authenticated using ((select private.is_member()));
create policy import_rows_insert on public.import_rows for insert to authenticated
  with check ((select private.is_member()) and exists (
    select 1 from public.imports i where i.id = import_id and i.created_by = (select private.current_app_user_id())));
revoke update, delete, truncate on public.import_rows from authenticated;
revoke all on public.import_rows from anon;

alter table public.imports drop column report;
alter table public.imports add column duplicate_count integer not null default 0;

-- -----------------------------------------------------------------------------
-- Website lead capture: submissions land in an inbox and are converted by a
-- person (with duplicate checks) — never auto-created as companies.
-- -----------------------------------------------------------------------------
create table public.web_submissions (
  id              uuid primary key default gen_random_uuid(),
  received_at     timestamptz not null default now(),
  full_name       text not null check (char_length(full_name) between 1 and 160),
  email           text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  company_name    text check (company_name is null or char_length(company_name) <= 200),
  phone           text check (phone is null or char_length(phone) <= 40),
  role_needed     text check (role_needed is null or char_length(role_needed) <= 300),
  hiring_volume   integer check (hiring_volume is null or hiring_volume between 1 and 100000),
  location        text check (location is null or char_length(location) <= 200),
  message         text check (message is null or char_length(message) <= 5000),
  page_url        text check (page_url is null or char_length(page_url) <= 500),
  ip_hash         text,
  status          text not null default 'new' check (status in ('new', 'converted', 'spam', 'dismissed')),
  opportunity_id  uuid references public.opportunities (id) on delete set null,
  handled_by      uuid references public.app_users (id) on delete set null,
  handled_at      timestamptz
);
create index web_submissions_status_idx on public.web_submissions (status, received_at desc);
alter table public.web_submissions enable row level security;
create policy web_submissions_select on public.web_submissions for select to authenticated using ((select private.is_member()));
create policy web_submissions_update on public.web_submissions for update to authenticated
  using ((select private.is_member())) with check ((select private.is_member()));
revoke insert, delete, truncate on public.web_submissions from authenticated;
revoke all on public.web_submissions from anon;

-- -----------------------------------------------------------------------------
-- Dashboard v2
-- -----------------------------------------------------------------------------
create or replace function public.dashboard_summary(p_today date default current_date)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'open_opportunities', (select count(*) from public.opportunities where archived_at is null and stage not in ('won', 'lost')),
    'follow_ups_due', (select count(*) from public.opportunities where archived_at is null and stage not in ('won', 'lost')
                         and next_follow_up_on is not null and next_follow_up_on <= p_today)
                    + (select count(*) from public.activities where archived_at is null and type = 'task' and completed_at is null
                         and due_at < (p_today + 1)::timestamptz),
    'overdue', (select count(*) from public.opportunities where archived_at is null and stage not in ('won', 'lost') and next_follow_up_on < p_today)
             + (select count(*) from public.activities where archived_at is null and type = 'task' and completed_at is null and due_at < p_today::timestamptz),
    'no_next_action', (select count(*) from public.opportunities o where o.archived_at is null and o.stage not in ('won', 'lost')
                         and o.next_follow_up_on is null
                         and not exists (select 1 from public.activities a where a.opportunity_id = o.id and a.type = 'task'
                                           and a.completed_at is null and a.archived_at is null)),
    'active_clients', (select count(*) from public.company_overview where archived_at is null and is_active_client),
    'live_requirements', (select count(*) from public.requirements where archived_at is null and private.is_live_requirement(status)),
    'companies', (select count(*) from public.companies where archived_at is null),
    'new_signals', (select count(*) from public.company_signals where review_state = 'new'),
    'pending_findings', (select count(*) from public.research_findings where review_state = 'pending'),
    'new_web_leads', (select count(*) from public.web_submissions where status = 'new'),
    'pipeline', coalesce((select jsonb_object_agg(stage, n) from (
                   select stage::text, count(*) as n from public.opportunities where archived_at is null group by stage) s), '{}'::jsonb)
  )
$$;

-- -----------------------------------------------------------------------------
-- Reports v2: adds time in stage, no-next-action, signals, research freshness
-- and product/operations measures. Every number is reproducible from rows.
-- -----------------------------------------------------------------------------
create or replace function public.report_operations(p_from date, p_to date, p_today date default current_date)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with opp as (
    select * from public.opportunities o where o.archived_at is null
       and o.created_at >= p_from::timestamptz and o.created_at < (p_to + 1)::timestamptz
  ),
  stage_spans as (
    select h.entity_id, h.new_value as stage, h.changed_at as entered,
           lead(h.changed_at) over (partition by h.entity_id order by h.changed_at, h.id) as left_at
      from public.record_history h
     where h.entity_type = 'opportunity' and h.field = 'stage' and h.entity_id in (select id from opp)
  ),
  first_touch as (
    select o.id, o.created_at,
           least((select min(a.created_at) from public.activities a where a.opportunity_id = o.id and a.type not in ('task', 'research_update')),
                 (select min(j.created_at) from public.research_jobs j where j.opportunity_id = o.id or (j.opportunity_id is null and j.company_id = o.company_id and j.created_at >= o.created_at))) as touched
      from opp o
  ),
  open_opps as (select * from public.opportunities where archived_at is null and stage not in ('won', 'lost'))
  select jsonb_build_object(
    'time_in_stage_days', coalesce((select jsonb_object_agg(stage, jsonb_build_object('avg_days', round(avg_d, 1), 'samples', n)) from (
        select stage, avg(extract(epoch from (coalesce(left_at, now()) - entered)) / 86400.0) avg_d, count(*) n
          from stage_spans group by stage) x), '{}'::jsonb),
    'open_with_owner_and_follow_up_pct', (select case when count(*) = 0 then null
        else round(100.0 * count(*) filter (where owner_id is not null and next_follow_up_on is not null) / count(*), 1) end from open_opps),
    'open_count', (select count(*) from open_opps),
    'no_next_action', (select count(*) from open_opps o where o.next_follow_up_on is null
        and not exists (select 1 from public.activities a where a.opportunity_id = o.id and a.type = 'task' and a.completed_at is null and a.archived_at is null)),
    'median_hours_to_first_touch', (select round((percentile_cont(0.5) within group (order by extract(epoch from (touched - created_at)) / 3600.0))::numeric, 1)
        from first_touch where touched is not null),
    'leads_without_first_touch', (select count(*) from first_touch where touched is null),
    'imports', (select jsonb_build_object('rows', coalesce(sum(total_rows), 0), 'duplicates', coalesce(sum(duplicate_count), 0),
        'failed', coalesce(sum(failed_count), 0), 'skipped', coalesce(sum(skipped_count), 0))
        from public.imports where created_at >= p_from::timestamptz and created_at < (p_to + 1)::timestamptz),
    'requirements_by_stage', coalesce((select jsonb_agg(jsonb_build_object('status', status, 'count', n, 'volume', vol, 'filled', filled)) from (
        select status::text, count(*) n, sum(hiring_volume) vol, sum(positions_filled) filled
          from public.requirements where archived_at is null group by status) x), '[]'::jsonb),
    'requirements_by_location', coalesce((select jsonb_agg(jsonb_build_object('location', loc, 'count', n, 'volume', vol)) from (
        select coalesce(nullif(trim(location), ''), 'Not set') loc, count(*) n, sum(hiring_volume) vol
          from public.requirements where archived_at is null and private.is_live_requirement(status) group by 1 order by 2 desc limit 15) x), '[]'::jsonb),
    'signals', (select jsonb_build_object(
        'new', count(*) filter (where review_state = 'new'),
        'accepted', count(*) filter (where review_state = 'accepted'),
        'dismissed', count(*) filter (where review_state = 'dismissed'),
        'review_rate_pct', case when count(*) = 0 then null else round(100.0 * count(*) filter (where review_state <> 'new') / count(*), 1) end)
        from public.company_signals where first_seen_at >= p_from::timestamptz and first_seen_at < (p_to + 1)::timestamptz),
    'research', (select jsonb_build_object(
        'companies_researched', count(distinct s.company_id),
        'stale_over_90_days', (select count(*) from (select company_id, max(checked_at) last from public.research_snapshots group by company_id) z
                                 where z.last < now() - interval '90 days'),
        'findings_pending', (select count(*) from public.research_findings where review_state = 'pending'))
        from public.research_snapshots s where s.checked_at >= p_from::timestamptz and s.checked_at < (p_to + 1)::timestamptz),
    'monitors', (select jsonb_build_object('enabled', count(*) filter (where enabled),
        'erroring', count(*) filter (where enabled and status = 'error'),
        'stale', count(*) filter (where enabled and (last_success_at is null or last_success_at < now() - make_interval(days => 2 * cadence_days))))
        from public.company_monitors)
  )
$$;
revoke all on function public.report_operations(date, date, date) from public, anon;
grant execute on function public.report_operations(date, date, date) to authenticated;

