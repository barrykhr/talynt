import type { Metadata } from "next";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTeamMap, displayName } from "@/lib/data/team";
import { Badge, Card, LinkButton, PageHeader, Table, Td, Th } from "@/components/ui";
import { ImportWizard } from "@/components/import-wizard";
import { IconDownload } from "@/components/icons";
import { formatDateTime } from "@/lib/time";
import type { ImportRecord } from "@/lib/types";

export const metadata: Metadata = { title: "Import & export" };

export default async function ImportPage() {
  await requireMemberPage();
  const supabase = await createClient();
  const [{ data }, team] = await Promise.all([
    supabase.from("imports").select("id, entity, filename, created_by, created_at, total_rows, created_count, updated_count, skipped_count, failed_count").order("created_at", { ascending: false }).limit(20),
    getTeamMap(),
  ]);
  const imports = (data ?? []) as Omit<ImportRecord, "report">[];
  return (
    <>
      <PageHeader title="Import & export" description="Bring in lead lists from spreadsheets, and export CRM data as CSV." />
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <ImportWizard />
        <aside className="space-y-6">
          <Card title="Export CSV">
            <p className="mb-3 text-sm text-muted">Exports include every non-archived record you can see. Cells that look like formulas are neutralised.</p>
            <div className="flex flex-col gap-2">
              {[["companies", "Companies"], ["contacts", "Contacts"], ["opportunities", "Opportunities"], ["requirements", "Requirements"], ["activities", "Activities"]].map(([k, l]) => (
                <LinkButton key={k} size="sm" href={`/api/export/${k}`} className="justify-start"><IconDownload /> {l}</LinkButton>
              ))}
            </div>
          </Card>
          <Card title="Tips">
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted">
              <li>One row per lead. Several rows with the same company become one company with several contacts.</li>
              <li>Dates as YYYY-MM-DD or DD/MM/YYYY.</li>
              <li>Owner can be a teammate&apos;s email or first name.</li>
              <li>Source values like “LinkedIn”, “Referral”, “WhatsApp” are recognised automatically.</li>
            </ul>
          </Card>
        </aside>
      </div>

      <Card title="Recent imports" bodyClassName="p-0" className="mt-6">
        {imports.length === 0 ? <p className="p-4 text-sm text-faint">No imports yet.</p> : (
          <Table caption="Recent imports">
            <thead><tr><Th>File</Th><Th>When</Th><Th>By</Th><Th>Result</Th><Th>Report</Th></tr></thead>
            <tbody>
              {imports.map((i) => (
                <tr key={i.id}>
                  <Td><div className="font-medium">{i.filename}</div><div className="text-xs capitalize text-muted">{i.entity}</div></Td>
                  <Td className="text-muted">{formatDateTime(i.created_at)}</Td>
                  <Td>{displayName(team.get(i.created_by ?? ""))}</Td>
                  <Td><div className="flex flex-wrap gap-1"><Badge tone="ok">{i.created_count} imported</Badge>{i.skipped_count ? <Badge tone="warn">{i.skipped_count} skipped</Badge> : null}{i.failed_count ? <Badge tone="danger">{i.failed_count} failed</Badge> : null}</div></Td>
                  <Td><a className="link text-sm" href={`/api/import/${i.id}/report?all=1`}>CSV</a></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
