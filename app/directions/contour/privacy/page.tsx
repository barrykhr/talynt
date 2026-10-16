import type { Metadata } from "next";
import { LEGAL } from "@/lib/contour/content";
import { LEGAL_UPDATED, PRIVACY_SECTIONS } from "@/lib/legal";
import { LegalPage } from "@/components/contour/LegalPage";

export const metadata: Metadata = {
  title: "Privacy",
  description: LEGAL.privacy.description,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow={LEGAL.privacy.eyebrow}
      title={LEGAL.privacy.title}
      lede={LEGAL.privacy.lede}
      sections={PRIVACY_SECTIONS}
      updated={LEGAL_UPDATED}
    />
  );
}
