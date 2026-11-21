import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { displayName } from "@/lib/data/team";
import { pageParam, pageRange, param, withParams, type SearchParams } from "@/lib/data/query";
import { Badge, Card, LinkButton, PageHeader, Pagination, Table, Td, Th } from "@/components/ui";
import { InviteForm, MemberRow } from "@/components/admin-forms";
import { IconDownload } from "@/components/icons";
import { formatDateTime, formatRelative } from "@/lib/time";
import type { AuditEntry, TeamMember } from "@/lib/types";

export const metadata: Metadata = { title: "Team & audit" };

const ACTION_LABEL: Record<string, string> = {
  "auth.sign_in": "Signed in",
  "auth.first_sign_in": "First sign-in",
  "auth.sign_in_denied": "Sign-in denied",
  "auth.sign_out": "Signed out",
  "admin.user_invited": "Added team member",
  "admin.role_changed": "Changed role",
  "admin.status_changed": "Changed access",
  "integration.connected": "Connected Google",
  "integration.disconnected": "Disconnected Google",
  "record.merged": "Merged records",
  "export.csv": "Exported CSV",
  "import.completed": "Imported spreadsheet",
  "settings.changed": "Changed workspace settings",
  "research.finding_reviewed": "Reviewed research finding",
  "revenue.invoice_created": "Recorded invoice",
  "revenue.invoice_changed": "Changed invoice",
  "revenue.payment_created": "Recorded payment",
  "revenue.payment_changed": "Changed/reversed payment",
  "revenue.credit_created": "Recorded credit",
};

const AUDIT_PAGE = 50;

export default async function AdminPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireAdminPage();
  const sp = await searchParams;
  const supabase = await createClient();
  const page = pageParam(sp);
  const [from, to] = pageRange(page, AUDIT_PAGE);
  const filter = param(sp, "action");
  let auditQ = supabase.from("audit_log").select("*", { count: "exact" }).order("occurred_at", { ascending: false }).range(from, to);
  if (filter && /^[a-z_.]+$/.test(filter)) auditQ = auditQ.eq("action", filter);
  const [{ data: teamData }, { data: auditData, count }] = await Promise.all([
    supabase.from("app_users").select("id, email, full_name, role, status, last_sign_in_at, created_at").order("created_at"),
    auditQ,
  ]);
  const team = (teamData ?? []) as TeamMember[];
  const audit = (auditData ?? []) as AuditEntry[];

  return (
    <>
      <PageHeader title="Team & audit" description="Only administrators see this page. Access is limited to people listed here with @kivitronicsconsulting.com Google accounts." />
      <div className="space-y-6">
        <Card title="Add a team member">
          <p className="mb-3 text-sm text-muted">They sign in with Google using this exact address. Nobody else in the Workspace gets access unless added here.</p>
          <InviteForm />
        </Card>

        <Card title={`Team · ${team.length}`} bodyClassName="p-0">
          <Table caption="Team members">
            <thead><tr><Th>Person</Th><Th>Status</Th><Th className="hidden md:table-cell">Last sign-in</Th><Th>Role & access</Th></tr></thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.id}>
                  <Td><div className="font-medium">{displayName(m)}{m.id === me.id ? <span className="ml-1 text-xs text-muted">(you)</span> : null}</div><div className="text-xs text-muted">{m.email}</div></Td>
                  <Td>{m.status === "active" ? <Badge tone="ok">Active</Badge> : m.status === "invited" ? <Badge tone="info">Invited · not signed in yet</Badge> : <Badge tone="danger">Disabled</Badge>}</Td>
                  <Td className="hidden text-muted md:table-cell">{m.last_sign_in_at ? formatRelative(m.last_sign_in_at) : "Never"}</Td>
                  <Td><MemberRow m={m} isSelf={m.id === me.id} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="px-4 py-3 text-xs text-muted">The database refuses to remove or demote the last active administrator.</p>
        </Card>

        <Card title="Data, exports & backups">
          <p className="mb-3 text-sm text-muted">CSV exports respect permissions and neutralise spreadsheet formulas. For full backups and restores, see docs/OPERATIONS.md. There is intentionally no “delete everything” button.</p>
          <div className="flex flex-wrap gap-2">
            {["companies", "contacts", "opportunities", "requirements", "activities", "revenue", "invoices", "payments"].map((e) => (
              <LinkButton key={e} size="sm" href={`/api/export/${e}`}><IconDownload /> {e[0].toUpperCase() + e.slice(1)}</LinkButton>
            ))}
          </div>
        </Card>

        <Card title="Audit log" bodyClassName="p-0"
          actions={
            <form action="/admin" method="get" className="flex items-center gap-2">
              <label htmlFor="audit-filter" className="sr-only">Filter events</label>
              <select id="audit-filter" name="action" defaultValue={filter} className="input h-8 py-1 text-[13px]">
                <option value="">All events</option>
                {Object.entries(ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button type="submit" className="rounded-md border border-line-strong px-2.5 py-1 text-[13px]">Filter</button>
            </form>
          }>
          {audit.length === 0 ? <p className="p-4 text-sm text-faint">No events yet.</p> : (
            <>
              <Table caption="Audit log">
                <thead><tr><Th>When</Th><Th>Who</Th><Th>Event</Th><Th className="hidden md:table-cell">Details</Th></tr></thead>
                <tbody>
                  {audit.map((a) => (
                    <tr key={a.id}>
                      <Td className="whitespace-nowrap text-muted">{formatDateTime(a.occurred_at)}</Td>
                      <Td className="max-w-[220px] truncate">{a.actor_email ?? "System"}</Td>
                      <Td><Badge tone={a.action.includes("denied") ? "danger" : a.action.startsWith("admin") ? "warn" : "neutral"}>{ACTION_LABEL[a.action] ?? a.action}</Badge></Td>
                      <Td className="hidden max-w-[360px] truncate font-mono text-xs text-muted md:table-cell">{Object.keys(a.details ?? {}).length ? JSON.stringify(a.details) : "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Pagination page={page} total={count ?? 0} pageSize={AUDIT_PAGE} hrefFor={(p) => withParams("/admin", sp, { page: String(p) })} />
            </>
          )}
        </Card>
      </div>
    </>
  );
}
