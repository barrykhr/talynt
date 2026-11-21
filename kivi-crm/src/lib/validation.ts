// Server-side validation for every mutation. Browser checks are only a
// convenience; these schemas are the contract.

import { z } from "zod";
import {
  ACTIVITY_TYPES, LEAD_SOURCES, OPPORTUNITY_STAGES, REQUIREMENT_STATUSES,
} from "@/lib/constants";
import { normalizeDomain, normalizeEmail, normalizePhone } from "@/lib/normalize";
import { zonedLocalToUtc } from "@/lib/time";

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const optText = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max, `Keep this under ${max} characters`).nullable().optional())
    .transform((v) => v ?? null);

const reqText = (max: number, label: string) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max, `Keep this under ${max} characters`);

const optUuid = z.preprocess(emptyToNull, z.uuid("Choose a valid option").nullable().optional()).transform((v) => v ?? null);
const reqUuid = (label: string) => z.uuid(`Choose a ${label}`);

const optEnum = <T extends string>(values: T[]) =>
  z.preprocess(emptyToNull, z.enum(values as [T, ...T[]]).nullable().optional()).transform((v) => v ?? null);

const optDate = z.preprocess(emptyToNull, z.iso.date("Use a valid date").nullable().optional()).transform((v) => v ?? null);

const optDateTime = z
  .preprocess(emptyToNull, z.string().nullable().optional())
  .transform((v, ctx) => {
    if (!v) return null;
    const utc = zonedLocalToUtc(v);
    if (!utc) {
      ctx.addIssue({ code: "custom", message: "Use a valid date and time" });
      return z.NEVER;
    }
    return utc;
  });

const optInt = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number({ error: "Enter a whole number" }).int("Enter a whole number").min(min, `Must be at least ${min}`).max(max).nullable(),
  );

const optMoney = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(String(v).replace(/[,₹\s]/g, ""))),
  z.number({ error: "Enter an amount" }).min(0, "Must be 0 or more").max(1e12).nullable(),
).transform((v) => (v === null ? null : Math.round(v * 100) / 100));

const currencySchema = z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim().toUpperCase() : "INR"),
  z.string().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code like INR"));

const optEmail = z.preprocess(emptyToNull, z.string().nullable().optional()).transform((v, ctx) => {
  if (!v) return null;
  const e = normalizeEmail(v);
  if (!e) {
    ctx.addIssue({ code: "custom", message: "Enter a valid email address" });
    return z.NEVER;
  }
  return e;
});

const optUrl = z.preprocess(emptyToNull, z.string().trim().max(300).nullable().optional()).transform((v, ctx) => {
  if (!v) return null;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
    return u.toString();
  } catch {
    ctx.addIssue({ code: "custom", message: "Enter a valid web address" });
    return z.NEVER;
  }
});

export const companySchema = z.object({
  name: reqText(200, "Company name"),
  domain: z.preprocess(emptyToNull, z.string().nullable().optional()).transform((v, ctx) => {
    if (!v) return null;
    const d = normalizeDomain(v);
    if (!d || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) {
      ctx.addIssue({ code: "custom", message: "Enter a domain like example.com" });
      return z.NEVER;
    }
    return d;
  }),
  website: optUrl,
  industry: optText(120),
  location: optText(200),
  source: optEnum(LEAD_SOURCES.values),
  source_detail: optText(200),
  owner_id: optUuid,
  notes: optText(20000),
});

export const contactSchema = z.object({
  full_name: reqText(160, "Name"),
  company_id: optUuid,
  role_title: optText(160),
  email: optEmail,
  phone: z.preprocess(emptyToNull, z.string().max(60).nullable().optional()).transform((v, ctx) => {
    if (!v) return null;
    const p = normalizePhone(v);
    if (!p) {
      ctx.addIssue({ code: "custom", message: "Enter a valid phone number" });
      return z.NEVER;
    }
    return p;
  }),
  linkedin_url: optUrl,
  location: optText(200),
  source: optEnum(LEAD_SOURCES.values),
  owner_id: optUuid,
  notes: optText(20000),
});

export const opportunitySchema = z
  .object({
    company_id: reqUuid("company"),
    title: reqText(200, "Opportunity name"),
    stage: z.enum(OPPORTUNITY_STAGES.values as [string, ...string[]]).default("new_lead"),
    source: optEnum(LEAD_SOURCES.values),
    owner_id: optUuid,
    hiring_need: optText(300),
    hiring_volume: optInt(1, 100000),
    location: optText(200),
    budget: optText(300),
    next_follow_up_on: optDate,
    next_action: optText(300),
    loss_reason: optText(1000),
    nurture_reason: optText(1000),
    revisit_on: optDate,
    priority: z.enum(["low", "normal", "high"]).default("normal"),
    expected_close_on: optDate,
    estimated_value: optMoney,
    currency: currencySchema,
    probability_override: optInt(0, 100),
    decision_maker_contact_id: optUuid,
    hiring_timing: optText(300),
    fee_basis_note: optText(300),
    next_agreed_step: optText(300),
    notes: optText(20000),
    contact_ids: z.array(z.uuid()).max(50).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.stage === "lost" && !v.loss_reason) {
      ctx.addIssue({ code: "custom", path: ["loss_reason"], message: "Add a short loss reason" });
    }
    if (v.stage === "nurture" && !v.nurture_reason) {
      ctx.addIssue({ code: "custom", path: ["nurture_reason"], message: "Say why this is in nurture" });
    }
  });

