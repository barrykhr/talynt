"use client";

import { motion } from "framer-motion";
import { HeroSystem } from "@/components/visuals/HeroSystem";
import { CTAButton } from "@/components/primitives/CTAButton";
import { staggerParent, revealVariants, transition } from "@/lib/motion";

const PILLARS = [
  "Deep sourcing",
  "Human conversations",
  "Structured evaluation",
  "Human judgment",
];

export function Hero() {
  return (
    <section
      className="tone-ink relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-32 pb-8 md:pt-36"
      aria-labelledby="hero-heading"
    >
      {/* A single warm light source, low and left — never a gradient wash. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/4 -left-[10%] h-[70vh] w-[70vh] rounded-full bg-signal/[0.07] blur-[140px]"
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerParent(0.1, 0.15)}
        className="wrap relative z-10"
      >
        <motion.p
          variants={revealVariants}
          className="mono-micro mb-9 flex items-center gap-3 text-paper-100/50"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" />
          Talent intelligence, built for hiring
        </motion.p>

        {/* Set full-bleed so the line break is the one we chose. */}
        <motion.h1
          id="hero-heading"
          variants={revealVariants}
          className="display text-(length:--text-h1)"
        >
          Hiring is more than
          <br />
          <span className="italic">finding the right CV.</span>
        </motion.h1>
      </motion.div>

      <div className="wrap relative z-10 mt-12 grid flex-1 items-end gap-10 lg:mt-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerParent(0.1, 0.45)}
        >
          <motion.p
            variants={revealVariants}
            className="max-w-xl text-(length:--text-lede) leading-[1.45] text-paper-100/65"
          >
            TALYNT LABS combines deep sourcing, human conversations and
            intelligent technology to help companies find people who fit the
            role, the team and the context.
          </motion.p>

          <motion.div
            variants={revealVariants}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <CTAButton href="#contact">Build your team</CTAButton>
            <CTAButton href="#philosophy" variant="outline" trailing="down">
              See how we work
            </CTAButton>
          </motion.div>
        </motion.div>

        {/* The instrument. Framed, annotated, deliberately not decorative. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...transition.slow, delay: 0.5 }}
          className="relative h-[clamp(17rem,36vh,26rem)] w-full rounded-lg border border-paper-100/10 bg-ink-850/60 p-5 backdrop-blur-sm sm:p-7"
        >
          <HeroSystem />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...transition.slow, delay: 1 }}
        className="wrap mt-14"
      >
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-paper-100/10 pt-5 sm:grid-cols-4">
          {PILLARS.map((pillar, i) => (
            <li key={pillar} className="flex items-baseline gap-3">
              <span className="mono-micro text-signal tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[0.88rem] text-paper-100/70">{pillar}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
