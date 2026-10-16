import type { Metadata } from "next";
import {
  CAPABILITIES,
  CONTEXT,
  CONVERSATION,
  ENQUIRY,
  FIT,
  GLOBAL,
  HOW_WE_WORK,
  QUALITY,
  SCALE,
  SOURCING,
  VISIBILITY,
} from "@/lib/contour/content";
import { EMAIL } from "@/lib/contour/site";
import { ButtonLink, Eyebrow, Headline, Illustrative, SectionHead } from "@/components/contour/ui";
import { SearchSignals } from "@/components/contour/graphics/SearchSignals";
import { CompatibilityMap } from "@/components/contour/graphics/RoleToTalent";
import { ClientView, Conversation, ProductWindow } from "@/components/contour/product/ProductShowcase";
import { ProcessRail } from "@/components/contour/home/ProcessRail";
import { CapabilityList, ContextLayers, Markets, QualityCompare } from "@/components/contour/employers/EmployerSections";
import { ContactForm } from "@/components/contour/ContactForm";
import { Meeting } from "@/components/contour/graphics/Meeting";
import { Reveal } from "@/components/primitives/Reveal";

export const metadata: Metadata = {
  title: "For employers",
  description:
    "How TALYNT LABS runs a search: context before sourcing, structured conversations, compatibility rather than similarity, and a focused shortlist with the reasoning attached.",
};

/**
 * The employer story in full — every approved client section, in the order a
 * hiring leader would ask about it: is this for a company like mine, how do
 * you understand the role, how do you find and judge people, what do I see,
 * and how do we start.
 */
