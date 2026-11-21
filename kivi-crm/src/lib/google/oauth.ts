import "server-only";
import { ALLOWED_DOMAIN } from "@/lib/constants";
import { PRODUCT_SCOPES, type GoogleProduct } from "./scopes";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export class GoogleAuthRevokedError extends Error {
  constructor(message = "Google access was revoked or has expired") {
    super(message);
  }
}

export class GoogleApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export function redirectUri(siteUrl: string) {
  return `${siteUrl}/api/integrations/google/callback`;
}

export function buildAuthUrl(opts: { clientId: string; siteUrl: string; product: GoogleProduct; state: string; loginHint: string }) {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: redirectUri(opts.siteUrl),
    response_type: "code",
    scope: PRODUCT_SCOPES[opts.product].join(" "),
    access_type: "offline",
    // Always show consent so Google issues a refresh token and the user sees
    // exactly which permissions are requested.
    prompt: "consent",
    include_granted_scopes: "false",
    state: opts.state,
    login_hint: opts.loginHint,
    hd: ALLOWED_DOMAIN,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    if (json.error === "invalid_grant" || json.error === "unauthorized_client") throw new GoogleAuthRevokedError();
    throw new GoogleApiError(res.status, `Token endpoint error: ${String(json.error ?? res.status)}`);
  }
  return json as unknown as TokenResponse;
}

export function exchangeCode(code: string, cfg: { clientId: string; clientSecret: string; siteUrl: string }) {
  return tokenRequest({
    code, client_id: cfg.clientId, client_secret: cfg.clientSecret, redirect_uri: redirectUri(cfg.siteUrl), grant_type: "authorization_code",
  });
}

export function refreshAccessToken(refreshToken: string, cfg: { clientId: string; clientSecret: string }) {
  return tokenRequest({ refresh_token: refreshToken, client_id: cfg.clientId, client_secret: cfg.clientSecret, grant_type: "refresh_token" });
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
    cache: "no-store",
  }).catch(() => undefined);
}

export async function fetchUserInfo(accessToken: string): Promise<{ email: string; email_verified: boolean; hd?: string }> {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!res.ok) throw new GoogleApiError(res.status, "Could not read the Google account identity");
  return (await res.json()) as { email: string; email_verified: boolean; hd?: string };
}

/** Authenticated JSON call to a Google API. */
export async function googleFetch<T>(accessToken: string, url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (res.status === 401) throw new GoogleAuthRevokedError();
  if (!res.ok) {
    const json = (await res.json().catch(() => ({}))) as { error?: { message?: string; status?: string } };
    if (res.status === 403 && /insufficient|scope/i.test(json.error?.message ?? "")) {
      throw new GoogleAuthRevokedError("Google permissions are missing — please reconnect");
    }
    throw new GoogleApiError(res.status, json.error?.status ?? `Google API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
