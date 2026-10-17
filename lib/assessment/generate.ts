import type { Role } from "@/lib/candidate/roles";
import type { Assessment, AssessmentDefinition, ExperiencePointer, Question } from "./types";
import { definitionFor } from "./bank";
import { pointerFor, type ProfileForAssessment } from "./profile";
import { requirementsVersion } from "./requirements";
import { rubricVersion } from "./rubric";
import { errorsIn, validateAssessment, validateDefinition, type Issue } from "./validate";

/**
 * Builds one candidate's assessment for one application.
 *
 *   1. role requirements        requirementsVersion(role)
 *   2. reviewed material        the role's definition, re-validated against the role as it is now
 *   3. profile analysis         which of the candidate's own experience entries are relevant (local only)
 *   4. competency selection     every competency the role's essential requirements produce
 *   5. question selection       per competency, the experience question when the profile shows relevant
 *                               experience, otherwise the equivalent scenario — and always at least one scenario
 *   6. rubric                   the role's signals for the selected competencies, versioned
 *   7. validation               the built assessment is checked again before anyone sees it
 *
 * The result is a pure function of its inputs: the same role, profile and ids
 * always produce the same assessment, so building it again changes nothing.
 * Callers persist the first result and reuse it (see lib/candidate/applications.ts).
 *
 * The question source is TALYNT's reviewed material. A model-drafted source can
 * be added behind the same validation; none is connected in this repository.
 */

export const BUILDER = { id: "reviewed-bank", version: 1 } as const;

export type BuildInput = {
  role: Role;
  profile: ProfileForAssessment | null;
  profileVersion: string | null;
  applicationId: string;
  assessmentId: string;
  now: string;
  requireApproved?: boolean;
};

export type BuildResult =
  | { ok: true; assessment: Assessment; issues: Issue[] }
  | { ok: false; reason: "no-material" | "requirements-changed" | "awaiting-review" | "invalid"; issues: Issue[] };

function select(definition: AssessmentDefinition, profile: ProfileForAssessment | null) {
  const picks = definition.competencies.map((competency) => {
    const pool = definition.questions.filter((q) => q.competencyIds.includes(competency.id));
    const pointer = pointerFor(competency, profile);
    const experience = pool.find((q) => q.kind === "experience");
    const alternative = pool.find((q) => q.kind !== "experience");
    return { competency, pointer, experience, alternative };
  });

  const chosen: Array<{ question: Question; pointer: ExperiencePointer | null }> = picks.map((p) =>
    p.pointer && p.experience ? { question: p.experience, pointer: p.pointer } : { question: p.alternative ?? p.experience!, pointer: null },
  );

  // A short assessment still deserves one realistic scenario.
  if (chosen.every((c) => c.question.kind === "experience")) {
    const last = picks.length - 1;
    if (picks[last].alternative) chosen[last] = { question: picks[last].alternative!, pointer: null };
  }
  return chosen;
}

export function buildAssessment(input: BuildInput): BuildResult {
  const definition = definitionFor(input.role.slug);
  if (!definition) {
    return { ok: false, reason: "no-material", issues: [{ level: "error", code: "no-material", message: "There is no reviewed assessment material for this role yet." }] };
  }

  const definitionIssues = validateDefinition(definition, input.role, { requireApproved: input.requireApproved });
  const blocking = errorsIn(definitionIssues);
  if (blocking.length) {
    const reason = blocking.some((i) => i.code === "requirements-changed")
      ? "requirements-changed"
      : blocking.some((i) => i.code === "awaiting-review")
        ? "awaiting-review"
        : "invalid";
    return { ok: false, reason, issues: definitionIssues };
  }

  const chosen = select(definition, input.profile);
  const assessment: Assessment = {
    id: input.assessmentId,
    applicationId: input.applicationId,
    roleSlug: input.role.slug,
    roleTitle: input.role.title,
    requirementsVersion: requirementsVersion(input.role),
    rubricVersion: rubricVersion(definition),
    definitionRevision: definition.revision,
    source: BUILDER,
    profileVersion: chosen.some((c) => c.pointer) ? input.profileVersion : null,
    createdAt: input.now,
    competencies: definition.competencies,
    questions: chosen.map((c) => c.question),
    rubric: definition.rubric,
    pointers: Object.fromEntries(chosen.map((c) => [c.question.id, c.pointer])),
  };

  const issues = [...definitionIssues, ...validateAssessment(assessment, input.role)];
  if (errorsIn(issues).length) return { ok: false, reason: "invalid", issues };
  return { ok: true, assessment, issues };
}
