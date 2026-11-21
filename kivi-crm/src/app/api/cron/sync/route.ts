import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { googleConfig } from "@/lib/env";
import { log } from "@/lib/log";
import { runSync } from "@/lib/google/sync";
import type { GoogleProduct } from "@/lib/google/scopes";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Scheduled background sync for every connected user (see vercel.json).
// Protected by CRON_SECRET; returns only counts.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET ?? "";
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const ok = secret.length >= 16 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!googleConfig()) return NextResponse.json({ skipped: "not_configured" });

  const admin = createAdminClient();
  const { data } = await admin.from("google_connections").select("user_id, product, app_users!inner(status)")
    .in("status", ["connected", "error"]).eq("app_users.status", "active");
  const started = Date.now();
  let ran = 0, failed = 0;
  for (const row of (data ?? []) as { user_id: string; product: GoogleProduct }[]) {
    if (Date.now() - started > 240_000) break;
    const r = await runSync(row.user_id, row.product);
    ran++;
    if (!r.ok) failed++;
  }
  log.info("cron.sync", { ran, failed });
  return NextResponse.json({ ran, failed });
}
