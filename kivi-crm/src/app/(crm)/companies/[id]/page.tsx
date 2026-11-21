import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeamMap } from "@/lib/data/team";
import { companyOptions, teamOptions, timelineLinks } from "@/lib/data/lookups";
import { isUuid } from "@/lib/data/query";
import { Badge, Card, DescriptionList, EmptyState, LinkButton, Notice, NotesText, PageHeader } from "@/components/ui";
import { ActivityTimeline, ClientBadge, FollowUp, HistoryList, MsaBadge, Owner, Progress, RequirementBadge, SourceText, StageBadge } from "@/components/crm";
import { ConfirmAction, Disclosure } from "@/components/forms";
import { ActivityForm, ContactForm } from "@/components/record-forms";
import { CommunicationPanel } from "@/components/communication";
import { IconBriefcase, IconPipeline, IconPlus, IconUser } from "@/components/icons";
import { mergeCompanies, setCompanyArchived } from "@/lib/actions/companies";
import { formatDate, formatRelative } from "@/lib/time";
import type { Activity, CompanyOverview, Contact, HistoryEntry, Opportunity, Requirement } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Company" };
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("name").eq("id", id).maybeSingle();
  return { title: data?.name ?? "Company" };
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const member = await requireMemberPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const supabase = await createClient();

  const { data: companyData } = await supabase.from("company_overview").select("*").eq("id", id).maybeSingle();
  if (!companyData) notFound();
  const company = companyData as CompanyOverview;

  const [contactsRes, oppsRes, reqsRes, actsRes, historyRes, dupsRes, team, teamOpts, allCompanies, mergedInto] = await Promise.all([
    supabase.from("contacts").select("*").eq("company_id", id).is("archived_at", null).order("full_name"),
    supabase.from("opportunities").select("*").eq("company_id", id).is("archived_at", null).order("created_at", { ascending: false }),
    supabase.from("requirements").select("*").eq("company_id", id).is("archived_at", null).order("created_at", { ascending: false }),
    supabase.from("activities").select("*").eq("company_id", id).is("archived_at", null).order("occurred_at", { ascending: false }).limit(50),
    supabase.from("record_history").select("*").eq("entity_type", "company").eq("entity_id", id).order("changed_at", { ascending: false }).limit(30),
    company.archived_at ? Promise.resolve({ data: [] }) : supabase.rpc("find_company_duplicates", { p_name: company.name, p_domain: company.domain, p_exclude: id }),
    getTeamMap(),
    teamOptions(),
    companyOptions(supabase),
    company.merged_into_id ? supabase.from("companies").select("id, name").eq("id", company.merged_into_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const contacts = (contactsRes.data ?? []) as Contact[];
  const opps = (oppsRes.data ?? []) as Opportunity[];
  const reqs = (reqsRes.data ?? []) as Requirement[];
  const activities = (actsRes.data ?? []) as Activity[];
  const history = (historyRes.data ?? []) as HistoryEntry[];
  const duplicates = (dupsRes.data ?? []) as { id: string; name: string; domain: string | null; location: string | null; reason: string }[];
  const links = await timelineLinks(supabase, activities);
  const back = `/companies/${id}`;
  const contactOpts = contacts.map((c) => ({ value: c.id, label: c.full_name }));
  const archived = Boolean(company.archived_at);

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/companies" className="hover:underline">Companies</Link>}
        title={company.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ClientBadge status={company.client_status} />
            <MsaBadge status={company.msa_status} />
            {company.location ? <span>{company.location}</span> : null}
            {company.domain ? <span className="text-faint">· {company.domain}</span> : null}
          </span>
        }
        actions={
          archived ? (
            <ConfirmAction action={setCompanyArchived} hidden={{ id, archive: "false" }} label="Restore" variant="primary"
              title="Restore this company?" description="It will reappear in lists and searches." confirmLabel="Restore" />
          ) : (
            <>
              <LinkButton href={`/companies/${id}/edit`}>Edit</LinkButton>
              <ConfirmAction action={setCompanyArchived} hidden={{ id, archive: "true" }} label="Archive"
                title={`Archive ${company.name}?`}
                description="Archived companies are hidden from lists but nothing is deleted: contacts, deals, requirements and history are kept, and you can restore it any time."
                confirmLabel="Archive company" />
            </>
          )
        }
      />

      {archived ? (
        <div className="mb-6">
          <Notice tone="warn" title={mergedInto.data ? "This company was merged" : "This company is archived"}>
            {mergedInto.data ? (
              <>Its records now live on <Link className="link" href={`/companies/${mergedInto.data.id}`}>{mergedInto.data.name}</Link>.</>
            ) : <>Archived {formatDate(company.archived_at)}. Restore it to edit.</>}
          </Notice>
        </div>
      ) : null}

      {duplicates.length > 0 ? (
        <div className="mb-6">
          <Notice tone="warn" title="Possible duplicate companies">
            <ul className="mt-1 space-y-1">
              {duplicates.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-2">
                  <Link className="link" href={`/companies/${d.id}`}>{d.name}</Link>
                  <span className="text-xs text-muted">{[d.domain, d.location].filter(Boolean).join(" · ")} — {d.reason.replace(/_/g, " ")}</span>
                  <ConfirmAction
                    action={mergeCompanies}
                    hidden={{ keep_id: id, merge_id: d.id }}
                    label="Merge into this company"
                    variant="secondary"
                    size="sm"
                    title={`Merge “${d.name}” into “${company.name}”?`}
                    description={<>Contacts, deals, requirements and activities move to <strong>{company.name}</strong>. Empty fields are filled from the duplicate and its notes are appended. The duplicate is archived (not deleted) and marked as merged.</>}
                    confirmLabel="Merge"
                  />
                </li>
              ))}
            </ul>
          </Notice>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card title={`Contacts · ${contacts.length}`} id="contacts"
            actions={!archived ? <Disclosure summary={<><IconPlus /> Add contact</>}><ContactForm compact team={teamOpts} companies={allCompanies} defaultCompany={id} defaultOwner={company.owner_id ?? member.id} /></Disclosure> : null}>
            {contacts.length === 0 ? (
              <EmptyState compact icon={<IconUser />} title="No contacts yet" description="Add the people you're speaking to — hiring managers, HR, founders." />
            ) : (
              <ul className="divide-y divide-line">
                {contacts.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">{c.full_name}</Link>
                      <div className="truncate text-xs text-muted">{[c.role_title, c.email, c.phone].filter(Boolean).join(" · ") || "—"}</div>
                    </div>
                    <span className="hidden text-xs text-muted sm:block">{formatRelative(c.last_activity_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={`Opportunities · ${opps.length}`} id="opps" actions={!archived ? <LinkButton size="sm" href={`/pipeline/new?company=${id}`}><IconPlus /> New</LinkButton> : null}>
            {opps.length === 0 ? (
              <EmptyState compact icon={<IconPipeline />} title="No opportunities yet" description="Track the commercial conversation from first contact to signed MSA." />
            ) : (
              <ul className="divide-y divide-line">
                {opps.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/pipeline/${o.id}`} className="font-medium hover:underline">{o.title}</Link>
                      <div className="text-xs text-muted">{o.hiring_need ?? "—"}</div>
                    </div>
                    <div className="flex items-center gap-2"><StageBadge stage={o.stage} /><FollowUp date={o.next_follow_up_on} closed={o.stage === "won" || o.stage === "lost"} /></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={`Requirements · ${reqs.length}`} id="reqs" actions={!archived ? <LinkButton size="sm" href={`/requirements/new?company=${id}`}><IconPlus /> New</LinkButton> : null}>
            {reqs.length === 0 ? (
              <EmptyState compact icon={<IconBriefcase />} title="No requirements yet" description="Once the client shares roles, track each requirement and its placements here." />
            ) : (
              <ul className="divide-y divide-line">
                {reqs.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/requirements/${r.id}`} className="font-medium hover:underline">{r.role_title}</Link>
                      <div className="text-xs text-muted">{r.location ?? "—"}</div>
                    </div>
                    <div className="flex items-center gap-3"><Progress filled={r.positions_filled} volume={r.hiring_volume} /><RequirementBadge status={r.status} /></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Activity" id="activity"
            actions={!archived ? <Disclosure summary={<><IconPlus /> Log activity</>}><ActivityForm links={{ company_id: id }} contacts={contactOpts} team={teamOpts} defaultOwner={member.id} back={back} /></Disclosure> : null}>
            <ActivityTimeline activities={activities} team={team} links={links} back={back} currentUserId={member.id} />
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Details">
            <DescriptionList items={[
              { label: "Owner", value: <Owner member={team.get(company.owner_id ?? "")} /> },
              { label: "Source", value: <><SourceText source={company.source} />{company.source_detail ? <span className="text-muted"> · {company.source_detail}</span> : null}</> },
              { label: "Industry", value: company.industry ?? "—" },
              { label: "Website", value: company.website ? <a className="link" href={company.website} target="_blank" rel="noopener noreferrer nofollow">{company.domain ?? company.website}</a> : "—" },
              { label: "MSA signed", value: company.msa_signed_on ? formatDate(company.msa_signed_on) : "—" },
              { label: "Live requirements", value: <Badge tone={company.live_requirements ? "ok" : "neutral"}>{company.live_requirements}</Badge> },
              { label: "Added", value: formatDate(company.created_at) },
              { label: "Last activity", value: formatRelative(company.last_activity_at) },
            ]} />
          </Card>
          {!archived ? <CommunicationPanel member={member} links={{ company_id: id }} defaultTo={contacts.find((c) => c.email)?.email ?? ""} back={back} recipients={contacts.filter((c) => c.email).map((c) => ({ value: c.email!, label: `${c.full_name} <${c.email}>` }))} /> : null}
          <Card title="Notes"><NotesText text={company.notes} /></Card>
          <Card title="History"><HistoryList entries={history} team={team} /></Card>
        </aside>
      </div>
    </>
  );
}
