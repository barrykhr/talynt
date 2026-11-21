import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeam, getTeamMap, displayName } from "@/lib/data/team";
import { timelineLinks } from "@/lib/data/lookups";
import { isUuid, pageParam, pageRange, param, withParams, type SearchParams } from "@/lib/data/query";
import { Card, EmptyState, LinkButton, Notice, PageHeader, Pagination, Tabs } from "@/components/ui";
import { ActivityTimeline, FollowUp, Owner, StageBadge } from "@/components/crm";
import { FilterBar } from "@/components/filter-bar";
import { IconCheckCircle, IconDownload, IconTask } from "@/components/icons";
import { ACTIVITY_TYPES, PAGE_SIZE } from "@/lib/constants";
import { startOfZonedDay, todayInZone } from "@/lib/time";
import type { Activity, Opportunity } from "@/lib/types";

export const metadata: Metadata = { title: "Activities & tasks" };

const VIEWS = { mine: "My tasks", overdue: "Overdue follow-ups", team: "Team activity", tasks: "All open tasks", done: "Completed tasks" } as const;
type View = keyof typeof VIEWS;

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const member = await requireMemberPage();
  const sp = await searchParams;
  const supabase = await createClient();
  const view = (param(sp, "view") in VIEWS ? param(sp, "view") : "mine") as View;
  const type = param(sp, "type");
  const owner = param(sp, "owner");
  const fromDate = param(sp, "from");
  const toDate = param(sp, "to");
  const page = pageParam(sp);
  const [from, to] = pageRange(page);
  const today = todayInZone();
  const startToday = startOfZonedDay(today);
  const nowIso = new Date().toISOString();
  const [team, teamList] = await Promise.all([getTeamMap(), getTeam()]);

  let activities: Activity[] = [];
  let count = 0;
  let reminders: Activity[] = [];
  let overdueOpps: (Pick<Opportunity, "id" | "title" | "stage" | "owner_id" | "next_follow_up_on" | "company_id"> & { companies: { name: string } | null })[] = [];

  if (view === "mine" || view === "tasks" || view === "done") {
    let q = supabase.from("activities").select("*", { count: "exact" }).eq("type", "task").is("archived_at", null);
    if (view === "mine") q = q.eq("owner_id", member.id);
    if (view === "done") q = q.not("completed_at", "is", null).order("completed_at", { ascending: false });
    else q = q.is("completed_at", null).order("due_at", { ascending: true });
    if (view !== "mine" && isUuid(owner)) q = q.eq("owner_id", owner);
    const res = await q.range(from, to);
    activities = (res.data ?? []) as Activity[];
    count = res.count ?? 0;
    if (view === "mine") {
      const r = await supabase.from("activities").select("*").eq("type", "task").eq("owner_id", member.id).is("completed_at", null)
        .is("archived_at", null).eq("reminder_state", "scheduled").lte("reminder_at", nowIso).order("reminder_at").limit(10);
      reminders = (r.data ?? []) as Activity[];
    }
  } else if (view === "overdue") {
    let tq = supabase.from("activities").select("*", { count: "exact" }).eq("type", "task").is("completed_at", null).is("archived_at", null).lt("due_at", startToday).order("due_at");
    let oq = supabase.from("opportunities").select("id, title, stage, owner_id, next_follow_up_on, company_id, companies(name)").is("archived_at", null)
      .not("stage", "in", "(won,lost)").lt("next_follow_up_on", today).order("next_follow_up_on").limit(100);
    if (isUuid(owner)) { tq = tq.eq("owner_id", owner); oq = oq.eq("owner_id", owner); }
    const [t, o] = await Promise.all([tq.range(from, to), oq]);
    activities = (t.data ?? []) as Activity[];
    count = t.count ?? 0;
    overdueOpps = (o.data ?? []) as unknown as typeof overdueOpps;
  } else {
    let q = supabase.from("activities").select("*", { count: "exact" }).is("archived_at", null).neq("type", "task").order("occurred_at", { ascending: false });
    if (type && (ACTIVITY_TYPES.values as string[]).includes(type)) q = q.eq("type", type);
    if (isUuid(owner)) q = q.eq("owner_id", owner);
    if (/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) q = q.gte("occurred_at", startOfZonedDay(fromDate));
    if (/^\d{4}-\d{2}-\d{2}$/.test(toDate)) q = q.lt("occurred_at", startOfZonedDay(new Date(Date.parse(`${toDate}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)));
    const res = await q.range(from, to);
    activities = (res.data ?? []) as Activity[];
    count = res.count ?? 0;
  }

  const links = await timelineLinks(supabase, [...activities, ...reminders]);
  const back = withParams("/activities", sp, {});
  const ownerOptions = teamList.map((m) => ({ value: m.id, label: displayName(m) }));

  return (
    <>
      <PageHeader
        title="Activities & tasks"
        description="Every call, email, meeting, WhatsApp message, event and note — plus follow-up tasks. History is kept when owners or stages change."
        actions={<LinkButton href="/api/export/activities"><IconDownload /> Export</LinkButton>}
      />
      <Tabs label="Activity views" current={view} tabs={(Object.keys(VIEWS) as View[]).map((v) => ({ key: v, label: VIEWS[v], href: `/activities?view=${v}` }))} />

      {view === "team" ? (
        <FilterBar action="/activities" keep={{ view }}
          fields={[
            { name: "type", label: "Type", type: "select", value: type, options: ACTIVITY_TYPES.values.filter((t) => t !== "task").map((v) => ({ value: v, label: ACTIVITY_TYPES.label[v] })) },
            { name: "owner", label: "Logged by", type: "select", value: owner, options: ownerOptions },
            { name: "from", label: "From", type: "date", value: fromDate },
            { name: "to", label: "To", type: "date", value: toDate },
          ]}
          summary={<>{count} activit{count === 1 ? "y" : "ies"}{fromDate || toDate ? <> between <strong className="font-medium text-ink-soft">{fromDate || "the start"}</strong> and <strong className="font-medium text-ink-soft">{toDate || "today"}</strong></> : " · all dates"}</>}
        />
      ) : view !== "mine" ? (
        <FilterBar action="/activities" keep={{ view }} fields={[{ name: "owner", label: "Owner", type: "select", value: owner, options: ownerOptions }]} />
      ) : null}

      {reminders.length > 0 ? (
        <div className="mb-4">
          <Notice tone="warn" title={`${reminders.length} reminder${reminders.length === 1 ? "" : "s"} due`}>
            <ul className="mt-1 list-disc pl-5">{reminders.map((r) => <li key={r.id}>{r.subject}</li>)}</ul>
          </Notice>
        </div>
      ) : null}

      {view === "overdue" ? (
        <Card title={`Deal follow-ups past due · ${overdueOpps.length}`} className="mb-6">
          {overdueOpps.length === 0 ? <EmptyState compact icon={<IconCheckCircle />} title="No overdue deal follow-ups" /> : (
            <ul className="divide-y divide-line">
              {overdueOpps.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <Link className="font-medium hover:underline" href={`/pipeline/${o.id}`}>{o.title}</Link>
                    <div className="text-xs text-muted">{o.companies?.name}</div>
                  </div>
                  <div className="flex items-center gap-3"><Owner member={team.get(o.owner_id ?? "")} /><StageBadge stage={o.stage} /><FollowUp date={o.next_follow_up_on} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      <Card title={view === "overdue" ? `Overdue tasks · ${count}` : undefined} bodyClassName="px-4 py-1">
        {activities.length === 0 ? (
          <EmptyState compact icon={<IconTask />}
            title={view === "mine" ? "No open tasks" : view === "team" ? "No activity logged yet" : view === "done" ? "No completed tasks yet" : "Nothing overdue"}
            description={view === "mine" ? "Add a task from any company, contact, opportunity or requirement page." : view === "team" ? "Activity you and your teammates log on records will appear here." : undefined} />
        ) : (
          <ActivityTimeline activities={activities} team={team} links={links} back={back} currentUserId={member.id} />
        )}
      </Card>
      <Pagination page={page} total={count} pageSize={PAGE_SIZE} hrefFor={(p) => withParams("/activities", sp, { page: String(p) })} />
    </>
  );
}
