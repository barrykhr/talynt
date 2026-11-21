import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeam, getTeamMap, displayName } from "@/lib/data/team";
import { isUuid, likePattern, pageParam, pageRange, param, withParams, type SearchParams } from "@/lib/data/query";
import { Card, EmptyState, LinkButton, PageHeader, Pagination, Table, Tabs, Td, Th } from "@/components/ui";
import { Owner, SourceText } from "@/components/crm";
import { FilterBar } from "@/components/filter-bar";
import { IconDownload, IconPlus, IconUpload, IconUser } from "@/components/icons";
import { LEAD_SOURCES, PAGE_SIZE } from "@/lib/constants";
import { formatRelative } from "@/lib/time";
import type { Contact } from "@/lib/types";

export const metadata: Metadata = { title: "Contacts" };

const VIEWS = { all: "All contacts", mine: "My contacts", unassigned: "Unassigned", no_company: "No company", archived: "Archived" } as const;
type View = keyof typeof VIEWS;

export default async function ContactsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const member = await requireMemberPage();
  const sp = await searchParams;
  const supabase = await createClient();
  const view = (param(sp, "view") in VIEWS ? param(sp, "view") : "all") as View;
  const q = param(sp, "q");
  const owner = param(sp, "owner");
  const source = param(sp, "source");
  const location = param(sp, "location");
  const page = pageParam(sp);
  const [from, to] = pageRange(page);

  let query = supabase.from("contacts").select("*", { count: "exact" });
  query = view === "archived" ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (view === "mine") query = query.eq("owner_id", member.id);
  if (view === "unassigned") query = query.is("owner_id", null);
  if (view === "no_company") query = query.is("company_id", null);
  if (q) query = query.ilike("search_text", likePattern(q));
  if (owner === "unassigned") query = query.is("owner_id", null);
  else if (isUuid(owner)) query = query.eq("owner_id", owner);
  if (source && (LEAD_SOURCES.values as string[]).includes(source)) query = query.eq("source", source);
  if (location) query = query.ilike("location", likePattern(location));
  query = query.order("updated_at", { ascending: false }).range(from, to);

  const [{ data, count, error }, teamList, team, { count: total }] = await Promise.all([
    query, getTeam(), getTeamMap(), supabase.from("contacts").select("id", { count: "exact", head: true }),
  ]);
  const rows = (data ?? []) as Contact[];
  const companyIds = [...new Set(rows.map((r) => r.company_id).filter(Boolean) as string[])];
  const { data: companies } = companyIds.length ? await supabase.from("companies").select("id, name").in("id", companyIds) : { data: [] };
  const companyName = new Map((companies ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
  const filtered = Boolean(q || owner || source || location || view !== "all");

  return (
    <>
      <PageHeader
        title="Contacts"
        description="People at client and prospect companies. A contact can be linked to several opportunities and requirements."
        actions={
          <>
            <LinkButton href="/api/export/contacts"><IconDownload /> Export CSV</LinkButton>
            <LinkButton href="/import"><IconUpload /> Import</LinkButton>
            <LinkButton variant="primary" href="/contacts/new"><IconPlus /> Add contact</LinkButton>
          </>
        }
      />
      {(total ?? 0) === 0 ? (
        <div className="card">
          <EmptyState icon={<IconUser />} title="No contacts yet"
            description="Add the people you're talking to, or import them from a spreadsheet. Duplicate emails are flagged before anything is saved."
            actions={<><LinkButton variant="primary" href="/contacts/new"><IconPlus /> Add a contact</LinkButton><LinkButton href="/import"><IconUpload /> Import leads</LinkButton></>} />
        </div>
      ) : (
        <>
          <Tabs label="Saved views" current={view} tabs={(Object.keys(VIEWS) as View[]).map((v) => ({ key: v, label: VIEWS[v], href: v === "all" ? "/contacts" : `/contacts?view=${v}` }))} />
          <FilterBar
            action="/contacts"
            keep={{ view: view === "all" ? "" : view }}
            fields={[
              { name: "q", label: "Search", type: "search", value: q, placeholder: "Name, email, role, notes…" },
              { name: "owner", label: "Owner", type: "select", value: owner, options: [{ value: "unassigned", label: "Unassigned" }, ...teamList.map((m) => ({ value: m.id, label: displayName(m) }))] },
              { name: "source", label: "Source", type: "select", value: source, options: LEAD_SOURCES.values.map((v) => ({ value: v, label: LEAD_SOURCES.label[v] })) },
              { name: "location", label: "Location", type: "text", value: location, placeholder: "City" },
            ]}
            summary={<>View: <strong className="font-medium text-ink-soft">{VIEWS[view]}</strong> · {count ?? 0} result{count === 1 ? "" : "s"}</>}
          />
          <Card bodyClassName="p-0">
            {error ? <p className="p-4 text-sm text-danger" role="alert">Couldn&apos;t load contacts. Please refresh.</p>
              : rows.length === 0 ? (
                <EmptyState compact icon={<IconUser />} title={filtered ? "No contacts match these filters" : "No contacts here"} />
              ) : (
                <>
                  <Table caption="Contacts">
                    <thead><tr><Th>Name</Th><Th>Company</Th><Th className="hidden md:table-cell">Email / phone</Th><Th>Owner</Th><Th className="hidden lg:table-cell">Source</Th><Th className="hidden md:table-cell">Last activity</Th></tr></thead>
                    <tbody>
                      {rows.map((c) => (
                        <tr key={c.id} className="hover:bg-sunken/40">
                          <Td>
                            <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">{c.full_name}</Link>
                            <div className="text-xs text-muted">{c.role_title ?? "—"}</div>
                          </Td>
                          <Td>{c.company_id ? <Link className="hover:underline" href={`/companies/${c.company_id}`}>{companyName.get(c.company_id) ?? "—"}</Link> : <span className="text-faint">—</span>}</Td>
                          <Td className="hidden md:table-cell"><div className="truncate">{c.email ?? "—"}</div><div className="text-xs text-muted">{c.phone ?? ""}</div></Td>
                          <Td><Owner member={team.get(c.owner_id ?? "")} /></Td>
                          <Td className="hidden lg:table-cell"><SourceText source={c.source} /></Td>
                          <Td className="hidden text-muted md:table-cell">{formatRelative(c.last_activity_at)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} hrefFor={(p) => withParams("/contacts", sp, { page: String(p) })} />
                </>
              )}
          </Card>
        </>
      )}
    </>
  );
}
