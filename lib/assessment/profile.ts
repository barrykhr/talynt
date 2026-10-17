import type { Passport } from "@/lib/candidate/passport-shape";
import type { Competency, ExperiencePointer } from "./types";
import { fingerprint } from "./hash";

/**
 * Candidate-profile analysis, kept small on purpose.
 *
 * The only thing an assessment takes from a profile is which of the person's
 * own experience entries look relevant to each competency, so a question can
 * say "you could draw on…". Names, contact details, location, compensation and
 * preferences are never read here — they have no bearing on what is asked.
 * Nothing in this module leaves the browser.
 */

/** The parts of a profile that describe experience. Everything else is ignored. */
export type ProfileForAssessment = Pick<Passport, "experience" | "skills">;

/** The version of everything a candidate shares in their profile, so an application can say which one it used. */
export function profileVersion(profile: Passport): string {
  const { updatedAt: _updatedAt, consent: _consent, ...content } = profile;
  void _updatedAt;
  void _consent;
  return fingerprint(content, "prof");
}

function textOf(entry: Passport["experience"][number]): string {
  return ` ${[entry.title, entry.organisation, entry.summary].join(" ").toLowerCase().replace(/[^a-z0-9+#/.\s-]/g, " ")} `;
}

function cueMatches(text: string, cue: string): boolean {
  const c = cue.toLowerCase();
  return text.includes(` ${c} `) || text.includes(` ${c}s `) || text.includes(` ${c}.`) || text.includes(` ${c},`);
}

/**
 * The experience entry that best matches a competency's cues, or null when
 * none does. Null is not a judgement: it only means the scenario question is
 * offered instead of the experience question.
 */
export function pointerFor(competency: Competency, profile: ProfileForAssessment | null): ExperiencePointer | null {
  if (!profile) return null;
  let best: { id: string; label: string; hits: number } | null = null;
  for (const entry of profile.experience) {
    const text = textOf(entry);
    const hits = competency.cues.filter((cue) => cueMatches(text, cue)).length;
    if (hits > 0 && (!best || hits > best.hits)) {
      const label = [entry.title, entry.organisation].filter(Boolean).join(", ") || "An entry in your experience";
      best = { id: entry.id, label, hits };
    }
  }
  return best ? { experienceId: best.id, label: best.label } : null;
}
