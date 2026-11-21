import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/data/query";
import { Card, Notice, PageHeader } from "@/components/ui";
import { FindingCard } from "@/components/research-panel";
import { formatDateTime } from "@/lib/time";
import type { ResearchFinding, ResearchSnapshot } from "@/lib/types";

export const metadata: Metadata = { title: "Research snapshot" };

export default async function SnapshotPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMemberPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("research_snapshots").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const snap = data as ResearchSnapshot;
  const [{ data: f }, { data: company }, { data: job }] = await Promise.all([
    supabase.from("research_findings").select("*").eq("snapshot_id", id).order("position"),
    supabase.from("companies").select("id, name").eq("id", snap.company_id).single(),
    supabase.from("research_jobs").select("input").eq("id", snap.job_id).maybeSingle(),
  ]);
  return (
    <>
      <PageHeader eyebrow={<Link className="hover:underline" href={`/companies/${snap.company_id}#research`}>{company?.name}</Link>}
        title={`Research snapshot — ${formatDateTime(snap.checked_at)}`} description={`${snap.provider}${snap.model ? ` · ${snap.model}` : ""}. Snapshots are immutable; only reviews change.`} />
      <div className="space-y-6">
        {snap.warnings.length ? <Notice tone="warn" title="Warnings"><ul className="list-disc pl-4">{snap.warnings.map((w) => <li key={w}>{w}</li>)}</ul></Notice> : null}
        {snap.about_brief ? <Card title="Suggested about brief"><p className="text-sm">{snap.about_brief}</p></Card> : null}
        <Card title="Findings"><ul className="space-y-2">{((f ?? []) as ResearchFinding[]).map((x) => <FindingCard key={x.id} f={x} back={`/research/snapshots/${id}`} />)}</ul></Card>
        <Card title="What the CRM sent to the provider">
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded bg-sunken p-3 text-xs">{JSON.stringify(job?.input ?? {}, null, 2)}</pre>
        </Card>
      </div>
    </>
  );
}
