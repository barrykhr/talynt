"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { HiringContextCard } from "@/components/cards/HiringContextCard";
import { VIEWPORT_EARLY, transition } from "@/lib/motion";

const JD_LINES = [
  "Senior Full Stack Engineer",
  "5+ years of experience",
  "React, Node, TypeScript",
  "Experience with AWS",
  "Strong communication skills",
  "Fast-paced environment",
  "Bachelor's degree preferred",
];

const CONTEXT_LAYERS = [
  {
    index: "01",
    label: "Business context",
    question: "What has to be true for this business in twelve months?",
    detail:
      "Stage, funding, pressure, constraints, and the commitments this hire inherits.",
  },
  {
    index: "02",
    label: "Team context",
    question: "What does this team already have, and what is missing?",
    detail:
      "Size, seniority mix, how work is divided, and the gap this person is actually filling.",
  },
  {
    index: "03",
    label: "Role context",
    question: "What does this person own in their first ninety days?",
    detail:
      "Scope, autonomy, the decisions they make alone, and the ones they don't.",
  },
  {
    index: "04",
    label: "Leadership context",
    question: "How does the person they report to actually lead?",
    detail:
      "Direction versus latitude, feedback style, and what earns trust here.",
  },
  {
    index: "05",
    label: "Success context",
    question: "What would make you say, at six months, that this worked?",
    detail:
      "The outcome behind the requirement — usually absent from the job description.",
  },
  {
    index: "06",
    label: "Candidate context",
    question: "Why would someone good leave a good role for this one?",
    detail:
      "The honest case for the opportunity, including what it will cost them.",
  },
];

export function Context() {
  return (
    <Section id="context" tone="paper" aria-labelledby="context-heading">
      <div className="wrap">
        <SectionHeader
          index="04"
          eyebrow="Context"
          headingId="context-heading"
          title={
            <>
              A job description
              <br />
              <span className="italic">is not a hiring context.</span>
            </>
          }
          lede="Before we search, we understand what success actually means in your environment."
        />

        <div className="mt-20 grid gap-12 lg:grid-cols-[0.75fr_1.6fr] lg:gap-16">
          {/* The input: flat, literal, and quietly insufficient. */}
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-md border border-ink-900/15 bg-paper-50 p-6">
              <p className="mono-micro mb-6 opacity-45">Input · Job description</p>
              <ul className="flex flex-col gap-3">
                {JD_LINES.map((line, i) => (
                  <motion.li
                    key={line}
                    initial={{ opacity: 0.9 }}
                    whileInView={{ opacity: i === 0 ? 0.85 : 0.35 }}
                    viewport={VIEWPORT_EARLY}
                    transition={{ ...transition.slow, delay: 0.3 + i * 0.06 }}
                    className="font-mono text-[0.8rem] leading-relaxed"
                  >
                    {line}
                  </motion.li>
                ))}
              </ul>
              <p className="mt-8 border-t border-ink-900/12 pt-5 text-[0.86rem] leading-[1.6] opacity-60">
                Everything above is true. None of it tells you who will do well
                here.
              </p>
            </div>
            <p
              aria-hidden="true"
              className="mono-micro mt-6 flex items-center gap-3 text-signal"
            >
              <span className="h-px w-10 bg-signal" />
              Becomes
            </p>
          </Reveal>

          <ol className="grid gap-4 sm:grid-cols-2">
            {CONTEXT_LAYERS.map((layer, i) => (
              <Reveal as="li" key={layer.index} delay={i * 0.07}>
                <HiringContextCard {...layer} />
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal delay={0.1}>
          <p className="display mt-20 border-t border-ink-900/15 pt-12 text-(length:--text-h2) text-balance">
            Hiring starts <span className="italic">before</span> sourcing.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
