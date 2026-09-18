import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { GlobalNetwork } from "@/components/visuals/GlobalNetwork";

export function Global() {
  return (
    <Section id="global" tone="ink" aria-labelledby="global-heading">
      <div className="wrap grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
        <SectionHeader
          index="13"
          eyebrow="Global"
          headingId="global-heading"
          title={
            <>
              Talent has no borders.
              <br />
              <span className="italic">Neither do we.</span>
            </>
          }
          lede="We help companies access exceptional talent across markets while keeping the hiring process deeply human."
        />

        <Reveal delay={0.15}>
          <GlobalNetwork />
          <p className="mono-micro mt-6 opacity-35">
            Markets we are built to search across. Coverage on a given mandate is
            agreed before the search begins.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
