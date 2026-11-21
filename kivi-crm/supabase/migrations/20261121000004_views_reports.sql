-- =============================================================================
-- KiviTronics CRM — 0004 derived views, search, duplicates, merges, reports
-- All read functions are SECURITY INVOKER so row-level security still applies.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Active-client rule (agreed with the business):
--   an account is an ACTIVE CLIENT only when its MSA is signed AND it has at
--   least one live requirement. A requirement is live unless it is On hold or
--   Closed/filled (see private.is_live_requirement). Archived requirements
--   never count.
-- Mirrored in src/lib/domain/client-status.ts and covered by tests.
-- -----------------------------------------------------------------------------
create or replace view public.company_overview
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
  select count(*) filter (where private.is_live_requirement(q.status)) as live_requirements,
         count(*) as total_requirements
    from public.requirements q
   where q.company_id = c.id and q.archived_at is null
) r on true
left join lateral (
  select count(*) as open_opportunities
    from public.opportunities p
   where p.company_id = c.id and p.archived_at is null and p.stage not in ('won', 'lost')
) o on true;

grant select on public.company_overview to authenticated;
revoke all on public.company_overview from anon;

-- -----------------------------------------------------------------------------
-- Search helpers
-- -----------------------------------------------------------------------------
create or replace function private.like_pattern(p_query text)
returns text
language sql
immutable
set search_path = ''
as $$
  select '%' || replace(replace(replace(lower(trim(coalesce(p_query, ''))), '\', '\\'), '%', '\%'), '_', '\_') || '%'
$$;
grant execute on function private.like_pattern(text) to authenticated, service_role;

create or replace function public.search_crm(p_query text, p_limit integer default 8)
returns table (entity_type text, id uuid, title text, subtitle text, company_id uuid, updated_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (select private.like_pattern(p_query) as pat, least(greatest(coalesce(p_limit, 8), 1), 50) as lim)
  (select 'company', c.id, c.name, concat_ws(' · ', c.location, c.domain), c.id, c.updated_at
     from public.companies c, q
    where c.archived_at is null and c.search_text like q.pat escape '\'
    order by c.updated_at desc limit (select lim from q))
  union all
  (select 'contact', p.id, p.full_name, concat_ws(' · ', p.role_title, co.name, p.email), p.company_id, p.updated_at
     from public.contacts p left join public.companies co on co.id = p.company_id, q
    where p.archived_at is null and p.search_text like q.pat escape '\'
    order by p.updated_at desc limit (select lim from q))
  union all
  (select 'opportunity', o.id, o.title, co.name, o.company_id, o.updated_at
     from public.opportunities o join public.companies co on co.id = o.company_id, q
    where o.archived_at is null and o.search_text like q.pat escape '\'
    order by o.updated_at desc limit (select lim from q))
  union all
  (select 'requirement', r.id, r.role_title, concat_ws(' · ', co.name, r.location), r.company_id, r.updated_at
     from public.requirements r join public.companies co on co.id = r.company_id, q
    where r.archived_at is null and r.search_text like q.pat escape '\'
    order by r.updated_at desc limit (select lim from q))
  union all
  (select 'activity', a.id, a.subject, co.name, a.company_id, a.updated_at
     from public.activities a left join public.companies co on co.id = a.company_id, q
    where a.archived_at is null and a.search_text like q.pat escape '\'
    order by a.occurred_at desc limit (select lim from q))
$$;

revoke all on function public.search_crm(text, integer) from public, anon;
grant execute on function public.search_crm(text, integer) to authenticated;

-- -----------------------------------------------------------------------------
-- Duplicate detection
-- -----------------------------------------------------------------------------
create or replace function public.find_company_duplicates(
  p_name text, p_domain text default null, p_exclude uuid default null
) returns table (id uuid, name text, domain text, location text, score real, reason text)
language sql
stable
security invoker
set search_path = ''
as $$
  select c.id, c.name, c.domain, c.location,
         greatest(
           case when private.normalize_domain(p_domain) is not null
                 and c.domain = private.normalize_domain(p_domain) then 1.0 else 0 end,
           case when c.normalized_name = private.normalize_company_name(p_name) then 0.99 else 0 end,
           extensions.similarity(c.normalized_name, private.normalize_company_name(p_name))
         )::real as score,
         case
           when private.normalize_domain(p_domain) is not null and c.domain = private.normalize_domain(p_domain) then 'same_domain'
           when c.normalized_name = private.normalize_company_name(p_name) then 'same_name'
           else 'similar_name'
         end as reason
    from public.companies c
   where c.archived_at is null
     and (p_exclude is null or c.id <> p_exclude)
     and char_length(private.normalize_company_name(p_name)) > 0
     and (
       (private.normalize_domain(p_domain) is not null and c.domain = private.normalize_domain(p_domain))
       or c.normalized_name = private.normalize_company_name(p_name)
       or extensions.similarity(c.normalized_name, private.normalize_company_name(p_name)) >= 0.55
     )
   order by score desc
   limit 5
$$;

create or replace function public.find_contact_duplicates(
  p_email text, p_full_name text, p_company_id uuid default null, p_exclude uuid default null
) returns table (id uuid, full_name text, email text, company_id uuid, score real, reason text)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.id, p.full_name, p.email, p.company_id,
         greatest(
           case when nullif(lower(trim(p_email)), '') is not null and p.email = lower(trim(p_email)) then 1.0 else 0 end,
           case when p_company_id is not null and p.company_id = p_company_id
                then extensions.similarity(lower(p.full_name), lower(coalesce(p_full_name, ''))) else 0 end
         )::real as score,
         case when nullif(lower(trim(p_email)), '') is not null and p.email = lower(trim(p_email))
              then 'same_email' else 'similar_name_same_company' end as reason
    from public.contacts p
   where p.archived_at is null
     and (p_exclude is null or p.id <> p_exclude)
     and (
       (nullif(lower(trim(p_email)), '') is not null and p.email = lower(trim(p_email)))
       or (p_company_id is not null and p.company_id = p_company_id
           and extensions.similarity(lower(p.full_name), lower(coalesce(p_full_name, ''))) >= 0.6)
     )
   order by score desc
   limit 5
$$;

revoke all on function public.find_company_duplicates(text, text, uuid) from public, anon;
revoke all on function public.find_contact_duplicates(text, text, uuid, uuid) from public, anon;
grant execute on function public.find_company_duplicates(text, text, uuid) to authenticated;
grant execute on function public.find_contact_duplicates(text, text, uuid, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Merging. The merged record is archived with merged_into_id set, never
-- deleted, so nothing is lost and the merge is traceable.
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
  update public.sync_review_items set suggested_company_id = p_keep where suggested_company_id = p_merge;

  -- Archive first so the merged domain no longer conflicts with the kept one.
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
    msa_status    = case
                      when 'signed' in (k.msa_status, m.msa_status) then 'signed'::public.msa_status
                      when 'in_discussion' in (k.msa_status, m.msa_status) then 'in_discussion'::public.msa_status
                      else 'not_started'::public.msa_status end,
    msa_signed_on = coalesce(k.msa_signed_on, m.msa_signed_on),
    notes         = nullif(concat_ws(E'\n\n', k.notes,
                      case when m.notes is not null then '— Merged from ' || m.name || E':\n' || m.notes end), ''),
    last_activity_at = greatest(k.last_activity_at, m.last_activity_at)
  where id = p_keep;

  perform private.write_audit('record.merged', 'company', p_keep::text,
    jsonb_build_object('merged_id', p_merge, 'merged_name', m.name));
end;
$$;

create or replace function public.merge_contacts(p_keep uuid, p_merge uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  k public.contacts%rowtype;
  m public.contacts%rowtype;
begin
  if not private.is_member() then
    raise exception 'Not a CRM member' using errcode = '42501';
  end if;
  if p_keep = p_merge then
    raise exception 'Choose two different contacts' using errcode = '22023';
  end if;

  select * into k from public.contacts where id = p_keep and archived_at is null for update;
  if not found then raise exception 'Contact to keep not found' using errcode = 'P0002'; end if;
  select * into m from public.contacts where id = p_merge and archived_at is null for update;
  if not found then raise exception 'Contact to merge not found' using errcode = 'P0002'; end if;

  update public.activities set contact_id = p_keep where contact_id = p_merge;
  insert into public.opportunity_contacts (opportunity_id, contact_id)
    select opportunity_id, p_keep from public.opportunity_contacts where contact_id = p_merge
    on conflict do nothing;
  delete from public.opportunity_contacts where contact_id = p_merge;
  insert into public.requirement_contacts (requirement_id, contact_id)
    select requirement_id, p_keep from public.requirement_contacts where contact_id = p_merge
    on conflict do nothing;
  delete from public.requirement_contacts where contact_id = p_merge;

  update public.contacts set archived_at = now(), merged_into_id = p_keep, email = null
   where id = p_merge;

  update public.contacts set
    company_id   = coalesce(k.company_id, m.company_id),
    role_title   = coalesce(k.role_title, m.role_title),
    email        = coalesce(k.email, m.email),
    phone        = coalesce(k.phone, m.phone),
    linkedin_url = coalesce(k.linkedin_url, m.linkedin_url),
    location     = coalesce(k.location, m.location),
    source       = coalesce(k.source, m.source),
    owner_id     = coalesce(k.owner_id, m.owner_id),
    notes        = nullif(concat_ws(E'\n\n', k.notes,
                     case when m.notes is not null or (m.email is not null and m.email is distinct from k.email)
                          then '— Merged from ' || m.full_name
                               || coalesce(' <' || m.email || '>', '') || E':\n' || coalesce(m.notes, '') end), ''),
    last_activity_at = greatest(k.last_activity_at, m.last_activity_at)
  where id = p_keep;

  perform private.write_audit('record.merged', 'contact', p_keep::text,
    jsonb_build_object('merged_id', p_merge, 'merged_name', m.full_name));
end;
$$;

revoke all on function public.merge_companies(uuid, uuid) from public, anon;
revoke all on function public.merge_contacts(uuid, uuid) from public, anon;
grant execute on function public.merge_companies(uuid, uuid) to authenticated;
grant execute on function public.merge_contacts(uuid, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Overview numbers
-- -----------------------------------------------------------------------------
create or replace function public.dashboard_summary(p_today date default current_date)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'open_opportunities', (select count(*) from public.opportunities
                            where archived_at is null and stage not in ('won', 'lost')),
    'follow_ups_due', (select count(*) from public.opportunities
                        where archived_at is null and stage not in ('won', 'lost')
                          and next_follow_up_on is not null and next_follow_up_on <= p_today)
                    + (select count(*) from public.activities
                        where archived_at is null and type = 'task' and completed_at is null
                          and due_at < (p_today + 1)::timestamptz),
    'active_clients', (select count(*) from public.company_overview
                        where archived_at is null and is_active_client),
    'live_requirements', (select count(*) from public.requirements
                           where archived_at is null and private.is_live_requirement(status)),
    'companies', (select count(*) from public.companies where archived_at is null),
    'pipeline', coalesce((select jsonb_object_agg(stage, n) from (
                   select stage::text, count(*) as n from public.opportunities
                    where archived_at is null group by stage) s), '{}'::jsonb)
  )
$$;

revoke all on function public.dashboard_summary(date) from public, anon;
grant execute on function public.dashboard_summary(date) to authenticated;

-- -----------------------------------------------------------------------------
-- Reports. p_from / p_to filter by record creation date (inclusive).
-- p_owner limits to one owner when given.
-- -----------------------------------------------------------------------------
create or replace function public.report_summary(
  p_from date, p_to date, p_owner uuid default null, p_today date default current_date
) returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with opp as (
    select o.* from public.opportunities o
     where o.archived_at is null
       and o.created_at >= p_from::timestamptz
       and o.created_at < (p_to + 1)::timestamptz
       and (p_owner is null or o.owner_id = p_owner)
  ),
  reached as (
    select h.entity_id, array_agg(distinct h.new_value) as stages
      from public.record_history h
     where h.entity_type = 'opportunity' and h.field = 'stage'
       and h.entity_id in (select id from opp)
     group by h.entity_id
  )
  select jsonb_build_object(
    'pipeline_by_stage_owner', coalesce((
       select jsonb_agg(jsonb_build_object('stage', stage, 'owner_id', owner_id, 'count', n))
         from (select stage::text, owner_id, count(*) n from opp group by stage, owner_id) x), '[]'::jsonb),
    'by_source', coalesce((
       select jsonb_agg(jsonb_build_object('source', source, 'total', total, 'won', won, 'lost', lost))
         from (select coalesce(source::text, 'unknown') source, count(*) total,
                      count(*) filter (where stage = 'won') won,
                      count(*) filter (where stage = 'lost') lost
                 from opp group by 1) x), '[]'::jsonb),
    'conversion', jsonb_build_object(
       'created',   (select count(*) from opp),
       'contacted', (select count(*) from opp o join reached r on r.entity_id = o.id
                      where r.stages && array['contacted','in_conversation','qualified','proposal_msa','won']),
       'qualified', (select count(*) from opp o join reached r on r.entity_id = o.id
                      where r.stages && array['qualified','proposal_msa','won']),
       'proposal',  (select count(*) from opp o join reached r on r.entity_id = o.id
                      where r.stages && array['proposal_msa','won']),
       'won',       (select count(*) from opp where stage = 'won'),
       'lost',      (select count(*) from opp where stage = 'lost')),
    'overdue_follow_ups', jsonb_build_object(
       'opportunities', (select count(*) from public.opportunities
                          where archived_at is null and stage not in ('won','lost')
                            and next_follow_up_on < p_today
                            and (p_owner is null or owner_id = p_owner)),
       'tasks', (select count(*) from public.activities
                  where archived_at is null and type = 'task' and completed_at is null
                    and due_at < p_today::timestamptz
                    and (p_owner is null or owner_id = p_owner))),
    'client_status', coalesce((
       select jsonb_object_agg(client_status, n)
         from (select client_status, count(*) n from public.company_overview
                where archived_at is null and (p_owner is null or owner_id = p_owner)
                group by client_status) x), '{}'::jsonb),
    'requirement_status', coalesce((
       select jsonb_agg(jsonb_build_object('status', status, 'count', n, 'volume', vol, 'filled', filled))
         from (select status::text, count(*) n, sum(hiring_volume) vol, sum(positions_filled) filled
                 from public.requirements
                where archived_at is null and (p_owner is null or owner_id = p_owner)
                group by status) x), '[]'::jsonb),
    'msa_status', coalesce((
       select jsonb_object_agg(msa_status, n)
         from (select msa_status::text, count(*) n from public.companies
                where archived_at is null and (p_owner is null or owner_id = p_owner)
                group by msa_status) x), '{}'::jsonb)
  )
$$;

revoke all on function public.report_summary(date, date, uuid, date) from public, anon;
grant execute on function public.report_summary(date, date, uuid, date) to authenticated;

-- -----------------------------------------------------------------------------
-- Bulk duplicate matching for spreadsheet imports: for each (name, domain)
-- input, the best existing company match (same domain, same normalised name,
-- or a similar name). Security invoker: RLS applies.
-- -----------------------------------------------------------------------------
create or replace function public.match_companies_bulk(p_names text[], p_domains text[])
returns table (idx integer, company_id uuid, name text, domain text, reason text, score real)
language sql
stable
security invoker
set search_path = ''
as $$
  with input as (
    select i::integer as idx,
           private.normalize_company_name(p_names[i]) as norm,
           private.normalize_domain(p_domains[i]) as dom
      from generate_subscripts(p_names, 1) as i
  )
  select inp.idx, m.id, m.name, m.domain, m.reason, m.score
    from input inp
    cross join lateral (
      select c.id, c.name, c.domain,
             case when inp.dom is not null and c.domain = inp.dom then 'same_domain'
                  when c.normalized_name = inp.norm then 'same_name'
                  else 'similar_name' end as reason,
             greatest(case when inp.dom is not null and c.domain = inp.dom then 1.0 else 0 end,
                      extensions.similarity(c.normalized_name, inp.norm))::real as score
        from public.companies c
       where c.archived_at is null
         and char_length(inp.norm) > 0
         and ((inp.dom is not null and c.domain = inp.dom)
              or c.normalized_name = inp.norm
              or (c.normalized_name operator(extensions.%) inp.norm
                  and extensions.similarity(c.normalized_name, inp.norm) >= 0.6))
       order by 5 desc
       limit 1
    ) m
$$;

revoke all on function public.match_companies_bulk(text[], text[]) from public, anon;
grant execute on function public.match_companies_bulk(text[], text[]) to authenticated;
