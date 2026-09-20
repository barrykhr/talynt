import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { CTAButton } from "@/components/primitives/CTAButton";

const DIMENSIONS = [
  "Where you've been",
  "What you're good at",
  "What you're looking for",
  "Why you're moving",
  "What motivates you",
  "Where you want to go",
];

const COMMITMENTS = [
  {
    title: "We tell you the compensation band",
    body: "Before the first interview, not at offer stage.",
  },
  {
    title: "We tell you why, if it's a no",
    body: "A real reason from the client, not a template.",
  },
  {
    title: "We ask before we submit you anywhere",
    body: "Your profile is not sent into the market on your behalf.",
  },
];

export function ForTalent() {
  return (
    <Section id="for-talent" tone="paper" aria-labelledby="for-talent-heading">
      <div className="wrap">
        <SectionHeader
          index="14"
          eyebrow="For talent"
          headingId="for-talent-heading"
          title={
            <>
              We recruit people.
              <br />
              <span className="italic">Not profiles.</span>
            </>
          }
          lede="Every candidate we speak to is more than a CV in a database."
        />

        <div className="mt-20 grid gap-16 lg:grid-cols-[1.15fr_1fr] lg:gap-24">
          <ol className="flex flex-col">
            {DIMENSIONS.map((dimension, i) => (
              <Reveal as="li" key={dimension} delay={i * 0.06}>
                <div className="flex items-baseline gap-6 border-t border-ink-900/15 py-6">
                  <span className="mono-micro text-signal tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="display text-(length:--text-h3)">
                    {dimension}
                  </span>
                </div>
              </Reveal>
            ))}
          </ol>

          <div className="lg:pt-6">
            <Reveal>
              <p className="mono-micro mb-8 text-fg-45">What you can expect</p>
            </Reveal>
            <ul className="flex flex-col gap-7">
              {COMMITMENTS.map((commitment, i) => (
                <Reveal as="li" key={commitment.title} delay={0.1 + i * 0.08}>
                  <p className="text-[1.05rem] leading-snug">{commitment.title}</p>
                  <p className="mt-2 text-[0.92rem] leading-[1.6] text-fg-55">
                    {commitment.body}
                  </p>
                </Reveal>
              ))}
            </ul>

            <Reveal delay={0.3}>
              <div className="mt-12 border-l-2 border-signal pl-6">
                <p className="display text-(length:--text-h3) text-balance">
                  If the opportunity isn&rsquo;t right, we&rsquo;d rather tell you
                  than <span className="italic">force a match.</span>
                </p>
              </div>
              <div className="mt-9">
                <CTAButton href="#contact" variant="outline">
                  Talk to TALYNT
                </CTAButton>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </Section>
  );
}
