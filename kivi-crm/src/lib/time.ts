// Date/time helpers. The team works in one time zone (default Asia/Kolkata),
// so "today", due dates and <input type="datetime-local"> values are
// interpreted there, while the database stores UTC timestamps.

export const APP_TIME_ZONE = process.env.NEXT_PUBLIC_APP_TIME_ZONE || "Asia/Kolkata";

function partsInZone(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second };
}

/** Today's date (YYYY-MM-DD) in the app time zone. */
export function todayInZone(now = new Date(), timeZone = APP_TIME_ZONE): string {
  const { y, m, d } = partsInZone(now, timeZone);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Converts a wall-clock "YYYY-MM-DDTHH:mm" in `timeZone` to a UTC ISO string. */
export function zonedLocalToUtc(local: string, timeZone = APP_TIME_ZONE): string | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/);
  if (!m) return null;
  const [y, mo, d, h = "0", mi = "0"] = m.slice(1);
  const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  // Offset of the zone at that instant, then correct once (handles DST zones).
  const p = partsInZone(new Date(guess), timeZone);
  const asIfUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s);
  const offset = asIfUtc - guess;
  const result = new Date(guess - offset);
  if (Number.isNaN(result.getTime())) return null;
  return result.toISOString();
}

/** UTC ISO → "YYYY-MM-DDTHH:mm" in the app zone, for datetime-local inputs. */
export function utcToZonedLocal(iso: string | null | undefined, timeZone = APP_TIME_ZONE): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const p = partsInZone(date, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.min)}`;
}

/** Start of the given zone-local date, as a UTC ISO string. */
export function startOfZonedDay(isoDate: string, timeZone = APP_TIME_ZONE): string {
  return zonedLocalToUtc(`${isoDate}T00:00`, timeZone)!;
}

export function formatDate(value: string | null | undefined, opts: { withYear?: boolean } = {}): string {
  if (!value) return "—";
  const date = value.length === 10 ? new Date(`${value}T12:00:00Z`) : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: value.length === 10 ? "UTC" : APP_TIME_ZONE,
    day: "numeric", month: "short", ...(opts.withYear !== false ? { year: "numeric" } : {}),
  }).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: APP_TIME_ZONE, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  }).format(date);
}

export function formatRelative(value: string | null | undefined, now = new Date()): string {
  if (!value) return "—";
  const date = new Date(value);
  const diff = date.getTime() - now.getTime();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60_000) return "just now";
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), "hour");
  if (abs < 30 * 86_400_000) return rtf.format(Math.round(diff / 86_400_000), "day");
  return formatDate(value);
}

/** Days from today (zone-local) until a YYYY-MM-DD date; negative = overdue. */
export function daysUntil(isoDate: string, today = todayInZone()): number {
  return Math.round((Date.parse(`${isoDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}
