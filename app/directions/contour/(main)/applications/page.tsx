import type { Metadata } from "next";
import { APPLICATIONS } from "@/lib/contour/proposed";
import { Eyebrow } from "@/components/contour/ui";
import { ApplicationsList } from "@/components/contour/candidate/Applications";

export const metadata: Metadata = {
  title: "Your applications",
  description: "Applications started and sent from this device, each with its own role-specific assessment, and the profile they share.",
};

export default function ApplicationsPage() {
  return (
    <>
      <header className="ct-wrap pt-12 pb-10 md:pt-16">
        <Eyebrow tone="violet">{APPLICATIONS.eyebrow}</Eyebrow>
        <h1 className="ct-display ct-xl mt-7 max-w-4xl">
          {APPLICATIONS.title} <span className="ct-italic">{APPLICATIONS.titleItalic}</span>
        </h1>
        <p className="ct-lede mt-6 max-w-2xl">{APPLICATIONS.lede}</p>
      </header>
      <section aria-label="Your applications and profile" className="ct-wrap pb-[var(--ct-section)]">
        <ApplicationsList />
      </section>
    </>
  );
}
