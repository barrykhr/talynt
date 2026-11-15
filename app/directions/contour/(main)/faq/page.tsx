import type { Metadata } from "next";
import { Eyebrow, Illustrative } from "@/components/contour/ui";
import { FaqBrowser } from "@/components/contour/FaqBrowser";
import { EMPLOYERS_ONLY } from "@/lib/contour/variant";

export const metadata: Metadata = {
  title: "FAQ",
  description: EMPLOYERS_ONLY
    ? "Questions about TALYNT LABS — for employers, and about your information."
    : "Questions about TALYNT LABS — for employers, for candidates, and about your information.",
};

export default function FaqPage() {
  return (
    <>
      <header className="ct-wrap pt-12 pb-12 md:pt-16">
        <Eyebrow tone="ink">Frequently asked</Eyebrow>
        <h1 className="ct-display ct-xl mt-7 max-w-4xl">
          Asked, and <span className="ct-italic">answered.</span>
        </h1>
        <p className="ct-lede mt-6 max-w-2xl">
          {EMPLOYERS_ONLY ? (
            <>For employers, and about what happens to your information. Each answer links to the page it comes from.</>
          ) : (
            <>
              For employers, for candidates, and about what happens to your information. Each answer links to the page it
              comes from.
            </>
          )}
        </p>
        <Illustrative className="mt-6 max-w-2xl">
          Proposed for approval: the current site has no FAQ, so every answer here is assembled from what it already says.
        </Illustrative>
      </header>
      <section aria-label="Questions" className="ct-wrap pb-[var(--ct-section)]">
        <FaqBrowser />
      </section>
    </>
  );
}
