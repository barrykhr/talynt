"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fieldErrors, formDataToObject, opportunitySchema, requirementSchema, stageChangeSchema } from "@/lib/validation";
import { friendlyDbError } from "@/lib/db-errors";
import { isUuid } from "@/lib/data/query";
import { str, withMember } from "./helpers";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

async function syncLinks(
  supabase: ServerSupabase, table: "opportunity_contacts" | "requirement_contacts", key: "opportunity_id" | "requirement_id",
  id: string, contactIds: string[],
) {
  const { data: existing, error } = await supabase.from(table).select("contact_id").eq(key, id);
  if (error) return error;
  const have = new Set((existing ?? []).map((r: { contact_id: string }) => r.contact_id));
  const want = new Set(contactIds);
  const toAdd = [...want].filter((c) => !have.has(c));
  const toRemove = [...have].filter((c) => !want.has(c));
  if (toAdd.length) {
    const { error: e } = await supabase.from(table).insert(toAdd.map((contact_id) => ({ [key]: id, contact_id })));
    if (e) return e;
  }
  if (toRemove.length) {
    const { error: e } = await supabase.from(table).delete().eq(key, id).in("contact_id", toRemove);
    if (e) return e;
  }
  return null;
}

// ------------------------------------------------------------------ Opportunities

export async function createOpportunity(_: ActionState, fd: FormData): Promise<ActionState> {
  let newId: string | null = null;
  const result = await withMember("opportunity.create", async ({ supabase }) => {
    const parsed = opportunitySchema.safeParse(formDataToObject(fd, ["contact_ids"]));
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const { contact_ids, ...row } = parsed.data;
    const { data, error } = await supabase.from("opportunities").insert(row).select("id").single();
    if (error) return { error: friendlyDbError(error, "opportunity.create") };
    const linkErr = await syncLinks(supabase, "opportunity_contacts", "opportunity_id", data.id, contact_ids);
    if (linkErr) return { error: friendlyDbError(linkErr, "opportunity.links") };
    newId = data.id;
    return { ok: true };
  });
  if (newId) {
    revalidatePath("/pipeline");
    redirect(`/pipeline/${newId}?notice=opportunity_created`);
  }
  return result;
}

export async function updateOpportunity(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const result = await withMember("opportunity.update", async ({ supabase }) => {
    if (!isUuid(id)) return { error: "Unknown opportunity." };
    const parsed = opportunitySchema.safeParse(formDataToObject(fd, ["contact_ids"]));
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const { contact_ids, ...row } = parsed.data;
    const { error } = await supabase
      .from("opportunities")
      .update(row)
      .eq("id", id)
      .is("archived_at", null);
    if (error) return { error: friendlyDbError(error, "opportunity.update") };
    const linkErr = await syncLinks(supabase, "opportunity_contacts", "opportunity_id", id, contact_ids);
    if (linkErr) return { error: friendlyDbError(linkErr, "opportunity.links") };
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath(`/pipeline/${id}`);
    redirect(`/pipeline/${id}?notice=opportunity_updated`);
  }
  return result;
}

/** Stage move from the board or list. History is recorded by the database. */
export async function changeStage(_: ActionState, fd: FormData): Promise<ActionState> {
  return withMember("opportunity.stage", async ({ supabase }) => {
    const parsed = stageChangeSchema.safeParse(formDataToObject(fd));
    if (!parsed.success) {
      const fe = fieldErrors(parsed.error);
      return { fieldErrors: fe, error: fe.loss_reason ?? fe.nurture_reason ?? "Choose a stage." };
    }
    const update: Record<string, unknown> = { stage: parsed.data.stage };
    if (parsed.data.stage === "lost") update.loss_reason = parsed.data.loss_reason;
    if (parsed.data.stage === "nurture") {
      update.nurture_reason = parsed.data.nurture_reason;
      update.revisit_on = parsed.data.revisit_on;
      if (parsed.data.revisit_on) update.next_follow_up_on = parsed.data.revisit_on;
    }
    const { error } = await supabase.from("opportunities").update(update).eq("id", parsed.data.id).is("archived_at", null);
    if (error) return { error: friendlyDbError(error, "opportunity.stage") };
    revalidatePath("/pipeline");
    revalidatePath(`/pipeline/${parsed.data.id}`);
    revalidatePath("/");
    return { ok: true, message: "Stage updated." };
  });
}

export async function setFollowUp(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const date = str(fd, "next_follow_up_on");
  return withMember("opportunity.follow_up", async ({ supabase }) => {
    if (!isUuid(id) || (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))) return { error: "Choose a valid date." };
    const { error } = await supabase.from("opportunities").update({ next_follow_up_on: date || null }).eq("id", id);
    if (error) return { error: friendlyDbError(error, "opportunity.follow_up") };
    revalidatePath(`/pipeline/${id}`);
    revalidatePath("/pipeline");
    return { ok: true, message: "Follow-up updated." };
  });
}

