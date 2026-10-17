import type { Metadata } from "next";
import Link from "next/link";
import { ENQUIRY, HERO, SCALE, TAGLINE } from "@/lib/contour/content";
import { EMPLOYER_HERO } from "@/lib/contour/proposed";
import { EMAIL, ROUTES } from "@/lib/contour/site";
import { DEMO_ASSESSMENT, DEMO_CANDIDATE, DEMO_EVALUATION, DEMO_RESPONSES, DEMO_ROLE } from "@/lib/assessment/demo";
import { clientView } from "@/lib/assessment/evaluate";
import { ButtonLink, Eyebrow, Headline } from "@/components/contour/ui";
import { Problem } from "@/components/contour/home/Problem";
import { HumanSection } from "@/components/contour/home/Sections";
import { SourcingProgression } from "@/components/contour/graphics/SourcingProgression";
import {
  CompactContinues,
  CompactDecision,
  CompactEvaluation,
  CompactHowWeWork,
  CompactPhilosophy,
  CompactShortlist,
} from "@/components/contour/employers/Compact";
import { ContactForm } from "@/components/contour/ContactForm";
import { FaqList } from "@/components/contour/FaqList";

export const metadata: Metadata = {
  title: "For employers",
  description:
    "TALYNT helps companies find relevant talent through focused sourcing, role-specific evaluation and better candidate context — and leaves the decision with you.",
};

/**
 * The employer homepage. One proposition — focused sourcing, role-specific
 * evaluation, better candidate context — told in the order a hiring leader
 * would ask about it. Approved copy is used as written; new copy comes from
 * lib/contour/proposed.ts. The full set of approved client sections is on
 * /employers/approach.
 */
export default function EmployersPage() {
  const shared = clientView(DEMO_EVALUATION);

  return (
    <>
      {/* --- Hero ------------------------------------------------------------ */}
      <section aria-labelledby="employers-heading" className="relative overflow-hidden">
        <div className="ct-wrap grid gap-12 pt-10 pb-14 md:pt-16 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-6">
            <Eyebrow tone="green">{TAGLINE}</Eyebrow>
            <Headline as="h1" id="employers-heading" lead={EMPLOYER_HERO.title} turn={EMPLOYER_HERO.titleItalic} size="l" className="mt-7" />
            <p className="ct-lede mt-7 max-w-xl">{EMPLOYER_HERO.lede}</p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <ButtonLink href="#enquiry">{EMPLOYER_HERO.primary}</ButtonLink>
              <ButtonLink href="#how-we-work" variant="secondary" arrow="down">
                {EMPLOYER_HERO.secondary}
              </ButtonLink>
            </div>
          </div>
          <div className="lg:col-span-6">
            <SourcingProgression />
          </div>
        </div>
        <div className="ct-wrap pb-6">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-5 md:grid-cols-4">
            {HERO.pillars.map((p, i) => (
              <li key={p} className="flex items-baseline gap-3">
                <span className="ct-meta ct-green tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[0.92rem] text-[var(--ct-ink-2)]">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- The position (approved homepage statement) ----------------------- */}
      <section aria-labelledby="position-heading" className="ct-section ct-tint">
        <div className="ct-wrap grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <h2 id="position-heading" className="ct-display ct-xl lg:col-span-7">
            {HERO.titleLead} <span className="ct-mark ct-mark-draw" data-on="true">{HERO.titleMark}</span> {HERO.titleTail}
          </h2>
          <p className="ct-lede lg:col-span-5">{HERO.lede}</p>
        </div>
      </section>

      {/* --- 01 The hiring problem ------------------------------------------- */}
      <Problem index="01" />

      {/* --- 02–07 Told in pictures; the long form is on /employers/approach -- */}
      <CompactPhilosophy index="02" />
      <CompactHowWeWork index="03" />
      <CompactContinues index="04" />
      <CompactEvaluation index="05" role={DEMO_ROLE} assessment={DEMO_ASSESSMENT} evaluation={shared} />
      <CompactShortlist index="06" role={DEMO_ROLE} candidate={DEMO_CANDIDATE} assessment={DEMO_ASSESSMENT} responses={DEMO_RESPONSES} evaluation={shared} />
      <CompactDecision index="07" />
      <HumanSection index="08" />

      {/* --- Conversion ------------------------------------------------------ */}
      <section id="enquiry" aria-labelledby="enquiry-heading" className="ct-section scroll-mt-[var(--ct-nav-h)]">
        <div className="ct-wrap grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Eyebrow tone="green">{ENQUIRY.eyebrow}</Eyebrow>
            <Headline id="enquiry-heading" lead={ENQUIRY.title} turn={ENQUIRY.titleItalic} className="mt-6" />
            <p className="ct-lede mt-6">{ENQUIRY.lede}</p>
            <ul className="mt-8 grid gap-2">
              {SCALE.constants.map((c) => (
                <li key={c} className="flex items-center gap-3 text-[0.96rem]">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-[2px] bg-[var(--ct-green)]" />
                  {c}
                </li>
              ))}
            </ul>
            <p className="ct-small mt-8">
              {ENQUIRY.direct}{" "}
              <a href={`mailto:${EMAIL.general}`} className="ct-link">
                {EMAIL.general}
              </a>
            </p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <ContactForm idPrefix="emp-enquiry" />
          </div>
        </div>
      </section>

      {/* --- FAQ ------------------------------------------------------------- */}
      <section id="faq" aria-labelledby="faq-heading" className="ct-section ct-tint">
        <div className="ct-wrap grid gap-10 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Eyebrow>Questions</Eyebrow>
            <h2 id="faq-heading" className="ct-display ct-l mt-6">
              For employers
            </h2>
            <Link href={ROUTES.faq} className="ct-link mt-6 inline-block text-[0.95rem]">
              All questions
            </Link>
          </div>
          <div className="lg:col-span-8">
            <FaqList categories={["employers"]} />
          </div>
        </div>
      </section>
    </>
  );
}
