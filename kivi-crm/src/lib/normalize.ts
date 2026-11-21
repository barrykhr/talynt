// Input normalisation shared by forms and spreadsheet imports.
// normalizeCompanyName / normalizeDomain mirror the SQL functions of the same
// name so duplicate detection behaves identically in previews and in the DB.

import {
  LEAD_SOURCES, MSA_STATUSES, OPPORTUNITY_STAGES, REQUIREMENT_STATUSES,
  type LeadSource, type MsaStatus, type OpportunityStage, type RequirementStatus,
} from "@/lib/constants";

const COMPANY_SUFFIXES =
  /\b(private|pvt|limited|ltd|llp|llc|inc|incorporated|corp|corporation|co|company|plc|gmbh|the)\b/g;

export function normalizeCompanyName(name: string | null | undefined): string {
  return (name ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(COMPANY_SUFFIXES, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeDomain(value: string | null | undefined): string | null {
  const v = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#:].*$/, "");
  return v || null;
}

export function domainFromEmail(email: string | null | undefined): string | null {
  const at = (email ?? "").lastIndexOf("@");
  return at > 0 ? normalizeDomain((email ?? "").slice(at + 1)) : null;
}

/** Free-mail domains never identify a company. */
export const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "outlook.com", "hotmail.com", "live.com",
  "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com", "rediffmail.com", "zoho.com",
]);

const EMAIL_RE = /^[^@\s<>()",;]+@[^@\s<>()",;]+\.[^@\s<>()",;]+$/;

export function normalizeEmail(value: string | null | undefined): string | null {
  const v = (value ?? "").trim().toLowerCase().replace(/^mailto:/, "");
  return v && EMAIL_RE.test(v) ? v : null;
}

export function isValidEmail(value: string | null | undefined): boolean {
  return normalizeEmail(value) !== null;
}

export function normalizePhone(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  const cleaned = v.replace(/[^\d+()\-.\s]/g, "").replace(/\s+/g, " ").trim();
  return cleaned.replace(/\D/g, "").length >= 6 ? cleaned.slice(0, 40) : null;
}

export function cleanText(value: unknown, max = 20000): string | null {
  if (value === null || value === undefined) return null;
  const v = String(value).replace(/\u0000/g, "").trim();
  return v ? v.slice(0, max) : null;
}

function key(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const SOURCE_ALIASES: Record<string, LeadSource> = {
  spreadsheet: "spreadsheet", sheet: "spreadsheet", excel: "spreadsheet", csv: "spreadsheet", upload: "spreadsheet",
  "spreadsheet upload": "spreadsheet", import: "spreadsheet",
  referral: "referral", referred: "referral", reference: "referral",
  linkedin: "linkedin", "linked in": "linkedin", "linkedin research": "linkedin", li: "linkedin",
  website: "website", web: "website", "website form": "website", "web form": "website", form: "website", inbound: "website",
  event: "event", events: "event", conference: "event", meetup: "event", "trade show": "event",
  whatsapp: "whatsapp", "whats app": "whatsapp", wa: "whatsapp",
  other: "other",
};

export function normalizeSource(value: unknown): LeadSource | null {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const k = key(String(value));
  if (SOURCE_ALIASES[k]) return SOURCE_ALIASES[k];
  const direct = LEAD_SOURCES.values.find((s) => key(LEAD_SOURCES.label[s]) === k || s === k.replace(/ /g, "_"));
  return direct ?? "other";
}

function fromLabels<T extends string>(table: { values: T[]; label: Record<T, string> }, value: unknown, aliases: Record<string, T> = {}): T | null {
  if (value === null || value === undefined) return null;
  const k = key(String(value));
  if (!k) return null;
  if (aliases[k]) return aliases[k];
  return table.values.find((v) => v === k.replace(/ /g, "_") || key(table.label[v]) === k) ?? null;
}

export function normalizeStage(value: unknown): OpportunityStage | null {
  return fromLabels(OPPORTUNITY_STAGES, value, {
    new: "new_lead", lead: "new_lead", research: "researching", "to contact": "ready_to_contact",
    "in discussion": "in_conversation", conversation: "in_conversation", proposal: "proposal_msa",
    msa: "proposal_msa", "proposal msa": "proposal_msa", "closed won": "won", "closed lost": "lost",
  });
}

export function normalizeMsa(value: unknown): MsaStatus | null {
  return fromLabels(MSA_STATUSES, value, {
    no: "not_started", none: "not_started", "not signed": "not_started", discussion: "in_discussion",
    negotiating: "in_discussion", pending: "in_discussion", yes: "signed", done: "signed",
  });
}

export function normalizeRequirementStatus(value: unknown): RequirementStatus | null {
  return fromLabels(REQUIREMENT_STATUSES, value, {
    new: "new_requirement", open: "new_requirement", "on hold": "on_hold", hold: "on_hold",
    closed: "closed_filled", filled: "closed_filled", "closed filled": "closed_filled",
  });
}

/** Parses positive whole numbers like "5", "5 roles", "1,200". */
export function parsePositiveInt(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 1 ? Math.floor(value) : null;
  const m = String(value ?? "").replace(/,/g, "").match(/\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return n >= 1 && n <= 100000 ? n : null;
}

/**
 * Parses dates from spreadsheets: ISO (2026-03-04), day-first (04/03/2026,
 * 4-3-26 — the Indian convention) and JS Date objects. Returns YYYY-MM-DD.
 */
export function parseDateLoose(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  const v = String(value ?? "").trim();
  if (!v) return null;
  let y: number, m: number, d: number;
  let match = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/))) {
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
    if (y < 100) y += 2000;
  } else {
    return null;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}
