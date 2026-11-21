import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { param, type SearchParams } from "@/lib/data/query";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { IconSearch } from "@/components/icons";
import { formatRelative } from "@/lib/time";

export const metadata: Metadata = { title: "Search" };

const TYPES: Record<string, { label: string; href: (id: string) => string }> = {
  company: { label: "Companies", href: (id) => `/companies/${id}` },
  contact: { label: "Contacts", href: (id) => `/contacts/${id}` },
  opportunity: { label: "Opportunities", href: (id) => `/pipeline/${id}` },
  requirement: { label: "Requirements", href: (id) => `/requirements/${id}` },
  activity: { label: "Activities & notes", href: () => "" },
};

interface Hit { entity_type: string; id: string; title: string; subtitle: string | null; company_id: string | null; updated_at: string }

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireMemberPage();
  const sp = await searchParams;
  const q = param(sp, "q").trim();
  let hits: Hit[] = [];
  let failed = false;
  if (q.length >= 2) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("search_crm", { p_query: q, p_limit: 10 });
    hits = (data ?? []) as Hit[];
    failed = Boolean(error);
  }
  const groups = Object.keys(TYPES).map((t) => ({ type: t, items: hits.filter((h) => h.entity_type === t) })).filter((g) => g.items.length);

  return (
    <>
      <PageHeader title="Search" description="Searches company names, domains, contacts, emails, roles, locations and notes across the CRM." />
      <form action="/search" method="get" role="search" className="mb-6 flex max-w-xl gap-2">
        <label htmlFor="search-page-q" className="sr-only">Search</label>
        <input id="search-page-q" name="q" type="search" defaultValue={q} className="input" placeholder="e.g. data engineer, Pune, acme.com" autoFocus />
        <button type="submit" className="rounded-md bg-accent px-4 text-sm font-medium text-white">Search</button>
      </form>
      {q.length < 2 ? (
        <div className="card"><EmptyState compact icon={<IconSearch />} title="Type at least two characters" /></div>
      ) : failed ? (
        <p role="alert" className="text-sm text-danger">Search is unavailable right now. Please try again.</p>
      ) : groups.length === 0 ? (
        <div className="card"><EmptyState compact icon={<IconSearch />} title={`No results for “${q}”`} description="Try a shorter word, a company domain or a city." /></div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.type} title={<>{TYPES[g.type].label} <Badge>{g.items.length}{g.items.length === 10 ? "+" : ""}</Badge></>}>
              <ul className="divide-y divide-line">
                {g.items.map((h) => {
                  const href = g.type === "activity" ? (h.company_id ? `/companies/${h.company_id}#activity` : "/activities?view=team") : TYPES[g.type].href(h.id);
                  return (
                    <li key={h.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <Link href={href} className="font-medium hover:underline">{h.title}</Link>
                        {h.subtitle ? <div className="truncate text-xs text-muted">{h.subtitle}</div> : null}
                      </div>
                      <span className="shrink-0 text-xs text-faint">{formatRelative(h.updated_at)}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
