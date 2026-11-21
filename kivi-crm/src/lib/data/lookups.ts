import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import { displayName, getTeam } from "@/lib/data/team";
import type { Activity, TeamMember } from "@/lib/types";
import type { TimelineLinks } from "@/components/crm";

const OPTION_LIMIT = 2000;

export async function teamOptions() {
  const team = await getTeam();
  return team.filter((m: TeamMember) => m.status === "active").map((m) => ({ value: m.id, label: displayName(m) }));
}

export async function companyOptions(supabase: ServerSupabase) {
  const { data } = await supabase.from("companies").select("id, name").is("archived_at", null).order("name").limit(OPTION_LIMIT);
  return (data ?? []).map((c: { id: string; name: string }) => ({ value: c.id, label: c.name }));
}

export async function contactOptions(supabase: ServerSupabase, companyId?: string) {
  let q = supabase.from("contacts").select("id, full_name, role_title, company_id").is("archived_at", null).order("full_name").limit(OPTION_LIMIT);
  if (companyId) q = q.eq("company_id", companyId);
  const { data } = await q;
  return (data ?? []).map((c: { id: string; full_name: string; role_title: string | null; company_id: string | null }) => ({
    value: c.id, label: c.role_title ? `${c.full_name} — ${c.role_title}` : c.full_name, companyId: c.company_id,
  }));
}

export async function opportunityOptions(supabase: ServerSupabase) {
  const { data } = await supabase.from("opportunities").select("id, title, company_id").is("archived_at", null).order("created_at", { ascending: false }).limit(OPTION_LIMIT);
  return (data ?? []).map((o: { id: string; title: string; company_id: string }) => ({ value: o.id, label: o.title, companyId: o.company_id }));
}

/** Resolves names for the records referenced by a list of activities. */
export async function timelineLinks(supabase: ServerSupabase, activities: Activity[]): Promise<TimelineLinks> {
  const ids = (k: keyof Activity) => [...new Set(activities.map((a) => a[k]).filter(Boolean) as string[])];
  const [companies, contacts, opportunities, requirements] = await Promise.all([
    ids("company_id").length ? supabase.from("companies").select("id, name").in("id", ids("company_id")) : Promise.resolve({ data: [] }),
    ids("contact_id").length ? supabase.from("contacts").select("id, full_name").in("id", ids("contact_id")) : Promise.resolve({ data: [] }),
    ids("opportunity_id").length ? supabase.from("opportunities").select("id, title").in("id", ids("opportunity_id")) : Promise.resolve({ data: [] }),
    ids("requirement_id").length ? supabase.from("requirements").select("id, role_title").in("id", ids("requirement_id")) : Promise.resolve({ data: [] }),
  ]);
  return {
    companies: new Map(((companies.data ?? []) as { id: string; name: string }[]).map((r) => [r.id, r.name])),
    contacts: new Map(((contacts.data ?? []) as { id: string; full_name: string }[]).map((r) => [r.id, r.full_name])),
    opportunities: new Map(((opportunities.data ?? []) as { id: string; title: string }[]).map((r) => [r.id, r.title])),
    requirements: new Map(((requirements.data ?? []) as { id: string; role_title: string }[]).map((r) => [r.id, r.role_title])),
  };
}