export default function EmployersPage() {
  return (
    <>
      {/* --- Who it is for --------------------------------------------------- */}
      <section aria-labelledby="employers-heading" className="relative overflow-hidden">
        <div className="ct-wrap grid gap-12 pt-12 pb-16 md:pt-20 lg:grid-cols-12 lg:gap-10 lg:pb-24">
          <div className="lg:col-span-7">
            <Eyebrow tone="green">{SCALE.eyebrow}</Eyebrow>
            <Headline as="h1" id="employers-heading" lead={SCALE.title} turn={SCALE.titleItalic} size="xl" className="mt-7" />
            <p className="ct-lede mt-7 max-w-xl">{SCALE.lede}</p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <ButtonLink href="#enquiry">{ENQUIRY.submit}</ButtonLink>
              <ButtonLink href="#how-we-work" variant="secondary" arrow="down">
                {HOW_WE_WORK.eyebrow}
              </ButtonLink>
            </div>
          </div>
          <div className="flex items-end lg:col-span-4 lg:col-start-9">
            <Meeting className="w-full" label="A role's context and a person's context, overlapping." idPrefix="emp-hero" />
          </div>
        </div>

        <div className="ct-wrap pb-[var(--ct-section)]">
          <ol className="border-b">
            {SCALE.stages.map((stage, i) => (
              <Reveal as="li" key={stage.name} delay={i * 0.06} className="border-t">
                <article className="grid gap-4 py-8 md:grid-cols-12 md:gap-8">
                  <span className="ct-meta ct-green tabular-nums md:col-span-1 md:pt-3">{String(i + 1).padStart(2, "0")}</span>
                  <div className="md:col-span-5">
                    <h2 className="ct-display ct-l">{stage.name}</h2>
                    <p className="mt-3 text-[1.05rem] leading-[1.45]">{stage.thesis}</p>
                  </div>
                  <p className="ct-body md:col-span-6 md:pt-2">{stage.body}</p>
                </article>
              </Reveal>
            ))}
          </ol>
          <div className="mt-10">
            <p className="ct-meta ct-mute">{SCALE.constantsLabel}</p>
            <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              {SCALE.constants.map((c) => (
                <li key={c} className="flex items-center gap-3 text-[0.98rem]">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-[2px] bg-[var(--ct-green)]" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --- Context --------------------------------------------------------- */}
      <section id="context" aria-labelledby="context-heading" className="ct-section ct-tint">
        <div className="ct-wrap">
          <SectionHead index="01" eyebrow={CONTEXT.eyebrow} id="context-heading" lead={CONTEXT.title} turn={CONTEXT.titleItalic} lede={CONTEXT.lede} />
          <div className="mt-14">
            <ContextLayers />
          </div>
          <Reveal>
            <p className="ct-display ct-l mt-16 border-t pt-12">
              {CONTEXT.close} <span className="ct-italic">{CONTEXT.closeItalic}</span> {CONTEXT.closeTail}
            </p>
          </Reveal>
        </div>
      </section>

      {/* --- Sourcing -------------------------------------------------------- */}
      <section id="sourcing" aria-labelledby="sourcing-heading" className="ct-section">
        <div className="ct-wrap">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <SectionHead
              index="02"
              eyebrow={SOURCING.eyebrow}
              id="sourcing-heading"
              lead={SOURCING.title}
              turn={SOURCING.titleItalic}
              lede={SOURCING.lede}
              className="lg:col-span-7"
            />
            <Illustrative className="lg:col-span-4 lg:col-start-9">
              Conceptual drawing of how a search narrows — not a live search. {SOURCING.note}
            </Illustrative>
          </div>
          <div className="mt-14">
            <SearchSignals />
          </div>
        </div>
      </section>

      {/* --- Conversation ---------------------------------------------------- */}
      <section id="conversation" aria-labelledby="conversation-heading" className="ct-section ct-tint">
        <div className="ct-wrap">
          <SectionHead
            index="03"
            eyebrow={CONVERSATION.eyebrow}
            id="conversation-heading"
            lead={CONVERSATION.title}
            turn={CONVERSATION.titleItalic}
            lede={CONVERSATION.lede}
          />
          <Reveal className="mt-14">
            <ProductWindow title="Conversation">
              <Conversation />
            </ProductWindow>
          </Reveal>
        </div>
      </section>

      {/* --- Fit ------------------------------------------------------------- */}
      <section id="fit" aria-labelledby="fit-heading" className="ct-section">
        <div className="ct-wrap grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--ct-nav-h)+2rem)]">
              <SectionHead index="04" eyebrow={FIT.eyebrow} id="fit-heading" lead={FIT.title} turn={FIT.titleItalic} lede={FIT.lede} size="m" />
              {/* The equation, set as type. */}
              <p className="mt-10 flex flex-wrap items-baseline gap-x-3 gap-y-2 border-y py-5">
                {FIT.inputs.map((input, i) => (
                  <span key={input} className="flex items-baseline gap-3">
                    <span className="ct-display text-[1.3rem]">{input}</span>
                    {i < FIT.inputs.length - 1 && (
                      <span aria-hidden="true" className="ct-green">
                        ×
                      </span>
                    )}
                  </span>
                ))}
                <span aria-hidden="true" className="ct-green">
                  =
                </span>
                <span className="ct-display ct-mark text-[1.3rem]">{FIT.result}</span>
              </p>
            </div>
          </div>
          <div className="lg:col-span-7">
            <CompatibilityMap />
            <p className="ct-display ct-m mt-10">
              {FIT.close} <span className="ct-mute">{FIT.closeQuiet}</span>
            </p>
          </div>
        </div>
      </section>

      {/* --- Quality --------------------------------------------------------- */}
      <section id="quality" aria-labelledby="quality-heading" className="ct-section ct-tint">
        <div className="ct-wrap">
          <SectionHead index="05" eyebrow={QUALITY.eyebrow} id="quality-heading" lead={QUALITY.title} turn={QUALITY.titleItalic} lede={QUALITY.lede} />
          <div className="mt-14">
            <QualityCompare />
          </div>
          <Illustrative className="mt-6">{QUALITY.note}</Illustrative>
        </div>
      </section>

      {/* --- How we work ----------------------------------------------------- */}
      <section id="how-we-work" aria-labelledby="how-heading" className="ct-section">
        <div className="ct-wrap grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <SectionHead index="06" eyebrow={HOW_WE_WORK.eyebrow} id="how-heading" lead={HOW_WE_WORK.title} turn={HOW_WE_WORK.titleItalic} lede={HOW_WE_WORK.lede} size="m" />
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <ProcessRail only="employers" />
          </div>
        </div>
      </section>

      {/* --- Client visibility ------------------------------------------------ */}
      <section id="visibility" aria-labelledby="visibility-heading" className="ct-section ct-tint">
        <div className="ct-wrap">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <SectionHead
              index="07"
              eyebrow={VISIBILITY.eyebrow}
              id="visibility-heading"
              lead={VISIBILITY.title}
              turn={VISIBILITY.titleItalic}
              lede={VISIBILITY.lede}
              className="lg:col-span-6"
            />
            <ol className="flex flex-col lg:col-span-5 lg:col-start-8">
              {VISIBILITY.answers.map((a, i) => (
                <li key={a} className="flex items-baseline gap-4 border-t py-3">
                  <span className="ct-meta ct-green tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[1rem]">{a}</span>
                </li>
              ))}
            </ol>
          </div>
          <Reveal className="mt-14">
            <ProductWindow title="Client view">
              <ClientView />
            </ProductWindow>
          </Reveal>
        </div>
      </section>

      {/* --- Capabilities and markets ---------------------------------------- */}
      <section id="capabilities" aria-labelledby="capabilities-heading" className="ct-section">
        <div className="ct-wrap grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <SectionHead index="08" eyebrow={CAPABILITIES.eyebrow} id="capabilities-heading" lead={CAPABILITIES.title} turn={CAPABILITIES.titleItalic} size="m" />
            <div className="mt-10">
              <CapabilityList />
            </div>
          </div>
          <div id="global" className="lg:col-span-4 lg:col-start-9">
            <Eyebrow index="09">{GLOBAL.eyebrow}</Eyebrow>
            <Headline as="h2" lead={GLOBAL.title} turn={GLOBAL.titleItalic} size="m" className="mt-6" />
            <p className="ct-body mt-5">{GLOBAL.lede}</p>
            <div className="mt-8">
              <Markets />
            </div>
          </div>
        </div>
      </section>

      {/* --- Start a search -------------------------------------------------- */}
      <section id="enquiry" aria-labelledby="enquiry-heading" className="ct-section ct-tint scroll-mt-[var(--ct-nav-h)]">
        <div className="ct-wrap grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Eyebrow tone="green">{ENQUIRY.eyebrow}</Eyebrow>
            <Headline id="enquiry-heading" lead={ENQUIRY.title} turn={ENQUIRY.titleItalic} className="mt-6" />
            <p className="ct-lede mt-6">{ENQUIRY.lede}</p>
            <div className="mt-10 border-t pt-6">
              <p className="ct-meta ct-mute">{ENQUIRY.direct}</p>
              <a href={`mailto:${EMAIL.general}`} className="ct-display ct-s ct-link mt-3 inline-block">
                {EMAIL.general}
              </a>
            </div>
          </div>
          <div className="ct-panel p-6 sm:p-9 lg:col-span-6 lg:col-start-7">
            <ContactForm idPrefix="emp-enquiry" />
          </div>
        </div>
      </section>
    </>
  );
}
