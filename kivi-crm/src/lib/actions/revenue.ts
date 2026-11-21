"use server";

import { revalidatePath } from "next/cache";
import {
  agreementSchema, creditSchema, fieldErrors, formDataToObject, invoiceSchema, paymentSchema, placementSchema, revenueEventSchema,
} from "@/lib/validation";
import { friendlyDbError } from "@/lib/db-errors";
import { isUuid } from "@/lib/data/query";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { str, withMember } from "./helpers";
import type { ActionState } from "@/lib/types";

// Financial records are corrected or reversed, never deleted. Every change is
// recorded by database triggers (record_history + audit_log).

function back(fd: FormData) {
  const b = safeRedirectPath(str(fd, "back"), "");
  if (b) revalidatePath(b.split("?")[0]);
  revalidatePath("/revenue");
  revalidatePath("/");
}

const invalid = (e: Parameters<typeof fieldErrors>[0]) => ({ fieldErrors: fieldErrors(e), error: "Please fix the highlighted fields." });

// ------------------------------------------------------------------ agreements (MSA etc.)
export async function saveAgreement(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  return withMember("agreement.save", async ({ supabase }) => {
    const parsed = agreementSchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return invalid(parsed.error);
    const { error } = isUuid(id)
      ? await supabase.from("commercial_agreements").update(parsed.data).eq("id", id)
      : await supabase.from("commercial_agreements").insert(parsed.data);
    if (error) return { error: friendlyDbError(error, "agreement.save") };
    revalidatePath(`/companies/${parsed.data.company_id}`);
    back(fd);
    return { ok: true, message: parsed.data.kind === "msa" ? "Agreement saved. The company's MSA status was updated from it." : "Agreement saved." };
  });
}

export async function archiveAgreement(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  return withMember("agreement.archive", async ({ supabase }) => {
    if (!isUuid(id)) return { error: "Unknown agreement." };
    const { error } = await supabase.from("commercial_agreements").update({ archived_at: new Date().toISOString() }).eq("id", id);
    if (error) return { error: friendlyDbError(error, "agreement.archive") };
    back(fd);
    return { ok: true, message: "Agreement archived." };
  });
}

// ------------------------------------------------------------------ placements & earned revenue
export async function savePlacement(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  return withMember("placement.save", async ({ supabase }) => {
    const parsed = placementSchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return invalid(parsed.error);
    const { error } = isUuid(id)
      ? await supabase.from("placements").update(parsed.data).eq("id", id)
      : await supabase.from("placements").insert(parsed.data);
    if (error) return { error: friendlyDbError(error, "placement.save") };
    if (!isUuid(id)) {
      await supabase.from("activities").insert({
        type: "requirement_milestone", subject: `Placement recorded${parsed.data.label ? `: ${parsed.data.label}` : ""}`,
        requirement_id: parsed.data.requirement_id, occurred_at: new Date().toISOString(),
      });
    }
    revalidatePath(`/requirements/${parsed.data.requirement_id}`);
    back(fd);
    return { ok: true, message: "Placement saved. Placed count and earned revenue update automatically." };
  });
}

export async function saveRevenueEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  return withMember("revenue_event.save", async ({ supabase }) => {
    const parsed = revenueEventSchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return invalid(parsed.error);
    const v = parsed.data;
    const { error } = await supabase.from("revenue_events").insert({ ...v, status: v.earned_on && v.earned_on <= new Date().toISOString().slice(0, 10) ? "earned" : "expected" });
    if (error) return { error: friendlyDbError(error, "revenue_event.save") };
    revalidatePath(`/requirements/${v.requirement_id}`);
    back(fd);
    return { ok: true, message: v.earned_on ? "Milestone recorded." : "Expected milestone recorded. Set the date it was met to count it as earned." };
  });
}

export async function markRevenueEventEarned(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const earnedOn = str(fd, "earned_on");
  return withMember("revenue_event.earn", async ({ supabase }) => {
    if (!isUuid(id) || !/^\d{4}-\d{2}-\d{2}$/.test(earnedOn)) return { error: "Choose the date the milestone was met." };
    const { error } = await supabase.from("revenue_events").update({ status: "earned", earned_on: earnedOn }).eq("id", id).is("placement_id", null);
    if (error) return { error: friendlyDbError(error, "revenue_event.earn") };
    back(fd);
    return { ok: true, message: "Marked earned." };
  });
}

