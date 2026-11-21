import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { log } from "@/lib/log";

// OAuth return URL. Exchanges the one-time code (PKCE), then asks the
// database to link the verified Google identity to an allowlisted member.
// Anyone who fails that check is signed straight back out.
export async function GET(request: NextRequest) {
  const site = env().NEXT_PUBLIC_SITE_URL;
  const code = request.nextUrl.searchParams.get("code");
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"), "/");

  if (!code) {
    const oauthError = request.nextUrl.searchParams.get("error");
    return NextResponse.redirect(`${site}/sign-in?error=${oauthError === "access_denied" ? "cancelled" : "missing_code"}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    log.warn("auth.code_exchange_failed", { message: error.message });
    return NextResponse.redirect(`${site}/sign-in?error=exchange_failed`);
  }

  const { data: status, error: claimError } = await supabase.rpc("claim_membership");
  if (claimError || status !== "ok") {
    log.warn("auth.access_denied", { reason: claimError ? "claim_error" : status });
    await supabase.auth.signOut({ scope: "local" });
    const reason = typeof status === "string" ? status : "error";
    return NextResponse.redirect(`${site}/access-denied?reason=${encodeURIComponent(reason)}`);
  }

  log.info("auth.signed_in");
  return NextResponse.redirect(`${site}${next}`);
}
