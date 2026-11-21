import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";
import { domainFromEmail } from "@/lib/normalize";
import { getAccessToken, markConnection } from "./tokens";
import { GoogleAuthRevokedError } from "./oauth";
import { getMessageMeta, getProfile, gmailThreadLink, header, HistoryExpiredError, listHistory, listMessages } from "./gmail";
import { eventEnd, eventStart, listEvents } from "./calendar";
import { classify, type CompanyRef, type ContactRef } from "./match";
import { parseAddressList } from "./mime";
import type { GoogleProduct } from "./scopes";

const MAX_MESSAGES_PER_RUN = 300;
const INITIAL_LOOKBACK_DAYS = 30;
const SKIP_LABELS = new Set(["DRAFT", "SPAM", "TRASH", "CHAT"]);

export interface SyncResult { checked: number; logged: number; updated: number; review: number; skipped: number }

async function lookups(emails: string[]) {
  const admin = createAdminClient();
  const unique = [...new Set(emails)];
  const domains = [...new Set(unique.map(domainFromEmail).filter(Boolean) as string[])];
  const [{ data: contacts }, { data: companies }] = await Promise.all([
    unique.length ? admin.from("contacts").select("id, email, company_id").in("email", unique).is("archived_at", null) : Promise.resolve({ data: [] }),
    domains.length ? admin.from("companies").select("id, domain").in("domain", domains).is("archived_at", null) : Promise.resolve({ data: [] }),
  ]);
  return { contacts: (contacts ?? []) as ContactRef[], companies: (companies ?? []) as CompanyRef[] };
}

async function exclusions(userId: string, product: GoogleProduct) {
  const admin = createAdminClient();
  const { data } = await admin.from("sync_exclusions").select("external_key").eq("user_id", userId).eq("product", product);
  return new Set((data ?? []).map((r: { external_key: string }) => r.external_key));
}

async function alreadyKnown(userId: string, origin: "gmail" | "calendar", ids: string[]) {
  if (!ids.length) return new Set<string>();
  const admin = createAdminClient();
  const product = origin;
  const [{ data: acts }, { data: reviews }] = await Promise.all([
    admin.from("activities").select("external_id").eq("origin", origin).eq("external_owner_id", userId).in("external_id", ids),
    admin.from("sync_review_items").select("external_id").eq("user_id", userId).eq("product", product).in("external_id", ids),
  ]);
  return new Set([...(acts ?? []), ...(reviews ?? [])].map((r: { external_id: string }) => r.external_id));
}

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === "23505";
}

