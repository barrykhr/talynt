import type { Metadata } from "next";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeam, getTeamMap, displayName } from "@/lib/data/team";
import { isUuid, param, type SearchParams } from "@/lib/data/query";
import { Card, EmptyState, PageHeader, Stat, Table, Td, Th } from "@/components/ui";
import { FilterBar } from "@/components/filter-bar";
import { IconChart } from "@/components/icons";
import {
  CLIENT_STATUS_LABEL, LEAD_SOURCES, MSA_STATUSES, OPPORTUNITY_STAGES, REQUIREMENT_STATUSES,
  type ClientStatus, type LeadSource, type MsaStatus, type OpportunityStage, type RequirementStatus,
} from "@/lib/constants";
import { addDays, formatDate, todayInZone } from "@/lib/time";

export const metadata: Metadata = { title: "Reports" };

interface Report {
  pipeline_by_stage_owner: { stage: OpportunityStage; owner_id: string | null; count: number }[];
  by_source: { source: LeadSource | "unknown"; total: number; won: number; lost: number }[];
  conversion: { created: number; contacted: number; qualified: number; proposal: number; won: number; lost: number };
  overdue_follow_ups: { opportunities: number; tasks: number };
  client_status: Partial<Record<ClientStatus, number>>;
  requirement_status: { status: RequirementStatus; count: number; volume: number; filled: number }[];
  msa_status: Partial<Record<MsaStatus, number>>;
}

const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

