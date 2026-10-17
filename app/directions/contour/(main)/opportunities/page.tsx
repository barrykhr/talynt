import type { Metadata } from "next";
import { Suspense } from "react";
import { ROLES_PAGE } from "@/lib/contour/content";
import { Eyebrow } from "@/components/contour/ui";
import { RoleExplorer } from "@/components/contour/candidate/RoleExplorer";

export const metadata: Metadata = {
  title: "Explore opportunities",
  description:
    "Open roles with the reasoning behind them, the compensation band stated up front, and an honest note on what is hard about each one.",
};

export default function OpportunitiesPage() {
  return (
    <>
      <header className="ct-wrap pt-12 pb-10 md:pt-20 md:pb-14">
        <Eyebrow tone="violet">{ROLES_PAGE.eyebrow}</Eyebrow>
        <h1 className="ct-display ct-xl mt-7 max-w-4xl">
          {ROLES_PAGE.titleLead} <span className="ct-italic ct-mark">{ROLES_PAGE.titleItalic}</span> {ROLES_PAGE.titleTail}
        </h1>
        <p className="ct-lede mt-7 max-w-2xl">{ROLES_PAGE.lede}</p>
      </header>
      <section aria-label="Open roles" className="ct-wrap pb-[var(--ct-section)]">
        {/* Filters are read from the URL, which needs a client boundary. */}
        <Suspense fallback={<p className="ct-meta ct-mute border-y py-6">Loading roles…</p>}>
          <RoleExplorer />
        </Suspense>
      </section>
    </>
  );
}
