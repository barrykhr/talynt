import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { csvCell, toCsv } from "@/lib/csv";
import { decryptSecret, encryptSecret, signState, verifyState } from "@/lib/crypto";
import { redact } from "@/lib/log";
import { buildRawMessage, parseAddressList, sanitizeHeader } from "@/lib/google/mime";

describe("open-redirect protection", () => {
  it("allows only same-site paths", () => {
    expect(safeRedirectPath("/companies/1?x=2")).toBe("/companies/1?x=2");
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "\\\\evil.com", "javascript:alert(1)", "/%0d%0aSet-Cookie", "/auth/callback", "/api/export/companies", 42, null]) {
      expect(safeRedirectPath(bad, "/")).not.toMatch(/evil|javascript|auth|api/);
    }
    expect(safeRedirectPath("/\u0000x")).toBe("/");
  });
});

describe("CSV export", () => {
  it("neutralises spreadsheet formulas (CSV injection)", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe("\"'=HYPERLINK(\"\"http://evil\"\")\"");
    expect(csvCell("+91 98765")).toBe("'+91 98765");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("plain")).toBe("plain");
  });
  it("quotes commas, quotes and newlines and adds a BOM", () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    expect(toCsv(["A"], [["x"]]).startsWith("﻿A\r\n")).toBe(true);
  });
});

describe("token encryption and OAuth state", () => {
  const key = randomBytes(32);
  it("round-trips and detects tampering", () => {
    const env = encryptSecret("1//refresh-token-value", key);
    expect(env).not.toContain("refresh");
    expect(decryptSecret(env, key)).toBe("1//refresh-token-value");
    const tampered = env.slice(0, -2) + (env.endsWith("A") ? "B" : "A") + env.slice(-1);
    expect(() => decryptSecret(tampered, key)).toThrow();
    expect(() => decryptSecret(env, randomBytes(32))).toThrow();
  });
  it("signs state and rejects forged or expired values", () => {
    const s = signState({ uid: "u1", nonce: "n" }, key);
    expect(verifyState(s, key)).toMatchObject({ uid: "u1", nonce: "n" });
    expect(verifyState(s, randomBytes(32))).toBeNull();
    const [body] = s.split(".");
    expect(verifyState(`${body}.forged`, key)).toBeNull();
    expect(verifyState(signState({ uid: "u1" }, key, -10), key)).toBeNull();
  });
});

describe("log redaction", () => {
  it("never writes tokens, secrets or message content", () => {
    const out = redact({ refresh_token: "1//abc", access: "ya29.a0AfH6SMB", body: "Dear client", nested: { authorization: "Bearer x", ok: "fine" } }) as Record<string, unknown>;
    expect(JSON.stringify(out)).not.toMatch(/1\/\/abc|ya29|Dear client|Bearer/);
    expect((out.nested as Record<string, unknown>).ok).toBe("fine");
  });
});

describe("email composition", () => {
  it("prevents header injection", () => {
    expect(sanitizeHeader("Hello\r\nBcc: victim@x.com")).toBe("Hello Bcc: victim@x.com");
    const raw = Buffer.from(buildRawMessage({ from: "me@kivitronicsconsulting.com", to: ["a@b.com"], subject: "Hi\r\nBcc: evil@x.com", body: "Body" }), "base64url").toString();
    expect(raw).not.toMatch(/\r\nBcc:/);
    expect(() => buildRawMessage({ from: "me@kivitronicsconsulting.com", to: ["a@b.com\r\nBcc: x@y.z"], subject: "s", body: "b" })).toThrow();
  });
  it("encodes non-ASCII subjects", () => {
    const raw = Buffer.from(buildRawMessage({ from: "me@kivitronicsconsulting.com", to: ["a@b.com"], subject: "Fees ₹ 8.33%", body: "ok" }), "base64url").toString();
    expect(raw).toMatch(/Subject: =\?UTF-8\?B\?/);
  });
  it("parses address lists", () => {
    expect(parseAddressList('"Rao, Priya" <Priya@Acme.com>, ravi@acme.com, bad')).toEqual([
      { email: "priya@acme.com", name: "Rao, Priya" },
      { email: "ravi@acme.com", name: null },
    ]);
  });
});
