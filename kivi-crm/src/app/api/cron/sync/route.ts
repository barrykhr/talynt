import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { googleConfig } from "@/lib/env";
import { log } from "@/lib/log";
import { runSync } from "@/lib/google/sync";
import { runDueResearchJobs } from "@/lib/research/runner";
import { runDueMonitors } from "@/lib/monitoring/engine";
import type { GoogleProduct } from "@/lib/google/scopes";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Scheduled maintenance (see vercel.json). Protected by CRON_SECRET; returns
// only counts. Each step is independent so one failure never blocks the rest.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "";
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const ok = secret.length >= 16 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const started = Date.now();
  const admin = createAdminClient();
  const report: Record<string, unknown> = {};
  const step = async (name: string, fn: () => Promise<unknown>) => {
    try {
      report[name] = await fn();
    } catch (err) {
      report[name] = "failed";
      log.error("cron.step_failed", { step: name, error: err });
    }
  };

  await step("msa_refresh", async () => (await admin.rpc("refresh_all_msa_statuses")).data);
  await step("earnings_refresh", async () => (await admin.rpc("refresh_placement_earnings")).data);
  await step("research_retries", () => runDueResearchJobs(3));
  await step("monitors", () => runDueMonitors(10));
  await step("google_sync", async () => {
    if (!googleConfig()) return "not_configured";
    const { data } = await admin.from("google_connections").select("user_id, product, app_users!inner(status)")
      .in("status", ["connected", "error"]).eq("app_users.status", "active");
    let ran = 0, failed = 0;
    for (const row of (data ?? []) as { user_id: string; product: GoogleProduct }[]) {
      if (Date.now() - started > 240_000) break;
      const r = await runSync(row.user_id, row.product);
      ran++;
      if (!r.ok) failed++;
    }
    return { ran, failed };
  });

  log.info("cron.run", report);
  return NextResponse.json(report);
}
