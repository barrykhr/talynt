"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { VIEWPORT_EARLY, transition } from "@/lib/motion";
import { cx } from "@/lib/utils";

/** Same numbers on the left. Different verbs on the right. The verb is the work. */
const ROWS = [
  { count: "184", traditional: "profiles", talynt: "sourced" },
  { count: "47", traditional: "screened", talynt: "understood" },
  { count: "11", traditional: "shortlisted", talynt: "evaluated" },
  { countTraditional: "6", countTalynt: "4", traditional: "interviews", talynt: "recommended" },
] as const;

export function Quality() {
  return (
    <Section id="quality" tone="paper" aria-labelledby="quality-heading">
      <div className="wrap">
        <SectionHeader
          index="09"
          eyebrow="Quality over quantity"
          headingId="quality-heading"
          title={
            <>
              We don&rsquo;t send more.
              <br />
              <span className="italic">We send better.</span>
            </>
          }
          lede="We would rather present four highly relevant people with clear reasoning than twenty loosely matched profiles. The pipeline looks similar from the outside. The work inside it is not the same."
        />

        <div className="mt-20 grid gap-10 md:grid-cols-2 md:gap-16">
          {(["traditional", "talynt"] as const).map((column, columnIndex) => {
            const isTalynt = column === "talynt";
            return (
              <Reveal key={column} delay={columnIndex * 0.12}>
                <div
                  className={cx(
                    "h-full rounded-lg border p-7 sm:p-9",
                    isTalynt
                      ? "border-signal/35 bg-signal/[0.05]"
                      : "border-ink-900/12",
                  )}
                >
                  <p
                    className={cx(
                      "mono-micro mb-9",
                      isTalynt ? "text-signal" : "opacity-40",
                    )}
                  >
                    {isTalynt ? "TALYNT" : "The usual process"}
                  </p>

                  <ol className="flex flex-col">
                    {ROWS.map((row, i) => {
                      const count = isTalynt
                        ? ("countTalynt" in row ? row.countTalynt : row.count)
                        : ("countTraditional" in row ? row.countTraditional : row.count);
                      const word = isTalynt ? row.talynt : row.traditional;
                      const isLast = i === ROWS.length - 1;
                      return (
                        <motion.li
                          key={word}
                          initial={{ opacity: 0, x: isTalynt ? 12 : -12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={VIEWPORT_EARLY}
                          transition={{ ...transition.base, delay: i * 0.1 }}
                          className="flex items-baseline gap-5 border-t border-ink-900/10 py-5 first:border-t-0"
                        >
                          <span
                            className={cx(
                              "min-w-[3.2ch] font-mono text-[clamp(1.6rem,3vw,2.4rem)] leading-none tabular-nums",
                              isLast && isTalynt
                                ? "text-signal"
                                : isLast
                                  ? "opacity-85"
                                  : "opacity-45",
                            )}
                          >
                            {count}
                          </span>
                          <span
                            className={cx(
                              "font-display text-(length:--text-h3) leading-none",
                              isTalynt ? "opacity-95" : "opacity-50",
                            )}
                          >
                            {word}
                          </span>
                        </motion.li>
                      );
                    })}
                  </ol>

                  <p
                    className={cx(
                      "mt-9 border-t pt-6 text-[0.9rem] leading-[1.6]",
                      isTalynt
                        ? "border-signal/25 opacity-75"
                        : "border-ink-900/10 opacity-45",
                    )}
                  >
                    {isTalynt
                      ? "Four people. Each one with the reasoning behind why they are in front of you — including what to watch for."
                      : "Six interviews to find out what a conversation would have told you in the first week."}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <p className="mono-micro mt-8 opacity-40">
          Illustrative figures. Volumes vary by role, market and mandate.
        </p>
      </div>
    </Section>
  );
}
