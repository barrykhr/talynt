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
    "sync_review_items", "sync_exclusions", "activities", "opportunity_contacts", "requirement_contacts",
    "requirements", "opportunities", "contacts", "companies", "imports",
  ];
  for (const table of order) {
    const key = table.endsWith("_contacts") ? "contact_id" : table === "sync_exclusions" ? "user_id" : "id";
    const { error } = await supabase.from(table).delete().neq(key, NIL);
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
