import { describe, expect, it } from "vitest";
import {
  domainFromEmail, normalizeCompanyName, normalizeDomain, normalizeEmail, normalizeMsa, normalizePhone,
  normalizeRequirementStatus, normalizeSource, normalizeStage, parseDateLoose, parsePositiveInt,
} from "@/lib/normalize";

describe("normalisation", () => {
  it("normalises company names so legal suffixes don't create duplicates", () => {
    expect(normalizeCompanyName("Acme Pvt. Ltd.")).toBe("acme");
    expect(normalizeCompanyName("ACME Private Limited")).toBe("acme");
    expect(normalizeCompanyName("The Acme Company")).toBe("acme");
    expect(normalizeCompanyName("Tata & Sons")).toBe("tata and sons");
  });

  it("normalises domains and emails", () => {
    expect(normalizeDomain("https://www.Example.com/careers?x=1")).toBe("example.com");
    expect(normalizeDomain("")).toBeNull();
    expect(normalizeEmail("  Priya@Example.COM ")).toBe("priya@example.com");
    expect(normalizeEmail("mailto:a@b.co")).toBe("a@b.co");
    expect(normalizeEmail("not an email")).toBeNull();
    expect(normalizeEmail("a@b")).toBeNull();
    expect(domainFromEmail("x@Sub.Example.com")).toBe("sub.example.com");
  });

  it("keeps readable phone numbers and rejects junk", () => {
    expect(normalizePhone("+91 98765 43210")).toBe("+91 98765 43210");
    expect(normalizePhone("call me")).toBeNull();
  });

  it("maps common spreadsheet values to CRM vocabularies", () => {
    expect(normalizeSource("LinkedIn")).toBe("linkedin");
    expect(normalizeSource("Whats App")).toBe("whatsapp");
    expect(normalizeSource("Web form")).toBe("website");
    expect(normalizeSource("Trade show")).toBe("event");
    expect(normalizeSource("cold call")).toBe("other");
    expect(normalizeSource("")).toBeNull();
    expect(normalizeStage("Proposal / MSA")).toBe("proposal_msa");
    expect(normalizeStage("In discussion")).toBe("in_conversation");
    expect(normalizeStage("banana")).toBeNull();
    expect(normalizeMsa("Signed")).toBe("signed");
    expect(normalizeMsa("pending")).toBe("in_discussion");
    expect(normalizeRequirementStatus("Closed / filled")).toBe("closed_filled");
  });

  it("parses whole numbers and day-first dates", () => {
    expect(parsePositiveInt("5 roles")).toBe(5);
    expect(parsePositiveInt("1,200")).toBe(1200);
    expect(parsePositiveInt("zero")).toBeNull();
    expect(parseDateLoose("2026-03-04")).toBe("2026-03-04");
    expect(parseDateLoose("04/03/2026")).toBe("2026-03-04");
    expect(parseDateLoose("4-3-26")).toBe("2026-03-04");
    expect(parseDateLoose("31/02/2026")).toBeNull();
    expect(parseDateLoose("next week")).toBeNull();
  });
});