export const stageChangeSchema = z
  .object({
    id: z.uuid(),
    stage: z.enum(OPPORTUNITY_STAGES.values as [string, ...string[]]),
    loss_reason: optText(1000),
    nurture_reason: optText(1000),
    revisit_on: optDate,
  })
  .superRefine((v, ctx) => {
    if (v.stage === "lost" && !v.loss_reason) {
      ctx.addIssue({ code: "custom", path: ["loss_reason"], message: "Add a short loss reason" });
    }
    if (v.stage === "nurture" && !v.nurture_reason) {
      ctx.addIssue({ code: "custom", path: ["nurture_reason"], message: "Say why this is in nurture" });
    }
  });

export const requirementSchema = z
  .object({
    company_id: reqUuid("company"),
    opportunity_id: optUuid,
    role_title: reqText(200, "Role"),
    hiring_volume: z.preprocess((v) => (v === "" || v == null ? 1 : Number(v)),
      z.number({ error: "Enter a whole number" }).int().min(1, "At least 1").max(100000)),
    client_contact_id: optUuid,
    client_accepted: z.preprocess((v) => v === "on" || v === true, z.boolean()),
    terms_agreed: z.preprocess((v) => v === "on" || v === true, z.boolean()),
    fee_basis: optEnum(["percent_first_year", "fixed_fee", "retainer_milestone", "contract_margin", "other"]),
    fee_percent: optMoney.refine((v) => v === null || v <= 100, "Percent must be 0–100"),
    expected_compensation: optMoney,
    fee_per_hire: optMoney,
    estimated_total_fee: optMoney,
    currency: currencySchema,
    commercial_terms: optText(5000),
    probability: optInt(0, 100),
    forecast_placement_on: optDate,
    next_action: optText(300),
    next_action_on: optDate,
    location: optText(200),
    budget_notes: optText(1000),
    owner_id: optUuid,
    expected_start_on: optDate,
    timeline_notes: optText(300),
    status: z.enum(REQUIREMENT_STATUSES.values as [string, ...string[]]).default("new_requirement"),
    notes: optText(20000),
    contact_ids: z.array(z.uuid()).max(50).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.fee_basis === "percent_first_year" && v.fee_percent === null && v.estimated_total_fee === null) {
      ctx.addIssue({ code: "custom", path: ["fee_percent"], message: "Add the fee percentage (or an estimated total)" });
    }
  });

export const activitySchema = z
  .object({
    type: z.enum(ACTIVITY_TYPES.values as [string, ...string[]]),
    subject: reqText(300, "Summary"),
    body: optText(20000),
    occurred_at: optDateTime,
    company_id: optUuid,
    contact_id: optUuid,
    opportunity_id: optUuid,
    requirement_id: optUuid,
    owner_id: optUuid,
    due_at: optDateTime,
    reminder_at: optDateTime,
  })
  .superRefine((v, ctx) => {
    if (!v.company_id && !v.contact_id && !v.opportunity_id && !v.requirement_id) {
      ctx.addIssue({ code: "custom", path: ["company_id"], message: "Link this to a company, contact, opportunity or requirement" });
    }
    if (v.type === "task") {
      if (!v.due_at) ctx.addIssue({ code: "custom", path: ["due_at"], message: "Tasks need a due date" });
      if (!v.owner_id) ctx.addIssue({ code: "custom", path: ["owner_id"], message: "Tasks need an owner" });
      if (v.reminder_at && v.due_at && v.reminder_at > v.due_at) {
        ctx.addIssue({ code: "custom", path: ["reminder_at"], message: "Reminder should be before the due time" });
      }
    }
  });

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  full_name: optText(120),
  role: z.enum(["admin", "member"]),
});

export const memberUpdateSchema = z.object({
  user_id: z.uuid(),
  role: z.enum(["admin", "member"]),
  status: z.enum(["active", "disabled"]),
});

export const emailComposeSchema = z.object({
  to: z.string().trim().min(1, "Add a recipient").transform((v, ctx) => {
    const list = v.split(/[,;\s]+/).filter(Boolean);
    const emails = list.map((e) => normalizeEmail(e));
    if (emails.some((e) => !e) || emails.length === 0 || emails.length > 20) {
      ctx.addIssue({ code: "custom", message: "Enter valid email addresses separated by commas" });
      return z.NEVER;
    }
    return emails as string[];
  }),
  subject: reqText(250, "Subject").refine((s) => !/[\r\n]/.test(s), "Subject must be a single line"),
  body: reqText(50000, "Message"),
  company_id: optUuid,
  contact_id: optUuid,
  opportunity_id: optUuid,
  requirement_id: optUuid,
});

