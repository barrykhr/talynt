import Link from "next/link";
import {
  CANDIDATE_PAGE,
  ENQUIRY,
  FIT,
  FOR_TALENT,
  HOW_WE_WORK,
  HUMAN_AI,
  INTELLIGENCE,
  MANIFESTO,
  SCALE,
  SOURCING,
} from "@/lib/contour/content";
import { EMAIL, ROUTES } from "@/lib/contour/site";
import { SearchSignals } from "@/components/contour/graphics/SearchSignals";
import { TwoSidedConnection } from "@/components/contour/graphics/RoleToTalent";
import { ProductShowcase } from "@/components/contour/product/ProductShowcase";
import { MeetingOnScroll } from "@/components/contour/graphics/MeetingOnScroll";
import { ProcessRail } from "@/components/contour/home/ProcessRail";
import { FaqPreview } from "@/components/contour/home/FaqPreview";
import { ButtonLink, Eyebrow, Headline, Illustrative, SectionHead } from "@/components/contour/ui";
import { Reveal } from "@/components/primitives/Reveal";

/* ===========================================================================
   03 — Talent intelligence: the search, drawn
   =========================================================================== */

export function IntelligenceSection() {
  return (
    <section id="intelligence" aria-labelledby="intelligence-heading" className="ct-section">
      <div className="ct-wrap">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <SectionHead
            index="03"
            eyebrow={SOURCING.eyebrow}
            id="intelligence-heading"
            lead={SOURCING.title}
            turn={SOURCING.titleItalic}
            lede={SOURCING.lede}
            className="lg:col-span-7"
          />
          <div className="lg:col-span-4 lg:col-start-9">
            <Illustrative>
              Conceptual drawing of how a search narrows — not a live search. {SOURCING.note}
            </Illustrative>
          </div>
        </div>
        <div className="mt-14 md:mt-20">
          <SearchSignals />
        </div>
      </div>
    </section>
  );
}

/* ===========================================================================
   04 — Two journeys, one meeting point
   =========================================================================== */

