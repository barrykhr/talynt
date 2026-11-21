import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeamMap } from "@/lib/data/team";
import { teamOptions, timelineLinks } from "@/lib/data/lookups";
import { isUuid } from "@/lib/data/query";
import { Card, DescriptionList, LinkButton, Notice, NotesText, PageHeader } from "@/components/ui";
import { ActivityTimeline, HistoryList, Owner, RequirementBadge, SourceText, StageBadge } from "@/components/crm";
import { ConfirmAction, Disclosure } from "@/components/forms";
import { ActivityForm } from "@/components/record-forms";
import { CommunicationPanel } from "@/components/communication";
import { IconPlus } from "@/components/icons";
import { mergeContacts, setContactArchived } from "@/lib/actions/contacts";
import { formatDate, formatRelative } from "@/lib/time";
import type { Activity, Contact, HistoryEntry, Opportunity, Requirement } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Contact" };
  const supabase = await createClient();
  const { data } = await supabase.from("contacts").select("full_name").eq("id", id).maybeSingle();
  return { title: data?.full_name ?? "Contact" };
}

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const member = await requireMemberPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("contacts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const contact = data as Contact;

  const [companyRes, actsRes, histRes, oppLinks, reqLinks, dupsRes, team, teamOpts, mergedInto] = await Promise.all([
    contact.company_id ? supabase.from("companies").select("id, name").eq("id", contact.company_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("activities").select("*").eq("contact_id", id).is("archived_at", null).order("occurred_at", { ascending: false }).limit(50),
    supabase.from("record_history").select("*").eq("entity_type", "contact").eq("entity_id", id).order("changed_at", { ascending: false }).limit(30),
    supabase.from("opportunity_contacts").select("opportunity_id").eq("contact_id", id),
    supabase.from("requirement_contacts").select("requirement_id").eq("contact_id", id),
    contact.archived_at ? Promise.resolve({ data: [] }) : supabase.rpc("find_contact_duplicates", { p_email: contact.email, p_full_name: contact.full_name, p_company_id: contact.company_id, p_exclude: id }),
    getTeamMap(),
    teamOptions(),
    contact.merged_into_id ? supabase.from("contacts").select("id, full_name").eq("id", contact.merged_into_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const company = companyRes.data as { id: string; name: string } | null;
  const activities = (actsRes.data ?? []) as Activity[];
  const history = (histRes.data ?? []) as HistoryEntry[];
  const oppIds = (oppLinks.data ?? []).map((r: { opportunity_id: string }) => r.opportunity_id);
  const reqIds = (reqLinks.data ?? []).map((r: { requirement_id: string }) => r.requirement_id);
  const [{ data: opps }, { data: reqs }] = await Promise.all([
    oppIds.length ? supabase.from("opportunities").select("*").in("id", oppIds).is("archived_at", null) : Promise.resolve({ data: [] }),
    reqIds.length ? supabase.from("requirements").select("*").in("id", reqIds).is("archived_at", null) : Promise.resolve({ data: [] }),
  ]);
  const duplicates = (dupsRes.data ?? []) as { id: string; full_name: string; email: string | null; reason: string }[];
  const links = await timelineLinks(supabase, activities);
  const back = `/contacts/${id}`;
  const archived = Boolean(contact.archived_at);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/contacts" className="hover:underline">Contacts</Link>}
        title={contact.full_name}
        description={<>{contact.role_title ?? "No role recorded"}{company ? <> at <Link className="link" href={`/companies/${company.id}`}>{company.name}</Link></> : null}</>}
        actions={archived ? (
          <ConfirmAction action={setContactArchived} hidden={{ id, archive: "false" }} label="Restore" variant="primary" title="Restore this contact?" description="It will reappear in lists and searches." confirmLabel="Restore" />
        ) : (
          <>
            <LinkButton href={`/contacts/${id}/edit`}>Edit</LinkButton>
            <ConfirmAction action={setContactArchived} hidden={{ id, archive: "true" }} label="Archive" title={`Archive ${contact.full_name}?`}
              description="Archived contacts are hidden from lists. Their activity history is kept and you can restore them." confirmLabel="Archive contact" />
          </>
        )}
      />

      {archived ? (
        <div className="mb-6"><Notice tone="warn" title={mergedInto.data ? "This contact was merged" : "This contact is archived"}>
          {mergedInto.data ? <>Now part of <Link className="link" href={`/contacts/${mergedInto.data.id}`}>{mergedInto.data.full_name}</Link>.</> : <>Archived {formatDate(contact.archived_at)}.</>}
        </Notice></div>
      ) : null}

      {duplicates.length > 0 ? (
        <div className="mb-6">
          <Notice tone="warn" title="Possible duplicate contacts">
            <ul className="mt-1 space-y-1">
              {duplicates.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-2">
                  <Link className="link" href={`/contacts/${d.id}`}>{d.full_name}</Link>
                  <span className="text-xs text-muted">{d.email ?? "no email"} — {d.reason.replace(/_/g, " ")}</span>
                  <ConfirmAction action={mergeContacts} hidden={{ keep_id: id, merge_id: d.id }} label="Merge into this contact" variant="secondary" size="sm"
                    title={`Merge “${d.full_name}” into “${contact.full_name}”?`}
                    description="Activities and opportunity/requirement links move here. Empty fields are filled from the duplicate; its notes and email are kept in this contact's notes. The duplicate is archived, not deleted."
                    confirmLabel="Merge" />
                </li>
              ))}
            </ul>
          </Notice>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card title="Communication history" id="activity"
            actions={!archived ? <Disclosure summary={<><IconPlus /> Log activity</>}><ActivityForm links={{ contact_id: id, company_id: contact.company_id }} team={teamOpts} defaultOwner={member.id} back={back} /></Disclosure> : null}>
            <ActivityTimeline activities={activities} team={team} links={links} back={back} currentUserId={member.id} />
          </Card>
          <Card title="Opportunities & requirements">
            {(opps ?? []).length === 0 && (reqs ?? []).length === 0 ? (
              <p className="text-sm text-muted">Not linked to any opportunity or requirement yet. Link contacts from the opportunity or requirement form.</p>
            ) : (
              <ul className="divide-y divide-line">
                {((opps ?? []) as Opportunity[]).map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 py-2.5">
                    <Link className="font-medium hover:underline" href={`/pipeline/${o.id}`}>{o.title}</Link><StageBadge stage={o.stage} />
                  </li>
                ))}
                {((reqs ?? []) as Requirement[]).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2.5">
                    <Link className="font-medium hover:underline" href={`/requirements/${r.id}`}>{r.role_title}</Link><RequirementBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <aside className="space-y-6">
          <Card title="Details">
            <DescriptionList items={[
              { label: "Work email", value: contact.email ? <a className="link" href={`mailto:${contact.email}`}>{contact.email}</a> : "—" },
              { label: "Phone", value: contact.phone ?? "—" },
              { label: "Owner", value: <Owner member={team.get(contact.owner_id ?? "")} /> },
              { label: "Source", value: <SourceText source={contact.source} /> },
              { label: "Location", value: contact.location ?? "—" },
              { label: "LinkedIn", value: contact.linkedin_url ? <a className="link" href={contact.linkedin_url} target="_blank" rel="noopener noreferrer nofollow">Profile</a> : "—" },
              { label: "Added", value: formatDate(contact.created_at) },
              { label: "Last activity", value: formatRelative(contact.last_activity_at) },
            ]} />
          </Card>
          {!archived ? (
            <CommunicationPanel member={member} links={{ contact_id: id, company_id: contact.company_id }} defaultTo={contact.email ?? ""} back={back}
              recipients={contact.email ? [{ value: contact.email, label: contact.full_name }] : []} />
          ) : null}
          <Card title="Notes"><NotesText text={contact.notes} /></Card>
          <Card title="History"><HistoryList entries={history} team={team} /></Card>
        </aside>
      </div>
    </>
  );
}
