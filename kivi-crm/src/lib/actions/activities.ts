"use server";

import { revalidatePath } from "next/cache";
import { activitySchema, fieldErrors, formDataToObject } from "@/lib/validation";
import { friendlyDbError } from "@/lib/db-errors";
import { isUuid } from "@/lib/data/query";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { str, withMember } from "./helpers";
import type { ActionState } from "@/lib/types";

function revalidateBack(fd: FormData) {
  const back = safeRedirectPath(str(fd, "back"), "");
  if (back) revalidatePath(back.split("?")[0]);
  revalidatePath("/activities");
  revalidatePath("/");
}

export async function logActivity(_: ActionState, fd: FormData): Promise<ActionState> {
  return withMember("activity.create", async ({ supabase, member }) => {
    const parsed = activitySchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const v = parsed.data;
    const row = {
      type: v.type,
      subject: v.subject,
      body: v.body,
      occurred_at: v.occurred_at ?? new Date().toISOString(),
      company_id: v.company_id,
      contact_id: v.contact_id,
      opportunity_id: v.opportunity_id,
      requirement_id: v.requirement_id,
      owner_id: v.type === "task" ? v.owner_id : member.id,
      due_at: v.type === "task" ? v.due_at : null,
      reminder_at: v.type === "task" ? v.reminder_at : null,
      origin: "manual",
    };
    const { error } = await supabase.from("activities").insert(row);
    if (error) return { error: friendlyDbError(error, "activity.create") };
    revalidateBack(fd);
    return { ok: true, message: v.type === "task" ? "Task added." : "Activity logged." };
  });
}

export async function setTaskCompleted(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const done = str(fd, "done") === "true";
  return withMember("task.complete", async ({ supabase }) => {
    if (!isUuid(id)) return { error: "Unknown task." };
    const { error } = await supabase
      .from("activities")
      .update({ completed_at: done ? new Date().toISOString() : null })
      .eq("id", id)
      .eq("type", "task");
    if (error) return { error: friendlyDbError(error, "task.complete") };
    revalidateBack(fd);
    return { ok: true };
  });
}

export async function dismissReminder(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  return withMember("task.dismiss_reminder", async ({ supabase }) => {
    if (!isUuid(id)) return { error: "Unknown task." };
    const { error } = await supabase.from("activities").update({ reminder_state: "dismissed" }).eq("id", id).eq("type", "task");
    if (error) return { error: friendlyDbError(error, "task.dismiss_reminder") };
    revalidateBack(fd);
    return { ok: true };
  });
}

export async function reassignTask(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const owner = str(fd, "owner_id");
  return withMember("task.reassign", async ({ supabase }) => {
    if (!isUuid(id) || !isUuid(owner)) return { error: "Choose a team member." };
    const { error } = await supabase.from("activities").update({ owner_id: owner }).eq("id", id).eq("type", "task");
    if (error) return { error: friendlyDbError(error, "task.reassign") };
    revalidateBack(fd);
    return { ok: true, message: "Task reassigned." };
  });
}

export async function archiveActivity(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const notCrm = str(fd, "not_crm") === "true";
  return withMember("activity.archive", async ({ supabase, member }) => {
    if (!isUuid(id)) return { error: "Unknown activity." };
    const { data: act } = await supabase
      .from("activities").select("origin, external_owner_id, external_id, external_thread_id").eq("id", id).maybeSingle();
    if (!act) return { error: "That activity no longer exists." };
    const { error } = await supabase.from("activities").update({ archived_at: new Date().toISOString() }).eq("id", id);
    if (error) return { error: friendlyDbError(error, "activity.archive") };

    // "Not CRM-related": stop future syncs from logging this thread/event again.
    // Only the mailbox owner can add exclusions for their own account.
    if (notCrm && act.origin !== "manual" && act.external_owner_id === member.id) {
      const product = act.origin === "gmail" ? "gmail" : "calendar";
      const key = product === "gmail" ? act.external_thread_id ?? act.external_id : act.external_id;
      if (key) {
        await supabase.from("sync_exclusions").upsert(
          { user_id: member.id, product, external_key: key }, { onConflict: "user_id,product,external_key", ignoreDuplicates: true });
        if (product === "gmail" && act.external_thread_id) {
          // Archive the rest of the thread this user synced.
          await supabase.from("activities").update({ archived_at: new Date().toISOString() })
            .eq("origin", "gmail").eq("external_owner_id", member.id).eq("external_thread_id", act.external_thread_id)
            .is("archived_at", null);
        }
      }
    }
    revalidateBack(fd);
    return { ok: true, message: notCrm ? "Removed and excluded from future syncs." : "Activity archived." };
  });
}

/** Re-point a synced (or manual) activity at the correct contact/company. */
export async function relinkActivity(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const contactId = str(fd, "contact_id");
  const companyId = str(fd, "company_id");
  return withMember("activity.relink", async ({ supabase }) => {
    if (!isUuid(id)) return { error: "Unknown activity." };
    if (!isUuid(contactId) && !isUuid(companyId)) return { error: "Choose a contact or company." };
    let company = isUuid(companyId) ? companyId : null;
    if (isUuid(contactId)) {
      const { data: c } = await supabase.from("contacts").select("company_id").eq("id", contactId).maybeSingle();
      if (!c) return { error: "That contact no longer exists." };
      company = c.company_id ?? company;
    }
    const { error } = await supabase
      .from("activities")
      .update({ contact_id: isUuid(contactId) ? contactId : null, company_id: company, opportunity_id: null, requirement_id: null })
      .eq("id", id);
    if (error) return { error: friendlyDbError(error, "activity.relink") };
    revalidateBack(fd);
    return { ok: true, message: "Activity re-linked." };
  });
}
