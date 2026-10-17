/**
 * The assessment model.
 *
 * Three things are kept apart on purpose:
 *
 *   the candidate's PROFILE    — reusable, theirs, never changed by an application
 *   an APPLICATION             — one per role, owns the responses
 *   an ASSESSMENT              — built for that application, from that role's
 *                                requirements, frozen once created
 *
 * An assessment carries a snapshot of the competencies, questions and rubric it
 * was built with, plus the version of the role requirements behind them, so an
 * evaluation can always be read against exactly what the candidate was asked.
 */

/** Where in the role a competency comes from. Every competency must point at the role. */
export type Grounding = { kind: "essential" | "helpful"; index: number } | { kind: "skill"; skill: string };

export type Competency = {
  id: string;
  label: string;
  /** What this means for this particular role, in one sentence. Shown to candidates and clients. */
  meaning: string;
  from: Grounding[];
  /**
   * Words that help point a candidate at their own relevant experience. They
   * choose which of two equivalent questions to show and which experience to
   * suggest drawing on. They are never used to rate an answer.
   */
  cues: string[];
};

export type QuestionKind = "experience" | "scenario" | "functional";

export type Question = {
  id: string;
  kind: QuestionKind;
  competencyIds: string[];
  prompt: string;
  /** What a useful answer covers. Shown to the candidate before they write. */
  guidance: string[];
  /** Free text, with a suggested and a hard length. There is no time limit field, by design. */
  response: { format: "text"; suggestedWords: [number, number]; maxWords: number };
};

/** What strong evidence for a competency looks like in this role. */
export type RubricEntry = { competencyId: string; signals: string[] };

export type RubricLevel = "limited" | "clear" | "strong";
/** "insufficient" is a reviewer's answer, not a level: not enough to judge, which calls for a follow-up. */
export type Rating = RubricLevel | "insufficient";

/** A role's reviewed assessment material — the pool a candidate's assessment is drawn from. */
export type AssessmentDefinition = {
  roleSlug: string;
  /** The requirements version this material was written and reviewed against. */
  writtenFor: string;
  /** Raise by hand whenever a question, competency or rubric line is edited. */
  revision: number;
  /** "proposed" until TALYNT has reviewed the wording; see lib/assessment/README.md. */
  status: "proposed" | "approved";
  competencies: Competency[];
  /** Each competency has an experience question and a scenario or functional alternative. */
  questions: Question[];
  rubric: RubricEntry[];
};

/** A pointer from a question to the candidate's own experience entry. A suggestion, never a requirement. */
export type ExperiencePointer = { experienceId: string; label: string };

/** One candidate's assessment for one application. Frozen once created. */
export type Assessment = {
  id: string;
  applicationId: string;
  roleSlug: string;
  roleTitle: string;
  /** The versions this assessment was built from. */
  requirementsVersion: string;
  rubricVersion: string;
  definitionRevision: number;
  /** Which builder produced it, so a future model-assisted source is distinguishable. */
  source: { id: "reviewed-bank"; version: number };
  /** The profile version whose experience entries were used for pointers, if any. */
  profileVersion: string | null;
  createdAt: string;
  competencies: Competency[];
  questions: Question[];
  rubric: RubricEntry[];
  pointers: Record<string, ExperiencePointer | null>;
};

export type Response = { questionId: string; text: string; updatedAt: string };

/* --------------------------------------------------------------------------
   Evaluation — written by a person, structured so evidence and reading stay apart
   -------------------------------------------------------------------------- */

/** A verbatim excerpt from the candidate's answer. Validation checks it is really there. */
export type Evidence = { questionId: string; quote: string };

export type Finding = {
  competencyId: string;
  evidence: Evidence[];
  /** The reviewer's reading of the evidence. Kept separate from it. */
  interpretation: string;
  rating: Rating;
  /** What to ask next. An "insufficient" rating should always have one. */
  followUps: string[];
  /** How sure the reviewer is, where that is meaningful. */
  confidence?: "low" | "medium" | "high";
};

export type Evaluation = {
  assessmentId: string;
  rubricVersion: string;
  findings: Finding[];
  /** Shared with the client alongside the findings. */
  summaryForClient: string;
  /** TALYNT-only. Removed by clientView() before anything reaches a client. */
  internalNotes: string;
  reviewer: { status: "draft" | "reviewed"; by: "TALYNT recruiter"; reviewedAt: string | null };
};
