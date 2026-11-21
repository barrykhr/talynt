// DEVELOPMENT ONLY. Clears CRM records from a LOCAL Supabase stack.
// Same guards as dev:seed. Team members are kept unless --include-users.
// There is deliberately no equivalent in the production app.
//
//   ALLOW_DEV_SEED=true npm run dev:reset            # records only
//   ALLOW_DEV_SEED=true npm run dev:reset -- --include-users
import { createClient } from "@supabase/supabase-js";
import { assertDevelopmentTarget, loadEnv, requireEnv } from "./_env";

const NIL = "00000000-0000-0000-0000-000000000000";

async function main() {
  loadEnv();
  assertDevelopmentTarget("dev:reset");
  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
  const order = [
    "notifications", "web_submissions", "sync_review_items", "sync_exclusions", "outreach_drafts", "research_findings",
    "company_signals", "monitor_observations", "monitor_runs", "company_monitors",
    "payments", "credit_adjustments", "invoices", "revenue_events", "placements",
    "activities", "opportunity_contacts", "requirement_contacts", "requirements", "opportunities", "contacts",
    "commercial_agreements", "import_rows", "imports",
  ];
  // Snapshots/jobs reference each other; clear the link first, then both.
  await supabase.from("research_jobs").update({ snapshot_id: null }).neq("id", NIL);
  for (const table of [...order.slice(0, 6), "research_snapshots", "research_jobs", ...order.slice(6), "companies"]) {
    const key = table.endsWith("_contacts") ? "contact_id" : table === "sync_exclusions" ? "user_id" : table === "import_rows" ? "import_id" : "id";
    const { error } = table === "import_rows"
      ? await supabase.from(table).delete().gte("id", 0)
      : await supabase.from(table).delete().neq(key, NIL);
    if (error) throw new Error(`${table}: ${error.message}`);
    console.log(`cleared ${table}`);
  }
  const { error: h } = await supabase.from("record_history").delete().gte("id", 0);
  if (h) throw new Error(`record_history: ${h.message}`);
  if (process.argv.includes("--include-users")) {
    await supabase.from("google_connections").delete().neq("id", NIL);
    await supabase.from("audit_log").delete().gte("id", 0);
    await supabase.from("app_users").delete().neq("id", NIL);
    console.log("cleared team members, connections and audit log");
  }
  console.log("Development data cleared.");
}

main().catch((err) => {
  console.error("dev:reset failed:", err instanceof Error ? err.message : "unknown error");
  process.exit(1);
});
