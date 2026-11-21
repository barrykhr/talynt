import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { companyOptions, contactOptions, teamOptions } from "@/lib/data/lookups";
import { isUuid } from "@/lib/data/query";
import { Card, PageHeader } from "@/components/ui";
import { OpportunityForm } from "@/components/record-forms";
import type { Opportunity } from "@/lib/types";

export const metadata: Metadata = { title: "Edit opportunity" };

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMemberPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const [{ data }, links, team, companies, contacts] = await Promise.all([
    supabase.from("opportunities").select("*").eq("id", id).maybeSingle(),
    supabase.from("opportunity_contacts").select("contact_id").eq("opportunity_id", id),
    teamOptions(), companyOptions(supabase), contactOptions(supabase),
  ]);
  if (!data) notFound();
  const opp = data as Opportunity;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={<Link href={`/pipeline/${id}`} className="hover:underline">{opp.title}</Link>} title="Edit opportunity"
        description="Stage changes are recorded in the history. Only the owner or an admin can reassign." />
      <Card>
        <OpportunityForm opportunity={opp} team={team} companies={companies} contacts={contacts}
          selectedContacts={(links.data ?? []).map((l: { contact_id: string }) => l.contact_id)} />
      </Card>
    </div>
  );
}
