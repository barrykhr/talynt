"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { ALLOWED_DOMAIN } from "@/lib/constants";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { log } from "@/lib/log";

export async function signInWithGoogle(formData: FormData) {
  const next = safeRedirectPath(formData.get("next"), "/");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env().NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      // `hd` only pre-selects the Workspace account in Google's chooser. It is a
      // UX hint, NOT a security control: the domain is enforced server-side in
      // public.claim_membership() from Google's verified ID-token claims.
      queryParams: { hd: ALLOWED_DOMAIN, prompt: "select_account" },
      scopes: "openid email profile",
    },
  });
  if (error || !data.url) {
    log.error("auth.oauth_start_failed", { message: error?.message });
    redirect("/sign-in?error=start_failed");
  }
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  try {
    await supabase.rpc("log_security_event", { p_action: "auth.sign_out", p_details: {} });
  } catch {
    // Not a member (e.g. signing out from the access-denied page) — nothing to log.
  }
  await supabase.auth.signOut({ scope: "local" });
  redirect("/sign-in?signed_out=1");
}
