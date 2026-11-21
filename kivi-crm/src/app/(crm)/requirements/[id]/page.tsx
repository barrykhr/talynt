import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeamMap } from "@/lib/data/team";
import { teamOptions, timelineLinks } from "@/lib/data/lookups";
import { isUuid } from "@/lib/data/query";
import { Card, DescriptionList, LinkButton, Notice, NotesText, PageHeader } from "@/components/ui";
import { ActivityTimeline, ClientBadge, HistoryList, MsaBadge, Owner, Progress, RequirementBadge, StageBadge } from "@/components/crm";
import { ConfirmAction, Disclosure } from "@/components/forms";
import { ActivityForm } from "@/components/record-forms";
import { ProgressForm } from "@/components/progress-form";
import { CommunicationPanel } from "@/components/communication";
import { RequirementRevenuePanel } from "@/components/revenue";
import { formatMoney } from "@/lib/money";
import { IconPlus } from "@/components/icons";
import { setRequirementArchived } from "@/lib/actions/opportunities";
import { isLiveRequirement } from "@/lib/domain/client-status";
import { formatDate, formatRelative } from "@/lib/time";
import type { Activity, CompanyOverview, Contact, HistoryEntry, Opportunity, Requirement } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Requirement" };
  const supabase = await createClient();
  const { data } = await supabase.from("requirements").select("role_title").eq("id", id).maybeSingle();
  return { title: data?.role_title ?? "Requirement" };
}

