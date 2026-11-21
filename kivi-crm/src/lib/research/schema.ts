// Research contract shared by every provider, plus the evidence rules applied
// to whatever a provider returns. Pure functions — covered by unit tests.

import { z } from "zod";

export const LEVELS = ["market", "company", "person"] as const;
export type ResearchLevel = (typeof LEVELS)[number];

export const CATEGORIES = ["about", "profile", "announcement", "funding", "hiring", "expansion", "leadership", "market", "other"] as const;
export const EVIDENCE_KINDS = ["verified_fact", "reported_claim", "inference"] as const;
export const CONFIDENCES = ["high", "medium", "low"] as const;

/** Exactly what the CRM sends to a provider. Built server-side from records (data minimisation). */
export interface ResearchInput {
  level: ResearchLevel;
  company: { name: string; website: string | null; linkedinUrl: string | null; location: string | null };
  role: string | null;
  location: string | null;
  contact: { name: string; title: string | null; notes: string | null } | null;
  /** Short CRM context the user chose to include (notes summary, stage). */
  crmContext: string | null;
  /** Metadata of CRM-linked conversations; only present when the user approved it. */
  conversations: { date: string; channel: string; subject: string; direction: string | null }[];
  sender: { name: string; company: string; pitch: string; cta: string };
  channel: "email" | "whatsapp";
  /** Accepted facts to build a draft from (draft-only runs). */
  acceptedFacts?: { statement: string; source_url: string | null }[];
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/).transform((s) => s.slice(0, 10));

/** Shape a provider must return. Lenient on optional fields; strict on enums. */
export const providerFindingSchema = z.object({
  category: z.enum(CATEGORIES).catch("other"),
  statement: z.string().trim().min(1).max(1000),
  evidence_kind: z.enum(EVIDENCE_KINDS).catch("inference"),
  confidence: z.enum(CONFIDENCES).catch("low"),
  source_url: z.string().trim().max(1000).nullish(),
  source_title: z.string().trim().max(300).nullish(),
  published_on: isoDate.nullish().catch(null),
  excerpt: z.string().trim().max(1000).nullish(),
  conflict_note: z.string().trim().max(500).nullish(),
});

export const providerResultSchema = z.object({
  about_brief: z.string().trim().max(4000).nullish(),
  industry: z.string().trim().max(120).nullish(),
  employee_range: z.string().trim().max(60).nullish(),
  outreach_angle: z.string().trim().max(2000).nullish(),
  draft_subject: z.string().trim().max(250).nullish(),
  draft_message: z.string().trim().max(6000).nullish(),
  findings: z.array(providerFindingSchema).max(40).default([]),
  warnings: z.array(z.string().max(300)).max(20).default([]),
});
export type ProviderResult = z.infer<typeof providerResultSchema>;

export interface RetrievedSource {
  url: string;
  title: string | null;
  pageAge: string | null;
}

export interface StoredFinding {
  category: (typeof CATEGORIES)[number];
  statement: string;
  evidence_kind: (typeof EVIDENCE_KINDS)[number];
  confidence: (typeof CONFIDENCES)[number];
  source_url: string | null;
  source_title: string | null;
  published_on: string | null;
  retrieved_at: string;
  excerpt: string | null;
  source_verified: boolean;
  conflict_note: string | null;
}

export interface StoredResult {
  model: string | null;
  checked_at: string;
  about_brief: string | null;
  outreach_angle: string | null;
  draft_message: string | null;
  sources_retrieved: number;
  warnings: string[];
  findings: StoredFinding[];
  profile: { industry: string | null; employee_range: string | null };
  draft_subject: string | null;
}

