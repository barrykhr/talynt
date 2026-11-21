// Database test harness: creates a throwaway database on a local PostgreSQL,
// applies a minimal Supabase auth stub plus the REAL migrations, and runs
// queries as specific users (role `authenticated` + JWT claims), exactly as
// PostgREST does. Set TEST_DATABASE_URL to an admin connection, e.g.
//   postgres://postgres@localhost:5432/postgres
// Suites are skipped (with a clear message) when no database is reachable.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import pg from "pg";

const ADMIN_URL = process.env.TEST_DATABASE_URL ?? "postgres://postgres@localhost:54329/postgres";
const root = path.resolve(__dirname, "../..");

export async function databaseAvailable(): Promise<boolean> {
  const c = new pg.Client({ connectionString: ADMIN_URL, connectionTimeoutMillis: 1500 });
  try {
    await c.connect();
    await c.end();
    return true;
  } catch {
    return false;
  }
}

export interface TestDb {
  pool: pg.Pool;
  name: string;
  destroy: () => Promise<void>;
}

export async function createTestDb(): Promise<TestDb> {
  const name = `kivi_test_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`create database ${name}`);
  await admin.end();

  const url = new URL(ADMIN_URL);
  url.pathname = `/${name}`;
  const pool = new pg.Pool({ connectionString: url.toString(), max: 4 });
  const files = [
    path.join(root, "tests/db/supabase-stub.sql"),
    ...readdirSync(path.join(root, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort().map((f) => path.join(root, "supabase/migrations", f)),
  ];
  for (const f of files) await pool.query(readFileSync(f, "utf8"));

  return {
    pool,
    name,
    destroy: async () => {
      await pool.end();
      const a = new pg.Client({ connectionString: ADMIN_URL });
      await a.connect();
      await a.query(`drop database if exists ${name} with (force)`);
      await a.end();
    },
  };
}

export interface AuthUserOptions {
  email: string;
  sub?: string;
  provider?: string;
  hd?: string | null;
  verified?: boolean;
  name?: string;
}

/** Simulates what Supabase Auth stores after a Google sign-in. */
export async function createAuthUser(pool: pg.Pool, o: AuthUserOptions): Promise<string> {
  const id = randomUUID();
  const sub = o.sub ?? `google-${randomUUID()}`;
  const identity: Record<string, unknown> = { sub, email: o.email, email_verified: o.verified ?? true, full_name: o.name ?? null };
  if (o.hd !== null) identity.custom_claims = { hd: o.hd ?? o.email.split("@")[1] };
  await pool.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [id, o.email, identity]);
  await pool.query("insert into auth.identities (user_id, provider, provider_id, identity_data) values ($1, $2, $3, $4)", [id, o.provider ?? "google", sub, identity]);
  return id;
}

/** Provision (as the trusted backend) and sign in: returns { authId, memberId }. */
export async function provisionAndSignIn(pool: pg.Pool, email: string, role: "admin" | "member" = "member", name?: string) {
  const { rows } = await pool.query("insert into public.app_users (email, role, full_name) values ($1, $2, $3) returning id", [email, role, name ?? null]);
  const authId = await createAuthUser(pool, { email, name });
  const status = await asUser(pool, authId, (c) => c.query("select public.claim_membership() as s"));
  if (status.rows[0].s !== "ok") throw new Error(`claim failed: ${status.rows[0].s}`);
  return { authId, memberId: rows[0].id as string };
}

type Fn<T> = (client: pg.PoolClient) => Promise<T>;

async function withClaims<T>(pool: pg.Pool, role: string, claims: Record<string, unknown>, fn: Fn<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${role}`);
    await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

export function asUser<T>(pool: pg.Pool, authId: string, fn: Fn<T>) {
  return withClaims(pool, "authenticated", { sub: authId, role: "authenticated" }, fn);
}

export function asAnon<T>(pool: pg.Pool, fn: Fn<T>) {
  return withClaims(pool, "anon", { role: "anon" }, fn);
}

export function asService<T>(pool: pg.Pool, fn: Fn<T>) {
  return withClaims(pool, "service_role", { role: "service_role" }, fn);
}

/** Expects the callback to fail; returns the Postgres error. */
export async function expectDbError(p: Promise<unknown>): Promise<{ code?: string; message: string }> {
  try {
    await p;
  } catch (err) {
    return err as { code?: string; message: string };
  }
  throw new Error("Expected a database error, but the statement succeeded");
}
