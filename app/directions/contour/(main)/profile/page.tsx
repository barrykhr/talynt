import type { Metadata } from "next";
import { Suspense } from "react";
import { PROFILE } from "@/lib/contour/proposed";
import { Eyebrow } from "@/components/contour/ui";
import { ProfileBuilder } from "@/components/contour/candidate/ProfileBuilder";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Create your TALYNT profile once — experience, skills, education and preferences — and use it for every role you apply to.",
};

export default function ProfilePage() {
  return (
    <>
      <header className="ct-wrap pt-12 pb-10 md:pt-16">
        <Eyebrow tone="violet">{PROFILE.eyebrow}</Eyebrow>
        <h1 className="ct-display ct-xl mt-7 max-w-4xl">
          {PROFILE.title} <span className="ct-italic">{PROFILE.titleItalic}</span>
        </h1>
        <p className="ct-lede mt-6 max-w-2xl">{PROFILE.lede}</p>
      </header>
      <section aria-label="Profile" className="ct-wrap pb-[var(--ct-section)]">
        <Suspense fallback={<div aria-busy="true" className="ct-panel h-64" />}>
          <ProfileBuilder />
        </Suspense>
      </section>
    </>
  );
}