export function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    u.hash = "";
    for (const p of [...u.searchParams.keys()]) if (/^utm_|^fbclid$|^gclid$/i.test(p)) u.searchParams.delete(p);
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function parsePageAge(age: string | null | undefined): string | null {
  if (!age) return null;
  const d = new Date(age);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

const CONF_ORDER = { high: 2, medium: 1, low: 0 } as const;
const capConfidence = (c: StoredFinding["confidence"], max: StoredFinding["confidence"]) =>
  CONF_ORDER[c] > CONF_ORDER[max] ? max : c;

/**
 * Applies the evidence rules to a provider's raw result:
 *  - a fact or claim with no usable source URL or no excerpt becomes an
 *    inference with low confidence (never shown as fact);
 *  - when the provider reported which pages it actually retrieved, a cited
 *    URL that was NOT retrieved is flagged unverified and cannot stay a
 *    "verified fact" or "high" confidence;
 *  - future publication dates are dropped; missing ones are filled from the
 *    retrieved page's age when known;
 *  - duplicate statements are removed.
 */
export function applyEvidenceRules(
  raw: ProviderResult,
  opts: { retrieved: RetrievedSource[] | null; now: Date; model: string | null; extraWarnings?: string[] },
): StoredResult {
  const nowIso = opts.now.toISOString();
  const today = nowIso.slice(0, 10);
  const retrievedMap = new Map<string, RetrievedSource>();
  for (const r of opts.retrieved ?? []) {
    const n = normalizeUrl(r.url);
    if (n) retrievedMap.set(n, r);
  }
  const warnings = [...raw.warnings, ...(opts.extraWarnings ?? [])];
  const seen = new Set<string>();
  const findings: StoredFinding[] = [];
  let downgraded = 0;
  let unverified = 0;

  for (const f of raw.findings) {
    const key = f.statement.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);

    const url = normalizeUrl(f.source_url);
    const excerpt = f.excerpt?.trim() || null;
    let kind = f.evidence_kind;
    let confidence = f.confidence;
    let note = f.conflict_note?.trim() || null;
    let verified = false;
    let published = f.published_on ?? null;
    if (published && published > today) published = null;

    if (kind !== "inference" && (!url || !excerpt)) {
      kind = "inference";
      confidence = "low";
      note = [note, "No source and excerpt were supplied, so this is treated as an inference."].filter(Boolean).join(" ");
      downgraded++;
    } else if (url && opts.retrieved) {
      const hit = retrievedMap.get(url);
      verified = Boolean(hit);
      if (!hit) {
        unverified++;
        if (kind === "verified_fact") kind = "reported_claim";
        confidence = capConfidence(confidence, "medium");
        note = [note, "The cited page was not among the pages the research tool retrieved."].filter(Boolean).join(" ");
      } else if (!published) {
        published = parsePageAge(hit.pageAge);
      }
    }
    if (kind === "inference") confidence = capConfidence(confidence, "medium");

    findings.push({
      category: f.category,
      statement: f.statement,
      evidence_kind: kind,
      confidence,
      source_url: url,
      source_title: f.source_title?.trim() || (url ? retrievedMap.get(url)?.title ?? null : null),
      published_on: published,
      retrieved_at: nowIso,
      excerpt,
      source_verified: verified,
      conflict_note: note,
    });
    if (findings.length >= 25) break;
  }

  if (downgraded) warnings.push(`${downgraded} statement(s) had no source and are shown as inferences.`);
  if (unverified) warnings.push(`${unverified} cited page(s) could not be matched to retrieved pages; treat them with care.`);
  if (opts.retrieved === null) warnings.push("This provider does not report which pages it retrieved, so citations were not cross-checked.");
  if (findings.length === 0) warnings.push("No findings were returned. Evidence may be thin for this company.");

  return {
    model: opts.model,
    checked_at: nowIso,
    about_brief: raw.about_brief ?? null,
    outreach_angle: raw.outreach_angle ?? null,
    draft_message: raw.draft_message ?? null,
    draft_subject: raw.draft_subject ?? null,
    sources_retrieved: retrievedMap.size,
    warnings: warnings.map((w) => w.slice(0, 300)).slice(0, 20),
    findings,
    profile: { industry: raw.industry ?? null, employee_range: raw.employee_range ?? null },
  };
}

/** Extracts the first JSON object from model text (ported from outreach-agent/generate.js). */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) throw new ResearchError("The research provider did not return JSON.", true);
  return JSON.parse(text.slice(start, end + 1));
}

/** Ported from outreach-agent/generate.js. */
export function slugFromLinkedIn(url: string | null | undefined): string {
  const m = String(url || "").match(/linkedin\.com\/(?:company|school|showcase)\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]).replace(/[-_]+/g, " ").trim() : "";
}

export class ResearchError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
  }
}
