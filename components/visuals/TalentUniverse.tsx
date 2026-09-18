"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { cx, seeded } from "@/lib/utils";

export type Stage = {
  label: string;
  count: string;
  note: string;
  dots: number;
};

export const SOURCING_STAGES: Stage[] = [
  {
    label: "The talent market",
    count: "10,000+",
    note: "Applicants, networks, communities, referrals, professional platforms, talent databases.",
    dots: 168,
  },
  {
    label: "TALYNT sourcing",
    count: "1,240",
    note: "We search where the role actually lives — not only where people are already applying.",
    dots: 92,
  },
  {
    label: "Relevant talent",
    count: "184",
    note: "People whose experience genuinely maps to the role and the stage of the business.",
    dots: 44,
  },
  {
    label: "Human screening",
    count: "47",
    note: "A recruiter reads every one of these. No automated rejection.",
    dots: 22,
  },
  {
    label: "Deep evaluation",
    count: "11",
    note: "Structured conversations covering motivation, ownership, communication and context.",
    dots: 11,
  },
  {
    label: "Focused shortlist",
    count: "4",
    note: "Four people, each with the reasoning behind why they are in front of you.",
    dots: 4,
  },
];

const TOTAL = SOURCING_STAGES[0].dots;

/** Scattered start, ordered finish. Positions are seeded so SSR matches. */
function basePosition(i: number) {
  const angle = seeded(i, 1) * Math.PI * 2;
  const radius = Math.sqrt(seeded(i, 2)) * 47;
  return {
    x: 50 + Math.cos(angle) * radius * 1.32,
    y: 50 + Math.sin(angle) * radius,
  };
}

function finalPosition(i: number, total: number) {
  const columns = total <= 4 ? 1 : total <= 12 ? 2 : 6;
  const rows = Math.ceil(total / columns);
  const col = i % columns;
  const row = Math.floor(i / columns);
  return {
    x: 50 + (col - (columns - 1) / 2) * (columns === 1 ? 0 : 9),
    y: 50 + (row - (rows - 1) / 2) * (rows <= 1 ? 0 : Math.min(70 / rows, 11)),
  };
}

export function TalentUniverse({
  stage,
  onStageChange,
}: {
  stage: number;
  onStageChange: (next: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: false, amount: 0.45 });
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const settled = useRef(false);

  // With reduced motion we don't animate the reduction — we show where it ends,
  // so the point still lands. Stepping back through it stays available.
  useEffect(() => {
    if (!reduced || !inView || settled.current) return;
    settled.current = true;
    onStageChange(SOURCING_STAGES.length - 1);
  }, [reduced, inView, onStageChange]);

  // Runs through the reduction once, then rests. It does not loop forever.
  useEffect(() => {
    if (!inView || paused || reduced) return;
    if (stage >= SOURCING_STAGES.length - 1) return;
    const timer = window.setTimeout(() => onStageChange(stage + 1), 1900);
    return () => window.clearTimeout(timer);
  }, [inView, paused, reduced, stage, onStageChange]);

  const active = SOURCING_STAGES[stage];
  const progress = stage / (SOURCING_STAGES.length - 1);

  return (
    <div
      ref={ref}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className="relative aspect-4/3 w-full overflow-hidden rounded-lg border border-current/12 bg-ink-850/50 p-6 sm:aspect-16/11"
    >
      <div className="absolute inset-x-6 top-5 flex items-baseline justify-between">
        <span className="mono-micro opacity-40">Sourcing field</span>
        <span className="mono-micro text-signal tabular-nums">
          {active.count}
        </span>
      </div>

      {/* Inset so the field never crosses the panel's own labels. */}
      <div className="absolute inset-x-6 top-14 bottom-16" aria-hidden="true">
        {Array.from({ length: TOTAL }).map((_, i) => {
          const survives = i < active.dots;
          const base = basePosition(i);
          const target = finalPosition(i, active.dots);
          const x = base.x + (target.x - base.x) * progress;
          const y = base.y + (target.y - base.y) * progress;
          const isShortlist = stage === SOURCING_STAGES.length - 1;

          return (
            <motion.span
              key={i}
              className={cx(
                "absolute rounded-full",
                isShortlist && survives ? "bg-signal" : "bg-paper-100",
              )}
              initial={false}
              animate={{
                left: `${survives ? x : base.x}%`,
                top: `${survives ? y : base.y}%`,
                opacity: survives ? (isShortlist ? 1 : 0.28 + progress * 0.45) : 0.05,
                width: survives && isShortlist ? 10 : survives ? 5 : 3,
                height: survives && isShortlist ? 10 : survives ? 5 : 3,
              }}
              transition={{
                duration: reduced ? 0 : 1.1,
                ease: [0.16, 1, 0.3, 1],
                delay: reduced ? 0 : Math.min(i * 0.002, 0.3),
              }}
              style={{ translate: "-50% -50%" }}
            />
          );
        })}
      </div>

      <div className="absolute inset-x-6 bottom-5">
        <div className="mb-3 flex gap-1" aria-hidden="true">
          {SOURCING_STAGES.map((s, i) => (
            <span
              key={s.label}
              className={cx(
                "h-px flex-1 transition-colors duration-500",
                i <= stage ? "bg-signal" : "bg-current/15",
              )}
            />
          ))}
        </div>
        <p className="mono-micro opacity-55">{active.label}</p>
      </div>
    </div>
  );
}

export function useSourcingStage() {
  const [stage, setStage] = useState(0);
  const onStageChange = useCallback((next: number) => setStage(next), []);
  return { stage, setStage, onStageChange };
}
