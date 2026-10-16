import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives/PageHeader";
import { LegalBody } from "@/components/primitives/LegalBody";
import { LEGAL_UPDATED, TERMS_SECTIONS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The terms on which TALYNT LABS makes this website available, including how to read the illustrative interface content shown on it.",
};

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Terms"
        title="The terms of this site."
        lede="Short, and worth reading if you are looking at the interfaces on the homepage and wondering what is real."
      />
      <LegalBody sections={TERMS_SECTIONS} updated={LEGAL_UPDATED} />
    </>
  );
}
