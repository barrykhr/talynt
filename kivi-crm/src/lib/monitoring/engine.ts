import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";
import { safeFetch } from "./fetch";
import { collect, toRunPayload, type MonitorSources } from "./providers";

export interface MonitorRunResult { status: "succeeded" | "failed" | "skipped"; providers: number; failed: number; newSignals: number; error?: string }

/**
 * Runs one company monitor. Idempotent: the run key is the scheduled window
 * (or the minute, for manual refreshes), so overlapping schedulers or retries
 * never produce a second run or duplicate signals.
 */
export async function runMonitor(monitorId: string, trigger: "schedule" | "manual"): Promise<MonitorRunResult> {
  const admin = createAdminClient();
  const { data: m } = await admin.from("company_monitors")
    .select("id, company_id, enabled, sources, next_run_at, last_success_at, cadence_days, companies(domain)").eq("id", monitorId).single();
  if (!m) return { status: "skipped", providers: 0, failed: 0, newSignals: 0, error: "Monitor not found" };
  const key = trigger === "schedule" ? `${m.id}:schedule:${m.next_run_at}` : `${m.id}:manual:${new Date().toISOString().slice(0, 16)}`;
  const { data: runId, error: startErr } = await admin.rpc("start_monitor_run", { p_monitor: m.id, p_trigger: trigger, p_key: key });
  if (startErr) return { status: "failed", providers: 0, failed: 0, newSignals: 0, error: "Could not start the run" };
  if (!runId) return { status: "skipped", providers: 0, failed: 0, newSignals: 0 };

  const since = new Date(Math.max(Date.parse(m.last_success_at ?? "") || 0, Date.now() - 30 * 86_400_000));
  const results = await collect(m.sources as MonitorSources, {
    companyDomain: (m.companies as unknown as { domain: string | null } | null)?.domain ?? null, since, fetcher: safeFetch,
  });
  const payload = toRunPayload(results);
  const { data: newSignals, error } = await admin.rpc("finish_monitor_run", {
    p_run: runId, p_observations: payload.observations, p_providers: payload.providers, p_signals: payload.signals,
  });
  if (error) {
    await admin.from("monitor_runs").update({ status: "failed", finished_at: new Date().toISOString(), error: "Saving results failed" }).eq("id", runId);
    log.error("monitor.finish_failed", { monitorId, code: error.code });
    return { status: "failed", providers: results.length, failed: results.length, newSignals: 0, error: "Saving results failed" };
  }
  const failed = results.filter((r) => !r.ok).length;
  log.info("monitor.run", { monitorId, trigger, providers: results.length, failed, newSignals });
  return {
    status: results.length > 0 && failed === results.length ? "failed" : "succeeded",
    providers: results.length, failed, newSignals: Number(newSignals ?? 0),
    error: results.filter((r) => !r.ok).map((r) => `${r.provider}: ${r.error}`).join("; ") || undefined,
  };
}

/** Called by the scheduler: runs monitors that are due, unless disabled globally. */
export async function runDueMonitors(limit = 10) {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("app_settings").select("monitoring_enabled").maybeSingle();
  if (settings && !settings.monitoring_enabled) return { ran: 0, disabled: true };
  const { data } = await admin.from("company_monitors").select("id").eq("enabled", true)
    .lte("next_run_at", new Date().toISOString()).order("next_run_at").limit(limit);
  let ran = 0;
  for (const row of data ?? []) {
    const r = await runMonitor(row.id, "schedule");
    if (r.status !== "skipped") ran++;
  }
  return { ran, disabled: false };
}
