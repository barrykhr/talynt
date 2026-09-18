"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { EASE_OUT_EXPO } from "@/lib/motion";

const SLOW = { duration: 1.4, ease: EASE_OUT_EXPO } as const;
const VIEW = { once: true, amount: 0.65 } as const;

const MIDDLE = [
  "Technology can search faster.",
  "AI can surface patterns.",
  "Data can organise information.",
];

const TRIAD = ["Better signals.", "Better conversations.", "Better decisions."];

/** The emotional conclusion. Everything here is slow on purpose. */
export function Manifesto() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.85, 0]);

  return (
    <section
      ref={ref}
      aria-labelledby="manifesto-heading"
      className="tone-ink relative overflow-hidden bg-ink-950 py-(--spacing-section)"
    >
      <motion.div
        aria-hidden="true"
        style={{ opacity: glow }}
        className="pointer-events-none absolute top-1/2 left-1/2 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/[0.09] blur-[160px]"
      />

      <div className="wrap-narrow relative flex min-h-[80svh] flex-col justify-center gap-24 py-16 text-center md:gap-32">
        <motion.h2
          id="manifesto-heading"
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEW}
          transition={SLOW}
          className="display text-(length:--text-mega)"
        >
          Hiring is <span className="italic">human.</span>
        </motion.h2>

        <div className="flex flex-col gap-4">
          {MIDDLE.map((line, i) => (
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 0.5, y: 0 }}
              viewport={VIEW}
              transition={{ ...SLOW, delay: i * 0.25 }}
              className="display text-(length:--text-h3)"
            >
              {line}
            </motion.p>
          ))}

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEW}
            transition={{ ...SLOW, delay: 0.9 }}
            className="display mt-10 text-(length:--text-h2) text-balance"
          >
            But people still make decisions
            <br className="hidden sm:block" /> about people.
          </motion.p>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEW}
          transition={SLOW}
          className="mx-auto max-w-2xl text-(length:--text-lede) leading-[1.5] opacity-60"
        >
          We don&rsquo;t believe the future of recruitment is human versus AI.
          It&rsquo;s human <span className="italic text-signal">with</span>{" "}
          intelligence.
        </motion.p>

        <div className="flex flex-col gap-3">
          {TRIAD.map((line, i) => (
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEW}
              transition={{ ...SLOW, delay: i * 0.3 }}
              className="display text-(length:--text-h2)"
            >
              {line}
            </motion.p>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VIEW}
          transition={{ ...SLOW, delay: 0.4 }}
          className="display-sans text-(length:--text-h3) tracking-[0.02em] uppercase"
        >
          That&rsquo;s Talynt <span className="text-signal">Labs.</span>
        </motion.p>
      </div>
    </section>
  );
}
