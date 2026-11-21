// Spreadsheet import planning. Pure functions (no I/O) so the rules are easy
// to test: mapping, normalisation, validation and duplicate decisions.
//
// Imported cells are treated strictly as text. Nothing is evaluated: XLSX
// formulas are read as their cached values by the parser, and CSV cells that
// look like formulas are stored as plain text (and neutralised again on export).

import {
  cleanText, normalizeCompanyName, normalizeDomain, normalizeEmail, normalizeMsa, normalizePhone,
  normalizeSource, normalizeStage, parseDateLoose, parsePositiveInt, domainFromEmail, PERSONAL_EMAIL_DOMAINS,
} from "@/lib/normalize";
import type { LeadSource, MsaStatus, OpportunityStage } from "@/lib/constants";

export type ImportKind = "leads" | "companies" | "contacts";

export const IMPORT_FIELDS = {
  company_name: { label: "Company", aliases: ["company", "company name", "organisation", "organization", "account", "client", "employer", "firm"] },
  company_website: { label: "Website / domain", aliases: ["website", "domain", "url", "web", "site", "company website"] },
  industry: { label: "Industry", aliases: ["industry", "sector", "vertical"] },
  contact_name: { label: "Contact name", aliases: ["contact", "contact name", "name", "full name", "person", "poc", "spoc"] },
  contact_first: { label: "Contact first name", aliases: ["first name", "firstname", "given name"] },
  contact_last: { label: "Contact last name", aliases: ["last name", "lastname", "surname", "family name"] },
  contact_role: { label: "Contact role", aliases: ["role", "title", "designation", "job title", "position", "contact role"] },
  contact_email: { label: "Work email", aliases: ["email", "e-mail", "email address", "work email", "mail"] },
  contact_phone: { label: "Phone", aliases: ["phone", "mobile", "phone number", "contact number", "whatsapp", "cell", "tel"] },
  hiring_need: { label: "Hiring role or need", aliases: ["hiring role", "hiring need", "requirement", "need", "roles", "hiring for", "open roles", "position needed"] },
  hiring_volume: { label: "Hiring volume", aliases: ["hiring volume", "volume", "headcount", "openings", "no of positions", "number of positions", "positions", "count"] },
  location: { label: "Location", aliases: ["location", "city", "office", "region", "place"] },
  source: { label: "Lead source", aliases: ["source", "lead source", "channel", "origin"] },
  budget: { label: "Budget", aliases: ["budget", "fee", "commercials", "rate", "ctc"] },
  owner: { label: "Owner (email or name)", aliases: ["owner", "assigned to", "account owner", "lead owner", "rep", "bdm"] },
  follow_up: { label: "Next follow-up date", aliases: ["follow up", "follow-up", "next follow up", "followup", "follow up date", "next step date", "next action date"] },
  stage: { label: "Sales stage", aliases: ["stage", "status", "lead status", "pipeline stage"] },
  msa_status: { label: "MSA status", aliases: ["msa", "msa status", "agreement"] },
  notes: { label: "Notes", aliases: ["notes", "note", "comments", "remarks", "description", "details"] },
} as const;

export type ImportField = keyof typeof IMPORT_FIELDS;
export type Mapping = Partial<Record<ImportField, number>>; // field → column index

export const REQUIRED_FIELDS: Record<ImportKind, ImportField[][]> = {
  // Each inner list is "one of these" (e.g. a contact name or first name).
  leads: [["company_name"]],
  companies: [["company_name"]],
  contacts: [["contact_name", "contact_first"]],
};

export const MAX_IMPORT_ROWS = 2000;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Suggests a mapping from header names. Each column is used at most once. */
export function autoMap(headers: string[]): Mapping {
  const mapping: Mapping = {};
  const used = new Set<number>();
  const h = headers.map(norm);
  for (const [field, def] of Object.entries(IMPORT_FIELDS) as [ImportField, (typeof IMPORT_FIELDS)[ImportField]][]) {
    let idx = h.findIndex((x, i) => !used.has(i) && (def.aliases as readonly string[]).includes(x));
    if (idx < 0) idx = h.findIndex((x, i) => !used.has(i) && (def.aliases as readonly string[]).some((a) => a.length > 3 && x.includes(a)));
    if (idx >= 0) {
      mapping[field] = idx;
      used.add(idx);
    }
  }
  return mapping;
}

