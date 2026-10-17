import type { Role } from "@/lib/candidate/roles";
import type { Assessment, Response } from "./types";
import { definitionFor } from "./bank";
import { requirementsVersion } from "./requirements";
import { rubricVersion } from "./rubric";

/**
 * What travels with an application, and how the server checks it.
 *
 * The browser sends the assessment it built and the candidate's answers. The
 * server does not take that on trust: it confirms every question belongs to
 * this role's reviewed material, bounds every answer, and says plainly when
 * the role's requirements or rubric have moved on since the assessment was
 * built, rather than letting an old assessment pass for a current one.
 */

export type AssessmentSubmission = {
  assessmentId: string;
  roleSlug: string;
  requirementsVersion: string;
  rubricVersion: string;
  definitionRevision: number;
  source: { id: string; version: number };
  profileVersion: string | null;
  createdAt: string;
  answers: Array<{ questionId: string; prompt: string; response: string }>;
};

export function toSubmission(assessment: Assessment, responses: Record<string, Response | undefined>): AssessmentSubmission {
  return {
    assessmentId: assessment.id,
    roleSlug: assessment.roleSlug,
    requirementsVersion: assessment.requirementsVersion,
    rubricVersion: assessment.rubricVersion,
    definitionRevision: assessment.definitionRevision,
    source: assessment.source,
    profileVersion: assessment.profileVersion,
    createdAt: assessment.createdAt,
    answers: assessment.questions.map((q) => ({ questionId: q.id, prompt: q.prompt, response: responses[q.id]?.text ?? "" })),
  };
}

export type VerifiedAssessment = Omit<AssessmentSubmission, "answers"> & {
  answers: Array<{ questionId: string; prompt: string; response: string; competencyIds: string[]; matchesCurrentMaterial: boolean }>;
  /** True when the role's requirements or rubric have changed since the assessment was built. */
  stale: boolean;
  current: { requirementsVersion: string; rubricVersion: string };
};

const MAX_CHARS = 6000;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const words = (text: string) => (text ? text.split(/\s+/).length : 0);

export function verifySubmission(raw: unknown, role: Role): { ok: true; value: VerifiedAssessment } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "The assessment was malformed." };
  const input = raw as Record<string, unknown>;
  const definition = definitionFor(role.slug);
  if (!definition) return { ok: false, error: "There is no assessment for this role." };
  if (str(input.roleSlug, 120) !== role.slug) return { ok: false, error: "The assessment is for a different role." };

  const answersIn = Array.isArray(input.answers) ? input.answers.slice(0, 10) : [];
  if (!answersIn.length) return { ok: false, error: "The assessment had no answers." };

  const seen = new Set<string>();
  const answers: VerifiedAssessment["answers"] = [];
  for (const item of answersIn) {
    const a = (item ?? {}) as Record<string, unknown>;
    const questionId = str(a.questionId, 80);
    const question = definition.questions.find((q) => q.id === questionId);
    if (!question || seen.has(questionId)) return { ok: false, error: "The assessment contained a question that does not belong to this role." };
    seen.add(questionId);
    const response = str(a.response, MAX_CHARS);
    if (!response) return { ok: false, error: "Every question needs an answer before the assessment is sent." };
    if (words(response) > question.response.maxWords) return { ok: false, error: "An answer was longer than that question allows." };
    const prompt = str(a.prompt, 700);
    answers.push({ questionId, prompt, response, competencyIds: question.competencyIds, matchesCurrentMaterial: prompt === question.prompt });
  }

  const current = { requirementsVersion: requirementsVersion(role), rubricVersion: rubricVersion(definition) };
  const sent = { requirementsVersion: str(input.requirementsVersion, 40), rubricVersion: str(input.rubricVersion, 40) };
  const source = (input.source ?? {}) as Record<string, unknown>;

  return {
    ok: true,
    value: {
      assessmentId: str(input.assessmentId, 80),
      roleSlug: role.slug,
      requirementsVersion: sent.requirementsVersion,
      rubricVersion: sent.rubricVersion,
      definitionRevision: Number.isFinite(input.definitionRevision) ? Number(input.definitionRevision) : 0,
      source: { id: str(source.id, 40), version: Number.isFinite(source.version) ? Number(source.version) : 0 },
      profileVersion: str(input.profileVersion, 40) || null,
      createdAt: str(input.createdAt, 40),
      answers,
      stale: sent.requirementsVersion !== current.requirementsVersion || sent.rubricVersion !== current.rubricVersion,
      current,
    },
  };
}
