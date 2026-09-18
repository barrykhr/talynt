"use client";

import { motion } from "framer-motion";
import { VIEWPORT_EARLY, transition } from "@/lib/motion";
import { seeded } from "@/lib/utils";

/**
 * The reduction, drawn honestly: each band holds one mark per unit of
 * attention. The eye should feel the collapse from volume to a single person.
 */
const BANDS = [
  { count: 240, label: "Profiles in the market", value: "10,000", width: "100%" },
  { count: 96, label: "Potential matches", value: "Hundreds", width: "78%" },
  { count: 34, label: "Conversations", value: "Dozens", width: "52%" },
  { count: 9, label: "Meaningful candidates", value: "A handful", width: "28%" },
  { count: 1, label: "The hire", value: "One person", width: "9%" },
];

export function FunnelCascade() {
  return (
    <ol className="flex flex-col gap-9">
      {BANDS.map((band, bandIndex) => {
        const isFinal = bandIndex === BANDS.length - 1;
        return (
          <motion.li
            key={band.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_EARLY}
            transition={{ ...transition.base, delay: bandIndex * 0.12 }}
          >
            <div className="mb-3 flex items-baseline justify-between gap-6">
              <span
                className={
                  isFinal
                    ? "mono-micro text-signal"
                    : "mono-micro opacity-45"
                }
              >
                {band.label}
              </span>
              <span
                className={
                  isFinal
                    ? "display text-(length:--text-h3) text-signal"
                    : "font-mono text-[0.9rem] tabular-nums opacity-60"
                }
              >
                {band.value}
              </span>
            </div>

            <div
              className="flex h-5 flex-wrap items-center gap-[3px] overflow-hidden"
              style={{ width: band.width }}
              aria-hidden="true"
            >
              {Array.from({ length: band.count }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{
                    opacity: isFinal ? 1 : 0.22 + seeded(i, bandIndex + 1) * 0.35,
                  }}
                  viewport={VIEWPORT_EARLY}
                  transition={{
                    duration: 0.5,
                    delay: bandIndex * 0.12 + Math.min(i * 0.0025, 0.5),
                  }}
                  className={
                    isFinal
                      ? "h-2.5 w-2.5 shrink-0 rounded-full bg-signal"
                      : "h-1.5 w-1.5 shrink-0 rounded-full bg-current"
                  }
                />
              ))}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
