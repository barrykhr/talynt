import "server-only";
import { AuthError, requireMember, type Member } from "@/lib/auth";
import { createClient, type ServerSupabase } from "@/lib/supabase/server";
import { log } from "@/lib/log";
import type { ActionState } from "@/lib/types";

/**
 * Runs a mutation for an authenticated, active member. Every server action
 * goes through here, so authorization is never skipped. The Supabase client
 * acts as the user, so RLS and database triggers enforce the rules too.
 */
export async function withMember(
  name: string,
  fn: (ctx: { member: Member; supabase: ServerSupabase }) => Promise<ActionState>,
): Promise<ActionState> {
  try {
    const member = await requireMember();
    const supabase = await createClient();
    return await fn({ member, supabase });
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    // Let Next.js redirect()/notFound() propagate.
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_")) throw err;
    log.error("action.failed", { action: name, error: err });
    return { error: "Something went wrong. Please try again." };
  }
}

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export function confirmed(fd: FormData, key = "confirm_duplicate"): boolean {
  return str(fd, key) === "yes";
}
