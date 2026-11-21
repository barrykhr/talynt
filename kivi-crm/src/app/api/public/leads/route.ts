import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowedOrigin, captureSchema, spamReason } from "@/lib/capture";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

// Public website lead capture. Submissions go to the CRM's lead inbox for a
// person to review and convert (with duplicate checks). Nothing is created
// automatically and nothing is emailed to the submitter.
//   POST /api/public/leads   (JSON or form-encoded) — see docs/LEAD_CAPTURE.md

function cors(origin: string | null): Record<string, string> {
  const allowed = origin && allowedOrigin(origin, process.env.LEAD_CAPTURE_ALLOWED_ORIGINS) ? origin : "";
  return allowed ? { "Access-Control-Allow-Origin": allowed, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type", Vary: "Origin" } : {};
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get("origin")) });
}

async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // optional extra layer
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", body: new URLSearchParams({ secret, response: token, remoteip: ip }), signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  const json = (await res?.json().catch(() => null)) as { success?: boolean } | null;
  return Boolean(json?.success);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = cors(origin);
  if (!process.env.LEAD_CAPTURE_ENABLED || process.env.LEAD_CAPTURE_ENABLED !== "true") {
    return NextResponse.json({ error: "Lead capture is not enabled" }, { status: 404, headers });
  }
  if (!allowedOrigin(origin, process.env.LEAD_CAPTURE_ALLOWED_ORIGINS)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403, headers });
  }
  if (Number(request.headers.get("content-length") ?? 0) > 20_000) {
    return NextResponse.json({ error: "Too large" }, { status: 413, headers });
  }

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ipHash = createHash("sha256").update(`${process.env.CAPTURE_IP_SALT ?? "kivi-crm"}:${ip}`).digest("hex").slice(0, 32);
  const admin = createAdminClient();
  const [{ data: perIp }, { data: global }] = await Promise.all([
    admin.rpc("consume_public_rate_limit", { p_bucket: `lead:${ipHash}`, p_max: 5, p_window_seconds: 3600 }),
    admin.rpc("consume_public_rate_limit", { p_bucket: "lead:all", p_max: 300, p_window_seconds: 86400 }),
  ]);
  if (perIp === false || global === false) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429, headers: { ...headers, "Retry-After": "3600" } });
  }

  let body: Record<string, unknown>;
  try {
    body = (request.headers.get("content-type") ?? "").includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400, headers });
  }
  const parsed = captureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form", fields: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) }, { status: 422, headers });
  }
  const v = parsed.data;
  const spam = spamReason(v);
  if (spam || !(await verifyTurnstile(v["cf-turnstile-response"], ip))) {
    log.warn("capture.rejected", { reason: spam ?? "turnstile" });
    // Same response as success so bots learn nothing.
    return NextResponse.json({ ok: true }, { status: 202, headers });
  }

  const { error } = await admin.from("web_submissions").insert({
    full_name: v.name, email: v.email, company_name: v.company, phone: v.phone, role_needed: v.role_needed,
    hiring_volume: v.hiring_volume, location: v.location, message: v.message, page_url: v.page_url, ip_hash: ipHash,
  });
  if (error) {
    log.error("capture.insert_failed", { code: error.code });
    return NextResponse.json({ error: "Could not save your enquiry. Please email us instead." }, { status: 503, headers });
  }
  const { data: members } = await admin.from("app_users").select("id").eq("status", "active");
  if (members?.length) {
    await admin.from("notifications").insert(members.map((m) => ({
      user_id: m.id, kind: "web_lead", title: `New website enquiry${v.company ? ` from ${v.company}` : ""}`.slice(0, 300),
      body: v.role_needed ? `Hiring: ${v.role_needed}`.slice(0, 300) : null, link: "/pipeline?saved=inbox",
    })));
  }
  return NextResponse.json({ ok: true }, { status: 202, headers });
}
