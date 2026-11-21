import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Notice } from "@/components/ui";
import { InlineAction, Disclosure } from "@/components/forms";
import { ManualSignalForm, MonitorForm, RefreshMonitorButton } from "@/components/signal-forms";
import { reviewSignal } from "@/lib/actions/research";
import { SIGNAL_TYPES, type SignalType } from "@/lib/constants";
import { daysSince, formatDate, formatDateTime, formatRelative } from "@/lib/time";
import type { CompanyMonitor, CompanySignal } from "@/lib/types";

export function SignalItem({ s, back, companyName }: { s: CompanySignal; back: string; companyName?: string }) {
  return (
    <li className={`rounded-md border border-line p-3 ${s.review_state === "dismissed" ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="accent">{SIGNAL_TYPES.label[s.signal_type as SignalType] ?? s.signal_type}</Badge>
        <Badge tone={s.confidence === "high" ? "ok" : s.confidence === "medium" ? "neutral" : "warn"}>{s.confidence} confidence</Badge>
        {s.review_state === "new" ? <Badge tone="info">New</Badge> : <Badge>{s.review_state}</Badge>}
        {companyName ? <span className="text-xs font-medium text-ink-soft">{companyName}</span> : null}
      </div>
      <p className="mt-1.5 text-sm">{s.summary}</p>
      <div className="mt-1 text-xs text-muted">
        {s.source_url ? <a className="link" href={s.source_url} target="_blank" rel="noopener noreferrer nofollow">{s.source_title ?? s.source_url}</a> : <span>{s.source_title ?? s.provider}</span>}
        <span> · via {s.provider}</span>
        <span> · published {s.published_at ? formatDate(s.published_at) : "date unknown"}</span>
        <span> · first seen {formatDate(s.first_seen_at)} · last checked {formatRelative(s.last_checked_at)}</span>
      </div>
      {s.review_state === "new" ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <InlineAction action={reviewSignal} hidden={{ id: s.id, action: "accept", back }} variant="subtle">Accept</InlineAction>
          <InlineAction action={reviewSignal} hidden={{ id: s.id, action: "task", back }} variant="secondary">Create follow-up task</InlineAction>
          <InlineAction action={reviewSignal} hidden={{ id: s.id, action: "dismiss", back }}>Dismiss</InlineAction>
        </div>
      ) : s.task_id ? <p className="mt-1 text-xs text-muted">Follow-up task created.</p> : null}
    </li>
  );
}

export async function SignalsPanel({ companyId, back }: { companyId: string; back: string }) {
  const supabase = await createClient();
  const [{ data: mon }, { data: sigs }, { data: settings }] = await Promise.all([
    supabase.from("company_monitors").select("*").eq("company_id", companyId).maybeSingle(),
    supabase.from("company_signals").select("*").eq("company_id", companyId).order("first_seen_at", { ascending: false }).limit(20),
    supabase.from("app_settings").select("monitoring_enabled, monitoring_default_cadence_days").maybeSingle(),
  ]);
  const monitor = mon as CompanyMonitor | null;
  const signals = (sigs ?? []) as CompanySignal[];
  const stale = monitor?.enabled && daysSince(monitor.last_success_at) > 2 * monitor.cadence_days;

  return (
    <Card title="Public signals & monitoring" id="signals">
      {settings && !settings.monitoring_enabled ? <div className="mb-3"><Notice tone="warn">Monitoring is paused for the whole workspace (Settings → Workspace).</Notice></div> : null}
      {monitor ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>
            {monitor.enabled ? `Checked every ${monitor.cadence_days} day(s)` : "Paused"}
            {" · "}last successful check {monitor.last_success_at ? formatRelative(monitor.last_success_at) : "never"}
            {monitor.enabled ? ` · next ${formatDateTime(monitor.next_run_at)}` : ""}
          </span>
          <span className="flex items-center gap-2">
            {monitor.status === "error" ? <Badge tone="danger">Sources failing</Badge> : monitor.status === "partial" ? <Badge tone="warn">Some sources failing</Badge> : null}
            {stale ? <Badge tone="warn">Stale</Badge> : null}
            <RefreshMonitorButton companyId={companyId} back={back} />
          </span>
        </div>
      ) : (
        <p className="mb-3 text-sm text-muted">Not monitored. Add public sources (a Greenhouse or Lever job board, the company newsroom RSS feed) to get a weekly check. LinkedIn is never scraped.</p>
      )}
      {monitor?.last_error ? <div className="mb-3"><Notice tone="warn" title="Last check had problems">{monitor.last_error}</Notice></div> : null}
      <div className="mb-3 flex flex-wrap gap-2">
        <Disclosure summary={monitor ? "Monitoring settings" : "Set up monitoring"}>
          <MonitorForm companyId={companyId} back={back} monitor={monitor} defaultCadence={settings?.monitoring_default_cadence_days ?? 7} />
        </Disclosure>
        <Disclosure summary="Add a signal by hand"><ManualSignalForm companyId={companyId} back={back} /></Disclosure>
      </div>
      {signals.length === 0 ? <p className="text-sm text-faint">No signals recorded.</p> : (
        <ul className="space-y-2">{signals.map((s) => <SignalItem key={s.id} s={s} back={back} />)}</ul>
      )}
      <p className="mt-3 text-xs text-muted">Signals come only from the sources listed. They may be incomplete and are not real-time. Job postings show hiring activity, not completed hires.</p>
    </Card>
  );
}
