"use client";

import { motion } from "framer-motion";
import { Scene, type SceneTone } from "./Scene";
import { EASE_OUT_EXPO } from "@/lib/motion";

const VIEW = { once: true, amount: 0.3 } as const;

const FIGURES = [
  { value: "184", label: "Sourced" },
  { value: "47", label: "Understood" },
  { value: "11", label: "Evaluated" },
  { value: "04", label: "Recommended" },
];

const CAPABILITIES: Array<{ title: string; items: string; brief: string; tone: SceneTone }> = [
  {
    title: "Technology",
    items: "Engineering · AI · Data · Product",
    brief: "Hands on a mechanical keyboard, shallow depth of field, late light.",
    tone: "dusk",
  },
  {
    title: "Go-to-market",
    items: "Sales · Marketing · Customer Success",
    brief: "A room mid-pitch, seen from the back. Attention on the listener.",
    tone: "room",
  },
  {
    title: "Leadership",
    items: "Executives · Functional Leaders",
    brief: "A single figure at a window, city beyond. Weight of a decision.",
    tone: "dawn",
  },
  {
    title: "Operations",
    items: "Finance · People · Operations",
    brief: "Detail shot: a printed plan, annotated by hand.",
    tone: "field",
  },
];

export function Proof() {
  return (
    <>
      {/* The standard, stated in figures rather than adjectives. */}
      <section id="standard" className="bg-[color:var(--pg-moss)] text-[color:var(--pg-bone)]">
        <div className="mx-auto w-full max-w-[96rem] px-6 py-24 sm:px-10 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEW}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          >
            <h2 className="pg-display pg-h2 max-w-[12ch]">
              We don&rsquo;t send more.
              <br />
              We send better.
            </h2>
            <p className="pg-lede max-w-sm opacity-60">
              One search, measured honestly. The numbers narrow because the work
              gets deeper, not because the pipeline dried up.
            </p>
          </motion.div>

          <dl className="mt-20 grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
            {FIGURES.map((figure, i) => (
              <motion.div
                key={figure.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEW}
                transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: i * 0.1 }}
                className="border-t border-[color:var(--pg-rule-inv)] pt-6"
              >
                <dt className="pg-kicker text-[0.6rem] opacity-50">{figure.label}</dt>
                <dd
                  className={
                    i === FIGURES.length - 1
                      ? "pg-display mt-5 text-[clamp(3.4rem,7vw,6.5rem)] leading-none text-[color:var(--pg-signal)]"
                      : "pg-display mt-5 text-[clamp(3.4rem,7vw,6.5rem)] leading-none"
                  }
                >
                  {figure.value}
                </dd>
              </motion.div>
            ))}
          </dl>

          <p className="pg-kicker mt-16 text-[0.58rem] opacity-35">
            Illustrative. Volumes vary by role, market and mandate.
          </p>
        </div>
      </section>

      {/* A single idea, given a whole screen. */}
      <section className="bg-[color:var(--pg-bone)]">
        <div className="mx-auto grid w-full max-w-[96rem] items-center gap-12 px-6 py-24 sm:px-10 lg:grid-cols-[1.15fr_1fr] lg:gap-20 lg:py-32">
          <motion.blockquote
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEW}
            transition={{ duration: 1, ease: EASE_OUT_EXPO }}
          >
            <p className="pg-display pg-h2 max-w-[14ch]">
              Fit isn&rsquo;t about being similar. It&rsquo;s about being
              compatible.
            </p>
            <footer className="mt-10 max-w-md border-t border-[color:var(--pg-rule)] pt-7">
              <p className="pg-lede opacity-60">
                We look at how someone works, communicates, makes decisions and
                handles ambiguity — and compare it with the reality of the team
                they&rsquo;re joining.
              </p>
            </footer>
          </motion.blockquote>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEW}
            transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 0.12 }}
          >
            <Scene
              index="Scene 06"
              brief="Two chairs at slight angles, one occupied. Room for the person who isn't there yet."
              tone="room"
              parallax
              className="pg-card relative aspect-4/5 w-full"
            />
          </motion.div>
        </div>
      </section>

      {/* Capabilities as plates, not a feature grid. */}
      <section id="capabilities" className="bg-[color:var(--pg-bone)]">
        <div className="mx-auto w-full max-w-[96rem] px-6 pb-28 sm:px-10">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEW}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            className="pg-display pg-h2 max-w-[16ch] border-t border-[color:var(--pg-rule)] pt-12"
          >
            Talent, wherever the business needs it.
          </motion.h2>

          <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((capability, i) => (
              <motion.li
                key={capability.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEW}
                transition={{ duration: 0.9, ease: EASE_OUT_EXPO, delay: i * 0.08 }}
                className="group"
              >
                <Scene
                  index={`Plate 0${i + 1}`}
                  brief={capability.brief}
                  tone={capability.tone}
                  className="pg-card relative aspect-4/5 w-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5"
                />
                <h3 className="pg-display mt-6 text-[1.7rem] leading-none">
                  {capability.title}
                </h3>
                <p className="pg-kicker mt-3 text-[0.58rem] opacity-45">
                  {capability.items}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
