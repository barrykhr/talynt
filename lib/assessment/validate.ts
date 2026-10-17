import type { Role } from "@/lib/candidate/roles";
import type { Assessment, AssessmentDefinition, Question } from "./types";
import { requirementsVersion } from "./requirements";

/**
 * The quality gate. Nothing reaches a candidate unless it passes — whether it
 * was written by a person or, later, drafted by a model. Errors block; warnings
 * are reported for review.
 */

export type Issue = { level: "error" | "warning"; code: string; message: string; ref?: string };

const BLOCKED: Array<{ code: string; label: string; pattern: RegExp }> = [
  {
    code: "protected-characteristic",
    label: "asks about a protected characteristic or personal circumstance",
    pattern:
      /\byour (age|gender|sex|religion|race|ethnicity|nationality|marital status|sexual orientation|health|disability|family)\b|\bhow old\b|\bdate of birth\b|\b(are|were) you (married|pregnant|disabled)\b|\b(religious|ethnicity|pregnan\w*|maternity|paternity|childcare|spouse|sexual orientation|disabilit\w*|medical condition|health condition)\b|\bphoto(graph)? of (you|yourself)\b|\b(do you have|have you got) (children|kids)\b/i,
  },
  {
    code: "confidential-information",
    label: "asks for confidential information from an employer",
    pattern:
      /\b(share|send|attach|paste|provide|upload) (your |the )?(code|source code|internal|confidential|proprietary)\b|\bname (the|your) (client|customer)s?\b|\bcurrent salary\b|\bsalary history\b|\b(revenue|salary|pay) (figures|data) (of|from|at) your\b/i,
  },
  {
    code: "paid-resource",
    label: "requires a paid tool or resource",
    pattern: /\b(purchase|buy|paid (account|plan|tool|licen[cs]e)|subscription|credit card)\b/i,
  },
  {
    code: "time-pressure",
    label: "imposes a time limit",
    pattern: /\b(within|in under|in less than) \d+ (minutes?|seconds?)\b|\btimed\b|\bcountdown\b/i,
  },
];

/** The first rule a piece of text breaks, if any. */
export function screen(text: string): { code: string; label: string } | null {
  for (const rule of BLOCKED) if (rule.pattern.test(text)) return { code: rule.code, label: rule.label };
  return null;
}

function checkQuestion(question: Question, competencyIds: Set<string>, issues: Issue[]) {
  const ref = question.id;
  if (!question.competencyIds.length || question.competencyIds.some((id) => !competencyIds.has(id))) {
    issues.push({ level: "error", code: "unknown-competency", message: "A question must assess one of this role's competencies.", ref });
  }
  if (question.prompt.length < 40 || question.prompt.length > 600) {
    issues.push({ level: "error", code: "prompt-length", message: "A prompt must be between 40 and 600 characters.", ref });
  }
  if (!/[?.]$/.test(question.prompt.trim())) {
    issues.push({ level: "warning", code: "prompt-ending", message: "A prompt should end as a question or an instruction.", ref });
  }
  if (question.guidance.length < 1 || question.guidance.length > 5 || question.guidance.some((g) => g.length < 3 || g.length > 160)) {
    issues.push({ level: "error", code: "guidance", message: "Every question needs one to five short points on what a useful answer covers.", ref });
  }
  const [low, high] = question.response.suggestedWords;
  if (question.response.format !== "text" || low < 20 || low >= high || high > question.response.maxWords || question.response.maxWords > 600) {
    issues.push({ level: "error", code: "response-format", message: "The expected response format and length must be defined and reasonable.", ref });
  }
  for (const text of [question.prompt, ...question.guidance]) {
    const hit = screen(text);
    if (hit) issues.push({ level: "error", code: hit.code, message: `The question ${hit.label}.`, ref });
  }
}

