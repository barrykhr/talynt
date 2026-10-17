import type { Metadata } from "next";
import { LEGAL } from "@/lib/contour/content";
import { LEGAL_UPDATED, TERMS_SECTIONS } from "@/lib/legal";
import { LegalPage } from "@/components/contour/LegalPage";

export const metadata: Metadata = {
  title: "Terms",
  description: LEGAL.terms.description,
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow={LEGAL.terms.eyebrow}
      title={LEGAL.terms.title}
      lede={LEGAL.terms.lede}
      sections={TERMS_SECTIONS}
      updated={LEGAL_UPDATED}
    />
  );
}
