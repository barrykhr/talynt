import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";
import { applyEvidenceRules, ResearchError, type ResearchInput } from "./schema";
import { providerById } from "./providers";

const JOB_TIMEOUT_MS = 270_000;

/**
 * Runs one research job: claim it (idempotent), call the provider, apply the
 * evidence rules, store the snapshot atomically. Failures are recorded with a
 * retry schedule; nothing is ever sent to anyone.
 */
export async function runResearchJob(jobId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: claimed, error: claimErr } = await admin.rpc("claim_research_job", { p_job: jobId });
  if (claimErr) return { ok: false, error: "Could not start the research job." };
  if (!claimed) return { ok: false, error: "This research job is already running or finished." };

  const { data: job } = await admin.from("research_jobs").select("id, provider, input, company_id, opportunity_id, requested_by").eq("id", jobId).single();
  const fail = async (message: string, retryable: boolean) => {
    await admin.rpc("fail_research_job", { p_job: jobId, p_error: message, p_retryable: retryable });
    log.warn("research.job_failed", { jobId, retryable, message });
    return { ok: false, error: message };
  };
  if (!job) return fail("The research job disappeared.", false);

  const provider = providerById(job.provider);
  if (!provider || !provider.configured()) return fail("The research provider is no longer configured.", false);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JOB_TIMEOUT_MS);
  try {
    const input = job.input as ResearchInput;
    const out = await provider.research(input, controller.signal);
    const stored = applyEvidenceRules(out.raw, { retrieved: out.retrieved, now: new Date(), model: out.model, extraWarnings: out.extraWarnings });
    const { data: snapshotId, error } = await admin.rpc("store_research_result", { p_job: jobId, p_result: stored });
    if (error) return fail("The research result could not be saved.", true);
    if (stored.draft_message) {
      await admin.from("outreach_drafts").insert({
        company_id: job.company_id, opportunity_id: job.opportunity_id, snapshot_id: snapshotId,
        channel: input.channel, level: input.level, subject: stored.draft_subject, body: stored.draft_message.slice(0, 6000),
        created_by: job.requested_by,
      });
    }
    log.info("research.job_succeeded", { jobId, provider: provider.id, findings: stored.findings.length });
    return { ok: true };
  } catch (err) {
    if (controller.signal.aborted) return fail("Research timed out; it will retry.", true);
    if (err instanceof ResearchError) return fail(err.message, err.retryable);
    log.error("research.job_crashed", { jobId, error: err });
    return fail("Research failed unexpectedly; it will retry.", true);
  } finally {
    clearTimeout(timer);
  }
}

/** Picks up queued jobs and due retries (called by the scheduler). */
export async function runDueResearchJobs(limit = 3) {
  const admin = createAdminClient();
  const { data } = await admin.from("research_jobs").select("id")
    .in("status", ["queued", "failed"]).lte("next_attempt_at", new Date().toISOString()).is("snapshot_id", null)
    .order("created_at").limit(limit * 3);
  let ran = 0;
  for (const j of data ?? []) {
    if (ran >= limit) break;
    const r = await runResearchJob(j.id);
    if (r.ok || r.error !== "This research job is already running or finished.") ran++;
  }
  return ran;
}
