// Loads .env.local (then .env) for CLI scripts. Never prints values.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.resolve(process.cwd(), file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || process.env[m[1]] !== undefined) continue;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name}. Set it in .env.local or the environment.`);
    process.exit(1);
  }
  return v;
}

/** Dev-only scripts refuse to run anywhere that could be production. */
export function assertDevelopmentTarget(scriptName: string) {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const host = new URL(url).hostname;
  const local = host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local");
  const problems: string[] = [];
  if (process.env.NODE_ENV === "production") problems.push("NODE_ENV is production");
  if (process.env.VERCEL_ENV === "production") problems.push("VERCEL_ENV is production");
  if (process.env.ALLOW_DEV_SEED !== "true") problems.push("ALLOW_DEV_SEED is not 'true'");
  if (!local) problems.push(`Supabase URL host '${host}' is not a local development stack`);
  if (problems.length) {
    console.error(`Refusing to run ${scriptName}:\n  - ${problems.join("\n  - ")}\nThis script only runs against a local Supabase stack (supabase start).`);
    process.exit(1);
  }
}
