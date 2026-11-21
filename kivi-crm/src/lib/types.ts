import type {
  ActivityType, ClientStatus, LeadSource, MsaStatus, OpportunityStage, RequirementStatus,
} from "@/lib/constants";

// Hand-maintained row types matching supabase/migrations. Keep in sync when
// the schema changes (or generate with `supabase gen types typescript`).

export type AppRole = "admin" | "member";
export type MemberStatus = "invited" | "active" | "disabled";

export interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  status: MemberStatus;
  last_sign_in_at: string | null;
  created_at: string;
}

interface Archivable {
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  archived_by: string | null;
}

export interface Company extends Archivable {
  id: string;
  name: string;
  normalized_name: string;
  domain: string | null;
  website: string | null;
  industry: string | null;
  location: string | null;
  source: LeadSource | null;
  source_detail: string | null;
  owner_id: string | null;
  msa_status: MsaStatus;
  msa_signed_on: string | null;
  notes: string | null;
  last_activity_at: string | null;
  merged_into_id: string | null;
  about: string | null;
  about_updated_at: string | null;
  employee_range: string | null;
}

export interface CompanyOverview extends Company {
  live_requirements: number;
  total_requirements: number;
  open_opportunities: number;
  is_active_client: boolean;
  client_status: ClientStatus;
}

export interface Contact extends Archivable {
  id: string;
  company_id: string | null;
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  location: string | null;
  source: LeadSource | null;
  owner_id: string | null;
  notes: string | null;
  last_activity_at: string | null;
  merged_into_id: string | null;
}

export interface Opportunity extends Archivable {
  id: string;
  company_id: string;
  title: string;
  stage: OpportunityStage;
  source: LeadSource | null;
  owner_id: string | null;
  hiring_need: string | null;
  hiring_volume: number | null;
  location: string | null;
  budget: string | null;
  next_follow_up_on: string | null;
  loss_reason: string | null;
  notes: string | null;
  stage_changed_at: string;
  won_at: string | null;
  lost_at: string | null;
  last_activity_at: string | null;
  priority: "low" | "normal" | "high";
  expected_close_on: string | null;
  next_action: string | null;
  nurture_reason: string | null;
  revisit_on: string | null;
  estimated_value: number | null;
  currency: string;
  probability_override: number | null;
  decision_maker_contact_id: string | null;
  hiring_timing: string | null;
  fee_basis_note: string | null;
  next_agreed_step: string | null;
}

export interface Requirement extends Archivable {
  id: string;
  company_id: string;
  opportunity_id: string | null;
  role_title: string;
  hiring_volume: number;
  positions_filled: number;
  location: string | null;
  budget_notes: string | null;
  owner_id: string | null;
  expected_start_on: string | null;
  timeline_notes: string | null;
  status: RequirementStatus;
  status_changed_at: string;
  notes: string | null;
  last_activity_at: string | null;
  client_contact_id: string | null;
  client_accepted_at: string | null;
  fee_basis: "percent_first_year" | "fixed_fee" | "retainer_milestone" | "contract_margin" | "other" | null;
  fee_percent: number | null;
  expected_compensation: number | null;
  fee_per_hire: number | null;
  estimated_total_fee: number | null;
  computed_total_fee: number | null;
  currency: string;
  commercial_terms: string | null;
  terms_agreed_at: string | null;
  probability: number | null;
  forecast_placement_on: string | null;
  next_action: string | null;
  next_action_on: string | null;
}

export interface Activity extends Archivable {
  id: string;
  type: ActivityType;
  subject: string;
  body: string | null;
  occurred_at: string;
  company_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  requirement_id: string | null;
  owner_id: string | null;
  due_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  reminder_at: string | null;
  reminder_state: "none" | "scheduled" | "dismissed";
  starts_at: string | null;
  ends_at: string | null;
  meeting_location: string | null;
  origin: "manual" | "gmail" | "calendar" | "import";
  external_owner_id: string | null;
  external_id: string | null;
  external_thread_id: string | null;
  external_meta: Record<string, unknown>;
}

