import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { CompatibilityGrid } from "@/components/visuals/CompatibilityGrid";

const INPUTS = ["Candidate", "Role", "Team", "Leadership", "Company"];

export function Fit() {
  return (
    <Section id="fit" tone="ink" aria-labelledby="fit-heading">
      <div className="wrap">
        <SectionHeader
          index="06"
          eyebrow="Fit"
          headingId="fit-heading"
          title={
            <>
              Fit isn&rsquo;t about being similar.
              <br />
              <span className="italic">It&rsquo;s about being compatible.</span>
            </>
          }
          lede="We look at how someone works, communicates, makes decisions, handles ambiguity, responds to feedback and approaches ownership — and compare those signals with the reality of the team they're joining."
        />

        {/* The equation, set as type rather than drawn as an infographic. */}
        <Reveal delay={0.1}>
          <div className="mt-16 flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-paper-100/10 py-7">
            {INPUTS.map((input, i) => (
              <span key={input} className="flex items-center gap-5">
                <span className="font-display text-(length:--text-h3) leading-none">
                  {input}
                </span>
                {i < INPUTS.length - 1 && (
                  <span className="text-signal opacity-70" aria-hidden="true">
                    ×
                  </span>
                )}
              </span>
            ))}
            <span className="text-signal opacity-70" aria-hidden="true">
              =
            </span>
            <span className="font-display text-(length:--text-h3) leading-none text-signal">
              Compatibility
            </span>
          </div>
        </Reveal>

        <div className="mt-14">
          <CompatibilityGrid />
        </div>

        <Reveal delay={0.1}>
          <p className="display mt-14 max-w-3xl text-(length:--text-h3) text-balance">
            Five dimensions align. One doesn&rsquo;t.
            <span className="opacity-50">
              {" "}
              We tell you which, before you meet them.
            </span>
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
