import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { companyOptions, contactOptions, teamOptions } from "@/lib/data/lookups";
import { isUuid, param, type SearchParams } from "@/lib/data/query";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { OpportunityForm } from "@/components/record-forms";
import { IconBuilding, IconPlus } from "@/components/icons";

export const metadata: Metadata = { title: "New opportunity" };

export default async function NewOpportunityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const member = await requireMemberPage();
  const sp = await searchParams;
  const supabase = await createClient();
  const [team, companies, contacts] = await Promise.all([teamOptions(), companyOptions(supabase), contactOptions(supabase)]);
  const company = param(sp, "company");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={<Link href="/pipeline" className="hover:underline">Pipeline</Link>} title="New opportunity" />
      {companies.length === 0 ? (
        <div className="card">
          <EmptyState icon={<IconBuilding />} title="Add a company first" description="Every opportunity belongs to a company."
            actions={<LinkButton variant="primary" href="/companies/new"><IconPlus /> Add a company</LinkButton>} />
        </div>
      ) : (
        <Card><OpportunityForm team={team} companies={companies} contacts={contacts} defaultCompany={isUuid(company) ? company : undefined} defaultOwner={member.id} /></Card>
      )}
    </div>
  );
}
