import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getMember } from "@/lib/auth";
import { env, googleConfig } from "@/lib/env";
import { randomToken, signState } from "@/lib/crypto";
import { buildAuthUrl } from "@/lib/google/oauth";
import { isGoogleProduct } from "@/lib/google/scopes";

export const dynamic = "force-dynamic";

// Starts a per-user Gmail or Calendar authorisation. The `state` value is
// HMAC-signed, bound to this user, short-lived, and paired with an httpOnly
// nonce cookie, so a forged or replayed callback is rejected (CSRF defence).
export async function GET(request: NextRequest) {
  const site = env().NEXT_PUBLIC_SITE_URL;
  const member = await getMember();
  if (!member) return NextResponse.redirect(`${site}/sign-in`);
  const cfg = googleConfig();
  if (!cfg) return NextResponse.redirect(`${site}/settings?error=not_configured`);
  const product = request.nextUrl.searchParams.get("product");
  if (!isGoogleProduct(product)) return NextResponse.redirect(`${site}/settings?error=bad_request`);

  const nonce = randomToken();
  const state = signState({ uid: member.id, product, nonce }, cfg.encryptionKey);
  (await cookies()).set("kc_oauth_nonce", nonce, {
    httpOnly: true, secure: site.startsWith("https://"), sameSite: "lax", path: "/api/integrations/google", maxAge: 600,
  });
  return NextResponse.redirect(buildAuthUrl({ clientId: cfg.clientId, siteUrl: site, product, state, loginHint: member.email }));
}
