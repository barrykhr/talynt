"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { contactSchema, fieldErrors, formDataToObject } from "@/lib/validation";
import { friendlyDbError } from "@/lib/db-errors";
import { isUuid } from "@/lib/data/query";
import { confirmed, str, withMember } from "./helpers";
import type { ActionState } from "@/lib/types";

export async function createContact(_: ActionState, fd: FormData): Promise<ActionState> {
  let newId: string | null = null;
  const stay = str(fd, "stay") === "1";
  const result = await withMember("contact.create", async ({ supabase }) => {
    const parsed = contactSchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please fix the highlighted fields." };

    if (!confirmed(fd)) {
      const { data: dups } = await supabase.rpc("find_contact_duplicates", {
        p_email: parsed.data.email, p_full_name: parsed.data.full_name, p_company_id: parsed.data.company_id, p_exclude: null,
      });
      if (dups && dups.length > 0) {
        const list = dups as { id: string; full_name: string; email: string | null; reason: string }[];
        // An identical email is a hard conflict (unique in the database).
        if (list.some((d) => d.reason === "same_email")) {
          return {
            error: "A contact with this email already exists. Open it to update it, or merge if needed.",
            duplicates: list.map((d) => ({ id: d.id, label: d.full_name, detail: d.email ?? undefined, reason: d.reason === "same_email" ? "same email" : "similar name at this company" })),
          };
        }
        return {
          duplicates: list.map((d) => ({ id: d.id, label: d.full_name, detail: d.email ?? undefined, reason: "similar name at this company" })),
        };
      }
    }

    const { data, error } = await supabase.from("contacts").insert(parsed.data).select("id").single();
    if (error) return { error: friendlyDbError(error, "contact.create") };
    newId = data.id;
    if (parsed.data.company_id) revalidatePath(`/companies/${parsed.data.company_id}`);
    return { ok: true, message: "Contact added." };
  });
  if (newId && !stay) {
    revalidatePath("/contacts");
    redirect(`/contacts/${newId}?notice=contact_created`);
  }
  return result;
}

export async function updateContact(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const result = await withMember("contact.update", async ({ supabase }) => {
    if (!isUuid(id)) return { error: "Unknown contact." };
    const parsed = contactSchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const { error } = await supabase.from("contacts").update(parsed.data).eq("id", id).is("archived_at", null);
    if (error) return { error: friendlyDbError(error, "contact.update") };
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath(`/contacts/${id}`);
    redirect(`/contacts/${id}?notice=contact_updated`);
  }
  return result;
}

export async function setContactArchived(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const archive = str(fd, "archive") === "true";
  const result = await withMember("contact.archive", async ({ supabase }) => {
    if (!isUuid(id)) return { error: "Unknown contact." };
    const { error } = await supabase.from("contacts").update({ archived_at: archive ? new Date().toISOString() : null }).eq("id", id);
    if (error) return { error: friendlyDbError(error, "contact.archive") };
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath("/contacts");
    redirect(archive ? "/contacts?notice=contact_archived" : `/contacts/${id}?notice=contact_restored`);
  }
  return result;
}

export async function mergeContacts(_: ActionState, fd: FormData): Promise<ActionState> {
  const keep = str(fd, "keep_id");
  const merge = str(fd, "merge_id");
  const result = await withMember("contact.merge", async ({ supabase }) => {
    if (!isUuid(keep) || !isUuid(merge)) return { error: "Choose the contact to merge into this one." };
    const { error } = await supabase.rpc("merge_contacts", { p_keep: keep, p_merge: merge });
    if (error) return { error: friendlyDbError(error, "contact.merge") };
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath("/contacts");
    redirect(`/contacts/${keep}?notice=contacts_merged`);
  }
  return result;
}
