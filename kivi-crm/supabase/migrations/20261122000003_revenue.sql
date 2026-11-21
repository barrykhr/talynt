-- =============================================================================
-- KiviTronics CRM — 0007 revenue (operational reporting, NOT accounting)
--
-- Source records: placements, revenue_events (earned), invoices, payments,
-- credit_adjustments. Every total is calculated from these in views/functions;
-- no rollup is stored. Records are corrected or reversed, never deleted, and
-- every change is written to record_history.
--
-- Measures (also shown in the UI with these definitions):
--   pipeline   open opportunities' estimated value (unweighted, and weighted by
--              stage probability or a per-deal override)
--   booked     value of live, client-accepted requirements with agreed terms on
--              a company with a signed MSA (each condition admin-configurable)
--   earned     revenue events whose contractual milestone has been met
--   invoiced   invoices issued (not cancelled)
--   realized   payments actually received (not reversed). Never an invoice or
--              placement on its own.
--   outstanding invoiced − payments − credits, per invoice, with due date
-- =============================================================================

create type public.placement_status as enum ('offer_accepted', 'joined', 'fell_through');
create type public.revenue_event_kind as enum ('placement_fee', 'retainer_milestone', 'contract_margin', 'other');
create type public.revenue_event_status as enum ('expected', 'earned', 'reversed');
create type public.invoice_status as enum ('issued', 'cancelled');

-- -----------------------------------------------------------------------------
-- Placements: one hire against a requirement. Deliberately NO candidate
-- personal data (this is not an ATS) — only an optional neutral label.
-- -----------------------------------------------------------------------------
create table public.placements (
  id                uuid primary key default gen_random_uuid(),
  requirement_id    uuid not null references public.requirements (id) on delete restrict,
  label             text check (label is null or char_length(label) <= 80),
  status            public.placement_status not null default 'offer_accepted',
  offer_accepted_on date not null,
  joined_on         date,
  compensation      numeric(14,2) check (compensation is null or compensation >= 0),
  fee_amount        numeric(14,2) check (fee_amount is null or fee_amount >= 0),
  currency          char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  notes             text check (notes is null or char_length(notes) <= 2000),
  created_by        uuid references public.app_users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  archived_at       timestamptz,
  archived_by       uuid references public.app_users (id) on delete set null,
  constraint placements_joined_after_offer check (joined_on is null or joined_on >= offer_accepted_on)
);
create index placements_requirement_idx on public.placements (requirement_id);

-- -----------------------------------------------------------------------------
-- Revenue events: what has been (or is expected to be) earned.
-- -----------------------------------------------------------------------------
create table public.revenue_events (
  id              uuid primary key default gen_random_uuid(),
  requirement_id  uuid not null references public.requirements (id) on delete restrict,
  placement_id    uuid unique references public.placements (id) on delete restrict,
  kind            public.revenue_event_kind not null,
  status          public.revenue_event_status not null default 'expected',
  amount          numeric(14,2) not null check (amount >= 0),
  currency        char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  earned_on       date,
  description     text check (description is null or char_length(description) <= 300),
  reversal_reason text check (reversal_reason is null or char_length(reversal_reason) <= 500),
  created_by      uuid references public.app_users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  archived_at     timestamptz,
  archived_by     uuid references public.app_users (id) on delete set null,
  constraint revenue_events_earned_has_date check (status <> 'earned' or earned_on is not null),
  constraint revenue_events_reversal_reason check (status <> 'reversed' or reversal_reason is not null)
);
create index revenue_events_requirement_idx on public.revenue_events (requirement_id);
create index revenue_events_earned_idx on public.revenue_events (earned_on) where status = 'earned';

