import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeam, getTeamMap, displayName } from "@/lib/data/team";
import { isUuid, likePattern, pageParam, pageRange, param, withParams, type SearchParams } from "@/lib/data/query";
import { Card, EmptyState, LinkButton, PageHeader, Pagination, Table, Tabs, Td, Th } from "@/components/ui";
import { ClientBadge, MsaBadge, Owner, SourceText } from "@/components/crm";
import { FilterBar } from "@/components/filter-bar";
import { IconBuilding, IconDownload, IconPlus, IconUpload } from "@/components/icons";
import { LEAD_SOURCES, MSA_STATUSES, PAGE_SIZE } from "@/lib/constants";
import { formatRelative } from "@/lib/time";
import type { CompanyOverview } from "@/lib/types";

export const metadata: Metadata = { title: "Companies" };

const VIEWS = {
  all: "All companies",
  mine: "My companies",
  active: "Active clients",
  msa_pending: "MSA pending",
  unassigned: "Unassigned",
  archived: "Archived",
} as const;
type View = keyof typeof VIEWS;

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const member = await requireMemberPage();
  const sp = await searchParams;
  const supabase = await createClient();
  const view = (param(sp, "view") in VIEWS ? param(sp, "view") : "all") as View;
  const q = param(sp, "q");
  const owner = param(sp, "owner");
  const source = param(sp, "source");
  const msa = param(sp, "msa");
  const location = param(sp, "location");
  const page = pageParam(sp);
  const [from, to] = pageRange(page);

  let query = supabase.from("company_overview").select("*", { count: "exact" });
  query = view === "archived" ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (view === "mine") query = query.eq("owner_id", member.id);
  if (view === "active") query = query.eq("is_active_client", true);
  if (view === "msa_pending") query = query.eq("msa_status", "in_discussion");
  if (view === "unassigned") query = query.is("owner_id", null);
  if (q) query = query.ilike("search_text", likePattern(q));
  if (owner === "unassigned") query = query.is("owner_id", null);
  else if (isUuid(owner)) query = query.eq("owner_id", owner);
  if (source && (LEAD_SOURCES.values as string[]).includes(source)) query = query.eq("source", source);
  if (msa && (MSA_STATUSES.values as string[]).includes(msa)) query = query.eq("msa_status", msa);
  if (location) query = query.ilike("location", likePattern(location));
  query = query.order(view === "archived" ? "archived_at" : "updated_at", { ascending: false }).range(from, to);

  const [{ data, count, error }, teamList, team, { count: totalCompanies }] = await Promise.all([
    query, getTeam(), getTeamMap(),
    supabase.from("companies").select("id", { count: "exact", head: true }),
  ]);
  const rows = (data ?? []) as CompanyOverview[];
  const workspaceEmpty = (totalCompanies ?? 0) === 0;
  const filtered = Boolean(q || owner || source || msa || location || view !== "all");

  return (
    <>
      <PageHeader
        title="Companies"
        description="Accounts you're selling to or delivering for. Active client = MSA signed and at least one live requirement."
        actions={
          <>
            <LinkButton href="/api/export/companies"><IconDownload /> Export CSV</LinkButton>
            <LinkButton href="/import"><IconUpload /> Import</LinkButton>
            <LinkButton variant="primary" href="/companies/new"><IconPlus /> Add company</LinkButton>
          </>
        }
      />

      {workspaceEmpty ? (
        <div className="card">
          <EmptyState
            icon={<IconBuilding />}
            title="Add your first company"
            description="Companies hold contacts, opportunities, requirements and the activity timeline. Add one by hand, or import a spreadsheet of leads."
            actions={
              <>
                <LinkButton variant="primary" href="/companies/new"><IconPlus /> Add your first company</LinkButton>
                <LinkButton href="/import"><IconUpload /> Import leads</LinkButton>
              </>
            }
          />
        </div>
      ) : (
        <>
          <Tabs
            label="Saved views"
            current={view}
            tabs={(Object.keys(VIEWS) as View[]).map((v) => ({ key: v, label: VIEWS[v], href: v === "all" ? "/companies" : `/companies?view=${v}` }))}
          />
          <FilterBar
            action="/companies"
            keep={{ view: view === "all" ? "" : view }}
            fields={[
              { name: "q", label: "Search", type: "search", value: q, placeholder: "Name, domain, notes…" },
              { name: "owner", label: "Owner", type: "select", value: owner, options: [{ value: "unassigned", label: "Unassigned" }, ...teamList.map((m) => ({ value: m.id, label: displayName(m) }))] },
              { name: "source", label: "Source", type: "select", value: source, options: LEAD_SOURCES.values.map((v) => ({ value: v, label: LEAD_SOURCES.label[v] })) },
              { name: "msa", label: "MSA", type: "select", value: msa, options: MSA_STATUSES.values.map((v) => ({ value: v, label: MSA_STATUSES.label[v] })) },
              { name: "location", label: "Location", type: "text", value: location, placeholder: "City" },
            ]}
            summary={<>View: <strong className="font-medium text-ink-soft">{VIEWS[view]}</strong> · {count ?? 0} result{count === 1 ? "" : "s"}</>}
          />
          <Card bodyClassName="p-0">
            {error ? (
              <p className="p-4 text-sm text-danger" role="alert">Couldn&apos;t load companies. Please refresh.</p>
            ) : rows.length === 0 ? (
              <EmptyState compact icon={<IconBuilding />} title={filtered ? "No companies match these filters" : "No companies here"} description={filtered ? "Try clearing a filter or searching for something else." : undefined} />
            ) : (
              <>
                <Table caption="Companies">
                  <thead>
                    <tr><Th>Company</Th><Th>Status</Th><Th>Owner</Th><Th className="hidden md:table-cell">Source</Th><Th className="hidden lg:table-cell">Open deals</Th><Th className="hidden lg:table-cell">Live reqs</Th><Th className="hidden md:table-cell">Last activity</Th></tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr key={c.id} className="hover:bg-sunken/40">
                        <Td>
                          <Link href={`/companies/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                          <div className="text-xs text-muted">{[c.location, c.domain].filter(Boolean).join(" · ") || "—"}</div>
                        </Td>
                        <Td>
                          <div className="flex flex-col items-start gap-1">
                            <ClientBadge status={c.client_status} />
                            <MsaBadge status={c.msa_status} />
                          </div>
                        </Td>
                        <Td><Owner member={team.get(c.owner_id ?? "")} /></Td>
                        <Td className="hidden md:table-cell"><SourceText source={c.source} /></Td>
                        <Td className="hidden tabular-nums lg:table-cell">{c.open_opportunities}</Td>
                        <Td className="hidden tabular-nums lg:table-cell">{c.live_requirements}</Td>
                        <Td className="hidden text-muted md:table-cell">{formatRelative(c.last_activity_at)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} hrefFor={(p) => withParams("/companies", sp, { page: String(p) })} />
              </>
            )}
          </Card>
        </>
      )}
    </>
  );
}
