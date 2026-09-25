"use client";

import { motion, useReducedMotion } from "framer-motion";
import { VIEWPORT_EARLY, transition } from "@/lib/motion";

/**
 * The candidate ↔ client alignment visual.
 *
 * Built from the same parts as the client side's compatibility grid, read from
 * the other direction: the company's need on the left, what the person is
 * looking for on the right, and the dimension they meet on in the middle.
 *
 * The point of the drawing is that both columns exist. A process that only
 * renders the left one is the normal case, and it is why people take roles
 * that were never going to work.
 */

const ROWS = [
  {
    dimension: "The work",
    client: "A surface that needs owning through a rewrite",
    candidate: "Depth on something that matters, not more tickets",
  },
  {
    dimension: "Latitude",
    client: "Someone with an opinion about what gets built",
    candidate: "A say in the roadmap, not just the implementation",
  },
  {
    dimension: "How you communicate",
    client: "Distributed, written, asynchronous",
    candidate: "Time to think before answering",
  },
  {
    dimension: "Pace",
    client: "Series B tempo — ship, learn, revise",
    candidate: "Momentum, without the 11pm messages",
  },
  {
    dimension: "Where it leads",
    client: "A staff engineer in eighteen months",
    candidate: "Seniority without managing people",
  },
] as const;

export function TwoSidedFit() {
  const reduced = useReducedMotion();

  return (
    <div className="rounded-lg border border-current/12 bg-ink-850/50 p-6 sm:p-9">
      <div className="mb-9 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <p className="mono-micro text-fg-45">What the company needs</p>
        <p className="mono-micro hidden text-center text-signal sm:block">meets</p>
        <p className="mono-micro text-fg-45 sm:text-right">What you&rsquo;re looking for</p>
      </div>

      <ul className="flex flex-col">
        {ROWS.map((row, i) => (
          <motion.li
            key={row.dimension}
            className="border-t border-current/10 py-6 first:border-t-0 first:pt-0"
            initial={reduced ? "visible" : "hidden"}
            whileInView="visible"
            viewport={VIEWPORT_EARLY}
            variants={{
              hidden: { opacity: 0, y: 22 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { ...transition.base, delay: reduced ? 0 : i * 0.07 },
              },
            }}
          >
            <p className="mono-micro mb-4 text-signal">{row.dimension}</p>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-6">
              <p className="text-[0.94rem] leading-[1.6] text-fg-75">{row.client}</p>
              <span
                className="hidden h-px w-10 bg-current/25 sm:block"
                aria-hidden="true"
              />
              <p className="text-[0.94rem] leading-[1.6] text-fg-75 sm:text-right">
                {row.candidate}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>

      <p className="mt-8 border-t border-current/10 pt-7 text-[0.9rem] leading-[1.65] text-fg-55">
        Illustrative, from a real shortlist with the identifying detail removed.
        Where two rows disagree we say so to both sides — that is the whole
        method, and it is why a no from us comes with a reason.
      </p>
    </div>
  );
}
