import "server-only";
import { googleFetch } from "./oauth";

const BASE = "https://www.googleapis.com/calendar/v3/calendars/primary";

export interface CalendarEvent {
  id: string;
  status: "confirmed" | "tentative" | "cancelled";
  summary?: string;
  location?: string;
  htmlLink?: string;
  updated: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  organizer?: { email?: string; self?: boolean };
  attendees?: { email?: string; displayName?: string; self?: boolean; responseStatus?: string; resource?: boolean }[];
}

export function listEvents(token: string, opts: { timeMin: string; timeMax: string; updatedMin?: string; pageToken?: string }) {
  const params = new URLSearchParams({
    timeMin: opts.timeMin, timeMax: opts.timeMax, singleEvents: "true", showDeleted: "true", maxResults: "250",
  });
  if (opts.updatedMin) params.set("updatedMin", opts.updatedMin);
  if (opts.pageToken) params.set("pageToken", opts.pageToken);
  return googleFetch<{ items?: CalendarEvent[]; nextPageToken?: string }>(token, `${BASE}/events?${params}`);
}

export function insertEvent(token: string, event: {
  summary: string; description?: string | null; location?: string | null; start: string; end: string; attendees: string[];
}, sendUpdates: boolean) {
  const params = new URLSearchParams({ sendUpdates: sendUpdates ? "all" : "none" });
  return googleFetch<CalendarEvent>(token, `${BASE}/events?${params}`, {
    method: "POST",
    body: JSON.stringify({
      summary: event.summary,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      start: { dateTime: event.start },
      end: { dateTime: event.end },
      attendees: event.attendees.map((email) => ({ email })),
    }),
  });
}

export function eventStart(e: CalendarEvent): string | null {
  return e.start?.dateTime ?? (e.start?.date ? `${e.start.date}T00:00:00Z` : null);
}
export function eventEnd(e: CalendarEvent): string | null {
  return e.end?.dateTime ?? (e.end?.date ? `${e.end.date}T00:00:00Z` : null);
}
