"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { friendlyDbError } from "@/lib/db-errors";
import { isUuid } from "@/lib/data/query";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { activeProvider } from "@/lib/research/providers";
import { buildResearchInput, idempotencyKey } from "@/lib/research/input";
import { runResearchJob } from "@/lib/research/runner";
import { applyEvidenceRules, LEVELS, ResearchError } from "@/lib/research/schema";
import { runMonitor } from "@/lib/monitoring/engine";
import { str, withMember } from "./helpers";
import type { ActionState } from "@/lib/types";

function back(fd: FormData) {
  const b = safeRedirectPath(str(fd, "back"), "");
  if (b) revalidatePath(b.split("?")[0]);
  revalidatePath("/research");
}

const startSchema = z.object({
  company_id: z.uuid(),
  opportunity_id: z.uuid().nullable(),
  contact_id: z.uuid().nullable(),
  requirement_id: z.uuid().nullable(),
  level: z.enum(LEVELS),
  channel: z.enum(["email", "whatsapp"]),
  include_conversations: z.boolean(),
  notes: z.string().max(1500).nullable(),
});

const nullableId = (v: string) => (isUuid(v) ? v : null);

export async function startResearch(_: ActionState, fd: FormData): Promise<ActionState> {
  return withMember("research.start", async ({ supabase, member }) => {
    const { data: settings } = await supabase.from("app_settings").select("research_enabled").maybeSingle();
    if (settings && !settings.research_enabled) return { error: "Company research is turned off in workspace settings." };
    const provider = activeProvider();
    if (!provider) return { error: "No research provider is configured yet. An admin needs to add an API key or the outreach agent URL (see docs/RESEARCH.md)." };

    const parsed = startSchema.safeParse({
      company_id: str(fd, "company_id"), opportunity_id: nullableId(str(fd, "opportunity_id")), contact_id: nullableId(str(fd, "contact_id")),
      requirement_id: nullableId(str(fd, "requirement_id")), level: str(fd, "level") || "company", channel: str(fd, "channel") || "email",
      include_conversations: str(fd, "include_conversations") === "on", notes: str(fd, "notes").trim() || null,
    });
    if (!parsed.success) return { error: "Choose a company and research options." };
    const v = parsed.data;

    const { data: allowed } = await supabase.rpc("consume_rate_limit", { p_action: "research.start", p_max: 20, p_window_seconds: 3600 });
    if (allowed === false) return { error: "You've started a lot of research in the last hour. Please wait a bit and try again." };

    const input = await buildResearchInput(supabase, member, {
      companyId: v.company_id, opportunityId: v.opportunity_id, contactId: v.contact_id, requirementId: v.requirement_id,
      level: v.level, channel: v.channel, includeConversations: v.include_conversations, extraNotes: v.notes,
    });
    if (!input) return { error: "That company no longer exists." };
    if (v.level === "person" && !input.contact) return { error: "Person-level research needs a contact." };

    const key = idempotencyKey(v.company_id, input, provider.id);
    const { data: existing } = await supabase.from("research_jobs").select("id, status").eq("idempotency_key", key).maybeSingle();
    if (existing) return { ok: true, message: "This research is already in progress or done — see below." };

    const { data: job, error } = await supabase.from("research_jobs").insert({
      company_id: v.company_id, opportunity_id: v.opportunity_id, requested_by: member.id, provider: provider.id, input, idempotency_key: key,
    }).select("id").single();
    if (error) return { error: friendlyDbError(error, "research.start") };

    after(async () => { await runResearchJob(job.id); });
    back(fd);
    return { ok: true, message: `Research started with ${provider.label}. It usually takes 1–3 minutes; refresh to see results. Nothing will be sent.` };
  });
}

export async function retryResearch(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  return withMember("research.retry", async ({ supabase }) => {
    if (!isUuid(id)) return { error: "Unknown job." };
    const { data: job } = await supabase.from("research_jobs").select("id, status, attempts, max_attempts").eq("id", id).maybeSingle();
    if (!job || job.status !== "failed") return { error: "Only failed jobs can be retried." };
    after(async () => {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      await createAdminClient().from("research_jobs").update({ next_attempt_at: new Date().toISOString(), max_attempts: Math.min(5, Math.max(job.max_attempts, job.attempts + 1)) }).eq("id", id);
      await runResearchJob(id);
    });
    back(fd);
    return { ok: true, message: "Retrying. Refresh in a minute." };
  });
}

