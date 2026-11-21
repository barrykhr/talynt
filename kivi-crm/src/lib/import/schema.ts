import { z } from "zod";
import { IMPORT_FIELDS, MAX_IMPORT_ROWS } from "./plan";

const fieldKeys = Object.keys(IMPORT_FIELDS) as [keyof typeof IMPORT_FIELDS, ...(keyof typeof IMPORT_FIELDS)[]];

/** Server-side contract for preview/commit payloads (re-validated on every call). */
export const importInputSchema = z.object({
  kind: z.enum(["leads", "companies", "contacts"]),
  filename: z.string().max(255),
  headers: z.array(z.string().max(500)).min(1).max(60),
  rows: z.array(z.array(z.string().max(5000)).max(60)).min(1).max(MAX_IMPORT_ROWS),
  // Partial: unmapped fields are simply absent.
  mapping: z.partialRecord(z.enum(fieldKeys), z.number().int().min(0).max(59)),
  ownerMode: z.enum(["me", "unassigned"]),
});
export type ImportInput = z.infer<typeof importInputSchema>;

export const importDecisionsSchema = z.record(z.string().regex(/^\d+$/), z.enum(["link", "skip", "create"]));