export function JourneysSection() {
  return (
    <section id="journeys" aria-labelledby="journeys-heading" className="ct-section ct-tint">
      <div className="ct-wrap">
        <h2 id="journeys-heading" className="sr-only">
          Two journeys: employers and candidates
        </h2>

        <div className="grid gap-px overflow-hidden rounded-[var(--ct-r-l)] border bg-[var(--ct-line)] lg:grid-cols-2">
          {/* Employers */}
          <article className="flex flex-col bg-[var(--ct-surface)] p-6 sm:p-10" aria-labelledby="journey-employers">
            <Eyebrow index="04" tone="green">
              {SCALE.eyebrow}
            </Eyebrow>
            <Headline as="h3" id="journey-employers" lead={SCALE.title} turn={SCALE.titleItalic} size="m" className="mt-6" />
            <p className="ct-body mt-5 max-w-lg">{SCALE.lede}</p>
            <ul className="mt-8 flex flex-col">
              {SCALE.constants.map((c) => (
                <li key={c} className="flex items-center gap-3 border-t py-3 text-[0.98rem]">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-[2px] bg-[var(--ct-green)]" />
                  {c}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-10">
              <ButtonLink href={ROUTES.enquiry}>{ENQUIRY.submit}</ButtonLink>
              <ButtonLink href={ROUTES.employers} variant="quiet">
                For employers
              </ButtonLink>
            </div>
          </article>

          {/* Candidates */}
          <article className="flex flex-col bg-[var(--ct-surface)] p-6 sm:p-10" aria-labelledby="journey-candidates">
            <Eyebrow index="04" tone="violet">
              {FOR_TALENT.eyebrow}
            </Eyebrow>
            <Headline
              as="h3"
              id="journey-candidates"
              lead={FOR_TALENT.title}
              turn={FOR_TALENT.titleItalic}
              size="m"
              className="mt-6"
            />
            <p className="ct-body mt-5 max-w-lg">{FOR_TALENT.lede}</p>
            <ul className="mt-8 flex flex-col">
              {FOR_TALENT.commitments.map((c) => (
                <li key={c.title} className="flex items-start gap-3 border-t py-3">
                  <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--ct-violet)]" />
                  <span>
                    <span className="block text-[0.98rem]">{c.title}</span>
                    <span className="ct-small block">{c.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-10">
              <ButtonLink href={ROUTES.opportunities}>Explore roles</ButtonLink>
              <ButtonLink href={ROUTES.profile} variant="secondary" arrow="none">
                {CANDIDATE_PAGE.closePrimary}
              </ButtonLink>
            </div>
          </article>
        </div>

        {/* Where the two journeys meet. */}
        <div className="mt-20 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Eyebrow tone="ink">{FIT.eyebrow}</Eyebrow>
            <Headline as="h3" lead={FIT.title} turn={FIT.titleItalic} size="m" className="mt-6" />
          </div>
          <div className="lg:col-span-8">
            <TwoSidedConnection />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===========================================================================
   05 — The product
   =========================================================================== */

export function ProductSection() {
  return (
    <section id="product" aria-labelledby="product-heading" className="ct-section">
      <div className="ct-wrap">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <SectionHead
            index="05"
            eyebrow={INTELLIGENCE.eyebrow}
            id="product-heading"
            lead={INTELLIGENCE.title}
            turn={INTELLIGENCE.titleItalic}
            lede={INTELLIGENCE.lede}
            className="lg:col-span-7"
          />
          <Reveal className="lg:col-span-4 lg:col-start-9">
            <div className="border-l-2 ct-b-green pl-5">
              <p className="text-[1.02rem] leading-[1.6]">{INTELLIGENCE.asideLead}</p>
              <p className="ct-body mt-3">{INTELLIGENCE.aside}</p>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-14">
          <ProductShowcase />
        </Reveal>
        <Illustrative className="mt-5">{INTELLIGENCE.note}</Illustrative>

        <ul className="mt-14 grid gap-x-8 border-t sm:grid-cols-2 lg:grid-cols-3">
          {INTELLIGENCE.capabilities.map((c) => (
            <li key={c.label} className="border-b py-5">
              <p className="text-[0.98rem] font-medium">{c.label}</p>
              <p className="ct-small mt-1">{c.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ===========================================================================
   06 — The human element
   =========================================================================== */

export function HumanSection() {
  return (
    <section id="human" aria-labelledby="human-heading" className="ct-section ct-tint">
      <div className="ct-wrap grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--ct-nav-h)+3rem)]">
            <Eyebrow index="06">{HUMAN_AI.eyebrow}</Eyebrow>
            <Headline id="human-heading" lead={HUMAN_AI.title} turn={HUMAN_AI.titleItalic} className="mt-6" />
            <MeetingOnScroll className="mt-10 w-full max-w-md" />
            <p className="ct-display ct-s mt-8">
              {HUMAN_AI.close} <span className="ct-italic ct-green">{HUMAN_AI.closeItalic}</span>
            </p>
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="grid grid-cols-[1fr_4rem_1fr] items-baseline gap-3 pb-4">
            <p className="ct-meta ct-mute text-right">{HUMAN_AI.machine}</p>
            <span />
            <p className="ct-meta ct-mute">{HUMAN_AI.human}</p>
          </div>
          <ul>
            {HUMAN_AI.pairs.map(([machine, human]) => (
              <li key={machine} className="grid grid-cols-[1fr_4rem_1fr] items-center gap-3 border-t py-3.5">
                <span className="text-right text-[0.98rem] text-[var(--ct-ink-2)]">{machine}</span>
                <span aria-hidden="true" className="flex items-center">
                  <span className="h-1.5 w-1.5 rounded-[1px] bg-[var(--ct-green)]" />
                  <span className="h-px flex-1 bg-[var(--ct-line-2)]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--ct-ink)]" />
                </span>
                <span className="ct-display text-[1.25rem] leading-tight">{human}</span>
              </li>
            ))}
          </ul>

          {/* The approved manifesto, set as a closing page rather than a slogan. */}
          <div className="mt-20 border-t pt-12">
            <p className="ct-display ct-l">
              {MANIFESTO.title} <span className="ct-italic">{MANIFESTO.titleItalic}</span>
            </p>
            <div className="mt-8 flex flex-col gap-1.5">
              {MANIFESTO.middle.map((line) => (
                <p key={line} className="ct-display ct-s ct-mute">
                  {line}
                </p>
              ))}
              <p className="ct-display ct-s mt-2">{MANIFESTO.turn}</p>
            </div>
            <p className="ct-lede mt-10 max-w-xl text-[var(--ct-ink)]">
              {MANIFESTO.belief} <span className="ct-mark ct-italic">{MANIFESTO.beliefItalic}</span>{" "}
              {MANIFESTO.beliefTail}
            </p>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {MANIFESTO.triad.map((line) => (
                <li key={line} className="ct-display ct-s">
                  {line}
                </li>
              ))}
            </ul>
            <p className="ct-meta ct-mute mt-8">{MANIFESTO.signoff}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===========================================================================
   07 — How it works, for both
   =========================================================================== */

export function HowItWorksSection() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="ct-section">
      <div className="ct-wrap">
        <SectionHead
          index="07"
          eyebrow={HOW_WE_WORK.eyebrow}
          id="how-heading"
          lead={HOW_WE_WORK.title}
          turn={HOW_WE_WORK.titleItalic}
          lede={HOW_WE_WORK.lede}
        />
        <div className="mt-16">
          <ProcessRail />
        </div>
      </div>
    </section>
  );
}

/* ===========================================================================
   08 — The next step, for both
   =========================================================================== */

export function ConvertSection() {
  return (
    <section id="start" aria-labelledby="start-heading" className="ct-section ct-tint">
      <div className="ct-wrap">
        <h2 id="start-heading" className="sr-only">
          Start here
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="ct-panel flex flex-col p-6 sm:p-10">
            <Eyebrow tone="green">{ENQUIRY.eyebrow}</Eyebrow>
            <p className="ct-display ct-m mt-6">
              {ENQUIRY.title} <span className="ct-italic">{ENQUIRY.titleItalic}</span>
            </p>
            <p className="ct-body mt-5 max-w-md">{ENQUIRY.lede}</p>
            <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-3 pt-10">
              <ButtonLink href={ROUTES.enquiry}>{ENQUIRY.submit}</ButtonLink>
              <span className="ct-small">
                {ENQUIRY.direct}:{" "}
                <a href={`mailto:${EMAIL.general}`} className="ct-link">
                  {EMAIL.general}
                </a>
              </span>
            </div>
          </article>

          <article className="ct-panel flex flex-col p-6 sm:p-10">
            <Eyebrow tone="violet">For candidates</Eyebrow>
            <p className="ct-display ct-m mt-6">
              {CANDIDATE_PAGE.closeTitle} <span className="ct-italic">{CANDIDATE_PAGE.closeTitleItalic}</span>
            </p>
            <p className="ct-body mt-5 max-w-md">{CANDIDATE_PAGE.closeLede}</p>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-10">
              <ButtonLink href={ROUTES.profile}>{CANDIDATE_PAGE.closePrimary}</ButtonLink>
              <ButtonLink href={ROUTES.opportunities} variant="secondary">
                {CANDIDATE_PAGE.closeSecondary}
              </ButtonLink>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ===========================================================================
   09 — FAQ preview
   =========================================================================== */

export function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="ct-section">
      <div className="ct-wrap grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Eyebrow index="08">Questions</Eyebrow>
          <h2 id="faq-heading" className="ct-display ct-l mt-6">
            Asked, and <span className="ct-italic">answered.</span>
          </h2>
          <Link href={ROUTES.faq} className="ct-btn ct-btn-secondary mt-8">
            All questions <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <FaqPreview />
        </div>
      </div>
    </section>
  );
}
