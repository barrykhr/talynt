import type { ClientStatus, MsaStatus, RequirementStatus } from "@/lib/constants";

/**
 * A requirement is "live" while the team is still working it: every delivery
 * stage except On hold and Closed/filled. "Placed" stays live until the
 * requirement is marked Closed/filled, because one placement does not
 * necessarily fill the whole hiring volume.
 *
 * Mirrors private.is_live_requirement() in the database.
 */
export function isLiveRequirement(status: RequirementStatus): boolean {
  return status !== "on_hold" && status !== "closed_filled";
}

export interface RequirementLike {
  status: RequirementStatus;
  archived_at?: string | null;
}

/**
 * Agreed business rule: an account is an ACTIVE CLIENT only when its MSA is
 * signed AND it has at least one live (non-archived) requirement.
 * Mirrors the company_overview view.
 */
export function deriveClientStatus(msa: MsaStatus, requirements: RequirementLike[]): ClientStatus {
  const live = requirements.some((r) => !r.archived_at && isLiveRequirement(r.status));
  if (msa === "signed" && live) return "active_client";
  if (msa === "signed") return "msa_signed_no_live_requirement";
  return "prospect";
}

export function isActiveClient(msa: MsaStatus, requirements: RequirementLike[]): boolean {
  return deriveClientStatus(msa, requirements) === "active_client";
}

/** Placement progress, clamped for display. */
export function placementProgress(filled: number, volume: number) {
  const safeVolume = Math.max(1, Math.floor(volume || 1));
  const safeFilled = Math.min(Math.max(0, Math.floor(filled || 0)), safeVolume);
  return { filled: safeFilled, volume: safeVolume, percent: Math.round((safeFilled / safeVolume) * 100) };
}
