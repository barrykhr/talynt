"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { AuthError, requireMember } from "@/lib/auth";
import { createClient, type ServerSupabase } from "@/lib/supabase/server";
import { getTeam } from "@/lib/data/team";
import { log } from "@/lib/log";
import { ImportFileError, parseSpreadsheet } from "@/lib/import/parse";
import { importDecisionsSchema, importInputSchema, type ImportInput } from "@/lib/import/schema";
import {
  autoMap, companyKey, normalizeRow, planRows, summarize,
  type Decision, type ExistingCompanyMatch, type ExistingContactMatch, type ImportKind, type Mapping, type PlannedRow,
} from "@/lib/import/plan";
import type { ImportReportRow } from "@/lib/types";

// ------------------------------------------------------------------ Step 1: parse
export interface ParseResult {
  ok?: boolean;
  error?: string;
  filename?: string;
  headers?: string[];
  rows?: string[][];
  truncated?: boolean;
  mapping?: Mapping;
}

export async function parseImportFile(_: ParseResult, fd: FormData): Promise<ParseResult> {
  try {
    await requireMember();
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Not allowed." };
  }
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV or .xlsx file to upload." };
  try {
    const sheet = await parseSpreadsheet(file);
    return { ok: true, filename: file.name.slice(0, 255), headers: sheet.headers, rows: sheet.rows, truncated: sheet.truncated, mapping: autoMap(sheet.headers) };
  } catch (err) {
    if (err instanceof ImportFileError) return { error: err.message };
    log.error("import.parse_failed", { error: err });
    return { error: "We couldn't read that file. Check it's a valid CSV or .xlsx." };
  }
}

// ------------------------------------------------------------------ Shared input validation
const inputSchema = importInputSchema;
export type { ImportInput };

async function buildPlan(supabase: ServerSupabase, input: ImportInput, memberId: string): Promise<PlannedRow[]> {
  const team = (await getTeam()).filter((t) => t.status === "active");
  const defaultOwner = input.ownerMode === "me" ? memberId : null;
  const normalized = input.rows.map((r, i) => normalizeRow(r, i + 2, input.mapping as Mapping, input.kind as ImportKind, team, defaultOwner, input.headers));

  // Existing companies: one bulk RPC for exact/similar matches.
  const companyMatches = new Map<number, ExistingCompanyMatch>();
  const withCompany = normalized.map((r, i) => ({ r, i })).filter(({ r }) => r.company.name);
  for (let start = 0; start < withCompany.length; start += 500) {
    const chunk = withCompany.slice(start, start + 500);
    const { data, error } = await supabase.rpc("match_companies_bulk", {
      p_names: chunk.map(({ r }) => r.company.name ?? ""),
      p_domains: chunk.map(({ r }) => r.company.domain ?? ""),
    });
    if (error) throw new Error(`company match failed: ${error.code}`);
    for (const m of (data ?? []) as { idx: number; company_id: string; name: string; domain: string | null; reason: ExistingCompanyMatch["reason"] }[]) {
      companyMatches.set(chunk[m.idx - 1].i, { company_id: m.company_id, name: m.name, domain: m.domain, reason: m.reason });
    }
  }

  // Existing contacts by email.
  const contactsByEmail = new Map<string, ExistingContactMatch>();
  const emails = [...new Set(normalized.map((r) => r.contact.email).filter(Boolean) as string[])];
  for (let start = 0; start < emails.length; start += 300) {
    const { data } = await supabase.from("contacts").select("id, full_name, email").in("email", emails.slice(start, start + 300)).is("archived_at", null);
    for (const c of (data ?? []) as { id: string; full_name: string; email: string }[]) {
      contactsByEmail.set(c.email, { contact_id: c.id, full_name: c.full_name, email: c.email });
    }
  }
  return planRows(normalized, companyMatches, contactsByEmail, input.kind as ImportKind);
}

