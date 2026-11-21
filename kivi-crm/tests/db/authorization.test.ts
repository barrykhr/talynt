import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  asAnon, asService, asUser, createAuthUser, createTestDb, databaseAvailable, expectDbError, provisionAndSignIn, type TestDb,
} from "./harness";

const available = await databaseAvailable();
if (!available) console.warn("[db tests] No PostgreSQL at TEST_DATABASE_URL — database suites skipped.");

describe.skipIf(!available)("fresh installation", () => {
  let db: TestDb;
  beforeAll(async () => { db = await createTestDb(); });
  afterAll(async () => { await db?.destroy(); });

  it("starts with a genuinely empty workspace: no users, records, history or audit events", async () => {
    const tables = [
      "app_users", "companies", "contacts", "opportunities", "requirements", "activities", "opportunity_contacts",
      "requirement_contacts", "record_history", "audit_log", "imports", "google_connections", "sync_review_items", "sync_exclusions",
    ];
    for (const t of tables) {
      const { rows } = await db.pool.query(`select count(*)::int as n from public.${t}`);
      expect(rows[0].n, `${t} should be empty`).toBe(0);
    }
  });

  it("reports zeros on the dashboard of an empty workspace", async () => {
    const { authId } = await provisionAndSignIn(db.pool, "first.admin@kivitronicsconsulting.com", "admin");
    const { rows } = await asUser(db.pool, authId, (c) => c.query("select public.dashboard_summary() as s"));
    expect(rows[0].s).toMatchObject({ open_opportunities: 0, follow_ups_due: 0, active_clients: 0, live_requirements: 0, companies: 0, pipeline: {} });
  });
});

describe.skipIf(!available)("sign-in and domain enforcement", () => {
  let db: TestDb;
  beforeAll(async () => { db = await createTestDb(); });
  afterAll(async () => { await db?.destroy(); });

  const claim = async (authId: string) =>
    (await asUser(db.pool, authId, (c) => c.query("select public.claim_membership() as s"))).rows[0].s as string;

  it("rejects allowlisting addresses outside the Workspace domain", async () => {
    const err = await expectDbError(db.pool.query("insert into public.app_users (email) values ('someone@gmail.com')"));
    expect(err.message).toMatch(/app_users_email_domain/);
    await expectDbError(db.pool.query("insert into public.app_users (email) values ('x@kivitronicsconsulting.com.evil.io')"));
  });

  it("denies a verified Workspace user who has not been provisioned", async () => {
    const id = await createAuthUser(db.pool, { email: "stranger@kivitronicsconsulting.com" });
    expect(await claim(id)).toBe("not_provisioned");
    const { rows } = await asUser(db.pool, id, (c) => c.query("select count(*)::int n from public.companies"));
    expect(rows[0].n).toBe(0);
    await expectDbError(asUser(db.pool, id, (c) => c.query("insert into public.companies (name) values ('Nope')")));
  });

  it("denies consumer Google accounts and mismatched hosted-domain claims", async () => {
    const gmail = await createAuthUser(db.pool, { email: "person@gmail.com", hd: null });
    expect(await claim(gmail)).toBe("domain_not_allowed");

    await db.pool.query("insert into public.app_users (email) values ('spoof@kivitronicsconsulting.com')");
    // Email claims the domain but Google's hd claim does not (e.g. not a Workspace account).
    const noHd = await createAuthUser(db.pool, { email: "spoof@kivitronicsconsulting.com", hd: null });
    expect(await claim(noHd)).toBe("domain_not_allowed");
    const otherHd = await createAuthUser(db.pool, { email: "spoof@kivitronicsconsulting.com", hd: "evil.example" });
    expect(await claim(otherHd)).toBe("domain_not_allowed");
  });

  it("denies unverified emails and non-Google identities", async () => {
    await db.pool.query("insert into public.app_users (email) values ('unverified@kivitronicsconsulting.com'), ('pwd@kivitronicsconsulting.com')");
    const unverified = await createAuthUser(db.pool, { email: "unverified@kivitronicsconsulting.com", verified: false });
    expect(await claim(unverified)).toBe("domain_not_allowed");
    const password = await createAuthUser(db.pool, { email: "pwd@kivitronicsconsulting.com", provider: "email" });
    expect(await claim(password)).toBe("not_google_identity");
  });

  it("activates a provisioned member and records the sign-in in the audit log", async () => {
    await db.pool.query("insert into public.app_users (email, role) values ('asha@kivitronicsconsulting.com', 'member')");
    const id = await createAuthUser(db.pool, { email: "asha@kivitronicsconsulting.com", name: "Asha Rao" });
    expect(await claim(id)).toBe("ok");
    const { rows } = await db.pool.query("select status, full_name, auth_user_id from public.app_users where email = 'asha@kivitronicsconsulting.com'");
    expect(rows[0]).toMatchObject({ status: "active", full_name: "Asha Rao", auth_user_id: id });
    const audit = await db.pool.query("select action from public.audit_log where actor_email = 'asha@kivitronicsconsulting.com'");
    expect(audit.rows.map((r) => r.action)).toContain("auth.first_sign_in");
    const denied = await db.pool.query("select count(*)::int n from public.audit_log where action = 'auth.sign_in_denied'");
    expect(denied.rows[0].n).toBeGreaterThan(0);
  });

  it("refuses a second auth identity for an already-linked member", async () => {
    const other = await createAuthUser(db.pool, { email: "asha@kivitronicsconsulting.com" });
    expect(await claim(other)).toBe("identity_mismatch");
  });

  it("anonymous visitors cannot read anything", async () => {
    for (const t of ["companies", "contacts", "app_users", "audit_log", "activities"]) {
      const err = await expectDbError(asAnon(db.pool, (c) => c.query(`select * from public.${t}`)));
      expect(err.code).toBe("42501");
    }
  });

  it("the before-user-created hook rejects other domains", async () => {
    const ok = await db.pool.query(`select public.hook_before_user_created('{"user":{"email":"a@kivitronicsconsulting.com"}}') r`);
    expect(ok.rows[0].r).toEqual({});
    const no = await db.pool.query(`select public.hook_before_user_created('{"user":{"email":"a@gmail.com"}}') r`);
    expect(no.rows[0].r.error.http_code).toBe(403);
  });
});

