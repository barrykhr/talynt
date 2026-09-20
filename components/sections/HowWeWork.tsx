"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { VIEWPORT_EARLY, transition } from "@/lib/motion";

const LAYERS = [
  {
    index: "01",
    title: "Understand",
    body: "We understand your business, team and role — including the parts nobody wrote down.",
  },
  {
    index: "02",
    title: "Define",
    body: "We translate the role into a hiring context: what this person owns, decides and inherits.",
  },
  {
    index: "03",
    title: "Discover",
    body: "We search deeply across the talent market, including people who were never going to apply.",
  },
  {
    index: "04",
    title: "Evaluate",
    body: "We combine experience, skills, motivation, context and conversation — then read them together.",
  },
  {
    index: "05",
    title: "Calibrate",
    body: "We learn continuously from your feedback. The second shortlist is sharper than the first.",
  },
  {
    index: "06",
    title: "Decide",
    body: "We give you a focused shortlist with the reasoning behind every candidate.",
  },
];

export function HowWeWork() {
  const railRef = useRef<HTMLOListElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 75%", "end 60%"],
  });
  const fill = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <Section id="how-we-work" tone="ink" aria-labelledby="how-we-work-heading">
      <div className="wrap grid gap-16 lg:grid-cols-[1fr_1.25fr] lg:gap-24">
        <SectionHeader
          index="10"
          eyebrow="How we work"
          headingId="how-we-work-heading"
          title={
            <>
              One search.
              <br />
              <span className="italic">Six layers of understanding.</span>
            </>
          }
          lede="Not a process diagram. Six things we refuse to skip, on every mandate, at every company size."
          className="lg:sticky lg:top-32 lg:self-start"
        />

        <div className="relative">
          {/* A rail that fills as the search progresses. */}
          <div
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-[1.05rem] w-px bg-paper-100/10 sm:left-[1.4rem]"
          >
            <motion.div
              style={{ scaleY: fill }}
              className="h-full w-full origin-top bg-signal"
            />
          </div>

          <ol ref={railRef} className="flex flex-col gap-12">
            {LAYERS.map((layer, i) => (
              <motion.li
                key={layer.index}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT_EARLY}
                transition={{ ...transition.base, delay: i * 0.05 }}
                className="relative flex gap-7 pl-0 sm:gap-9"
              >
                <span className="relative z-10 mt-1 flex h-[2.1rem] w-[2.1rem] shrink-0 items-center justify-center rounded-full border border-paper-100/15 bg-ink-900 sm:h-[2.8rem] sm:w-[2.8rem]">
                  <span className="mono-micro text-signal tabular-nums">
                    {layer.index}
                  </span>
                </span>
                <div className="pt-1">
                  <h3 className="display text-(length:--text-h3)">{layer.title}</h3>
                  <p className="mt-3 max-w-lg text-[0.98rem] leading-[1.6] text-fg-60">
                    {layer.body}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>

          <Reveal delay={0.1}>
            <p className="display mt-16 border-t border-paper-100/10 pt-12 text-(length:--text-h3) text-balance">
              Here are the people we believe deserve your time
              <span className="italic text-signal"> — and why.</span>
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
