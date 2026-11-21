// Adds a person to the CRM allowlist. Used once to create the first admin;
// after that, admins add people from the Team & audit page.
//
//   npm run provision-user -- someone@kivitronicsconsulting.com --role admin --name "Full Name"
import { createClient } from "@supabase/supabase-js";
import { loadEnv, requireEnv } from "./_env";

const DOMAIN = "kivitronicsconsulting.com";

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) flags[args[i].slice(2)] = args[++i] ?? "";
    else positional.push(args[i]);
  }
  const email = (positional[0] ?? "").trim().toLowerCase();
  const role = flags.role ?? "member";
  const name = flags.name?.trim() || null;

  if (!/^[^@\s]+@[^@\s]+$/.test(email) || email.split("@")[1] !== DOMAIN) {
    console.error(`Usage: npm run provision-user -- name@${DOMAIN} [--role admin|member] [--name "Full Name"]`);
    process.exit(1);
  }
  if (role !== "admin" && role !== "member") {
    console.error("--role must be admin or member");
    process.exit(1);
  }

  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing } = await supabase.from("app_users").select("id, role, status").eq("email", email).maybeSingle();
  if (existing) {
    console.log(`${email} is already on the team list (role: ${existing.role}, status: ${existing.status}). No change made.`);
    return;
  }
  const { data, error } = await supabase.from("app_users").insert({ email, role, full_name: name, status: "invited" }).select("id").single();
  if (error) {
    console.error(`Could not add ${email}: ${error.message}`);
    process.exit(1);
  }
  await supabase.from("audit_log").insert({
    actor_email: "provisioning-script", action: "admin.user_invited", target_type: "app_user", target_id: data.id,
    details: { email, role, via: "provision-user script" },
  });
  console.log(`Added ${email} as ${role}. They can now sign in with Google at your CRM URL.`);
}

main().catch((err) => {
  console.error("Provisioning failed:", err instanceof Error ? err.message : "unknown error");
  process.exit(1);
});
