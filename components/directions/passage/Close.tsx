"use client";

import { motion } from "framer-motion";
import { Scene } from "./Scene";
import { EASE_OUT_EXPO } from "@/lib/motion";

const VIEW = { once: true, amount: 0.3 } as const;

export function Close() {
  return (
    <section id="start" className="relative">
      <Scene
        index="Scene 07"
        brief="Doorway, first morning. Someone walking in who belongs there."
        tone="dawn"
        parallax
        captionAlign="top-right"
        className="absolute inset-0 h-full w-full"
      />

      {/* Scrim: guarantees the copy holds contrast whatever photograph lands here. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25"
      />

      <div className="relative z-10 mx-auto w-full max-w-[96rem] px-6 py-32 text-white sm:px-10 lg:py-44">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEW}
          transition={{ duration: 1, ease: EASE_OUT_EXPO }}
          className="max-w-4xl"
        >
          <span className="pg-kicker text-[0.62rem] text-white/60">
            Start a search
          </span>
          <h2 className="pg-display pg-h2 mt-8">
            Let&rsquo;s find the people who move your business forward.
          </h2>
          <p className="pg-lede mt-8 max-w-lg text-white/70">
            Tell us what you&rsquo;re building, what you&rsquo;re hiring for and
            where you need help.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <a
              href="mailto:hello@talyntlabs.com"
              className="pg-kicker rounded-full bg-[color:var(--pg-signal)] px-8 py-4 text-[0.62rem] text-white transition-transform duration-300 hover:-translate-y-0.5"
            >
              Build your team
            </a>
            <a
              href="mailto:hello@talyntlabs.com"
              className="pg-kicker rounded-full border border-white/35 px-8 py-4 text-[0.62rem] transition-colors duration-300 hover:bg-white hover:text-[color:var(--pg-char)]"
            >
              Talk to TALYNT
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
