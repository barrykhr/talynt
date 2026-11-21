import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeam, getTeamMap, displayName } from "@/lib/data/team";
import { isUuid, param, type SearchParams } from "@/lib/data/query";
import { Card, EmptyState, Notice, PageHeader, Table, Tabs, Td, Th } from "@/components/ui";
import { FilterBar } from "@/components/filter-bar";
import { InvoiceList, Measure, YieldTable } from "@/components/revenue";
import { IconRupee } from "@/components/icons";
import { FEE_BASES, REVENUE_DEFINITIONS, type FeeBasis } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { addDays, formatDate, todayInZone } from "@/lib/time";
import type { InvoiceBalance, Payment, RequirementRevenue } from "@/lib/types";

export const metadata: Metadata = { title: "Revenue" };

type Summary = Record<string, {
  pipeline_unweighted: number; pipeline_weighted: number; pipeline_count: number; pipeline_unvalued: number;
  booked: number; booked_count: number; earned: number; invoiced: number; collected: number;
  outstanding: number; outstanding_overdue: number; outstanding_count: number; part_paid_count: number;
}>;

const VIEWS = { overview: "Overview", receivables: "Receivables", yield: "Yield" } as const;
type View = keyof typeof VIEWS;
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export default async function RevenuePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireMemberPage();
  const sp = await searchParams;
  const view = (param(sp, "view") in VIEWS ? param(sp, "view") : "overview") as View;
  const today = todayInZone();
  const from = isDate(param(sp, "from")) ? param(sp, "from") : addDays(today, -364);
  const to = isDate(param(sp, "to")) ? param(sp, "to") : today;
  const owner = isUuid(param(sp, "owner")) ? param(sp, "owner") : null;
  const supabase = await createClient();
  const [{ data: sumData }, { data: months }, teamList, team] = await Promise.all([
    supabase.rpc("revenue_summary", { p_from: from, p_to: to, p_owner: owner }),
    supabase.rpc("revenue_by_month", { p_from: addDays(today, -150), p_to: addDays(today, 180) }),
    getTeam(), getTeamMap(),
  ]);
  const summary = (sumData ?? {}) as Summary;
  const currencies = Object.keys(summary).sort((a, b) => (a === "INR" ? -1 : b === "INR" ? 1 : a.localeCompare(b)));
  const monthRows = ((months ?? []) as { month: string; currency: string; weighted_pipeline: number; earned: number; invoiced: number; collected: number }[])
    .filter((m) => Number(m.weighted_pipeline) || Number(m.earned) || Number(m.invoiced) || Number(m.collected));

  let invoices: InvoiceBalance[] = [], payments: Payment[] = [], yieldRows: RequirementRevenue[] = [];
  if (view === "receivables") {
    const filter = param(sp, "state");
    let q = supabase.from("invoice_balances").select("*").order("due_on").limit(200);
    if (filter === "overdue") q = q.eq("is_overdue", true);
    else if (filter !== "all") q = q.gt("outstanding", 0);
    invoices = ((await q).data ?? []) as InvoiceBalance[];
    const ids = invoices.map((i) => i.id);
    payments = ids.length ? (((await supabase.from("payments").select("*").in("invoice_id", ids)).data ?? []) as Payment[]) : [];
  }
  if (view === "yield") {
    yieldRows = (((await supabase.from("requirement_revenue").select("*").order("collected", { ascending: false }).limit(200)).data ?? []) as RequirementRevenue[])
      .filter((r) => r.estimated_fee || r.earned || r.invoiced || r.collected);
  }
  const companyIds = [...new Set([...invoices.map((i) => i.company_id), ...yieldRows.map((r) => r.company_id)])];
  const { data: cos } = companyIds.length ? await supabase.from("companies").select("id, name").in("id", companyIds) : { data: [] };
  const names = new Map((cos ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));

  const aging = ["current", "1-30", "31-60", "61-90", "90+"];

  return (
    <>
      <PageHeader title="Revenue" description="Six separate measures — a won deal is not booked revenue, a placement is not an invoice, and an invoice is not cash. Operational CRM reporting, not accounting." />
      <Tabs label="Revenue views" current={view} tabs={(Object.keys(VIEWS) as View[]).map((v) => ({ key: v, label: VIEWS[v], href: `/revenue?view=${v}` }))} />

      {view === "overview" ? (
        <>
          <FilterBar action="/revenue" fields={[
            { name: "from", label: "From", type: "date", value: param(sp, "from") ? from : "" },
            { name: "to", label: "To", type: "date", value: param(sp, "to") ? to : "" },
            { name: "owner", label: "Owner", type: "select", value: owner ?? "", placeholder: "Everyone", options: teamList.map((m) => ({ value: m.id, label: displayName(m) })) },
          ]} summary={<>Period <strong className="font-medium text-ink-soft">{formatDate(from)} – {formatDate(to)}</strong>{!param(sp, "from") ? " (last 12 months)" : ""} · Owner: {owner ? displayName(team.get(owner)) : "Everyone"} · amounts shown per currency, never converted</>} />
          {currencies.length === 0 ? (
            <div className="card"><EmptyState icon={<IconRupee />} title="No revenue recorded yet"
              description="Add an estimated value to opportunities, fee terms to requirements, then record placements, invoices and payments. Each measure fills in from those records." /></div>
          ) : currencies.map((c) => {
            const s = summary[c];
            return (
              <section key={c} className="mb-6" aria-label={`Revenue in ${c}`}>
                <h2 className="mb-2 text-sm font-semibold">{c}</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  <Measure label="Pipeline (weighted)" value={formatMoney(s.pipeline_weighted, c)} sub={`${formatMoney(s.pipeline_unweighted, c)} unweighted · ${s.pipeline_count} open${s.pipeline_unvalued ? `, ${s.pipeline_unvalued} without a value` : ""}`} definition={REVENUE_DEFINITIONS.pipeline} />
                  <Measure label="Booked" value={formatMoney(s.booked, c)} sub={`${s.booked_count} requirement(s)`} definition={REVENUE_DEFINITIONS.booked} />
                  <Measure label="Earned" value={formatMoney(s.earned, c)} definition={REVENUE_DEFINITIONS.earned} />
                  <Measure label="Invoiced" value={formatMoney(s.invoiced, c)} definition={REVENUE_DEFINITIONS.invoiced} />
                  <Measure label="Realized (cash collected)" value={formatMoney(s.collected, c)} definition={REVENUE_DEFINITIONS.realized} tone="ok" />
                  <Measure label="Outstanding (today)" value={formatMoney(s.outstanding, c)} sub={`${formatMoney(s.outstanding_overdue, c)} overdue · ${s.part_paid_count} part-paid`} definition={REVENUE_DEFINITIONS.outstanding} tone={s.outstanding_overdue > 0 ? "warn" : undefined} />
                </div>
              </section>
            );
          })}
          <Card title="Forecast vs collected by month" bodyClassName="p-0">
            <p className="px-4 pt-3 text-xs text-muted">Weighted pipeline by expected close month; earned, invoiced and collected by their own dates. Five months back, six ahead.</p>
            {monthRows.length === 0 ? <p className="p-4 text-sm text-faint">Nothing to show yet.</p> : (
              <Table caption="Monthly revenue">
                <thead><tr><Th>Month</Th><Th>Currency</Th><Th className="text-right">Weighted pipeline</Th><Th className="text-right">Earned</Th><Th className="text-right">Invoiced</Th><Th className="text-right">Collected</Th></tr></thead>
                <tbody>{monthRows.map((m) => (
                  <tr key={`${m.month}-${m.currency}`}>
                    <Td>{new Date(`${m.month.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</Td><Td>{m.currency}</Td>
                    <Td className="text-right tabular-nums">{formatMoney(m.weighted_pipeline, m.currency)}</Td><Td className="text-right tabular-nums">{formatMoney(m.earned, m.currency)}</Td>
                    <Td className="text-right tabular-nums">{formatMoney(m.invoiced, m.currency)}</Td><Td className="text-right tabular-nums">{formatMoney(m.collected, m.currency)}</Td>
                  </tr>
                ))}</tbody>
              </Table>
            )}
          </Card>
        </>
      ) : null}

      {view === "receivables" ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            {[["", "Outstanding"], ["overdue", "Overdue"], ["all", "All invoices"]].map(([k, l]) => (
              <Link key={k} href={`/revenue?view=receivables${k ? `&state=${k}` : ""}`} className={`rounded-full px-3 py-1 ${param(sp, "state") === k ? "bg-accent text-white" : "bg-sunken"}`}>{l}</Link>
            ))}
          </div>
          {invoices.length ? (
            <Card title="Payment aging (outstanding amounts)" className="mb-4" bodyClassName="p-0">
              <Table caption="Aging buckets">
                <thead><tr><Th>Currency</Th>{aging.map((a) => <Th key={a} className="text-right">{a === "current" ? "Not yet due" : `${a} days`}</Th>)}</tr></thead>
                <tbody>{[...new Set(invoices.map((i) => i.currency))].map((c) => (
                  <tr key={c}><Td>{c}</Td>{aging.map((a) => <Td key={a} className="text-right tabular-nums">{formatMoney(invoices.filter((i) => i.currency === c && i.aging_bucket === a).reduce((t, i) => t + Number(i.outstanding), 0), c)}</Td>)}</tr>
                ))}</tbody>
              </Table>
            </Card>
          ) : null}
          <InvoiceList invoices={invoices} payments={payments} back="/revenue?view=receivables" showLinks={names} />
        </>
      ) : null}

      {view === "yield" ? (
        yieldRows.length === 0 ? <div className="card"><EmptyState icon={<IconRupee />} title="No yield to show yet" description="Yield appears once requirements have fee terms and revenue records." /></div> : (
          <div className="space-y-6">
            <Card title="Yield by company" bodyClassName="p-0">
              <Table caption="Yield by company">
                <thead><tr><Th>Company</Th><Th>Currency</Th><Th className="text-right">Estimated</Th><Th className="text-right">Earned</Th><Th className="text-right">Collected</Th><Th>Fee bases</Th></tr></thead>
                <tbody>{[...new Set(yieldRows.map((r) => `${r.company_id}|${r.currency}`))].map((key) => {
                  const [cid, cur] = key.split("|");
                  const rs = yieldRows.filter((r) => r.company_id === cid && r.currency === cur);
                  const sum = (k: keyof RequirementRevenue) => rs.reduce((t, r) => t + Number(r[k] ?? 0), 0);
                  return (
                    <tr key={key}>
                      <Td><Link className="font-medium hover:underline" href={`/companies/${cid}#revenue`}>{names.get(cid)}</Link></Td><Td>{cur}</Td>
                      <Td className="text-right tabular-nums">{formatMoney(sum("estimated_fee"), cur)}</Td><Td className="text-right tabular-nums">{formatMoney(sum("earned"), cur)}</Td>
                      <Td className="text-right tabular-nums">{formatMoney(sum("collected"), cur)}</Td>
                      <Td className="text-xs">{[...new Set(rs.map((r) => r.fee_basis).filter(Boolean))].map((f) => FEE_BASES.label[f as FeeBasis]).join(", ") || "—"}</Td>
                    </tr>
                  );
                })}</tbody>
              </Table>
            </Card>
            <Card title="Yield by requirement" bodyClassName="p-0"><YieldTable rows={yieldRows} names={names} /></Card>
            <Notice tone="info">Yield = collected ÷ estimated fee for each requirement. Placement-level detail is on each requirement page.</Notice>
          </div>
        )
      ) : null}
    </>
  );
}
