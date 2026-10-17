import { ROLES } from "@/lib/candidate/roles";
import { EMPTY_PASSPORT, type Passport } from "@/lib/candidate/passport-shape";
import { buildAssessment } from "./generate";
import { profileVersion } from "./profile";
import type { Assessment, Evaluation, Response } from "./types";

/**
 * DEMONSTRATION — for the employer-facing views only.
 *
 * The role is real and its assessment is built by the real engine from the
 * role's real requirements. The candidate, their answers and the evaluation
 * are fictional, written to show the format, and every view that uses them
 * says so. Nothing here is, or should be presented as, a TALYNT submission.
 *
 * The evaluation passes the same rules a real one must (see validateEvaluation):
 * every piece of evidence is quoted word for word from an answer.
 */

export const DEMO_ROLE = ROLES.find((r) => r.slug === "staff-data-engineer-fintech")!;

export const DEMO_CANDIDATE = {
  ref: "Candidate 0231",
  profile: {
    ...EMPTY_PASSPORT,
    profileId: "prof-demo-0231",
    headline: "Data engineer · payments and regulatory reporting",
    skills: ["Kafka", "dbt", "Python", "Snowflake", "Airflow"],
    experience: [
      {
        id: "demo-exp-1",
        title: "Senior data engineer",
        organisation: "A payments company",
        from: "2020",
        to: "Now",
        summary: "Built and ran the Kafka and dbt pipeline that finance, risk and regulatory reporting depended on.",
      },
      {
        id: "demo-exp-2",
        title: "Data engineer",
        organisation: "A lending start-up",
        from: "2017",
        to: "2020",
        summary: "Moved month-end reporting from spreadsheets to a warehouse, and owned reconciliation against the bank.",
      },
    ],
  } satisfies Passport,
};

const built = buildAssessment({
  role: DEMO_ROLE,
  profile: DEMO_CANDIDATE.profile,
  profileVersion: profileVersion(DEMO_CANDIDATE.profile),
  applicationId: "app-demo-0231",
  assessmentId: "asm-demo-0231",
  now: "2026-10-14T09:30:00.000Z",
});
if (!built.ok) throw new Error(`The demonstration assessment did not build: ${built.reason}`);

export const DEMO_ASSESSMENT: Assessment = built.assessment;

const ANSWERS: Record<string, string> = {
  "de.infrastructure.exp":
    "At a payments company I built the event pipeline that carried every transaction from our Kafka topics into the warehouse, and the dbt models that finance, risk and the regulatory reporting team all read from. Within six months four teams depended on it. The first time it let them down was a late batch from a card network: the daily totals published at 6am were short, and finance had already sent them on. I owned the incident, but the real fix was a design change. I added a completeness check that held publication until each upstream source had reported, and a status page that told consumers when a table was final. They cared more about knowing when to trust a number than about it arriving early.",
  "de.correctness.exp":
    "At a lending start-up our month-end loan book total was a few thousand rupees off the bank statement, and everyone treated it as rounding. I traced it to repayments posted after midnight UTC but before midnight IST, which landed in different months depending on which system you asked. I rebuilt reconciliation as a daily job that compared ledger, bank and warehouse totals for each day and failed loudly on any gap above zero, with the records that caused it attached. After that, a discrepancy showed up the next morning with its cause, rather than at month end.",
  "de.position.scn":
    "I would start by asking what the regulation actually requires and by when, because retention can mean deletion, masking or restricted access, and those cost very different amounts. Then I would set out the options in each function's terms: for compliance, which option meets the rule and how we would evidence it; for finance, what each costs to run; for engineering, what it does to the two pipelines and their on-call load. I would probably recommend that we apply the rule at the storage layer once rather than in each pipeline, so both inherit it. And I would say plainly what I don't know yet.",
};

export const DEMO_RESPONSES: Record<string, Response> = Object.fromEntries(
  DEMO_ASSESSMENT.questions.map((q) => [q.id, { questionId: q.id, text: ANSWERS[q.id] ?? "", updatedAt: "2026-10-15T18:20:00.000Z" }]),
);

export const DEMO_EVALUATION: Evaluation = {
  assessmentId: DEMO_ASSESSMENT.id,
  rubricVersion: DEMO_ASSESSMENT.rubricVersion,
  findings: [
    {
      competencyId: "infrastructure",
      evidence: [
        { questionId: "de.infrastructure.exp", quote: "the dbt models that finance, risk and the regulatory reporting team all read from" },
        { questionId: "de.infrastructure.exp", quote: "I added a completeness check that held publication until each upstream source had reported" },
      ],
      interpretation:
        "First-hand ownership of a pipeline several teams depended on, including a failure and a design response aimed at the people downstream. Its scale, and how long it ran in this form, aren't stated.",
      rating: "strong",
      followUps: ["How did the completeness check behave when one source was permanently late?"],
      confidence: "medium",
    },
    {
      competencyId: "correctness",
      evidence: [
        { questionId: "de.correctness.exp", quote: "I traced it to repayments posted after midnight UTC but before midnight IST" },
        { questionId: "de.correctness.exp", quote: "failed loudly on any gap above zero" },
      ],
      interpretation:
        "Treats a small discrepancy as a defect, finds the root cause and puts a recurring check in place — directly the role's point that a nearly-right number is wrong.",
      rating: "strong",
      followUps: [],
      confidence: "high",
    },
    {
      competencyId: "position",
      evidence: [
        { questionId: "de.position.scn", quote: "what the regulation actually requires and by when" },
        { questionId: "de.position.scn", quote: "apply the rule at the storage layer once rather than in each pipeline" },
      ],
      interpretation:
        "Frames the options in each function's terms and makes a recommendation. This was answered as a scenario, so there is no evidence yet of holding a position under real pushback.",
      rating: "clear",
      followUps: ["Ask for a real example of disagreeing with compliance or finance, and how it ended."],
      confidence: "medium",
    },
  ],
  summaryForClient:
    "Strong evidence on building infrastructure others depend on, and on correctness. The cross-functional competency was answered as a scenario — worth exploring with a real example in the Head of Data conversation.",
  internalNotes: "Asked about notice period flexibility in the first conversation; confirm before the next step.",
  reviewer: { status: "reviewed", by: "TALYNT recruiter", reviewedAt: "2026-10-16T15:00:00.000Z" },
};
