// Shared vocabulary. Values must match the Postgres enums in
// supabase/migrations/20261121000002_crm_core.sql.

export const ALLOWED_DOMAIN = "kivitronicsconsulting.com";
export const PAGE_SIZE = 25;

function labels<T extends string>(entries: readonly (readonly [T, string])[]) {
  return {
    values: entries.map(([v]) => v) as T[],
    label: Object.fromEntries(entries) as Record<T, string>,
  };
}

export const LEAD_SOURCES = labels([
  ["spreadsheet", "Spreadsheet upload"],
  ["referral", "Referral"],
  ["linkedin", "LinkedIn research"],
  ["website", "Website form"],
  ["event", "Event"],
  ["whatsapp", "WhatsApp"],
  ["other", "Other"],
] as const);
export type LeadSource = (typeof LEAD_SOURCES.values)[number];

export const OPPORTUNITY_STAGES = labels([
  ["new_lead", "New lead"],
  ["researching", "Researching"],
  ["ready_to_contact", "Ready to contact"],
  ["contacted", "Contacted"],
  ["in_conversation", "In conversation"],
  ["qualified", "Qualified"],
  ["proposal_msa", "Proposal / MSA"],
  ["won", "Won"],
  ["nurture", "Nurture"],
  ["lost", "Lost"],
] as const);
export type OpportunityStage = (typeof OPPORTUNITY_STAGES.values)[number];
/** The main left-to-right pipeline; Nurture and Lost sit beside it. */
export const PIPELINE_FLOW: OpportunityStage[] = [
  "new_lead", "researching", "ready_to_contact", "contacted", "in_conversation", "qualified", "proposal_msa", "won",
];
export const CLOSED_STAGES: OpportunityStage[] = ["won", "lost"];

export const MSA_STATUSES = labels([
  ["not_started", "Not started"],
  ["in_discussion", "In discussion"],
  ["signed", "Signed"],
] as const);
export type MsaStatus = (typeof MSA_STATUSES.values)[number];

export const REQUIREMENT_STATUSES = labels([
  ["new_requirement", "New requirement"],
  ["sourcing", "Sourcing"],
  ["candidates_shared", "Candidates shared"],
  ["interviews", "Interviews"],
  ["offer", "Offer"],
  ["placed", "Placed"],
  ["on_hold", "On hold"],
  ["closed_filled", "Closed / filled"],
] as const);
export type RequirementStatus = (typeof REQUIREMENT_STATUSES.values)[number];

export const ACTIVITY_TYPES = labels([
  ["email", "Email"],
  ["call", "Call"],
  ["meeting", "Meeting"],
  ["whatsapp", "WhatsApp"],
  ["event", "Event"],
  ["note", "Note"],
  ["task", "Task"],
  ["research_update", "Research update"],
  ["requirement_milestone", "Requirement milestone"],
  ["invoice", "Invoice"],
  ["payment", "Payment"],
] as const);
export type ActivityType = (typeof ACTIVITY_TYPES.values)[number];
/** Types a person logs by hand; the others are written by the system. */
export const MANUAL_ACTIVITY_TYPES: ActivityType[] = ["call", "email", "meeting", "whatsapp", "event", "note", "task"];

export const CLIENT_STATUS_LABEL = {
  active_client: "Active client",
  msa_signed_no_live_requirement: "MSA signed · no live requirement",
  prospect: "Prospect",
} as const;
export type ClientStatus = keyof typeof CLIENT_STATUS_LABEL;

export function isOneOf<T extends string>(values: readonly T[], v: unknown): v is T {
  return typeof v === "string" && (values as readonly string[]).includes(v);
}

export const PRIORITIES = labels([["high", "High"], ["normal", "Normal"], ["low", "Low"]] as const);
export type Priority = (typeof PRIORITIES.values)[number];

export const FEE_BASES = labels([
  ["percent_first_year", "% of first-year compensation"],
  ["fixed_fee", "Fixed placement fee"],
  ["retainer_milestone", "Retainer / milestone fee"],
  ["contract_margin", "Contract staffing margin"],
  ["other", "Other"],
] as const);
export type FeeBasis = (typeof FEE_BASES.values)[number];

export const AGREEMENT_KINDS = labels([["msa", "MSA"], ["sow", "Statement of work"], ["rate_card", "Rate card"], ["nda", "NDA"], ["other", "Other"]] as const);
export const AGREEMENT_STATUSES = labels([
  ["not_started", "Not started"], ["in_discussion", "In discussion"], ["signed", "Signed"], ["expired", "Expired"], ["terminated", "Terminated"],
] as const);

export const PLACEMENT_STATUSES = labels([["offer_accepted", "Offer accepted"], ["joined", "Joined"], ["fell_through", "Fell through"]] as const);

export const SIGNAL_TYPES = labels([
  ["hiring", "New job postings"], ["job_volume_change", "Job-posting volume change"], ["announcement", "Announcement"],
  ["funding", "Funding"], ["expansion", "Expansion / new location"], ["leadership", "Leadership change"], ["other", "Other"],
] as const);
export type SignalType = (typeof SIGNAL_TYPES.values)[number];

export const EVIDENCE_LABEL = { verified_fact: "Verified public fact", reported_claim: "Source-reported claim", inference: "Inference" } as const;
export const CONFIDENCE_LABEL = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" } as const;

export const DEFAULT_CURRENCY = "INR";

/** Plain-language definitions shown next to every revenue number. */
export const REVENUE_DEFINITIONS = {
  pipeline: "Estimated value of open opportunities (not Won or Lost). Weighted = value × stage probability, or the deal's own probability if set.",
  booked: "Value of live requirements the client has accepted, with agreed commercial terms, at a company with a signed MSA (conditions set by an admin). An MSA alone is not booked revenue.",
  earned: "Revenue whose contractual milestone has been met — e.g. a placement fee once the candidate joins (or accepts, per settings). Not the same as invoiced or paid.",
  invoiced: "Amount on invoices issued in the period (cancelled invoices excluded).",
  realized: "Money actually received from customers in the period. An invoice or placement on its own is never realized revenue.",
  outstanding: "Invoiced amount not yet paid or credited, as of today, regardless of the date range.",
} as const;