export default async function RequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const member = await requireMemberPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("requirements").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const req = data as Requirement;

  const [companyRes, oppRes, contactLinks, actsRes, histRes, team, teamOpts] = await Promise.all([
    supabase.from("company_overview").select("*").eq("id", req.company_id).maybeSingle(),
    req.opportunity_id ? supabase.from("opportunities").select("*").eq("id", req.opportunity_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("requirement_contacts").select("contact_id").eq("requirement_id", id),
    supabase.from("activities").select("*").eq("requirement_id", id).is("archived_at", null).order("occurred_at", { ascending: false }).limit(50),
    supabase.from("record_history").select("*").eq("entity_type", "requirement").eq("entity_id", id).order("changed_at", { ascending: false }).limit(40),
    getTeamMap(),
    teamOptions(),
  ]);
  const company = companyRes.data as CompanyOverview | null;
  const opp = oppRes.data as Opportunity | null;
  const contactIds = (contactLinks.data ?? []).map((l: { contact_id: string }) => l.contact_id);
  const { data: contactsData } = contactIds.length ? await supabase.from("contacts").select("*").in("id", contactIds) : { data: [] };
  const contacts = (contactsData ?? []) as Contact[];
  const activities = (actsRes.data ?? []) as Activity[];
  const history = (histRes.data ?? []) as HistoryEntry[];
  const links = await timelineLinks(supabase, activities);
  const back = `/requirements/${id}`;
  const archived = Boolean(req.archived_at);

  return (
    <>
      <PageHeader
        eyebrow={<><Link href="/requirements" className="hover:underline">Requirements</Link> · {company ? <Link href={`/companies/${company.id}`} className="hover:underline">{company.name}</Link> : null}</>}
        title={req.role_title}
        description={<span className="flex flex-wrap items-center gap-2"><RequirementBadge status={req.status} /><span>{isLiveRequirement(req.status) ? "Live" : "Not live"}</span>{req.location ? <span>· {req.location}</span> : null}</span>}
        actions={archived ? (
          <ConfirmAction action={setRequirementArchived} hidden={{ id, archive: "false" }} label="Restore" variant="primary" title="Restore this requirement?" description="It will count towards client status again if live." confirmLabel="Restore" />
        ) : (
          <>
            <LinkButton href={`/requirements/${id}/edit`}>Edit</LinkButton>
            <ConfirmAction action={setRequirementArchived} hidden={{ id, archive: "true" }} label="Archive" title="Archive this requirement?"
              description="Use this for duplicates or mistakes. For finished work, set the status to Closed / filled instead. Archived requirements no longer count towards active-client status."
              confirmLabel="Archive" />
          </>
        )}
      />
      {archived ? <div className="mb-6"><Notice tone="warn" title="This requirement is archived" /></div> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {!archived ? (
            <Card title="Delivery progress">
              <div className="mb-4"><Progress filled={req.positions_filled} volume={req.hiring_volume} /></div>
              <ProgressForm id={id} status={req.status} />
              <p className="mt-3 text-xs text-muted">Placed count comes from recorded placements (below). Status changes are recorded in History. In this status since {formatDate(req.status_changed_at)}.</p>
              {req.next_action || req.next_action_on ? <p className="mt-2 text-sm">Next action: {req.next_action ?? "—"}{req.next_action_on ? ` · due ${formatDate(req.next_action_on)}` : ""}</p> : <p className="mt-2 text-sm text-warn">No next action set.</p>}
            </Card>
          ) : null}
          <RequirementRevenuePanel req={req} companyId={req.company_id} back={back} />
          <Card title="Activity" id="activity"
            actions={!archived ? <Disclosure summary={<><IconPlus /> Log activity</>}><ActivityForm links={{ requirement_id: id, company_id: req.company_id }} contacts={contacts.map((c) => ({ value: c.id, label: c.full_name }))} team={teamOpts} defaultOwner={member.id} back={back} /></Disclosure> : null}>
            <ActivityTimeline activities={activities} team={team} links={links} back={back} currentUserId={member.id} />
          </Card>
        </div>
        <aside className="space-y-6">
          <Card title="Details">
            <DescriptionList items={[
              { label: "Company", value: company ? <Link className="link" href={`/companies/${company.id}`}>{company.name}</Link> : "—" },
              { label: "Client status", value: company ? <ClientBadge status={company.client_status} /> : "—" },
              { label: "MSA", value: company ? <MsaBadge status={company.msa_status} /> : "—" },
              { label: "Sales deal", value: opp ? <span className="flex flex-col gap-1"><Link className="link" href={`/pipeline/${opp.id}`}>{opp.title}</Link><StageBadge stage={opp.stage} /></span> : "—" },
              { label: "Owner", value: <Owner member={team.get(req.owner_id ?? "")} /> },
              { label: "Hiring volume", value: req.hiring_volume },
              { label: "Client accepted", value: req.client_accepted_at ? formatDate(req.client_accepted_at) : "Not yet" },
              { label: "Estimated fee", value: formatMoney(req.computed_total_fee, req.currency) },
              { label: "Expected start", value: formatDate(req.expected_start_on) },
              { label: "Timeline", value: req.timeline_notes ?? "—" },
              { label: "Budget / commercial", value: req.budget_notes ?? "—" },
              { label: "Last activity", value: formatRelative(req.last_activity_at) },
            ]} />
          </Card>
          <Card title={`Hiring contacts · ${contacts.length}`}>
            {contacts.length === 0 ? <p className="text-sm text-muted">No contacts linked. Edit to link the hiring manager or HR contact.</p> : (
              <ul className="space-y-2">{contacts.map((c) => (
                <li key={c.id}><Link className="font-medium hover:underline" href={`/contacts/${c.id}`}>{c.full_name}</Link><div className="text-xs text-muted">{[c.role_title, c.email].filter(Boolean).join(" · ")}</div></li>
              ))}</ul>
            )}
          </Card>
          {!archived ? (
            <CommunicationPanel member={member} links={{ requirement_id: id, company_id: req.company_id }} back={back}
              defaultTo={contacts.find((c) => c.email)?.email ?? ""} recipients={contacts.filter((c) => c.email).map((c) => ({ value: c.email!, label: c.full_name }))} />
          ) : null}
          <Card title="Notes"><NotesText text={req.notes} /></Card>
          <Card title="Status history"><HistoryList entries={history} team={team} /></Card>
        </aside>
      </div>
    </>
  );
}
