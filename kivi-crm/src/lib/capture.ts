// Website lead capture: validation and spam checks (pure, unit-tested).
import { z } from "zod";
import { normalizeEmail } from "@/lib/normalize";

const e2n = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const t = (max: number) => z.preprocess(e2n, z.string().trim().max(max).nullable().default(null));

export const captureSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  email: z.string().transform((v, ctx) => {
    const e = normalizeEmail(v);
    if (!e) { ctx.addIssue({ code: "custom", message: "A valid email is required" }); return z.NEVER; }
    return e;
  }),
  company: t(200),
  phone: t(40),
  role_needed: t(300),
  hiring_volume: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(1).max(100000).nullable().catch(null)),
  location: t(200),
  message: t(5000),
  page_url: t(500),
  // Spam controls
  website_url: z.string().optional(), // honeypot: real people never fill this hidden field
  form_started_at: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().nullable().catch(null)),
  "cf-turnstile-response": z.string().optional(),
});

export type CaptureInput = z.infer<typeof captureSchema>;

/** Returns a reason when the submission looks automated; null when it looks human. */
export function spamReason(v: CaptureInput, now = Date.now()): string | null {
  if (v.website_url && v.website_url.trim()) return "honeypot";
  if (v.form_started_at && now - v.form_started_at < 3000) return "too_fast";
  const links = (v.message ?? "").match(/https?:\/\//g)?.length ?? 0;
  if (links > 3) return "too_many_links";
  return null;
}

export function allowedOrigin(origin: string | null, configured: string | undefined): boolean {
  if (!origin) return true; // server-to-server or same-site form posts
  const list = (configured ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes(origin);
}