-- -----------------------------------------------------------------------------
-- Invoices, payments (partial payments supported) and credit adjustments.
-- -----------------------------------------------------------------------------
create table public.invoices (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies (id) on delete restrict,
  requirement_id   uuid references public.requirements (id) on delete restrict,
  revenue_event_id uuid references public.revenue_events (id) on delete restrict,
  invoice_number   text not null check (char_length(trim(invoice_number)) between 1 and 60),
  status           public.invoice_status not null default 'issued',
  issued_on        date not null,
  due_on           date not null,
  amount           numeric(14,2) not null check (amount > 0),
  currency         char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  notes            text check (notes is null or char_length(notes) <= 2000),
  cancel_reason    text check (cancel_reason is null or char_length(cancel_reason) <= 500),
  created_by       uuid references public.app_users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint invoices_due_after_issue check (due_on >= issued_on),
  constraint invoices_cancel_reason check (status <> 'cancelled' or cancel_reason is not null),
  constraint invoices_number_unique unique (invoice_number)
);
create index invoices_company_idx on public.invoices (company_id);
create index invoices_requirement_idx on public.invoices (requirement_id);
create index invoices_due_idx on public.invoices (due_on) where status = 'issued';

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references public.invoices (id) on delete restrict,
  received_on     date not null,
  amount          numeric(14,2) not null check (amount > 0),
  currency        char(3) not null check (currency ~ '^[A-Z]{3}$'),
  reference       text check (reference is null or char_length(reference) <= 120),
  method          text check (method is null or char_length(method) <= 40),
  notes           text check (notes is null or char_length(notes) <= 1000),
  reversed_at     timestamptz,
  reversal_reason text check (reversal_reason is null or char_length(reversal_reason) <= 500),
  created_by      uuid references public.app_users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint payments_reversal_reason check (reversed_at is null or reversal_reason is not null)
);
create index payments_invoice_idx on public.payments (invoice_id);
create index payments_received_idx on public.payments (received_on) where reversed_at is null;