function Bar({ value, max, tone = "accent" }: { value: number; max: number; tone?: "accent" | "ok" | "muted" }) {
  return (
    <span className="block h-2 w-full rounded-full bg-sunken" aria-hidden>
      <span className={`block h-full rounded-full ${tone === "ok" ? "bg-ok" : tone === "muted" ? "bg-line-strong" : "bg-accent"}`} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </span>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireMemberPage();
  const sp = await searchParams;
  const today = todayInZone();
  const from = isDate(param(sp, "from")) ? param(sp, "from") : addDays(today, -89);
  const to = isDate(param(sp, "to")) ? param(sp, "to") : today;
  const owner = isUuid(param(sp, "owner")) ? param(sp, "owner") : "";
  const supabase = await createClient();
  const [{ data, error }, teamList, team] = await Promise.all([
    supabase.rpc("report_summary", { p_from: from, p_to: to, p_owner: owner || null, p_today: today }),
    getTeam(), getTeamMap(),
  ]);
  const r = (data ?? null) as Report | null;
  const ownerLabel = owner ? displayName(team.get(owner)) : "Everyone";

  const scopeNote = (
    <>
      Opportunities <strong className="font-medium text-ink-soft">created {formatDate(from)} – {formatDate(to)}</strong> · Owner: <strong className="font-medium text-ink-soft">{ownerLabel}</strong>
    </>
  );

  // Pipeline matrix: stage × owner
  const owners = [...new Set((r?.pipeline_by_stage_owner ?? []).map((x) => x.owner_id ?? "none"))];
  const cell = (stage: OpportunityStage, o: string) =>
    (r?.pipeline_by_stage_owner ?? []).find((x) => x.stage === stage && (x.owner_id ?? "none") === o)?.count ?? 0;
  const stageTotal = (stage: OpportunityStage) => owners.reduce((s, o) => s + cell(stage, o), 0);
  const maxStage = Math.max(1, ...OPPORTUNITY_STAGES.values.map(stageTotal));
  const sources = [...(r?.by_source ?? [])].sort((a, b) => b.total - a.total);
  const maxSource = Math.max(1, ...sources.map((s) => s.total));
  const c = r?.conversion ?? { created: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0 };

  return (
    <>
      <PageHeader title="Reports" description="Every number below states exactly what it includes. Change the date range or owner to refine." />
      <FilterBar
        action="/reports"
        fields={[
          { name: "from", label: "Created from", type: "date", value: param(sp, "from") ? from : "" },
          { name: "to", label: "Created to", type: "date", value: param(sp, "to") ? to : "" },
          { name: "owner", label: "Owner", type: "select", value: owner, placeholder: "Everyone", options: teamList.map((m) => ({ value: m.id, label: displayName(m) })) },
        ]}
        summary={<>{scopeNote}{!param(sp, "from") ? " (default: last 90 days)" : ""}</>}
      />

      {error || !r ? (
        <p role="alert" className="text-sm text-danger">Reports couldn&apos;t be loaded. Please refresh.</p>
      ) : c.created === 0 && Object.keys(r.client_status).length === 0 ? (
        <div className="card"><EmptyState icon={<IconChart />} title="Nothing to report yet" description="Reports fill in as you add companies, opportunities and requirements." /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Opportunities created" value={c.created} hint="In the selected range" />
            <Stat label="Win rate" value={pct(c.won, c.won + c.lost)} hint={`${c.won} won · ${c.lost} lost (closed deals only)`} />
            <Stat label="Overdue follow-ups" value={r.overdue_follow_ups.opportunities + r.overdue_follow_ups.tasks} hint={`${r.overdue_follow_ups.opportunities} deals · ${r.overdue_follow_ups.tasks} tasks · as of today, any creation date`} tone={r.overdue_follow_ups.opportunities + r.overdue_follow_ups.tasks > 0 ? "warn" : undefined} />
            <Stat label="Active clients" value={r.client_status.active_client ?? 0} hint="MSA signed + live requirement · current" />
          </div>

          <Card title="Conversion funnel" id="funnel">
            <p className="mb-3 text-xs text-muted">Of opportunities created in range, how many ever reached each stage (from stage history).</p>
            <ul className="space-y-2">
              {([["Created", c.created], ["Reached Contacted", c.contacted], ["Reached Qualified", c.qualified], ["Reached Proposal / MSA", c.proposal], ["Won", c.won]] as [string, number][]).map(([label, n]) => (
                <li key={label} className="grid grid-cols-[170px_1fr_90px] items-center gap-3 text-sm">
                  <span className="text-ink-soft">{label}</span>
                  <Bar value={n} max={Math.max(1, c.created)} tone={label === "Won" ? "ok" : "accent"} />
                  <span className="text-right tabular-nums">{n} <span className="text-xs text-muted">{pct(n, c.created)}</span></span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Pipeline by stage and owner" bodyClassName="p-0" id="by-stage">
            <p className="px-4 pt-3 text-xs text-muted">Current stage of opportunities created in range.</p>
            <Table caption="Pipeline by stage and owner">
              <thead>
                <tr><Th>Stage</Th>{owners.map((o) => <Th key={o} className="text-right">{o === "none" ? "Unassigned" : displayName(team.get(o))}</Th>)}<Th className="text-right">Total</Th><Th className="w-1/4"><span className="sr-only">Share</span></Th></tr>
              </thead>
              <tbody>
                {OPPORTUNITY_STAGES.values.map((s) => (
                  <tr key={s}>
                    <Td>{OPPORTUNITY_STAGES.label[s]}</Td>
                    {owners.map((o) => <Td key={o} className="text-right tabular-nums">{cell(s, o) || <span className="text-faint">0</span>}</Td>)}
                    <Td className="text-right font-medium tabular-nums">{stageTotal(s)}</Td>
                    <Td><Bar value={stageTotal(s)} max={maxStage} tone={s === "won" ? "ok" : s === "lost" ? "muted" : "accent"} /></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Lead source performance" bodyClassName="p-0" id="sources">
              <p className="px-4 pt-3 text-xs text-muted">Opportunities created in range, by source.</p>
              <Table caption="Lead sources">
                <thead><tr><Th>Source</Th><Th className="text-right">Total</Th><Th className="text-right">Won</Th><Th className="text-right">Win rate</Th><Th className="w-1/4"><span className="sr-only">Share</span></Th></tr></thead>
                <tbody>
                  {sources.length === 0 ? <tr><Td className="text-muted">No opportunities in range.</Td></tr> : sources.map((s) => (
                    <tr key={s.source}>
                      <Td>{s.source === "unknown" ? "Not recorded" : LEAD_SOURCES.label[s.source]}</Td>
                      <Td className="text-right tabular-nums">{s.total}</Td>
                      <Td className="text-right tabular-nums">{s.won}</Td>
                      <Td className="text-right tabular-nums">{pct(s.won, s.won + s.lost)}</Td>
                      <Td><Bar value={s.total} max={maxSource} /></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>

            <Card title="Clients & MSA (current)" id="clients">
              <p className="mb-3 text-xs text-muted">All non-archived companies{owner ? " owned by this person" : ""}, today. Not limited by date range.</p>
              <dl className="grid grid-cols-2 gap-3">
                {(Object.keys(CLIENT_STATUS_LABEL) as ClientStatus[]).map((k) => (
                  <div key={k} className="rounded-md bg-sunken/60 p-3"><dt className="text-xs text-muted">{CLIENT_STATUS_LABEL[k]}</dt><dd className="text-lg font-semibold tabular-nums">{r.client_status[k] ?? 0}</dd></div>
                ))}
                {MSA_STATUSES.values.map((k) => (
                  <div key={k} className="rounded-md bg-sunken/60 p-3"><dt className="text-xs text-muted">MSA {MSA_STATUSES.label[k].toLowerCase()}</dt><dd className="text-lg font-semibold tabular-nums">{r.msa_status[k] ?? 0}</dd></div>
                ))}
              </dl>
            </Card>
          </div>

          <Card title="Requirement delivery (current)" bodyClassName="p-0" id="requirements">
            <p className="px-4 pt-3 text-xs text-muted">All non-archived requirements{owner ? " owned by this person" : ""}, today. Not limited by date range.</p>
            <Table caption="Requirements by status">
              <thead><tr><Th>Status</Th><Th className="text-right">Requirements</Th><Th className="text-right">Hiring volume</Th><Th className="text-right">Placed</Th><Th className="text-right">Fill rate</Th></tr></thead>
              <tbody>
                {REQUIREMENT_STATUSES.values.map((s) => {
                  const row = r.requirement_status.find((x) => x.status === s);
                  return (
                    <tr key={s}>
                      <Td>{REQUIREMENT_STATUSES.label[s]}</Td>
                      <Td className="text-right tabular-nums">{row?.count ?? 0}</Td>
                      <Td className="text-right tabular-nums">{row?.volume ?? 0}</Td>
                      <Td className="text-right tabular-nums">{row?.filled ?? 0}</Td>
                      <Td className="text-right tabular-nums">{pct(row?.filled ?? 0, row?.volume ?? 0)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </div>
      )}
    </>
  );
}
