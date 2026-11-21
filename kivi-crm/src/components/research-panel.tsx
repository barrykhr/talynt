import { createClient } from "@/lib/supabase/server";
import { googleConfig } from "@/lib/env";
import { activeProvider } from "@/lib/research/providers";
import { Badge, Card, Notice } from "@/components/ui";
import { InlineAction } from "@/components/forms";
import { FindingReview, ResearchStartForm, DraftEditor, DraftFromFactsForm } from "@/components/research-forms";
import { CONFIDENCE_LABEL, EVIDENCE_LABEL } from "@/lib/constants";
import { daysSince, formatDate, formatDateTime, formatRelative } from "@/lib/time";
import { retryResearch } from "@/lib/actions/research";
import type { Member } from "@/lib/auth";
import type { OutreachDraft, ResearchFinding, ResearchJob, ResearchSnapshot } from "@/lib/types";

const STALE_DAYS = 90;

function host(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

export function EvidenceBadges({ f }: { f: Pick<ResearchFinding, "evidence_kind" | "confidence" | "source_verified" | "source_url"> }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Badge tone={f.evidence_kind === "verified_fact" ? "ok" : f.evidence_kind === "reported_claim" ? "info" : "warn"}>{EVIDENCE_LABEL[f.evidence_kind]}</Badge>
      <Badge tone={f.confidence === "high" ? "ok" : f.confidence === "medium" ? "neutral" : "warn"}>{CONFIDENCE_LABEL[f.confidence]}</Badge>
      {f.source_url && !f.source_verified ? <Badge tone="warn">Source not cross-checked</Badge> : null}
    </span>
  );
}

