import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeam, getTeamMap, displayName } from "@/lib/data/team";
import { isUuid, likePattern, pageParam, pageRange, param, withParams, type SearchParams } from "@/lib/data/query";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Pagination, Table, Tabs, Td, Th, cx } from "@/components/ui";
import { FollowUp, MsaBadge, Owner, SourceText, StageBadge } from "@/components/crm";
import { FilterBar } from "@/components/filter-bar";
import { StageMover } from "@/components/stage-mover";
import { IconDownload, IconPipeline, IconPlus } from "@/components/icons";
import { LEAD_SOURCES, MSA_STATUSES, OPPORTUNITY_STAGES, PAGE_SIZE, type MsaStatus } from "@/lib/constants";
import { addDays, daysUntil, formatDate, formatRelative, todayInZone } from "@/lib/time";
import { formatMoney } from "@/lib/money";
import { initials } from "@/lib/data/team";
import { PipelineBoard, type BoardCard } from "@/components/pipeline-board";
import { InlineAction } from "@/components/forms";
import { setWebSubmissionStatus } from "@/lib/actions/leads";
import type { Opportunity, WebSubmission } from "@/lib/types";

export const metadata: Metadata = { title: "Pipeline" };

const SAVED = {
  open: "All open",
  mine: "My pipeline",
  follow_ups: "Follow-ups due",
  no_next_action: "No next action",
  inbox: "Lead inbox",
  unassigned: "Unassigned",
  msa_pending: "MSA pending",
  won: "Won",
  lost: "Lost",
  archived: "Archived",
} as const;
type Saved = keyof typeof SAVED;

type Row = Opportunity & { companies: { name: string; msa_status: MsaStatus } | null };