// ------------------------------------------------------------------ Gmail
export async function syncGmail(userId: string): Promise<SyncResult> {
  const result: SyncResult = { checked: 0, logged: 0, updated: 0, review: 0, skipped: 0 };
  const { token, connection } = await getAccessToken(userId, "gmail");
  const self = connection.google_email;
  const admin = createAdminClient();
  const excluded = await exclusions(userId, "gmail");

  // 1. Work out which message ids are new.
  let ids: string[] = [];
  let nextCursor: string | null = connection.sync_cursor;
  const cutoff = Date.now() - INITIAL_LOOKBACK_DAYS * 86_400_000;
  let initial = !connection.sync_cursor;

  if (!initial) {
    try {
      let pageToken: string | undefined;
      do {
        const h = await listHistory(token, connection.sync_cursor!, pageToken);
        for (const entry of h.history ?? []) for (const m of entry.messagesAdded ?? []) ids.push(m.message.id);
        nextCursor = h.historyId;
        pageToken = h.nextPageToken;
      } while (pageToken && ids.length < MAX_MESSAGES_PER_RUN);
    } catch (err) {
      if (!(err instanceof HistoryExpiredError)) throw err;
      initial = true; // Cursor too old: fall back to a bounded rescan.
      ids = [];
    }
  }
  if (initial) {
    const profile = await getProfile(token);
    nextCursor = profile.historyId;
    let pageToken: string | undefined;
    do {
      const page = await listMessages(token, pageToken);
      ids.push(...(page.messages ?? []).map((m) => m.id));
      pageToken = page.nextPageToken;
    } while (pageToken && ids.length < 200);
  }

  ids = [...new Set(ids)].slice(0, MAX_MESSAGES_PER_RUN);
  const known = await alreadyKnown(userId, "gmail", ids);
  const fresh = ids.filter((id) => !known.has(id));

  // 2. Fetch metadata (headers only) and classify.
  for (const id of fresh) {
    result.checked++;
    let meta;
    try {
      meta = await getMessageMeta(token, id);
    } catch (err) {
      if (err instanceof GoogleAuthRevokedError) throw err;
      result.skipped++;
      continue; // Deleted since listing, etc.
    }
    const occurred = Number(meta.internalDate);
    if (initial && occurred < cutoff) { result.skipped++; continue; }
    if ((meta.labelIds ?? []).some((l) => SKIP_LABELS.has(l)) || excluded.has(meta.threadId)) { result.skipped++; continue; }

    const from = parseAddressList(header(meta, "From"));
    const to = parseAddressList(header(meta, "To"));
    const cc = parseAddressList(header(meta, "Cc"));
    const all = [...from, ...to, ...cc].map((a) => a.email);
    const { contacts, companies } = await lookups(all);
    const match = classify(all, self, contacts, companies);
    const subject = (header(meta, "Subject") ?? "(no subject)").slice(0, 300);
    const outbound = from[0]?.email === self;
    const occurredIso = new Date(occurred).toISOString();

    if (match.kind === "logged") {
      const { error } = await admin.from("activities").insert({
        type: "email",
        subject,
        occurred_at: occurredIso,
        contact_id: match.contactId,
        company_id: match.companyId,
        owner_id: userId,
        created_by: userId,
        origin: "gmail",
        external_owner_id: userId,
        external_id: meta.id,
        external_thread_id: meta.threadId,
        external_meta: {
          direction: outbound ? "outbound" : "inbound",
          from: from[0]?.email ?? null,
          to: to.map((a) => a.email).slice(0, 20),
          cc: cc.map((a) => a.email).slice(0, 20),
          link: gmailThreadLink(self, meta.threadId),
        },
      });
      if (error && !isUniqueViolation(error)) log.warn("gmail.sync.insert_failed", { code: error.code });
      else if (!error) result.logged++;
    } else if (match.kind === "review") {
      const { error } = await admin.from("sync_review_items").upsert({
        user_id: userId, product: "gmail", external_id: meta.id, external_thread_id: meta.threadId, subject,
        participants: [...from.map((a) => ({ ...a, role: "from" })), ...to.map((a) => ({ ...a, role: "to" })), ...cc.map((a) => ({ ...a, role: "cc" }))].slice(0, 30),
        occurred_at: occurredIso, suggested_company_id: match.companyId,
      }, { onConflict: "user_id,product,external_id", ignoreDuplicates: true });
      if (!error) result.review++;
    } else {
      result.skipped++;
    }
  }

  await markConnection(userId, "gmail", {
    sync_cursor: nextCursor, last_sync_at: new Date().toISOString(), last_sync_result: result,
    status: "connected", last_error: null,
  });
  return result;
}

