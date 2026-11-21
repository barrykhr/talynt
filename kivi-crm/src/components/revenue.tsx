import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Table, Td, Th } from "@/components/ui";
import { Disclosure } from "@/components/forms";
import {
  CancelInvoiceButton, CreditButton, EarnButton, InvoiceForm, MilestoneForm, PaymentForm, PlacementForm, ReverseEventButton, ReversePaymentButton,
} from "@/components/revenue-forms";
import { FEE_BASES, PLACEMENT_STATUSES, REVENUE_DEFINITIONS, type FeeBasis } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/time";
import type { AppSettings, InvoiceBalance, Payment, Placement, Requirement, RequirementRevenue, RevenueEvent } from "@/lib/types";

export function Measure({ label, value, definition, tone, sub }: { label: string; value: string; definition: string; tone?: "ok" | "warn"; sub?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="text-[13px] text-muted">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold tabular-nums ${tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : ""}`}>{value}</div>
      {sub ? <div className="text-xs text-muted">{sub}</div> : null}
      <details className="mt-1 text-xs text-faint"><summary className="cursor-pointer">What counts?</summary><p className="mt-1">{definition}</p></details>
    </div>
  );
}

const PAY_TONE = { unpaid: "warn", part_paid: "info", paid: "ok", cancelled: "neutral" } as const;
export function InvoiceStateBadge({ inv }: { inv: InvoiceBalance }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Badge tone={PAY_TONE[inv.payment_state]}>{inv.payment_state === "part_paid" ? "Part-paid" : inv.payment_state[0].toUpperCase() + inv.payment_state.slice(1)}</Badge>
      {inv.is_overdue ? <Badge tone="danger">Overdue {inv.days_past_due}d</Badge> : null}
    </span>
  );
}

/** Commercial + revenue panel for one requirement: terms, placements, earned, invoices, payments. */
export async function RequirementRevenuePanel({ req, companyId, back }: { req: Requirement; companyId: string; back: string }) {
  const supabase = await createClient();
  const [rrRes, plRes, evRes, invRes, settingsRes, msaRes] = await Promise.all([
    supabase.from("requirement_revenue").select("*").eq("requirement_id", req.id).maybeSingle(),
    supabase.from("placements").select("*").eq("requirement_id", req.id).is("archived_at", null).order("offer_accepted_on"),
    supabase.from("revenue_events").select("*").eq("requirement_id", req.id).order("created_at"),
    supabase.from("invoice_balances").select("*").eq("requirement_id", req.id).order("issued_on", { ascending: false }),
    supabase.from("app_settings").select("*").maybeSingle(),
    supabase.from("companies").select("msa_status").eq("id", companyId).maybeSingle(),
  ]);
  const rr = rrRes.data as RequirementRevenue | null;
  const placements = (plRes.data ?? []) as Placement[];
  const events = (evRes.data ?? []) as RevenueEvent[];
  const invoices = (invRes.data ?? []) as InvoiceBalance[];
  const s = settingsRes.data as AppSettings | null;
  const invoiceIds = invoices.map((i) => i.id);
  const { data: payData } = invoiceIds.length ? await supabase.from("payments").select("*").in("invoice_id", invoiceIds).order("received_on") : { data: [] };
  const payments = (payData ?? []) as Payment[];
  const cur = req.currency;
  const conditions = [
    { ok: Boolean(req.computed_total_fee && req.computed_total_fee > 0), label: "Has an estimated fee", on: true },
    { ok: Boolean(req.client_accepted_at), label: "Client accepted the requirement", on: s?.booked_requires_accepted ?? true },
    { ok: Boolean(req.terms_agreed_at), label: "Commercial terms agreed", on: s?.booked_requires_terms ?? true },
    { ok: msaRes.data?.msa_status === "signed", label: "Company MSA signed", on: s?.booked_requires_msa ?? true },
    { ok: req.status !== "on_hold" && req.status !== "closed_filled", label: "Requirement is live", on: true },
  ].filter((c) => c.on);

  return (
    <Card title="Commercial terms & revenue" id="revenue">
      <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
        <div><span className="text-muted">Fee basis: </span>{req.fee_basis ? FEE_BASES.label[req.fee_basis as FeeBasis] : "Not set"}
          {req.fee_basis === "percent_first_year" && req.fee_percent ? ` · ${req.fee_percent}% of ${formatMoney(req.expected_compensation, cur)}` : ""}
          {req.fee_per_hire ? ` · ${formatMoney(req.fee_per_hire, cur)} per hire` : ""}</div>
        <div><span className="text-muted">Estimated total fee: </span><strong>{formatMoney(req.computed_total_fee, cur)}</strong>
          {req.probability !== null ? <span className="text-muted"> · {req.probability}% likely</span> : null}</div>
        {req.commercial_terms ? <p className="whitespace-pre-wrap text-ink-soft sm:col-span-2">{req.commercial_terms}</p> : null}
      </div>
      <div className="mb-4 rounded-md bg-sunken/60 p-3">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium">Booked? {rr?.is_booked ? <Badge tone="ok">Booked</Badge> : <Badge>Not booked</Badge>}</div>
        <ul className="grid gap-1 text-xs sm:grid-cols-2">
          {conditions.map((c) => <li key={c.label} className={c.ok ? "text-ok" : "text-muted"}>{c.ok ? "✓" : "○"} {c.label}</li>)}
        </ul>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Measure label="Earned" value={formatMoney(rr?.earned ?? 0, cur)} definition={REVENUE_DEFINITIONS.earned} sub={rr?.expected_earnings ? `${formatMoney(rr.expected_earnings, cur)} expected` : undefined} />
        <Measure label="Invoiced" value={formatMoney(rr?.invoiced ?? 0, cur)} definition={REVENUE_DEFINITIONS.invoiced} />
        <Measure label="Realized (collected)" value={formatMoney(rr?.collected ?? 0, cur)} definition={REVENUE_DEFINITIONS.realized} tone="ok" />
        <Measure label="Outstanding" value={formatMoney(rr?.outstanding ?? 0, cur)} definition={REVENUE_DEFINITIONS.outstanding} tone={(rr?.outstanding ?? 0) > 0 ? "warn" : undefined} />
      </div>

      <h3 className="mb-2 text-sm font-semibold">Placements · {placements.filter((p) => p.status !== "fell_through").length} of {req.hiring_volume}</h3>
      {placements.length ? (
        <ul className="mb-2 divide-y divide-line text-sm">
          {placements.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{p.label || "Placement"} · offer {formatDate(p.offer_accepted_on)}{p.joined_on ? ` · joined ${formatDate(p.joined_on)}` : ""}</span>
              <span className="flex items-center gap-2"><Badge tone={p.status === "joined" ? "ok" : p.status === "fell_through" ? "danger" : "info"}>{PLACEMENT_STATUSES.label[p.status]}</Badge>{formatMoney(p.fee_amount, p.currency)}
                <Disclosure summary="Edit"><PlacementForm requirementId={req.id} currency={cur} back={back} placement={p} /></Disclosure></span>
            </li>
          ))}
        </ul>
      ) : <p className="mb-2 text-sm text-faint">No placements yet. A placement on its own is not revenue received.</p>}
      <Disclosure summary="+ Record placement"><PlacementForm requirementId={req.id} currency={cur} back={back} /></Disclosure>

      <h3 className="mb-2 mt-5 text-sm font-semibold">Earned revenue events</h3>
      {events.length ? (
        <ul className="mb-2 divide-y divide-line text-sm">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{e.description ?? e.kind.replace(/_/g, " ")}{e.earned_on ? ` · met ${formatDate(e.earned_on)}` : ""}{e.reversal_reason ? <span className="text-xs text-muted"> · {e.reversal_reason}</span> : null}</span>
              <span className="flex items-center gap-2">
                <Badge tone={e.status === "earned" ? "ok" : e.status === "reversed" ? "neutral" : "info"}>{e.status}</Badge>
                <span className={e.status === "reversed" ? "line-through" : ""}>{formatMoney(e.amount, e.currency)}</span>
                {!e.placement_id && e.status === "expected" ? <EarnButton id={e.id} back={back} /> : null}
                {!e.placement_id && e.status !== "reversed" ? <ReverseEventButton id={e.id} back={back} /> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="mb-2 text-sm text-faint">Placement fees appear here automatically. Add retainer or margin milestones by hand.</p>}
      <Disclosure summary="+ Add milestone"><MilestoneForm requirementId={req.id} currency={cur} back={back} /></Disclosure>

      <h3 className="mb-2 mt-5 text-sm font-semibold">Invoices & payments</h3>
      <InvoiceList invoices={invoices} payments={payments} back={back} />
      <div className="mt-2"><Disclosure summary="+ Record invoice"><InvoiceForm companyId={companyId} requirementId={req.id} currency={cur} back={back} /></Disclosure></div>
      <p className="mt-3 text-xs text-muted">Operational CRM reporting, not accounting. Corrections are made by reversing or cancelling — history is kept.</p>
    </Card>
  );
}

export function InvoiceList({ invoices, payments, back, showLinks }: { invoices: InvoiceBalance[]; payments: Payment[]; back: string; showLinks?: Map<string, string> }) {
  if (!invoices.length) return <p className="text-sm text-faint">No invoices yet. An invoice is invoiced revenue — it becomes realized only when payment arrives.</p>;
  return (
    <ul className="space-y-3">
      {invoices.map((inv) => {
        const pays = payments.filter((p) => p.invoice_id === inv.id);
        return (
          <li key={inv.id} className="rounded-md border border-line p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-medium">{inv.invoice_number}{showLinks?.get(inv.company_id) ? <> · <Link className="link" href={`/companies/${inv.company_id}`}>{showLinks.get(inv.company_id)}</Link></> : null}</div>
                <div className="text-xs text-muted">Issued {formatDate(inv.issued_on)} · due {formatDate(inv.due_on)}{inv.status === "cancelled" ? ` · cancelled: ${inv.cancel_reason}` : ""}</div>
              </div>
              <div className="text-right">
                <div className="tabular-nums">{formatMoney(inv.amount, inv.currency)}</div>
                <InvoiceStateBadge inv={inv} />
              </div>
            </div>
            <div className="mt-1 text-xs text-muted">Paid {formatMoney(inv.paid, inv.currency)}{inv.credited ? ` · credited ${formatMoney(inv.credited, inv.currency)}` : ""} · outstanding <strong className="text-ink">{formatMoney(inv.outstanding, inv.currency)}</strong></div>
            {pays.length ? (
              <ul className="mt-2 space-y-1 text-xs">
                {pays.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className={p.reversed_at ? "text-muted line-through" : ""}>{formatDate(p.received_on)} · {formatMoney(p.amount, p.currency)}{p.reference ? ` · ${p.reference}` : ""}</span>
                    {p.reversed_at ? <span className="text-muted">reversed: {p.reversal_reason}</span> : <ReversePaymentButton id={p.id} back={back} />}
                  </li>
                ))}
              </ul>
            ) : null}
            {inv.status === "issued" && inv.outstanding > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Disclosure summary="Record payment"><PaymentForm invoiceId={inv.id} currency={inv.currency} outstanding={inv.outstanding} back={back} /></Disclosure>
                <CreditButton invoiceId={inv.id} back={back} />
                {inv.paid === 0 ? <CancelInvoiceButton id={inv.id} back={back} /> : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** Per-currency rollup of requirement revenue for a company or opportunity. */
export async function RevenueRollup({ companyId, opportunityId }: { companyId?: string; opportunityId?: string }) {
  const supabase = await createClient();
  let q = supabase.from("requirement_revenue").select("*");
  if (companyId) q = q.eq("company_id", companyId);
  if (opportunityId) q = q.eq("opportunity_id", opportunityId);
  const rows = ((await q).data ?? []) as RequirementRevenue[];
  let iq = supabase.from("invoice_balances").select("currency, outstanding, is_overdue, status, requirement_id");
  if (companyId) iq = iq.eq("company_id", companyId);
  const invoices = ((await iq).data ?? []) as Pick<InvoiceBalance, "currency" | "outstanding" | "is_overdue" | "status" | "requirement_id">[];
  const currencies = [...new Set(rows.map((r) => r.currency))];
  if (!currencies.length) return <p className="text-sm text-faint">No valued requirements yet.</p>;
  return (
    <div className="space-y-3">
      {currencies.map((c) => {
        const rs = rows.filter((r) => r.currency === c);
        const sum = (k: keyof RequirementRevenue) => rs.reduce((t, r) => t + Number(r[k] ?? 0), 0);
        const companyOutstanding = companyId ? invoices.filter((i) => i.currency === c && i.status === "issued").reduce((t, i) => t + Number(i.outstanding), 0) : sum("outstanding");
        return (
          <div key={c} className="grid grid-cols-2 gap-2">
            <Measure label={`Booked (${c})`} value={formatMoney(rs.filter((r) => r.is_booked).reduce((t, r) => t + Number(r.estimated_fee ?? 0), 0), c)} definition={REVENUE_DEFINITIONS.booked} />
            <Measure label="Earned" value={formatMoney(sum("earned"), c)} definition={REVENUE_DEFINITIONS.earned} />
            <Measure label="Invoiced" value={formatMoney(sum("invoiced"), c)} definition={REVENUE_DEFINITIONS.invoiced} />
            <Measure label="Realized" value={formatMoney(sum("collected"), c)} definition={REVENUE_DEFINITIONS.realized} tone="ok" />
            <Measure label="Outstanding" value={formatMoney(companyOutstanding, c)} definition={REVENUE_DEFINITIONS.outstanding} tone={companyOutstanding > 0 ? "warn" : undefined} />
          </div>
        );
      })}
    </div>
  );
}

export function YieldTable({ rows, names }: { rows: RequirementRevenue[]; names: Map<string, string> }) {
  return (
    <Table caption="Revenue yield by requirement">
      <thead><tr><Th>Requirement</Th><Th>Fee basis</Th><Th className="text-right">Estimated</Th><Th className="text-right">Earned</Th><Th className="text-right">Invoiced</Th><Th className="text-right">Collected</Th><Th className="text-right">Yield</Th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.requirement_id}>
            <Td><Link className="font-medium hover:underline" href={`/requirements/${r.requirement_id}`}>{r.role_title}</Link><div className="text-xs text-muted">{names.get(r.company_id)}</div></Td>
            <Td className="text-xs">{r.fee_basis ? FEE_BASES.label[r.fee_basis as FeeBasis] : "—"}</Td>
            <Td className="text-right tabular-nums">{formatMoney(r.estimated_fee, r.currency)}</Td>
            <Td className="text-right tabular-nums">{formatMoney(r.earned, r.currency)}</Td>
            <Td className="text-right tabular-nums">{formatMoney(r.invoiced, r.currency)}</Td>
            <Td className="text-right tabular-nums">{formatMoney(r.collected, r.currency)}</Td>
            <Td className="text-right tabular-nums" >{r.estimated_fee ? `${Math.round((Number(r.collected) / Number(r.estimated_fee)) * 100)}%` : "—"}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
