"use client";

import { useCalm } from "@/lib/contour/motion";
import {motion} from "framer-motion";
import { CANDIDATES } from "@/lib/candidates";
import { CONTEXT } from "@/lib/contour/content";
import { frame, ring, round } from "@/lib/contour/geometry";

/**
 * The same person, read four ways. Each lens keeps everything the previous one
 * had and adds one layer, so the eye sees information accumulate — and sees
 * that only the last lens says anything about whether this person will do
 * well in this place.
 *
 * The person is the illustrative Candidate 0148 used across the site.
 */

const C = CANDIDATES[0];
const P = { x: 128, y: 74 };
const R = { x: 62, y: 74 };
const ROLE_FRAME = frame(R.x, R.y, 20, 4.4);
const ROLE_CONTEXT = [30, 42].map((h) => frame(R.x, R.y, h, 4.4));
const PERSON_CONTEXT = [12, 22, 34, 46].map((r, i) => ring(P.x, P.y, r, 31 + i * 0.02, 0.1));
const EASE = [0.16, 1, 0.3, 1] as const;

const LENSES = [
  { title: "A profile", note: `${C.ref} · ${C.headline} · ${C.tenure}` },
  { title: "A set of skills", note: C.skills.join(" · ") },
  { title: "A role requirement", note: CONTEXT.jd.slice(0, 3).join(" · ") },
  { title: "The context", note: CONTEXT.layers.map((l) => l.label.replace(" context", "")).join(" · ") },
] as const;

export function FourLenses() {
  const reduced = useCalm();
  const fade = (delay: number) => ({
    initial: reduced ? false : ({ opacity: 0 } as const),
    whileInView: { opacity: 1 },
    viewport: { once: true, amount: 0.5 },
    transition: reduced ? { duration: 0 } : { duration: 0.8, delay, ease: EASE },
  });
  const drawIn = (delay: number, opacity = 1) => ({
    initial: reduced ? false : ({ pathLength: 0, opacity: 0 } as const),
    whileInView: { pathLength: 1, opacity },
    viewport: { once: true, amount: 0.5 },
    transition: reduced ? { duration: 0 } : { duration: 1, delay, ease: EASE },
  });

  return (
    <ol className="grid grid-cols-2 gap-x-5 lg:grid-cols-4 lg:gap-x-0">
      {LENSES.map((lens, i) => (
        <li key={lens.title} className="flex flex-col border-t py-6 lg:border-l lg:px-5 lg:py-7 lg:first:border-l-0 lg:first:pl-0">
          <p className="ct-meta flex items-center gap-3">
            <span className="ct-green tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <span className="ct-ink2">{lens.title}</span>
          </p>

          <svg viewBox="0 0 200 148" className="ct-graphic my-4 w-full max-w-[17rem] lg:my-6" aria-hidden="true">
            {/* 04: context around the person, and around the role. */}
            {i === 3 && (
              <g fill="none">
                {ROLE_CONTEXT.map((d, k) => (
                  <motion.path key={k} d={d} stroke="var(--ct-green)" strokeWidth="0.8" {...drawIn(0.3 + k * 0.1, 0.55 - k * 0.15)} />
                ))}
                {PERSON_CONTEXT.map((d, k) => (
                  <motion.path key={k} d={d} stroke="var(--ct-ink)" strokeWidth="0.8" {...drawIn(0.2 + k * 0.1, 0.55 - k * 0.1)} />
                ))}
              </g>
            )}

            {/* 03 onwards: the requirement — a frame with a list in it. */}
            {i >= 2 && (
              <g>
                <motion.path d={ROLE_FRAME} fill="none" stroke="var(--ct-green)" strokeWidth="1.2" {...drawIn(0.15)} />
                {[0, 1, 2, 3].map((k) => (
                  <motion.line
                    key={k}
                    x1={R.x - 10}
                    x2={R.x + (k % 2 ? 6 : 10)}
                    y1={R.y - 9 + k * 6}
                    y2={R.y - 9 + k * 6}
                    stroke="var(--ct-green)"
                    strokeWidth="1.4"
                    {...fade(0.3 + k * 0.06)}
                  />
                ))}
              </g>
            )}

            {/* 02 onwards: skills as ticks off the person. */}
            {i >= 1 &&
              [-0.9, -0.3, 0.3, 0.9].map((a, k) => {
                return (
                  <motion.line
                    key={k}
                    x1={round(P.x + Math.cos(a) * 9)}
                    y1={round(P.y + Math.sin(a) * 9)}
                    x2={round(P.x + Math.cos(a) * 30)}
                    y2={round(P.y + Math.sin(a) * 30)}
                    stroke="var(--ct-ink)"
                    strokeWidth="1.1"
                    {...fade(0.1 + k * 0.06)}
                  />
                );
              })}

            {/* 03: the keyword match — the only link a requirement can make. */}
            {i === 2 && (
              <motion.line
                x1={R.x + 21}
                y1={R.y}
                x2={P.x - 10}
                y2={P.y}
                stroke="var(--ct-ink)"
                strokeWidth="1"
                strokeDasharray="2 3"
                {...fade(0.5)}
              />
            )}

            {/* 04: where the two contexts meet. */}
            {i === 3 && (
              <motion.line x1={R.x + 21} y1={R.y} x2={P.x - 10} y2={P.y} stroke="var(--ct-green)" strokeWidth="1.6" {...fade(0.7)} />
            )}

            {/* The person, in every lens. */}
            <circle cx={P.x} cy={P.y} r="6" fill={i === 3 ? "var(--ct-signal)" : "var(--ct-ink)"} />
          </svg>

          <p className="ct-meta ct-mute mt-auto leading-relaxed normal-case tracking-[0.02em]">{lens.note}</p>
        </li>
      ))}
    </ol>
  );
}
