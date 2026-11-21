import { describe, expect, it } from "vitest";
import { applyEvidenceRules, extractJson, normalizeUrl, providerResultSchema, slugFromLinkedIn } from "@/lib/research/schema";
import { buildResearchSystem, buildResearchUserText } from "@/lib/research/prompt";
import type { ResearchInput } from "@/lib/research/schema";

const now = new Date("2026-11-21T10:00:00Z");
const base = (findings: unknown[]) => providerResultSchema.parse({ about_brief: "Payroll SaaS.", draft_message: "Hi", findings });

describe("research evidence rules", () => {
  it("keeps source, title, dates and excerpt on every sourced claim", () => {
    const r = applyEvidenceRules(base([{
      category: "funding", statement: "Raised a Series B", evidence_kind: "reported_claim", confidence: "high",
      source_url: "https://news.example.com/b?utm_source=x#top", excerpt: "closed a Series B", published_on: "2026-10-02",
    }]), { retrieved: [{ url: "https://news.example.com/b", title: "Series B", pageAge: "2026-10-02" }], now, model: "m" });
    expect(r.findings[0]).toMatchObject({
      source_url: "https://news.example.com/b", source_title: "Series B", published_on: "2026-10-02",
      retrieved_at: now.toISOString(), excerpt: "closed a Series B", source_verified: true, evidence_kind: "reported_claim", confidence: "high",
    });
    expect(r.checked_at).toBe(now.toISOString());
  });

  it("never presents an unsourced statement as fact", () => {
    const r = applyEvidenceRules(base([{ category: "funding", statement: "Raised $50M", evidence_kind: "verified_fact", confidence: "high" }]),
      { retrieved: [], now, model: null });
    expect(r.findings[0]).toMatchObject({ evidence_kind: "inference", confidence: "low", source_verified: false });
    expect(r.findings[0].conflict_note).toMatch(/treated as an inference/);
    expect(r.warnings.join(" ")).toMatch(/had no source/);
  });

  it("downgrades citations the provider never actually retrieved", () => {
    const r = applyEvidenceRules(base([{ category: "about", statement: "HQ in Pune", evidence_kind: "verified_fact", confidence: "high",
      source_url: "https://made-up.example/about", excerpt: "based in Pune" }]),
      { retrieved: [{ url: "https://real.example/about", title: "About", pageAge: null }], now, model: null });
    expect(r.findings[0]).toMatchObject({ evidence_kind: "reported_claim", confidence: "medium", source_verified: false });
    expect(r.warnings.join(" ")).toMatch(/could not be matched/);
  });

  it("says when a provider can't report retrieved pages", () => {
    const r = applyEvidenceRules(base([{ category: "about", statement: "Founded 2015", evidence_kind: "reported_claim", confidence: "medium",
      source_url: "https://x.example/a", excerpt: "founded in 2015" }]), { retrieved: null, now, model: null });
    expect(r.findings[0].source_verified).toBe(false);
    expect(r.warnings.join(" ")).toMatch(/not cross-checked/);
  });

  it("drops future publication dates, fills dates from page age, caps inference confidence and removes duplicates", () => {
    const r = applyEvidenceRules(base([
      { category: "announcement", statement: "Launch", evidence_kind: "reported_claim", confidence: "medium", source_url: "https://a.example/1", excerpt: "launched", published_on: "2030-01-01" },
      { category: "announcement", statement: "Second", evidence_kind: "reported_claim", confidence: "medium", source_url: "https://a.example/2", excerpt: "x" },
      { category: "hiring", statement: "Likely scaling", evidence_kind: "inference", confidence: "high" },
      { category: "hiring", statement: "likely   SCALING", evidence_kind: "inference", confidence: "high" },
    ]), { retrieved: [{ url: "https://a.example/1", title: null, pageAge: null }, { url: "https://a.example/2", title: "Two", pageAge: "2026-09-15T00:00:00Z" }], now, model: null });
    expect(r.findings[0].published_on).toBeNull();
    expect(r.findings[1].published_on).toBe("2026-09-15");
    expect(r.findings[2].confidence).toBe("medium");
    expect(r.findings).toHaveLength(3);
  });

  it("coerces unknown enum values safely and rejects non-http URLs", () => {
    const parsed = providerResultSchema.parse({ findings: [{ category: "gossip", statement: "x", evidence_kind: "rumour", confidence: "certain", source_url: "javascript:alert(1)", excerpt: "e" }] });
    expect(parsed.findings[0]).toMatchObject({ category: "other", evidence_kind: "inference", confidence: "low" });
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    const r = applyEvidenceRules(parsed, { retrieved: [], now, model: null });
    expect(r.findings[0].source_url).toBeNull();
  });

  it("parses JSON wrapped in prose (ported agent behaviour) and LinkedIn slugs", () => {
    expect(extractJson('Here you go:\n{"a":1}\nThanks')).toEqual({ a: 1 });
    expect(() => extractJson("no json here")).toThrow();
    expect(slugFromLinkedIn("https://www.linkedin.com/company/acme-labs/about")).toBe("acme labs");
  });
});

describe("research prompt (ported from the outreach agent)", () => {
  const input: ResearchInput = {
    level: "company", company: { name: "Acme", website: "https://acme.example", linkedinUrl: null, location: "Pune" }, role: "Data engineer",
    location: "Pune", contact: null, crmContext: null, conversations: [], channel: "email",
    sender: { name: "Asha", company: "KiviTronics Consulting", pitch: "We hire fast", cta: "Call?" },
  };
  it("asks for per-claim evidence, forbids LinkedIn profiles and never sends", () => {
    const sys = buildResearchSystem(input);
    expect(sys).toMatch(/PERSONALISATION LEVEL: COMPANY/);
    expect(sys).toMatch(/"source_url"/);
    expect(sys).toMatch(/Never invent URLs/);
    expect(sys).toMatch(/never send anything/);
    expect(sys).toMatch(/not completed hires/);
  });
  it("sends only the minimal CRM context", () => {
    const text = buildResearchUserText(input);
    expect(text).toMatch(/Company name: Acme/);
    expect(text).not.toMatch(/Recent CRM-linked conversations/);
    const withConv = buildResearchUserText({ ...input, conversations: [{ date: "2026-11-01", channel: "email", subject: "Intro", direction: "outbound" }] });
    expect(withConv).toMatch(/metadata only/);
  });
});