export async function reviewFinding(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const state = str(fd, "state");
  const corrected = str(fd, "corrected").trim();
  const applyTo = str(fd, "apply_to");
  return withMember("research.review", async ({ supabase }) => {
    if (!isUuid(id) || !["accepted", "dismissed", "corrected"].includes(state)) return { error: "Choose accept, dismiss or correct." };
    if (state === "corrected" && !corrected) return { error: "Type the corrected statement." };
    const { error } = await supabase.rpc("review_research_finding", {
      p_finding: id, p_state: state, p_corrected: corrected || null,
      p_apply_to: ["about", "industry", "employee_range"].includes(applyTo) ? applyTo : null,
    });
    if (error) return { error: friendlyDbError(error, "research.review") };
    back(fd);
    return { ok: true, message: state === "dismissed" ? "Dismissed (kept in history)." : applyTo ? "Saved and applied to the company profile (previous value kept in history)." : "Saved." };
  });
}

// ------------------------------------------------------------------ drafts

export async function draftFromAcceptedFacts(_: ActionState, fd: FormData): Promise<ActionState> {
  const companyId = str(fd, "company_id");
  return withMember("research.draft", async ({ supabase, member }) => {
    if (!isUuid(companyId)) return { error: "Unknown company." };
    const provider = activeProvider();
    if (!provider || !provider.supportsDraftOnly) return { error: "Drafting needs a Claude or OpenAI provider to be configured. You can still write a draft by hand below." };
    const { data: allowed } = await supabase.rpc("consume_rate_limit", { p_action: "research.draft", p_max: 40, p_window_seconds: 3600 });
    if (allowed === false) return { error: "Too many drafts in the last hour. Please wait a bit." };
    const level = (LEVELS as readonly string[]).includes(str(fd, "level")) ? (str(fd, "level") as (typeof LEVELS)[number]) : "company";
    const channel = str(fd, "channel") === "whatsapp" ? "whatsapp" : "email";
    const input = await buildResearchInput(supabase, member, {
      companyId, opportunityId: nullableId(str(fd, "opportunity_id")), contactId: nullableId(str(fd, "contact_id")),
      requirementId: nullableId(str(fd, "requirement_id")), level, channel,
      includeConversations: str(fd, "include_conversations") === "on", extraNotes: str(fd, "notes").trim() || null,
    });
    if (!input) return { error: "That company no longer exists." };
    const { data: facts } = await supabase.from("research_findings").select("statement, corrected_statement, source_url, review_state")
      .eq("company_id", companyId).in("review_state", ["accepted", "corrected"]).order("reviewed_at", { ascending: false }).limit(12);
    input.acceptedFacts = ((facts ?? []) as { statement: string; corrected_statement: string | null; source_url: string | null; review_state: string }[])
      .map((f) => ({ statement: f.review_state === "corrected" ? f.corrected_statement ?? f.statement : f.statement, source_url: f.source_url }));
    const { data: company } = await supabase.from("companies").select("about").eq("id", companyId).maybeSingle();
    if (company?.about) input.acceptedFacts.unshift({ statement: `About: ${company.about}`, source_url: null });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);
    try {
      const out = await provider.draft(input, controller.signal);
      const stored = applyEvidenceRules(out.raw, { retrieved: [], now: new Date(), model: out.model });
      if (!stored.draft_message) return { error: "The provider didn't return a draft. Try again or write one by hand." };
      const { error } = await supabase.from("outreach_drafts").insert({
        company_id: companyId, opportunity_id: nullableId(str(fd, "opportunity_id")), contact_id: nullableId(str(fd, "contact_id")),
        channel, level, subject: stored.draft_subject, body: stored.draft_message.slice(0, 6000),
      });
      if (error) return { error: friendlyDbError(error, "research.draft") };
      back(fd);
      return { ok: true, message: `Draft ready, built from ${input.acceptedFacts.length} accepted fact(s). Review and edit it before sending.` };
    } catch (err) {
      return { error: err instanceof ResearchError ? err.message : "Drafting failed. Please try again." };
    } finally {
      clearTimeout(timer);
    }
  });
}

