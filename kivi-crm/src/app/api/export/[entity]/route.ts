import { NextResponse } from "next/server";
import { getMember } from "@/lib/auth";
import { createClient, type ServerSupabase } from "@/lib/supabase/server";
import { getTeamMap } from "@/lib/data/team";
import { toCsv } from "@/lib/csv";
import { log } from "@/lib/log";
import {
  ACTIVITY_TYPES, LEAD_SOURCES, MSA_STATUSES, OPPORTUNITY_STAGES, REQUIREMENT_STATUSES, CLIENT_STATUS_LABEL,
  type ActivityType, type ClientStatus, type LeadSource, type MsaStatus, type OpportunityStage, type RequirementStatus,
} from "@/lib/constants";
import { todayInZone } from "@/lib/time";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ENTITIES = ["companies", "contacts", "opportunities", "requirements", "activities", "revenue", "invoices", "payments"] as const;
type Entity = (typeof ENTITIES)[number];

async function fetchAll(supabase: ServerSupabase, table: string, columns: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  for (let from = 0; from < 100_000; from += 1000) {
    let q = supabase.from(table).select(columns);
    if (!["requirement_revenue", "invoice_balances", "payments"].includes(table)) q = q.is("archived_at", null);
    const { data, error } = await q.order(table === "requirement_revenue" ? "requirement_id" : "created_at").range(from, from + 999);
    if (error) throw new Error(error.code);
    out.push(...((data ?? []) as unknown as Record<string, unknown>[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

// Exports run as the signed-in member, through row-level security.
export async function GET(_: Request, { params }: { params: Promise<{ entity: string }> }) {
  const member = await getMember();
  if (!member) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { entity } = await params;
  if (!(ENTITIES as readonly string[]).includes(entity)) return NextResponse.json({ error: "Unknown export" }, { status: 404 });

  const supabase = await createClient();
  const team = await getTeamMap();
  const owner = (id: unknown) => (typeof id === "string" ? team.get(id)?.email ?? "" : "");
  const companies = new Map((await fetchAll(supabase, "companies", "id, name")).map((c) => [c.id as string, c.name as string]));
  const src = (s: unknown) => (s ? LEAD_SOURCES.label[s as LeadSource] : "");

  let headers: string[] = [];
  let rows: unknown[][] = [];
  try {
    switch (entity as Entity) {
      case "companies": {
        const data = await fetchAll(supabase, "company_overview", "*");
        headers = ["Company ID", "Company", "Domain", "Website", "Industry", "Location", "Source", "Source detail", "Owner", "MSA status", "MSA signed on", "Client status", "Live requirements", "Open opportunities", "Notes", "Created", "Last activity"];
        rows = data.map((c) => [c.id, c.name, c.domain, c.website, c.industry, c.location, src(c.source), c.source_detail, owner(c.owner_id),
          MSA_STATUSES.label[c.msa_status as MsaStatus], c.msa_signed_on, CLIENT_STATUS_LABEL[c.client_status as ClientStatus], c.live_requirements, c.open_opportunities, c.notes, c.created_at, c.last_activity_at]);
        break;
      }
      case "contacts": {
        const data = await fetchAll(supabase, "contacts", "*");
        headers = ["Contact ID", "Name", "Role", "Company ID", "Company", "Work email", "Phone", "Location", "LinkedIn", "Source", "Owner", "Notes", "Created", "Last activity"];
        rows = data.map((c) => [c.id, c.full_name, c.role_title, c.company_id, companies.get(c.company_id as string) ?? "", c.email, c.phone, c.location, c.linkedin_url, src(c.source), owner(c.owner_id), c.notes, c.created_at, c.last_activity_at]);
        break;
      }
      case "opportunities": {
        const data = await fetchAll(supabase, "opportunities", "*");
        headers = ["Opportunity ID", "Opportunity", "Company ID", "Company", "Stage", "Owner", "Priority", "Estimated value", "Currency", "Probability override", "Expected close", "Next action", "Nurture reason", "Source", "Hiring need", "Hiring volume", "Location", "Budget", "Next follow-up", "Loss reason", "Notes", "Stage since", "Won at", "Lost at", "Created", "Last activity"];
        rows = data.map((o) => [o.id, o.title, o.company_id, companies.get(o.company_id as string) ?? "", OPPORTUNITY_STAGES.label[o.stage as OpportunityStage], owner(o.owner_id), o.priority, o.estimated_value, o.currency, o.probability_override, o.expected_close_on, o.next_action, o.nurture_reason, src(o.source), o.hiring_need, o.hiring_volume, o.location, o.budget, o.next_follow_up_on, o.loss_reason, o.notes, o.stage_changed_at, o.won_at, o.lost_at, o.created_at, o.last_activity_at]);
        break;
      }
      case "requirements": {
        const data = await fetchAll(supabase, "requirements", "*");
        headers = ["Requirement ID", "Role", "Company ID", "Company", "Opportunity ID", "Status", "Client accepted at", "Terms agreed at", "Fee basis", "Fee %", "Fee per hire", "Estimated total fee", "Currency", "Hiring volume", "Placed", "Location", "Budget / commercial", "Owner", "Expected start", "Timeline", "Notes", "Status since", "Created"];
        rows = data.map((r) => [r.id, r.role_title, r.company_id, companies.get(r.company_id as string) ?? "", r.opportunity_id, REQUIREMENT_STATUSES.label[r.status as RequirementStatus], r.client_accepted_at, r.terms_agreed_at, r.fee_basis, r.fee_percent, r.fee_per_hire, r.computed_total_fee, r.currency, r.hiring_volume, r.positions_filled, r.location, r.budget_notes, owner(r.owner_id), r.expected_start_on, r.timeline_notes, r.notes, r.status_changed_at, r.created_at]);
        break;
      }
      case "activities": {
        const data = await fetchAll(supabase, "activities", "id, type, subject, body, occurred_at, company_id, contact_id, opportunity_id, requirement_id, owner_id, due_at, completed_at, origin, created_at");
        headers = ["Activity ID", "Type", "Summary", "Details", "When", "Company ID", "Company", "Contact ID", "Opportunity ID", "Requirement ID", "Owner", "Due", "Completed", "Origin", "Created"];
        rows = data.map((a) => [a.id, ACTIVITY_TYPES.label[a.type as ActivityType], a.subject, a.body, a.occurred_at, a.company_id, companies.get(a.company_id as string) ?? "", a.contact_id, a.opportunity_id, a.requirement_id, owner(a.owner_id), a.due_at, a.completed_at, a.origin, a.created_at]);
        break;
      }
      case "revenue": {
        const data = await fetchAll(supabase, "requirement_revenue", "*");
        headers = ["Requirement ID", "Role", "Company ID", "Company", "Opportunity ID", "Currency", "Fee basis", "Estimated fee", "Booked", "Earned", "Expected (not yet earned)", "Invoiced", "Collected (realized)", "Outstanding"];
        rows = data.map((r) => [r.requirement_id, r.role_title, r.company_id, companies.get(r.company_id as string) ?? "", r.opportunity_id, r.currency, r.fee_basis, r.estimated_fee, r.is_booked ? "yes" : "no", r.earned, r.expected_earnings, r.invoiced, r.collected, r.outstanding]);
        break;
      }
      case "invoices": {
        const data = await fetchAll(supabase, "invoice_balances", "*");
        headers = ["Invoice ID", "Invoice number", "Company ID", "Company", "Requirement ID", "Status", "Issued on", "Due on", "Currency", "Amount", "Paid", "Credited", "Outstanding", "Payment state", "Overdue", "Days past due"];
        rows = data.map((i) => [i.id, i.invoice_number, i.company_id, companies.get(i.company_id as string) ?? "", i.requirement_id, i.status, i.issued_on, i.due_on, i.currency, i.amount, i.paid, i.credited, i.outstanding, i.payment_state, i.is_overdue ? "yes" : "no", i.days_past_due]);
        break;
      }
      case "payments": {
        const data = await fetchAll(supabase, "payments", "*, invoices(invoice_number, company_id)");
        headers = ["Payment ID", "Invoice ID", "Invoice number", "Company ID", "Company", "Received on", "Currency", "Amount", "Reference", "Method", "Reversed at", "Reversal reason"];
        rows = data.map((p) => {
          const inv = p.invoices as { invoice_number: string; company_id: string } | null;
          return [p.id, p.invoice_id, inv?.invoice_number, inv?.company_id, companies.get(inv?.company_id ?? "") ?? "", p.received_on, p.currency, p.amount, p.reference, p.method, p.reversed_at, p.reversal_reason];
        });
        break;
      }
    }
  } catch (err) {
    log.error("export.failed", { entity, error: err });
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }

  await supabase.rpc("log_security_event", { p_action: "export.csv", p_details: { entity, rows: rows.length } });
  return new NextResponse(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kivitronics-${entity}-${todayInZone()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
