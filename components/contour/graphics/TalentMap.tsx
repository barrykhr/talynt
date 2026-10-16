"use client";

import { useCalm } from "@/lib/contour/motion";
import {motion} from "framer-motion";
import { useEffect, useRef } from "react";
import { flow, frame, noise, pct, ring, round } from "@/lib/contour/geometry";
import { cx } from "@/lib/utils";

/**
 * GRAPHIC A — the talent map.
 *
 * A field of people. A role brief, framed the way the logo is framed. Search
 * connections reaching from the role into the field, most of them faint. One
 * person read in full: their context drawn as contour, the dimensions named on
 * the lines the way a map names its heights.
 *
 * It plays once — terrain, people, role, connections, the signal, the person —
 * then holds still. One slow ripple on the focal node is the only idle motion.
 * Under reduced motion it renders composed, at its end state.
 */

const W = 600;
const H = 560;
const ROLE = { x: 132, y: 318 };
const PERSON = { x: 404, y: 270 };

const PERSON_RINGS = [16, 30, 46, 64, 86, 110, 136].map((r, i) =>
  ring(PERSON.x, PERSON.y, r, 2 + i * 0.015, 0.11, [1.08, 1]),
);
const ROLE_FRAMES = [12, 26, 42].map((h) => frame(ROLE.x, ROLE.y, h, 4.4));
const QUIET_TERRAIN = [
  { x: 150, y: 116, rings: [12, 26, 42, 60] },
  { x: 502, y: 478, rings: [10, 24, 40] },
  { x: 96, y: 486, rings: [10, 22] },
].flatMap((t, ti) => t.rings.map((r, i) => ring(t.x, t.y, r, 9 + ti * 3 + i * 0.02, 0.12)));

/** The field: people the search could reach. Kept clear of the two focal areas. */
const FIELD = Array.from({ length: 64 })
  .map((_, i) => ({
    i,
    x: round(34 + noise(i, 1.7) * (W - 68)),
    y: round(34 + noise(i, 2.9) * (H - 68)),
  }))
  .filter(
    (p) =>
      Math.hypot(p.x - PERSON.x, p.y - PERSON.y) > 70 &&
      Math.hypot(p.x - ROLE.x, p.y - ROLE.y) > 56,
  )
  .slice(0, 46);

/** The people the role reaches. Indices into FIELD, chosen for composition. */
const REACHED = [3, 7, 11, 18, 24, 31, 37];

/** Contour labels: the approved fragments, set on the person's lines. */
const LABELS = [
  { text: "Skills", ring: 3, angle: -1.95, minor: true },
  { text: "Experience", ring: 4, angle: -0.55 },
  { text: "Motivation", ring: 4, angle: 0.4, minor: true },
  { text: "Team", ring: 5, angle: 1.3 },
  { text: "Values", ring: 5, angle: 2.15, minor: true },
  { text: "Conversation", ring: 4, angle: 3.5 },
];

const RADII = [16, 30, 46, 64, 86, 110, 136];
const EASE = [0.16, 1, 0.3, 1] as const;

