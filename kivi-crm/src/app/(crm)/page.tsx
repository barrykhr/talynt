import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeamMap, displayName } from "@/lib/data/team";
import { timelineLinks } from "@/lib/data/lookups";
import { Card, EmptyState, LinkButton, PageHeader, Stat } from "@/components/ui";
import { ActivityTimeline, FollowUp, StageBadge } from "@/components/crm";
import { IconBuilding, IconPlus, IconUpload, IconTask, IconPipeline } from "@/components/icons";
import { DEFAULT_CURRENCY, OPPORTUNITY_STAGES, PIPELINE_FLOW, type OpportunityStage } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { addDays, formatDate, todayInZone } from "@/lib/time";
import type { Activity, CompanySignal, Opportunity } from "@/lib/types";

export const metadata: Metadata = { title: "Home" };

interface Summary {
  open_opportunities: number;
  follow_ups_due: number;
  overdue: number;
  no_next_action: number;
  active_clients: number;
  live_requirements: number;
  companies: number;
  new_signals: number;
  pending_findings: number;
  new_web_leads: number;
  pipeline: Partial<Record<OpportunityStage, number>>;
}

export default async function OverviewPage() {
  const member = await requireMemberPage();
  const supabase = await createClient();
  const today = todayInZone();
  const weekAhead = addDays(today, 7);

  const [{ data: summaryData }, team, tasksRes, followRes, recentRes, { data: revenueData }, { data: signalData }] = await Promise.all([
    supabase.rpc("dashboard_summary", { p_today: today }),
    getTeamMap(),
    supabase.from("activities").select("*").eq("type", "task").is("completed_at", null).is("archived_at", null)
      .eq("owner_id", member.id).lte("due_at", `${weekAhead}T23:59:59Z`).order("due_at").limit(8),
    supabase.from("opportunities").select("id, title, company_id, stage, owner_id, next_follow_up_on")
      .is("archived_at", null).not("stage", "in", "(won,lost)").not("next_follow_up_on", "is", null)
      .lte("next_follow_up_on", weekAhead).order("next_follow_up_on").limit(8),
    supabase.from("activities").select("*").is("archived_at", null).neq("type", "task").order("occurred_at", { ascending: false }).limit(10),
    supabase.rpc("revenue_summary", { p_from: addDays(today, -364), p_to: today, p_owner: null }),
    supabase.from("company_signals").select("*, companies(name)").eq("review_state", "new").order("first_seen_at", { ascending: false }).limit(4),
  ]);
  const revenue = (revenueData ?? {}) as Record<string, { booked: number; collected: number; outstanding: number; outstanding_overdue: number; pipeline_weighted: number }>;
  const inr = revenue[DEFAULT_CURRENCY];
  const otherCurrencies = Object.keys(revenue).filter((c) => c !== DEFAULT_CURRENCY);
  const signals = (signalData ?? []) as (CompanySignal & { companies: { name: string } | null })[];

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
        <PageHeader title={`Welcome, ${firstName}`} description="Your KiviTronics CRM workspace is ready — and empty. Nothing here is sample data." />
        <div className="card">
          <EmptyState
            icon={<IconBuilding />}
            title="Start with your first lead"
            description="Everything hangs off a company: its contacts, sales opportunities, hiring requirements, research and revenue."
            actions={
              <>
                <LinkButton variant="primary" href="/leads/new"><IconPlus /> Add a lead</LinkButton>
                <LinkButton href="/companies/new">Add a company</LinkButton>
                <LinkButton href="/import"><IconUpload /> Import a spreadsheet</LinkButton>
                <LinkButton href="/settings">Connect Google</LinkButton>
              </>
            }
          />
          <p className="px-6 pb-6 text-center text-xs text-muted">To research a company, add it first, then use “Research company” on its page{(s.new_web_leads ?? 0) > 0 ? ` · ${s.new_web_leads} website enquiries are waiting in the lead inbox` : ""}.</p>
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
        actions={<LinkButton variant="primary" href="/leads/new"><IconPlus /> Add a lead</LinkButton>}
      />

      <h2 className="sr-only">Needs attention</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Follow-ups due" value={s.follow_ups_due ?? 0} hint="Today or earlier · deals + tasks" href="/activities?view=due_today" tone={(s.follow_ups_due ?? 0) > 0 ? "warn" : undefined} />
        <Stat label="Overdue" value={s.overdue ?? 0} hint="Past their date" href="/activities?view=overdue" tone={(s.overdue ?? 0) > 0 ? "warn" : undefined} />
        <Stat label="No next action" value={s.no_next_action ?? 0} hint="Open deals with no follow-up or task" href="/pipeline?saved=no_next_action" tone={(s.no_next_action ?? 0) > 0 ? "warn" : undefined} />
        <Stat label="New research signals" value={(s.new_signals ?? 0) + (s.pending_findings ?? 0)} hint={`${s.new_signals ?? 0} signals · ${s.pending_findings ?? 0} findings to review`} href="/research" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Open opportunities" value={s.open_opportunities ?? 0} hint={inr ? `${formatMoney(inr.pipeline_weighted, "INR", { compact: true })} weighted pipeline` : "Not won or lost"} href="/pipeline" />
        <Stat label="Live requirements" value={s.live_requirements ?? 0} hint={`${s.active_clients ?? 0} active clients (MSA + live req.)`} href="/requirements?view=live" />
        <Stat label="Booked · last 12 months" value={inr ? formatMoney(inr.booked, "INR", { compact: true }) : "₹0"} hint="Accepted, valued, MSA signed" href="/revenue" />
        <Stat label="Realized · last 12 months" value={inr ? formatMoney(inr.collected, "INR", { compact: true }) : "₹0"} hint={inr && inr.outstanding ? `${formatMoney(inr.outstanding, "INR", { compact: true })} outstanding${inr.outstanding_overdue ? `, ${formatMoney(inr.outstanding_overdue, "INR", { compact: true })} overdue` : ""}` : "Cash actually received"} href="/revenue?view=receivables" />
      </div>
      {otherCurrencies.length ? <p className="mt-2 text-xs text-muted">Revenue in {otherCurrencies.join(", ")} is shown separately on the Revenue page (no conversion).</p> : null}
      {(s.new_web_leads ?? 0) > 0 ? <p className="mt-3 text-sm"><Link className="link" href="/pipeline?saved=inbox">{s.new_web_leads} new website enquir{s.new_web_leads === 1 ? "y" : "ies"} waiting in the lead inbox →</Link></p> : null}

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

        <Card title="New research signals" actions={<Link href="/research" className="text-[13px] link">Review all</Link>} id="signals">
          {signals.length === 0 ? <p className="text-sm text-muted">No new public signals. Turn on monitoring from a company page to get weekly checks.</p> : (
            <ul className="divide-y divide-line">
              {signals.map((sig) => (
                <li key={sig.id} className="py-2 text-sm"><Link className="font-medium hover:underline" href={`/companies/${sig.company_id}#signals`}>{sig.companies?.name}</Link> · {sig.summary}
                  <span className="text-xs text-muted"> · {sig.provider} · {formatDate(sig.first_seen_at)}</span></li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Recent team activity" actions={<Link href="/activities?view=team" className="text-[13px] link">Team activity</Link>} id="recent" className="lg:col-span-2">
          <ActivityTimeline activities={recent} team={team} links={links} back="/" currentUserId={member.id} emptyText="Calls, emails, meetings and WhatsApp messages the team logs will appear here." />
        </Card>
      </div>
    </>
  );
}
