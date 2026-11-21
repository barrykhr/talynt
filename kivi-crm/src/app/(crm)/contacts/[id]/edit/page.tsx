import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { companyOptions, teamOptions } from "@/lib/data/lookups";
import { isUuid } from "@/lib/data/query";
import { Card, PageHeader } from "@/components/ui";
import { ContactForm } from "@/components/record-forms";
import type { Contact } from "@/lib/types";

export const metadata: Metadata = { title: "Edit contact" };

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  await requireMemberPage();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const [{ data }, team, companies] = await Promise.all([supabase.from("contacts").select("*").eq("id", id).maybeSingle(), teamOptions(), companyOptions(supabase)]);
  if (!data) notFound();
  const contact = data as Contact;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={<Link href={`/contacts/${id}`} className="hover:underline">{contact.full_name}</Link>} title="Edit contact" />
      <Card><ContactForm contact={contact} team={team} companies={companies} /></Card>
    </div>
  );
}
