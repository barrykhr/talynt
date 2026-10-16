import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives/PageHeader";
import { LegalBody } from "@/components/primitives/LegalBody";
import { LEGAL_UPDATED, PRIVACY_SECTIONS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How TALYNT LABS handles personal information belonging to candidates, clients and visitors to this website.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title="What we hold, and why."
        lede="We ask candidates to trust us with their career, and clients to trust us with their hiring. This page explains what happens to the information that changes hands."
      />
      <LegalBody sections={PRIVACY_SECTIONS} updated={LEGAL_UPDATED} />
    </>
  );
}
