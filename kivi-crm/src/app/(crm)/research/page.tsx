import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid, param, type SearchParams } from "@/lib/data/query";
import { activeProvider, PROVIDERS } from "@/lib/research/providers";
import { Badge, Card, EmptyState, LinkButton, Notice, PageHeader, Tabs } from "@/components/ui";
import { SignalItem } from "@/components/signals";
import { FindingCard } from "@/components/research-panel";
import { IconRadar } from "@/components/icons";
import { formatRelative } from "@/lib/time";
import type { CompanyMonitor, CompanySignal, ResearchFinding, ResearchJob } from "@/lib/types";

export const metadata: Metadata = { title: "Research updates" };

const VIEWS = { signals: "New signals", findings: "Findings to review", history: "Reviewed history", health: "Sources & jobs" } as const;
type View = keyof typeof VIEWS;

export default async function ResearchUpdatesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireMemberPage();
  const sp = await searchParams;
  const view = (param(sp, "view") in VIEWS ? param(sp, "view") : "signals") as View;
  const company = isUuid(param(sp, "company")) ? param(sp, "company") : null;
  const supabase = await createClient();
  const back = "/research";

  let signals: CompanySignal[] = [];
  let findings: ResearchFinding[] = [];
  let jobs: ResearchJob[] = [];
  let monitors: CompanyMonitor[] = [];
  if (view === "signals" || view === "history") {
    let q = supabase.from("company_signals").select("*").order("first_seen_at", { ascending: false }).limit(50);
    q = view === "signals" ? q.eq("review_state", "new") : q.neq("review_state", "new");
    if (company) q = q.eq("company_id", company);
    signals = ((await q).data ?? []) as CompanySignal[];
  }
  if (view === "findings") {
    let q = supabase.from("research_findings").select("*").eq("review_state", "pending").order("retrieved_at", { ascending: false }).limit(50);
    if (company) q = q.eq("company_id", company);
    findings = ((await q).data ?? []) as ResearchFinding[];
  }
  if (view === "health") {
    [jobs, monitors] = await Promise.all([
      supabase.from("research_jobs").select("*").order("created_at", { ascending: false }).limit(20).then((r) => (r.data ?? []) as ResearchJob[]),
      supabase.from("company_monitors").select("*").order("next_run_at").limit(100).then((r) => (r.data ?? []) as CompanyMonitor[]),
    ]);
  }
  const ids = [...new Set([...signals, ...findings, ...jobs, ...monitors].map((x) => x.company_id))];
  const { data: cos } = ids.length ? await supabase.from("companies").select("id, name").in("id", ids) : { data: [] };
  const names = new Map((cos ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
  const [{ count: newCount }, { count: pendingCount }] = await Promise.all([
    supabase.from("company_signals").select("id", { count: "exact", head: true }).eq("review_state", "new"),
    supabase.from("research_findings").select("id", { count: "exact", head: true }).eq("review_state", "pending"),
  ]);
  const provider = activeProvider();

  return (
    <>
      <PageHeader title="Research updates" description="Review what research and monitoring found before it touches a record. Nothing here sends a message to anyone." />
      <Tabs label="Research views" current={view} tabs={(Object.keys(VIEWS) as View[]).map((v) => ({
        key: v, label: VIEWS[v], href: `/research?view=${v}${company ? `&company=${company}` : ""}`,
        count: v === "signals" ? newCount ?? 0 : v === "findings" ? pendingCount ?? 0 : undefined,
      }))} />
      {company ? <p className="mb-3 text-sm text-muted">Showing {names.get(company) ?? "one company"} only. <Link className="link" href={`/research?view=${view}`}>Show all</Link></p> : null}

      {view === "signals" || view === "history" ? (
        signals.length === 0 ? (
          <div className="card"><EmptyState icon={<IconRadar />} title={view === "signals" ? "No new signals" : "Nothing reviewed yet"}
            description="Turn on monitoring from a company page (public job boards and newsroom feeds), or add a signal by hand with its source."
            actions={<LinkButton href="/companies">Go to companies</LinkButton>} /></div>
        ) : <ul className="space-y-2">{signals.map((s) => <SignalItem key={s.id} s={s} back={back} companyName={names.get(s.company_id)} />)}</ul>
      ) : null}

      {view === "findings" ? (
        findings.length === 0 ? (
          <div className="card"><EmptyState icon={<IconRadar />} title="No findings waiting"
            description={provider ? "Run “Research company” from any company page. Findings land here for review." : "Research isn't configured yet — see Sources & jobs."} /></div>
        ) : (
          <div className="space-y-4">
            {[...new Set(findings.map((f) => f.company_id))].map((cid) => (
              <Card key={cid} title={<Link className="hover:underline" href={`/companies/${cid}#research`}>{names.get(cid)}</Link>}>
                <ul className="space-y-2">{findings.filter((f) => f.company_id === cid).map((f) => <FindingCard key={f.id} f={f} back={back} />)}</ul>
              </Card>
            ))}
          </div>
        )
      ) : null}

      {view === "health" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Research providers">
            <ul className="space-y-2 text-sm">
              {PROVIDERS.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span>{p.label}</span>
                  {p.configured() ? <Badge tone={provider?.id === p.id ? "ok" : "neutral"}>{provider?.id === p.id ? "In use" : "Configured"}</Badge> : <Badge tone="warn">Needs {p.missingConfig().join(", ")}</Badge>}
                </li>
              ))}
            </ul>
            {!provider ? <div className="mt-3"><Notice tone="warn">No provider configured — research is unavailable. See docs/RESEARCH.md.</Notice></div> : null}
          </Card>
          <Card title="Recent research jobs">
            {jobs.length === 0 ? <p className="text-sm text-faint">None yet.</p> : (
              <ul className="divide-y divide-line text-sm">
                {jobs.map((j) => (
                  <li key={j.id} className="flex items-center justify-between gap-2 py-2">
                    <span><Link className="hover:underline" href={`/companies/${j.company_id}#research`}>{names.get(j.company_id)}</Link> <span className="text-xs text-muted">· {j.provider} · {formatRelative(j.created_at)}</span>
                      {j.error ? <span className="block text-xs text-danger">{j.error}</span> : null}</span>
                    <Badge tone={j.status === "succeeded" ? "ok" : j.status === "failed" ? "danger" : "info"}>{j.status}{j.attempts > 1 ? ` · ${j.attempts} tries` : ""}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Monitored companies" className="lg:col-span-2">
            {monitors.length === 0 ? <p className="text-sm text-faint">No companies are monitored yet.</p> : (
              <ul className="divide-y divide-line text-sm">
                {monitors.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <Link className="hover:underline" href={`/companies/${m.company_id}#signals`}>{names.get(m.company_id)}</Link>
                    <span className="flex items-center gap-2 text-xs text-muted">
                      every {m.cadence_days}d · last success {m.last_success_at ? formatRelative(m.last_success_at) : "never"}
                      <Badge tone={!m.enabled ? "neutral" : m.status === "error" ? "danger" : m.status === "partial" ? "warn" : "ok"}>{m.enabled ? m.status : "paused"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}
    </>
  );
}
