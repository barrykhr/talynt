import Link from "next/link";
import { Avatar, Badge, EmptyState, type Tone } from "@/components/ui";
import { ConfirmAction, InlineAction } from "@/components/forms";
import { ACTIVITY_ICON, IconCheck, IconClock, IconTask } from "@/components/icons";
import {
  ACTIVITY_TYPES, CLIENT_STATUS_LABEL, LEAD_SOURCES, MSA_STATUSES, OPPORTUNITY_STAGES, REQUIREMENT_STATUSES,
  type ClientStatus, type LeadSource, type MsaStatus, type OpportunityStage, type RequirementStatus,
} from "@/lib/constants";
import { displayName, initials } from "@/lib/data/team";
import { formatDate, formatDateTime, formatRelative, daysUntil, todayInZone } from "@/lib/time";
import { archiveActivity, dismissReminder, setTaskCompleted } from "@/lib/actions/activities";
import { placementProgress } from "@/lib/domain/client-status";
import type { Activity, HistoryEntry, TeamMember } from "@/lib/types";

const STAGE_TONE: Record<OpportunityStage, Tone> = {
  new_lead: "neutral", researching: "neutral", ready_to_contact: "info", contacted: "info", in_conversation: "info",
  qualified: "accent", proposal_msa: "accent", won: "ok", nurture: "warn", lost: "danger",
};
const REQ_TONE: Record<RequirementStatus, Tone> = {
  new_requirement: "neutral", sourcing: "info", candidates_shared: "info", interviews: "accent", offer: "accent",
  placed: "ok", on_hold: "warn", closed_filled: "neutral",
};
const MSA_TONE: Record<MsaStatus, Tone> = { not_started: "neutral", in_discussion: "warn", signed: "ok" };
const CLIENT_TONE: Record<ClientStatus, Tone> = { active_client: "ok", msa_signed_no_live_requirement: "info", prospect: "neutral" };

export const StageBadge = ({ stage }: { stage: OpportunityStage }) => <Badge tone={STAGE_TONE[stage]}>{OPPORTUNITY_STAGES.label[stage]}</Badge>;
export const RequirementBadge = ({ status }: { status: RequirementStatus }) => <Badge tone={REQ_TONE[status]}>{REQUIREMENT_STATUSES.label[status]}</Badge>;
export const MsaBadge = ({ status }: { status: MsaStatus }) => <Badge tone={MSA_TONE[status]}>MSA: {MSA_STATUSES.label[status]}</Badge>;
export const ClientBadge = ({ status }: { status: ClientStatus }) => <Badge tone={CLIENT_TONE[status]}>{CLIENT_STATUS_LABEL[status]}</Badge>;
export const SourceText = ({ source }: { source: LeadSource | null }) => <>{source ? LEAD_SOURCES.label[source] : "—"}</>;

export function Owner({ member }: { member: TeamMember | undefined | null }) {
  if (!member) return <span className="text-sm text-faint">Unassigned</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Avatar label={initials(member)} title={member.email} />
      <span className="truncate">{displayName(member)}</span>
    </span>
  );
}

export function FollowUp({ date, closed }: { date: string | null; closed?: boolean }) {
  if (!date) return <span className="text-faint">—</span>;
  const d = daysUntil(date, todayInZone());
  if (closed) return <span className="text-muted">{formatDate(date)}</span>;
  if (d < 0) return <Badge tone="danger">Overdue · {formatDate(date, { withYear: false })}</Badge>;
  if (d === 0) return <Badge tone="warn">Today</Badge>;
  return <span className={d <= 3 ? "text-warn" : "text-ink-soft"}>{formatDate(date)}</span>;
}

