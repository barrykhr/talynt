// DEVELOPMENT ONLY. Creates a handful of clearly fake records ("[DEV]" prefix,
// example.com addresses) in a LOCAL Supabase stack so you can click around.
// Refuses to run unless ALLOW_DEV_SEED=true and the Supabase URL is local.
// Never run against production; never committed as a migration or seed.sql.
//
//   ALLOW_DEV_SEED=true npm run dev:seed
import { createClient } from "@supabase/supabase-js";
import { assertDevelopmentTarget, loadEnv, requireEnv } from "./_env";

async function main() {
  loadEnv();
  assertDevelopmentTarget("dev:seed");
  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

  const { data: owner } = await supabase.from("app_users").select("id").eq("status", "active").limit(1).maybeSingle();
  const ownerId = owner?.id ?? null;

  const { data: companies, error } = await supabase.from("companies").insert([
    { name: "[DEV] Example Analytics", domain: "analytics.example.com", location: "Pune", source: "referral", owner_id: ownerId },
    { name: "[DEV] Sample Robotics", domain: "robotics.example.com", location: "Bengaluru", source: "linkedin", owner_id: ownerId },
    { name: "[DEV] Demo Fintech", domain: "fintech.example.com", location: "Mumbai", source: "event", owner_id: null },
  ]).select("id, name");
  if (error || !companies) throw new Error(error?.message ?? "insert failed");
  const [a, b, c] = companies;
  // MSA status comes from agreements (single source of truth).
  await supabase.from("commercial_agreements").insert({ company_id: a.id, kind: "msa", status: "signed", signed_on: new Date().toISOString().slice(0, 10), title: "[DEV] MSA" });

  const { data: contacts } = await supabase.from("contacts").insert([
    { full_name: "[DEV] Test Person One", email: "one@analytics.example.com", role_title: "Head of Talent", company_id: a.id, owner_id: ownerId },
    { full_name: "[DEV] Test Person Two", email: "two@robotics.example.com", role_title: "CTO", company_id: b.id, owner_id: ownerId },
  ]).select("id");

  const { data: opps } = await supabase.from("opportunities").insert([
    { company_id: a.id, title: "[DEV] Data team expansion", stage: "proposal_msa", owner_id: ownerId, hiring_need: "Data engineers", hiring_volume: 4, estimated_value: 600000 },
    { company_id: b.id, title: "[DEV] Firmware hiring", stage: "qualified", owner_id: ownerId, next_follow_up_on: new Date().toISOString().slice(0, 10) },
    { company_id: c.id, title: "[DEV] Inbound enquiry", stage: "new_lead", source: "website" },
  ]).select("id");

  await supabase.from("requirements").insert([
    { company_id: a.id, opportunity_id: opps?.[0]?.id, role_title: "[DEV] Senior Data Engineer", hiring_volume: 3, status: "interviews", owner_id: ownerId, location: "Pune",
      fee_basis: "percent_first_year", fee_percent: 8.33, expected_compensation: 2400000, client_accepted_at: new Date().toISOString(), terms_agreed_at: new Date().toISOString() },
  ]);
  if (contacts?.[0]) {
    await supabase.from("activities").insert([
      { type: "call", subject: "[DEV] Intro call", contact_id: contacts[0].id, company_id: a.id, owner_id: ownerId, created_by: ownerId },
    ]);
  }
  console.log(`Seeded development data (${companies.length} companies). Remove it with: ALLOW_DEV_SEED=true npm run dev:reset`);
}

main().catch((err) => {
  console.error("dev:seed failed:", err instanceof Error ? err.message : "unknown error");
  process.exit(1);
});
