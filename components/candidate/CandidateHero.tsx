"use client";

import { motion } from "framer-motion";
import { CTAButton } from "@/components/primitives/CTAButton";
import { staggerParent, revealVariants, transition } from "@/lib/motion";

const PILLARS = [
  "The band, up front",
  "The reasoning, not a pitch",
  "Your consent, every time",
  "A real answer, either way",
];

/**
 * The same hero architecture as the client side: full-bleed headline, then a
 * two-column copy-and-instrument row, then a four-part rule. Only the argument
 * changes.
 */
export function CandidateHero() {
  return (
    <section
      className="tone-ink relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-32 pb-8 md:pt-36"
      aria-labelledby="candidate-hero-heading"
    >
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
          For candidates
        </motion.p>

        <motion.h1
          id="candidate-hero-heading"
          variants={revealVariants}
          className="display text-(length:--text-h1)"
        >
          Don&rsquo;t just find a job.
          <br />
          <span className="italic">Find the right next chapter.</span>
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
            A role is not a title and a salary. It is who you answer to, what
            you get to decide, and what you will have learned in two years.
            We write roles that say all three, and we ask you what you are
            actually looking for.
          </motion.p>

          <motion.div
            variants={revealVariants}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <CTAButton href="/candidates/roles">Explore roles</CTAButton>
            <CTAButton href="/candidates/passport" variant="outline">
              Create your Career Passport
            </CTAButton>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...transition.slow, delay: 0.5 }}
          className="relative w-full rounded-lg border border-paper-100/10 bg-ink-850/60 p-5 backdrop-blur-sm sm:p-7"
        >
          <p className="mono-micro text-fg-45">Three questions hiring skips</p>
          <ul className="mt-6 flex flex-col">
            {[
              {
                q: "Why are you moving?",
                a: "Not “why this company” — what stopped working where you are.",
              },
              {
                q: "What do you want to be doing in two years?",
                a: "Depth, scope, leadership, or something else entirely.",
              },
              {
                q: "What would make you leave again?",
                a: "The conditions you will not repeat. Worth naming before you sign.",
              },
            ].map((item, i) => (
              <li
                key={item.q}
                className="border-t border-current/10 py-4 first:border-t-0 first:pt-0"
              >
                <div className="flex items-baseline gap-4">
                  <span className="mono-micro text-signal tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[1rem] leading-snug">{item.q}</p>
                    <p className="mt-1.5 text-[0.86rem] leading-[1.6] text-fg-55">
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
