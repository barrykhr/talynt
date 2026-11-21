import { describe, expect, it } from "vitest";
import { autoMap, normalizeRow, planRows, summarize, type ExistingCompanyMatch } from "@/lib/import/plan";
import { parseSpreadsheet } from "@/lib/import/parse";

const team = [{ id: "u-asha", email: "asha@kivitronicsconsulting.com", full_name: "Asha Rao" }];
const headers = ["Company", "Website", "Contact Name", "Designation", "Email", "Hiring For", "Openings", "City", "Lead Source", "Owner", "Follow up", "Remarks"];

function rows(data: string[][]) {
  const mapping = autoMap(headers);
  return data.map((r, i) => normalizeRow(r, i + 2, mapping, "leads", team, "u-me", headers));
}

describe("column mapping", () => {
  it("recognises common headings", () => {
    const m = autoMap(headers);
    expect(m).toMatchObject({ company_name: 0, company_website: 1, contact_name: 2, contact_role: 3, contact_email: 4, hiring_need: 5, hiring_volume: 6, location: 7, source: 8, owner: 9, follow_up: 10, notes: 11 });
  });
});

describe("row validation and normalisation", () => {
  it("normalises values and reports problems without guessing", () => {
    const [r] = rows([["Acme Pvt Ltd", "www.acme.com", "Priya Rao", "HR Head", "PRIYA@ACME.COM", "Java devs", "5 roles", "Pune", "Linked In", "Asha", "15/12/2026", "Met at Nasscom"]]);
    expect(r.errors).toEqual([]);
    expect(r).toMatchObject({
      company: { name: "Acme Pvt Ltd", domain: "acme.com", location: "Pune" },
      contact: { full_name: "Priya Rao", email: "priya@acme.com", role_title: "HR Head" },
      opportunity: { hiring_need: "Java devs", hiring_volume: 5, next_follow_up_on: "2026-12-15" },
      source: "linkedin", owner_id: "u-asha", notes: "Met at Nasscom",
    });
  });

  it("fails rows missing required fields and warns about bad optional values", () => {
    const [missing, bad] = rows([
      ["", "", "No Company Person", "", "", "", "", "", "", "", "", ""],
      ["Beta", "", "", "", "not-an-email", "", "lots", "", "", "Unknown Person", "someday", ""],
    ]);
    expect(missing.errors.length).toBeGreaterThan(0);
    expect(bad.errors).toEqual([]);
    expect(bad.contact.email).toBeNull();
    expect(bad.opportunity.hiring_volume).toBeNull();
    expect(bad.opportunity.next_follow_up_on).toBeNull();
    expect(bad.owner_id).toBe("u-me");
    expect(bad.warnings.join(" ")).toMatch(/email.*volume.*Owner|email/);
    expect(bad.source).toBe("spreadsheet");
  });

  it("stores formula-looking cells as inert text", () => {
    const [r] = rows([["=HYPERLINK(\"http://evil\",\"Acme\")", "", "", "", "", "", "", "", "", "", "", "=1+1"]]);
    expect(r.company.name).toBe("=HYPERLINK(\"http://evil\",\"Acme\")");
    expect(r.notes).toBe("=1+1");
  });
});

