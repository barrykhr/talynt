"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { VIEWPORT_EARLY, transition } from "@/lib/motion";

/** Nine pairs. Each side does something the other cannot. */
const PAIRS: Array<[string, string]> = [
  ["Search", "Context"],
  ["Matching", "Judgment"],
  ["Enrichment", "Nuance"],
  ["Analysis", "Empathy"],
  ["Structured evaluation", "Decision-making"],
  ["Conversation intelligence", "Motivation"],
  ["Pattern detection", "Culture"],
  ["Workflow", "Relationships"],
  ["Analytics", "Trust"],
];

export function HumanAI() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  // The two systems close the distance as you read them.
  const leftX = useTransform(scrollYProgress, [0, 1], ["-7%", "0%"]);
  const rightX = useTransform(scrollYProgress, [0, 1], ["7%", "0%"]);
  const spine = useTransform(scrollYProgress, [0.2, 1], [0, 1]);

  return (
    <Section id="human-ai" tone="ink" aria-labelledby="human-ai-heading">
      <div className="wrap">
        <SectionHeader
          index="07"
          eyebrow="Human + AI"
          headingId="human-ai-heading"
          align="center"
          title={
            <>
              AI finds signals.
              <br />
              <span className="italic">People understand them.</span>
            </>
          }
        />

        <div ref={ref} className="relative mt-20">
          <div className="mb-10 grid grid-cols-[1fr_auto_1fr] items-baseline gap-4 sm:gap-10">
            <motion.p style={{ x: leftX }} className="mono-micro text-right opacity-45">
              Machine intelligence
            </motion.p>
            <span className="mono-micro opacity-0">·</span>
            <motion.p style={{ x: rightX }} className="mono-micro opacity-45">
              Human intelligence
            </motion.p>
          </div>

          {/* The spine: drawn as you arrive, never idling. */}
          <motion.div
            aria-hidden="true"
            style={{ scaleY: spine }}
            className="absolute top-16 bottom-0 left-1/2 w-px origin-top -translate-x-1/2 bg-linear-to-b from-transparent via-signal/45 to-transparent"
          />

          <ul className="relative">
            {PAIRS.map(([machine, human], i) => (
              <motion.li
                key={machine}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={VIEWPORT_EARLY}
                transition={{ ...transition.base, delay: i * 0.06 }}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-t border-paper-100/8 py-4 first:border-t-0 sm:gap-10"
              >
                <motion.span
                  style={{ x: leftX }}
                  className="text-right text-[0.95rem] leading-snug opacity-60 sm:text-[1.05rem]"
                >
                  {machine}
                </motion.span>
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rotate-45 bg-signal/70"
                />
                <motion.span
                  style={{ x: rightX }}
                  className="font-display text-[1.1rem] leading-snug sm:text-[1.3rem]"
                >
                  {human}
                </motion.span>
              </motion.li>
            ))}
          </ul>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_EARLY}
            transition={{ ...transition.slow, delay: 0.35 }}
            className="display mt-20 text-center text-(length:--text-h2)"
          >
            Neither works <span className="italic text-signal">alone.</span>
          </motion.p>
        </div>
      </div>
    </Section>
  );
}
