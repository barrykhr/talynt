import type { Metadata } from "next";
import Link from "next/link";
import { ENQUIRY, HERO, HOW_WE_WORK, SCALE, TAGLINE } from "@/lib/contour/content";
import { CONTINUES, DECISION, EMPLOYER_HERO, EVALUATION, HOW, SHORTLIST } from "@/lib/contour/proposed";
import { EMAIL, ROUTES } from "@/lib/contour/site";
import { DEMO_ASSESSMENT, DEMO_CANDIDATE, DEMO_EVALUATION, DEMO_RESPONSES, DEMO_ROLE } from "@/lib/assessment/demo";
import { clientView } from "@/lib/assessment/evaluate";
import { ButtonLink, Eyebrow, Headline, Illustrative, SectionHead } from "@/components/contour/ui";
import { Philosophy, Problem } from "@/components/contour/home/Problem";
import { HumanSection } from "@/components/contour/home/Sections";
import { SourcingProgression } from "@/components/contour/graphics/SourcingProgression";
import { WorkContinues } from "@/components/contour/employers/WorkContinues";
import { AssessmentFlow, AssessmentReview } from "@/components/contour/assessment/Review";
import { ContactForm } from "@/components/contour/ContactForm";
import { FaqList } from "@/components/contour/FaqList";
import { Reveal } from "@/components/primitives/Reveal";
import { REVIEW } from "@/lib/contour/proposed";

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

      {/* --- 01, 02 The hiring problem ---------------------------------------- */}
      <Problem index="01" />
      <Philosophy index="02" />

      {/* --- 03 How TALYNT works (the approved six layers) -------------------- */}
      <section id="how-we-work" aria-labelledby="how-heading" className="ct-section scroll-mt-[var(--ct-nav-h)]">
        <div className="ct-wrap">
          <SectionHead index="03" eyebrow={HOW_WE_WORK.eyebrow} id="how-heading" lead={HOW_WE_WORK.title} turn={HOW_WE_WORK.titleItalic} lede={HOW_WE_WORK.lede} />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-[var(--ct-r-l)] border bg-[var(--ct-line)] sm:grid-cols-2 lg:grid-cols-3">
            {HOW_WE_WORK.layers.map((layer, i) => (
              <Reveal as="li" key={layer.title} delay={i * 0.05} className="flex flex-col bg-[var(--ct-surface)] p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="ct-meta ct-green tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="ct-meta ct-mute text-right">{HOW.who[i]}</span>
                </div>
                <h3 className="ct-display ct-m mt-4">{layer.title}</h3>
                <p className="ct-body mt-2">{layer.body}</p>
                {i === 2 && (
                  <Link href={`${ROUTES.approach}#sourcing`} className="ct-link mt-auto pt-4 text-[0.92rem]">
                    {HOW.searchLink}
                  </Link>
                )}
                {i === 3 && (
                  <a href="#evaluation" className="ct-link mt-auto pt-4 text-[0.92rem]">
                    {EVALUATION.eyebrow}
                  </a>
                )}
              </Reveal>
            ))}
          </ol>
          <p className="ct-display ct-s mt-10">
            {HOW_WE_WORK.close} <span className="ct-italic">{HOW_WE_WORK.closeItalic}</span>
          </p>
          <Link href={ROUTES.approach} className="ct-btn ct-btn-secondary mt-8">
            {HOW.detailLink} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* --- 04 While you run the business ----------------------------------- */}
      <section id="continues" aria-labelledby="continues-heading" className="ct-section ct-tint">
        <div className="ct-wrap">
          <SectionHead index="04" eyebrow={CONTINUES.eyebrow} id="continues-heading" lead={CONTINUES.title} turn={CONTINUES.titleItalic} lede={CONTINUES.lede} />
          <div className="mt-14">
            <WorkContinues />
          </div>
        </div>
      </section>

      {/* --- 05 Role-specific evaluation ------------------------------------- */}
      <section id="evaluation" aria-labelledby="evaluation-heading" className="ct-section scroll-mt-[var(--ct-nav-h)]">
        <div className="ct-wrap">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <SectionHead index="05" eyebrow={EVALUATION.eyebrow} id="evaluation-heading" lead={EVALUATION.title} turn={EVALUATION.titleItalic} lede={EVALUATION.lede} className="lg:col-span-8" />
            <ul className="flex flex-col gap-2 lg:col-span-4">
              {EVALUATION.principles.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[0.95rem] leading-snug">
                  <span aria-hidden="true" className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-[1px] bg-[var(--ct-green)]" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-14">
            <AssessmentFlow role={DEMO_ROLE} assessment={DEMO_ASSESSMENT} responses={DEMO_RESPONSES} evaluation={shared} />
          </div>
          <Illustrative className="mt-5 max-w-3xl">{REVIEW.demo}</Illustrative>
        </div>
      </section>

      {/* --- 06 A shortlist with context ------------------------------------- */}
      <section id="shortlist" aria-labelledby="shortlist-heading" className="ct-section ct-tint scroll-mt-[var(--ct-nav-h)]">
        <div className="ct-wrap">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <SectionHead index="06" eyebrow={SHORTLIST.eyebrow} id="shortlist-heading" lead={SHORTLIST.title} turn={SHORTLIST.titleItalic} lede={SHORTLIST.lede} className="lg:col-span-8" />
            <div className="lg:col-span-4">
              <Link href={ROUTES.review} className="ct-btn ct-btn-secondary">
                {EVALUATION.openReview} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="mt-14">
            <AssessmentReview role={DEMO_ROLE} candidate={DEMO_CANDIDATE} assessment={DEMO_ASSESSMENT} responses={DEMO_RESPONSES} evaluation={shared} />
          </div>
          <Illustrative className="mt-5 max-w-3xl">{REVIEW.demo}</Illustrative>
        </div>
      </section>

      {/* --- 07 The human decision -------------------------------------------- */}
      <section id="decision" aria-labelledby="decision-heading" className="ct-section">
        <div className="ct-wrap grid gap-12 lg:grid-cols-12 lg:gap-10">
          <SectionHead index="07" eyebrow={DECISION.eyebrow} id="decision-heading" lead={DECISION.title} turn={DECISION.titleItalic} lede={DECISION.lede} className="lg:col-span-6" />
          <ol className="flex flex-col lg:col-span-5 lg:col-start-8">
            {DECISION.points.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 0.06} className="grid grid-cols-[2.5rem_1fr] gap-2 border-t py-6 first:border-t-0 first:pt-0 lg:first:border-t lg:first:pt-6">
                <span className="ct-meta ct-green tabular-nums pt-1.5">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="ct-display ct-s">{p.title}</h3>
                  <p className="ct-body mt-2">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
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
