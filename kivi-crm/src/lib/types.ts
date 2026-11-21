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
  report: ImportReportRow[];
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
