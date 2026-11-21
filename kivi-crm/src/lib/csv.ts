// CSV writing with spreadsheet-formula neutralisation (CSV injection defence).

const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString() : typeof value === "object" ? JSON.stringify(value) : String(value);
  // A leading = + - @ (or tab/CR) would be executed as a formula by Excel /
  // Sheets. Prefix with an apostrophe so it is shown as text.
  if (FORMULA_START.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(","), ...rows.map((r) => r.map(csvCell).join(","))];
  // BOM so Excel opens UTF-8 (names with accents, ₹) correctly.
  return "﻿" + lines.join("\r\n") + "\r\n";
}
