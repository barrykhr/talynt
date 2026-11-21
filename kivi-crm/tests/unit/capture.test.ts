import { describe, expect, it } from "vitest";
import { allowedOrigin, captureSchema, spamReason } from "@/lib/capture";

describe("website lead capture", () => {
  const good = { name: "Priya Rao", email: "Priya@Acme.com", company: "Acme", role_needed: "Data engineers", hiring_volume: "3", form_started_at: String(Date.now() - 20000) };
  it("validates and normalises submissions", () => {
    const v = captureSchema.parse(good);
    expect(v).toMatchObject({ email: "priya@acme.com", hiring_volume: 3, company: "Acme" });
    expect(captureSchema.safeParse({ ...good, email: "nope" }).success).toBe(false);
    expect(captureSchema.safeParse({ ...good, name: "" }).success).toBe(false);
  });
  it("detects honeypot, too-fast and link-stuffed submissions", () => {
    expect(spamReason(captureSchema.parse(good))).toBeNull();
    expect(spamReason(captureSchema.parse({ ...good, website_url: "http://spam" }))).toBe("honeypot");
    expect(spamReason(captureSchema.parse({ ...good, form_started_at: String(Date.now() - 500) }))).toBe("too_fast");
    expect(spamReason(captureSchema.parse({ ...good, message: "https://a https://b https://c https://d" }))).toBe("too_many_links");
  });
  it("only accepts configured origins for browser posts", () => {
    expect(allowedOrigin("https://kivitronicsconsulting.com", "https://kivitronicsconsulting.com,https://www.kivitronicsconsulting.com")).toBe(true);
    expect(allowedOrigin("https://evil.example", "https://kivitronicsconsulting.com")).toBe(false);
    expect(allowedOrigin(null, "")).toBe(true);
  });
});
