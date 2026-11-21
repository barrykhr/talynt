import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { companyOptions, contactOptions, opportunityOptions, teamOptions } from "@/lib/data/lookups";
import { isUuid, param, type SearchParams } from "@/lib/data/query";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { RequirementForm } from "@/components/record-forms";
import { IconBuilding, IconPlus } from "@/components/icons";

export const metadata: Metadata = { title: "New requirement" };

export default async function NewRequirementPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const member = await requireMemberPage();
  const sp = await searchParams;
  const supabase = await createClient();
  const [team, companies, contacts, opportunities] = await Promise.all([teamOptions(), companyOptions(supabase), contactOptions(supabase), opportunityOptions(supabase)]);
  const company = param(sp, "company");
  const opportunity = param(sp, "opportunity");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={<Link href="/requirements" className="hover:underline">Requirements</Link>} title="New requirement" />
      {companies.length === 0 ? (
        <div className="card"><EmptyState icon={<IconBuilding />} title="Add a company first" description="Requirements belong to a client company."
          actions={<LinkButton variant="primary" href="/companies/new"><IconPlus /> Add a company</LinkButton>} /></div>
      ) : (
        <Card>
          <RequirementForm team={team} companies={companies} contacts={contacts} opportunities={opportunities}
            defaultCompany={isUuid(company) ? company : undefined} defaultOpportunity={isUuid(opportunity) ? opportunity : undefined} defaultOwner={member.id} />
        </Card>
      )}
    </div>
  );
}
