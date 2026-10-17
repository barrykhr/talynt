import type { Metadata } from "next";
import { ABOUT } from "@/lib/contour/content";
import { ROUTES } from "@/lib/contour/site";
import { ButtonLink, Eyebrow, Headline } from "@/components/contour/ui";
import { Meeting } from "@/components/contour/graphics/Meeting";
import { Reveal } from "@/components/primitives/Reveal";

export const metadata: Metadata = {
  title: "About",
  description: ABOUT.description,
};

/** The approved About page — the company's position and the four beliefs behind it. */
export default function AboutPage() {
  return (
    <>
      <header className="ct-wrap grid gap-12 pt-12 pb-16 md:pt-20 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <Eyebrow tone="ink">{ABOUT.eyebrow}</Eyebrow>
          <Headline as="h1" lead={ABOUT.title} turn={ABOUT.titleItalic} size="xl" className="mt-7" />
          <p className="ct-lede mt-7 max-w-2xl">{ABOUT.lede}</p>
        </div>
        <div className="hidden lg:col-span-4 lg:flex lg:items-end lg:justify-end">
          <Meeting className="w-full max-w-[18rem]" decorative />
        </div>
      </header>

      <section aria-labelledby="beliefs-heading" className="ct-section ct-tint">
        <div className="ct-wrap grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <h2 id="beliefs-heading" className="ct-meta ct-green lg:sticky lg:top-[calc(var(--ct-nav-h)+2rem)]">
              {ABOUT.beliefsLabel}
            </h2>
          </div>
          <ol className="flex flex-col lg:col-span-8">
            {ABOUT.beliefs.map((belief, i) => (
              <Reveal
                as="li"
                key={belief.title}
                delay={i * 0.06}
                className="grid grid-cols-[2.5rem_1fr] gap-2 border-t py-8 first:border-t-0 first:pt-0"
              >
                <span className="ct-meta ct-green tabular-nums pt-2">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="ct-display ct-s">{belief.title}</h3>
                  <p className="ct-body mt-3 max-w-2xl">{belief.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="partnership-heading" className="ct-section">
        <div className="ct-wrap-narrow text-center">
          <h2 id="partnership-heading" className="ct-display ct-l">
            {ABOUT.partnership} <span className="ct-italic block">{ABOUT.partnershipItalic}</span>
          </h2>
          <p className="ct-lede mx-auto mt-6 max-w-xl">{ABOUT.partnershipBody}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={ROUTES.enquiry}>{ABOUT.primary}</ButtonLink>
            <ButtonLink href={`${ROUTES.employers}#how-we-work`} variant="secondary" arrow="none">
              {ABOUT.secondary}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