export const meetingSchema = z
  .object({
    title: reqText(250, "Title"),
    starts_at: optDateTime,
    duration_minutes: z.preprocess((v) => Number(v || 30), z.number().int().min(5).max(600)),
    attendee_emails: z.string().optional().transform((v, ctx) => {
      const list = (v ?? "").split(/[,;\s]+/).filter(Boolean);
      const emails = list.map((e) => normalizeEmail(e));
      if (emails.some((e) => !e) || emails.length > 30) {
        ctx.addIssue({ code: "custom", message: "Enter valid email addresses separated by commas" });
        return z.NEVER;
      }
      return emails as string[];
    }),
    location: optText(300),
    description: optText(5000),
    send_invites: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
    company_id: optUuid,
    contact_id: optUuid,
    opportunity_id: optUuid,
    requirement_id: optUuid,
  })
  .superRefine((v, ctx) => {
    if (!v.starts_at) ctx.addIssue({ code: "custom", path: ["starts_at"], message: "Choose a start time" });
    if (!v.company_id && !v.contact_id && !v.opportunity_id && !v.requirement_id) {
      ctx.addIssue({ code: "custom", path: ["title"], message: "Meetings must be linked to a CRM record" });
    }
  });

/** FormData → plain object; repeated keys (checkbox groups) become arrays. */
export function formDataToObject(fd: FormData, arrayKeys: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of arrayKeys) out[k] = [];
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("$ACTION")) continue;
    const value = typeof v === "string" ? v : v.name;
    if (arrayKeys.includes(k)) (out[k] as unknown[]).push(value);
    else out[k] = value;
  }
  return out;
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = issue.path.join(".") || "_form";
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

// ------------------------------------------------------------------ v2: agreements & revenue
const reqMoney = z.preprocess((v) => Number(String(v ?? "").replace(/[,₹\s]/g, "")),
  z.number({ error: "Enter an amount" }).positive("Must be more than 0").max(1e12)).transform((v) => Math.round(v * 100) / 100);
const reqDate = z.iso.date("Use a valid date");

export const agreementSchema = z.object({
  company_id: reqUuid("company"),
  kind: z.enum(["msa", "sow", "rate_card", "nda", "other"]).default("msa"),
  status: z.enum(["not_started", "in_discussion", "signed", "expired", "terminated"]),
  title: optText(200),
  signed_on: optDate,
  effective_on: optDate,
  expires_on: optDate,
  reference: optText(300),
  terms: optText(5000),
}).superRefine((v, ctx) => {
  if (v.status === "signed" && !v.signed_on) ctx.addIssue({ code: "custom", path: ["signed_on"], message: "Add the signing date" });
  if (v.expires_on && v.effective_on && v.expires_on < v.effective_on) ctx.addIssue({ code: "custom", path: ["expires_on"], message: "Expiry must be after the effective date" });
});

export const placementSchema = z.object({
  requirement_id: reqUuid("requirement"),
  label: optText(80),
  status: z.enum(["offer_accepted", "joined", "fell_through"]).default("offer_accepted"),
  offer_accepted_on: reqDate,
  joined_on: optDate,
  compensation: optMoney,
  fee_amount: optMoney,
  currency: currencySchema,
  notes: optText(2000),
}).superRefine((v, ctx) => {
  if (v.joined_on && v.joined_on < v.offer_accepted_on) ctx.addIssue({ code: "custom", path: ["joined_on"], message: "Joining can't be before the offer" });
  if (v.status === "joined" && !v.joined_on) ctx.addIssue({ code: "custom", path: ["joined_on"], message: "Add the joining date" });
});

export const revenueEventSchema = z.object({
  requirement_id: reqUuid("requirement"),
  kind: z.enum(["retainer_milestone", "contract_margin", "other"]),
  amount: reqMoney,
  currency: currencySchema,
  earned_on: optDate,
  description: optText(300),
});

export const invoiceSchema = z.object({
  company_id: reqUuid("company"),
  requirement_id: optUuid,
  invoice_number: reqText(60, "Invoice number"),
  issued_on: reqDate,
  due_on: reqDate,
  amount: reqMoney,
  currency: currencySchema,
  notes: optText(2000),
}).superRefine((v, ctx) => {
  if (v.due_on < v.issued_on) ctx.addIssue({ code: "custom", path: ["due_on"], message: "Due date must be on or after the issue date" });
});

export const paymentSchema = z.object({
  invoice_id: reqUuid("invoice"),
  received_on: reqDate,
  amount: reqMoney,
  reference: optText(120),
  method: optText(40),
  notes: optText(1000),
});

export const creditSchema = z.object({
  invoice_id: reqUuid("invoice"),
  adjusted_on: reqDate,
  amount: reqMoney,
  reason: reqText(500, "Reason"),
});