export function TalentMap({ className }: { className?: string }) {
  const reduced = useCalm();
  const pulse = useRef<SVGAnimateMotionElement | null>(null);

  // Send one search signal along the role → person connection once it is drawn.
  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => {
      try {
        pulse.current?.beginElement();
      } catch {
        /* SMIL unavailable: the static composition already says it */
      }
    }, 2100);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  const t = (delay: number, duration = 0.9) =>
    reduced ? { duration: 0 } : { duration, delay, ease: EASE };

  const mainPath = flow(ROLE.x + 14, ROLE.y, PERSON.x - 8, PERSON.y, 0.55);

  return (
    // Keyed on the preference: once a reduced-motion visitor's preference is
    // known (just after hydration), the drawing remounts at its end state.
    <div key={reduced ? "calm" : "live"} className={cx("relative", className)} style={{ aspectRatio: `${W} / ${H}` }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="ct-graphic absolute inset-0 h-full w-full overflow-visible"
        role="img"
        aria-labelledby="talent-map-title"
      >
        <title id="talent-map-title">
          A talent map: a field of people, a role brief reaching into it, and one person read in full — their
          skills, experience, motivation, team, values and conversation drawn as the context around them.
        </title>

        {/* Terrain: quiet context around people the search has not reached. */}
        <g fill="none" stroke="var(--ct-ink)" strokeWidth="0.7">
          {QUIET_TERRAIN.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              initial={reduced ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.13 }}
              transition={t(0.05 * i, 1.4)}
            />
          ))}
        </g>

        {/* The person's context, drawn outward from them. */}
        <g fill="none" stroke="var(--ct-ink)">
          {PERSON_RINGS.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              strokeWidth={i < 2 ? 1 : 0.8}
              initial={reduced ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.62 - i * 0.07 }}
              transition={t(0.15 + i * 0.09, 1.5)}
            />
          ))}
        </g>

        {/* The field of people. */}
        <g>
          {FIELD.map((p, n) => {
            const reached = REACHED.includes(n);
            return (
              <motion.circle
                key={p.i}
                cx={p.x}
                cy={p.y}
                r={reached ? 3.6 : 2.6}
                fill={reached ? "var(--ct-ink)" : "var(--ct-ink)"}
                initial={reduced ? false : { opacity: 0, scale: 0.4 }}
                animate={{ opacity: reached ? 0.8 : 0.28, scale: 1 }}
                transition={t(0.35 + (n % 12) * 0.04, 0.6)}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            );
          })}
        </g>

        {/* Search connections: the role reaching into the field. */}
        <g fill="none" stroke="var(--ct-green)" strokeWidth="0.9">
          {REACHED.map((n, k) => {
            const p = FIELD[n];
            return (
              <motion.path
                key={n}
                d={flow(ROLE.x + 14, ROLE.y, p.x, p.y, 0.5)}
                initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.38 }}
                transition={t(1.0 + k * 0.08, 0.9)}
              />
            );
          })}
          <motion.path
            d={mainPath}
            strokeWidth="1.6"
            initial={reduced ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={t(1.3, 1)}
          />
        </g>

        {/* The search signal, sent once. */}
        {!reduced && (
          <circle r="4" fill="var(--ct-green)" opacity="0">
            <animateMotion
              id="talent-map-pulse"
              ref={pulse}
              begin="indefinite"
              dur="1.1s"
              fill="freeze"
              path={mainPath}
            />
            <animate attributeName="opacity" begin="talent-map-pulse.begin" values="0;1;1;0" dur="1.1s" fill="freeze" />
          </circle>
        )}

        {/* The role brief: the logo's frame, without the letter. */}
        <g>
          {ROLE_FRAMES.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke="var(--ct-green)"
              strokeWidth={i === 0 ? 1.4 : 0.9}
              initial={reduced ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.95 - i * 0.28 }}
              transition={t(0.7 + i * 0.12, 1)}
            />
          ))}
          <motion.rect
            x={ROLE.x - 7}
            y={ROLE.y - 7}
            width="14"
            height="14"
            rx="3.5"
            fill="var(--ct-ink)"
            initial={reduced ? false : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={t(0.8, 0.6)}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        </g>

        {/* The person. The brand's node — the only vermillion on the drawing. */}
        <g>
          {!reduced && (
            <circle cx={PERSON.x} cy={PERSON.y} r="9" fill="none" stroke="var(--ct-signal)" className="ct-ripple" />
          )}
          <motion.circle
            cx={PERSON.x}
            cy={PERSON.y}
            r="8"
            fill="var(--ct-signal)"
            initial={reduced ? false : { opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={t(2.6, 0.7)}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        </g>
      </svg>

      {/* Labels are HTML so they stay legible at every size. */}
      <MapPin x={ROLE.x} y={ROLE.y + 62} delay={1.1} reduced={reduced}>
        <span className="ct-tag ct-b-green text-[var(--ct-green-deep)]">Role</span>
      </MapPin>
      <MapPin x={ROLE.x} y={ROLE.y - 62} delay={1.2} reduced={reduced} minor>
        <span className="ct-meta ct-mute">Context</span>
      </MapPin>
      {LABELS.map((l, i) => {
        const r = RADII[l.ring];
        const x = PERSON.x + Math.cos(l.angle) * r * 1.08;
        const y = PERSON.y + Math.sin(l.angle) * r;
        return (
          <MapPin key={l.text} x={x} y={y} delay={2.7 + i * 0.08} reduced={reduced} minor={l.minor}>
            <span className="ct-tag">{l.text}</span>
          </MapPin>
        );
      })}
    </div>
  );
}

function MapPin({
  x,
  y,
  delay,
  reduced,
  minor = false,
  children,
}: {
  x: number;
  y: number;
  delay: number;
  reduced: boolean | null;
  minor?: boolean;
  children: React.ReactNode;
}) {
  // The outer span owns the centring transform; the inner one animates, so
  // the two transforms never overwrite each other.
  return (
    <span
      aria-hidden="true"
      className={cx("ct-pin", minor && "hidden sm:block")}
      style={{ left: pct(x, W), top: pct(y, H) }}
    >
      <motion.span
        className="block"
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.6, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}
