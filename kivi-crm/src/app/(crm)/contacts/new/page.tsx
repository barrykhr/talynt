import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { companyOptions, teamOptions } from "@/lib/data/lookups";
import { isUuid, param, type SearchParams } from "@/lib/data/query";
import { Card, PageHeader } from "@/components/ui";
import { ContactForm } from "@/components/record-forms";

export const metadata: Metadata = { title: "Add contact" };

export default async function NewContactPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const member = await requireMemberPage();
  const sp = await searchParams;
  const supabase = await createClient();
  const [team, companies] = await Promise.all([teamOptions(), companyOptions(supabase)]);
  const company = param(sp, "company");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={<Link href="/contacts" className="hover:underline">Contacts</Link>} title="Add a contact" description="We'll flag likely duplicates (same email, or a similar name at the same company)." />
      <Card><ContactForm team={team} companies={companies} defaultCompany={isUuid(company) ? company : undefined} defaultOwner={member.id} /></Card>
    </div>
  );
}
