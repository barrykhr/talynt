import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ROLES, type Role } from "@/lib/candidate/roles";
import { EMPTY_PASSPORT, type Passport } from "@/lib/candidate/passport-shape";
import { DEFINITIONS, definitionFor } from "./bank";
import { buildAssessment, type BuildInput } from "./generate";
import { profileVersion } from "./profile";
import { requirementsVersion } from "./requirements";
import { clientView, completeness, validateEvaluation } from "./evaluate";
import { toSubmission, verifySubmission } from "./submission";
import { errorsIn, screen, validateDefinition } from "./validate";
import type { Assessment, AssessmentDefinition, Evaluation, Response } from "./types";

const role = (slug: string) => ROLES.find((r) => r.slug === slug)!;
const DATA = role("staff-data-engineer-fintech");

const passport = (patch: Partial<Passport> = {}): Passport => ({ ...EMPTY_PASSPORT, ...patch });
const entry = (id: string, title: string, summary: string) => ({ id, title, organisation: "A payments company", from: "2021", to: "2024", summary });

function build(r: Role, p: Passport | null, extra: Partial<BuildInput> = {}) {
  return buildAssessment({
    role: r,
    profile: p,
    profileVersion: p ? profileVersion(p) : null,
    applicationId: "app-1",
    assessmentId: "asm-1",
    now: "2026-10-17T09:00:00.000Z",
    ...extra,
  });
}

function built(r: Role, p: Passport | null): Assessment {
  const result = build(r, p);
  assert.ok(result.ok, `expected an assessment for ${r.slug}: ${JSON.stringify(!result.ok && result.issues)}`);
  return result.assessment;
}

describe("reviewed material", () => {
  it("exists for every role and passes validation against the role as it is now", () => {
    for (const r of ROLES) {
      const definition = definitionFor(r.slug);
      assert.ok(definition, `no material for ${r.slug}`);
      assert.deepEqual(errorsIn(validateDefinition(definition, r)), [], r.slug);
    }
    assert.equal(DEFINITIONS.length, ROLES.length);
  });

  it("grounds every essential requirement in a competency", () => {
    for (const r of ROLES) {
      const definition = definitionFor(r.slug)!;
      r.lookingFor.essential.forEach((_, i) =>
        assert.ok(definition.competencies.some((c) => c.from.some((g) => g.kind === "essential" && g.index === i)), `${r.slug} essential ${i}`),
      );
    }
  });

  it("rejects questions about protected characteristics, confidential information, paid tools or time limits", () => {
    assert.ok(screen("How old are you, and are you married?"));
    assert.ok(screen("Please share your source code from your current role."));
    assert.ok(screen("You will need to purchase a licence to complete this."));
    assert.ok(screen("Answer within 10 minutes."));
    assert.equal(screen("Describe how you would debug a race condition in a payments pipeline."), null);
    assert.equal(screen("Tell us about a team you built while the company doubled."), null);
  });

  it("blocks material with a bad question, a missing alternative or an ungrounded competency", () => {
    const base = structuredClone(definitionFor(DATA.slug)!) as AssessmentDefinition;

    const bad = structuredClone(base);
    bad.questions[0].prompt = "Before we begin, what is your date of birth and where did you grow up as a child?";
    assert.ok(errorsIn(validateDefinition(bad, DATA)).some((i) => i.code === "protected-characteristic"));

    const noAlternative = structuredClone(base);
    noAlternative.questions = noAlternative.questions.filter((q) => q.id !== "de.correctness.fn");
    assert.ok(errorsIn(validateDefinition(noAlternative, DATA)).some((i) => i.code === "missing-alternative"));

    const ungrounded = structuredClone(base);
    ungrounded.competencies[0].from = [{ kind: "skill", skill: "Spark" }];
    assert.ok(errorsIn(validateDefinition(ungrounded, DATA)).some((i) => i.code === "ungrounded"));

    const unknownSkill = structuredClone(base);
    unknownSkill.competencies[0].from = [{ kind: "essential", index: 0 }, { kind: "skill", skill: "COBOL" }];
    assert.ok(errorsIn(validateDefinition(unknownSkill, DATA)).some((i) => i.code === "ungrounded"));
  });
});