create table public.credit_adjustments (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices (id) on delete restrict,
  placement_id uuid references public.placements (id) on delete restrict,
  adjusted_on  date not null,
  amount       numeric(14,2) not null check (amount > 0),
  currency     char(3) not null check (currency ~ '^[A-Z]{3}$'),
  reason       text not null check (char_length(reason) between 1 and 500),
  created_by   uuid references public.app_users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index credit_adjustments_invoice_idx on public.credit_adjustments (invoice_id);

-- -----------------------------------------------------------------------------
-- Integrity triggers
-- -----------------------------------------------------------------------------
create trigger placements_20_stamp before insert or update on public.placements for each row execute function private.stamp_record();
create trigger revenue_events_20_stamp before insert or update on public.revenue_events for each row execute function private.stamp_record();

create or replace function private.stamp_simple()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if not private.is_trusted_backend() then new.created_by := private.current_app_user_id(); end if;
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger invoices_20_stamp before insert or update on public.invoices for each row execute function private.stamp_simple();
create trigger payments_20_stamp before insert or update on public.payments for each row execute function private.stamp_simple();
create trigger credits_20_stamp before insert or update on public.credit_adjustments for each row execute function private.stamp_simple();

-- Invoice consistency: requirement must belong to the company; currency must
-- match the requirement's. Amount cannot drop below what has been paid.
create or replace function private.check_invoice()
returns trigger language plpgsql set search_path = '' as $$
declare v_company uuid; v_currency char(3); v_settled numeric;
begin
  new.invoice_number := trim(new.invoice_number);
  if new.requirement_id is not null then
    select company_id, currency into v_company, v_currency from public.requirements where id = new.requirement_id;
    if v_company <> new.company_id then
      raise exception 'The requirement belongs to a different company' using errcode = '23514';
    end if;
    if v_currency <> new.currency then
      raise exception 'Invoice currency must match the requirement currency (%)', v_currency using errcode = '23514';
    end if;
  end if;
  if new.revenue_event_id is not null and new.requirement_id is null then
    select requirement_id into new.requirement_id from public.revenue_events where id = new.revenue_event_id;
  end if;
  if tg_op = 'UPDATE' then
    if new.currency <> old.currency and exists (select 1 from public.payments where invoice_id = new.id) then
      raise exception 'Currency cannot change after payments are recorded' using errcode = '23514';
    end if;
    select coalesce(sum(amount), 0) into v_settled from public.payments where invoice_id = new.id and reversed_at is null;
    if new.amount < v_settled then
      raise exception 'Invoice amount cannot be less than payments already received' using errcode = '23514';
    end if;
    if new.status = 'cancelled' and old.status <> 'cancelled' and v_settled > 0 then
      raise exception 'Reverse the payments before cancelling this invoice' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
create trigger invoices_10_check before insert or update on public.invoices for each row execute function private.check_invoice();

-- Payments: same currency as the invoice; no overpayment; issued invoices only.
create or replace function private.check_payment()
returns trigger language plpgsql set search_path = '' as $$
declare inv public.invoices%rowtype; v_paid numeric; v_credit numeric;
begin
  select * into inv from public.invoices where id = new.invoice_id for update;
  if tg_op = 'UPDATE' then
    if new.invoice_id <> old.invoice_id or new.amount <> old.amount or new.received_on <> old.received_on or new.currency <> old.currency then
      raise exception 'Payments cannot be edited; reverse it and record a new one' using errcode = '22023';
    end if;
    if old.reversed_at is not null and new.reversed_at is null then
      raise exception 'A reversed payment cannot be restored; record a new payment' using errcode = '22023';
    end if;
    return new;
  end if;
  if new.currency is null then new.currency := inv.currency; end if;
  if inv.status <> 'issued' then
    raise exception 'Payments can only be recorded against issued invoices' using errcode = '23514';
  end if;
  if new.currency <> inv.currency then
    raise exception 'Payment currency must match the invoice (%)', inv.currency using errcode = '23514';
  end if;
  select coalesce(sum(amount), 0) into v_paid from public.payments where invoice_id = inv.id and reversed_at is null;
  select coalesce(sum(amount), 0) into v_credit from public.credit_adjustments where invoice_id = inv.id;
  if v_paid + v_credit + new.amount > inv.amount then
    raise exception 'Payment exceeds the outstanding balance (% %)', inv.currency, inv.amount - v_paid - v_credit using errcode = '23514';
  end if;
  return new;
end $$;
create trigger payments_10_check before insert or update on public.payments for each row execute function private.check_payment();

create or replace function private.check_credit()
returns trigger language plpgsql set search_path = '' as $$
declare inv public.invoices%rowtype; v_paid numeric; v_credit numeric;
begin
  if tg_op = 'UPDATE' then
    raise exception 'Credit adjustments cannot be edited; add a correcting entry' using errcode = '22023';
  end if;
  select * into inv from public.invoices where id = new.invoice_id for update;
  if new.currency is null then new.currency := inv.currency; end if;
  if new.currency <> inv.currency then
    raise exception 'Credit currency must match the invoice (%)', inv.currency using errcode = '23514';
  end if;
  select coalesce(sum(amount), 0) into v_paid from public.payments where invoice_id = inv.id and reversed_at is null;
  select coalesce(sum(amount), 0) into v_credit from public.credit_adjustments where invoice_id = inv.id;
  if v_paid + v_credit + new.amount > inv.amount then
    raise exception 'Credit exceeds the outstanding balance' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger credits_10_check before insert or update on public.credit_adjustments for each row execute function private.check_credit();

-- Placements keep requirements.positions_filled in step (single source of truth)
-- and maintain the linked placement_fee revenue event per the earned rule.
create or replace function private.guard_positions_filled()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.positions_filled is distinct from old.positions_filled
     and coalesce(current_setting('crm.placement_sync', true), 'off') <> 'on' then
    raise exception 'Placements are counted from recorded placements; add or update a placement instead' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger requirements_15_guard_filled before update of positions_filled on public.requirements
  for each row execute function private.guard_positions_filled();

create or replace function private.sync_placement()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_req uuid := coalesce(new.requirement_id, old.requirement_id);
  v_count int;
  v_rule text := (private.settings()).placement_earned_on;
  v_milestone date;
  v_status public.revenue_event_status;
begin
  select count(*) into v_count from public.placements
   where requirement_id = v_req and archived_at is null and status <> 'fell_through';
  perform set_config('crm.placement_sync', 'on', true);
  update public.requirements set positions_filled = v_count where id = v_req;
  perform set_config('crm.placement_sync', 'off', true);

  if new.fee_amount is not null then
    v_milestone := case when v_rule = 'offer_accepted' then new.offer_accepted_on else new.joined_on end;
    v_status := case
      when new.status = 'fell_through' or new.archived_at is not null then 'reversed'
      when v_milestone is not null and v_milestone <= current_date then 'earned'
      else 'expected' end;
    insert into public.revenue_events (requirement_id, placement_id, kind, status, amount, currency, earned_on, description, reversal_reason, created_by)
    values (new.requirement_id, new.id, 'placement_fee', v_status, new.fee_amount, new.currency,
            case when v_status = 'earned' then v_milestone end,
            'Placement fee' || coalesce(' — ' || new.label, ''),
            case when v_status = 'reversed' then 'Placement fell through or was archived' end, new.created_by)
    on conflict (placement_id) do update set
      status = excluded.status, amount = excluded.amount, currency = excluded.currency,
      earned_on = excluded.earned_on, reversal_reason = excluded.reversal_reason, description = excluded.description;
  end if;
  return new;
end $$;
create trigger placements_sync after insert or update on public.placements for each row execute function private.sync_placement();

-- History (audit trail of financial changes).
create or replace function private.history_revenue()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_type text := case tg_table_name when 'placements' then 'placement' when 'revenue_events' then 'revenue_event'
                   when 'invoices' then 'invoice' when 'payments' then 'payment' else 'credit' end;
  v_new jsonb := to_jsonb(new);
  v_old jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) end;
  k text;
