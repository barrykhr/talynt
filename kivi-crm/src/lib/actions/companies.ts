"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { companySchema, fieldErrors, formDataToObject } from "@/lib/validation";
import { friendlyDbError } from "@/lib/db-errors";
import { isUuid } from "@/lib/data/query";
import { confirmed, str, withMember } from "./helpers";
import type { ActionState } from "@/lib/types";

const DUP_REASON: Record<string, string> = {
  same_domain: "same website domain",
  same_name: "same name",
  similar_name: "similar name",
};

export async function createCompany(_: ActionState, fd: FormData): Promise<ActionState> {
  let newId: string | null = null;
  const result = await withMember("company.create", async ({ supabase }) => {
    const parsed = companySchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please fix the highlighted fields." };

    if (!confirmed(fd)) {
      const { data: dups } = await supabase.rpc("find_company_duplicates", {
        p_name: parsed.data.name, p_domain: parsed.data.domain ?? parsed.data.website, p_exclude: null,
      });
      if (dups && dups.length > 0) {
        return {
          duplicates: (dups as { id: string; name: string; domain: string | null; location: string | null; reason: string }[]).map((d) => ({
            id: d.id, label: d.name, detail: [d.domain, d.location].filter(Boolean).join(" · ") || undefined,
            reason: DUP_REASON[d.reason] ?? d.reason,
          })),
        };
      }
    }

    const { data, error } = await supabase.from("companies").insert(parsed.data).select("id").single();
    if (error) return { error: friendlyDbError(error, "company.create") };
    newId = data.id;
    return { ok: true };
  });
  if (newId) {
    revalidatePath("/companies");
    redirect(`/companies/${newId}?notice=company_created`);
  }
  return result;
}

export async function updateCompany(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const result = await withMember("company.update", async ({ supabase }) => {
    if (!isUuid(id)) return { error: "Unknown company." };
    const parsed = companySchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const { error } = await supabase.from("companies").update(parsed.data).eq("id", id).is("archived_at", null);
    if (error) return { error: friendlyDbError(error, "company.update") };
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath(`/companies/${id}`);
    redirect(`/companies/${id}?notice=company_updated`);
  }
  return result;
}

export async function setCompanyArchived(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const archive = str(fd, "archive") === "true";
  const result = await withMember("company.archive", async ({ supabase }) => {
    if (!isUuid(id)) return { error: "Unknown company." };
    const { error } = await supabase
      .from("companies")
      .update({ archived_at: archive ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) return { error: friendlyDbError(error, "company.archive") };
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath("/companies");
    redirect(archive ? "/companies?notice=company_archived" : `/companies/${id}?notice=company_restored`);
  }
  return result;
}

export async function mergeCompanies(_: ActionState, fd: FormData): Promise<ActionState> {
  const keep = str(fd, "keep_id");
  const merge = str(fd, "merge_id");
  const result = await withMember("company.merge", async ({ supabase }) => {
    if (!isUuid(keep) || !isUuid(merge)) return { error: "Choose the company to merge into this one." };
    const { error } = await supabase.rpc("merge_companies", { p_keep: keep, p_merge: merge });
    if (error) return { error: friendlyDbError(error, "company.merge") };
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath("/companies");
    redirect(`/companies/${keep}?notice=companies_merged`);
  }
  return result;
}

/**
 * Quick MSA change from a company or opportunity page. MSA status lives on
 * the company's MSA agreement record (single source of truth); this updates
 * the current MSA agreement or creates one.
 */
export async function setMsaStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const status = str(fd, "msa_status");
  const back = str(fd, "back");
  return withMember("company.msa", async ({ supabase }) => {
    if (!isUuid(id) || !["not_started", "in_discussion", "signed"].includes(status)) return { error: "Choose an MSA status." };
    const { data: current } = await supabase.from("commercial_agreements").select("id, signed_on")
      .eq("company_id", id).eq("kind", "msa").is("archived_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const today = new Date().toISOString().slice(0, 10);
    const patch = { status, signed_on: status === "signed" ? current?.signed_on ?? today : current?.signed_on ?? null };
    const { error } = current
      ? await supabase.from("commercial_agreements").update(patch).eq("id", current.id)
      : await supabase.from("commercial_agreements").insert({ company_id: id, kind: "msa", title: "Master Services Agreement", ...patch });
    if (error) return { error: friendlyDbError(error, "company.msa") };
    revalidatePath(`/companies/${id}`);
    if (back.startsWith("/")) revalidatePath(back);
    return { ok: true, message: status === "signed" ? "MSA marked signed (dated today — edit the agreement to change the date)." : "MSA status updated." };
  });
}
