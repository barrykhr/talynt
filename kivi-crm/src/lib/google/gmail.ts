import "server-only";
import { googleFetch, GoogleApiError } from "./oauth";

const BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export interface GmailMessageMeta {
  id: string;
  threadId: string;
  labelIds?: string[];
  internalDate: string;
  payload?: { headers?: { name: string; value: string }[] };
}

export class HistoryExpiredError extends Error {}

export function sendMessage(token: string, raw: string) {
  return googleFetch<{ id: string; threadId: string }>(token, `${BASE}/messages/send`, {
    method: "POST",
    body: JSON.stringify({ raw }),
  });
}

export function getProfile(token: string) {
  return googleFetch<{ emailAddress: string; historyId: string }>(token, `${BASE}/profile`);
}

export function listMessages(token: string, pageToken?: string) {
  // The gmail.metadata scope does not allow the `q` search parameter, so we
  // page through recent messages and filter locally.
  const params = new URLSearchParams({ maxResults: "100", includeSpamTrash: "false" });
  if (pageToken) params.set("pageToken", pageToken);
  return googleFetch<{ messages?: { id: string; threadId: string }[]; nextPageToken?: string }>(token, `${BASE}/messages?${params}`);
}

export function getMessageMeta(token: string, id: string) {
  const params = new URLSearchParams({ format: "metadata" });
  for (const h of ["From", "To", "Cc", "Subject", "Date"]) params.append("metadataHeaders", h);
  return googleFetch<GmailMessageMeta>(token, `${BASE}/messages/${encodeURIComponent(id)}?${params}`);
}

export async function listHistory(token: string, startHistoryId: string, pageToken?: string) {
  const params = new URLSearchParams({ startHistoryId, historyTypes: "messageAdded", maxResults: "500" });
  if (pageToken) params.set("pageToken", pageToken);
  try {
    return await googleFetch<{
      history?: { messagesAdded?: { message: { id: string; threadId: string; labelIds?: string[] } }[] }[];
      historyId: string;
      nextPageToken?: string;
    }>(token, `${BASE}/history?${params}`);
  } catch (err) {
    if (err instanceof GoogleApiError && err.status === 404) throw new HistoryExpiredError();
    throw err;
  }
}

export function header(meta: GmailMessageMeta, name: string): string | null {
  return meta.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? null;
}

export function gmailThreadLink(email: string, threadId: string) {
  return `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(email)}#all/${encodeURIComponent(threadId)}`;
}
