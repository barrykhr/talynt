import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env, serviceRoleKey } from "@/lib/env";

/**
 * Service-role client. BYPASSES row-level security — use only for server-side
 * work that must touch server-only tables (Google tokens, background sync).
 * Never pass its results to the browser without filtering.
 */
export function createAdminClient() {
  return createClient(env().NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