export function FindingCard({ f, back, reviewable = true }: { f: ResearchFinding; back: string; reviewable?: boolean }) {
  return (
    <li className={`rounded-md border p-3 ${f.review_state === "dismissed" ? "border-line opacity-60" : "border-line bg-surface"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm text-ink">
          {f.review_state === "corrected" ? <><span className="line-through decoration-faint">{f.statement}</span><br /><strong className="font-medium">{f.corrected_statement}</strong></> : f.statement}
        </p>
        <span className="text-[11px] uppercase tracking-wide text-faint">{f.category}</span>
      </div>
      <div className="mt-1.5"><EvidenceBadges f={f} /></div>
      {f.source_url ? (
        <div className="mt-2 text-xs text-muted">
          <a className="link" href={f.source_url} target="_blank" rel="noopener noreferrer nofollow">{f.source_title || host(f.source_url)}</a>
          <span> · {host(f.source_url)}</span>
          <span> · published {f.published_on ? formatDate(f.published_on) : "date unknown"}</span>
          <span> · checked {formatDate(f.retrieved_at)}</span>
        </div>
      ) : <div className="mt-2 text-xs text-muted">No source — this is reasoning, not a fact. Checked {formatDate(f.retrieved_at)}.</div>}
      {f.excerpt ? <blockquote className="mt-1.5 border-l-2 border-line-strong pl-2 text-xs italic text-ink-soft">“{f.excerpt}”</blockquote> : null}
      {f.conflict_note ? <p className="mt-1.5 text-xs text-warn">{f.conflict_note}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {f.review_state === "pending" ? <Badge tone="info">Needs review</Badge> : <Badge>{f.review_state[0].toUpperCase() + f.review_state.slice(1)}{f.applied_to_field ? ` · applied to ${f.applied_to_field.replace("_", " ")}` : ""}</Badge>}
        {reviewable && f.review_state === "pending" ? <FindingReview id={f.id} back={back} category={f.category} /> : null}
      </div>
    </li>
  );
}

export async function ResearchPanel({ companyId, opportunityId, contacts, member, back }: {
  companyId: string; opportunityId?: string | null; contacts: { value: string; label: string }[]; member: Member; back: string;
}) {
  const supabase = await createClient();
  const [jobsRes, snapsRes, draftsRes, connsRes] = await Promise.all([
    supabase.from("research_jobs").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(5),
    supabase.from("research_snapshots").select("*").eq("company_id", companyId).order("checked_at", { ascending: false }).limit(10),
    supabase.from("outreach_drafts").select("*").eq("company_id", companyId).in("status", ["draft"]).order("created_at", { ascending: false }).limit(3),
    googleConfig() ? supabase.rpc("my_google_connections") : Promise.resolve({ data: [] }),
  ]);
  const jobs = (jobsRes.data ?? []) as ResearchJob[];
  const snaps = (snapsRes.data ?? []) as ResearchSnapshot[];
  const drafts = (draftsRes.data ?? []) as OutreachDraft[];
  const latest = snaps[0];
  const { data: findingData } = latest ? await supabase.from("research_findings").select("*").eq("snapshot_id", latest.id).order("position") : { data: [] };
  const findings = (findingData ?? []) as ResearchFinding[];
  const provider = activeProvider();
  const gmail = ((connsRes.data ?? []) as { product: string; status: string; google_email: string }[]).find((c) => c.product === "gmail" && c.status === "connected");
  const hasGoogle = ((connsRes.data ?? []) as { status: string }[]).some((c) => c.status === "connected");
  const active = jobs.filter((j) => j.status === "queued" || j.status === "running");
  const failed = jobs.find((j) => j.status === "failed");
  const stale = latest && daysSince(latest.checked_at) > STALE_DAYS;
  void member;

  return (
    <Card title="Company research" id="research">
      {!provider ? (
        <Notice tone="warn" title="Research isn't configured yet">
          An admin needs to add a research provider key (Claude or OpenAI) or the outreach-agent URL — see docs/RESEARCH.md.
          Nothing below is generated until then; you can still add signals and write drafts by hand.
        </Notice>
      ) : (
        <ResearchStartForm companyId={companyId} opportunityId={opportunityId ?? null} contacts={contacts} back={back}
          providerLabel={provider.label} canIncludeConversations={hasGoogle} />
      )}

      {active.length ? (
        <div className="mt-3"><Notice tone="info" title="Research in progress">Started {formatRelative(active[0].created_at)}. Refresh in a minute or two to see results.</Notice></div>
      ) : null}
      {failed && !active.length && (!latest || new Date(failed.created_at) > new Date(latest.checked_at)) ? (
        <div className="mt-3">
          <Notice tone="danger" title={`Last research attempt failed (${failed.attempts}/${failed.max_attempts} attempts)`}>
            <p>{failed.error ?? "Unknown error"}</p>
            {failed.attempts < failed.max_attempts ? <p className="mt-1 text-xs">It will retry automatically after {formatDateTime(failed.next_attempt_at)}.</p> : null}
            <div className="mt-2"><InlineAction action={retryResearch} hidden={{ id: failed.id, back }} variant="secondary">Retry now</InlineAction></div>
          </Notice>
        </div>
      ) : null}

      {latest ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
            <div>
              <div className="text-sm font-semibold">Snapshot of {formatDateTime(latest.checked_at)}</div>
              <div className="text-xs text-muted">{latest.provider}{latest.model ? ` · ${latest.model}` : ""} · {latest.sources_retrieved} page(s) retrieved · snapshots are never edited</div>
            </div>
            {stale ? <Badge tone="warn">Older than {STALE_DAYS} days — consider re-running</Badge> : <Badge tone="ok">Last checked {formatRelative(latest.checked_at)}</Badge>}
          </div>
          {latest.warnings.length ? (
            <Notice tone="warn" title="Read with care">
              <ul className="list-disc pl-4">{latest.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            </Notice>
          ) : null}
          {latest.about_brief ? (
            <div className="rounded-md bg-sunken/60 p-3 text-sm">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Suggested “About” (not yet accepted)</div>
              {latest.about_brief}
              <p className="mt-1 text-xs text-muted">Accept an “about” finding below to put a brief on the company profile.</p>
            </div>
          ) : null}
          {latest.outreach_angle ? <p className="text-sm"><span className="font-medium">Suggested angle:</span> {latest.outreach_angle}</p> : null}
          <ul className="space-y-2">{findings.map((f) => <FindingCard key={f.id} f={f} back={back} />)}</ul>
          {snaps.length > 1 ? (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted">Earlier snapshots ({snaps.length - 1})</summary>
              <ul className="mt-2 space-y-1 text-xs text-muted">
                {snaps.slice(1).map((s) => <li key={s.id}><a className="link" href={`/research/snapshots/${s.id}`}>{formatDateTime(s.checked_at)}</a> · {s.provider}</li>)}
              </ul>
            </details>
          ) : null}
        </div>
      ) : !active.length && provider ? (
        <p className="mt-3 text-sm text-muted">No research yet. Research is stored as a dated snapshot with sources for each claim, and nothing is sent to anyone.</p>
      ) : null}

      <div className="mt-5 border-t border-line pt-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Outreach drafts</h3>
          {provider?.supportsDraftOnly ? <DraftFromFactsForm companyId={companyId} opportunityId={opportunityId ?? null} contacts={contacts} back={back} canIncludeConversations={hasGoogle} /> : null}
        </div>
        <p className="mb-3 text-xs text-muted">Drafts are never sent automatically. Edit, then send from your own Gmail or copy for WhatsApp.</p>
        {drafts.length === 0 ? <p className="text-sm text-faint">No open drafts.</p> : (
          <div className="space-y-4">
            {drafts.map((d) => <DraftEditor key={d.id} draft={d} back={back} gmailFrom={gmail?.google_email ?? null} />)}
          </div>
        )}
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-muted">Write a draft by hand</summary>
          <div className="mt-2"><DraftEditor draft={null} back={back} gmailFrom={null} companyId={companyId} opportunityId={opportunityId ?? null} /></div>
        </details>
      </div>
    </Card>
  );
}
