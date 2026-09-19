import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { TalyntOS } from "@/components/visuals/TalyntOS";
import { Clip } from "@/components/primitives/Clip";

const CAPABILITIES = [
  { label: "Sourcing", note: "Search across the market, not just the inbox." },
  { label: "Candidate intelligence", note: "Experience, signals and reasoning in one record." },
  { label: "Conversation intelligence", note: "Structured interviews, consistently captured." },
  { label: "Recruitment workflow", note: "One place the whole search actually lives." },
  { label: "Analytics", note: "What is working in this search, and what isn't." },
  { label: "Client visibility", note: "Progress your team can see without asking." },
];

export function Intelligence() {
  return (
    <Section id="intelligence" tone="ink" aria-labelledby="intelligence-heading">
      <div className="wrap">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-end">
          <SectionHeader
            index="08"
            eyebrow="TALYNT Intelligence"
            headingId="intelligence-heading"
            title={
              <>
                Built in-house.
                <br />
                <span className="italic">Used on every search.</span>
              </>
            }
            lede="Our internal talent intelligence platform brings sourcing, candidate intelligence, structured evaluation and recruitment workflows into one operating system."
          />

          <Reveal delay={0.15}>
            <div className="border-l-2 border-signal/40 pl-6">
              <p className="text-[1.02rem] leading-[1.6] opacity-70">
                The platform isn&rsquo;t what we sell. The search is.
              </p>
              <p className="mt-4 text-[1.02rem] leading-[1.6] opacity-70">
                TALYNT OS is the engine underneath it — the reason our shortlists
                arrive with reasoning attached, and the reason the fourth search
                we run for you is better than the first.
              </p>
            </div>
          </Reveal>
        </div>

        {/* The product being written, immediately before the product itself. */}
        <Reveal delay={0.08} className="mt-16">
          <div className="overflow-hidden rounded-lg border border-paper-100/12 bg-ink-900">
            <div className="flex items-center justify-between gap-4 border-b border-paper-100/10 px-5 py-3">
              <span className="mono-micro text-signal">Built in-house</span>
              <span className="mono-micro opacity-30">Used on every search</span>
            </div>
            <div className="h-[clamp(8rem,13vw,13rem)] w-full">
              <Clip
                src="/media/os-typing"
                poster="/media/os-typing-poster.jpg"
                fit="contain"
                label="An editor window with a line of code being typed out."
              />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-4">
          <TalyntOS />
        </Reveal>

        <p className="mono-micro mt-6 opacity-35">
          Illustrative interface. Candidate references and readings are fictional.
        </p>

        <ul className="mt-16 grid gap-px border-t border-paper-100/10 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability, i) => (
            <Reveal
              as="li"
              key={capability.label}
              delay={i * 0.06}
              className="border-b border-paper-100/10 py-6 pr-8"
            >
              <p className="mono-micro text-signal">{capability.label}</p>
              <p className="mt-2.5 text-[0.92rem] leading-[1.55] opacity-60">
                {capability.note}
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );
}