// ------------------------------------------------------------------ Calendar
export async function syncCalendar(userId: string): Promise<SyncResult> {
  const result: SyncResult = { checked: 0, logged: 0, updated: 0, review: 0, skipped: 0 };
  const { token, connection } = await getAccessToken(userId, "calendar");
  const self = connection.google_email;
  const admin = createAdminClient();
  const excluded = await exclusions(userId, "calendar");
  const now = Date.now();
  const timeMin = new Date(now - INITIAL_LOOKBACK_DAYS * 86_400_000).toISOString();
  const timeMax = new Date(now + 60 * 86_400_000).toISOString();
  const updatedMin = connection.last_sync_at ? new Date(new Date(connection.last_sync_at).getTime() - 10 * 60_000).toISOString() : undefined;

  let pageToken: string | undefined;
  let pages = 0;
  do {
    const page = await listEvents(token, { timeMin, timeMax, updatedMin, pageToken });
    pageToken = page.nextPageToken;
    pages++;
    for (const ev of page.items ?? []) {
      result.checked++;
      if (excluded.has(ev.id)) { result.skipped++; continue; }
      const start = eventStart(ev);
      const end = eventEnd(ev);
      const attendees = (ev.attendees ?? []).filter((a) => a.email && !a.resource).map((a) => a.email!.toLowerCase());
      if (ev.organizer?.email) attendees.push(ev.organizer.email.toLowerCase());

      const { data: existing } = await admin.from("activities").select("id")
        .eq("origin", "calendar").eq("external_owner_id", userId).eq("external_id", ev.id).maybeSingle();
      const meta = { status: ev.status, attendees: [...new Set(attendees)].slice(0, 30), link: ev.htmlLink ?? null };

      if (existing) {
        await admin.from("activities").update({
          subject: (ev.summary ?? "(untitled meeting)").slice(0, 300),
          starts_at: start, ends_at: end, occurred_at: start ?? undefined,
          meeting_location: ev.location?.slice(0, 300) ?? null, external_meta: meta,
        }).eq("id", existing.id);
        result.updated++;
        continue;
      }
      if (ev.status === "cancelled" || !start) { result.skipped++; continue; }

      const { contacts, companies } = await lookups(attendees);
      const match = classify(attendees, self, contacts, companies);
      if (match.kind === "logged") {
        const { error } = await admin.from("activities").insert({
          type: "meeting", subject: (ev.summary ?? "(untitled meeting)").slice(0, 300), occurred_at: start,
          starts_at: start, ends_at: end, meeting_location: ev.location?.slice(0, 300) ?? null,
          contact_id: match.contactId, company_id: match.companyId, owner_id: userId, created_by: userId,
          origin: "calendar", external_owner_id: userId, external_id: ev.id, external_meta: meta,
        });
        if (error && !isUniqueViolation(error)) log.warn("calendar.sync.insert_failed", { code: error.code });
        else if (!error) result.logged++;
      } else if (match.kind === "review") {
        const { error } = await admin.from("sync_review_items").upsert({
          user_id: userId, product: "calendar", external_id: ev.id, subject: (ev.summary ?? "(untitled meeting)").slice(0, 300),
          participants: meta.attendees.map((email) => ({ email })), occurred_at: start, suggested_company_id: match.companyId,
        }, { onConflict: "user_id,product,external_id", ignoreDuplicates: true });
        if (!error) result.review++;
      } else {
        result.skipped++;
      }
    }
  } while (pageToken && pages < 8);

  await markConnection(userId, "calendar", {
    last_sync_at: new Date().toISOString(), last_sync_result: result, status: "connected", last_error: null,
  });
  return result;
}

/** Runs one product's sync and records failures on the connection. */
export async function runSync(userId: string, product: GoogleProduct): Promise<{ ok: boolean; result?: SyncResult; error?: string }> {
  try {
    const result = product === "gmail" ? await syncGmail(userId) : await syncCalendar(userId);
    log.info("google.sync.done", { product, ...result });
    return { ok: true, result };
  } catch (err) {
    if (err instanceof GoogleAuthRevokedError) {
      return { ok: false, error: "Google access was revoked or expired. Reconnect to resume syncing." };
    }
    log.error("google.sync.failed", { product, error: err });
    await markConnection(userId, product, {
      status: "error", last_error: "The last sync failed. It will retry automatically; reconnect if this keeps happening.",
    });
    return { ok: false, error: "Sync failed. Please try again in a few minutes." };
  }
}
