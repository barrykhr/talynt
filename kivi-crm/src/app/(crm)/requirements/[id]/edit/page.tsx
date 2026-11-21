import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { companyOptions, contactOptions, opportunityOptions, teamOptions } from "@/lib/data/lookups";
import { isUuid } from "@/lib/data/query";
import { Card, PageHeader } from "@/components/ui";
import { RequirementForm } from "@/components/record-forms";
import type { Requirement } from "@/lib/types";

export const metadata: Metadata = { title: "Edit requirement" };

export default async function EditRequirementPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMemberPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const [{ data }, links, team, companies, contacts, opportunities] = await Promise.all([
    supabase.from("requirements").select("*").eq("id", id).maybeSingle(),
    supabase.from("requirement_contacts").select("contact_id").eq("requirement_id", id),
    teamOptions(), companyOptions(supabase), contactOptions(supabase), opportunityOptions(supabase),
  ]);
  if (!data) notFound();
  const req = data as Requirement;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={<Link href={`/requirements/${id}`} className="hover:underline">{req.role_title}</Link>} title="Edit requirement" />
      <Card>
        <RequirementForm requirement={req} team={team} companies={companies} contacts={contacts} opportunities={opportunities}
          selectedContacts={(links.data ?? []).map((l: { contact_id: string }) => l.contact_id)} />
      </Card>
    </div>
  );
}