export interface TeamRef { id: string; email: string; full_name: string | null }

export interface NormalizedRow {
  row: number; // 1-based spreadsheet row (header = row 1)
  company: { name: string | null; domain: string | null; website: string | null; industry: string | null; location: string | null } ;
  contact: { full_name: string | null; role_title: string | null; email: string | null; phone: string | null };
  opportunity: { hiring_need: string | null; hiring_volume: number | null; budget: string | null; next_follow_up_on: string | null; stage: OpportunityStage | null };
  source: LeadSource;
  msa_status: MsaStatus | null;
  owner_id: string | null;
  notes: string | null;
  errors: string[];
  warnings: string[];
  raw: Record<string, string>;
}

function cell(row: string[], mapping: Mapping, f: ImportField): string {
  const i = mapping[f];
  return i === undefined ? "" : String(row[i] ?? "").trim();
}

export function normalizeRow(
  row: string[], rowNumber: number, mapping: Mapping, kind: ImportKind, team: TeamRef[], defaultOwner: string | null, headers: string[],
): NormalizedRow {
  const errors: string[] = [];
  const warnings: string[] = [];
  const get = (f: ImportField) => cell(row, mapping, f);

  const companyName = cleanText(get("company_name"), 200);
  const websiteRaw = get("company_website");
  let domain = normalizeDomain(websiteRaw);
  if (domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    warnings.push(`Ignored website “${websiteRaw.slice(0, 60)}” — not a valid domain`);
    domain = null;
  }

  const fullName = cleanText(get("contact_name") || [get("contact_first"), get("contact_last")].filter(Boolean).join(" "), 160);
  const emailRaw = get("contact_email");
  const email = normalizeEmail(emailRaw);
  if (emailRaw && !email) warnings.push(`Ignored email “${emailRaw.slice(0, 60)}” — not a valid address`);
  const phoneRaw = get("contact_phone");
  const phone = normalizePhone(phoneRaw);
  if (phoneRaw && !phone) warnings.push(`Ignored phone “${phoneRaw.slice(0, 40)}”`);

  // A work email can identify the company's domain when no website is given.
  if (!domain && email) {
    const d = domainFromEmail(email);
    if (d && !PERSONAL_EMAIL_DOMAINS.has(d)) domain = d;
  }

  const volumeRaw = get("hiring_volume");
  const volume = volumeRaw ? parsePositiveInt(volumeRaw) : null;
  if (volumeRaw && volume === null) warnings.push(`Ignored hiring volume “${volumeRaw.slice(0, 30)}” — not a whole number`);

  const followRaw = get("follow_up");
  const follow = followRaw ? parseDateLoose(followRaw) : null;
  if (followRaw && !follow) warnings.push(`Ignored follow-up date “${followRaw.slice(0, 30)}” — use YYYY-MM-DD or DD/MM/YYYY`);

  const stageRaw = get("stage");
  const stage = stageRaw ? normalizeStage(stageRaw) : null;
  if (stageRaw && !stage) warnings.push(`Unknown stage “${stageRaw.slice(0, 30)}” — imported as New lead`);
  if (stage === "lost") warnings.push("Stage “Lost” needs a reason — imported as Nurture instead");

  const msaRaw = get("msa_status");
  const msa = msaRaw ? normalizeMsa(msaRaw) : null;
  if (msaRaw && !msa) warnings.push(`Unknown MSA status “${msaRaw.slice(0, 30)}” — left as Not started`);

  const sourceRaw = get("source");
  const source = normalizeSource(sourceRaw) ?? "spreadsheet";

  const ownerRaw = get("owner").toLowerCase();
  let ownerId = defaultOwner;
  if (ownerRaw) {
    const match = team.find((t) => t.email.toLowerCase() === ownerRaw || (t.full_name ?? "").toLowerCase() === ownerRaw
      || (t.full_name ?? "").toLowerCase().split(" ")[0] === ownerRaw || t.email.split("@")[0].toLowerCase() === ownerRaw);
    if (match) ownerId = match.id;
    else warnings.push(`Owner “${ownerRaw.slice(0, 40)}” isn't on the team — ${defaultOwner ? "assigned to you" : "left unassigned"}`);
  }

  for (const group of REQUIRED_FIELDS[kind]) {
    const ok = group.some((f) => (f === "contact_name" || f === "contact_first" ? Boolean(fullName) : Boolean(get(f))));
    if (!ok) errors.push(`Missing ${group.map((f) => IMPORT_FIELDS[f].label.toLowerCase()).join(" or ")}`);
  }

  const raw: Record<string, string> = {};
  headers.forEach((h, i) => { raw[h || `Column ${i + 1}`] = String(row[i] ?? "").slice(0, 500); });

  return {
    row: rowNumber,
    company: { name: companyName, domain, website: domain ? `https://${domain}/` : null, industry: cleanText(get("industry"), 120), location: cleanText(get("location"), 200) },
    contact: { full_name: fullName, role_title: cleanText(get("contact_role"), 160), email, phone },
    opportunity: {
      hiring_need: cleanText(get("hiring_need"), 300), hiring_volume: volume, budget: cleanText(get("budget"), 300),
      next_follow_up_on: follow, stage: stage === "lost" ? "nurture" : stage,
    },
    source,
    msa_status: msa,
    owner_id: ownerId,
    notes: cleanText(get("notes"), 20000),
    errors,
    warnings,
    raw,
  };
}

