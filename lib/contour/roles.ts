/**
 * Role discovery helpers for direction C.
 *
 * The roles themselves are the live candidate data (lib/candidate/roles.ts) —
 * the same list the current /candidates pages read. Nothing here adds a role,
 * a field or a value. Filter options are derived from the roles, so a filter
 * never offers a city or a work model that no open role has.
 *
 * Location and work model are separate questions. "Remote" is a way of
 * working, not a place; where a remote role still names locations, both are
 * shown, and nothing is inferred beyond what the role states.
 */

import { ROLES, type Role } from "@/lib/candidate/roles";
import {
  EXPERIENCE_BANDS,
  FUNCTIONS,
  LOCATIONS,
  WORK_MODELS,
  labelFor,
  type Option,
} from "@/lib/candidate/taxonomy";

export type Filters = {
  q: string;
  loc: string[];
  wm: string[];
  fn: string[];
  lvl: string[];
};

export const EMPTY_FILTERS: Filters = { q: "", loc: [], wm: [], fn: [], lvl: [] };

export type FilterKey = Exclude<keyof Filters, "q">;

export type CountedOption = { id: string; label: string; note?: string; count: number };

function counted(options: Option[], count: (id: string) => number): CountedOption[] {
  return options
    .map((o) => ({ id: o.id, label: o.label, note: o.note, count: count(o.id) }))
    .filter((o) => o.count > 0);
}

/** Locations grouped by region, in the taxonomy's own order. */
export function locationGroups(roles: Role[] = ROLES): Array<{ region: string; options: CountedOption[] }> {
  const groups = new Map<string, CountedOption[]>();
  for (const place of LOCATIONS) {
    const count = roles.filter((r) => r.locationIds.includes(place.id)).length;
    if (!count) continue;
    const region = place.id === "anywhere" ? "Not tied to a city" : place.region;
    if (!groups.has(region)) groups.set(region, []);
    groups.get(region)!.push({ id: place.id, label: place.label, count });
  }
  return Array.from(groups, ([region, options]) => ({ region, options }));
}

export function filterOptions(roles: Role[] = ROLES) {
  return {
    loc: locationGroups(roles),
    wm: counted(WORK_MODELS, (id) => roles.filter((r) => r.workModelIds.includes(id)).length),
    fn: counted(FUNCTIONS, (id) => roles.filter((r) => r.functionId === id).length),
    lvl: counted(EXPERIENCE_BANDS, (id) => roles.filter((r) => r.bandId === id).length),
  };
}

export const FILTER_LABELS: Record<FilterKey, string> = {
  loc: "Location",
  wm: "Work model",
  fn: "Function",
  lvl: "Experience",
};

export function optionLabel(key: FilterKey, id: string): string {
  switch (key) {
    case "loc":
      return labelFor(LOCATIONS, id);
    case "wm":
      return labelFor(WORK_MODELS, id);
    case "fn":
      return labelFor(FUNCTIONS, id);
    case "lvl":
      return labelFor(EXPERIENCE_BANDS, id);
  }
}

/** Keyword search across role, company descriptor, skills and function. */
export function matches(role: Role, f: Filters): boolean {
  const q = f.q.trim().toLowerCase();
  if (q) {
    const haystack = [role.title, role.company, role.summary, ...role.skills, labelFor(FUNCTIONS, role.functionId)]
      .join(" ")
      .toLowerCase();
    // Every word must appear somewhere — "senior data" finds a senior data role.
    if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false;
  }
  if (f.loc.length && !role.locationIds.some((l) => f.loc.includes(l))) return false;
  if (f.wm.length && !role.workModelIds.some((w) => f.wm.includes(w))) return false;
  if (f.fn.length && !f.fn.includes(role.functionId)) return false;
  if (f.lvl.length && !f.lvl.includes(role.bandId)) return false;
  return true;
}

export function search(f: Filters, roles: Role[] = ROLES): Role[] {
  return roles
    .filter((r) => matches(r, f))
    .sort((a, b) => (a.posted < b.posted ? 1 : a.posted > b.posted ? -1 : 0));
}

export function activeCount(f: Filters): number {
  return f.loc.length + f.wm.length + f.fn.length + f.lvl.length + (f.q.trim() ? 1 : 0);
}

/* --- URL ---------------------------------------------------------------- */

const KEYS: FilterKey[] = ["loc", "wm", "fn", "lvl"];

export function fromParams(params: URLSearchParams | null): Filters {
  if (!params) return EMPTY_FILTERS;
  const list = (k: string) =>
    (params.get(k) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return { q: params.get("q") ?? "", loc: list("loc"), wm: list("wm"), fn: list("fn"), lvl: list("lvl") };
}

export function toParams(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  for (const k of KEYS) if (f[k].length) p.set(k, f[k].join(","));
  const s = p.toString();
  return s ? `?${s}` : "";
}

/* --- Display ------------------------------------------------------------- */

export function locationsLabel(role: Role): string {
  return role.locationIds.map((l) => labelFor(LOCATIONS, l)).join(" · ");
}

export function workModelLabel(role: Role): string {
  return role.workModelIds.map((w) => labelFor(WORK_MODELS, w)).join(" / ");
}

/**
 * A remote role that still lists cities is not "work from anywhere". Say what
 * the role says, and no more.
 */
export function remoteNote(role: Role): string | null {
  const remote = role.workModelIds.includes("remote");
  const anyTimezone = role.workModelIds.includes("remote-global");
  const cities = role.locationIds.filter((l) => l !== "anywhere");
  if (anyTimezone) return "Remote in any timezone is offered for this role.";
  if (remote && cities.length) {
    return `Remote is offered; the role also lists ${cities.map((c) => labelFor(LOCATIONS, c)).join(", ")}. Read “How you’ll work” for what that means in practice.`;
  }
  return null;
}
