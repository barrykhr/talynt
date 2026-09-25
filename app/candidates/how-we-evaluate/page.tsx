import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/primitives/PageHeader";
import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { CTAButton } from "@/components/primitives/CTAButton";
import { TwoSidedFit } from "@/components/candidate/TwoSidedFit";
import {
  MatchIndicator,
  type SignalStrength,
} from "@/components/primitives/SignalBadge";

export const metadata: Metadata = {
  title: "How we evaluate",
  description:
    "What TALYNT looks at, what we write down, what a client sees, and why there is no candidate score.",
  alternates: { canonical: "/candidates/how-we-evaluate" },
};

const SIGNALS = [
  {
    name: "Technical alignment",
    what: "Whether the work you've done maps onto the work this role needs.",
    from: "Your own account of what you built and decided — not a keyword match against a CV.",
  },
  {
    name: "Role motivation",
    what: "Whether you want this role specifically, or a role.",
    from: "The conversation. It is the single strongest predictor of whether a hire stays, and the hardest to fake in either direction.",
  },
  {
    name: "Team alignment",
    what: "Whether how you work fits how this team already works.",
    from: "Both sides described separately, then compared. Not a personality test.",
  },
  {
    name: "Communication",
    what: "Whether you can make yourself understood to people who don't share your context.",
    from: "How you explain your own work, in your own words.",
  },
  {
    name: "Compensation alignment",
    what: "Whether the band and your expectation can meet.",
    from: "Asked directly, early, because finding out at offer stage wastes everybody's month.",
  },
];

/** The same four readings the client-side panels use, drawn by the same component. */
const READINGS: Array<{ strength: SignalStrength; body: string }> = [
  { strength: "emerging", body: "We've seen something, and not enough of it to lean on." },
  { strength: "solid", body: "Evidence, and a reason it might not hold everywhere." },
  { strength: "strong", body: "Consistent across the conversation and the work." },
  { strength: "confirmed", body: "Checked directly, usually because it's a hard constraint." },
];

const NOT_LOOKED_AT = [
  "Where you went to university, or whether you did",
  "How long you were at each company, taken on its own",
  "Gaps in your CV",
  "Whether you came from a recognisable logo",
  "How well you perform an interview format you'll never use again",
];

