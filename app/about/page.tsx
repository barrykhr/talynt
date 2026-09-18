import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives/PageHeader";
import { Section } from "@/components/primitives/Section";
import { Reveal } from "@/components/primitives/Reveal";
import { CTAButton } from "@/components/primitives/CTAButton";

export const metadata: Metadata = {
  title: "About",
  description:
    "TALYNT LABS is a talent intelligence company. We combine deep sourcing, human conversations and technology built in-house to help companies make better hiring decisions.",
};

const BELIEFS = [
  {
    title: "Hiring is a context problem, not a matching problem.",
    body: "A candidate can meet every requirement on a job description and still be wrong for the environment. Most hiring failures are context failures, and context is not something a filter can read.",
  },
  {
    title: "Quality is a refusal, not an aspiration.",
    body: "Sending fewer candidates is harder than sending more. It means doing the work of deciding, and being accountable for the decision. That is the work we are paid for.",
  },
  {
    title: "Technology should make judgment better, not optional.",
    body: "We build our own tooling because the alternative is shaping our process around software that was designed for volume. AI finds signals. People understand them.",
  },
  {
    title: "Candidates are not inventory.",
    body: "The person on the other side of the search is making one of the larger decisions of their year. They get a real conversation, a real reason and a real answer.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title={
          <>
            A talent company that thinks
            <br className="hidden md:block" />{" "}
            <span className="italic">like a product company.</span>
          </>
        }
        lede="TALYNT LABS sits between executive search, modern recruitment and talent intelligence. We were built around one idea: that better hiring decisions come from better signals, not more profiles."
      />

      <Section tone="ink">
        <div className="wrap grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="mono-micro text-signal">What we believe</p>
          </div>

          <ol className="flex flex-col">
            {BELIEFS.map((belief, i) => (
              <Reveal as="li" key={belief.title} delay={i * 0.08}>
                <article className="border-t border-paper-100/10 py-10">
                  <span className="mono-micro text-signal tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="display mt-6 text-(length:--text-h3) text-balance">
                    {belief.title}
                  </h2>
                  <p className="mt-5 max-w-2xl text-[1rem] leading-[1.65] opacity-60">
                    {belief.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </ol>
        </div>
      </Section>

      <Section tone="paper">
        <div className="wrap-narrow text-center">
          <Reveal>
            <h2 className="display text-(length:--text-h2) text-balance">
              TALYNT is the partnership.
              <br />
              <span className="italic">LABS is how we keep improving it.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-8 max-w-xl text-(length:--text-lede) leading-[1.45] opacity-60">
              The service is the product. The technology is the engine that makes
              the service different — and it is ours, so it changes as fast as
              what we learn.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-11 flex flex-wrap justify-center gap-4">
              <CTAButton href="/#contact">Build your team</CTAButton>
              <CTAButton href="/#how-we-work" variant="outline" trailing="none">
                See how we work
              </CTAButton>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