export function Progress({ filled, volume }: { filled: number; volume: number }) {
  const p = placementProgress(filled, volume);
  return (
    <div className="flex min-w-[120px] items-center gap-2" title={`${p.filled} of ${p.volume} placed`}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuemin={0} aria-valuemax={p.volume} aria-valuenow={p.filled} aria-label="Placements">
        <div className="h-full rounded-full bg-accent" style={{ width: `${p.percent}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted">{p.filled}/{p.volume}</span>
    </div>
  );
}

// ------------------------------------------------------------------ Timeline
export interface TimelineLinks {
  companies: Map<string, string>;
  contacts: Map<string, string>;
  opportunities: Map<string, string>;
  requirements: Map<string, string>;
}

export function ActivityTimeline({
  activities, team, links, back, currentUserId, showLinks = true, emptyText = "No activity yet. Log a call, email, WhatsApp message or note to start the history.",
}: {
  activities: Activity[]; team: Map<string, TeamMember>; links?: TimelineLinks; back: string; currentUserId: string; showLinks?: boolean; emptyText?: string;
}) {
  if (activities.length === 0) {
    return <EmptyState compact icon={<IconTask />} title="Nothing logged yet" description={emptyText} />;
  }
  return (
    <ol className="relative space-y-0">
      {activities.map((a) => {
        const Icon = ACTIVITY_ICON[a.type];
        const isTask = a.type === "task";
        const done = Boolean(a.completed_at);
        const overdue = isTask && !done && a.due_at && new Date(a.due_at) < new Date();
        const author = team.get(a.owner_id ?? a.created_by ?? "");
        const meta = a.external_meta as { from?: string; to?: string[]; attendees?: string[]; htmlLink?: string; status?: string };
        return (
          <li key={a.id} className="group relative flex gap-3 border-b border-line py-3 last:border-b-0">
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${done ? "bg-ok-soft text-ok" : "bg-sunken text-ink-soft"}`}>
              {done ? <IconCheck /> : <Icon />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className={`font-medium ${done ? "text-muted line-through decoration-faint" : "text-ink"}`}>{a.subject}</span>
                <span className="text-xs text-muted">{ACTIVITY_TYPES.label[a.type]}</span>
                {a.origin !== "manual" ? <Badge tone="info">{a.origin === "gmail" ? "Synced from Gmail" : a.origin === "calendar" ? "Synced from Calendar" : "Imported"}</Badge> : null}
                {overdue ? <Badge tone="danger">Overdue</Badge> : null}
                {meta.status === "cancelled" ? <Badge tone="warn">Cancelled</Badge> : null}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                {isTask ? (
                  <span className="inline-flex items-center gap-1"><IconClock /> Due {formatDateTime(a.due_at)}</span>
                ) : (
                  <time dateTime={a.occurred_at} title={formatDateTime(a.occurred_at)}>{formatRelative(a.occurred_at)}</time>
                )}
                <span>{isTask ? "Owner" : "By"} {displayName(author)}</span>
                {meta.from ? <span>From {meta.from}</span> : null}
                {meta.to?.length ? <span>To {meta.to.slice(0, 3).join(", ")}{meta.to.length > 3 ? "…" : ""}</span> : null}
                {meta.attendees?.length ? <span>{meta.attendees.length} attendee{meta.attendees.length === 1 ? "" : "s"}</span> : null}
              </div>
              {showLinks && links ? <RecordLinks a={a} links={links} /> : null}
              {a.body ? <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-ink-soft">{a.body}</p> : null}
              {a.origin === "gmail" ? (
                <p className="mt-1 text-xs text-faint">Message body isn&apos;t stored in the CRM — open it in the sender&apos;s Gmail.</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-start gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
              {isTask ? (
                <>
                  {a.reminder_state === "scheduled" && !done && a.reminder_at && new Date(a.reminder_at) <= new Date() ? (
                    <InlineAction action={dismissReminder} hidden={{ id: a.id, back }} title="Dismiss reminder">Dismiss</InlineAction>
                  ) : null}
                  <InlineAction action={setTaskCompleted} hidden={{ id: a.id, done: String(!done), back }} title={done ? "Reopen task" : "Mark complete"} variant={done ? "ghost" : "subtle"}>
                    {done ? "Reopen" : "Done"}
                  </InlineAction>
                </>
              ) : null}
              <ConfirmAction
                action={archiveActivity}
                hidden={{ id: a.id, back, not_crm: "false" }}
                label="Remove"
                variant="ghost"
                size="sm"
                title="Remove this from the timeline?"
                description="It will be archived, not deleted, and stays in the record history."
                confirmLabel="Remove"
              />
              {a.origin !== "manual" && a.origin !== "import" && a.external_owner_id === currentUserId ? (
                <ConfirmAction
                  action={archiveActivity}
                  hidden={{ id: a.id, back, not_crm: "true" }}
                  label="Not CRM"
                  variant="ghost"
                  size="sm"
                  title="Not CRM-related?"
                  description="This removes it from the CRM and stops future syncs from logging this email thread or event again."
                  confirmLabel="Exclude"
                />
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function RecordLinks({ a, links }: { a: Activity; links: TimelineLinks }) {
  const items: { href: string; label: string }[] = [];
  if (a.company_id && links.companies.get(a.company_id)) items.push({ href: `/companies/${a.company_id}`, label: links.companies.get(a.company_id)! });
  if (a.contact_id && links.contacts.get(a.contact_id)) items.push({ href: `/contacts/${a.contact_id}`, label: links.contacts.get(a.contact_id)! });
  if (a.opportunity_id && links.opportunities.get(a.opportunity_id)) items.push({ href: `/pipeline/${a.opportunity_id}`, label: links.opportunities.get(a.opportunity_id)! });
  if (a.requirement_id && links.requirements.get(a.requirement_id)) items.push({ href: `/requirements/${a.requirement_id}`, label: links.requirements.get(a.requirement_id)! });
  if (!items.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-x-2 text-xs">
      {items.map((i) => <Link key={i.href} href={i.href} className="link">{i.label}</Link>)}
    </div>
  );
}

// ------------------------------------------------------------------ History
const FIELD_LABEL: Record<string, string> = {
  stage: "Stage", status: "Status", owner_id: "Owner", msa_status: "MSA", archived: "Archived",
  merged_into: "Merged", positions_filled: "Placements", loss_reason: "Loss reason", company_id: "Company",
  created: "Created", completed: "Completed",
};

function valueLabel(field: string, v: string | null, team: Map<string, TeamMember>): string {
  if (v === null) return "—";
  if (field === "stage" && v in OPPORTUNITY_STAGES.label) return OPPORTUNITY_STAGES.label[v as OpportunityStage];
  if (field === "status" && v in REQUIREMENT_STATUSES.label) return REQUIREMENT_STATUSES.label[v as RequirementStatus];
  if (field === "msa_status" && v in MSA_STATUSES.label) return MSA_STATUSES.label[v as MsaStatus];
  if (field === "owner_id") return displayName(team.get(v));
  if (field === "archived" || field === "completed") return v === "true" ? "Yes" : "No";
  if (field === "company_id" || field === "merged_into") return "another record";
  return v;
}

export function HistoryList({ entries, team }: { entries: HistoryEntry[]; team: Map<string, TeamMember> }) {
  if (entries.length === 0) return <p className="text-sm text-faint">No changes recorded yet.</p>;
  return (
    <ol className="space-y-2.5 text-sm">
      {entries.map((h) => (
        <li key={h.id} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" aria-hidden />
          <div className="min-w-0">
            <span className="text-ink">
              {h.field === "created" ? (
                <>Created</>
              ) : h.old_value === null && (h.field === "stage" || h.field === "status") ? (
                <>Started at <strong className="font-medium">{valueLabel(h.field, h.new_value, team)}</strong></>
              ) : (
                <>
                  {FIELD_LABEL[h.field] ?? h.field}: <span className="text-muted">{valueLabel(h.field, h.old_value, team)}</span> →{" "}
                  <strong className="font-medium">{valueLabel(h.field, h.new_value, team)}</strong>
                </>
              )}
            </span>
            <div className="text-xs text-muted">
              {displayName(team.get(h.changed_by ?? "")) === "Unassigned" ? "System" : displayName(team.get(h.changed_by ?? ""))} · {formatDateTime(h.changed_at)}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