export default function HowWeEvaluatePage() {
  return (
    <>
      <PageHeader
        eyebrow="How we evaluate"
        title={
          <>
            No score.
            <br />
            <span className="italic">Reasons you can argue with.</span>
          </>
        }
        lede="We could give you a number out of a hundred. It would be more persuasive and less true — a single figure hides which part of it moved, and invites everyone to treat it as a verdict. So we write down named signals, each with the evidence behind it, and we show you the same ones we show the client."
      />

      {/* --- Signals -------------------------------------------------------- */}
      <Section tone="paper" aria-labelledby="signals-heading">
        <div className="wrap">
          <SectionHeader
            index="01"
            eyebrow="TALYNT Signals"
            headingId="signals-heading"
            title={
              <>
                Five signals.
                <br />
                <span className="italic">Each one explainable.</span>
              </>
            }
            lede="A signal is a reading with its reasoning attached. If we cannot say where one came from, it does not get written down."
          />

          <ol className="mt-20 flex flex-col">
            {SIGNALS.map((signal, i) => (
              <Reveal as="li" key={signal.name} delay={i * 0.06}>
                <div className="grid gap-5 border-t border-ink-900/15 py-9 lg:grid-cols-[auto_1fr_1.2fr] lg:gap-10">
                  <span className="mono-micro text-signal tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="display text-(length:--text-h3) text-balance">
                      {signal.name}
                    </p>
                    <p className="mt-3 text-[0.95rem] leading-[1.65] text-fg-65">
                      {signal.what}
                    </p>
                  </div>
                  <div className="lg:pt-1">
                    <p className="mono-micro text-fg-40">Where it comes from</p>
                    <p className="mt-3 text-[0.95rem] leading-[1.7] text-fg-60">
                      {signal.from}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={0.2}>
            <div className="mt-16 border-t border-ink-900/15 pt-12">
              <p className="mono-micro text-fg-40">The four readings</p>
              <ul className="mt-8 grid gap-px overflow-hidden rounded-lg border border-ink-900/15 sm:grid-cols-2 xl:grid-cols-4">
                {READINGS.map((reading) => (
                  <li key={reading.strength} className="bg-paper-100 p-6">
                    <MatchIndicator strength={reading.strength} />
                    <p className="mt-4 text-[0.9rem] leading-[1.65] text-fg-55">
                      {reading.body}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-8 max-w-2xl text-[0.9rem] leading-[1.65] text-fg-50">
                Four steps, deliberately coarse. A resolution we could not defend
                would be theatre — and a candidate whose every signal reads
                &ldquo;strong&rdquo; is a candidate nobody looked at properly.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* --- Two-sided ----------------------------------------------------- */}
      <Section aria-labelledby="two-sided-heading">
        <div className="wrap">
          <SectionHeader
            index="02"
            eyebrow="Both directions"
            headingId="two-sided-heading"
            title={
              <>
                Fit isn&rsquo;t about being similar.
                <br />
                It&rsquo;s about being <span className="italic">compatible.</span>
              </>
            }
            lede="We write down what the company needs and what you're looking for as two separate things, then compare them. Where they disagree, both sides are told."
          />
          <div className="mt-20">
            <TwoSidedFit />
          </div>
        </div>
      </Section>

      {/* --- What clients see ----------------------------------------------- */}
      <Section
        id="what-clients-see"
        tone="paper"
        aria-labelledby="clients-heading"
        className="scroll-mt-32"
      >
        <div className="wrap">
          <SectionHeader
            index="03"
            eyebrow="What the client sees"
            headingId="clients-heading"
            title={
              <>
                The same signals,
                <br />
                <span className="italic">and one thing more.</span>
              </>
            }
            lede="A client sees your signals, the reasoning behind each one, and a section called “what to watch for” — the honest caveat on you, written before they meet you."
          />

          <div className="mt-20 grid gap-16 lg:grid-cols-2 lg:gap-24">
            <Reveal>
              <div>
                <p className="mono-micro text-signal">They see</p>
                <ul className="mt-6 flex flex-col gap-4">
                  {[
                    "The five signals, with the evidence for each.",
                    "Why we think this role fits you specifically, in a paragraph.",
                    "What to watch for — where we have a real reservation.",
                    "Your compensation expectation, because withholding it wastes their time and yours.",
                  ].map((line) => (
                    <li key={line} className="flex gap-4">
                      <span
                        className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-signal"
                        aria-hidden="true"
                      />
                      <span className="text-[1rem] leading-[1.7] text-fg-75">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div>
                <p className="mono-micro text-fg-40">They don&rsquo;t see</p>
                <ul className="mt-6 flex flex-col gap-4">
                  {[
                    "Your Career Passport, unless you applied to their role.",
                    "What else you applied to, or saved.",
                    "Anything you told us in confidence and asked us not to pass on.",
                    "A score. There isn't one to send.",
                  ].map((line) => (
                    <li key={line} className="flex gap-4">
                      <span
                        className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-current/30"
                        aria-hidden="true"
                      />
                      <span className="text-[1rem] leading-[1.7] text-fg-65">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <div className="mt-16 border-l-2 border-signal pl-6">
              <p className="display max-w-2xl text-(length:--text-h3) text-balance">
                If we have a reservation about you, you hear it from us{" "}
                <span className="italic">before</span> the client does.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* --- What we don't look at ------------------------------------------ */}
      <Section aria-labelledby="ignored-heading">
        <div className="wrap">
          <SectionHeader
            index="04"
            eyebrow="What we don't look at"
            headingId="ignored-heading"
            title={
              <>
                Signals, not
                <br />
                <span className="italic">proxies for signals.</span>
              </>
            }
            lede="Each of these is a shortcut that correlates with something real and predicts almost nothing on its own. They are the reason good people get filtered out before anybody reads their work."
          />
          <ul className="mt-16 flex flex-col">
            {NOT_LOOKED_AT.map((line, i) => (
              <Reveal as="li" key={line} delay={i * 0.06}>
                <div className="flex items-baseline gap-5 border-t border-current/12 py-6">
                  <span className="mono-micro text-fg-30 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="display text-(length:--text-h3) text-fg-70">
                    {line}
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.25}>
            <p className="mt-14 max-w-2xl text-[0.95rem] leading-[1.7] text-fg-55">
              We will ask about a gap or a short tenure if it is relevant to this
              role. We will not treat either as a finding on its own, and a
              client asking us to screen on one gets the same answer.{" "}
              <Link href="/candidates/roles" className="text-signal hover:opacity-70">
                Read the open roles
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </Section>

      {/* --- Close ---------------------------------------------------------- */}
      <Section tone="paper" aria-labelledby="close-heading">
        <div className="wrap-narrow text-center">
          <Reveal>
            <h2 id="close-heading" className="display text-(length:--text-h2) text-balance">
              AI finds signals.
              <br />
              <span className="italic">People understand them.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-8 max-w-xl text-(length:--text-lede) leading-[1.45] text-fg-65">
              Nothing about you is decided by a model. The technology finds
              candidates and organises evidence. A person reads it, and a person
              is accountable for what we tell the client.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <CTAButton href="/candidates/passport">Create your Career Passport</CTAButton>
              <CTAButton href="/candidates/roles" variant="outline">
                Explore roles
              </CTAButton>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
