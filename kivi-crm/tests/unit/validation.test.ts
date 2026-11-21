import { describe, expect, it } from "vitest";
import { activitySchema, companySchema, contactSchema, emailComposeSchema, opportunitySchema, requirementSchema } from "@/lib/validation";

const uuid = "4b0f8f0e-2a3c-4d5e-8f9a-0b1c2d3e4f50";

describe("server-side validation", () => {
  it("requires a company name and normalises website to domain-friendly URL", () => {
    expect(companySchema.safeParse({ name: "" }).success).toBe(false);
    const ok = companySchema.parse({ name: "Acme", website: "acme.com", owner_id: "" });
    expect(ok).toMatchObject({ name: "Acme", website: "https://acme.com/", owner_id: null, msa_status: "not_started" });
    expect(companySchema.safeParse({ name: "Acme", website: "javascript:alert(1)" }).success).toBe(false);
    expect(companySchema.safeParse({ name: "Acme", owner_id: "not-a-uuid" }).success).toBe(false);
  });

  it("validates contact email and phone", () => {
    expect(contactSchema.safeParse({ full_name: "A", email: "bad" }).success).toBe(false);
    expect(contactSchema.parse({ full_name: "A", email: "A@B.COM" }).email).toBe("a@b.com");
  });

  it("requires a loss reason for lost opportunities", () => {
    const r = opportunitySchema.safeParse({ company_id: uuid, title: "Deal", stage: "lost" });
    expect(r.success).toBe(false);
    expect(opportunitySchema.safeParse({ company_id: uuid, title: "Deal", stage: "lost", loss_reason: "Budget" }).success).toBe(true);
    expect(opportunitySchema.safeParse({ company_id: uuid, title: "Deal", stage: "not_a_stage" }).success).toBe(false);
  });

  it("keeps placements within hiring volume", () => {
    expect(requirementSchema.safeParse({ company_id: uuid, role_title: "QA", hiring_volume: "2", positions_filled: "3" }).success).toBe(false);
    expect(requirementSchema.parse({ company_id: uuid, role_title: "QA", hiring_volume: "", positions_filled: "" })).toMatchObject({ hiring_volume: 1, positions_filled: 0 });
  });

  it("requires links for activities and owner + due date for tasks", () => {
    expect(activitySchema.safeParse({ type: "note", subject: "x" }).success).toBe(false);
    expect(activitySchema.safeParse({ type: "task", subject: "x", company_id: uuid }).success).toBe(false);
    const ok = activitySchema.parse({ type: "task", subject: "x", company_id: uuid, owner_id: uuid, due_at: "2026-12-01T10:00" });
    expect(ok.due_at).toBe("2026-12-01T04:30:00.000Z"); // 10:00 IST
  });

  it("rejects multi-line email subjects and bad recipients", () => {
    expect(emailComposeSchema.safeParse({ to: "a@b.com", subject: "Hi\nBcc: x@y.z", body: "b", contact_id: uuid }).success).toBe(false);
    expect(emailComposeSchema.safeParse({ to: "a@b.com, nope", subject: "Hi", body: "b" }).success).toBe(false);
    expect(emailComposeSchema.parse({ to: "A@B.com; c@d.com", subject: "Hi", body: "b" }).to).toEqual(["a@b.com", "c@d.com"]);
  });
});