export async function saveDraft(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const body = str(fd, "body").trim();
  const subject = str(fd, "subject").replace(/[\r\n]+/g, " ").trim();
  const status = str(fd, "status");
  return withMember("research.save_draft", async ({ supabase, member }) => {
    if (!body && status !== "discarded") return { error: "The draft is empty." };
    const allowedStatus = ["draft", "copied_whatsapp", "discarded"].includes(status) ? status : "draft";
    if (isUuid(id)) {
      const { data: draft } = await supabase.from("outreach_drafts").select("company_id, contact_id, opportunity_id, status").eq("id", id).maybeSingle();
      if (!draft) return { error: "Draft not found." };
      if (draft.status === "sent_email") return { error: "This draft was already sent and can't be changed." };
      const { error } = await supabase.from("outreach_drafts").update({ body: body || "(discarded)", subject: subject || null, status: allowedStatus }).eq("id", id);
      if (error) return { error: friendlyDbError(error, "research.save_draft") };
      if (allowedStatus === "copied_whatsapp") {
        // The person sends it from their own WhatsApp; we log what they copied.
        await supabase.from("activities").insert({
          type: "whatsapp", subject: "WhatsApp message copied for manual sending", body,
          company_id: draft.company_id, contact_id: draft.contact_id, opportunity_id: draft.opportunity_id, owner_id: member.id,
        });
      }
    } else {
      const companyId = str(fd, "company_id");
      if (!isUuid(companyId)) return { error: "Unknown company." };
      const { error } = await supabase.from("outreach_drafts").insert({
        company_id: companyId, contact_id: nullableId(str(fd, "contact_id")), opportunity_id: nullableId(str(fd, "opportunity_id")),
        channel: str(fd, "channel") === "whatsapp" ? "whatsapp" : "email", subject: subject || null, body,
      });
      if (error) return { error: friendlyDbError(error, "research.save_draft") };
    }
    back(fd);
    return { ok: true, message: allowedStatus === "copied_whatsapp" ? "Logged as a WhatsApp activity. Paste it into WhatsApp and send it yourself." : allowedStatus === "discarded" ? "Draft discarded." : "Draft saved." };
  });
}

// ------------------------------------------------------------------ signals & monitoring

export async function reviewSignal(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const action = str(fd, "action");
  return withMember("signals.review", async ({ supabase, member }) => {
    if (!isUuid(id) || !["accept", "dismiss", "task"].includes(action)) return { error: "Unknown action." };
    const { data: sig } = await supabase.from("company_signals").select("id, company_id, summary, task_id, companies(owner_id)").eq("id", id).maybeSingle();
    if (!sig) return { error: "Signal not found." };
    if (action === "task") {
      if (sig.task_id) return { error: "A follow-up task already exists for this signal." };
      const owner = (sig.companies as unknown as { owner_id: string | null } | null)?.owner_id ?? member.id;
      const due = new Date(Date.now() + 2 * 86_400_000).toISOString();
      const { data: task, error } = await supabase.from("activities").insert({
        type: "task", subject: `Follow up on signal: ${sig.summary}`.slice(0, 300), company_id: sig.company_id, owner_id: owner, due_at: due,
      }).select("id").single();
      if (error) return { error: friendlyDbError(error, "signals.task") };
      await supabase.from("company_signals").update({ task_id: task.id, review_state: "accepted" }).eq("id", id);
    } else {
      const { error } = await supabase.from("company_signals").update({ review_state: action === "accept" ? "accepted" : "dismissed" }).eq("id", id);
      if (error) return { error: friendlyDbError(error, "signals.review") };
    }
    back(fd);
    return { ok: true, message: action === "task" ? "Task created for the company owner." : action === "accept" ? "Accepted." : "Dismissed (kept in history)." };
  });
}

