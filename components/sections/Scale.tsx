import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";

const STAGES = [
  {
    index: "01",
    name: "Early-stage",
    thesis: "Critical first hires. Build the foundation.",
    body: "The first ten people set the ceiling for the next hundred. At this stage a wrong hire isn't a cost — it's a direction. We spend more time on context here than anywhere else, because there is less of it written down.",
  },
  {
    index: "02",
    name: "Growth",
    thesis: "Scale teams without lowering the hiring bar.",
    body: "Volume arrives and the bar quietly moves. We hold it where you set it — and when the market genuinely can't meet it, we tell you that instead of sending you people who don't.",
  },
  {
    index: "03",
    name: "Enterprise",
    thesis: "Consistency, visibility and intelligence across complex hiring environments.",
    body: "More stakeholders, more process, more noise. The work is making one standard survive all of it, across functions, geographies and hiring managers who have never met each other.",
  },
];

const CONSTANTS = [
  "A human reads every profile",
  "Four people, not forty",
  "Reasoning attached to every candidate",
  "We tell you what we're unsure about",
];

export function Scale() {
  return (
    <Section id="companies" tone="paper" aria-labelledby="scale-heading">
      <div className="wrap">
        <SectionHeader
          index="12"
          eyebrow="For companies"
          headingId="scale-heading"
          title={
            <>
              Different scale.
              <br />
              <span className="italic">Same standard.</span>
            </>
          }
          lede="What changes with company size is the complexity of the context. What the search itself has to prove does not."
        />

        <div className="mt-20">
          {STAGES.map((stage, i) => (
            <Reveal key={stage.index} delay={i * 0.08}>
              <article className="grid gap-6 border-t border-ink-900/15 py-10 md:grid-cols-[auto_1fr_1.15fr] md:gap-12 lg:py-14">
                <span className="mono-micro text-signal tabular-nums md:pt-3">
                  {stage.index}
                </span>
                <div>
                  <h3 className="display text-(length:--text-h2) leading-[0.95]">
                    {stage.name}
                  </h3>
                  <p className="mt-4 max-w-sm text-[1.02rem] leading-[1.45] text-fg-70">
                    {stage.thesis}
                  </p>
                </div>
                <p className="max-w-xl text-[0.98rem] leading-[1.65] text-fg-55 md:pt-2">
                  {stage.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-6 border-t border-ink-900/15 pt-12">
            <p className="mono-micro mb-7 text-fg-45">
              What doesn&rsquo;t change, at any size
            </p>
            <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              {CONSTANTS.map((constant) => (
                <li key={constant} className="flex items-baseline gap-3">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 translate-y-[-0.15em] rounded-full bg-signal"
                  />
                  <span className="text-[0.95rem] leading-snug text-fg-75">
                    {constant}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
