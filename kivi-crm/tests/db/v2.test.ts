import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  asService, asUser, createAuthUser, createTestDb, databaseAvailable, expectDbError, provisionAndSignIn, type TestDb,
} from "./harness";

const available = await databaseAvailable();

describe.skipIf(!available)("v2: identity, Won gating, revenue, research, monitoring", () => {
  let db: TestDb;
  let admin: { authId: string; memberId: string };
  let member: { authId: string; memberId: string };
  const q = (sql: string, params: unknown[] = []) => asUser(db.pool, member.authId, (c) => c.query(sql, params));
  const svc = (sql: string, params: unknown[] = []) => asService(db.pool, (c) => c.query(sql, params));

  beforeAll(async () => {
    db = await createTestDb();
    admin = await provisionAndSignIn(db.pool, "lead@kivitronicsconsulting.com", "admin", "Lead");
    member = await provisionAndSignIn(db.pool, "rep@kivitronicsconsulting.com", "member", "Rep");
  });
  afterAll(async () => { await db?.destroy(); });

  // ------------------------------------------------------------------ fresh install
  it("ships only default settings — no business rows in any v2 table", async () => {
    const fresh = await createTestDb();
    try {
      for (const t of ["commercial_agreements", "placements", "revenue_events", "invoices", "payments", "credit_adjustments",
        "research_jobs", "research_snapshots", "research_findings", "outreach_drafts", "company_monitors", "monitor_runs",
        "monitor_observations", "company_signals", "notifications", "import_rows", "web_submissions", "sync_preferences"]) {
        const { rows } = await fresh.pool.query(`select count(*)::int n from public.${t}`);
        expect(rows[0].n, t).toBe(0);
      }
      const s = await fresh.pool.query("select count(*)::int n from public.app_settings");
      expect(s.rows[0].n).toBe(1);
    } finally {
      await fresh.destroy();
    }
  });

  it("exposes every company column through company_overview (views expand * at creation)", async () => {
    const cols = (await db.pool.query("select column_name from information_schema.columns where table_schema = 'public' and table_name = 'companies'")).rows.map((r) => r.column_name);
    const view = new Set((await db.pool.query("select column_name from information_schema.columns where table_schema = 'public' and table_name = 'company_overview'")).rows.map((r) => r.column_name));
    expect(cols.filter((c) => !view.has(c))).toEqual([]);
  });

  // ------------------------------------------------------------------ identity
  it("links members by the stable Google subject id, surviving an email rename", async () => {
    await db.pool.query("insert into public.app_users (email) values ('old.name@kivitronicsconsulting.com')");
    const first = await createAuthUser(db.pool, { email: "old.name@kivitronicsconsulting.com", sub: "g-123" });
    expect((await asUser(db.pool, first, (c) => c.query("select public.claim_membership() s"))).rows[0].s).toBe("ok");
    // Workspace admin renames the account; Google keeps the same subject id.
    const renamed = await createAuthUser(db.pool, { email: "new.name@kivitronicsconsulting.com", sub: "g-123" });
    expect((await asUser(db.pool, renamed, (c) => c.query("select public.claim_membership() s"))).rows[0].s).toBe("ok");
    const { rows } = await db.pool.query("select email, google_sub from public.app_users where google_sub = 'g-123'");
    expect(rows).toEqual([{ email: "new.name@kivitronicsconsulting.com", google_sub: "g-123" }]);
    // A different Google account cannot take over the provisioned email.
    const impostor = await createAuthUser(db.pool, { email: "new.name@kivitronicsconsulting.com", sub: "g-999" });
    expect((await asUser(db.pool, impostor, (c) => c.query("select public.claim_membership() s"))).rows[0].s).toBe("identity_mismatch");
  });

  // ------------------------------------------------------------------ relationships + Won
  let company: string, opp: string, req: string;
  it("keeps sales opportunities and requirements distinct, and only allows Won with MSA + accepted live requirement", async () => {
    company = (await q("insert into public.companies (name) values ('Revenue Co') returning id")).rows[0].id;
    const c1 = (await q("insert into public.contacts (full_name, company_id) values ('HR Head', $1) returning id", [company])).rows[0].id;
    await q("insert into public.contacts (full_name, company_id) values ('CTO', $1)", [company]);
    opp = (await q("insert into public.opportunities (company_id, title, estimated_value, decision_maker_contact_id) values ($1, 'Eng hiring', 1000000, $2) returning id", [company, c1])).rows[0].id;
    await q("insert into public.opportunities (company_id, title) values ($1, 'Second deal')", [company]);
    const counts = (await q("select (select count(*) from public.contacts where company_id = $1)::int c, (select count(*) from public.opportunities where company_id = $1)::int o", [company])).rows[0];
    expect(counts).toEqual({ c: 2, o: 2 });

    const nurture = await expectDbError(q("update public.opportunities set stage = 'nurture' where id = $1", [opp]));
    expect(nurture.message).toMatch(/opportunities_nurture_needs_reason/);

    let err = await expectDbError(q("update public.opportunities set stage = 'won' where id = $1", [opp]));
    expect(err.message).toMatch(/MSA is not signed/);
    await q("insert into public.commercial_agreements (company_id, kind, status, signed_on) values ($1, 'msa', 'signed', current_date - 10)", [company]);
    err = await expectDbError(q("update public.opportunities set stage = 'won' where id = $1", [opp]));
    expect(err.message).toMatch(/live requirement the client has accepted/);

    const reqRow = (await q(`insert into public.requirements (company_id, opportunity_id, role_title, hiring_volume, fee_basis, fee_percent, expected_compensation)
                    values ($1, $2, 'Backend engineer', 2, 'percent_first_year', 8.33, 2400000) returning id, computed_total_fee`, [company, opp])).rows[0];
    expect(Number(reqRow.computed_total_fee)).toBe(399840); // 8.33% × 24L × 2
    req = reqRow.id;
    err = await expectDbError(q("update public.opportunities set stage = 'won' where id = $1", [opp]));
    expect(err.message).toMatch(/accepted/); // not accepted yet
    await q("update public.requirements set client_accepted_at = now(), terms_agreed_at = now() where id = $1", [req]);
    await q("update public.opportunities set stage = 'won' where id = $1", [opp]);
    const cond = (await q("select * from public.opportunity_won_conditions($1)", [opp])).rows[0];
    expect(cond).toEqual({ msa_signed: true, accepted_live_requirements: 1 });
  });

  // ------------------------------------------------------------------ revenue
  it("separates pipeline, booked, earned, invoiced, realized and outstanding", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const sum = async () => (await q("select public.revenue_summary(current_date - 365, current_date + 365, null) r")).rows[0].r.INR;

    // Booked: accepted, terms agreed, MSA signed, live, valued.
    let s = await sum();
    expect(Number(s.booked)).toBe(399840);
    expect(Number(s.earned)).toBe(0);
    expect(Number(s.invoiced)).toBe(0);
    expect(Number(s.collected)).toBe(0);
    // The won deal no longer counts as open pipeline; the second deal has no value.
    expect(Number(s.pipeline_unweighted)).toBe(0);
    expect(s.pipeline_unvalued).toBe(1);

    // Placement with joining date in the future: expected, not earned.
    const p1 = (await q("insert into public.placements (requirement_id, offer_accepted_on, joined_on, fee_amount) values ($1, current_date - 5, current_date + 20, 199920) returning id", [req])).rows[0].id;
    s = await sum();
    expect(Number(s.earned)).toBe(0);
    // Joining date reached → earned (placement alone was never realized revenue).
    await q("update public.placements set joined_on = current_date - 1, status = 'joined' where id = $1", [p1]);
    s = await sum();
    expect(Number(s.earned)).toBe(199920);
    expect(Number(s.collected)).toBe(0);

    // Invoice issued: invoiced, still not realized.
    const inv = (await q("insert into public.invoices (company_id, requirement_id, invoice_number, issued_on, due_on, amount) values ($1, $2, 'KT-001', current_date - 40, current_date - 10, 199920) returning id", [company, req])).rows[0].id;
    s = await sum();
    expect(Number(s.invoiced)).toBe(199920);
    expect(Number(s.collected)).toBe(0);
    expect(Number(s.outstanding)).toBe(199920);
    expect(Number(s.outstanding_overdue)).toBe(199920);

    // Partial payment → realized only what arrived.
    await q("insert into public.payments (invoice_id, received_on, amount, currency, reference) values ($1, $2, 100000, 'INR', 'UTR1')", [inv, today]);
    s = await sum();
    expect(Number(s.collected)).toBe(100000);
    expect(Number(s.outstanding)).toBe(99920);
    expect(s.part_paid_count).toBe(1);
    const bal = (await q("select payment_state, outstanding, is_overdue, aging_bucket from public.invoice_balances where id = $1", [inv])).rows[0];
    expect(bal).toMatchObject({ payment_state: "part_paid", is_overdue: true, aging_bucket: "1-30" });
    expect(Number(bal.outstanding)).toBe(99920);

    // No overpayment; payments are reversed, not edited or deleted.
    const over = await expectDbError(q("insert into public.payments (invoice_id, received_on, amount, currency) values ($1, current_date, 100000, 'INR')", [inv]));
    expect(over.message).toMatch(/exceeds the outstanding balance/);
    const pay2 = (await q("insert into public.payments (invoice_id, received_on, amount, currency) values ($1, current_date, 90000, 'INR') returning id", [inv])).rows[0].id;
    await expectDbError(q("update public.payments set amount = 1 where id = $1", [pay2]));
    await expectDbError(q("delete from public.payments where id = $1", [pay2]));
    await q("update public.payments set reversed_at = now(), reversal_reason = 'Bounced' where id = $1", [pay2]);
    s = await sum();
    expect(Number(s.collected)).toBe(100000);

    // Credit note reduces outstanding without counting as cash.
    await q("insert into public.credit_adjustments (invoice_id, adjusted_on, amount, currency, reason) values ($1, current_date, 9920, 'INR', 'Replacement rebate')", [inv]);
    s = await sum();
    expect(Number(s.outstanding)).toBe(90000);
    expect(Number(s.collected)).toBe(100000);

    // Wrong currency rejected.
    const cur = await expectDbError(q("insert into public.payments (invoice_id, received_on, amount, currency) values ($1, current_date, 10, 'USD')", [inv]));
    expect(cur.message).toMatch(/currency must match/);

    // Fell through → earned event reversed, placements recount.
    await q("update public.placements set status = 'fell_through' where id = $1", [p1]);
    s = await sum();
    expect(Number(s.earned)).toBe(0);
    expect((await q("select positions_filled from public.requirements where id = $1", [req])).rows[0].positions_filled).toBe(0);
  });

  it("weights pipeline by stage probability unless overridden, and respects admin booked rules", async () => {
    const o = (await q("insert into public.opportunities (company_id, title, stage, estimated_value) values ($1, 'Pipeline deal', 'qualified', 500000) returning id", [company])).rows[0].id;
    let s = (await q("select public.revenue_summary(current_date - 1, current_date, null) r")).rows[0].r.INR;
    expect(Number(s.pipeline_unweighted)).toBe(500000);
    expect(Number(s.pipeline_weighted)).toBe(200000); // qualified = 40% default
    await q("update public.opportunities set probability_override = 10 where id = $1", [o]);
    s = (await q("select public.revenue_summary(current_date - 1, current_date, null) r")).rows[0].r.INR;
    expect(Number(s.pipeline_weighted)).toBe(50000);

    const r2 = (await q("insert into public.requirements (company_id, role_title, fee_basis, fee_per_hire, hiring_volume, client_accepted_at) values ($1, 'QA', 'fixed_fee', 50000, 2, now()) returning id", [company])).rows[0].id;
    const booked = async () => (await q("select is_booked from public.requirement_revenue where requirement_id = $1", [r2])).rows[0].is_booked;
    expect(await booked()).toBe(false); // terms not agreed
    const memberErr = await asUser(db.pool, member.authId, (c) => c.query("update public.app_settings set booked_requires_terms = false returning id"));
    expect(memberErr.rowCount).toBe(0); // members cannot change rules
    await asUser(db.pool, admin.authId, (c) => c.query("update public.app_settings set booked_requires_terms = false"));
    expect(await booked()).toBe(true);
    const audit = await db.pool.query("select count(*)::int n from public.audit_log where action = 'settings.changed'");
    expect(audit.rows[0].n).toBe(1);
    await asUser(db.pool, admin.authId, (c) => c.query("update public.app_settings set booked_requires_terms = true"));
  });

  it("keeps an auditable history of stage, invoice and payment changes", async () => {
    const h = await q("select entity_type, field from public.record_history where entity_type in ('opportunity','invoice','payment','placement','credit') ");
    const keys = h.rows.map((r) => `${r.entity_type}.${r.field}`);
    expect(keys).toEqual(expect.arrayContaining(["opportunity.stage", "invoice.created", "payment.created", "payment.reversed_at", "placement.status", "credit.created"]));
    const audit = await db.pool.query("select action from public.audit_log where action like 'revenue.%'");
    expect(audit.rows.map((r) => r.action)).toEqual(expect.arrayContaining(["revenue.invoice_created", "revenue.payment_created", "revenue.payment_changed"]));
  });

  // ------------------------------------------------------------------ research
  it("stores research as immutable, source-attributed, idempotent snapshots with review state", async () => {
    const job = (await q(`insert into public.research_jobs (company_id, requested_by, provider, input, idempotency_key)
                          values ($1, $2, 'test', '{"company":"Revenue Co"}', 'k1') returning id`, [company, member.memberId])).rows[0].id;
    const dup = await expectDbError(q(`insert into public.research_jobs (company_id, requested_by, provider, input, idempotency_key)
                          values ($1, $2, 'test', '{}', 'k1')`, [company, member.memberId]));
    expect(dup.code).toBe("23505");
    // Members cannot write results; only the trusted backend can.
    await expectDbError(q("select public.store_research_result($1, '{}')", [job]));

    const unsourced = { findings: [{ category: "funding", statement: "Raised a Series B", evidence_kind: "reported_claim", confidence: "medium" }] };
    await expectDbError(svc("select public.store_research_result($1, $2)", [job, unsourced]));

    const result = {
      model: "test-model", about_brief: "Makes payroll software.", sources_retrieved: 2,
      findings: [
        { category: "funding", statement: "Raised ₹50 crore Series B", evidence_kind: "reported_claim", confidence: "medium",
          source_url: "https://news.example.com/series-b", source_title: "Series B news", published_on: "2026-10-01",
          retrieved_at: "2026-11-20T10:00:00Z", excerpt: "…closed a ₹50 crore Series B…", source_verified: true },
        { category: "hiring", statement: "Likely scaling engineering after the round", evidence_kind: "inference", confidence: "low" },
      ],
    };
    const s1 = (await svc("select public.store_research_result($1, $2) id", [job, result])).rows[0].id;
    const s2 = (await svc("select public.store_research_result($1, $2) id", [job, result])).rows[0].id; // retry
    expect(s2).toBe(s1);
    expect((await q("select count(*)::int n from public.research_findings where snapshot_id = $1", [s1])).rows[0].n).toBe(2);
    const f = (await q("select * from public.research_findings where snapshot_id = $1 order by position", [s1])).rows;
    expect(f[0]).toMatchObject({ source_url: "https://news.example.com/series-b", evidence_kind: "reported_claim", review_state: "pending", source_verified: true });
    expect(f[0].published_on).toBeTruthy();

    await expectDbError(q("update public.research_snapshots set about_brief = 'changed' where id = $1", [s1]));
    await expectDbError(q("update public.research_findings set statement = 'rewritten' where id = $1", [f[0].id]));

    await q("select public.review_research_finding($1, 'corrected', 'Raised a Series B (amount unconfirmed)', 'about')", [f[0].id]);
    await q("select public.review_research_finding($1, 'dismissed')", [f[1].id]);
    const reviewed = (await q("select review_state, corrected_statement, reviewed_by from public.research_findings where id = $1", [f[0].id])).rows[0];
    expect(reviewed).toMatchObject({ review_state: "corrected", reviewed_by: member.memberId });
    const co = (await q("select about from public.companies where id = $1", [company])).rows[0];
    expect(co.about).toBe("Raised a Series B (amount unconfirmed)");
    const hist = await q("select field from public.record_history where entity_id = $1 and field = 'about'", [company]);
    expect(hist.rowCount).toBe(1);
    const audit = await db.pool.query("select count(*)::int n from public.audit_log where action = 'research.finding_reviewed'");
    expect(audit.rows[0].n).toBe(2);
  });

  it("retries failed research jobs with backoff and stops when not retryable", async () => {
    const job = (await q(`insert into public.research_jobs (company_id, requested_by, provider, input, idempotency_key)
                          values ($1, $2, 'test', '{}', 'k2') returning id`, [company, member.memberId])).rows[0].id;
    expect((await svc("select public.claim_research_job($1) ok", [job])).rows[0].ok).toBe(true);
    expect((await svc("select public.claim_research_job($1) ok", [job])).rows[0].ok).toBe(false); // already running
    await svc("select public.fail_research_job($1, 'provider timeout', true)", [job]);
    expect((await svc("select public.claim_research_job($1) ok", [job])).rows[0].ok).toBe(false); // backoff not elapsed
    await db.pool.query("update public.research_jobs set next_attempt_at = now() - interval '1 minute' where id = $1", [job]);
    expect((await svc("select public.claim_research_job($1) ok", [job])).rows[0].ok).toBe(true);
    await svc("select public.fail_research_job($1, 'bad request', false)", [job]);
    await db.pool.query("update public.research_jobs set next_attempt_at = now() - interval '1 minute' where id = $1", [job]);
    expect((await svc("select public.claim_research_job($1) ok", [job])).rows[0].ok).toBe(false);
  });

  // ------------------------------------------------------------------ monitoring
  it("diffs job postings against the prior snapshot, de-duplicates alerts and survives retries and provider failures", async () => {
    await q("update public.companies set owner_id = $1 where id = $2", [member.memberId, company]);
    const mon = (await q("insert into public.company_monitors (company_id, sources) values ($1, '{\"greenhouse_board\":\"revco\"}') returning id", [company])).rows[0].id;
    const post = (ids: string[]) => ids.map((id) => ({ provider: "greenhouse", external_id: id, title: `Role ${id}`, url: `https://boards.greenhouse.io/revco/jobs/${id}` }));
    const ok = { greenhouse: { ok: true, complete: true } };

    // Run 1 establishes a baseline: no "new hiring" alert.
    const r1 = (await svc("select public.start_monitor_run($1, 'schedule', 'w1') id", [mon])).rows[0].id;
    expect((await svc("select public.finish_monitor_run($1, $2, $3, '[]') n", [r1, JSON.stringify(post(["1", "2", "3"])), ok])).rows[0].n).toBe(0);
    // Retrying the same scheduled window does nothing.
    expect((await svc("select public.start_monitor_run($1, 'schedule', 'w1') id", [mon])).rows[0].id).toBeNull();
    expect((await svc("select public.finish_monitor_run($1, $2, $3, '[]') n", [r1, JSON.stringify(post(["1", "2", "3"])), ok])).rows[0].n).toBe(0);

    // Run 2: two new postings → one hiring signal (+ volume change 3→5 isn't ≥3).
    const r2 = (await svc("select public.start_monitor_run($1, 'schedule', 'w2') id", [mon])).rows[0].id;
    expect((await svc("select public.finish_monitor_run($1, $2, $3, '[]') n", [r2, JSON.stringify(post(["1", "2", "3", "4", "5"])), ok])).rows[0].n).toBe(1);
    const sig = (await q("select * from public.company_signals where company_id = $1", [company])).rows;
    expect(sig).toHaveLength(1);
    expect(sig[0]).toMatchObject({ signal_type: "hiring", provider: "greenhouse", review_state: "new", confidence: "high" });
    expect(sig[0].summary).toMatch(/not completed hires/);
    expect(sig[0].source_url).toMatch(/^https:\/\/boards\.greenhouse\.io/);

    // A feed signal delivered twice is stored once.
    const feed = [{ signal_type: "announcement", summary: "Opens Pune office", source_url: "https://revco.example/news/pune", source_title: "Newsroom",
      provider: "rss", published_at: "2026-11-01T00:00:00Z", confidence: "medium", fingerprint: "rss:abc" }];
    const r3 = (await svc("select public.start_monitor_run($1, 'manual', 'm1') id", [mon])).rows[0].id;
    expect((await svc("select public.finish_monitor_run($1, $2, $3, $4) n", [r3, JSON.stringify(post(["1", "2", "3", "4", "5"])), { ...ok, rss: { ok: true } }, JSON.stringify(feed)])).rows[0].n).toBe(1);
    const r4 = (await svc("select public.start_monitor_run($1, 'manual', 'm2') id", [mon])).rows[0].id;
    expect((await svc("select public.finish_monitor_run($1, '[]', $2, $3) n", [r4, { rss: { ok: true } }, JSON.stringify(feed)])).rows[0].n).toBe(0);

    // Dismissing keeps history; evidence cannot be edited.
    await q("update public.company_signals set review_state = 'dismissed' where id = $1", [sig[0].id]);
    await expectDbError(q("update public.company_signals set summary = 'edited' where id = $1", [sig[0].id]));
    expect((await q("select count(*)::int n from public.company_signals where company_id = $1", [company])).rows[0].n).toBe(2);

    // Total provider failure: run marked failed, monitor backs off, can be retried.
    const r5 = (await svc("select public.start_monitor_run($1, 'schedule', 'w3') id", [mon])).rows[0].id;
    await svc("select public.finish_monitor_run($1, '[]', $2, '[]')", [r5, { greenhouse: { ok: false, error: "HTTP 429 rate limited" } }]);
    const m = (await q("select status, consecutive_failures, last_error, next_run_at < now() + interval '1 day' as soon from public.company_monitors where id = $1", [mon])).rows[0];
    expect(m).toMatchObject({ status: "error", consecutive_failures: 1, soon: true });
    expect(m.last_error).toMatch(/429/);
    expect((await svc("select public.start_monitor_run($1, 'schedule', 'w3') id", [mon])).rows[0].id).toBe(r5); // failed run may be retried

    // Owner is notified in-app only, once per run.
    const n = await q("select count(*)::int n from public.notifications where user_id = $1 and kind = 'new_signals'", [member.memberId]);
    expect(n.rows[0].n).toBe(2);
  });

  it("lets members add manual signals but not impersonate a monitoring provider", async () => {
    await q(`insert into public.company_signals (company_id, signal_type, summary, source_url, provider, confidence, fingerprint)
             values ($1, 'funding', 'Press release about funding', 'https://example.com/pr', 'manual', 'medium', 'manual:1')`, [company]);
    await expectDbError(q(`insert into public.company_signals (company_id, signal_type, summary, provider, confidence, fingerprint)
             values ($1, 'funding', 'Fake', 'greenhouse', 'high', 'x')`, [company]));
  });
});
