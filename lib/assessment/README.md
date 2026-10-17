# Role-specific assessments

Every application to a role carries a short written assessment built for that
role. This folder is the engine: pure TypeScript with no React and no storage,
so the browser, the API route and the tests all run the same code.

```
types.ts         the model: profile ≠ application ≠ assessment; evaluation
requirements.ts  a role's requirements, and their version
bank.ts          PROPOSED — the reviewed material for each role
rubric.ts        the shared rubric levels, and a role's rubric version
profile.ts       which of a candidate's own experience entries are relevant
validate.ts      the quality gate every assessment passes before anyone sees it
generate.ts      builds one candidate's assessment for one application
evaluate.ts      the rules that keep an evaluation explainable
submission.ts    what is sent with an application, and how the server checks it
demo.ts          DEMONSTRATION data for the employer-facing views only
```

## How an assessment is built

1. **Requirements.** A role already separates what is essential, helpful and
   not required. Those lists, its skills and its description are the role's
   requirements; `requirementsVersion(role)` fingerprints them.
2. **Reviewed material.** `bank.ts` holds, per role, three competencies — each
   pointing at the essential requirement it comes from — and two equivalent
   questions per competency: one about the candidate's experience, one
   scenario. The material records the requirements version it was written for.
3. **Re-validation.** The material is checked against the role *as it is now*.
   If the role's requirements have changed since the material was written, the
   assessment is not built; the candidate is told it is unavailable rather than
   shown an assessment for a role that no longer exists.
4. **Profile analysis.** Only the candidate's experience entries are read (not
   their name, contact details, location or preferences), and only to find an
   entry relevant to each competency. Nothing leaves the browser.
5. **Question selection.** Per competency: the experience question when the
   profile shows relevant experience — with a pointer to that entry — and the
   equivalent scenario otherwise, so a gap in a CV is never penalised. Every
   assessment keeps at least one scenario. Usually three questions.
6. **Rubric.** The role's signals for each competency plus the shared levels;
   `rubricVersion` fingerprints them.
7. **Validation.** The built assessment is checked again before it is shown.

The result is a pure function of its inputs. The application store
(`lib/candidate/applications.ts`) builds it once, when an application is
started, and keeps it; reopening the page never builds a different one.

## The quality gate (`validate.ts`)

An assessment is blocked if any question:

- doesn't assess one of the role's competencies, or a competency isn't grounded
  in a requirement the role actually states;
- leaves an essential requirement unassessed;
- has no defined response format, no guidance on what a useful answer covers,
  or an unreasonable length;
- asks about protected characteristics or personal circumstances, asks for
  confidential information from an employer, needs a paid tool, or imposes a
  time limit.

It also refuses material whose competency has only an experience question (no
equivalent scenario). `requireApproved` additionally refuses material that
hasn't been approved — set `NEXT_PUBLIC_TALYNT_REQUIRE_APPROVED_ASSESSMENTS=1`
to serve only approved material.

## Versions, refreshes and resubmission

- An assessment stores the requirements version, rubric version, material
  revision and (when used) the profile version it was built from, plus a
  snapshot of its competencies, questions and rubric.
- **Before it is sent**, if the role's requirements or rubric change, the
  assessment is marked out of date and the candidate is asked to refresh it.
  Answers to questions that are still asked are kept.
- **After it is sent**, it never changes, and it stays labelled with the
  versions it was answered against.
- One application per role per device. A sent application can't be resent or
  edited from the site; an undelivered one points to email.
- **Server check** (`verifySubmission`): every question must belong to the
  role's material and every answer must be present and within its limit, or
  nothing is forwarded. If the versions are out of date, the forwarded payload
  says `stale: true` with the current versions. A prompt that differs from the
  current material is marked rather than trusted.

## Evaluation (`evaluate.ts`)

Written by a TALYNT reviewer against the role's rubric. Each finding has
verbatim evidence (validation checks every quote is really in the answer), the
reviewer's interpretation kept separate from it, a level — or "not enough to
judge", which must come with a follow-up question — and optional confidence.
There is no overall score and nothing decides anything. `clientView()` removes
TALYNT's internal notes before an evaluation is shared with a client.

Nothing in this repository writes evaluations automatically, and nothing here
calls a language model.

## Adding a model-assisted source

There is no model provider in this repository, and adding one is a decision
for TALYNT (provider, data-processing terms, prompt review). If one is added:

- send only what the role needs — the role's requirements, never the
  candidate's identity or contact details;
- treat its output as a draft `AssessmentDefinition`: it must pass
  `validateDefinition` and a person's review before `status: "approved"`;
- record it as a different `source` so assessments from it are distinguishable;
- if it is unavailable, keep the current behaviour: say so, never show an
  empty assessment.

## Reviewing the material

`bank.ts` is marked PROPOSED. To approve a role's material: read its
competencies, questions, guidance and signals against the role, set
`status: "approved"`, and raise `revision` whenever any of it is edited. When a
role's requirements change, `npm test` fails until someone re-checks the
material and updates `writtenFor`.