export async function reverseRevenueEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const reason = str(fd, "reason").trim();
  return withMember("revenue_event.reverse", async ({ supabase }) => {
    if (!isUuid(id) || !reason) return { error: "Give a reason for the reversal." };
    const { error } = await supabase.from("revenue_events").update({ status: "reversed", reversal_reason: reason.slice(0, 500) }).eq("id", id).is("placement_id", null);
    if (error) return { error: friendlyDbError(error, "revenue_event.reverse") };
    back(fd);
    return { ok: true, message: "Reversed (kept in history)." };
  });
}

// ------------------------------------------------------------------ invoices, payments, credits
export async function createInvoice(_: ActionState, fd: FormData): Promise<ActionState> {
  return withMember("invoice.create", async ({ supabase }) => {
    const parsed = invoiceSchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return invalid(parsed.error);
    const { error } = await supabase.from("invoices").insert(parsed.data);
    if (error) {
      if (error.message.includes("invoices_number_unique")) return { fieldErrors: { invoice_number: "That invoice number already exists" } };
      return { error: friendlyDbError(error, "invoice.create") };
    }
    await supabase.from("activities").insert({
      type: "invoice", subject: `Invoice ${parsed.data.invoice_number} issued: ${parsed.data.currency} ${parsed.data.amount.toLocaleString("en-IN")}`,
      company_id: parsed.data.company_id, requirement_id: parsed.data.requirement_id, occurred_at: new Date(`${parsed.data.issued_on}T12:00:00Z`).toISOString(),
    });
    back(fd);
    return { ok: true, message: "Invoice recorded. It counts as invoiced revenue — not realized until payment is received." };
  });
}

export async function cancelInvoice(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const reason = str(fd, "reason").trim();
  return withMember("invoice.cancel", async ({ supabase }) => {
    if (!isUuid(id) || !reason) return { error: "Give a reason for cancelling." };
    const { error } = await supabase.from("invoices").update({ status: "cancelled", cancel_reason: reason.slice(0, 500) }).eq("id", id);
    if (error) return { error: friendlyDbError(error, "invoice.cancel") };
    back(fd);
    return { ok: true, message: "Invoice cancelled (kept in history)." };
  });
}

export async function recordPayment(_: ActionState, fd: FormData): Promise<ActionState> {
  return withMember("payment.record", async ({ supabase }) => {
    const parsed = paymentSchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return invalid(parsed.error);
    const { data: inv } = await supabase.from("invoices").select("currency, company_id, requirement_id, invoice_number").eq("id", parsed.data.invoice_id).maybeSingle();
    if (!inv) return { error: "Invoice not found." };
    const { error } = await supabase.from("payments").insert({ ...parsed.data, currency: inv.currency });
    if (error) return { error: friendlyDbError(error, "payment.record") };
    await supabase.from("activities").insert({
      type: "payment", subject: `Payment received for ${inv.invoice_number}: ${inv.currency} ${parsed.data.amount.toLocaleString("en-IN")}`,
      company_id: inv.company_id, requirement_id: inv.requirement_id, occurred_at: new Date(`${parsed.data.received_on}T12:00:00Z`).toISOString(),
    });
    back(fd);
    return { ok: true, message: "Payment recorded as realized revenue." };
  });
}

export async function reversePayment(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const reason = str(fd, "reason").trim();
  return withMember("payment.reverse", async ({ supabase }) => {
    if (!isUuid(id) || !reason) return { error: "Give a reason for the reversal (e.g. bounced)." };
    const { error } = await supabase.from("payments").update({ reversed_at: new Date().toISOString(), reversal_reason: reason.slice(0, 500) }).eq("id", id).is("reversed_at", null);
    if (error) return { error: friendlyDbError(error, "payment.reverse") };
    back(fd);
    return { ok: true, message: "Payment reversed (kept in history)." };
  });
}

export async function addCredit(_: ActionState, fd: FormData): Promise<ActionState> {
  return withMember("credit.add", async ({ supabase }) => {
    const parsed = creditSchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return invalid(parsed.error);
    const { data: inv } = await supabase.from("invoices").select("currency").eq("id", parsed.data.invoice_id).maybeSingle();
    if (!inv) return { error: "Invoice not found." };
    const { error } = await supabase.from("credit_adjustments").insert({ ...parsed.data, currency: inv.currency });
    if (error) return { error: friendlyDbError(error, "credit.add") };
    back(fd);
    return { ok: true, message: "Credit recorded. It reduces the balance but is not cash received." };
  });
}
