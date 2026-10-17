import { HUMAN_AI, INTELLIGENCE, MANIFESTO } from "@/lib/contour/content";
import { ProductShowcase } from "@/components/contour/product/ProductShowcase";
import { MeetingOnScroll } from "@/components/contour/graphics/MeetingOnScroll";
import { Headline, Illustrative, SectionHead, Eyebrow } from "@/components/contour/ui";
import { Reveal } from "@/components/primitives/Reveal";

/**
 * Two approved sections shared by the employer pages: the product (TALYNT OS,
 * on /employers/approach) and the human element (on /employers).
 */

/* ===========================================================================
   05 — The product
   =========================================================================== */

export function ProductSection({ index = "05" }: { index?: string } = {}) {
  return (
    <section id="product" aria-labelledby="product-heading" className="ct-section">
      <div className="ct-wrap">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <SectionHead
            index={index}
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

export function HumanSection({ index = "06" }: { index?: string } = {}) {
  return (
    <section id="human" aria-labelledby="human-heading" className="ct-section ct-tint">
      <div className="ct-wrap grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--ct-nav-h)+3rem)]">
            <Eyebrow index={index}>{HUMAN_AI.eyebrow}</Eyebrow>
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
