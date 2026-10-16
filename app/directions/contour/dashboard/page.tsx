import type { Metadata } from "next";
import { PASSPORT } from "@/lib/contour/content";
import { Eyebrow } from "@/components/contour/ui";
import { Dashboard } from "@/components/contour/candidate/Dashboard";

export const metadata: Metadata = {
  title: "Your dashboard",
  description: "Your Career Passport, the roles you saved and what this device sent — all held in this browser.",
};

export default function DashboardPage() {
  return (
    <>
      <header className="ct-wrap pt-12 pb-10 md:pt-16">
        <Eyebrow tone="violet">Your dashboard</Eyebrow>
        <h1 className="ct-display ct-xl mt-7">
          {PASSPORT.savedTitle} <span className="ct-italic">{PASSPORT.savedTitleItalic}</span>
        </h1>
        <p className="ct-lede mt-6 max-w-2xl">{PASSPORT.savedLede}</p>
        <p className="ct-small mt-3 max-w-2xl">There is no account on this site, so there is nothing to sign in to — this page reads this browser only.</p>
      </header>
      <section aria-label="Your Career Passport, applications and saved roles" className="ct-wrap pb-[var(--ct-section)]">
        <Dashboard />
      </section>
    </>
  );
}