export async function setOpportunityArchived(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const archive = str(fd, "archive") === "true";
  const result = await withMember("opportunity.archive", async ({ supabase }) => {
    if (!isUuid(id)) return { error: "Unknown opportunity." };
    const { error } = await supabase.from("opportunities").update({ archived_at: archive ? new Date().toISOString() : null }).eq("id", id);
    if (error) return { error: friendlyDbError(error, "opportunity.archive") };
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath("/pipeline");
    redirect(archive ? "/pipeline?notice=opportunity_archived" : `/pipeline/${id}?notice=opportunity_restored`);
  }
  return result;
}

// ------------------------------------------------------------------ Requirements

type ReqInput = ReturnType<typeof requirementSchema.parse>;

/** Converts the form's accepted/terms checkboxes into timestamps, keeping the original time on edit. */
function requirementRow(v: ReqInput, existing?: { client_accepted_at: string | null; terms_agreed_at: string | null }) {
  const { contact_ids: _c, client_accepted, terms_agreed, ...rest } = v;
  void _c;
  const now = new Date().toISOString();
  return {
    ...rest,
    client_accepted_at: client_accepted ? existing?.client_accepted_at ?? now : null,
    terms_agreed_at: terms_agreed ? existing?.terms_agreed_at ?? now : null,
  };
}

export async function createRequirement(_: ActionState, fd: FormData): Promise<ActionState> {
  let newId: string | null = null;
  const result = await withMember("requirement.create", async ({ supabase }) => {
    const parsed = requirementSchema.safeParse(formDataToObject(fd, ["contact_ids"]));
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const contact_ids = parsed.data.contact_ids;
    const row = requirementRow(parsed.data);
    if (row.opportunity_id) {
      const { data: opp } = await supabase.from("opportunities").select("company_id").eq("id", row.opportunity_id).maybeSingle();
      if (!opp || opp.company_id !== row.company_id) return { fieldErrors: { opportunity_id: "That opportunity belongs to a different company" } };
    }
    const { data, error } = await supabase.from("requirements").insert(row).select("id").single();
    if (error) return { error: friendlyDbError(error, "requirement.create") };
    const linkErr = await syncLinks(supabase, "requirement_contacts", "requirement_id", data.id, contact_ids);
    if (linkErr) return { error: friendlyDbError(linkErr, "requirement.links") };
    newId = data.id;
    return { ok: true };
  });
  if (newId) {
    revalidatePath("/requirements");
    redirect(`/requirements/${newId}?notice=requirement_created`);
  }
  return result;
}

export async function updateRequirement(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const result = await withMember("requirement.update", async ({ supabase }) => {
    if (!isUuid(id)) return { error: "Unknown requirement." };
    const parsed = requirementSchema.safeParse(formDataToObject(fd, ["contact_ids"]));
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const contact_ids = parsed.data.contact_ids;
    const { data: current } = await supabase.from("requirements").select("client_accepted_at, terms_agreed_at").eq("id", id).maybeSingle();
    const row = requirementRow(parsed.data, current ?? undefined);
    if (row.opportunity_id) {
      const { data: opp } = await supabase.from("opportunities").select("company_id").eq("id", row.opportunity_id).maybeSingle();
      if (!opp || opp.company_id !== row.company_id) return { fieldErrors: { opportunity_id: "That opportunity belongs to a different company" } };
    }
    const { error } = await supabase.from("requirements").update(row).eq("id", id).is("archived_at", null);
    if (error) return { error: friendlyDbError(error, "requirement.update") };
    const linkErr = await syncLinks(supabase, "requirement_contacts", "requirement_id", id, contact_ids);
    if (linkErr) return { error: friendlyDbError(linkErr, "requirement.links") };
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath(`/requirements/${id}`);
    redirect(`/requirements/${id}?notice=requirement_updated`);
  }
  return result;
}

/** Quick delivery-status update. Placements are recorded separately (they drive the count and revenue). */
export async function updateRequirementProgress(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const status = str(fd, "status");
  return withMember("requirement.progress", async ({ supabase }) => {
    if (!isUuid(id) || !status) return { error: "Choose a delivery status." };
    const { error } = await supabase.from("requirements").update({ status }).eq("id", id).is("archived_at", null);
    if (error) return { error: friendlyDbError(error, "requirement.progress") };
    revalidatePath(`/requirements/${id}`);
    revalidatePath("/requirements");
    revalidatePath("/");
    return { ok: true, message: "Delivery status updated." };
  });
}

export async function setRequirementArchived(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const archive = str(fd, "archive") === "true";
  const result = await withMember("requirement.archive", async ({ supabase }) => {
    if (!isUuid(id)) return { error: "Unknown requirement." };
    const { error } = await supabase.from("requirements").update({ archived_at: archive ? new Date().toISOString() : null }).eq("id", id);
    if (error) return { error: friendlyDbError(error, "requirement.archive") };
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath("/requirements");
    redirect(archive ? "/requirements?notice=requirement_archived" : `/requirements/${id}?notice=requirement_restored`);
  }
  return result;
}
