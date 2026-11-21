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
] as const);
export type ActivityType = (typeof ACTIVITY_TYPES.values)[number];

export const CLIENT_STATUS_LABEL = {
  active_client: "Active client",
  msa_signed_no_live_requirement: "MSA signed · no live requirement",
  prospect: "Prospect",
} as const;
export type ClientStatus = keyof typeof CLIENT_STATUS_LABEL;

export function isOneOf<T extends string>(values: readonly T[], v: unknown): v is T {
  return typeof v === "string" && (values as readonly string[]).includes(v);
}
