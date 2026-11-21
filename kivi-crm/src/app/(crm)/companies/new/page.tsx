import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { teamOptions } from "@/lib/data/lookups";
import { Card, PageHeader } from "@/components/ui";
import { CompanyForm } from "@/components/record-forms";

export const metadata: Metadata = { title: "Add company" };

export default async function NewCompanyPage() {
  const member = await requireMemberPage();
  const team = await teamOptions();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={<Link href="/companies" className="hover:underline">Companies</Link>} title="Add a company" description="We'll check for possible duplicates before saving." />
      <Card><CompanyForm team={team} defaultOwner={member.id} /></Card>
    </div>
  );
}