describe.skipIf(!available)("roles, ownership and server-only data", () => {
  let db: TestDb;
  let admin: { authId: string; memberId: string };
  let alice: { authId: string; memberId: string };
  let bob: { authId: string; memberId: string };

  beforeAll(async () => {
    db = await createTestDb();
    admin = await provisionAndSignIn(db.pool, "admin@kivitronicsconsulting.com", "admin", "Admin");
    alice = await provisionAndSignIn(db.pool, "alice@kivitronicsconsulting.com", "member", "Alice");
    bob = await provisionAndSignIn(db.pool, "bob@kivitronicsconsulting.com", "member", "Bob");
  });
  afterAll(async () => { await db?.destroy(); });

  it("members share records: anyone can read and update, nobody can hard-delete", async () => {
    const { rows } = await asUser(db.pool, alice.authId, (c) =>
      c.query("insert into public.companies (name, owner_id) values ('Shared Co', $1) returning id, created_by", [alice.memberId]));
    expect(rows[0].created_by).toBe(alice.memberId);
    const id = rows[0].id;
    const read = await asUser(db.pool, bob.authId, (c) => c.query("select name from public.companies where id = $1", [id]));
    expect(read.rows[0].name).toBe("Shared Co");
    await asUser(db.pool, bob.authId, (c) => c.query("update public.companies set notes = 'Bob was here' where id = $1", [id]));
    const err = await expectDbError(asUser(db.pool, bob.authId, (c) => c.query("delete from public.companies where id = $1", [id])));
    expect(err.code).toBe("42501");
    const adminErr = await expectDbError(asUser(db.pool, admin.authId, (c) => c.query("delete from public.companies where id = $1", [id])));
    expect(adminErr.code).toBe("42501");
  });

  it("created_by cannot be spoofed by the client", async () => {
    const { rows } = await asUser(db.pool, bob.authId, (c) =>
      c.query("insert into public.companies (name, created_by) values ('Spoof Co', $1) returning created_by", [alice.memberId]));
    expect(rows[0].created_by).toBe(bob.memberId);
  });

  it("only the current owner or an admin can reassign; unassigned records can be claimed", async () => {
    const { rows } = await asUser(db.pool, alice.authId, (c) =>
      c.query("insert into public.companies (name, owner_id) values ('Owned by Alice', $1) returning id", [alice.memberId]));
    const id = rows[0].id;
    const err = await expectDbError(asUser(db.pool, bob.authId, (c) => c.query("update public.companies set owner_id = $1 where id = $2", [bob.memberId, id])));
    expect(err.message).toMatch(/current owner or an administrator/);
    await asUser(db.pool, alice.authId, (c) => c.query("update public.companies set owner_id = $1 where id = $2", [bob.memberId, id]));
    await asUser(db.pool, admin.authId, (c) => c.query("update public.companies set owner_id = $1 where id = $2", [alice.memberId, id]));

    const un = await asUser(db.pool, alice.authId, (c) => c.query("insert into public.companies (name) values ('Nobody owns me') returning id"));
    await asUser(db.pool, bob.authId, (c) => c.query("update public.companies set owner_id = $1 where id = $2", [bob.memberId, un.rows[0].id]));
    const history = await db.pool.query("select count(*)::int n from public.record_history where entity_id = $1 and field = 'owner_id'", [id]);
    expect(history.rows[0].n).toBe(2);
  });

  it("owners must be active team members", async () => {
    const { rows } = await db.pool.query("insert into public.app_users (email) values ('pending@kivitronicsconsulting.com') returning id");
    const err = await expectDbError(asUser(db.pool, alice.authId, (c) => c.query("insert into public.companies (name, owner_id) values ('X', $1)", [rows[0].id])));
    expect(err.message).toMatch(/active team member/);
  });

  it("members cannot change roles or permissions", async () => {
    const direct = await asUser(db.pool, alice.authId, (c) => c.query("update public.app_users set role = 'admin' where id = $1", [alice.memberId]).catch((e) => e));
    expect(direct.code ?? "updated-0-rows").toMatch(/42501|updated-0-rows/);
    const { rows } = await db.pool.query("select role from public.app_users where id = $1", [alice.memberId]);
    expect(rows[0].role).toBe("member");
    const rpc = await expectDbError(asUser(db.pool, alice.authId, (c) => c.query("select public.admin_update_user($1, 'admin', 'active')", [alice.memberId])));
    expect(rpc.code).toBe("42501");
    const invite = await expectDbError(asUser(db.pool, alice.authId, (c) => c.query("select public.admin_invite_user('new@kivitronicsconsulting.com', 'New', 'member')")));
    expect(invite.code).toBe("42501");
  });

  it("admins manage the team, every change is audited, and the last admin is protected", async () => {
    await asUser(db.pool, admin.authId, (c) => c.query("select public.admin_invite_user('carol@kivitronicsconsulting.com', 'Carol', 'member')"));
    const badDomain = await expectDbError(asUser(db.pool, admin.authId, (c) => c.query("select public.admin_invite_user('carol@gmail.com', 'Carol', 'member')")));
    expect(badDomain.message).toMatch(/kivitronicsconsulting/);
    const last = await expectDbError(asUser(db.pool, admin.authId, (c) => c.query("select public.admin_update_user($1, 'member', 'active')", [admin.memberId])));
    expect(last.message).toMatch(/At least one active administrator/);
    const { rows } = await db.pool.query("select action from public.audit_log where action like 'admin.%'");
    expect(rows.map((r) => r.action)).toContain("admin.user_invited");
  });

  it("only admins can read the audit log", async () => {
    const m = await asUser(db.pool, alice.authId, (c) => c.query("select count(*)::int n from public.audit_log"));
    expect(m.rows[0].n).toBe(0);
    const a = await asUser(db.pool, admin.authId, (c) => c.query("select count(*)::int n from public.audit_log"));
    expect(a.rows[0].n).toBeGreaterThan(0);
    await expectDbError(asUser(db.pool, admin.authId, (c) => c.query("delete from public.audit_log")));
  });

  it("Google tokens are unreachable from the API roles; status is visible only to its owner", async () => {
    await asService(db.pool, (c) => c.query(
      "insert into public.google_connections (user_id, product, google_email, refresh_token_enc) values ($1, 'gmail', 'alice@kivitronicsconsulting.com', 'v1.secret')", [alice.memberId]));
    const err = await expectDbError(asUser(db.pool, alice.authId, (c) => c.query("select refresh_token_enc from public.google_connections")));
    expect(err.code).toBe("42501");
    const mine = await asUser(db.pool, alice.authId, (c) => c.query("select * from public.my_google_connections()"));
    expect(mine.rows).toHaveLength(1);
    expect(Object.keys(mine.rows[0])).not.toContain("refresh_token_enc");
    const bobs = await asUser(db.pool, bob.authId, (c) => c.query("select * from public.my_google_connections()"));
    expect(bobs.rows).toHaveLength(0);
  });

  it("sync review items are private to their owner", async () => {
    await asService(db.pool, (c) => c.query(
      "insert into public.sync_review_items (user_id, product, external_id, subject, occurred_at) values ($1, 'gmail', 'm1', 'Private subject', now())", [alice.memberId]));
    const a = await asUser(db.pool, alice.authId, (c) => c.query("select count(*)::int n from public.sync_review_items"));
    const b = await asUser(db.pool, bob.authId, (c) => c.query("select count(*)::int n from public.sync_review_items"));
    expect(a.rows[0].n).toBe(1);
    expect(b.rows[0].n).toBe(0);
  });

  it("disabling a member removes access immediately", async () => {
    const dave = await provisionAndSignIn(db.pool, "dave@kivitronicsconsulting.com");
    const before = await asUser(db.pool, dave.authId, (c) => c.query("select count(*)::int n from public.companies"));
    expect(before.rows[0].n).toBeGreaterThan(0);
    await asUser(db.pool, admin.authId, (c) => c.query("select public.admin_update_user($1, 'member', 'disabled')", [dave.memberId]));
    const after = await asUser(db.pool, dave.authId, (c) => c.query("select count(*)::int n from public.companies"));
    expect(after.rows[0].n).toBe(0);
    const status = await asUser(db.pool, dave.authId, (c) => c.query("select public.claim_membership() s"));
    expect(status.rows[0].s).toBe("disabled");
  });
});

