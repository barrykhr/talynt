import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeam, getTeamMap, displayName } from "@/lib/data/team";
import { isUuid, likePattern, pageParam, pageRange, param, withParams, type SearchParams } from "@/lib/data/query";
import { Badge, Card, EmptyState, LinkButton, PageHeader, Pagination, Table, Tabs, Td, Th, buttonClass, cx } from "@/components/ui";
import { FollowUp, MsaBadge, Owner, SourceText, StageBadge } from "@/components/crm";
import { FilterBar } from "@/components/filter-bar";
import { StageMover } from "@/components/stage-mover";
import { IconDownload, IconPipeline, IconPlus } from "@/components/icons";
import { LEAD_SOURCES, MSA_STATUSES, OPPORTUNITY_STAGES, PAGE_SIZE, PIPELINE_FLOW, type MsaStatus, type OpportunityStage } from "@/lib/constants";
import { addDays, formatRelative, todayInZone } from "@/lib/time";
import type { Opportunity } from "@/lib/types";

export const metadata: Metadata = { title: "Pipeline" };

const SAVED = {
  open: "All open",
  mine: "My pipeline",
  follow_ups: "Follow-ups due",
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
  if (saved === "open" || saved === "mine" || saved === "follow_ups" || saved === "unassigned" || saved === "msa_pending") {
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

  const [{ data, count, error }, teamList, team, { count: total }] = await Promise.all([
    query, getTeam(), getTeamMap(), supabase.from("opportunities").select("id", { count: "exact", head: true }),
  ]);
  const rows = (data ?? []) as unknown as Row[];
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
            <LinkButton variant="primary" href="/pipeline/new"><IconPlus /> New opportunity</LinkButton>
          </>
        }
      />

      {(total ?? 0) === 0 ? (
        <div className="card">
          <EmptyState icon={<IconPipeline />} title="Your pipeline is empty"
            description="Create an opportunity for a company you're pursuing. Move it through Researching, Contacted, Qualified and Proposal / MSA to Won."
            actions={<><LinkButton variant="primary" href="/pipeline/new"><IconPlus /> Add your first opportunity</LinkButton><LinkButton href="/import">Import leads</LinkButton></>} />
        </div>
      ) : (
        <>
          <Tabs label="Saved views" current={saved} tabs={(Object.keys(SAVED) as Saved[]).map((s) => ({ key: s, label: SAVED[s], href: withParams("/pipeline", {}, { saved: s === "open" ? null : s, view: board ? "board" : null }) }))} />
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
              <Board rows={rows} team={team} />
            ) : (
              <Card bodyClassName="p-0">
                <Table caption="Opportunities">
                  <thead><tr><Th>Opportunity</Th><Th>Stage</Th><Th>Owner</Th><Th>Next follow-up</Th><Th className="hidden lg:table-cell">Source</Th><Th className="hidden md:table-cell">Last activity</Th><Th className="hidden xl:table-cell">Move</Th></tr></thead>
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
                        <Td><FollowUp date={o.next_follow_up_on} closed={o.stage === "won" || o.stage === "lost"} /></Td>
                        <Td className="hidden lg:table-cell"><SourceText source={o.source} /></Td>
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
    </>
  );
}

function Board({ rows, team }: { rows: Row[]; team: Awaited<ReturnType<typeof getTeamMap>> }) {
  const columns: OpportunityStage[] = [...PIPELINE_FLOW, "nurture", "lost"];
  const byStage = new Map<OpportunityStage, Row[]>(columns.map((c) => [c, []]));
  for (const r of rows) byStage.get(r.stage)?.push(r);
  const visible = columns.filter((c) => (byStage.get(c)?.length ?? 0) > 0 || PIPELINE_FLOW.includes(c));
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
      <div className="flex min-w-max gap-3">
        {visible.map((stage) => {
          const items = byStage.get(stage) ?? [];
          return (
            <section key={stage} aria-label={`${OPPORTUNITY_STAGES.label[stage]} — ${items.length}`} className="flex w-[260px] shrink-0 flex-col rounded-lg border border-line bg-sunken/50">
              <header className="flex items-center justify-between border-b border-line px-3 py-2">
                <h2 className="text-[13px] font-semibold">{OPPORTUNITY_STAGES.label[stage]}</h2>
                <Badge>{items.length}</Badge>
              </header>
              <ul className="flex flex-1 flex-col gap-2 p-2">
                {items.length === 0 ? <li className="px-1 py-4 text-center text-xs text-faint">Empty</li> : null}
                {items.map((o) => (
                  <li key={o.id} className="rounded-md border border-line bg-surface p-2.5 shadow-xs">
                    <Link href={`/pipeline/${o.id}`} className="block text-sm font-medium leading-snug hover:underline">{o.title}</Link>
                    <div className="mt-0.5 truncate text-xs text-muted">{o.companies?.name}</div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Owner member={team.get(o.owner_id ?? "")} />
                      <FollowUp date={o.next_follow_up_on} closed={o.stage === "won" || o.stage === "lost"} />
                    </div>
                    <details className="mt-2">
                      <summary className={buttonClass("ghost", "sm", "w-full cursor-pointer justify-start")}>Move…</summary>
                      <div className="pt-2"><StageMover id={o.id} stage={o.stage} compact /></div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