// ------------------------------------------------------------------ Step 2: preview
export interface PreviewResult {
  ok?: boolean;
  error?: string;
  rows?: Omit<PlannedRow, "raw">[];
  summary?: ReturnType<typeof summarize>;
}

export async function previewImport(raw: ImportInput): Promise<PreviewResult> {
  try {
    const member = await requireMember();
    const parsed = inputSchema.safeParse(raw);
    if (!parsed.success) return { error: "The import data was invalid. Please upload the file again." };
    const supabase = await createClient();
    const plan = await buildPlan(supabase, parsed.data, member.id);
    return { ok: true, rows: plan.map(({ raw: _raw, ...rest }) => { void _raw; return rest; }), summary: summarize(plan) };
  } catch (e) {
    if (e instanceof AuthError) return { error: e.message };
    log.error("import.preview_failed", { error: e });
    return { error: "We couldn't prepare the preview. Please try again." };
  }
}

// ------------------------------------------------------------------ Step 3: commit
export interface CommitResult {
  ok?: boolean;
  error?: string;
  importId?: string;
  counts?: { total: number; created: number; updated: number; skipped: number; failed: number };
  report?: ImportReportRow[];
}

type Outcome = { outcome: ImportReportRow["outcome"]; message: string };

async function insertChunked<T extends { id: string }>(supabase: ServerSupabase, table: string, rows: T[], onFail: (row: T, message: string) => void) {
  const ok = new Set<string>();
  for (let start = 0; start < rows.length; start += 200) {
    const chunk = rows.slice(start, start + 200);
    const { error } = await supabase.from(table).insert(chunk);
    if (!error) {
      chunk.forEach((r) => ok.add(r.id));
      continue;
    }
    // Find the offending rows one by one so the rest still import.
    for (const r of chunk) {
      const { error: e } = await supabase.from(table).insert(r);
      if (e) onFail(r, e.message.includes("contacts_email_unique") ? "A contact with this email already exists" : e.message.includes("companies_domain_unique") ? "A company with this domain already exists" : "Could not be saved");
      else ok.add(r.id);
    }
  }
  return ok;
}

