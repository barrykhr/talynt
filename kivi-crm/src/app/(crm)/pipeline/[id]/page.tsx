import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeamMap } from "@/lib/data/team";
import { teamOptions, timelineLinks } from "@/lib/data/lookups";
import { isUuid } from "@/lib/data/query";
import { Card, DescriptionList, LinkButton, Notice, NotesText, PageHeader } from "@/components/ui";
import { ActivityTimeline, ClientBadge, FollowUp, HistoryList, MsaBadge, Owner, Progress, RequirementBadge, SourceText, StageBadge } from "@/components/crm";
import { ConfirmAction, Disclosure, InlineAction } from "@/components/forms";
import { ActivityForm } from "@/components/record-forms";
import { StageMover } from "@/components/stage-mover";
import { CommunicationPanel } from "@/components/communication";
import { IconPlus } from "@/components/icons";
import { setOpportunityArchived } from "@/lib/actions/opportunities";
import { setMsaStatus } from "@/lib/actions/companies";
import { MSA_STATUSES } from "@/lib/constants";
import { formatDate, formatDateTime, formatRelative } from "@/lib/time";
import type { Activity, CompanyOverview, Contact, HistoryEntry, Opportunity, Requirement } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Opportunity" };
  const supabase = await createClient();
  const { data } = await supabase.from("opportunities").select("title").eq("id", id).maybeSingle();
  return { title: data?.title ?? "Opportunity" };
}

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const member = await requireMemberPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("opportunities").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const opp = data as Opportunity;

  const [companyRes, contactLinks, reqsRes, actsRes, histRes, team, teamOpts] = await Promise.all([
    supabase.from("company_overview").select("*").eq("id", opp.company_id).maybeSingle(),
    supabase.from("opportunity_contacts").select("contact_id").eq("opportunity_id", id),
    supabase.from("requirements").select("*").eq("opportunity_id", id).is("archived_at", null),
    supabase.from("activities").select("*").eq("opportunity_id", id).is("archived_at", null).order("occurred_at", { ascending: false }).limit(50),
    supabase.from("record_history").select("*").eq("entity_type", "opportunity").eq("entity_id", id).order("changed_at", { ascending: false }).limit(40),
    getTeamMap(),
    teamOptions(),
  ]);
  const company = companyRes.data as CompanyOverview | null;
  const contactIds = (contactLinks.data ?? []).map((l: { contact_id: string }) => l.contact_id);
  const { data: contactsData } = contactIds.length ? await supabase.from("contacts").select("*").in("id", contactIds) : { data: [] };
  const contacts = (contactsData ?? []) as Contact[];
  const reqs = (reqsRes.data ?? []) as Requirement[];
  const activities = (actsRes.data ?? []) as Activity[];
  const history = (histRes.data ?? []) as HistoryEntry[];
  const links = await timelineLinks(supabase, activities);
  const back = `/pipeline/${id}`;
  const archived = Boolean(opp.archived_at);
  const closed = opp.stage === "won" || opp.stage === "lost";

  return (
    <>
      <PageHeader
        eyebrow={<><Link href="/pipeline" className="hover:underline">Pipeline</Link> · {company ? <Link href={`/companies/${company.id}`} className="hover:underline">{company.name}</Link> : null}</>}
        title={opp.title}
        description={<span className="flex flex-wrap items-center gap-2"><StageBadge stage={opp.stage} />{company ? <><MsaBadge status={company.msa_status} /><ClientBadge status={company.client_status} /></> : null}<span>In this stage since {formatDate(opp.stage_changed_at)}</span></span>}
        actions={archived ? (
          <ConfirmAction action={setOpportunityArchived} hidden={{ id, archive: "false" }} label="Restore" variant="primary" title="Restore this opportunity?" description="It will return to the pipeline." confirmLabel="Restore" />
        ) : (
          <>
            <LinkButton href={`/pipeline/${id}/edit`}>Edit</LinkButton>
            <ConfirmAction action={setOpportunityArchived} hidden={{ id, archive: "true" }} label="Archive" title="Archive this opportunity?"
              description="Use this for duplicates or mistakes. To record a lost deal, move it to Lost with a reason instead — that keeps it in reports." confirmLabel="Archive" />
          </>
        )}
      />

      {archived ? <div className="mb-6"><Notice tone="warn" title="This opportunity is archived">It is hidden from the pipeline and reports.</Notice></div> : null}
      {opp.stage === "lost" && opp.loss_reason ? <div className="mb-6"><Notice tone="danger" title={`Lost ${opp.lost_at ? `on ${formatDate(opp.lost_at)}` : ""}`}>{opp.loss_reason}</Notice></div> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {!archived ? (
            <Card title="Move stage">
              <div className="max-w-md"><StageMover id={id} stage={opp.stage} /></div>
              <p className="mt-2 text-xs text-muted">Every stage change is recorded in History with who made it and when.</p>
            </Card>
          ) : null}
          <Card title="Activity" id="activity"
            actions={!archived ? <Disclosure summary={<><IconPlus /> Log activity</>}><ActivityForm links={{ opportunity_id: id, company_id: opp.company_id }} contacts={contacts.map((c) => ({ value: c.id, label: c.full_name }))} team={teamOpts} defaultOwner={member.id} back={back} /></Disclosure> : null}>
            <ActivityTimeline activities={activities} team={team} links={links} back={back} currentUserId={member.id} />
          </Card>
          <Card title={`Requirements from this deal · ${reqs.length}`} actions={!archived ? <LinkButton size="sm" href={`/requirements/new?company=${opp.company_id}&opportunity=${id}`}><IconPlus /> New</LinkButton> : null}>
            {reqs.length === 0 ? <p className="text-sm text-muted">Delivery is tracked separately from the sales stage. Add a requirement when the client shares a role.</p> : (
              <ul className="divide-y divide-line">
                {reqs.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <Link className="font-medium hover:underline" href={`/requirements/${r.id}`}>{r.role_title}</Link>
                    <div className="flex items-center gap-3"><Progress filled={r.positions_filled} volume={r.hiring_volume} /><RequirementBadge status={r.status} /></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <aside className="space-y-6">
          <Card title="Details">
            <DescriptionList items={[
              { label: "Owner", value: <Owner member={team.get(opp.owner_id ?? "")} /> },
              { label: "Next follow-up", value: <FollowUp date={opp.next_follow_up_on} closed={closed} /> },
              { label: "Hiring need", value: opp.hiring_need ?? "—" },
              { label: "Volume", value: opp.hiring_volume ?? "—" },
              { label: "Location", value: opp.location ?? "—" },
              { label: "Budget", value: opp.budget ?? "—" },
              { label: "Source", value: <SourceText source={opp.source} /> },
              { label: "Last activity", value: formatRelative(opp.last_activity_at) },
              { label: "Created", value: formatDateTime(opp.created_at) },
              ...(opp.won_at ? [{ label: "Won", value: formatDate(opp.won_at) }] : []),
            ]} />
          </Card>
          {company && !archived ? (
            <Card title="MSA (company-level)">
              <p className="mb-3 text-xs text-muted">Tracked independently of the sales stage. Active client = MSA signed + a live requirement.</p>
              <div className="flex flex-wrap gap-2">
                {MSA_STATUSES.values.map((s) => (
                  <InlineAction key={s} action={setMsaStatus} hidden={{ id: company.id, msa_status: s, back }} variant={company.msa_status === s ? "primary" : "secondary"} title={`Set MSA to ${MSA_STATUSES.label[s]}`}>
                    {MSA_STATUSES.label[s]}
                  </InlineAction>
                ))}
              </div>
            </Card>
          ) : null}
          <Card title={`Contacts · ${contacts.length}`}>
            {contacts.length === 0 ? <p className="text-sm text-muted">No contacts linked. Edit the opportunity to link people.</p> : (
              <ul className="space-y-2">
                {contacts.map((c) => (
                  <li key={c.id}><Link className="font-medium hover:underline" href={`/contacts/${c.id}`}>{c.full_name}</Link><div className="text-xs text-muted">{[c.role_title, c.email].filter(Boolean).join(" · ")}</div></li>
                ))}
              </ul>
            )}
          </Card>
          {!archived ? (
            <CommunicationPanel member={member} links={{ opportunity_id: id, company_id: opp.company_id }} back={back}
              defaultTo={contacts.find((c) => c.email)?.email ?? ""} recipients={contacts.filter((c) => c.email).map((c) => ({ value: c.email!, label: c.full_name }))} />
          ) : null}
          <Card title="Notes"><NotesText text={opp.notes} /></Card>
          <Card title="Stage & owner history"><HistoryList entries={history} team={team} /></Card>
        </aside>
      </div>
    </>
  );
}
