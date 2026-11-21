import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { getMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env, googleConfig } from "@/lib/env";
import { verifyState } from "@/lib/crypto";
import { log } from "@/lib/log";
import { exchangeCode, fetchUserInfo, revokeToken } from "@/lib/google/oauth";
import { getConnection, saveConnection } from "@/lib/google/tokens";
import { isGoogleProduct, missingScopes, type GoogleProduct } from "@/lib/google/scopes";
import { runSync } from "@/lib/google/sync";

export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(request: NextRequest) {
  const site = env().NEXT_PUBLIC_SITE_URL;
  const fail = (code: string) => NextResponse.redirect(`${site}/settings?error=${code}`);
  const cfg = googleConfig();
  if (!cfg) return fail("not_configured");

  const member = await getMember();
  if (!member) return NextResponse.redirect(`${site}/sign-in`);

  const params = request.nextUrl.searchParams;
  if (params.get("error")) return fail(params.get("error") === "access_denied" ? "consent_denied" : "google_error");

  const jar = await cookies();
  const nonce = jar.get("kc_oauth_nonce")?.value ?? "";
  jar.delete({ name: "kc_oauth_nonce", path: "/api/integrations/google" });
  const state = verifyState<{ uid: string; product: GoogleProduct; nonce: string }>(params.get("state") ?? "", cfg.encryptionKey);
  if (!state || !nonce || !safeEqual(state.nonce, nonce) || state.uid !== member.id || !isGoogleProduct(state.product)) {
    log.warn("google.callback.bad_state");
    return fail("bad_state");
  }
  const code = params.get("code");
  if (!code) return fail("google_error");

  try {
    const tokens = await exchangeCode(code, { clientId: cfg.clientId, clientSecret: cfg.clientSecret, siteUrl: site });
    const info = await fetchUserInfo(tokens.access_token);
    // Each person connects THEIR OWN Workspace mailbox/calendar — not a
    // personal account and not a colleague's.
    if (!info.email_verified || info.email.toLowerCase() !== member.email.toLowerCase()) {
      await revokeToken(tokens.refresh_token ?? tokens.access_token);
      return fail("wrong_account");
    }
    const missing = missingScopes(state.product, tokens.scope.split(" "));
    if (missing.length) {
      await revokeToken(tokens.refresh_token ?? tokens.access_token);
      return fail("scopes_missing");
    }
    const previous = await getConnection(member.id, state.product);
    await saveConnection(member.id, state.product, info.email, tokens, previous);
    const supabase = await createClient();
    await supabase.rpc("log_security_event", { p_action: "integration.connected", p_details: { product: state.product } });
    // First sync in the background of this request; failures are shown in Settings.
    await runSync(member.id, state.product).catch(() => undefined);
    return NextResponse.redirect(`${site}/settings?notice=${state.product}_connected`);
  } catch (err) {
    log.error("google.callback.failed", { error: err });
    return fail("connect_failed");
  }
}