export async function commitImport(raw: ImportInput & { decisions: Record<string, Decision> }): Promise<CommitResult> {
  let member;
  try {
    member = await requireMember();
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Not allowed." };
  }
  const parsed = inputSchema.safeParse(raw);
  const decisionsParsed = importDecisionsSchema.safeParse(raw.decisions ?? {});
  if (!parsed.success || !decisionsParsed.success) return { error: "The import data was invalid. Please start again." };
  const input = parsed.data;
  const decisions = decisionsParsed.data;

  try {
    const supabase = await createClient();
    // Re-plan on the server: nothing from the preview is trusted.
    const plan = await buildPlan(supabase, input, member.id);
    const outcomes = new Map<number, Outcome>();
    const decide = (r: PlannedRow): Decision => {
      const d = decisions[String(r.row)] ?? r.defaultDecision;
      return r.allowedDecisions.includes(d) ? d : r.defaultDecision;
    };

    // ---- Companies
    const companyIdForRow = new Map<number, string>();
    const newCompanies = new Map<string, { id: string; rows: number[]; record: Record<string, unknown> }>();
    for (const r of plan) {
      if (r.errors.length) { outcomes.set(r.row, { outcome: "failed", message: r.errors.join("; ") }); continue; }
      const d = decide(r);
      if (d === "skip") {
        outcomes.set(r.row, { outcome: "skipped", message: r.duplicateInFileOf ? `Duplicate of row ${r.duplicateInFileOf} in this file` : r.existingContact ? `Contact already exists (${r.existingContact.email})` : r.existingCompany ? `Company already exists (${r.existingCompany.name})` : "Skipped" });
        continue;
      }
      if (input.kind === "contacts" && !r.company.name) continue;
      if (r.existingCompany && d === "link") {
        companyIdForRow.set(r.row, r.existingCompany.company_id);
        if (input.kind === "companies") outcomes.set(r.row, { outcome: "skipped", message: `Already in the CRM as ${r.existingCompany.name} — not changed` });
        continue;
      }
      // Separate company requested ("create") gets its own key so it isn't merged with the match.
      const key = (d === "create" ? `c:${r.row}:` : "") + (companyKey(r) ?? `row:${r.row}`);
      const existing = newCompanies.get(key);
      if (existing) {
        existing.rows.push(r.row);
        if (input.kind === "companies") outcomes.set(r.row, { outcome: "skipped", message: "Same company as an earlier row in this file" });
      } else {
        newCompanies.set(key, {
          id: randomUUID(), rows: [r.row],
          record: {
            name: r.company.name, website: r.company.website, industry: r.company.industry, location: r.company.location,
            source: r.source, owner_id: r.owner_id, msa_status: r.msa_status ?? "not_started",
            notes: input.kind === "companies" ? r.notes : null,
          },
        });
      }
    }
    const companyRecords = [...newCompanies.values()].map((c) => ({ id: c.id, ...c.record }));
    const rowsByCompanyId = new Map([...newCompanies.values()].map((c) => [c.id, c.rows]));
    const createdCompanies = await insertChunked(supabase, "companies", companyRecords, (rec, message) => {
      for (const row of rowsByCompanyId.get(rec.id) ?? []) outcomes.set(row, { outcome: "failed", message });
    });
    for (const c of newCompanies.values()) {
      if (createdCompanies.has(c.id)) for (const row of c.rows) companyIdForRow.set(row, c.id);
    }

    // ---- Contacts
    const contactIdForRow = new Map<number, string>();
    const contactRecords: { id: string; row: number; [k: string]: unknown }[] = [];
    const createdByEmail = new Map<string, number>();
    if (input.kind !== "companies") {
      for (const r of plan) {
        if (outcomes.has(r.row) || !r.contact.full_name) continue;
        if (r.company.name && !companyIdForRow.has(r.row)) continue;
        if (r.existingContact) { contactIdForRow.set(r.row, r.existingContact.contact_id); continue; }
        if (r.contact.email && createdByEmail.has(r.contact.email)) continue; // linked after insert
        const id = randomUUID();
        contactRecords.push({
          id, row: r.row, full_name: r.contact.full_name, role_title: r.contact.role_title, email: r.contact.email, phone: r.contact.phone,
          company_id: companyIdForRow.get(r.row) ?? null, location: r.company.location, source: r.source, owner_id: r.owner_id,
          notes: input.kind === "contacts" ? r.notes : null,
        });
        if (r.contact.email) createdByEmail.set(r.contact.email, r.row);
      }
      const created = await insertChunked(supabase, "contacts", contactRecords.map(({ row: _r, ...rest }) => { void _r; return rest as { id: string }; }), (rec, message) => {
        const row = contactRecords.find((c) => c.id === rec.id)!.row;
        outcomes.set(row, { outcome: "failed", message: `Contact: ${message}` });
      });
      for (const c of contactRecords) if (created.has(c.id)) contactIdForRow.set(c.row, c.id);
      // In-file duplicates the user chose to link: point at the contact created from the earlier row.
      for (const r of plan) {
        if (!outcomes.has(r.row) && r.contact.email && !contactIdForRow.has(r.row) && createdByEmail.has(r.contact.email)) {
          const id = contactIdForRow.get(createdByEmail.get(r.contact.email)!);
          if (id) contactIdForRow.set(r.row, id);
        }
      }
    }

    // ---- Opportunities (leads only)
    if (input.kind === "leads") {
      const opps: { id: string; row: number; [k: string]: unknown }[] = [];
      for (const r of plan) {
        if (outcomes.has(r.row) || !companyIdForRow.has(r.row)) continue;
        const companyName = r.existingCompany && decide(r) === "link" ? r.existingCompany.name : r.company.name;
        opps.push({
          id: randomUUID(), row: r.row, company_id: companyIdForRow.get(r.row),
          title: `${companyName}${r.opportunity.hiring_need ? ` — ${r.opportunity.hiring_need}` : " — new lead"}`.slice(0, 200),
          stage: r.opportunity.stage ?? "new_lead", source: r.source, owner_id: r.owner_id,
          hiring_need: r.opportunity.hiring_need, hiring_volume: r.opportunity.hiring_volume, location: r.company.location,
          budget: r.opportunity.budget, next_follow_up_on: r.opportunity.next_follow_up_on, notes: r.notes,
        });
      }
      const created = await insertChunked(supabase, "opportunities", opps.map(({ row: _r, ...rest }) => { void _r; return rest as { id: string }; }), (rec, message) => {
        const row = opps.find((o) => o.id === rec.id)!.row;
        outcomes.set(row, { outcome: "failed", message: `Opportunity: ${message}` });
      });
      const links = opps.filter((o) => created.has(o.id) && contactIdForRow.has(o.row)).map((o) => ({ opportunity_id: o.id, contact_id: contactIdForRow.get(o.row)! }));
      for (let s = 0; s < links.length; s += 500) await supabase.from("opportunity_contacts").insert(links.slice(s, s + 500));
    }

    // ---- Outcomes for everything that went through
    for (const r of plan) {
      if (outcomes.has(r.row)) continue;
      const parts: string[] = [];
      const linkedCompany = r.existingCompany && decide(r) === "link";
      if (input.kind !== "contacts" || r.company.name) parts.push(linkedCompany ? `linked to existing company ${r.existingCompany!.name}` : "company created");
      if (input.kind !== "companies" && r.contact.full_name) parts.push(r.existingContact ? "existing contact linked (not changed)" : "contact created");
      if (input.kind === "leads") parts.push("lead added to pipeline");
      if (r.warnings.length) parts.push(`notes: ${r.warnings.join("; ")}`);
      outcomes.set(r.row, { outcome: "created", message: parts.join(" · ") });
    }

    const rawByRow = new Map(input.rows.map((cells, i) => [i + 2, Object.fromEntries(input.headers.map((h, j) => [h || `Column ${j + 1}`, String(cells[j] ?? "").slice(0, 500)]))]));
    const report: ImportReportRow[] = plan.map((r) => {
      const o = outcomes.get(r.row)!;
      return { row: r.row, outcome: o.outcome, message: o.message, ...(o.outcome !== "created" ? { values: rawByRow.get(r.row) } : {}) };
    });
    const counts = {
      total: plan.length,
      created: report.filter((r) => r.outcome === "created").length,
      updated: 0,
      skipped: report.filter((r) => r.outcome === "skipped").length,
      failed: report.filter((r) => r.outcome === "failed").length,
    };

    const { data: imp, error: impErr } = await supabase.from("imports").insert({
      entity: input.kind, filename: input.filename, created_by: member.id, total_rows: counts.total,
      created_count: counts.created, updated_count: 0, skipped_count: counts.skipped, failed_count: counts.failed,
      mapping: input.mapping, report,
    }).select("id").single();
    if (impErr) log.error("import.record_failed", { code: impErr.code });
    await supabase.rpc("log_security_event", { p_action: "import.completed", p_details: { kind: input.kind, ...counts } });
    log.info("import.completed", { kind: input.kind, ...counts });

    revalidatePath("/import");
    revalidatePath("/companies");
    revalidatePath("/contacts");
    revalidatePath("/pipeline");
    revalidatePath("/");
    return { ok: true, importId: imp?.id, counts, report: report.slice(0, 500) };
  } catch (e) {
    log.error("import.commit_failed", { error: e });
    return { error: "The import stopped unexpectedly. Rows already saved are kept — check Companies before retrying, and re-upload: existing records will be detected as duplicates." };
  }
}
