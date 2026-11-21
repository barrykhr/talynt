"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { googleConfig } from "@/lib/env";
import { emailComposeSchema, fieldErrors, formDataToObject, meetingSchema } from "@/lib/validation";
import { friendlyDbError } from "@/lib/db-errors";
import { isUuid } from "@/lib/data/query";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { log } from "@/lib/log";
import { buildRawMessage } from "@/lib/google/mime";
import { gmailThreadLink, sendMessage } from "@/lib/google/gmail";
import { insertEvent } from "@/lib/google/calendar";
import { getAccessToken, disconnect } from "@/lib/google/tokens";
import { GoogleAuthRevokedError } from "@/lib/google/oauth";
import { runSync } from "@/lib/google/sync";
import { isGoogleProduct } from "@/lib/google/scopes";
import { displayName } from "@/lib/data/team";
import { str, withMember } from "./helpers";
import type { ActionState } from "@/lib/types";

const NOT_CONFIGURED = "Gmail and Calendar aren't configured on this server yet. You can still log emails and meetings manually.";

export async function sendCrmEmail(_: ActionState, fd: FormData): Promise<ActionState> {
  let back = "";
  const result = await withMember("google.send", async ({ supabase, member }) => {
    if (!googleConfig()) return { error: NOT_CONFIGURED };
    const parsed = emailComposeSchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const v = parsed.data;
    if (!v.company_id && !v.contact_id && !v.opportunity_id && !v.requirement_id) return { error: "Emails sent from the CRM must be linked to a record." };

    let token: string, fromEmail: string;
    try {
      const t = await getAccessToken(member.id, "gmail");
      token = t.token;
      fromEmail = t.connection.google_email;
    } catch (err) {
      if (err instanceof GoogleAuthRevokedError) return { error: "Your Gmail connection needs to be reconnected in Settings before you can send." };
      throw err;
    }

    let sent: { id: string; threadId: string };
    try {
      const raw = buildRawMessage({ from: fromEmail, fromName: displayName(member), to: v.to, subject: v.subject, body: v.body });
      sent = await sendMessage(token, raw);
    } catch (err) {
      if (err instanceof GoogleAuthRevokedError) return { error: "Gmail rejected the request — please reconnect Gmail in Settings." };
      log.error("google.send_failed", { error: err });
      return { error: "Gmail couldn't send this message. Nothing was sent — please try again." };
    }

    // Log as the user (RLS applies). The CRM keeps the text you wrote here.
    const { error } = await supabase.from("activities").insert({
      type: "email",
      subject: v.subject,
      body: v.body,
      occurred_at: new Date().toISOString(),
      company_id: v.company_id, contact_id: v.contact_id, opportunity_id: v.opportunity_id, requirement_id: v.requirement_id,
      owner_id: member.id,
      origin: "gmail",
      external_owner_id: member.id,
      external_id: sent.id,
      external_thread_id: sent.threadId,
      external_meta: { direction: "outbound", from: fromEmail, to: v.to, link: gmailThreadLink(fromEmail, sent.threadId) },
    });
    if (error) {
      log.error("google.send_log_failed", { code: error.code });
      return { error: "The email was sent, but logging it to the CRM failed. Sync will pick it up if the recipient is a contact." };
    }
    const draftId = str(fd, "draft_id");
    if (isUuid(draftId)) {
      const { data: act } = await supabase.from("activities").select("id").eq("origin", "gmail").eq("external_owner_id", member.id).eq("external_id", sent.id).maybeSingle();
      await supabase.from("outreach_drafts").update({ status: "sent_email", body: v.body, subject: v.subject, sent_activity_id: act?.id ?? null }).eq("id", draftId);
    }
    back = safeRedirectPath(str(fd, "back"), "/");
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath(back.split("?")[0]);
    redirect(`${back.split("?")[0]}?notice=email_sent`);
  }
  return result;
}

export async function createCrmMeeting(_: ActionState, fd: FormData): Promise<ActionState> {
  let back = "";
  const result = await withMember("google.meeting", async ({ supabase, member }) => {
    if (!googleConfig()) return { error: NOT_CONFIGURED };
    const parsed = meetingSchema.safeParse(formDataToObject(fd));
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Please fix the highlighted fields." };
    const v = parsed.data;
    const start = v.starts_at!;
    const end = new Date(new Date(start).getTime() + v.duration_minutes * 60_000).toISOString();

    let event;
    try {
      const { token } = await getAccessToken(member.id, "calendar");
      event = await insertEvent(token, { summary: v.title, description: v.description, location: v.location, start, end, attendees: v.attendee_emails }, v.send_invites);
    } catch (err) {
      if (err instanceof GoogleAuthRevokedError) return { error: "Your Google Calendar connection needs to be reconnected in Settings." };
      log.error("google.meeting_failed", { error: err });
      return { error: "Google Calendar couldn't create the event. Nothing was created — please try again." };
    }

    const { error } = await supabase.from("activities").insert({
      type: "meeting", subject: v.title, body: v.description, occurred_at: start, starts_at: start, ends_at: end,
      meeting_location: v.location,
      company_id: v.company_id, contact_id: v.contact_id, opportunity_id: v.opportunity_id, requirement_id: v.requirement_id,
      owner_id: member.id, origin: "calendar", external_owner_id: member.id, external_id: event.id,
      external_meta: { status: event.status, attendees: v.attendee_emails, link: event.htmlLink ?? null },
    });
    if (error && error.code !== "23505") {
      log.error("google.meeting_log_failed", { code: error.code });
      return { error: "The meeting is on your calendar, but logging it to the CRM failed. The next sync will retry." };
    }
    back = safeRedirectPath(str(fd, "back"), "/");
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath(back.split("?")[0]);
    redirect(`${back.split("?")[0]}?notice=meeting_created`);
  }
  return result;
}

export async function syncNow(_: ActionState, fd: FormData): Promise<ActionState> {
  const product = str(fd, "product");
  return withMember("google.sync_now", async ({ member }) => {
    if (!googleConfig()) return { error: NOT_CONFIGURED };
    if (!isGoogleProduct(product)) return { error: "Unknown connection." };
    const r = await runSync(member.id, product);
    revalidatePath("/settings");
    if (!r.ok) return { error: r.error };
    const s = r.result!;
    return { ok: true, message: `Checked ${s.checked}: ${s.logged} logged, ${s.updated} updated, ${s.review} to review.` };
  });
}

export async function disconnectGoogle(_: ActionState, fd: FormData): Promise<ActionState> {
  const product = str(fd, "product");
  const result = await withMember("google.disconnect", async ({ supabase, member }) => {
    if (!isGoogleProduct(product)) return { error: "Unknown connection." };
    await disconnect(member.id, product);
    await supabase.rpc("log_security_event", { p_action: "integration.disconnected", p_details: { product } });
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath("/settings");
    redirect("/settings?notice=disconnected");
  }
  return result;
}

/** Log a review-queue item (email or meeting) against a chosen record. */
export async function logReviewItem(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  const contactId = str(fd, "contact_id");
  const companyId = str(fd, "company_id");
  return withMember("google.review_log", async ({ supabase, member }) => {
    if (!isUuid(id) || (!isUuid(contactId) && !isUuid(companyId))) return { error: "Choose a contact or company." };
    const { data: item } = await supabase.from("sync_review_items").select("*").eq("id", id).eq("state", "pending").maybeSingle();
    if (!item) return { error: "This item was already handled." };
    const isMail = item.product === "gmail";
    const participants = (item.participants ?? []) as { email: string; role?: string }[];
    const { data: act, error } = await supabase.from("activities").insert({
      type: isMail ? "email" : "meeting",
      subject: item.subject ?? (isMail ? "(no subject)" : "(untitled meeting)"),
      occurred_at: item.occurred_at,
      starts_at: isMail ? null : item.occurred_at,
      contact_id: isUuid(contactId) ? contactId : null,
      company_id: isUuid(companyId) ? companyId : null,
      owner_id: member.id,
      origin: item.product,
      external_owner_id: member.id,
      external_id: item.external_id,
      external_thread_id: item.external_thread_id,
      external_meta: isMail
        ? { from: participants.find((p) => p.role === "from")?.email ?? null, to: participants.filter((p) => p.role === "to").map((p) => p.email) }
        : { attendees: participants.map((p) => p.email) },
    }).select("id").single();
    if (error) return { error: friendlyDbError(error, "google.review_log") };
    await supabase.from("sync_review_items").update({ state: "logged", activity_id: act.id }).eq("id", id);
    revalidatePath("/settings");
    return { ok: true, message: "Logged to the CRM." };
  });
}

export async function ignoreReviewItem(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = str(fd, "id");
  return withMember("google.review_ignore", async ({ supabase, member }) => {
    if (!isUuid(id)) return { error: "Unknown item." };
    const { data: item } = await supabase.from("sync_review_items").select("product, external_id, external_thread_id").eq("id", id).maybeSingle();
    if (!item) return { error: "This item was already handled." };
    await supabase.from("sync_review_items").update({ state: "ignored" }).eq("id", id);
    await supabase.from("sync_exclusions").upsert(
      { user_id: member.id, product: item.product, external_key: item.product === "gmail" ? item.external_thread_id ?? item.external_id : item.external_id },
      { onConflict: "user_id,product,external_key", ignoreDuplicates: true },
    );
    revalidatePath("/settings");
    return { ok: true, message: "Ignored. It won't be suggested again." };
  });
}
