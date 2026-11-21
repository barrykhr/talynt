import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, createTestDb, databaseAvailable, expectDbError, provisionAndSignIn, type TestDb } from "./harness";
import { normalizeCompanyName, normalizeDomain } from "@/lib/normalize";

const available = await databaseAvailable();

describe.skipIf(!available)("core records, history and active-client rule", () => {
  let db: TestDb;
  let u: { authId: string; memberId: string };
  const q = (sql: string, params: unknown[] = []) => asUser(db.pool, u.authId, (c) => c.query(sql, params));

  beforeAll(async () => {
    db = await createTestDb();
    u = await provisionAndSignIn(db.pool, "maya@kivitronicsconsulting.com", "admin", "Maya");
  });
  afterAll(async () => { await db?.destroy(); });

  it("creates and edits a company, normalising name and domain", async () => {
    const { rows } = await q("insert into public.companies (name, website, owner_id) values ('  Acme Pvt. Ltd. ', 'https://www.Acme.com/careers', $1) returning *", [u.memberId]);
    expect(rows[0]).toMatchObject({ name: "Acme Pvt. Ltd.", normalized_name: "acme", domain: "acme.com", msa_status: "not_started" });
    await q("update public.companies set location = 'Pune' where id = $1", [rows[0].id]);
    // MSA status can only change through agreements.
    const direct = await expectDbError(q("update public.companies set msa_status = 'signed' where id = $1", [rows[0].id]));
    expect(direct.message).toMatch(/managed through the company's agreements/);
    await q("insert into public.commercial_agreements (company_id, kind, status) values ($1, 'msa', 'in_discussion')", [rows[0].id]);
    const h = await q("select field, old_value, new_value from public.record_history where entity_id = $1 order by id", [rows[0].id]);
    expect(h.rows).toEqual(expect.arrayContaining([expect.objectContaining({ field: "msa_status", old_value: "not_started", new_value: "in_discussion" })]));
  });

  it("blocks a second company with the same domain", async () => {
    const err = await expectDbError(q("insert into public.companies (name, domain) values ('Acme Again', 'acme.com')"));
    expect(err.message).toMatch(/companies_domain_unique/);
  });

  it("finds likely duplicate companies by name and domain", async () => {
    const byName = await q("select * from public.find_company_duplicates('ACME Private Limited', null, null)");
    expect(byName.rows[0]).toMatchObject({ name: "Acme Pvt. Ltd.", reason: "same_name" });
    const byDomain = await q("select * from public.find_company_duplicates('Totally different', 'acme.com', null)");
    expect(byDomain.rows[0].reason).toBe("same_domain");
    const bulk = await q("select * from public.match_companies_bulk(array['The Acme Company','Zeta Labs'], array['',''])");
    expect(bulk.rows).toHaveLength(1);
    expect(bulk.rows[0].idx).toBe(1);
  });

  it("SQL and TypeScript normalisation agree", async () => {
    const names = ["Acme Pvt. Ltd.", "The Acme Company", "Tata & Sons Private Limited", "  Infosys  Ltd ", "Zoho Corp"];
    for (const n of names) {
      const { rows } = await q("select private.normalize_company_name($1) v", [n]);
      expect(rows[0].v).toBe(normalizeCompanyName(n));
    }
    for (const d of ["https://www.Acme.com/about", "acme.co.in", "WWW.foo.io:443", "http://x.org?y=1"]) {
      const { rows } = await q("select private.normalize_domain($1) v", [d]);
      expect(rows[0].v).toBe(normalizeDomain(d));
    }
  });

  it("records every opportunity stage change and requires a loss reason", async () => {
    const co = await q("insert into public.companies (name) values ('Stage Co') returning id");
    const opp = await q("insert into public.opportunities (company_id, title, owner_id) values ($1, 'Hiring 5 devs', $2) returning id, stage", [co.rows[0].id, u.memberId]);
    expect(opp.rows[0].stage).toBe("new_lead");
    const id = opp.rows[0].id;
    await q("update public.opportunities set stage = 'contacted' where id = $1", [id]);
    await q("update public.opportunities set stage = 'qualified' where id = $1", [id]);
    const err = await expectDbError(q("update public.opportunities set stage = 'lost' where id = $1", [id]));
    expect(err.message).toMatch(/opportunities_lost_needs_reason/);
    await q("update public.opportunities set stage = 'lost', loss_reason = 'Budget frozen' where id = $1", [id]);
    const h = await q("select old_value, new_value from public.record_history where entity_id = $1 and field = 'stage' order by id", [id]);
    expect(h.rows.map((r) => [r.old_value, r.new_value])).toEqual([[null, "new_lead"], ["new_lead", "contacted"], ["contacted", "qualified"], ["qualified", "lost"]]);
    const o = await q("select lost_at, won_at from public.opportunities where id = $1", [id]);
    expect(o.rows[0].lost_at).not.toBeNull();
  });

  it("validates requirements and tracks placements against hiring volume", async () => {
    const co = await q("insert into public.companies (name) values ('Req Co') returning id");
    const err = await expectDbError(q("insert into public.requirements (company_id, role_title, hiring_volume, positions_filled) values ($1, 'QA', 2, 3)", [co.rows[0].id]));
    expect(err.message).toMatch(/requirements_filled_within_volume/);
    const r = await q("insert into public.requirements (company_id, role_title, hiring_volume) values ($1, 'QA', 3) returning id", [co.rows[0].id]);
    await expectDbError(q("update public.requirements set positions_filled = 2 where id = $1", [r.rows[0].id]));
    await q("insert into public.placements (requirement_id, offer_accepted_on) values ($1, current_date), ($1, current_date)", [r.rows[0].id]);
    await q("update public.requirements set status = 'placed' where id = $1", [r.rows[0].id]);
    const filled = await q("select positions_filled from public.requirements where id = $1", [r.rows[0].id]);
    expect(filled.rows[0].positions_filled).toBe(2);
    const over = await expectDbError(q("insert into public.placements (requirement_id, offer_accepted_on) values ($1, current_date), ($1, current_date)", [r.rows[0].id]));
    expect(over.message).toMatch(/requirements_filled_within_volume/);
    const h = await q("select field from public.record_history where entity_id = $1", [r.rows[0].id]);
    expect(h.rows.map((x) => x.field)).toEqual(expect.arrayContaining(["status", "positions_filled"]));
  });

  it("requires activities to be linked, tasks to have owner + due date, and fills the company from the contact", async () => {
    const co = await q("insert into public.companies (name) values ('Activity Co') returning id");
    const ct = await q("insert into public.contacts (full_name, email, company_id) values ('Ravi K', 'Ravi@ActivityCo.com', $1) returning id, email", [co.rows[0].id]);
    expect(ct.rows[0].email).toBe("ravi@activityco.com");
    const unlinked = await expectDbError(q("insert into public.activities (type, subject) values ('note', 'Floating note')"));
    expect(unlinked.message).toMatch(/activities_linked/);
    const task = await expectDbError(q("insert into public.activities (type, subject, contact_id) values ('task', 'Call back', $1)", [ct.rows[0].id]));
    expect(task.message).toMatch(/activities_task_fields/);
    const a = await q("insert into public.activities (type, subject, contact_id, occurred_at) values ('whatsapp', 'Shared JD', $1, now()) returning company_id, owner_id", [ct.rows[0].id]);
    expect(a.rows[0]).toMatchObject({ company_id: co.rows[0].id, owner_id: u.memberId });
    const last = await q("select last_activity_at from public.companies where id = $1", [co.rows[0].id]);
    expect(last.rows[0].last_activity_at).not.toBeNull();
  });

  it("keeps activity history when the owner or stage changes", async () => {
    const co = await q("insert into public.companies (name, owner_id) values ('History Co', $1) returning id", [u.memberId]);
    await q("insert into public.activities (type, subject, company_id) values ('call', 'Intro call', $1)", [co.rows[0].id]);
    await q("update public.companies set owner_id = null where id = $1", [co.rows[0].id]);
    const acts = await q("select count(*)::int n from public.activities where company_id = $1", [co.rows[0].id]);
    expect(acts.rows[0].n).toBe(1);
  });

  describe("active client = MSA signed AND at least one live requirement", () => {
    const status = async (id: string) => (await q("select is_active_client, client_status from public.company_overview where id = $1", [id])).rows[0];

    it("applies the agreed rule in every combination", async () => {
      const co = (await q("insert into public.companies (name) values ('Client Rule Co') returning id")).rows[0].id;
      expect(await status(co)).toEqual({ is_active_client: false, client_status: "prospect" });

      const req = (await q("insert into public.requirements (company_id, role_title) values ($1, 'Java Dev') returning id", [co])).rows[0].id;
      expect((await status(co)).is_active_client).toBe(false); // live requirement but no MSA

      const msa = (await q("insert into public.commercial_agreements (company_id, kind, status) values ($1, 'msa', 'in_discussion') returning id", [co])).rows[0].id;
      expect((await status(co)).is_active_client).toBe(false);

      await q("update public.commercial_agreements set status = 'signed', signed_on = current_date where id = $1", [msa]);
      expect(await status(co)).toEqual({ is_active_client: true, client_status: "active_client" });

      await q("update public.requirements set status = 'on_hold' where id = $1", [req]);
      expect(await status(co)).toEqual({ is_active_client: false, client_status: "msa_signed_no_live_requirement" });

      await q("update public.requirements set status = 'placed' where id = $1", [req]);
      expect((await status(co)).is_active_client).toBe(true); // placed stays live until closed

      await q("update public.requirements set status = 'closed_filled' where id = $1", [req]);
      expect((await status(co)).is_active_client).toBe(false);

      const req2 = (await q("insert into public.requirements (company_id, role_title, status) values ($1, 'PM', 'sourcing') returning id", [co])).rows[0].id;
      expect((await status(co)).is_active_client).toBe(true);
      await q("update public.requirements set archived_at = now() where id = $1", [req2]);
      expect((await status(co)).is_active_client).toBe(false); // archived requirements never count

      const msaSigned = await q("select msa_signed_on from public.companies where id = $1", [co]);
      expect(msaSigned.rows[0].msa_signed_on).not.toBeNull();
    });
  });

  it("merges duplicate companies without losing data", async () => {
    const keep = (await q("insert into public.companies (name, domain) values ('Merge Keep', 'keep.io') returning id")).rows[0].id;
    const dup = (await q("insert into public.companies (name, domain, notes) values ('Merge Keep Ltd', 'keep-dup.io', 'Old notes') returning id")).rows[0].id;
    await q("insert into public.commercial_agreements (company_id, kind, status, signed_on) values ($1, 'msa', 'signed', current_date)", [dup]);
    await q("insert into public.contacts (full_name, company_id) values ('Moved Person', $1)", [dup]);
    await q("select public.merge_companies($1, $2)", [keep, dup]);
    const moved = await q("select count(*)::int n from public.contacts where company_id = $1", [keep]);
    expect(moved.rows[0].n).toBe(1);
    const k = await q("select msa_status, notes from public.companies where id = $1", [keep]);
    expect(k.rows[0].msa_status).toBe("signed");
    expect(k.rows[0].notes).toMatch(/Old notes/);
    const d = await q("select archived_at, merged_into_id from public.companies where id = $1", [dup]);
    expect(d.rows[0].merged_into_id).toBe(keep);
    expect(d.rows[0].archived_at).not.toBeNull();
  });

  it("searches across records and treats % and _ literally", async () => {
    await q("insert into public.companies (name, notes) values ('Searchable Labs', 'Needs 100% remote_ready engineers')");
    const hit = await q("select entity_type, title from public.search_crm('100% remote_ready', 10)");
    expect(hit.rows.map((r) => r.title)).toContain("Searchable Labs");
    // A bare "%" must only match text that literally contains a percent sign.
    const wildcard = await q("select title from public.search_crm('%', 50)");
    expect(wildcard.rows.map((r) => r.title)).toEqual(["Searchable Labs"]);
  });

  it("produces report numbers that match the data", async () => {
    const r = await q("select public.report_summary(current_date - 30, current_date, null) r");
    const report = r.rows[0].r;
    expect(report.conversion.created).toBeGreaterThanOrEqual(1);
    expect(report.conversion.lost).toBeGreaterThanOrEqual(1);
    expect(report.client_status).toBeTypeOf("object");
  });
});
