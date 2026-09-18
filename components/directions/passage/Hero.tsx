"use client";

import { motion } from "framer-motion";
import { Scene } from "./Scene";
import { EASE_OUT_EXPO } from "@/lib/motion";

const LINES = ["Hiring is more than", "finding the right CV."];

/** Type that rises out of the frame, one line at a time. */
function MaskedLine({ children, delay }: { children: string; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className="block"
        initial={{ y: "105%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1.15, ease: EASE_OUT_EXPO, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function PassageHero() {
  return (
    <section className="relative h-[100svh] min-h-[38rem] w-full">
      <Scene
        index="Scene 01"
        brief="Wide, low light. A person mid-conversation across a table — listening, not pitching."
        tone="dusk"
        parallax
        captionAlign="top-right"
        className="absolute inset-0 h-full w-full"
      />

      {/* Scrim: guarantees the copy holds contrast whatever photograph lands here. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25"
      />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[96rem] flex-col justify-end px-6 pt-28 pb-14 text-white sm:px-10">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="pg-kicker mb-auto text-[0.62rem] text-white/70"
        >
          Talent intelligence, built for hiring
        </motion.p>

        <h1 className="pg-display pg-h1 max-w-[18ch]">
          <MaskedLine delay={0.35}>{LINES[0]}</MaskedLine>
          <MaskedLine delay={0.47}>{LINES[1]}</MaskedLine>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 0.8 }}
          className="mt-10 flex flex-col gap-8 border-t border-white/20 pt-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <p className="pg-lede max-w-xl text-white/75">
            We combine deep sourcing, human conversations and intelligent
            technology to find people who fit the role, the team and the context.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#start"
              className="pg-kicker rounded-full bg-[color:var(--pg-signal)] px-7 py-4 text-[0.62rem] text-white transition-transform duration-300 hover:-translate-y-0.5"
            >
              Build your team
            </a>
            <a
              href="#journey"
              className="pg-kicker rounded-full border border-white/35 px-7 py-4 text-[0.62rem] transition-colors duration-300 hover:bg-white hover:text-[color:var(--pg-char)]"
            >
              See how we work
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