// ------------------------------------------------------------------ Duplicates

export interface ExistingCompanyMatch { company_id: string; name: string; domain: string | null; reason: "same_domain" | "same_name" | "similar_name" }
export interface ExistingContactMatch { contact_id: string; full_name: string; email: string }

export type Decision = "link" | "skip" | "create";

export interface PlannedRow extends NormalizedRow {
  companyKey: string | null;
  existingCompany: ExistingCompanyMatch | null;
  existingContact: ExistingContactMatch | null;
  duplicateInFileOf: number | null; // row number of an earlier identical contact in this file
  needsDecision: boolean;
  allowedDecisions: Decision[];
  defaultDecision: Decision;
}

export function companyKey(r: Pick<NormalizedRow, "company">): string | null {
  if (r.company.domain) return `d:${r.company.domain}`;
  const n = normalizeCompanyName(r.company.name);
  return n ? `n:${n}` : null;
}

/**
 * Annotates rows with duplicate information and the choices the user has.
 * Existing records are never overwritten: "link" attaches new contacts /
 * opportunities to the existing company, "skip" ignores the row, "create"
 * makes a separate company (only when the match is a similar name, not the
 * same domain).
 */
export function planRows(
  rows: NormalizedRow[],
  companyMatches: Map<number, ExistingCompanyMatch>, // index in rows → match
  contactsByEmail: Map<string, ExistingContactMatch>,
  kind: ImportKind,
): PlannedRow[] {
  const seenEmails = new Map<string, number>();
  const seenCompanies = new Map<string, number>();
  return rows.map((r, i) => {
    const key = companyKey(r);
    const existingCompany = kind === "contacts" && !r.company.name ? null : companyMatches.get(i) ?? null;
    const existingContact = r.contact.email ? contactsByEmail.get(r.contact.email) ?? null : null;
    let duplicateInFileOf: number | null = null;
    if (r.contact.email) {
      if (seenEmails.has(r.contact.email)) duplicateInFileOf = seenEmails.get(r.contact.email)!;
      else seenEmails.set(r.contact.email, r.row);
    }
    if (kind === "companies" && key) {
      if (seenCompanies.has(key)) duplicateInFileOf = seenCompanies.get(key)!;
      else seenCompanies.set(key, r.row);
    }

    let allowed: Decision[] = ["link", "skip"];
    let def: Decision = "link";
    let needs = false;
    if (r.errors.length) {
      allowed = ["skip"];
      def = "skip";
    } else if (duplicateInFileOf !== null) {
      needs = true;
      allowed = ["skip", "link"];
      def = "skip";
    } else if (existingCompany || existingContact) {
      needs = true;
      if (existingCompany && existingCompany.reason === "similar_name" && !existingContact) allowed = ["link", "create", "skip"];
      if (kind === "companies") def = "skip";
    }
    return { ...r, companyKey: key, existingCompany, existingContact, duplicateInFileOf, needsDecision: needs, allowedDecisions: allowed, defaultDecision: def };
  });
}

export function summarize(rows: PlannedRow[]) {
  return {
    total: rows.length,
    invalid: rows.filter((r) => r.errors.length).length,
    duplicates: rows.filter((r) => r.needsDecision).length,
    warnings: rows.filter((r) => r.warnings.length).length,
    ready: rows.filter((r) => !r.errors.length && !r.needsDecision).length,
  };
}