describe.skipIf(!available)("trusted-backend detection", () => {
  let db: TestDb;
  beforeAll(async () => { db = await createTestDb(); });
  afterAll(async () => { await db?.destroy(); });

  it("trusts only the service role or a direct operator session — never anon or members, even inside definer functions", async () => {
    const { authId } = await provisionAndSignIn(db.pool, "t@kivitronicsconsulting.com");
    expect((await asService(db.pool, (c) => c.query("select private.is_trusted_backend() t"))).rows[0].t).toBe(true);
    expect((await db.pool.query("select private.is_trusted_backend() t")).rows[0].t).toBe(true);
    expect((await asUser(db.pool, authId, (c) => c.query("select private.is_trusted_backend() t"))).rows[0].t).toBe(false);
    const anon = await db.pool.connect();
    try {
      await anon.query("begin; set local role anon; select set_config('request.jwt.claims', '{\"role\":\"anon\"}', true)");
      // Even via a SECURITY DEFINER path (current_user = owner), anon is not trusted.
      const r = await anon.query("select private.is_trusted_backend() t").catch((e) => ({ rows: [{ t: `denied:${e.code}` }] }));
      expect(r.rows[0].t === false || String(r.rows[0].t).startsWith("denied")).toBe(true);
      await anon.query("rollback");
    } finally {
      anon.release();
    }
  });
});