/** Checks a role's assessment material against the role as it stands now. */
export function validateDefinition(definition: AssessmentDefinition, role: Role, options: { requireApproved?: boolean } = {}): Issue[] {
  const issues: Issue[] = [];
  if (definition.roleSlug !== role.slug) {
    issues.push({ level: "error", code: "wrong-role", message: "This material belongs to a different role." });
    return issues;
  }
  if (definition.writtenFor !== requirementsVersion(role)) {
    issues.push({
      level: "error",
      code: "requirements-changed",
      message: "The role's requirements have changed since this material was written. It needs to be re-checked before it is used.",
    });
  }
  if (definition.status !== "approved") {
    issues.push({
      level: options.requireApproved ? "error" : "warning",
      code: "awaiting-review",
      message: "This material is proposed and has not yet been approved by TALYNT.",
    });
  }

  const competencyIds = new Set<string>();
  const skills = role.skills.map((s) => s.toLowerCase());
  for (const competency of definition.competencies) {
    if (competencyIds.has(competency.id)) issues.push({ level: "error", code: "duplicate-id", message: "Competency ids must be unique.", ref: competency.id });
    competencyIds.add(competency.id);

    const grounded = competency.from.some((g) => g.kind !== "skill");
    const valid = competency.from.every((g) =>
      g.kind === "skill"
        ? skills.includes(g.skill.toLowerCase())
        : g.index >= 0 && g.index < (g.kind === "essential" ? role.lookingFor.essential : role.lookingFor.helpful).length,
    );
    if (!grounded || !valid) {
      issues.push({ level: "error", code: "ungrounded", message: "Every competency must point at a requirement this role actually states.", ref: competency.id });
    }
    for (const text of [competency.label, competency.meaning]) {
      const hit = screen(text);
      if (hit) issues.push({ level: "error", code: hit.code, message: `The competency ${hit.label}.`, ref: competency.id });
    }
  }

  role.lookingFor.essential.forEach((_, index) => {
    const covered = definition.competencies.some((c) => c.from.some((g) => g.kind === "essential" && g.index === index));
    if (!covered) {
      issues.push({ level: "error", code: "essential-uncovered", message: `Essential requirement ${index + 1} is not assessed by any competency.` });
    }
  });

  const questionIds = new Set<string>();
  for (const question of definition.questions) {
    if (questionIds.has(question.id)) issues.push({ level: "error", code: "duplicate-id", message: "Question ids must be unique.", ref: question.id });
    questionIds.add(question.id);
    checkQuestion(question, competencyIds, issues);
  }

  for (const competency of definition.competencies) {
    const pool = definition.questions.filter((q) => q.competencyIds.includes(competency.id));
    if (!pool.some((q) => q.kind === "experience") || !pool.some((q) => q.kind !== "experience")) {
      issues.push({
        level: "error",
        code: "missing-alternative",
        message: "Every competency needs an experience question and an equivalent scenario, so nobody is penalised for what their CV leaves out.",
        ref: competency.id,
      });
    }
    const entry = definition.rubric.find((r) => r.competencyId === competency.id);
    if (!entry || entry.signals.length < 2 || entry.signals.length > 5) {
      issues.push({ level: "error", code: "rubric", message: "Every competency needs two to five rubric signals.", ref: competency.id });
    }
    for (const signal of entry?.signals ?? []) {
      const hit = screen(signal);
      if (hit) issues.push({ level: "error", code: hit.code, message: `A rubric signal ${hit.label}.`, ref: competency.id });
    }
  }
  return issues;
}

/** Checks one candidate's assessment, as built, before it is shown to them. */
export function validateAssessment(assessment: Assessment, role: Role): Issue[] {
  const issues: Issue[] = [];
  if (assessment.roleSlug !== role.slug) issues.push({ level: "error", code: "wrong-role", message: "This assessment belongs to a different role." });
  if (assessment.requirementsVersion !== requirementsVersion(role)) {
    issues.push({ level: "error", code: "requirements-changed", message: "The role's requirements have changed since this assessment was built." });
  }
  if (assessment.questions.length < 2 || assessment.questions.length > 6) {
    issues.push({ level: "error", code: "length", message: "An assessment should ask between two and six questions." });
  }
  const competencyIds = new Set(assessment.competencies.map((c) => c.id));
  for (const question of assessment.questions) checkQuestion(question, competencyIds, issues);
  for (const competency of assessment.competencies) {
    if (!assessment.questions.some((q) => q.competencyIds.includes(competency.id))) {
      issues.push({ level: "error", code: "unassessed", message: "Every competency in the assessment must be asked about.", ref: competency.id });
    }
    if (!assessment.rubric.some((r) => r.competencyId === competency.id)) {
      issues.push({ level: "error", code: "rubric", message: "Every competency in the assessment needs its rubric.", ref: competency.id });
    }
  }
  for (const [questionId, pointer] of Object.entries(assessment.pointers)) {
    const question = assessment.questions.find((q) => q.id === questionId);
    if (pointer && question?.kind !== "experience") {
      issues.push({ level: "error", code: "pointer", message: "Only experience questions point at the candidate's own experience.", ref: questionId });
    }
  }
  return issues;
}

export const errorsIn = (issues: Issue[]) => issues.filter((i) => i.level === "error");
