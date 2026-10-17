import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { ROLES } from "@/lib/candidate/roles";
import { buildAssessment } from "@/lib/assessment/generate";
import { toSubmission } from "@/lib/assessment/submission";
import { POST } from "./route";

/** A stand-in for the ATS webhook, recording exactly what the route forwards. */
let server: Server;
let received: Array<Record<string, unknown>> = [];
let webhook = "";

before(async () => {
  server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      received.push(JSON.parse(body));
      res.writeHead(200).end("{}");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  webhook = `http://127.0.0.1:${(server.address() as AddressInfo).port}/hook`;
});
after(() => server.close());
beforeEach(() => {
  received = [];
  delete process.env.CANDIDATE_WEBHOOK_URL;
  delete process.env.CONTACT_WEBHOOK_URL;
});

const role = ROLES.find((r) => r.slug === "security-engineer-platform")!;
const post = (body: unknown) =>
  POST(new Request("http://localhost/api/candidate-application", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }));

const base = {
  roleSlug: role.slug,
  roleTitle: role.title,
  name: "Test Candidate",
  email: "test.candidate@example.com",
  why: "The platform work and the identity problem are exactly what I want to work on next.",
  consentGiven: true,
};

function assessmentFor(text = "I narrowed the deploy role to the three actions it used, in stages, watching the audit log for denials.") {
  const result = buildAssessment({ role, profile: null, profileVersion: null, applicationId: "app-123456789", assessmentId: "asm-123456789", now: "2026-10-17T09:00:00.000Z" });
  assert.ok(result.ok);
  const a = result.assessment;
  return toSubmission(a, Object.fromEntries(a.questions.map((q) => [q.id, { questionId: q.id, text, updatedAt: "2026-10-17T10:00:00.000Z" }])));
}

describe("POST /api/candidate-application", () => {
  it("still refuses to claim success when no destination is configured", async () => {
    const res = await post({ ...base, assessment: assessmentFor() });
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { ok: false, fallback: true, error: "Application delivery is not configured for this deployment." });
    assert.equal(received.length, 0);
  });

  it("forwards the payload it always did when the new fields are absent", async () => {
    process.env.CANDIDATE_WEBHOOK_URL = webhook;
    const res = await post(base);
    assert.equal(res.status, 200);
    assert.equal(received.length, 1);
    for (const key of ["assessment", "applicationId", "profileId", "profileVersion", "profile"]) assert.equal(key in received[0], false, key);
  });

  it("forwards a verified assessment with its versions and the competency each answer speaks to", async () => {
    process.env.CANDIDATE_WEBHOOK_URL = webhook;
    const res = await post({ ...base, applicationId: "app-123456789", profileId: "prof-abcdefgh", profileVersion: "prof-1234abcd", assessment: assessmentFor() });
    assert.equal(res.status, 200);
    const sent = received[0] as { applicationId: string; profileId: string; assessment: { stale: boolean; roleSlug: string; answers: Array<{ competencyIds: string[] }> } };
    assert.equal(sent.applicationId, "app-123456789");
    assert.equal(sent.profileId, "prof-abcdefgh");
    assert.equal(sent.assessment.roleSlug, role.slug);
    assert.equal(sent.assessment.stale, false);
    assert.ok(sent.assessment.answers.every((a) => a.competencyIds.length > 0));
  });

  it("forwards nothing when the assessment does not belong to the role, or is unanswered", async () => {
    process.env.CANDIDATE_WEBHOOK_URL = webhook;
    const foreign = assessmentFor();
    foreign.answers[0].questionId = "fs.change.exp";
    assert.equal((await post({ ...base, assessment: foreign })).status, 422);
    assert.equal((await post({ ...base, assessment: assessmentFor("") })).status, 422);
    assert.equal((await post({ ...base, roleSlug: "not-a-role", assessment: assessmentFor() })).status, 422);
    assert.equal(received.length, 0);
  });

  it("drops ids that are not the shape a random id has", async () => {
    process.env.CANDIDATE_WEBHOOK_URL = webhook;
    await post({ ...base, applicationId: "<script>", profileId: "x" });
    assert.equal("applicationId" in received[0], false);
    assert.equal("profileId" in received[0], false);
  });
});
