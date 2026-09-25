"use client";

import { motion, useReducedMotion } from "framer-motion";
import { VIEWPORT_EARLY, transition } from "@/lib/motion";

/**
 * The candidate experience's signature visual: PAST → PRESENT → FUTURE.
 *
 * Hiring reads the first panel and decides. This draws all three, and gives
 * the middle one the accent, because the present is the only part a person is
 * actually standing in.
 *
 * Built from the same parts as every other visual on the site — hairlines,
 * one accent, a single 22px-and-settle reveal — and composed static under
 * prefers-reduced-motion.
 */

const STAGES = [
  {
    key: "past",
    label: "Past",
    title: "What you've done",
    body: "Roles, systems, teams, decisions. The part a CV can carry — and the only part most hiring processes ever read.",
    facets: ["Roles held", "Problems solved", "Teams worked in"],
  },
  {
    key: "present",
    label: "Present",
    title: "Where you are now",
    body: "What you're good at, what you've outgrown, and what made you start looking. This is the part that actually decides whether a role fits.",
    facets: ["Strengths", "Constraints", "Why now"],
  },
  {
    key: "future",
    label: "Future",
    title: "Where this is going",
    body: "Depth, scope, leadership, or a different context entirely. A role either moves you toward it or quietly away from it.",
    facets: ["Direction", "What matters", "What you'd trade"],
  },
] as const;

export function CareerArc() {
  const reduced = useReducedMotion();

  return (
    <div className="rounded-lg border border-current/12 bg-ink-850/50 p-6 sm:p-9">
      <div className="mb-9 flex flex-wrap items-center justify-between gap-4">
        <span className="mono-micro text-fg-45">A career, read in three parts</span>
        <span className="mono-micro text-signal">You are here → Present</span>
      </div>

      {/* The spine. One rule, three nodes, the middle one lit. */}
      <div className="relative mb-10 h-8" aria-hidden="true">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current/15" />
        <motion.span
          className="absolute top-1/2 left-0 h-px -translate-y-1/2 bg-signal/60"
          initial={reduced ? { width: "50%" } : { width: 0 }}
          whileInView={{ width: "50%" }}
          viewport={VIEWPORT_EARLY}
          transition={reduced ? { duration: 0 } : transition.slow}
        />
        {STAGES.map((stage, i) => (
          <span
            key={stage.key}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${i * 50}%` }}
          >
            <span
              className={
                stage.key === "present"
                  ? "block h-3.5 w-3.5 rounded-full bg-signal"
                  : "block h-2.5 w-2.5 rounded-full border border-current/40 bg-ink-900"
              }
            />
          </span>
        ))}
      </div>

      <ol className="grid gap-px overflow-hidden rounded-md border border-current/12 sm:grid-cols-3">
        {STAGES.map((stage, i) => (
          <motion.li
            key={stage.key}
            className="bg-ink-900/60 p-5 sm:p-6"
            initial={reduced ? "visible" : "hidden"}
            whileInView="visible"
            viewport={VIEWPORT_EARLY}
            variants={{
              hidden: { opacity: 0, y: 22 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { ...transition.base, delay: reduced ? 0 : i * 0.1 },
              },
            }}
          >
            <p
              className={
                stage.key === "present"
                  ? "mono-micro text-signal"
                  : "mono-micro text-fg-40"
              }
            >
              {stage.label}
            </p>
            <p className="display mt-4 text-(length:--text-h3)">{stage.title}</p>
            <p className="mt-3 text-[0.9rem] leading-[1.6] text-fg-60">{stage.body}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {stage.facets.map((facet) => (
                <li
                  key={facet}
                  className="mono-micro rounded-full border border-current/15 px-2.5 py-1 leading-none text-fg-50"
                >
                  {facet}
                </li>
              ))}
            </ul>
          </motion.li>
        ))}
      </ol>

      <p className="mt-7 text-[0.9rem] leading-[1.6] text-fg-55">
        Most hiring processes read the first panel and infer the other two.
        We ask.
      </p>
    </div>
  );
}
