"use client";

import { motion } from "framer-motion";
import { Scene, type SceneTone } from "./Scene";
import { EASE_OUT_EXPO } from "@/lib/motion";

const VIEW = { once: true, amount: 0.25 } as const;

type Chapter = {
  index: string;
  title: string;
  body: string;
  brief: string;
  tone: SceneTone;
};

/**
 * The journey, told as consecutive scenes. The reference site moves goods from
 * A to B; here the same continuity carries a person from the open market to the
 * team they belong in.
 */
const CHAPTERS: Chapter[] = [
  {
    index: "01",
    title: "We start before the search.",
    body: "Stage, team, leadership, the decisions this person will own. A job description tells us what you wrote down. We want what you didn't.",
    brief: "Over-the-shoulder, a whiteboard mid-argument. Two people disagreeing productively.",
    tone: "room",
  },
  {
    index: "02",
    title: "We go looking.",
    body: "The best candidate isn't always looking. We search across the market — networks, communities, referrals — not only the people already applying.",
    brief: "Wide exterior, early morning. A city waking up. Scale and distance.",
    tone: "dawn",
  },
  {
    index: "03",
    title: "We have the conversation.",
    body: "A CV tells us what someone has done. A conversation tells us why. Motivation, ownership, how they handle ambiguity, what they want next.",
    brief: "Close, warm, natural light. Two people talking. Hands, not headshots.",
    tone: "field",
  },
  {
    index: "04",
    title: "We hand you four people.",
    body: "Not forty. Each one with the reasoning behind why they're in front of you — including what to watch for.",
    brief: "Quiet interior. A single chair pulled up to a table. Arrival, not audition.",
    tone: "dusk",
  },
];

export function Journey() {
  return (
    <section id="journey" className="bg-[color:var(--pg-bone)]">
      <div className="mx-auto w-full max-w-[96rem] px-6 pt-24 pb-10 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEW}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
          className="flex flex-col gap-6 border-b border-[color:var(--pg-rule)] pb-12 lg:flex-row lg:items-end lg:justify-between"
        >
          <h2 className="pg-display pg-h2 max-w-[14ch]">
            One search, start to finish.
          </h2>
          <p className="pg-lede max-w-md opacity-60">
            Four chapters. The same standard at every company size, from a first
            critical hire to a hundredth.
          </p>
        </motion.div>
      </div>

      {CHAPTERS.map((chapter, i) => {
        const flip = i % 2 === 1;
        return (
          <article
            key={chapter.index}
            className="mx-auto grid w-full max-w-[96rem] items-center gap-9 px-6 py-10 sm:px-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:py-14"
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEW}
              transition={{ duration: 1, ease: EASE_OUT_EXPO }}
              className={flip ? "lg:order-2" : undefined}
            >
              <Scene
                index={`Scene 0${i + 2}`}
                brief={chapter.brief}
                tone={chapter.tone}
                parallax
                className="pg-card relative aspect-4/5 w-full sm:aspect-3/2"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEW}
              transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 0.12 }}
              className={flip ? "lg:order-1 lg:pr-10" : "lg:pl-10"}
            >
              <span className="pg-kicker text-[0.62rem] text-[color:var(--pg-signal)]">
                Chapter {chapter.index}
              </span>
              <h3 className="pg-display pg-h2 mt-6 max-w-[13ch]">{chapter.title}</h3>
              <p className="pg-lede mt-7 max-w-md opacity-60">{chapter.body}</p>
            </motion.div>
          </article>
        );
      })}
    </section>
  );
}
