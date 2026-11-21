import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeam, getTeamMap, displayName } from "@/lib/data/team";
import { isUuid, likePattern, pageParam, pageRange, param, withParams, type SearchParams } from "@/lib/data/query";
import { Card, EmptyState, LinkButton, PageHeader, Pagination, Table, Tabs, Td, Th } from "@/components/ui";
import { MsaBadge, Owner, Progress, RequirementBadge } from "@/components/crm";
import { FilterBar } from "@/components/filter-bar";
import { IconBriefcase, IconDownload, IconPlus } from "@/components/icons";
import { PAGE_SIZE, REQUIREMENT_STATUSES, type MsaStatus } from "@/lib/constants";
import { formatDate, formatRelative } from "@/lib/time";
import type { Requirement } from "@/lib/types";

export const metadata: Metadata = { title: "Requirements" };

const VIEWS = { live: "Live requirements", mine: "My requirements", on_hold: "On hold", closed: "Closed / filled", unassigned: "Unassigned", all: "All", archived: "Archived" } as const;
type View = keyof typeof VIEWS;
type Row = Requirement & { companies: { name: string; msa_status: MsaStatus } | null };

export default async function RequirementsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const member = await requireMemberPage();
  const sp = await searchParams;
  const supabase = await createClient();
  const view = (param(sp, "view") in VIEWS ? param(sp, "view") : "live") as View;
  const q = param(sp, "q");
  const owner = param(sp, "owner");
  const status = param(sp, "status");
  const location = param(sp, "location");
  const page = pageParam(sp);
  const [from, to] = pageRange(page);

  let query = supabase.from("requirements").select("*, companies(name, msa_status)", { count: "exact" });
  query = view === "archived" ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (view === "live" || view === "mine" || view === "unassigned") query = query.not("status", "in", "(on_hold,closed_filled)");
  if (view === "mine") query = query.eq("owner_id", member.id);
  if (view === "unassigned") query = query.is("owner_id", null);
  if (view === "on_hold") query = query.eq("status", "on_hold");
  if (view === "closed") query = query.eq("status", "closed_filled");
  if (q) query = query.ilike("search_text", likePattern(q));
  if (owner === "unassigned") query = query.is("owner_id", null);
  else if (isUuid(owner)) query = query.eq("owner_id", owner);
  if (status && (REQUIREMENT_STATUSES.values as string[]).includes(status)) query = query.eq("status", status);
  if (location) query = query.ilike("location", likePattern(location));
  query = query.order("updated_at", { ascending: false }).range(from, to);

  const [{ data, count, error }, teamList, team, { count: total }] = await Promise.all([
    query, getTeam(), getTeamMap(), supabase.from("requirements").select("id", { count: "exact", head: true }),
  ]);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader
        title="Requirements & delivery"
        description="Hiring requirements clients have shared. Delivery status is separate from the sales stage. Live = anything not On hold or Closed / filled."
        actions={<><LinkButton href="/api/export/requirements"><IconDownload /> Export</LinkButton><LinkButton variant="primary" href="/requirements/new"><IconPlus /> New requirement</LinkButton></>}
      />
      {(total ?? 0) === 0 ? (
        <div className="card">
          <EmptyState icon={<IconBriefcase />} title="No requirements yet"
            description="When a client shares a role, add it here with the hiring volume, location and budget. Track it from Sourcing through Interviews and Offer to Placed."
            actions={<LinkButton variant="primary" href="/requirements/new"><IconPlus /> Add your first requirement</LinkButton>} />
        </div>
      ) : (
        <>
          <Tabs label="Saved views" current={view} tabs={(Object.keys(VIEWS) as View[]).map((v) => ({ key: v, label: VIEWS[v], href: v === "live" ? "/requirements" : `/requirements?view=${v}` }))} />
          <FilterBar
            action="/requirements"
            keep={{ view: view === "live" ? "" : view }}
            fields={[
              { name: "q", label: "Search", type: "search", value: q, placeholder: "Role, location, notes…" },
              { name: "owner", label: "Owner", type: "select", value: owner, options: [{ value: "unassigned", label: "Unassigned" }, ...teamList.map((m) => ({ value: m.id, label: displayName(m) }))] },
              { name: "status", label: "Status", type: "select", value: status, options: REQUIREMENT_STATUSES.values.map((v) => ({ value: v, label: REQUIREMENT_STATUSES.label[v] })) },
              { name: "location", label: "Location", type: "text", value: location, placeholder: "City" },
            ]}
            summary={<>View: <strong className="font-medium text-ink-soft">{VIEWS[view]}</strong> · {count ?? 0} result{count === 1 ? "" : "s"}</>}
          />
          <Card bodyClassName="p-0">
            {error ? <p className="p-4 text-sm text-danger" role="alert">Couldn&apos;t load requirements.</p>
              : rows.length === 0 ? <EmptyState compact icon={<IconBriefcase />} title="No requirements match" /> : (
                <>
                  <Table caption="Requirements">
                    <thead><tr><Th>Role</Th><Th>Status</Th><Th>Placements</Th><Th>Owner</Th><Th className="hidden md:table-cell">Expected start</Th><Th className="hidden lg:table-cell">Updated</Th></tr></thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="hover:bg-sunken/40">
                          <Td>
                            <Link href={`/requirements/${r.id}`} className="font-medium hover:underline">{r.role_title}</Link>
                            <div className="text-xs text-muted"><Link className="hover:underline" href={`/companies/${r.company_id}`}>{r.companies?.name}</Link>{r.location ? ` · ${r.location}` : ""}</div>
                          </Td>
                          <Td><div className="flex flex-col items-start gap-1"><RequirementBadge status={r.status} />{r.companies ? <MsaBadge status={r.companies.msa_status} /> : null}</div></Td>
                          <Td><Progress filled={r.positions_filled} volume={r.hiring_volume} /></Td>
                          <Td><Owner member={team.get(r.owner_id ?? "")} /></Td>
                          <Td className="hidden md:table-cell">{formatDate(r.expected_start_on)}</Td>
                          <Td className="hidden text-muted lg:table-cell">{formatRelative(r.updated_at)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} hrefFor={(p) => withParams("/requirements", sp, { page: String(p) })} />
                </>
              )}
          </Card>
        </>
      )}
    </>
  );
}
