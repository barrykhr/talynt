import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives/PageHeader";
import { Section } from "@/components/primitives/Section";
import { Reveal } from "@/components/primitives/Reveal";
import { VARIANTS, FAVICON, PALETTE, type Colourway } from "@/lib/brand";
import { cx } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Logo system",
  description:
    "The TALYNT LABS logo system: primary, secondary, submark and favicon, with clear space, minimum sizes and misuse.",
  robots: { index: false, follow: false },
};

const WAY_LABEL: Record<Colourway, string> = {
  light: "On light",
  dark: "On dark",
  mono: "One colour",
};

/** Each colourway sits on the ground it was drawn for. */
const WAY_SURFACE: Record<Colourway, string> = {
  light: "bg-paper-100",
  dark: "bg-ink-900",
  mono: "bg-paper-300 text-ink-900",
};

function Swatch({
  way,
  src,
  height,
  name,
}: {
  way: Colourway;
  src: string;
  height: number;
  name: string;
}) {
  return (
    <figure className="flex flex-col">
      <div
        className={cx(
          "flex items-center justify-center rounded-md border border-paper-100/10 p-8",
          WAY_SURFACE[way],
        )}
        style={{ minHeight: height + 72 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${name}, ${WAY_LABEL[way].toLowerCase()}`}
          style={{ height }}
          className="w-auto max-w-full"
        />
      </div>
      <figcaption className="mono-micro mt-3 flex items-center justify-between opacity-45">
        <span>{WAY_LABEL[way]}</span>
        <a
          href={src}
          download
          className="transition-opacity duration-300 hover:opacity-100 hover:text-signal"
        >
          SVG ↓
        </a>
      </figcaption>
    </figure>
  );
}

export default function BrandPage() {
  return (
    <>
      <PageHeader
        eyebrow="Brand · Logo system"
        title={
          <>
            One mark, four jobs.
            <br />
            <span className="italic">Drawn once, used everywhere.</span>
          </>
        }
        lede="Every file below is vector outlines rather than live text, so the wordmark can't reflow or substitute a font wherever it ends up — a deck, a contract, an embroidery machine."
      />

      <Section tone="ink" className="pt-0">
        <div className="wrap flex flex-col gap-24">
          {VARIANTS.map((variant) => (
            <Reveal key={variant.id}>
              <article className="grid gap-10 border-t border-paper-100/10 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.1fr)] lg:gap-16">
                <header className="lg:sticky lg:top-32 lg:self-start">
                  <span className="mono-micro text-signal tabular-nums">
                    {variant.index}
                  </span>
                  <h2 className="display mt-6 text-(length:--text-h3)">
                    {variant.name}
                  </h2>
                  <p className="mono-micro mt-3 opacity-45">{variant.role}</p>

                  <dl className="mt-7 flex flex-col gap-5">
                    <div>
                      <dt className="mono-micro mb-2 opacity-35">Use it for</dt>
                      <dd className="text-[0.92rem] leading-[1.6] opacity-70">
                        {variant.use}
                      </dd>
                    </div>
                    <div>
                      <dt className="mono-micro mb-2 opacity-35">Don&rsquo;t</dt>
                      <dd className="text-[0.92rem] leading-[1.6] opacity-70">
                        {variant.avoid}
                      </dd>
                    </div>
                    <div>
                      <dt className="mono-micro mb-2 opacity-35">Minimum size</dt>
                      <dd className="font-mono text-[0.92rem] text-signal">
                        {variant.minimum}
                      </dd>
                    </div>
                  </dl>
                </header>

                <div className="grid items-start gap-5 sm:grid-cols-3">
                  {variant.ways.map((way) => (
                    <Swatch
                      key={way}
                      way={way}
                      src={variant.file(way)}
                      height={variant.height}
                      name={variant.name}
                    />
                  ))}
                </div>
              </article>
            </Reveal>
          ))}

          {/* The favicon is judged at the size it actually runs at. */}
          <Reveal>
            <article className="grid gap-10 border-t border-paper-100/10 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.1fr)] lg:gap-16">
              <header>
                <span className="mono-micro text-signal tabular-nums">
                  {FAVICON.index}
                </span>
                <h2 className="display mt-6 text-(length:--text-h3)">
                  {FAVICON.name}
                </h2>
                <p className="mono-micro mt-3 opacity-45">{FAVICON.role}</p>
                <p className="mt-7 text-[0.92rem] leading-[1.6] opacity-70">
                  {FAVICON.use} The strokes are thickened and the node enlarged
                  against the submark, because a mark that is merely scaled down
                  turns to mud at tab size.
                </p>
              </header>

              <div className="flex flex-wrap items-end gap-10 rounded-md border border-paper-100/10 bg-paper-100 p-10">
                {[16, 24, 32, 64, 128].map((size) => (
                  <div key={size} className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={FAVICON.file}
                      alt={`TALYNT LABS favicon at ${size} pixels`}
                      width={size}
                      height={size}
                      style={{ imageRendering: "auto" }}
                    />
                    <span className="mono-micro text-ink-900/40">{size}px</span>
                  </div>
                ))}
              </div>
            </article>
          </Reveal>
        </div>
      </Section>

      <Section tone="paper">
        <div className="wrap grid gap-16 lg:grid-cols-3">
          <Reveal>
            <h2 className="display text-(length:--text-h3)">Clear space</h2>
            <p className="mt-5 text-[0.95rem] leading-[1.65] opacity-65">
              Keep free space on every side equal to a quarter of the mark&rsquo;s
              height. Nothing sets inside it — no type, no rule, no edge of a
              photograph.
            </p>
            <div className="mt-8 rounded-md border border-dashed border-ink-900/25 p-[1.75rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/talynt-primary-light.svg"
                alt="Primary logo with its clear space shown as a dashed boundary"
                className="h-14 w-auto"
              />
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h2 className="display text-(length:--text-h3)">Palette</h2>
            <p className="mt-5 text-[0.95rem] leading-[1.65] opacity-65">
              Three values carry the mark. Signal appears once — on the node —
              and never on the frame.
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {PALETTE.map((colour) => (
                <li
                  key={colour.name}
                  className="flex items-center gap-4 border-t border-ink-900/12 pt-3"
                >
                  <span
                    aria-hidden="true"
                    className="h-8 w-8 shrink-0 rounded-sm border border-ink-900/15"
                    style={{ backgroundColor: colour.hex }}
                  />
                  <span className="flex-1">
                    <span className="block text-[0.92rem]">{colour.name}</span>
                    <span className="mono-micro opacity-45">{colour.note}</span>
                  </span>
                  <span className="font-mono text-[0.8rem] opacity-60">
                    {colour.hex}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.16}>
            <h2 className="display text-(length:--text-h3)">Misuse</h2>
            <p className="mt-5 text-[0.95rem] leading-[1.65] opacity-65">
              The mark is fixed artwork. If a use needs something it can&rsquo;t
              do, the answer is a different variation, not a redrawn one.
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {[
                "Don't recolour the frame or the node.",
                "Don't stretch, rotate or add a shadow.",
                "Don't re-set the wordmark in another typeface.",
                "Don't box it when it already sits on a clean ground.",
                "Don't let the descriptor grow to match TALYNT.",
              ].map((rule) => (
                <li
                  key={rule}
                  className="flex items-baseline gap-3 border-t border-ink-900/12 pt-3"
                >
                  <span aria-hidden="true" className="text-signal">
                    ✕
                  </span>
                  <span className="text-[0.92rem] leading-snug opacity-70">
                    {rule}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
