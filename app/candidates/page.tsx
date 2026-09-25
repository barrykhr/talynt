import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { CTAButton } from "@/components/primitives/CTAButton";
import { CandidateHero } from "@/components/candidate/CandidateHero";
import { CareerArc } from "@/components/candidate/CareerArc";
import { DirectionPicker } from "@/components/candidate/DirectionPicker";
import { FeaturedRoles } from "@/components/candidate/FeaturedRoles";

export const metadata: Metadata = {
  title: "For candidates",
  description:
    "Roles written with the reasoning behind them, compensation stated up front, and a Career Passport that asks where you are going — not only where you have been.",
  alternates: { canonical: "/candidates" },
};

const COMMITMENTS = [
  {
    title: "The compensation band is on the role",
    body: "Every role on this site shows its band before you read a word of the requirements. Not at offer stage, not after two interviews.",
  },
  {
    title: "We ask before we send you anywhere",
    body: "Your Career Passport stays yours. No profile of you reaches a company without you choosing that role and confirming it.",
  },
  {
    title: "If it's a no, you get the reason",
    body: "A real one, from the client, in their words. Not a template about other candidates being a closer match.",
  },
  {
    title: "We tell you what's hard about the role",
    body: "Every role here has a section on what to consider. It is written before you apply, not disclosed after you accept.",
  },
];

const UNLIKE = [
  {
    label: "A job board",
    body: "Lists titles. Leaves you to guess the rest.",
  },
  {
    label: "A recruiter's inbox",
    body: "Sends you five roles because they share a keyword with your CV.",
  },
  {
    label: "This",
    body: "Reads the role, reads you, and tells you where the two don't line up.",
    active: true,
  },
];

export default function CandidatesPage() {
  return (
    <>
      <CandidateHero />

      {/* --- The argument ------------------------------------------------- */}
      <Section id="how-we-read-a-career" tone="paper" aria-labelledby="arc-heading">
        <div className="wrap">
          <SectionHeader
            index="01"
            eyebrow="How we read a career"
            headingId="arc-heading"
            title={
              <>
                A CV is one third
                <br />
                <span className="italic">of the story.</span>
              </>
            }
            lede="Where you have been is the easiest part to verify and the least useful on its own. It says nothing about what you want next — and that is the part that decides whether a role works."
          />
          <div className="tone-ink mt-20 rounded-lg">
            <CareerArc />
          </div>
        </div>
      </Section>

      {/* --- The interactive question -------------------------------------- */}
      <Section id="direction" aria-labelledby="direction-heading">
        <div className="wrap">
          <SectionHeader
            index="02"
            eyebrow="Career direction"
            headingId="direction-heading"
            title={
              <>
                Three questions.
                <br />
                <span className="italic">Then better roles.</span>
              </>
            }
            lede="Answer these and every role on this site starts telling you where it lines up with what you want — and where it doesn't."
          />
          <DirectionPicker />
        </div>
      </Section>

      {/* --- Open roles ---------------------------------------------------- */}
      <Section id="roles" tone="paper" aria-labelledby="roles-heading">
        <div className="wrap">
          <SectionHeader
            index="03"
            eyebrow="Open roles"
            headingId="roles-heading"
            title={
              <>
                Roles written the way
                <br />
                <span className="italic">we&rsquo;d want one written for us.</span>
              </>
            }
            lede="Why the role exists. What success looks like at ninety days and at a year. What is genuinely hard about it. And the band."
          />
          <FeaturedRoles />
        </div>
      </Section>

      {/* --- What this is not ---------------------------------------------- */}
      <Section id="what-this-is" aria-labelledby="what-this-is-heading">
        <div className="wrap">
          <SectionHeader
            index="04"
            eyebrow="What this is"
            headingId="what-this-is-heading"
            title={
              <>
                Less noise.
                <br />
                <span className="italic">More signal.</span>
              </>
            }
          />
          <ul className="mt-16 grid gap-px overflow-hidden rounded-lg border border-current/12 md:grid-cols-3">
            {UNLIKE.map((item, i) => (
              <Reveal as="li" key={item.label} delay={i * 0.08}>
                <div className="h-full bg-ink-900/60 p-7">
                  <p
                    className={
                      item.active ? "mono-micro text-signal" : "mono-micro text-fg-40"
                    }
                  >
                    {item.label}
                  </p>
                  <p className="mt-5 text-[1rem] leading-[1.6] text-fg-70">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.25}>
            <p className="display mt-16 max-w-3xl text-(length:--text-h3) text-balance">
              Fit isn&rsquo;t about being similar.
              <br />
              It&rsquo;s about being <span className="italic">compatible.</span>
            </p>
          </Reveal>
        </div>
      </Section>

      {/* --- What you can expect ------------------------------------------- */}
      <Section id="commitments" tone="paper" aria-labelledby="commitments-heading">
        <div className="wrap">
          <SectionHeader
            index="05"
            eyebrow="What you can expect"
            headingId="commitments-heading"
            title={
              <>
                Four things we do
                <br />
                <span className="italic">that most processes don&rsquo;t.</span>
              </>
            }
          />
          <ol className="mt-16 grid gap-x-16 gap-y-12 md:grid-cols-2">
            {COMMITMENTS.map((commitment, i) => (
              <Reveal as="li" key={commitment.title} delay={i * 0.07}>
                <div className="flex items-baseline gap-5 border-t border-ink-900/15 pt-6">
                  <span className="mono-micro text-signal tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="display text-(length:--text-h3) text-balance">
                      {commitment.title}
                    </p>
                    <p className="mt-3 text-[0.95rem] leading-[1.65] text-fg-60">
                      {commitment.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={0.3}>
            <div className="mt-16">
              <Link
                href="/candidates/how-we-evaluate"
                className="mono-micro text-signal transition-opacity duration-300 hover:opacity-70"
              >
                How we evaluate, in full →
              </Link>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* --- Close --------------------------------------------------------- */}
      <Section id="start" aria-labelledby="start-heading">
        <div className="wrap-narrow text-center">
          <Reveal>
            <h2 id="start-heading" className="display text-(length:--text-h2) text-balance">
              Start with what you want,
              <br />
              <span className="italic">not what you&rsquo;ve done.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-8 max-w-xl text-(length:--text-lede) leading-[1.45] text-fg-65">
              The Career Passport takes about eight minutes. It stays on your
              device until you choose to share it with a specific role.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <CTAButton href="/candidates/passport">Create your Career Passport</CTAButton>
              <CTAButton href="/candidates/roles" variant="outline">
                Or just read the roles
              </CTAButton>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
