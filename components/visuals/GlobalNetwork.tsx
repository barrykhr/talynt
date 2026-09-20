"use client";

import { motion } from "framer-motion";
import { VIEWPORT_EARLY } from "@/lib/motion";

/**
 * An abstract network rather than a map: we're describing the markets we're
 * built to search across, not claiming an office in each of them.
 */
const NODES = [
  { label: "India", x: 62, y: 58 },
  { label: "United States", x: 16, y: 40 },
  { label: "United Kingdom", x: 40, y: 27 },
  { label: "Europe", x: 48, y: 41 },
  { label: "Middle East", x: 55, y: 70 },
  { label: "APAC", x: 83, y: 48 },
];

const LINKS: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [2, 3],
  [1, 2],
  [4, 5],
];

export function GlobalNetwork() {
  return (
    <div className="relative aspect-16/9 w-full">
      <svg
        viewBox="0 0 100 60"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Latitude suggestion — a globe implied, never drawn. */}
        {[0.22, 0.42, 0.62].map((ratio, i) => (
          <motion.ellipse
            key={ratio}
            cx="50"
            cy="30"
            rx={46 - i * 4}
            ry={(46 - i * 4) * 0.33}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.12"
            className="opacity-15"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={VIEWPORT_EARLY}
            transition={{ duration: 1.8, delay: 0.2 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}

        {LINKS.map(([from, to], i) => {
          const a = NODES[from];
          const b = NODES[to];
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2 - Math.abs(a.x - b.x) * 0.18;
          return (
            <motion.path
              key={`${from}-${to}`}
              d={`M ${a.x * 1} ${a.y * 0.6} Q ${midX} ${midY * 0.6} ${b.x} ${b.y * 0.6}`}
              fill="none"
              stroke="var(--color-signal)"
              strokeWidth="0.15"
              className="opacity-45"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.45 }}
              viewport={VIEWPORT_EARLY}
              transition={{ duration: 1.4, delay: 0.5 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}
      </svg>

      {NODES.map((node, i) => (
        <motion.div
          key={node.label}
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={VIEWPORT_EARLY}
          transition={{ duration: 0.6, delay: 0.7 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
          <span className="mono-micro whitespace-nowrap text-fg-65">
            {node.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