begin
  if tg_op = 'INSERT' then
    perform private.record_change(v_type, new.id, 'created', null,
      coalesce(v_new ->> 'currency', '') || ' ' || coalesce(v_new ->> 'amount', v_new ->> 'fee_amount', ''));
    return new;
  end if;
  foreach k in array array['status', 'amount', 'fee_amount', 'currency', 'earned_on', 'due_on', 'issued_on', 'joined_on', 'reversed_at', 'invoice_number', 'archived_at'] loop
    if v_new ? k and (v_new -> k) is distinct from (v_old -> k) then
      perform private.record_change(v_type, new.id, k, v_old ->> k, v_new ->> k);
    end if;
  end loop;
  return new;
end $$;
create trigger placements_history after insert or update on public.placements for each row execute function private.history_revenue();
create trigger revenue_events_history after insert or update on public.revenue_events for each row execute function private.history_revenue();
create trigger invoices_history after insert or update on public.invoices for each row execute function private.history_revenue();
create trigger payments_history after insert or update on public.payments for each row execute function private.history_revenue();
create trigger credits_history after insert on public.credit_adjustments for each row execute function private.history_revenue();

-- Audit log entries for invoice and payment changes too (admin-visible).
create or replace function private.audit_money()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.write_audit(
    case tg_table_name when 'invoices' then 'revenue.invoice' when 'payments' then 'revenue.payment' else 'revenue.credit' end
      || case when tg_op = 'INSERT' then '_created' else '_changed' end,
    tg_table_name, new.id::text,
    jsonb_build_object('amount', to_jsonb(new) -> 'amount', 'currency', to_jsonb(new) -> 'currency', 'status', to_jsonb(new) -> 'status',
                       'reversed', (to_jsonb(new) -> 'reversed_at') is not null and (to_jsonb(new) ->> 'reversed_at') is not null));
  return new;
end $$;
create trigger invoices_audit after insert or update on public.invoices for each row execute function private.audit_money();
create trigger payments_audit after insert or update on public.payments for each row execute function private.audit_money();
create trigger credits_audit after insert on public.credit_adjustments for each row execute function private.audit_money();