const manualSignal = z.object({
  company_id: z.uuid(),
  signal_type: z.enum(["hiring", "announcement", "funding", "expansion", "leadership", "other"]),
  summary: z.string().trim().min(5).max(1000),
  source_url: z.url().refine((u) => /^https?:\/\//.test(u), "Use an http(s) link"),
  published_at: z.iso.date().nullable(),
});

export async function addManualSignal(_: ActionState, fd: FormData): Promise<ActionState> {
  return withMember("signals.manual", async ({ supabase }) => {
    const parsed = manualSignal.safeParse({
      company_id: str(fd, "company_id"), signal_type: str(fd, "signal_type"), summary: str(fd, "summary"),
      source_url: str(fd, "source_url").trim(), published_at: str(fd, "published_at") || null,
    });
    if (!parsed.success) return { error: "Add a summary, a type and the source link." , fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
    const v = parsed.data;
    const { error } = await supabase.from("company_signals").insert({
      company_id: v.company_id, signal_type: v.signal_type, summary: v.summary, source_url: v.source_url, source_title: new URL(v.source_url).hostname,
      provider: "manual", published_at: v.published_at, confidence: "medium", fingerprint: `manual:${v.source_url}:${v.summary.slice(0, 60)}`,
    });
    if (error) return { error: error.code === "23505" ? "That signal is already recorded." : friendlyDbError(error, "signals.manual") };
    back(fd);
    return { ok: true, message: "Signal recorded with its source." };
  });
}

const monitorSchema = z.object({
  company_id: z.uuid(),
  enabled: z.boolean(),
  cadence_days: z.number().int().min(1).max(90),
  signal_types: z.array(z.enum(["hiring", "job_volume_change", "announcement", "funding", "expansion", "leadership", "other"])).min(1),
  greenhouse_board: z.string().trim().regex(/^[a-z0-9_-]{1,80}$/i, "Board tokens are letters, numbers, - and _").or(z.literal("")),
  lever_company: z.string().trim().regex(/^[a-z0-9_-]{1,80}$/i, "Lever company ids are letters, numbers, - and _").or(z.literal("")),
  rss_urls: z.array(z.url().refine((u) => u.startsWith("https://"), "Feeds must use https")).max(5),
});

export async function saveMonitor(_: ActionState, fd: FormData): Promise<ActionState> {
  return withMember("monitor.save", async ({ supabase }) => {
    const parsed = monitorSchema.safeParse({
      company_id: str(fd, "company_id"), enabled: str(fd, "enabled") === "on", cadence_days: Number(str(fd, "cadence_days") || 7),
      signal_types: fd.getAll("signal_types").map(String), greenhouse_board: str(fd, "greenhouse_board"), lever_company: str(fd, "lever_company"),
      rss_urls: str(fd, "rss_urls").split(/\s+/).map((s) => s.trim()).filter(Boolean),
    });
    if (!parsed.success) {
      return { error: "Please fix the highlighted fields.", fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
    }
    const v = parsed.data;
    const sources = { greenhouse_board: v.greenhouse_board || null, lever_company: v.lever_company || null, rss_urls: v.rss_urls };
    const { error } = await supabase.from("company_monitors").upsert({
      company_id: v.company_id, enabled: v.enabled, cadence_days: v.cadence_days, signal_types: v.signal_types, sources,
    }, { onConflict: "company_id" });
    if (error) return { error: friendlyDbError(error, "monitor.save") };
    back(fd);
    return { ok: true, message: v.enabled ? `Monitoring on, checked every ${v.cadence_days} day(s).` : "Monitoring paused for this company." };
  });
}

export async function refreshMonitorNow(_: ActionState, fd: FormData): Promise<ActionState> {
  const companyId = str(fd, "company_id");
  return withMember("monitor.refresh", async ({ supabase }) => {
    if (!isUuid(companyId)) return { error: "Unknown company." };
    const { data: allowed } = await supabase.rpc("consume_rate_limit", { p_action: "monitor.refresh", p_max: 10, p_window_seconds: 3600 });
    if (allowed === false) return { error: "Too many manual refreshes this hour. The schedule will keep checking." };
    const { data: mon } = await supabase.from("company_monitors").select("id").eq("company_id", companyId).maybeSingle();
    if (!mon) return { error: "Set up monitoring sources first." };
    const result = await runMonitor(mon.id, "manual");
    back(fd);
    if (result.status === "skipped") return { ok: true, message: "A check for this company just ran. Try again in a minute." };
    return result.status === "failed"
      ? { error: `All sources failed: ${result.error ?? "unknown error"}. It will retry automatically.` }
      : { ok: true, message: `Checked ${result.providers} source(s): ${result.newSignals} new signal(s).${result.failed ? ` ${result.failed} source(s) failed.` : ""}` };
  });
}

export async function markNotificationsRead(): Promise<ActionState> {
  return withMember("notifications.read", async ({ supabase, member }) => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", member.id).is("read_at", null);
    revalidatePath("/", "layout");
    return { ok: true };
  });
}

