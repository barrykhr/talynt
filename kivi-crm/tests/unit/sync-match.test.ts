import { describe, expect, it } from "vitest";
import { classify, externalParticipants } from "@/lib/google/match";
import { missingScopes, PRODUCT_SCOPES } from "@/lib/google/scopes";

const self = "maya@kivitronicsconsulting.com";
const contacts = [{ id: "c1", email: "priya@acme.com", company_id: "co1" }];
const companies = [{ id: "co1", domain: "acme.com" }, { id: "co2", domain: "zeta.io" }];

describe("which synced email/events are CRM-related", () => {
  it("ignores the mailbox owner and colleagues", () => {
    expect(externalParticipants([self, "ravi@kivitronicsconsulting.com", "x@acme.com"], self)).toEqual(["x@acme.com"]);
    expect(classify([self, "ravi@kivitronicsconsulting.com"], self, contacts, companies)).toEqual({ kind: "skip" });
  });
  it("logs mail with a known contact", () => {
    expect(classify([self, "Priya@acme.com"], self, contacts, companies)).toMatchObject({ kind: "logged", contactId: "c1", companyId: "co1" });
  });
  it("queues mail from a known company's domain for private review", () => {
    expect(classify([self, "new.person@zeta.io"], self, contacts, companies)).toMatchObject({ kind: "review", companyId: "co2" });
  });
  it("never logs personal or unrelated mail", () => {
    expect(classify([self, "friend@gmail.com"], self, contacts, [{ id: "x", domain: "gmail.com" }])).toEqual({ kind: "skip" });
    expect(classify([self, "news@shop.com"], self, contacts, companies)).toEqual({ kind: "skip" });
  });
});

describe("Google scopes", () => {
  it("requests metadata-only Gmail access, never full read access", () => {
    expect(PRODUCT_SCOPES.gmail).toContain("https://www.googleapis.com/auth/gmail.metadata");
    expect(PRODUCT_SCOPES.gmail.join(" ")).not.toMatch(/gmail\.readonly|mail\.google\.com|gmail\.modify/);
    expect(PRODUCT_SCOPES.calendar.join(" ")).not.toMatch(/auth\/calendar(\s|$)/);
  });
  it("detects unticked permissions", () => {
    expect(missingScopes("gmail", ["openid", "email", "https://www.googleapis.com/auth/gmail.send"])).toEqual(["https://www.googleapis.com/auth/gmail.metadata"]);
  });
});