export default async function PipelinePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const member = await requireMemberPage();
  const sp = await searchParams;
  const supabase = await createClient();
  const board = param(sp, "view") === "board";
  const saved = (param(sp, "saved") in SAVED ? param(sp, "saved") : "open") as Saved;
  const q = param(sp, "q");
  const owner = param(sp, "owner");
  const source = param(sp, "source");
  const stage = param(sp, "stage");
  const follow = param(sp, "follow");
  const msa = param(sp, "msa");
  const location = param(sp, "location");
  const page = pageParam(sp);
  const today = todayInZone();

  const needsCompanyFilter = saved === "msa_pending" || Boolean(msa);
  let query = supabase
    .from("opportunities")
    .select(needsCompanyFilter ? "*, companies!inner(name, msa_status)" : "*, companies(name, msa_status)", { count: "exact" });
  query = saved === "archived" ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (saved === "no_next_action") query = query.is("next_follow_up_on", null);
  if (saved === "open" || saved === "mine" || saved === "follow_ups" || saved === "unassigned" || saved === "msa_pending" || saved === "no_next_action" || saved === "inbox") {
    if (!stage) query = query.not("stage", "in", "(won,lost)");
  }
  if (saved === "mine") query = query.eq("owner_id", member.id);
  if (saved === "unassigned") query = query.is("owner_id", null);
  if (saved === "follow_ups") query = query.lte("next_follow_up_on", today);
  if (saved === "msa_pending") query = query.eq("companies.msa_status", "in_discussion");
  if (saved === "won") query = query.eq("stage", "won");
  if (saved === "lost") query = query.eq("stage", "lost");
  if (q) query = query.ilike("search_text", likePattern(q));
  if (owner === "unassigned") query = query.is("owner_id", null);
  else if (isUuid(owner)) query = query.eq("owner_id", owner);
  if (source && (LEAD_SOURCES.values as string[]).includes(source)) query = query.eq("source", source);
  if (stage && (OPPORTUNITY_STAGES.values as string[]).includes(stage)) query = query.eq("stage", stage);
  if (msa && (MSA_STATUSES.values as string[]).includes(msa)) query = query.eq("companies.msa_status", msa);
  if (location) query = query.ilike("location", likePattern(location));
  if (follow === "overdue") query = query.lt("next_follow_up_on", today);
  if (follow === "week") query = query.gte("next_follow_up_on", today).lte("next_follow_up_on", addDays(today, 7));
  if (follow === "none") query = query.is("next_follow_up_on", null);

  if (board) query = query.order("next_follow_up_on", { ascending: true, nullsFirst: false }).limit(500);
  else {
    const [from, to] = pageRange(page);
    query = query.order("next_follow_up_on", { ascending: true, nullsFirst: false }).order("updated_at", { ascending: false }).range(from, to);
  }

  const [{ data, count, error }, teamList, team, { count: total }, { data: inboxData }, { data: pipeData }] = await Promise.all([
    query, getTeam(), getTeamMap(), supabase.from("opportunities").select("id", { count: "exact", head: true }),
    supabase.from("web_submissions").select("*").eq("status", "new").order("received_at", { ascending: false }).limit(50),
    supabase.from("opportunity_pipeline").select("opportunity_id, probability").limit(1000),
  ]);
  const inbox = (inboxData ?? []) as WebSubmission[];
  const probability = new Map(((pipeData ?? []) as { opportunity_id: string; probability: number }[]).map((p) => [p.opportunity_id, p.probability]));
  let rows = (data ?? []) as unknown as Row[];
  if (saved === "no_next_action" && rows.length) {
    // Exclude deals with an open task — that counts as a next action.
    const { data: withTask } = await supabase.from("activities").select("opportunity_id").eq("type", "task").is("completed_at", null)
      .is("archived_at", null).in("opportunity_id", rows.map((r) => r.id));
    const has = new Set((withTask ?? []).map((t: { opportunity_id: string }) => t.opportunity_id));
    rows = rows.filter((r) => !has.has(r.id));
  }
  const ageDays = (iso: string) => Math.max(0, -daysUntil(iso.slice(0, 10), today));
  const boardCards: BoardCard[] = rows.map((o) => {
    const d = o.next_follow_up_on ? daysUntil(o.next_follow_up_on, today) : null;
    const m = team.get(o.owner_id ?? "");
    return {
      id: o.id, title: o.title, company: o.companies?.name ?? "", stage: o.stage, ownerInitials: initials(m), ownerName: displayName(m),
      value: o.estimated_value !== null ? formatMoney(o.estimated_value, o.currency, { compact: true }) : null,
      followUp: o.next_follow_up_on ? (d! < 0 ? `Overdue ${-d!}d` : d === 0 ? "Due today" : formatDate(o.next_follow_up_on, { withYear: false })) : null,
      followUpTone: d === null ? "none" : d < 0 ? "danger" : d <= 1 ? "warn" : "neutral",
      stageAgeDays: ageDays(o.stage_changed_at), priority: o.priority,
      noNextAction: !o.next_follow_up_on && o.stage !== "won" && o.stage !== "lost",
    };
  });
  const filtered = Boolean(q || owner || source || stage || follow || msa || location || saved !== "open");
  const keep = { view: board ? "board" : "", saved: saved === "open" ? "" : saved };
  const viewHref = (b: boolean) => withParams("/pipeline", sp, { view: b ? "board" : null, page: null });

  return (
    <>
      <PageHeader
        title="Sales pipeline"
        description="The commercial journey from first lead to Won. MSA status is tracked on the company and shown here."
        actions={
          <>
            <div className="inline-flex rounded-md border border-line-strong bg-surface p-0.5" role="group" aria-label="Layout">
              <Link href={viewHref(false)} aria-current={!board ? "page" : undefined} className={cx("rounded px-2.5 py-1 text-[13px]", !board ? "bg-sunken font-medium" : "text-muted")}>List</Link>
              <Link href={viewHref(true)} aria-current={board ? "page" : undefined} className={cx("rounded px-2.5 py-1 text-[13px]", board ? "bg-sunken font-medium" : "text-muted")}>Board</Link>
            </div>
            <LinkButton href="/api/export/opportunities"><IconDownload /> Export</LinkButton>
            <LinkButton href="/pipeline/new">New opportunity</LinkButton>
            <LinkButton variant="primary" href="/leads/new"><IconPlus /> Add a lead</LinkButton>
          </>
        }
      />

      {saved === "inbox" ? null : (total ?? 0) === 0 && inbox.length === 0 ? (
        <div className="card">
          <EmptyState icon={<IconPipeline />} title="Your pipeline is empty"
            description="Create an opportunity for a company you're pursuing. Move it through Researching, Contacted, Qualified and Proposal / MSA to Won."
            actions={<><LinkButton variant="primary" href="/leads/new"><IconPlus /> Add a lead</LinkButton><LinkButton href="/import">Import a spreadsheet</LinkButton></>} />
        </div>
      ) : (
        <>
          <Tabs label="Saved views" current={saved} tabs={(Object.keys(SAVED) as Saved[]).map((s) => ({ key: s, label: SAVED[s], href: withParams("/pipeline", {}, { saved: s === "open" ? null : s, view: board ? "board" : null }), count: s === "inbox" ? inbox.length : undefined }))} />
          <FilterBar
            action="/pipeline"
            keep={keep}
            fields={[
              { name: "q", label: "Search", type: "search", value: q, placeholder: "Opportunity, role, notes…" },
              { name: "owner", label: "Owner", type: "select", value: owner, options: [{ value: "unassigned", label: "Unassigned" }, ...teamList.map((m) => ({ value: m.id, label: displayName(m) }))] },
              { name: "stage", label: "Stage", type: "select", value: stage, options: OPPORTUNITY_STAGES.values.map((v) => ({ value: v, label: OPPORTUNITY_STAGES.label[v] })) },
              { name: "follow", label: "Next follow-up", type: "select", value: follow, options: [{ value: "overdue", label: "Overdue" }, { value: "week", label: "Next 7 days" }, { value: "none", label: "Not set" }] },
              { name: "source", label: "Source", type: "select", value: source, options: LEAD_SOURCES.values.map((v) => ({ value: v, label: LEAD_SOURCES.label[v] })) },
              { name: "msa", label: "MSA", type: "select", value: msa, options: MSA_STATUSES.values.map((v) => ({ value: v, label: MSA_STATUSES.label[v] })) },
              { name: "location", label: "Location", type: "text", value: location, placeholder: "City" },
            ]}
            summary={<>View: <strong className="font-medium text-ink-soft">{SAVED[saved]}</strong> · {count ?? 0} opportunit{count === 1 ? "y" : "ies"}{board && (count ?? 0) > 500 ? " (board shows the first 500)" : ""}</>}
          />

          {error ? <p className="text-sm text-danger" role="alert">Couldn&apos;t load the pipeline. Please refresh.</p>
            : rows.length === 0 ? (
              <div className="card"><EmptyState compact icon={<IconPipeline />} title={filtered ? "Nothing matches these filters" : "No opportunities here"} /></div>
            ) : board ? (
              <PipelineBoard cards={boardCards} />
            ) : (
              <Card bodyClassName="p-0">
                <Table caption="Opportunities">
                  <thead><tr><Th>Opportunity</Th><Th>Stage</Th><Th>Owner</Th><Th>Next action</Th><Th className="hidden lg:table-cell text-right">Value</Th><Th className="hidden md:table-cell">Last activity</Th><Th className="hidden xl:table-cell">Move</Th></tr></thead>
                  <tbody>
                    {rows.map((o) => (
                      <tr key={o.id} className="hover:bg-sunken/40">
                        <Td>
                          <Link href={`/pipeline/${o.id}`} className="font-medium hover:underline">{o.title}</Link>
                          <div className="text-xs text-muted">
                            <Link href={`/companies/${o.company_id}`} className="hover:underline">{o.companies?.name}</Link>
                            {o.hiring_need ? ` · ${o.hiring_need}` : ""}
                          </div>
                        </Td>
                        <Td>
                          <div className="flex flex-col items-start gap-1">
                            <StageBadge stage={o.stage} />
                            {o.companies ? <MsaBadge status={o.companies.msa_status} /> : null}
                            {o.stage === "lost" && o.loss_reason ? <span className="max-w-[200px] truncate text-xs text-muted" title={o.loss_reason}>{o.loss_reason}</span> : null}
                          </div>
                        </Td>
                        <Td><Owner member={team.get(o.owner_id ?? "")} /></Td>
                        <Td>
                          {!o.next_follow_up_on && o.stage !== "won" && o.stage !== "lost" ? <Badge tone="warn">No next action</Badge> : <FollowUp date={o.next_follow_up_on} closed={o.stage === "won" || o.stage === "lost"} />}
                          {o.next_action ? <div className="max-w-[200px] truncate text-xs text-muted">{o.next_action}</div> : null}
                          <div className="text-[11px] text-faint">{ageDays(o.stage_changed_at)}d in stage</div>
                        </Td>
                        <Td className="hidden text-right lg:table-cell tabular-nums">{o.estimated_value !== null ? <>{formatMoney(o.estimated_value, o.currency)}<div className="text-[11px] text-faint">{probability.get(o.id) ?? 0}%</div></> : <span className="text-faint">—</span>}<div className="text-[11px] text-faint"><SourceText source={o.source} /></div></Td>
                        <Td className="hidden text-muted md:table-cell">{formatRelative(o.last_activity_at)}</Td>
                        <Td className="hidden xl:table-cell">{saved !== "archived" ? <StageMover id={o.id} stage={o.stage} compact /> : null}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} hrefFor={(p) => withParams("/pipeline", sp, { page: String(p) })} />
              </Card>
            )}
        </>
      )}
      {saved === "inbox" ? (
        <Card title={`Website enquiries · ${inbox.length}`}>
          {inbox.length === 0 ? <EmptyState compact icon={<IconPipeline />} title="Inbox is empty" description="Enquiries from the website form land here for a person to review. See docs/LEAD_CAPTURE.md to connect the form." /> : (
            <ul className="divide-y divide-line">
              {inbox.map((w) => (
                <li key={w.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="font-medium">{w.company_name ?? "(no company given)"} · {w.full_name}</div>
                    <div className="text-xs text-muted">{w.email}{w.phone ? ` · ${w.phone}` : ""} · received {formatRelative(w.received_at)}</div>
                    {w.role_needed ? <div className="mt-1 text-sm">Hiring: {w.role_needed}{w.hiring_volume ? ` × ${w.hiring_volume}` : ""}{w.location ? ` · ${w.location}` : ""}</div> : null}
                    {w.message ? <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{w.message.slice(0, 400)}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <LinkButton size="sm" variant="primary" href={`/leads/new?submission=${w.id}`}>Convert to lead</LinkButton>
                    <InlineAction action={setWebSubmissionStatus} hidden={{ id: w.id, status: "dismissed" }}>Dismiss</InlineAction>
                    <InlineAction action={setWebSubmissionStatus} hidden={{ id: w.id, status: "spam" }}>Spam</InlineAction>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </>
  );
}