describe("building an assessment", () => {
  it("is deterministic, so building it again never produces a different one", () => {
    const p = passport({ experience: [entry("x1", "Data engineer", "Built the Kafka pipeline the reporting team depended on.")] });
    assert.deepEqual(build(DATA, p), build(DATA, p));
  });

  it("offers scenarios, not penalties, when the profile shows no relevant experience", () => {
    const a = built(DATA, null);
    assert.equal(a.questions.length, 3);
    assert.ok(a.questions.every((q) => q.kind !== "experience"));
    assert.ok(Object.values(a.pointers).every((p) => p === null));
    assert.equal(a.profileVersion, null);
  });

  it("points an experience question at the candidate's own relevant entry", () => {
    const p = passport({ experience: [entry("x1", "Data engineer", "Built the Kafka pipeline and the warehouse the finance team depended on.")] });
    const a = built(DATA, p);
    const q = a.questions.find((x) => x.competencyIds.includes("infrastructure"))!;
    assert.equal(q.kind, "experience");
    assert.deepEqual(a.pointers[q.id], { experienceId: "x1", label: "Data engineer, A payments company" });
    assert.equal(a.profileVersion, profileVersion(p));
  });

  it("always keeps at least one scenario, even when every competency matches the profile", () => {
    const p = passport({
      experience: [
        entry("x1", "Data engineer", "Built the Kafka pipeline and warehouse other teams depended on."),
        entry("x2", "Analytics engineer", "Owned reconciliation and data quality for regulatory reporting."),
        entry("x3", "Lead", "Worked with compliance and finance on audit and governance."),
      ],
    });
    const a = built(DATA, p);
    assert.ok(a.questions.some((q) => q.kind !== "experience"));
    assert.ok(a.questions.some((q) => q.kind === "experience"));
  });

  it("ignores who the candidate is — only their experience is read", () => {
    const experience = [entry("x1", "Data engineer", "Built the Kafka pipeline other teams depended on.")];
    const a = build(DATA, passport({ name: "A. Person", email: "a@example.com", currentLocationId: "pune", experience }), { profileVersion: "v" });
    const b = build(DATA, passport({ name: "Someone Else", email: "b@example.com", currentLocationId: "london", experience }), { profileVersion: "v" });
    assert.deepEqual(a, b);
  });

  it("builds a different assessment for each role from one reusable profile", () => {
    const p = passport({ experience: [entry("x1", "Engineer", "Built a platform and pipeline used by product teams.")] });
    const sets = ROLES.map((r) => built(r, p).questions.map((q) => q.id).join("|"));
    assert.equal(new Set(sets).size, ROLES.length);
  });

  it("refuses to build when the role's requirements have changed since the material was written", () => {
    const changed: Role = { ...DATA, lookingFor: { ...DATA.lookingFor, essential: [...DATA.lookingFor.essential, "A new essential requirement."] } };
    assert.notEqual(requirementsVersion(changed), requirementsVersion(DATA));
    const result = build(changed, null);
    assert.equal(result.ok, false);
    assert.equal(!result.ok && result.reason, "requirements-changed");
  });

  it("can be set to serve only approved material", () => {
    const result = build(DATA, null, { requireApproved: true });
    assert.equal(!result.ok && result.reason, "awaiting-review");
  });
});

describe("profile versions", () => {
  it("are stable, ignore the save timestamp and change when the content changes", () => {
    const a = passport({ headline: "Data engineer", skills: ["Kafka"] });
    assert.equal(profileVersion(a), profileVersion({ ...a, updatedAt: "2026-01-01T00:00:00.000Z" }));
    assert.notEqual(profileVersion(a), profileVersion({ ...a, skills: ["Kafka", "dbt"] }));
  });
});

const answers = (a: Assessment, text = "I owned the reconciliation job and traced every figure to its source before the report went out.") =>
  Object.fromEntries(a.questions.map((q) => [q.id, { questionId: q.id, text, updatedAt: "2026-10-17T10:00:00.000Z" } satisfies Response]));

