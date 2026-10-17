import type { Assessment, Evaluation, Rating, Response } from "./types";
import type { Issue } from "./validate";

/**
 * Evaluation is written by a TALYNT reviewer against the role's rubric. This
 * module holds the rules that keep it explainable:
 *
 * - evidence is a verbatim excerpt from what the candidate wrote, and must be
 *   findable in their answer;
 * - interpretation is separate from evidence and written in the reviewer's words;
 * - "not enough to judge" is allowed, and requires a follow-up question;
 * - there is no overall score, and nothing here decides anything — the hiring
 *   decision belongs to the employer.
 *
 * Nothing in this repository drafts evaluations automatically.
 */

const words = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
const normalise = (text: string) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();

/** Facts about the answers — never a judgement of them. */
export function completeness(assessment: Assessment, responses: Record<string, Response | undefined>) {
  const perQuestion = assessment.questions.map((q) => {
    const count = words(responses[q.id]?.text ?? "");
    return { questionId: q.id, words: count, answered: count > 0, overLimit: count > q.response.maxWords };
  });
  return {
    perQuestion,
    answered: perQuestion.filter((p) => p.answered).length,
    total: perQuestion.length,
    complete: perQuestion.every((p) => p.answered && !p.overLimit),
  };
}

export function validateEvaluation(evaluation: Evaluation, assessment: Assessment, responses: Record<string, Response | undefined>): Issue[] {
  const issues: Issue[] = [];
  if (evaluation.assessmentId !== assessment.id) issues.push({ level: "error", code: "wrong-assessment", message: "This evaluation belongs to a different assessment." });
  if (evaluation.rubricVersion !== assessment.rubricVersion) {
    issues.push({ level: "error", code: "rubric-version", message: "The evaluation must use the rubric the assessment was built with." });
  }
  const seen = new Set<string>();
  for (const finding of evaluation.findings) {
    const ref = finding.competencyId;
    if (!assessment.competencies.some((c) => c.id === ref)) issues.push({ level: "error", code: "unknown-competency", message: "A finding must be about a competency in this assessment.", ref });
    if (seen.has(ref)) issues.push({ level: "error", code: "duplicate-finding", message: "One finding per competency.", ref });
    seen.add(ref);
    if (!finding.interpretation.trim()) issues.push({ level: "error", code: "interpretation", message: "Every finding needs the reviewer's interpretation.", ref });
    if (finding.rating === "insufficient" && !finding.followUps.length) {
      issues.push({ level: "error", code: "follow-up", message: "“Not enough to judge” must say what to ask next.", ref });
    }
    if (finding.rating !== "insufficient" && !finding.evidence.length) {
      issues.push({ level: "error", code: "evidence", message: "A rating needs evidence from the candidate's answers.", ref });
    }
    for (const evidence of finding.evidence) {
      const question = assessment.questions.find((q) => q.id === evidence.questionId);
      if (!question) {
        issues.push({ level: "error", code: "evidence-question", message: "Evidence must come from a question in this assessment.", ref });
        continue;
      }
      if (!normalise(responses[question.id]?.text ?? "").includes(normalise(evidence.quote))) {
        issues.push({ level: "error", code: "evidence-not-found", message: "Evidence must be quoted from the candidate's answer, word for word.", ref });
      }
    }
  }
  for (const competency of assessment.competencies) {
    if (!seen.has(competency.id)) issues.push({ level: "warning", code: "unreviewed", message: "A competency has no finding yet.", ref: competency.id });
  }
  if (evaluation.reviewer.status === "reviewed" && !evaluation.reviewer.reviewedAt) {
    issues.push({ level: "error", code: "reviewer", message: "A reviewed evaluation records when it was reviewed." });
  }
  return issues;
}

/** What a client may see: everything except TALYNT's internal notes. */
export function clientView(evaluation: Evaluation): Omit<Evaluation, "internalNotes"> {
  const { internalNotes: _internal, ...shared } = evaluation;
  void _internal;
  return shared;
}

export function ratingCounts(evaluation: Pick<Evaluation, "findings">): Record<Rating, number> {
  const counts: Record<Rating, number> = { limited: 0, clear: 0, strong: 0, insufficient: 0 };
  for (const f of evaluation.findings) counts[f.rating] += 1;
  return counts;
}
