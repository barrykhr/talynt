// Small helpers for list pages: pagination, safe search patterns and reading
// filters from URL search params.

import { PAGE_SIZE } from "@/lib/constants";

export type SearchParams = Record<string, string | string[] | undefined>;

export function param(sp: SearchParams, key: string): string {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return (s ?? "").slice(0, 200);
}

export function pageParam(sp: SearchParams): number {
  const n = parseInt(param(sp, "page"), 10);
  return Number.isFinite(n) && n >= 1 && n <= 10000 ? n : 1;
}

export function pageRange(page: number, size = PAGE_SIZE): [number, number] {
  const from = (page - 1) * size;
  return [from, from + size - 1];
}

/** LIKE pattern with %, _ and \ escaped (PostgREST passes it as a parameter). */
export function likePattern(q: string): string {
  return `%${q.trim().toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

/** Builds a query string for links while preserving other filters. */
export function withParams(base: string, sp: SearchParams, changes: Record<string, string | null>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const s = Array.isArray(v) ? v[0] : v;
    if (s && k !== "notice") params.set(k, s);
  }
  for (const [k, v] of Object.entries(changes)) {
    if (v === null || v === "") params.delete(k);
    else params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
