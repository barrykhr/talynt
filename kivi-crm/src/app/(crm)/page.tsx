import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeamMap, displayName } from "@/lib/data/team";
import { timelineLinks } from "@/lib/data/lookups";
import { Card, EmptyState, LinkButton, PageHeader, Stat } from "@/components/ui";
import { ActivityTimeline, FollowUp, StageBadge } from "@/components/crm";
import { IconBuilding, IconPlus, IconUpload, IconTask, IconPipeline } from "@/components/icons";
import { OPPORTUNITY_STAGES, PIPELINE_FLOW, type OpportunityStage } from "@/lib/constants";
import { addDays, formatDate, todayInZone } from "@/lib/time";
import type { Activity, Opportunity } from "@/lib/types";

export const metadata: Metadata = { title: "Overview" };

interface Summary {
  open_opportunities: number;
  follow_ups_due: number;
  active_clients: number;
  live_requirements: number;
  companies: number;
  pipeline: Partial<Record<OpportunityStage, number>>;
}

export default async function OverviewPage() {
  const member = await requireMemberPage();
  const supabase = await createClient();
  const today = todayInZone();
  const weekAhead = addDays(today, 7);

  const [{ data: summaryData }, team, tasksRes, followRes, recentRes] = await Promise.all([
    supabase.rpc("dashboard_summary", { p_today: today }),
    getTeamMap(),
    supabase.from("activities").select("*").eq("type", "task").is("completed_at", null).is("archived_at", null)
      .eq("owner_id", member.id).lte("due_at", `${weekAhead}T23:59:59Z`).order("due_at").limit(8),
    supabase.from("opportunities").select("id, title, company_id, stage, owner_id, next_follow_up_on")
      .is("archived_at", null).not("stage", "in", "(won,lost)").not("next_follow_up_on", "is", null)
      .lte("next_follow_up_on", weekAhead).order("next_follow_up_on").limit(8),
    supabase.from("activities").select("*").is("archived_at", null).neq("type", "task").order("occurred_at", { ascending: false }).limit(10),
  ]);

  const s = (summaryData ?? {}) as Summary;
  const isEmpty = (s.companies ?? 0) === 0;
  const tasks = (tasksRes.data ?? []) as Activity[];
  const followUps = (followRes.data ?? []) as Pick<Opportunity, "id" | "title" | "company_id" | "stage" | "owner_id" | "next_follow_up_on">[];
  const recent = (recentRes.data ?? []) as Activity[];
  const links = await timelineLinks(supabase, [...recent, ...tasks]);
  const followCompanies = followUps.length
    ? new Map(((await supabase.from("companies").select("id, name").in("id", [...new Set(followUps.map((f) => f.company_id))])).data ?? []).map((c: { id: string; name: string }) => [c.id, c.name]))
    : new Map<string, string>();

  const firstName = displayName(member).split(" ")[0];

  if (isEmpty) {
    return (
      <>
        <PageHeader title={`Welcome, ${firstName}`} description="Your CRM workspace is ready — and empty. Start by adding a company or importing a lead list." />
        <div className="card">
          <EmptyState
            icon={<IconBuilding />}
            title="No companies yet"
            description="Everything in the CRM hangs off a company: its contacts, sales opportunities, hiring requirements and activity. Add one by hand or bring in a spreadsheet of leads."
            actions={
              <>
                <LinkButton variant="primary" href="/companies/new"><IconPlus /> Add your first company</LinkButton>
                <LinkButton href="/import"><IconUpload /> Import leads</LinkButton>
              </>
            }
          />
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["1. Add companies & contacts", "Capture the account, who you're talking to, their role and how you found them."],
            ["2. Track the sale", "Move opportunities from New lead to Won. MSA status is tracked separately."],
            ["3. Deliver requirements", "Log each hiring requirement and its progress from Sourcing to Placed."],
          ].map(([t, d]) => (
            <div key={t} className="card p-4">
              <div className="text-sm font-medium">{t}</div>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </>
    );
  }

  const pipelineMax = Math.max(1, ...Object.values(s.pipeline ?? {}).map(Number));
  const stagesShown: OpportunityStage[] = [...PIPELINE_FLOW, "nurture", "lost"];

  return (
    <>
      <PageHeader
        title={`Good to see you, ${firstName}`}
        description={`Here's where things stand on ${formatDate(today)}.`}
        actions={<LinkButton variant="primary" href="/pipeline/new"><IconPlus /> New opportunity</LinkButton>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open opportunities" value={s.open_opportunities ?? 0} hint="Not won or lost" href="/pipeline" />
        <Stat label="Follow-ups due" value={s.follow_ups_due ?? 0} hint="Today or overdue · deals + tasks" href="/activities?view=overdue" tone={(s.follow_ups_due ?? 0) > 0 ? "warn" : undefined} />
        <Stat label="Active clients" value={s.active_clients ?? 0} hint="MSA signed + live requirement" href="/companies?view=active" />
        <Stat label="Live requirements" value={s.live_requirements ?? 0} hint="Excludes on hold & closed" href="/requirements?view=live" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card title="Pipeline by stage" actions={<Link href="/pipeline?view=board" className="text-[13px] link">Open board</Link>} id="pipeline-chart">
          <ul className="space-y-2">
            {stagesShown.map((stage) => {
              const n = Number(s.pipeline?.[stage] ?? 0);
              return (
                <li key={stage}>
                  <Link href={`/pipeline?stage=${stage}`} className="grid grid-cols-[130px_1fr_32px] items-center gap-3 rounded px-1 py-0.5 hover:bg-sunken">
                    <span className="truncate text-[13px] text-ink-soft">{OPPORTUNITY_STAGES.label[stage]}</span>
                    <span className="h-2 rounded-full bg-sunken" aria-hidden>
                      <span className={`block h-full rounded-full ${stage === "lost" ? "bg-line-strong" : stage === "won" ? "bg-ok" : "bg-accent"}`} style={{ width: `${(n / pipelineMax) * 100}%` }} />
                    </span>
                    <span className="text-right text-[13px] tabular-nums">{n}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="My upcoming tasks" actions={<Link href="/activities?view=mine" className="text-[13px] link">All my tasks</Link>} id="my-tasks">
          {tasks.length === 0 ? (
            <EmptyState compact icon={<IconTask />} title="You're all caught up" description="No tasks due in the next 7 days." />
          ) : (
            <ActivityTimeline activities={tasks} team={team} links={links} back="/" currentUserId={member.id} />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card title="Follow-ups this week" actions={<Link href="/pipeline?view=list&saved=follow_ups" className="text-[13px] link">See all</Link>} id="follow-ups">
          {followUps.length === 0 ? (
            <EmptyState compact icon={<IconPipeline />} title="No deal follow-ups due" description="Set a next follow-up date on opportunities to see them here." />
          ) : (
            <ul className="divide-y divide-line">
              {followUps.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/pipeline/${o.id}`} className="block truncate font-medium hover:underline">{o.title}</Link>
                    <div className="truncate text-xs text-muted">{followCompanies.get(o.company_id)} · {displayName(team.get(o.owner_id ?? ""))}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StageBadge stage={o.stage} />
                    <FollowUp date={o.next_follow_up_on} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent team activity" actions={<Link href="/activities?view=team" className="text-[13px] link">Team activity</Link>} id="recent">
          <ActivityTimeline activities={recent} team={team} links={links} back="/" currentUserId={member.id} emptyText="Calls, emails, meetings and WhatsApp messages the team logs will appear here." />
        </Card>
      </div>
    </>
  );
}