describe("duplicate handling", () => {
  const data = [
    ["Acme Pvt Ltd", "acme.com", "Priya Rao", "", "priya@acme.com", "", "", "", "", "", "", ""],
    ["Acme Solutions", "", "Ravi", "", "ravi@acmesol.com", "", "", "", "", "", "", ""],
    ["New Co", "", "Dev", "", "priya@acme.com", "", "", "", "", "", "", ""],
    ["Fresh Ltd", "", "Sam", "", "sam@fresh.io", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", "", "", ""],
  ];
  const normalized = rows(data);
  const companyMatches = new Map<number, ExistingCompanyMatch>([
    [0, { company_id: "co-acme", name: "Acme Private Limited", domain: "acme.com", reason: "same_domain" }],
    [1, { company_id: "co-acme", name: "Acme Private Limited", domain: "acme.com", reason: "similar_name" }],
  ]);
  const contacts = new Map([["priya@acme.com", { contact_id: "ct-priya", full_name: "Priya Rao", email: "priya@acme.com" }]]);
  const plan = planRows(normalized, companyMatches, contacts, "leads");

  it("flags existing companies and contacts for a user decision, never overwriting", () => {
    expect(plan[0]).toMatchObject({ needsDecision: true, defaultDecision: "link", allowedDecisions: ["link", "skip"] });
    expect(plan[0].existingContact?.contact_id).toBe("ct-priya");
  });
  it("only offers 'create anyway' for similar names, not same-domain matches", () => {
    expect(plan[1].allowedDecisions).toEqual(["link", "create", "skip"]);
    expect(plan[0].allowedDecisions).not.toContain("create");
  });
  it("detects repeats within the file and defaults them to skip", () => {
    expect(plan[2]).toMatchObject({ duplicateInFileOf: 2, needsDecision: true, defaultDecision: "skip" });
  });
  it("passes clean rows and skips invalid ones", () => {
    expect(plan[3]).toMatchObject({ needsDecision: false, defaultDecision: "link" });
    expect(plan[4]).toMatchObject({ allowedDecisions: ["skip"], defaultDecision: "skip" });
    expect(summarize(plan)).toEqual({ total: 5, invalid: 1, duplicates: 3, warnings: 0, ready: 1 });
  });
});

describe("file parsing", () => {
  const file = (content: string, name: string) => new File([content], name, { type: "text/csv" });
  it("reads CSV as plain text, including formula-looking cells", async () => {
    const sheet = await parseSpreadsheet(file("Company,Notes\n\"Acme, Inc\",=cmd|' /C calc'!A0\n,\n", "leads.csv"));
    expect(sheet.headers).toEqual(["Company", "Notes"]);
    expect(sheet.rows).toEqual([["Acme, Inc", "=cmd|' /C calc'!A0"]]);
  });
  it("rejects unsupported, empty and disguised files", async () => {
    await expect(parseSpreadsheet(file("", "x.csv"))).rejects.toThrow(/empty/);
    await expect(parseSpreadsheet(file("Company\n", "x.csv"))).rejects.toThrow(/header/);
    await expect(parseSpreadsheet(file("abc", "x.xls"))).rejects.toThrow(/xlsx/);
    await expect(parseSpreadsheet(file("not a zip", "x.xlsx"))).rejects.toThrow(/valid/);
    await expect(parseSpreadsheet(file("MZ", "x.exe"))).rejects.toThrow(/csv or .xlsx/i);
  });
});

describe("xlsx parsing", () => {
  it("reads values and never evaluates formulas", async () => {
    const { readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const buf = readFileSync(path.resolve(__dirname, "../fixtures/formula-test.xlsx"));
    const sheet = await parseSpreadsheet(new File([buf], "leads.xlsx"));
    expect(sheet.headers).toEqual(["Company", "Contact Name", "Email", "Openings", "Follow up", "Notes"]);
    expect(sheet.rows[0]).toEqual(["Acme Pvt Ltd", "Priya Rao", "priya@acme.com", "5", "2026-12-15", "Plain note"]);
    // "=2+3" was written without a cached result: it must come back empty, not "5".
    expect(sheet.rows[1][3]).not.toBe("5");
    expect(sheet.rows[1][5]).not.toMatch(/click/);
  });
});

describe("import payload contract", () => {
  it("accepts a partial column mapping and rejects bad input", async () => {
    const { importInputSchema, importDecisionsSchema } = await import("@/lib/import/schema");
    const base = { kind: "leads", filename: "a.csv", headers: ["Company"], rows: [["Acme"]], mapping: { company_name: 0 }, ownerMode: "me" };
    expect(importInputSchema.safeParse(base).success).toBe(true);
    expect(importInputSchema.safeParse({ ...base, mapping: { not_a_field: 0 } }).success).toBe(false);
    expect(importInputSchema.safeParse({ ...base, kind: "everything" }).success).toBe(false);
    expect(importInputSchema.safeParse({ ...base, rows: Array(2001).fill(["x"]) }).success).toBe(false);
    expect(importDecisionsSchema.safeParse({ "2": "link", "3": "overwrite" }).success).toBe(false);
  });
});
