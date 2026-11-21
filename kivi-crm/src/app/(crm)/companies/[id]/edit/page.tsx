import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { teamOptions } from "@/lib/data/lookups";
import { isUuid } from "@/lib/data/query";
import { Card, PageHeader } from "@/components/ui";
import { CompanyForm } from "@/components/record-forms";
import type { Company } from "@/lib/types";

export const metadata: Metadata = { title: "Edit company" };

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMemberPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const [{ data }, team] = await Promise.all([supabase.from("companies").select("*").eq("id", id).maybeSingle(), teamOptions()]);
  if (!data) notFound();
  const company = data as Company;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={<Link href={`/companies/${id}`} className="hover:underline">{company.name}</Link>} title="Edit company"
        description="Only the current owner or an admin can reassign ownership." />
      <Card><CompanyForm company={company} team={team} /></Card>
    </div>
  );
}
