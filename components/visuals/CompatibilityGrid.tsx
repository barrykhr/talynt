"use client";

import { motion } from "framer-motion";
import { VIEWPORT_EARLY, transition } from "@/lib/motion";
import { cx } from "@/lib/utils";

type Dimension = {
  label: string;
  poles: [string, string];
  environment: number;
  candidate: number;
  note: string;
};

/**
 * Compatibility, not similarity. Two markers per dimension: how the
 * environment actually works, and how this person actually works.
 * The distance between them is the finding — including where it is wide.
 */
const DIMENSIONS: Dimension[] = [
  {
    label: "Ambiguity",
    poles: ["Needs a defined brief", "Writes the brief"],
    environment: 74,
    candidate: 80,
    note: "The role is under-specified by design. They prefer it that way.",
  },
  {
    label: "Decision-making",
    poles: ["Builds consensus", "Decides, then informs"],
    environment: 62,
    candidate: 57,
    note: "Both sides expect a decision to be argued before it is made.",
  },
  {
    label: "Communication",
    poles: ["Written, asynchronous", "Verbal, in the room"],
    environment: 34,
    candidate: 41,
    note: "A distributed team that writes things down. They already work this way.",
  },
  {
    label: "Ownership",
    poles: ["Owns the task", "Owns the outcome"],
    environment: 84,
    candidate: 86,
    note: "Nobody here is handed scope. They have been asking for exactly this.",
  },
  {
    label: "Feedback",
    poles: ["Softened", "Direct and immediate"],
    environment: 82,
    candidate: 52,
    note: "The real gap. This team is blunter than their last one. Worth naming in week one — not a reason to pass.",
  },
  {
    label: "Pace",
    poles: ["Deliberate", "Ship and iterate"],
    environment: 71,
    candidate: 75,
    note: "Series B tempo. They have shipped at this speed before.",
  },
];

export function CompatibilityGrid() {
  return (
    <div className="rounded-lg border border-current/12 bg-ink-850/50 p-6 sm:p-9">
      <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
        <span className="mono-micro opacity-45">
          Compatibility reading · Illustrative
        </span>
        <div className="flex items-center gap-6">
          <span className="mono-micro flex items-center gap-2 opacity-60">
            <span className="h-2.5 w-2.5 rounded-full border border-paper-100/70" />
            The environment
          </span>
          <span className="mono-micro flex items-center gap-2 text-signal">
            <span className="h-2.5 w-2.5 rounded-full bg-signal" />
            The candidate
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-7">
        {DIMENSIONS.map((dimension, i) => {
          const gap = Math.abs(dimension.environment - dimension.candidate);
          const wide = gap > 20;
          return (
            <motion.li
              key={dimension.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_EARLY}
              transition={{ ...transition.base, delay: i * 0.08 }}
              className="group"
            >
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <span className="mono-label text-[0.7rem] opacity-80">
                  {dimension.label}
                </span>
                <span
                  className={cx(
                    "mono-micro",
                    wide ? "text-signal" : "opacity-35",
                  )}
                >
                  {wide ? "Gap — named" : "Aligned"}
                </span>
              </div>

              <div className="relative h-9">
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current/15" />

                {/* Distance between the two markers is the actual finding. */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={VIEWPORT_EARLY}
                  transition={{ ...transition.slow, delay: 0.3 + i * 0.08 }}
                  className={cx(
                    "absolute top-1/2 h-px -translate-y-1/2",
                    wide ? "bg-signal/60" : "bg-signal/25",
                  )}
                  style={{
                    left: `${Math.min(dimension.environment, dimension.candidate)}%`,
                    width: `${gap}%`,
                  }}
                />

                <motion.span
                  initial={{ left: "50%", opacity: 0 }}
                  whileInView={{ left: `${dimension.environment}%`, opacity: 1 }}
                  viewport={VIEWPORT_EARLY}
                  transition={{ ...transition.slow, delay: 0.15 + i * 0.08 }}
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper-100/70 bg-ink-900"
                />
                <motion.span
                  initial={{ left: "50%", opacity: 0 }}
                  whileInView={{ left: `${dimension.candidate}%`, opacity: 1 }}
                  viewport={VIEWPORT_EARLY}
                  transition={{ ...transition.slow, delay: 0.28 + i * 0.08 }}
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal"
                />
              </div>

              <div className="flex items-baseline justify-between gap-6">
                <span className="mono-micro opacity-30">{dimension.poles[0]}</span>
                <span className="mono-micro opacity-30">{dimension.poles[1]}</span>
              </div>

              <p
                className={cx(
                  "mt-3 max-w-2xl text-[0.86rem] leading-[1.6] transition-opacity duration-500",
                  wide
                    ? "text-signal-300 opacity-90"
                    : "opacity-45 group-hover:opacity-70",
                )}
              >
                {dimension.note}
              </p>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
