"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { friendlyDbError } from "@/lib/db-errors";
import { isUuid } from "@/lib/data/query";
import { normalizeDomain, normalizeEmail } from "@/lib/normalize";
import { activeProvider } from "@/lib/research/providers";
import { buildResearchInput, idempotencyKey } from "@/lib/research/input";
import { runResearchJob } from "@/lib/research/runner";
import { fieldErrors, formDataToObject } from "@/lib/validation";
import { confirmed, str, withMember } from "./helpers";
import { LEAD_SOURCES } from "@/lib/constants";
import type { ActionState } from "@/lib/types";

const e2n = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const t = (max: number) => z.preprocess(e2n, z.string().trim().max(max).nullable().default(null));

// Only the company is required. Everything else can be filled in later.
const leadSchema = z.object({
  company_id: z.preprocess(e2n, z.uuid().nullable().default(null)),
  company_name: t(200),
  website: t(300),
  location: t(200),
  contact_name: t(160),
  contact_role: t(160),
  contact_email: z.preprocess(e2n, z.string().nullable().default(null)).transform((v, ctx) => {
    if (!v) return null;
    const e = normalizeEmail(v);
    if (!e) { ctx.addIssue({ code: "custom", message: "Enter a valid email" }); return z.NEVER; }
    return e;
  }),
  contact_phone: t(40),
  source: z.enum(LEAD_SOURCES.values as [string, ...string[]]),
  source_detail: t(200),
  hiring_need: t(300),
  hiring_volume: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(1).max(100000).nullable()),
  budget: t(300),
  owner_id: z.preprocess(e2n, z.uuid().nullable().default(null)),
  next_follow_up_on: z.preprocess(e2n, z.iso.date().nullable().default(null)),
  next_action: t(300),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  notes: t(20000),
  research_now: z.preprocess((v) => v === "on", z.boolean()),
  web_submission_id: z.preprocess(e2n, z.uuid().nullable().default(null)),
}).superRefine((v, ctx) => {
  if (!v.company_id && !v.company_name) ctx.addIssue({ code: "custom", path: ["company_name"], message: "Choose an existing company or type a new company name" });
});

export async function createLead(_: ActionState, fd: FormData): Promise<ActionState> {
  let target: string | null = null;
  const result = await withMember("lead.create", async ({ supabase, member }) => {
    const parsed = leadSchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const v = parsed.data;

    // Duplicate review before anything is written.
    if (!v.company_id && !confirmed(fd)) {
      const { data: dups } = await supabase.rpc("find_company_duplicates", { p_name: v.company_name, p_domain: v.website ?? (v.contact_email?.split("@")[1] ?? null), p_exclude: null });
      if (dups?.length) {
        return {
          error: "We found companies that may be the same. Pick the existing one above, or confirm this is new.",
          duplicates: (dups as { id: string; name: string; domain: string | null; reason: string }[]).map((d) => ({ id: d.id, label: d.name, detail: d.domain ?? undefined, reason: d.reason.replace(/_/g, " ") })),
        };
      }
    }
    let existingContactId: string | null = null;
    if (v.contact_email) {
      const { data: c } = await supabase.from("contacts").select("id").eq("email", v.contact_email).is("archived_at", null).maybeSingle();
      existingContactId = c?.id ?? null;
    }

    let companyId = v.company_id;
    if (!companyId) {
      const { data, error } = await supabase.from("companies").insert({
        name: v.company_name, website: v.website ? (/^https?:\/\//.test(v.website) ? v.website : `https://${v.website}`) : null,
        domain: normalizeDomain(v.website), location: v.location, source: v.source, source_detail: v.source_detail, owner_id: v.owner_id,
      }).select("id").single();
      if (error) return { error: friendlyDbError(error, "lead.company") };
      companyId = data.id;
    }

    let contactId = existingContactId;
    if (!contactId && v.contact_name) {
      const { data, error } = await supabase.from("contacts").insert({
        full_name: v.contact_name, role_title: v.contact_role, email: v.contact_email, phone: v.contact_phone,
        company_id: companyId, source: v.source, owner_id: v.owner_id, location: v.location,
      }).select("id").single();
      if (error) return { error: friendlyDbError(error, "lead.contact") };
      contactId = data.id;
    }

    const { data: company } = await supabase.from("companies").select("name").eq("id", companyId).single();
    const { data: opp, error: oppErr } = await supabase.from("opportunities").insert({
      company_id: companyId, title: `${company?.name ?? "Lead"}${v.hiring_need ? ` — ${v.hiring_need}` : " — new lead"}`.slice(0, 200),
      stage: "new_lead", source: v.source, owner_id: v.owner_id, hiring_need: v.hiring_need, hiring_volume: v.hiring_volume,
      location: v.location, budget: v.budget, next_follow_up_on: v.next_follow_up_on, next_action: v.next_action,
      priority: v.priority, notes: v.notes, decision_maker_contact_id: contactId,
    }).select("id").single();
    if (oppErr) return { error: friendlyDbError(oppErr, "lead.opportunity") };
    if (contactId) await supabase.from("opportunity_contacts").insert({ opportunity_id: opp.id, contact_id: contactId });

    if (v.web_submission_id) {
      await supabase.from("web_submissions").update({ status: "converted", opportunity_id: opp.id, handled_by: member.id, handled_at: new Date().toISOString() }).eq("id", v.web_submission_id);
    }

    if (v.research_now) {
      const provider = activeProvider();
      if (provider) {
        const input = await buildResearchInput(supabase, member, {
          companyId: companyId!, opportunityId: opp.id, contactId, requirementId: null, level: "company", channel: "email",
          includeConversations: false, extraNotes: null,
        });
        if (input) {
          const { data: job } = await supabase.from("research_jobs").insert({
            company_id: companyId, opportunity_id: opp.id, requested_by: member.id, provider: provider.id, input,
            idempotency_key: idempotencyKey(companyId!, input, provider.id),
          }).select("id").single();
          if (job) after(async () => { await runResearchJob(job.id); });
        }
      }
    }
    target = `/pipeline/${opp.id}?notice=lead_created`;
    return { ok: true };
  });
  if (target) {
    revalidatePath("/pipeline");
    revalidatePath("/");
    redirect(target);
  }
  return result;
}

export async function setWebSubmissionStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const status = str(fd, "status");
  return withMember("web_lead.status", async ({ supabase, member }) => {
    if (!isUuid(id) || !["spam", "dismissed", "new"].includes(status)) return { error: "Unknown action." };
    const { error } = await supabase.from("web_submissions").update({ status, handled_by: member.id, handled_at: new Date().toISOString() }).eq("id", id);
    if (error) return { error: friendlyDbError(error, "web_lead.status") };
    revalidatePath("/pipeline");
    return { ok: true, message: status === "new" ? "Moved back to the inbox." : "Removed from the inbox (kept for reference)." };
  });
}
