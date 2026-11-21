import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { googleConfig } from "@/lib/env";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { log } from "@/lib/log";
import { GoogleAuthRevokedError, refreshAccessToken, revokeToken, type TokenResponse } from "./oauth";
import type { GoogleProduct } from "./scopes";

// All token handling happens here, server-side, through the service-role
// client. Tokens are encrypted before they reach the database and are never
// returned to the browser or written to logs.

export interface ConnectionRow {
  id: string;
  user_id: string;
  product: GoogleProduct;
  google_email: string;
  scopes: string[];
  refresh_token_enc: string | null;
  access_token_enc: string | null;
  access_token_expires_at: string | null;
  status: "connected" | "needs_reauth" | "error" | "disconnected";
  sync_cursor: string | null;
  last_sync_at: string | null;
}

function requireConfig() {
  const cfg = googleConfig();
  if (!cfg) throw new Error("Google integration is not configured");
  return cfg;
}

export async function saveConnection(userId: string, product: GoogleProduct, email: string, tokens: TokenResponse, previous?: ConnectionRow | null) {
  const cfg = requireConfig();
  const refresh = tokens.refresh_token ?? (previous?.refresh_token_enc ? decryptSecret(previous.refresh_token_enc, cfg.encryptionKey) : null);
  if (!refresh) throw new Error("Google did not return a refresh token");
  const admin = createAdminClient();
  const { error } = await admin.from("google_connections").upsert(
    {
      user_id: userId,
      product,
      google_email: email.toLowerCase(),
      scopes: tokens.scope.split(" ").filter(Boolean),
      refresh_token_enc: encryptSecret(refresh, cfg.encryptionKey),
      access_token_enc: encryptSecret(tokens.access_token, cfg.encryptionKey),
      access_token_expires_at: new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString(),
      status: "connected",
      last_error: null,
      connected_at: new Date().toISOString(),
      // A different mailbox invalidates the old sync position.
      ...(previous && previous.google_email !== email.toLowerCase() ? { sync_cursor: null } : {}),
    },
    { onConflict: "user_id,product" },
  );
  if (error) throw new Error(`Could not save connection: ${error.code}`);
}

export async function getConnection(userId: string, product: GoogleProduct): Promise<ConnectionRow | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("google_connections").select("*").eq("user_id", userId).eq("product", product).maybeSingle();
  return (data as ConnectionRow | null) ?? null;
}

export async function markConnection(userId: string, product: GoogleProduct, patch: Record<string, unknown>) {
  const admin = createAdminClient();
  await admin.from("google_connections").update(patch).eq("user_id", userId).eq("product", product);
}

/** Returns a valid access token, refreshing it when needed. */
export async function getAccessToken(userId: string, product: GoogleProduct): Promise<{ token: string; connection: ConnectionRow }> {
  const cfg = requireConfig();
  const conn = await getConnection(userId, product);
  if (!conn || conn.status === "disconnected" || !conn.refresh_token_enc) {
    throw new GoogleAuthRevokedError("Not connected");
  }
  if (conn.status === "needs_reauth") throw new GoogleAuthRevokedError();

  const fresh = conn.access_token_enc && conn.access_token_expires_at && new Date(conn.access_token_expires_at).getTime() > Date.now() + 30_000;
  if (fresh) {
    try {
      return { token: decryptSecret(conn.access_token_enc!, cfg.encryptionKey), connection: conn };
    } catch {
      // Key rotated or corrupted — fall through to refresh.
    }
  }

  let refresh: string;
  try {
    refresh = decryptSecret(conn.refresh_token_enc, cfg.encryptionKey);
  } catch {
    await markConnection(userId, product, { status: "needs_reauth", last_error: "Stored credentials could not be decrypted. Please reconnect." });
    throw new GoogleAuthRevokedError();
  }

  try {
    const tokens = await refreshAccessToken(refresh, cfg);
    await markConnection(userId, product, {
      access_token_enc: encryptSecret(tokens.access_token, cfg.encryptionKey),
      access_token_expires_at: new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString(),
      ...(tokens.refresh_token ? { refresh_token_enc: encryptSecret(tokens.refresh_token, cfg.encryptionKey) } : {}),
    });
    return { token: tokens.access_token, connection: conn };
  } catch (err) {
    if (err instanceof GoogleAuthRevokedError) {
      log.warn("google.token_revoked", { product, userId });
      await markConnection(userId, product, {
        status: "needs_reauth", access_token_enc: null,
        last_error: "Google access was revoked or expired. Reconnect to resume.",
      });
    }
    throw err;
  }
}

/** Revokes at Google and deletes stored tokens. Keeps the row for status. */
export async function disconnect(userId: string, product: GoogleProduct) {
  const cfg = googleConfig();
  const conn = await getConnection(userId, product);
  if (!conn) return;
  if (cfg && conn.refresh_token_enc) {
    try {
      await revokeToken(decryptSecret(conn.refresh_token_enc, cfg.encryptionKey));
    } catch {
      // Already invalid — deleting locally is what matters.
    }
  }
  await markConnection(userId, product, {
    status: "disconnected", refresh_token_enc: null, access_token_enc: null, access_token_expires_at: null,
    sync_cursor: null, last_error: null,
  });
}