describe("submission", () => {
  it("verifies an untampered assessment and says whether it is current", () => {
    const a = built(DATA, null);
    const result = verifySubmission(toSubmission(a, answers(a)), DATA);
    assert.ok(result.ok);
    assert.equal(result.ok && result.value.stale, false);
    assert.ok(result.ok && result.value.answers.every((x) => x.matchesCurrentMaterial && x.competencyIds.length > 0));
  });

  it("rejects questions that do not belong to the role, missing answers and over-long answers", () => {
    const a = built(DATA, null);
    const ok = toSubmission(a, answers(a));
    assert.equal(verifySubmission({ ...ok, answers: [{ questionId: "fs.change.exp", prompt: "x", response: "y" }] }, DATA).ok, false);
    assert.equal(verifySubmission({ ...ok, roleSlug: "design-lead-consumer" }, DATA).ok, false);
    assert.equal(verifySubmission(toSubmission(a, {}), DATA).ok, false);
    assert.equal(verifySubmission(toSubmission(a, answers(a, "word ".repeat(700))), DATA).ok, false);
    assert.equal(verifySubmission(null, DATA).ok, false);
  });

  it("flags an assessment built against older requirements instead of passing it off as current", () => {
    const a = built(DATA, null);
    const result = verifySubmission({ ...toSubmission(a, answers(a)), requirementsVersion: "req-00000000" }, DATA);
    assert.ok(result.ok && result.value.stale);
    assert.equal(result.ok && result.value.current.requirementsVersion, requirementsVersion(DATA));
  });

  it("marks, rather than trusts, a prompt that differs from the reviewed material", () => {
    const a = built(DATA, null);
    const sub = toSubmission(a, answers(a));
    sub.answers[0].prompt = "An altered prompt.";
    const result = verifySubmission(sub, DATA);
    assert.ok(result.ok && result.value.answers[0].matchesCurrentMaterial === false);
  });
});

describe("evaluation", () => {
  const a = built(DATA, null);
  const r = answers(a);
  const base: Evaluation = {
    assessmentId: a.id,
    rubricVersion: a.rubricVersion,
    findings: [
      {
        competencyId: a.questions[0].competencyIds[0],
        evidence: [{ questionId: a.questions[0].id, quote: "traced every figure to its source" }],
        interpretation: "Relevant evidence of traceability. How they would migrate consumers remains unclear.",
        rating: "clear",
        followUps: ["How would you sequence moving consumers off the old pipelines?"],
      },
    ],
    summaryForClient: "",
    internalNotes: "Recruiter-only note.",
    reviewer: { status: "draft", by: "TALYNT recruiter", reviewedAt: null },
  };

  it("accepts evidence quoted from the answer and reports facts, not judgements, on completeness", () => {
    assert.deepEqual(errorsIn(validateEvaluation(base, a, r)), []);
    assert.equal(completeness(a, r).complete, true);
    assert.equal(completeness(a, {}).answered, 0);
  });

  it("rejects evidence that is not in the answer, and 'not enough to judge' without a follow-up", () => {
    const invented = structuredClone(base);
    invented.findings[0].evidence[0].quote = "led a migration of forty pipelines";
    assert.ok(errorsIn(validateEvaluation(invented, a, r)).some((i) => i.code === "evidence-not-found"));

    const noFollowUp = structuredClone(base);
    noFollowUp.findings[0] = { ...noFollowUp.findings[0], rating: "insufficient", evidence: [], followUps: [] };
    assert.ok(errorsIn(validateEvaluation(noFollowUp, a, r)).some((i) => i.code === "follow-up"));

    const otherRubric = { ...base, rubricVersion: "rub-00000000" };
    assert.ok(errorsIn(validateEvaluation(otherRubric, a, r)).some((i) => i.code === "rubric-version"));
  });

  it("never passes TALYNT's internal notes to a client", () => {
    assert.equal("internalNotes" in clientView(base), false);
  });
});

describe("the employer-view demonstration", async () => {
  const { DEMO_ASSESSMENT, DEMO_EVALUATION, DEMO_RESPONSES } = await import("./demo");

  it("is built by the real engine, and its evaluation passes the rules a real one must", () => {
    assert.deepEqual(
      DEMO_ASSESSMENT.questions.map((q) => q.id),
      ["de.infrastructure.exp", "de.correctness.exp", "de.position.scn"],
    );
    assert.deepEqual(errorsIn(validateEvaluation(DEMO_EVALUATION, DEMO_ASSESSMENT, DEMO_RESPONSES)), []);
    assert.equal(completeness(DEMO_ASSESSMENT, DEMO_RESPONSES).complete, true);
  });
});
