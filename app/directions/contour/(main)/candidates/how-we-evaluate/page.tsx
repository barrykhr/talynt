import type { Metadata } from "next";
import Link from "next/link";
import { EVALUATE } from "@/lib/contour/content";
import { ROUTES } from "@/lib/contour/site";
import { ButtonLink, Eyebrow, Headline, Reading, SectionHead } from "@/components/contour/ui";
import { TwoSidedConnection } from "@/components/contour/graphics/RoleToTalent";
import { Reveal } from "@/components/primitives/Reveal";

export const metadata: Metadata = {
  title: "How we evaluate",
  description: EVALUATE.description,
};

/**
 * The approved "How we evaluate" page: five named signals and where each comes
 * from, the four readings, both directions of fit, what a client sees and
 * doesn't, and what is never looked at. No score anywhere.
 */
export default function HowWeEvaluatePage() {
  return (
    <>
      <header className="ct-wrap pt-12 pb-16 md:pt-20">
        <Eyebrow tone="violet">How we evaluate</Eyebrow>
        <Headline as="h1" lead={EVALUATE.title} turn={EVALUATE.titleItalic} size="xl" className="mt-7 max-w-4xl" />
        <p className="ct-lede mt-7 max-w-2xl">{EVALUATE.lede}</p>
      </header>

      {/* --- Signals ------------------------------------------------------- */}
      <section aria-labelledby="signals-heading" className="ct-section ct-tint">
        <div className="ct-wrap">
          <SectionHead
            index="01"
            tone="violet"
            eyebrow={EVALUATE.signalsEyebrow}
            id="signals-heading"
            lead={EVALUATE.signalsTitle}
            turn={EVALUATE.signalsTitleItalic}
            lede={EVALUATE.signalsLede}
          />

          <ol className="mt-14 flex flex-col">
            {EVALUATE.signals.map((signal, i) => (
              <Reveal
                as="li"
                key={signal.name}
                delay={i * 0.05}
                className="grid gap-4 border-t py-8 md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1.15fr)] md:gap-8"
              >
                <span className="ct-meta ct-violet tabular-nums pt-1.5">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="ct-display ct-s">{signal.name}</h3>
                  <p className="ct-body mt-2">{signal.what}</p>
                </div>
                <div className="md:pt-1.5">
                  <p className="ct-meta ct-mute">{EVALUATE.fromLabel}</p>
                  <p className="ct-small mt-2">{signal.from}</p>
                </div>
              </Reveal>
            ))}
          </ol>

          <div className="mt-12 border-t pt-10">
            <h3 className="ct-meta ct-mute">{EVALUATE.readingsLabel}</h3>
            <ul className="mt-6 grid gap-px overflow-hidden rounded-[var(--ct-r-l)] border bg-[var(--ct-line)] sm:grid-cols-2 xl:grid-cols-4">
              {EVALUATE.readings.map((reading) => (
                <li key={reading.strength} className="bg-[var(--ct-surface)] p-6">
                  <Reading strength={reading.strength} />
                  <p className="ct-small mt-4">{reading.body}</p>
                </li>
              ))}
            </ul>
            <p className="ct-small mt-6 max-w-2xl">{EVALUATE.readingsNote}</p>
          </div>
        </div>
      </section>

      {/* --- Both directions ----------------------------------------------- */}
      <section aria-labelledby="two-sided-heading" className="ct-section">
        <div className="ct-wrap">
          <header className="max-w-3xl">
            <Eyebrow index="02" tone="violet">
              {EVALUATE.twoSidedEyebrow}
            </Eyebrow>
            <h2 id="two-sided-heading" className="ct-display ct-l mt-6">
              {EVALUATE.twoSidedTitle}{" "}
              <span className="block">
                {EVALUATE.twoSidedTurn} <span className="ct-italic">{EVALUATE.twoSidedTurnItalic}</span>
              </span>
            </h2>
            <p className="ct-lede mt-6 max-w-2xl">{EVALUATE.twoSidedLede}</p>
          </header>
          <TwoSidedConnection className="mt-14" />
        </div>
      </section>

      {/* --- What the client sees ------------------------------------------ */}
      <section
        id="what-clients-see"
        aria-labelledby="clients-heading"
        className="ct-section ct-tint scroll-mt-[var(--ct-nav-h)]"
      >
        <div className="ct-wrap">
          <SectionHead
            index="03"
            tone="violet"
            eyebrow={EVALUATE.clientsEyebrow}
            id="clients-heading"
            lead={EVALUATE.clientsTitle}
            turn={EVALUATE.clientsTitleItalic}
            lede={EVALUATE.clientsLede}
          />

          <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h3 className="ct-meta ct-green">{EVALUATE.clientsSeeLabel}</h3>
              <ul className="mt-5">
                {EVALUATE.clientsSee.map((line) => (
                  <li key={line} className="flex gap-3.5 border-t py-4">
                    <span aria-hidden="true" className="mt-[0.6rem] h-[0.4rem] w-[0.4rem] shrink-0 rounded-full bg-[var(--ct-green)]" />
                    <span className="ct-body">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="ct-meta ct-mute">{EVALUATE.clientsDontSeeLabel}</h3>
              <ul className="mt-5">
                {EVALUATE.clientsDontSee.map((line) => (
                  <li key={line} className="flex gap-3.5 border-t py-4">
                    <span aria-hidden="true" className="mt-[0.6rem] h-[0.4rem] w-[0.4rem] shrink-0 rounded-full border ct-b-mute" />
                    <span className="ct-body text-[var(--ct-mute)]">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p
            className="ct-display ct-s mt-14 max-w-2xl border-l-2 pl-5"
            style={{ ["--ct-bc" as string]: "var(--ct-violet)" }}
          >
            {EVALUATE.reservation} <span className="ct-italic">{EVALUATE.reservationItalic}</span> {EVALUATE.reservationTail}
          </p>
        </div>
      </section>

      {/* --- What we don't look at ----------------------------------------- */}
      <section aria-labelledby="ignored-heading" className="ct-section">
        <div className="ct-wrap">
          <SectionHead
            index="04"
            tone="violet"
            eyebrow={EVALUATE.notLookedEyebrow}
            id="ignored-heading"
            lead={EVALUATE.ignoredTitle}
            turn={EVALUATE.ignoredTitleItalic}
            lede={EVALUATE.ignoredLede}
          />
          <ul className="mt-12 flex flex-col">
            {EVALUATE.notLookedAt.map((line, i) => (
              <li key={line} className="flex items-baseline gap-5 border-t py-5">
                <span className="ct-meta ct-mute tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="ct-display text-[clamp(1.2rem,2.2vw,1.55rem)] leading-snug text-[var(--ct-ink-2)] line-through decoration-[var(--ct-line-2)] decoration-1">
                  {line}
                </span>
              </li>
            ))}
          </ul>
          <p className="ct-body mt-10 max-w-2xl">
            {EVALUATE.ignoredNote}{" "}
            <Link href={ROUTES.opportunities} className="ct-link">
              {EVALUATE.ignoredLink}
            </Link>
            .
          </p>
        </div>
      </section>

      {/* --- Close --------------------------------------------------------- */}
      <section aria-labelledby="close-heading" className="ct-section ct-tint">
        <div className="ct-wrap-narrow text-center">
          <h2 id="close-heading" className="ct-display ct-l">
            {EVALUATE.closeTitle} <span className="ct-italic block">{EVALUATE.closeTitleItalic}</span>
          </h2>
          <p className="ct-lede mx-auto mt-6 max-w-xl">{EVALUATE.modelLine}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={ROUTES.profile}>{EVALUATE.closePrimary}</ButtonLink>
            <ButtonLink href={ROUTES.opportunities} variant="secondary">
              {EVALUATE.closeSecondary}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
