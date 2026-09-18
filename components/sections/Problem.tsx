import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { FunnelCascade } from "@/components/visuals/FunnelCascade";

export function Problem() {
  return (
    <Section id="problem" tone="ink" aria-labelledby="problem-heading">
      <div className="wrap grid gap-16 lg:grid-cols-[1fr_1.05fr] lg:gap-24">
        <SectionHeader
          index="01"
          eyebrow="The problem"
          headingId="problem-heading"
          title={
            <>
              The hiring funnel is full of information.
              <br className="hidden sm:block" />{" "}
              <span className="opacity-45">Very little of it is intelligence.</span>
            </>
          }
          lede="Volume is not the constraint. Nobody is short of profiles, platforms or inbound applications. What is scarce is the reasoning that turns all of it into a decision you can stand behind."
          className="lg:sticky lg:top-32 lg:self-start"
        />

        <div>
          <FunnelCascade />

          <Reveal delay={0.1}>
            <p className="display mt-16 border-t border-current/10 pt-10 text-(length:--text-h3) text-balance">
              The hard part isn&rsquo;t finding people.
              <br />
              <span className="italic">It&rsquo;s knowing who deserves your attention.</span>
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
