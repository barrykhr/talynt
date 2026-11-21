import "server-only";
import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().transform((v) => v.replace(/\/+$/, "")),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

let cachedPublic: z.infer<typeof publicSchema> | null = null;

/** Core configuration. Throws a clear error at first use if misconfigured. */
export function env() {
  if (cachedPublic) return cachedPublic;
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`CRM is not configured: check ${missing} (see .env.example and docs/SETUP.md)`);
  }
  cachedPublic = parsed.data;
  return cachedPublic;
}

export function serviceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.length < 20) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured (server-only; see docs/SETUP.md)");
  }
  return key;
}

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  encryptionKey: Buffer;
}

/**
 * Gmail / Calendar configuration. Returns null when any piece is missing, so
 * the UI can say "awaiting Google Cloud configuration" instead of failing.
 */
export function googleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const rawKey = process.env.TOKEN_ENCRYPTION_KEY?.trim();
  const hasServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").length >= 20;
  if (!clientId || !clientSecret || !rawKey || !hasServiceKey) return null;
  const encryptionKey = Buffer.from(rawKey, "base64");
  if (encryptionKey.length !== 32) return null;
  return { clientId, clientSecret, encryptionKey };
}

export function googleConfigProblems(): string[] {
  const problems: string[] = [];
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID) problems.push("GOOGLE_OAUTH_CLIENT_ID is not set");
  if (!process.env.GOOGLE_OAUTH_CLIENT_SECRET) problems.push("GOOGLE_OAUTH_CLIENT_SECRET is not set");
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) problems.push("TOKEN_ENCRYPTION_KEY is not set");
  else if (Buffer.from(raw, "base64").length !== 32) problems.push("TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) problems.push("SUPABASE_SERVICE_ROLE_KEY is not set");
  return problems;
}
