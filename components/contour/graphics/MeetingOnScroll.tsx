"use client";

import { useCalm } from "@/lib/contour/motion";
import {motion, useScroll, useTransform} from "framer-motion";
import { useRef } from "react";
import { PERSON_RINGS, ROLE_RINGS } from "./Meeting";

/**
 * The meeting, performed: the role's context and the person's context start
 * apart and close the distance as the section is read. The overlap — the only
 * part that matters to a hire — fills in as they meet. Static under reduced
 * motion, at the meeting point.
 */
export function MeetingOnScroll({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useCalm();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center 55%"] });
  const apart = useTransform(scrollYProgress, [0, 1], [46, 0]);
  const left = useTransform(apart, (v) => -v);
  const overlap = useTransform(scrollYProgress, [0.55, 1], [0, 1]);

  const x = reduced ? 0 : apart;
  const nx = reduced ? 0 : left;

  return (
    <div ref={ref} className={className}>
      <svg
        viewBox="0 0 320 160"
        className="ct-graphic w-full overflow-visible"
        role="img"
        aria-label="A role's context and a person's context moving together until they overlap. The overlap is highlighted."
      >
        <defs>
          <clipPath id="meet-scroll-clip">
            <motion.path d={PERSON_RINGS[PERSON_RINGS.length - 1]} style={{ x }} />
          </clipPath>
        </defs>
        <motion.g clipPath="url(#meet-scroll-clip)" style={{ opacity: reduced ? 1 : overlap }}>
          <motion.path d={ROLE_RINGS[ROLE_RINGS.length - 1]} fill="var(--ct-lime)" style={{ x: nx }} />
        </motion.g>
        <motion.g fill="none" stroke="var(--ct-green)" strokeWidth="0.9" style={{ x: nx }}>
          {ROLE_RINGS.map((d, i) => (
            <path key={i} d={d} opacity={0.85 - i * 0.13} />
          ))}
          <rect x="111" y="73" width="14" height="14" rx="3.5" fill="var(--ct-ink)" stroke="none" />
        </motion.g>
        <motion.g fill="none" stroke="var(--ct-ink)" strokeWidth="0.8" style={{ x }}>
          {PERSON_RINGS.map((d, i) => (
            <path key={i} d={d} opacity={0.7 - i * 0.1} />
          ))}
          <circle cx="206" cy="80" r="6" fill="var(--ct-signal)" stroke="none" />
        </motion.g>
      </svg>
      <div className="mt-3 flex justify-between">
        <span className="ct-meta ct-green">The role, in context</span>
        <span className="ct-meta ct-ink2">The person, in context</span>
      </div>
    </div>
  );
}
