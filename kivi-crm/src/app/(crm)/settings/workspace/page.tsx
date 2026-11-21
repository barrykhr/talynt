import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { googleConfig } from "@/lib/env";
import { PROVIDERS, activeProvider } from "@/lib/research/providers";
import { displayName, getTeamMap } from "@/lib/data/team";
import { Badge, Card, PageHeader, Tabs } from "@/components/ui";
import { WorkspaceSettingsForm } from "@/components/settings-forms";
import { formatDateTime } from "@/lib/time";
import type { AppSettings } from "@/lib/types";

export const metadata: Metadata = { title: "Workspace settings" };

export default async function WorkspaceSettingsPage() {
  await requireAdminPage();
  const supabase = await createClient();
  const [{ data }, team] = await Promise.all([supabase.from("app_settings").select("*").maybeSingle(), getTeamMap()]);
  const s = data as AppSettings;
  const provider = activeProvider();
  const rows: [string, boolean, string][] = [
    ["Google sign-in (Supabase Auth)", true, "Configured in Supabase; see docs/SETUP.md"],
    ["Gmail & Calendar connections", Boolean(googleConfig()), googleConfig() ? "Server credentials present" : "Needs Google OAuth client + TOKEN_ENCRYPTION_KEY"],
    ["Company research", Boolean(provider), provider ? `Using ${provider.label}` : `Needs one of: ${PROVIDERS.map((p) => p.missingConfig().join(" ")).join(" / ")}`],
    ["Monitoring sources (Greenhouse, Lever, RSS)", true, "Public APIs/feeds, no key needed. Paid providers are not enabled."],
    ["Website lead capture", process.env.LEAD_CAPTURE_ENABLED === "true", process.env.LEAD_CAPTURE_ENABLED === "true" ? "Endpoint enabled" : "Set LEAD_CAPTURE_ENABLED=true (docs/LEAD_CAPTURE.md)"],
    ["Scheduled jobs", Boolean(process.env.CRON_SECRET), process.env.CRON_SECRET ? "CRON_SECRET set" : "Needs CRON_SECRET and a cron schedule"],
  ];
  return (
    <>
      <PageHeader title="Settings" description="Workspace rules apply to everyone. Every change is recorded in the audit log." />
      <Tabs label="Settings" current="workspace" tabs={[
        { key: "me", label: "My settings & Google", href: "/settings" },
        { key: "workspace", label: "Workspace (admin)", href: "/settings/workspace" },
        { key: "team", label: "Team & audit (admin)", href: "/admin" },
      ]} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card title="Rules"><WorkspaceSettingsForm s={s} /></Card>
        <aside className="space-y-6">
          <Card title="Integration status">
            <ul className="space-y-2 text-sm">
              {rows.map(([label, ok, note]) => (
                <li key={label}><div className="flex items-center justify-between gap-2"><span>{label}</span><Badge tone={ok ? "ok" : "warn"}>{ok ? "Ready" : "Not configured"}</Badge></div><div className="text-xs text-muted">{note}</div></li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">No status here is shown as live unless the configuration exists. Live behaviour still needs the checklist in the docs.</p>
          </Card>
          <Card title="Last change">
            <p className="text-sm text-muted">{s.updated_by ? `${displayName(team.get(s.updated_by))} · ${formatDateTime(s.updated_at)}` : "Defaults (never changed)"}</p>
            <p className="mt-2 text-xs"><Link className="link" href="/admin?action=settings.changed">See settings history</Link></p>
          </Card>
        </aside>
      </div>
    </>
  );
}
