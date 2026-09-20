"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Section } from "@/components/primitives/Section";
import { seeded } from "@/lib/utils";

/**
 * The signature interaction.
 *
 * Eight fragments of a person arrive disconnected — the way information about
 * a candidate actually arrives. Scrolling resolves them into context, then
 * into a person, then into a decision. Nothing here is decorative: the
 * sequence is the company's entire argument, performed instead of described.
 */
const FRAGMENTS = [
  "Role",
  "Skills",
  "Experience",
  "Motivation",
  "Context",
  "Team",
  "Values",
  "Conversation",
];

const STATEMENTS = [
  { text: "The right context", range: [0.34, 0.44, 0.56, 0.62] },
  { text: "The right person", range: [0.6, 0.68, 0.76, 0.82] },
  { text: "The better decision", range: [0.8, 0.88, 1, 1] },
];

function Fragment({
  label,
  index,
  progress,
}: {
  label: string;
  index: number;
  progress: MotionValue<number>;
}) {
  const total = FRAGMENTS.length;
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;

  // Scattered start — deliberately unbalanced, like a real pile of information.
  const startX = 12 + seeded(index, 3) * 76;
  const startY = 12 + seeded(index, 7) * 76;
  const startRotate = (seeded(index, 11) - 0.5) * 26;

  // Ordered middle: a ring, because context surrounds a person.
  const ringX = 50 + Math.cos(angle) * 27;
  const ringY = 50 + Math.sin(angle) * 29;

  const left = useTransform(
    progress,
    [0, 0.45, 0.72, 1],
    [`${startX}%`, `${ringX}%`, "50%", "50%"],
  );
  const top = useTransform(
    progress,
    [0, 0.45, 0.72, 1],
    [`${startY}%`, `${ringY}%`, "50%", "50%"],
  );
  const rotate = useTransform(progress, [0, 0.45], [startRotate, 0]);
  const opacity = useTransform(
    progress,
    [0, 0.12, 0.45, 0.7, 0.86],
    [0, 0.45, 1, 0.8, 0],
  );
  const scale = useTransform(progress, [0, 0.45, 0.78], [0.92, 1, 0.8]);

  return (
    <motion.span
      style={{ left, top, rotate, opacity, scale, translate: "-50% -50%" }}
      className="mono-label absolute rounded-full border border-paper-100/20 bg-ink-850/80 px-3 py-1.5 text-[0.62rem] whitespace-nowrap backdrop-blur-sm sm:px-4 sm:py-2 sm:text-[0.7rem]"
    >
      {label}
    </motion.span>
  );
}

function Statement({
  text,
  range,
  progress,
  isLast,
}: {
  text: string;
  range: number[];
  progress: MotionValue<number>;
  isLast: boolean;
}) {
  const opacity = useTransform(progress, range, [0, 1, 1, isLast ? 1 : 0]);
  const y = useTransform(progress, [range[0], range[1]], [18, 0]);

  return (
    <motion.p
      style={{ opacity, y }}
      className="display absolute inset-x-0 text-center text-(length:--text-h2) text-balance"
    >
      {isLast ? (
        <>
          The better <span className="italic text-signal">decision.</span>
        </>
      ) : (
        text
      )}
    </motion.p>
  );
}

export function Convergence() {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const coreOpacity = useTransform(scrollYProgress, [0.68, 0.84, 1], [0, 0.9, 1]);
  const coreScale = useTransform(scrollYProgress, [0.68, 1], [0.4, 1]);
  const railWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  if (reduced) {
    return (
      <Section tone="ink" aria-labelledby="convergence-heading">
        <div className="wrap-narrow text-center">
          <p className="mono-micro mb-10 text-signal">The TALYNT sequence</p>
          <ul className="mb-14 flex flex-wrap justify-center gap-2">
            {FRAGMENTS.map((fragment) => (
              <li
                key={fragment}
                className="mono-label rounded-full border border-paper-100/20 px-4 py-2 text-[0.7rem]"
              >
                {fragment}
              </li>
            ))}
          </ul>
          <h2 id="convergence-heading" className="display text-(length:--text-h2)">
            The right context. The right person.
            <br />
            <span className="italic text-signal">The better decision.</span>
          </h2>
        </div>
      </Section>
    );
  }

  return (
    <div ref={ref} className="tone-ink relative h-[320vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <div className="wrap absolute inset-x-0 top-24 flex items-center justify-between">
          <span className="mono-micro text-signal">The TALYNT sequence</span>
          <span className="mono-micro text-fg-30">Fragments → Decision</span>
        </div>

        <div className="relative mx-auto h-[62vh] w-full max-w-5xl px-(--spacing-gutter)">
          {FRAGMENTS.map((fragment, i) => (
            <Fragment
              key={fragment}
              label={fragment}
              index={i}
              progress={scrollYProgress}
            />
          ))}

          {/* What everything resolves into. */}
          <motion.span
            style={{ opacity: coreOpacity, scale: coreScale }}
            className="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal shadow-[0_0_60px_18px_rgba(255,77,28,0.35)]"
            aria-hidden="true"
          />

          <div className="absolute inset-x-0 bottom-0">
            {STATEMENTS.map((statement, i) => (
              <Statement
                key={statement.text}
                text={statement.text}
                range={statement.range}
                progress={scrollYProgress}
                isLast={i === STATEMENTS.length - 1}
              />
            ))}
          </div>
        </div>

        <div className="wrap absolute inset-x-0 bottom-16">
          <div className="h-px w-full bg-paper-100/10">
            <motion.div style={{ width: railWidth }} className="h-full bg-signal" />
          </div>
        </div>

        {/* Screen readers get the argument without the choreography. */}
        <p className="sr-only">
          Role, skills, experience, motivation, context, team, values and
          conversation converge into the right context, then the right person,
          then the better decision.
        </p>
      </div>
    </div>
  );
}
