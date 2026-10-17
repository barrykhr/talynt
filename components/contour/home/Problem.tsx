import { PHILOSOPHY, PROBLEM } from "@/lib/contour/content";
import { ring } from "@/lib/contour/geometry";
import { FourLenses } from "@/components/contour/graphics/FourLenses";
import { Eyebrow, Headline, Illustrative } from "@/components/contour/ui";
import { Reveal } from "@/components/primitives/Reveal";
import { cx } from "@/lib/utils";

/**
 * The argument, in two beats. First the problem — volume is everywhere,
 * intelligence is not — with the approved funnel set as type. Then the same
 * person read through four lenses, so the visitor can see the difference
 * between information and context rather than be told about it.
 */
export function Problem({ index = "01" }: { index?: string } = {}) {
  return (
    <section id="problem" aria-labelledby="problem-heading" className="ct-section">
      <div className="ct-wrap">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <Eyebrow index={index}>{PROBLEM.eyebrow}</Eyebrow>
            <Headline
              id="problem-heading"
              lead={PROBLEM.title}
              turn={PROBLEM.titleQuiet}
              turnClassName="ct-mute not-italic"
              className="mt-6"
            />
            <p className="ct-lede mt-7 max-w-xl">{PROBLEM.lede}</p>
          </div>

          {/* The approved funnel, as type: each line holds less, until one person. */}
          <Reveal className="lg:col-span-5 lg:col-start-8 lg:pt-14">
            <ol className="flex flex-col">
              {PROBLEM.funnel.map((band, i) => {
                const last = i === PROBLEM.funnel.length - 1;
                return (
                  <li key={band.label} className="flex items-baseline justify-between gap-6 border-t py-3.5">
                    <span className={last ? "flex items-center gap-2.5 text-[var(--ct-ink)]" : "ct-mute text-[0.95rem]"}>
                      {last && <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-[var(--ct-signal)]" />}
                      {band.label}
                    </span>
                    {/* Solid tones, not opacity: every step stays above AA contrast. */}
                    <span
                      className={
                        last
                          ? "ct-display ct-s"
                          : cx("font-mono text-[0.95rem] tabular-nums", i < 2 ? "text-[var(--ct-ink)]" : "text-[var(--ct-mute)]")
                      }
                    >
                      {band.value}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Reveal>
        </div>

        <div className="mt-20 md:mt-28">
          <FourLenses />
          <Illustrative className="mt-6">
            The same illustrative candidate, read four ways. Only the last lens says anything about whether they will do
            well here.
          </Illustrative>
        </div>

        <Reveal>
          <p className="ct-display ct-l mt-20 max-w-4xl md:mt-28">
            {PROBLEM.close} <span className="ct-italic">{PROBLEM.closeItalic}</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/** Sixty-four marks, one person read in context. The approved caption below it. */
const SIGNAL_RINGS = [7, 12, 18].map((r, i) => ring(0, 0, r, 41 + i * 0.02, 0.1));

function SignalInNoise() {
  const columns = 8;
  const picked = 42;
  return (
    <svg viewBox="0 0 176 176" className="ct-graphic w-full max-w-[15rem]" aria-hidden="true">
      {Array.from({ length: 64 }).map((_, i) => {
        const x = 12 + (i % columns) * 21.7;
        const y = 12 + Math.floor(i / columns) * 21.7;
        if (i === picked) {
          return (
            <g key={i} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
              {SIGNAL_RINGS.map((d, k) => (
                <path key={k} d={d} fill="none" stroke="var(--ct-ink)" strokeWidth="0.8" opacity={0.6 - k * 0.15} />
              ))}
              <circle r="4.5" fill="var(--ct-signal)" />
            </g>
          );
        }
        return <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r="2.2" fill="var(--ct-ink)" opacity="0.18" />;
      })}
    </svg>
  );
}

export function Philosophy({ index = "02" }: { index?: string } = {}) {
  return (
    <section id="philosophy" aria-labelledby="philosophy-heading" className="ct-section ct-tint">
      <div className="ct-wrap grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--ct-nav-h)+3rem)]">
            <Eyebrow index={index}>{PHILOSOPHY.eyebrow}</Eyebrow>
            <Headline
              id="philosophy-heading"
              lead={PHILOSOPHY.title}
              turn={PHILOSOPHY.titleItalic}
              size="xl"
              className="mt-6"
            />
            <div className="mt-10 flex items-end gap-6">
              <SignalInNoise />
            </div>
            <p className="ct-meta ct-mute mt-4">{PHILOSOPHY.caption}</p>
          </div>
        </div>

        <ol className="flex flex-col lg:col-span-6 lg:col-start-7 lg:pt-4">
          {PHILOSOPHY.principles.map((principle, i) => (
            <Reveal as="li" key={principle.title} delay={i * 0.08} className="border-t py-10 first:border-t-0 first:pt-0 lg:first:border-t lg:first:pt-10">
              <div className="grid gap-4 sm:grid-cols-[3rem_1fr]">
                <span className="ct-meta ct-green tabular-nums pt-2">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="ct-display ct-m">{principle.title}</h3>
                  <p className="ct-body mt-4 max-w-xl text-[1.05rem]">{principle.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
