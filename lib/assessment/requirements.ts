import type { Role } from "@/lib/candidate/roles";
import { fingerprint } from "./hash";

/**
 * Job-description analysis, for the data we actually hold: each role already
 * separates what is essential, what is helpful and what is explicitly not
 * required. Those lists — not anything in a candidate's CV — are what an
 * assessment is grounded in.
 */
export function requirementsOf(role: Role) {
  return {
    essential: role.lookingFor.essential,
    helpful: role.lookingFor.helpful,
    notRequired: role.lookingFor.notRequired,
    skills: role.skills,
    theRole: role.theRole,
  };
}

/**
 * The version of a role's requirements. Any edit to them produces a new
 * version, and assessment material written for the old one stops being served
 * until someone has checked it still fits. Conservative on purpose: "did this
 * change materially?" is a judgement for a person, not a diff.
 */
export function requirementsVersion(role: Role): string {
  return fingerprint(requirementsOf(role), "req");
}
