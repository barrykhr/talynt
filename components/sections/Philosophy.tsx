import { Section } from "@/components/primitives/Section";
import { Reveal } from "@/components/primitives/Reveal";
import { seeded } from "@/lib/utils";

const PRINCIPLES = [
  {
    index: "01",
    title: "We source deeply.",
    body: "We don't wait for the right person to apply. We search across the talent market to find people who may never have entered your funnel.",
  },
  {
    index: "02",
    title: "We understand context.",
    body: "A candidate can have every skill on the job description and still be wrong for the environment. We understand the company, the team, the leadership and what success actually looks like.",
  },
  {
    index: "03",
    title: "We improve decisions.",
    body: "Technology helps us structure information and surface meaningful signals. Human judgment brings the context.",
  },
];

/** 64 marks. One of them matters. The section argues its own headline. */
function SignalInNoise() {
  return (
    <div className="flex max-w-md flex-wrap gap-[5px]" aria-hidden="true">
      {Array.from({ length: 64 }).map((_, i) => (
        <span
          key={i}
          className={
            i === 41
              ? "h-2 w-2 rounded-full bg-signal"
              : "h-2 w-2 rounded-full bg-ink-900"
          }
          style={i === 41 ? undefined : { opacity: 0.08 + seeded(i) * 0.1 }}
        />
      ))}
    </div>
  );
}

export function Philosophy() {
  return (
    <Section id="philosophy" tone="paper" aria-labelledby="philosophy-heading">
      <div className="wrap">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Reveal className="mb-10 flex items-baseline gap-4">
              <span className="mono-micro text-signal">02</span>
              <span className="mono-micro text-fg-50">The TALYNT philosophy</span>
            </Reveal>
            <Reveal delay={0.05}>
              <h2
                id="philosophy-heading"
                className="display text-(length:--text-h1)"
              >
                Less noise.
                <br />
                <span className="italic">More signal.</span>
              </h2>
            </Reveal>
          </div>

          <Reveal delay={0.15} className="lg:pb-4">
            <SignalInNoise />
            <p className="mono-micro mt-5 text-fg-45">
              Sixty-four profiles. One worth your afternoon.
            </p>
          </Reveal>
        </div>

        <ol className="mt-24 grid gap-px border-t border-ink-900/15 md:grid-cols-3">
          {PRINCIPLES.map((principle, i) => (
            <Reveal
              as="li"
              key={principle.index}
              delay={i * 0.1}
              className="border-ink-900/15 pt-10 md:border-r md:pr-10 md:last:border-r-0 lg:pr-14"
            >
              <span className="mono-micro text-signal tabular-nums">
                {principle.index}
              </span>
              <h3 className="display mt-7 text-(length:--text-h3)">
                {principle.title}
              </h3>
              <p className="mt-5 text-[0.98rem] leading-[1.6] text-fg-65">
                {principle.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}