export interface HistoryEntry {
  id: number;
  entity_type: "company" | "contact" | "opportunity" | "requirement" | "activity";
  entity_id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface AuditEntry {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
}

export interface ImportRecord {
  id: string;
  entity: "leads" | "companies" | "contacts";
  filename: string;
  created_by: string | null;
  created_at: string;
  total_rows: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  duplicate_count: number;
}

export interface ImportReportRow {
  row: number;
  outcome: "created" | "updated" | "skipped" | "failed";
  message: string;
  values?: Record<string, string>;
}

export interface GoogleConnectionStatus {
  product: "gmail" | "calendar";
  google_email: string;
  scopes: string[];
  status: "connected" | "needs_reauth" | "error" | "disconnected";
  last_sync_at: string | null;
  last_sync_result: Record<string, unknown>;
  last_error: string | null;
  connected_at: string;
}

export interface SyncReviewItem {
  id: string;
  product: "gmail" | "calendar";
  external_id: string;
  external_thread_id: string | null;
  subject: string | null;
  participants: { email: string; name?: string | null; role?: string }[];
  occurred_at: string;
  suggested_company_id: string | null;
  state: "pending" | "logged" | "ignored";
}

/** Result shape for every server action form. */
export interface ActionState {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Set when a create was blocked by likely duplicates the user must review. */
  duplicates?: { id: string; label: string; detail?: string; reason: string }[];
}

// ------------------------------------------------------------------ v2
export interface AppSettings {
  stage_probabilities: Record<string, number>;
  booked_requires_msa: boolean;
  booked_requires_accepted: boolean;
  booked_requires_terms: boolean;
  placement_earned_on: "offer_accepted" | "joining";
  default_currency: string;
  monitoring_enabled: boolean;
  monitoring_default_cadence_days: number;
  research_enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface Agreement {
  id: string; company_id: string; kind: "msa" | "sow" | "rate_card" | "nda" | "other";
  status: "not_started" | "in_discussion" | "signed" | "expired" | "terminated";
  title: string | null; signed_on: string | null; effective_on: string | null; expires_on: string | null;
  reference: string | null; terms: string | null; created_at: string; archived_at: string | null;
}

export interface Placement {
  id: string; requirement_id: string; label: string | null; status: "offer_accepted" | "joined" | "fell_through";
  offer_accepted_on: string; joined_on: string | null; compensation: number | null; fee_amount: number | null;
  currency: string; notes: string | null; created_at: string; archived_at: string | null;
}

export interface RevenueEvent {
  id: string; requirement_id: string; placement_id: string | null; kind: "placement_fee" | "retainer_milestone" | "contract_margin" | "other";
  status: "expected" | "earned" | "reversed"; amount: number; currency: string; earned_on: string | null;
  description: string | null; reversal_reason: string | null; created_at: string;
}

export interface InvoiceBalance {
  id: string; company_id: string; requirement_id: string | null; invoice_number: string; status: "issued" | "cancelled";
  issued_on: string; due_on: string; amount: number; currency: string; notes: string | null; cancel_reason: string | null;
  paid: number; credited: number; outstanding: number; last_payment_on: string | null; is_overdue: boolean;
  days_past_due: number; aging_bucket: string; payment_state: "unpaid" | "part_paid" | "paid" | "cancelled"; created_at: string;
}

export interface Payment {
  id: string; invoice_id: string; received_on: string; amount: number; currency: string; reference: string | null;
  method: string | null; reversed_at: string | null; reversal_reason: string | null; created_at: string;
}

export interface RequirementRevenue {
  requirement_id: string; company_id: string; opportunity_id: string | null; role_title: string; status: string; currency: string;
  fee_basis: string | null; estimated_fee: number | null; probability: number | null; is_booked: boolean;
  earned: number; expected_earnings: number; invoiced: number; collected: number; outstanding: number;
}

export interface ResearchJob {
  id: string; company_id: string; opportunity_id: string | null; requested_by: string | null; provider: string;
  input: Record<string, unknown>; status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  attempts: number; max_attempts: number; next_attempt_at: string; error: string | null; snapshot_id: string | null; created_at: string;
}

export interface ResearchSnapshot {
  id: string; job_id: string; company_id: string; opportunity_id: string | null; provider: string; model: string | null;
  checked_at: string; about_brief: string | null; outreach_angle: string | null; draft_message: string | null;
  warnings: string[]; sources_retrieved: number; created_by: string | null;
}

export interface ResearchFinding {
  id: string; snapshot_id: string; company_id: string; position: number;
  category: "about" | "profile" | "announcement" | "funding" | "hiring" | "expansion" | "leadership" | "market" | "other";
  statement: string; evidence_kind: "verified_fact" | "reported_claim" | "inference"; confidence: "high" | "medium" | "low";
  source_url: string | null; source_title: string | null; published_on: string | null; retrieved_at: string; excerpt: string | null;
  source_verified: boolean; conflict_note: string | null; review_state: "pending" | "accepted" | "dismissed" | "corrected";
  corrected_statement: string | null; reviewed_by: string | null; reviewed_at: string | null; applied_to_field: string | null;
}

export interface OutreachDraft {
  id: string; company_id: string; opportunity_id: string | null; contact_id: string | null; snapshot_id: string | null;
  channel: "email" | "whatsapp"; level: string; subject: string | null; body: string;
  status: "draft" | "sent_email" | "copied_whatsapp" | "discarded"; created_by: string | null; created_at: string; updated_at: string;
}

export interface CompanyMonitor {
  id: string; company_id: string; enabled: boolean; signal_types: string[]; cadence_days: number;
  sources: { greenhouse_board?: string | null; lever_company?: string | null; rss_urls?: string[] };
  next_run_at: string; last_run_at: string | null; last_success_at: string | null;
  status: "idle" | "ok" | "partial" | "error" | "no_sources"; consecutive_failures: number; last_error: string | null;
}

export interface CompanySignal {
  id: string; company_id: string; signal_type: string; summary: string; source_url: string | null; source_title: string | null;
  provider: string; published_at: string | null; first_seen_at: string; last_checked_at: string; confidence: "high" | "medium" | "low";
  details: Record<string, unknown>; review_state: "new" | "accepted" | "dismissed"; reviewed_by: string | null; reviewed_at: string | null;
  task_id: string | null;
}

export interface AppNotification {
  id: string; kind: string; title: string; body: string | null; link: string | null; created_at: string; read_at: string | null;
}

export interface WebSubmission {
  id: string; received_at: string; full_name: string; email: string; company_name: string | null; phone: string | null;
  role_needed: string | null; hiring_volume: number | null; location: string | null; message: string | null; page_url: string | null;
  status: "new" | "converted" | "spam" | "dismissed"; opportunity_id: string | null;
}