-- RLS: shared read/insert/update for members; no deletes.
do $$
declare t text;
begin
  foreach t in array array['placements', 'revenue_events', 'invoices', 'payments', 'credit_adjustments'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using ((select private.is_member()))', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_member()))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.is_member())) with check ((select private.is_member()))', t || '_update', t);
    execute format('revoke delete, truncate on public.%I from anon, authenticated', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Derived views (security_invoker: RLS applies)
-- -----------------------------------------------------------------------------
create or replace view public.invoice_balances with (security_invoker = true) as
select i.*,
       coalesce(p.paid, 0) as paid,
       coalesce(c.credited, 0) as credited,
       case when i.status = 'cancelled' then 0 else i.amount - coalesce(p.paid, 0) - coalesce(c.credited, 0) end as outstanding,
       p.last_payment_on,
       (i.status = 'issued' and i.amount - coalesce(p.paid, 0) - coalesce(c.credited, 0) > 0 and i.due_on < current_date) as is_overdue,
       greatest(0, current_date - i.due_on) as days_past_due,
       case
         when i.status = 'cancelled' or i.amount - coalesce(p.paid, 0) - coalesce(c.credited, 0) <= 0 then 'settled'
         when i.due_on >= current_date then 'current'
         when current_date - i.due_on <= 30 then '1-30'
         when current_date - i.due_on <= 60 then '31-60'
         when current_date - i.due_on <= 90 then '61-90'
         else '90+' end as aging_bucket,
       case when i.status = 'cancelled' then 'cancelled'
            when coalesce(p.paid, 0) + coalesce(c.credited, 0) >= i.amount then 'paid'
            when coalesce(p.paid, 0) > 0 then 'part_paid'
            else 'unpaid' end as payment_state
  from public.invoices i
  left join lateral (select sum(amount) paid, max(received_on) last_payment_on from public.payments
                      where invoice_id = i.id and reversed_at is null) p on true
  left join lateral (select sum(amount) credited from public.credit_adjustments where invoice_id = i.id) c on true;
grant select on public.invoice_balances to authenticated;
revoke all on public.invoice_balances from anon;

-- Per-requirement revenue (all amounts in the requirement's currency).
create or replace view public.requirement_revenue with (security_invoker = true) as
select r.id as requirement_id, r.company_id, r.opportunity_id, r.role_title, r.status, r.currency,
       r.fee_basis, r.fee_percent, r.fee_per_hire, r.hiring_volume, r.positions_filled,
       r.computed_total_fee as estimated_fee,
       r.probability,
       (r.archived_at is null and private.is_live_requirement(r.status)
         and coalesce(r.computed_total_fee, 0) > 0
         and (not s.booked_requires_accepted or r.client_accepted_at is not null)
         and (not s.booked_requires_terms or r.terms_agreed_at is not null)
         and (not s.booked_requires_msa or c.msa_status = 'signed')) as is_booked,
       greatest(r.client_accepted_at, r.terms_agreed_at) as booked_basis_at,
       coalesce(e.earned, 0) as earned,
       coalesce(e.expected, 0) as expected_earnings,
       coalesce(iv.invoiced, 0) as invoiced,
       coalesce(iv.collected, 0) as collected,
       coalesce(iv.outstanding, 0) as outstanding
  from public.requirements r
  join public.companies c on c.id = r.company_id
  cross join lateral (select * from private.settings()) s
  left join lateral (select sum(amount) filter (where status = 'earned') earned,
                            sum(amount) filter (where status = 'expected') expected
                       from public.revenue_events where requirement_id = r.id and archived_at is null) e on true
  left join lateral (select sum(amount) filter (where status = 'issued') invoiced,
                            sum(paid) collected,
                            sum(outstanding) outstanding
                       from public.invoice_balances where requirement_id = r.id) iv on true
 where r.archived_at is null;
grant select on public.requirement_revenue to authenticated;
revoke all on public.requirement_revenue from anon;

-- Opportunity pipeline value with the probability actually used.
create or replace view public.opportunity_pipeline with (security_invoker = true) as
select o.id as opportunity_id, o.company_id, o.title, o.stage, o.owner_id, o.currency, o.estimated_value,
       coalesce(o.probability_override, (s.stage_probabilities ->> o.stage::text)::int, 0) as probability,
       case when o.probability_override is not null then 'override' else 'stage default' end as probability_source,
       round(coalesce(o.estimated_value, 0) * coalesce(o.probability_override, (s.stage_probabilities ->> o.stage::text)::int, 0) / 100.0, 2) as weighted_value,
       o.created_at, o.expected_close_on
  from public.opportunities o
  cross join lateral (select * from private.settings()) s
 where o.archived_at is null;
grant select on public.opportunity_pipeline to authenticated;
revoke all on public.opportunity_pipeline from anon;

-- -----------------------------------------------------------------------------
-- Revenue summary per currency for a date range (inclusive).
-- -----------------------------------------------------------------------------
create or replace function public.revenue_summary(p_from date, p_to date, p_owner uuid default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with cur as (
    select currency from public.opportunities where archived_at is null
    union select currency from public.requirements where archived_at is null
    union select currency from public.invoices
  ),
  pipe as (
    select p.currency, sum(coalesce(p.estimated_value, 0)) unweighted, sum(p.weighted_value) weighted, count(*) n,
           count(*) filter (where p.estimated_value is null) unvalued
      from public.opportunity_pipeline p
     where p.stage not in ('won', 'lost') and (p_owner is null or p.owner_id = p_owner)
     group by p.currency
  ),
  booked as (
    select rr.currency, sum(rr.estimated_fee) v, count(*) n
      from public.requirement_revenue rr join public.requirements r on r.id = rr.requirement_id
     where rr.is_booked and (p_owner is null or r.owner_id = p_owner)
       and (rr.booked_basis_at is null or rr.booked_basis_at::date between p_from and p_to)
     group by rr.currency
  ),
  earned as (
    select e.currency, sum(e.amount) v, count(*) n
      from public.revenue_events e join public.requirements r on r.id = e.requirement_id
     where e.status = 'earned' and e.archived_at is null and e.earned_on between p_from and p_to
       and (p_owner is null or r.owner_id = p_owner)
     group by e.currency
  ),
  inv as (
    select i.currency, sum(i.amount) v, count(*) n
      from public.invoices i left join public.requirements r on r.id = i.requirement_id
     where i.status = 'issued' and i.issued_on between p_from and p_to and (p_owner is null or r.owner_id = p_owner)
     group by i.currency
  ),
  paid as (
    select p.currency, sum(p.amount) v, count(*) n
      from public.payments p join public.invoices i on i.id = p.invoice_id left join public.requirements r on r.id = i.requirement_id
     where p.reversed_at is null and p.received_on between p_from and p_to and (p_owner is null or r.owner_id = p_owner)
     group by p.currency
  ),
  outst as (
    select b.currency, sum(b.outstanding) v, sum(b.outstanding) filter (where b.is_overdue) overdue,
           count(*) filter (where b.outstanding > 0) n, count(*) filter (where b.payment_state = 'part_paid') part_paid
      from public.invoice_balances b left join public.requirements r on r.id = b.requirement_id
     where b.status = 'issued' and (p_owner is null or r.owner_id = p_owner)
     group by b.currency
  )
  select coalesce(jsonb_object_agg(cur.currency, jsonb_build_object(
    'pipeline_unweighted', coalesce(pipe.unweighted, 0), 'pipeline_weighted', coalesce(pipe.weighted, 0),
    'pipeline_count', coalesce(pipe.n, 0), 'pipeline_unvalued', coalesce(pipe.unvalued, 0),
    'booked', coalesce(booked.v, 0), 'booked_count', coalesce(booked.n, 0),
    'earned', coalesce(earned.v, 0), 'earned_count', coalesce(earned.n, 0),
    'invoiced', coalesce(inv.v, 0), 'invoiced_count', coalesce(inv.n, 0),
    'collected', coalesce(paid.v, 0), 'collected_count', coalesce(paid.n, 0),
    'outstanding', coalesce(outst.v, 0), 'outstanding_overdue', coalesce(outst.overdue, 0),
    'outstanding_count', coalesce(outst.n, 0), 'part_paid_count', coalesce(outst.part_paid, 0)
  )) filter (where coalesce(pipe.n, booked.n, earned.n, inv.n, paid.n, outst.n) is not null), '{}'::jsonb)
  from cur
  left join pipe using (currency) left join booked using (currency) left join earned using (currency)
  left join inv using (currency) left join paid using (currency) left join outst using (currency)
$$;
revoke all on function public.revenue_summary(date, date, uuid) from public, anon;
grant execute on function public.revenue_summary(date, date, uuid) to authenticated;

-- Monthly forecast (earned + weighted pipeline by expected close) vs collected.
create or replace function public.revenue_by_month(p_from date, p_to date)
returns table (month date, currency char(3), weighted_pipeline numeric, earned numeric, invoiced numeric, collected numeric)
language sql stable security invoker set search_path = '' as $$
  with months as (select generate_series(date_trunc('month', p_from), date_trunc('month', p_to), interval '1 month')::date m),
  cur as (select distinct currency from public.opportunities union select distinct currency from public.invoices union select distinct currency from public.revenue_events)
  select months.m, cur.currency,
    coalesce((select sum(weighted_value) from public.opportunity_pipeline p where p.currency = cur.currency and p.stage not in ('won','lost')
               and date_trunc('month', p.expected_close_on) = months.m), 0),
    coalesce((select sum(amount) from public.revenue_events e where e.currency = cur.currency and e.status = 'earned' and e.archived_at is null
               and date_trunc('month', e.earned_on) = months.m), 0),
    coalesce((select sum(amount) from public.invoices i where i.currency = cur.currency and i.status = 'issued'
               and date_trunc('month', i.issued_on) = months.m), 0),
    coalesce((select sum(amount) from public.payments p where p.currency = cur.currency and p.reversed_at is null
               and date_trunc('month', p.received_on) = months.m), 0)
  from months cross join cur
  order by 1, 2
$$;
revoke all on function public.revenue_by_month(date, date) from public, anon;
grant execute on function public.revenue_by_month(date, date) to authenticated;

-- Earned status of placement fees is date-based: the scheduler refreshes it.
create or replace function public.refresh_placement_earnings()
returns integer language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not (private.is_trusted_backend() or private.is_admin()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  update public.placements p set updated_at = now()
   where p.archived_at is null and p.status <> 'fell_through' and p.fee_amount is not null
     and exists (select 1 from public.revenue_events e where e.placement_id = p.id and e.status = 'expected')
     and ((private.settings()).placement_earned_on = 'offer_accepted' and p.offer_accepted_on <= current_date
          or (private.settings()).placement_earned_on = 'joining' and p.joined_on <= current_date);
  get diagnostics n = row_count;
  return n;
end $$;
