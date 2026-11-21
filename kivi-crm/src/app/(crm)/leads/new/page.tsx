import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { companyOptions, teamOptions } from "@/lib/data/lookups";
import { isUuid, param, type SearchParams } from "@/lib/data/query";
import { activeProvider } from "@/lib/research/providers";
import { Card, PageHeader } from "@/components/ui";
import { LeadForm } from "@/components/lead-form";
import type { WebSubmission } from "@/lib/types";

export const metadata: Metadata = { title: "Add a lead" };

export default async function NewLeadPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const member = await requireMemberPage();
  const sp = await searchParams;
  const supabase = await createClient();
  const subId = param(sp, "submission");
  const [team, companies, sub] = await Promise.all([
    teamOptions(), companyOptions(supabase),
    isUuid(subId) ? supabase.from("web_submissions").select("*").eq("id", subId).eq("status", "new").maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={<Link href="/pipeline" className="hover:underline">Pipeline</Link>} title="Add a lead"
        description={sub.data ? "Converting a website enquiry. Check for duplicates before saving." : "Only the company is required. The lead starts at New lead in the pipeline."} />
      <Card><LeadForm companies={companies} team={team} defaultOwner={member.id} submission={sub.data as WebSubmission | null} researchAvailable={Boolean(activeProvider())} /></Card>
    </div>
  );
}
