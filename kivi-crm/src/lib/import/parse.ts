import "server-only";
import Papa from "papaparse";
import { readSheet } from "read-excel-file/node";
import { MAX_IMPORT_ROWS } from "./plan";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export class ImportFileError extends Error {}

export interface ParsedSheet {
  headers: string[];
  rows: string[][];
  truncated: boolean;
}

function toText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? "" : v.toISOString().slice(0, 10);
  return String(v).replace(/\u0000/g, "").slice(0, 5000);
}

function finish(matrix: unknown[][]): ParsedSheet {
  const nonEmpty = matrix.filter((r) => r.some((c) => toText(c).trim() !== ""));
  if (nonEmpty.length === 0) throw new ImportFileError("The file is empty.");
  const [headerRow, ...body] = nonEmpty;
  const headers = headerRow.map((h, i) => toText(h).trim() || `Column ${i + 1}`).slice(0, 60);
  if (body.length === 0) throw new ImportFileError("The file only has a header row.");
  const rows = body.slice(0, MAX_IMPORT_ROWS).map((r) => headers.map((_, i) => toText(r[i]).trim()));
  return { headers, rows, truncated: body.length > MAX_IMPORT_ROWS };
}

/**
 * Reads CSV or XLSX into plain text cells. Nothing in the file is executed:
 * CSV is parsed as text; for XLSX the parser returns each formula's cached
 * value (it never evaluates formulas), macros are ignored, and only the first
 * sheet is read.
 */
export async function parseSpreadsheet(file: File): Promise<ParsedSheet> {
  if (file.size === 0) throw new ImportFileError("The file is empty.");
  if (file.size > MAX_FILE_BYTES) throw new ImportFileError("Files must be 5 MB or smaller.");
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  // Decide by extension: the browser-supplied MIME type is not trustworthy.
  if (name.endsWith(".csv") || name.endsWith(".tsv") || name.endsWith(".txt")) {
    const text = buf.toString("utf8").replace(/^﻿/, "");
    const result = Papa.parse<string[]>(text, { skipEmptyLines: "greedy", delimiter: name.endsWith(".tsv") ? "\t" : "" });
    if (result.errors.length && result.data.length === 0) throw new ImportFileError("We couldn't read that CSV file.");
    return finish(result.data);
  }
  if (name.endsWith(".xlsx")) {
    // ZIP magic number check before handing to the parser.
    if (buf[0] !== 0x50 || buf[1] !== 0x4b) throw new ImportFileError("That doesn't look like a valid .xlsx file.");
    try {
      const data = await readSheet(buf);
      return finish(data as unknown[][]);
    } catch (err) {
      if (err instanceof ImportFileError) throw err;
      throw new ImportFileError("We couldn't read that Excel file. Try saving it as .xlsx or CSV.");
    }
  }
  if (name.endsWith(".xls") || name.endsWith(".xlsm")) {
    throw new ImportFileError("Please save the file as .xlsx (without macros) or CSV and upload it again.");
  }
  throw new ImportFileError("Upload a .csv or .xlsx file.");
}
