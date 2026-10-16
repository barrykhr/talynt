"use client";

import { useCalm } from "@/lib/contour/motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { SOURCING_STAGES } from "@/components/visuals/TalentUniverse";
import { CANDIDATES } from "@/lib/candidates";
import { flow, frame, noise, pct, ring, round } from "@/lib/contour/geometry";
import { cx } from "@/lib/utils";

/**
 * GRAPHIC B — search signals.
 *
 * A conceptual drawing of the approved sourcing sequence, not a live search.
 * It starts as a broad field of profile fragments. A signal sweeps the field.
 * Relevant relationships light up and connect back to the role; a person reads
 * the ones that survive; context is drawn around the few evaluated in depth;
 * and the drawing resolves into a shortlist of four.
 *
 * The stages and their counts are the approved ones. The dots are a
 * representation of scale, not a count of anything.
 */

const W = 640;
const H = 400;
const BRIEF = { x: 58, y: 200 };

/** How many fragments remain visible at each stage. */
const VISIBLE = [112, 64, 30, 16, 8, 4];

const NODES = Array.from({ length: VISIBLE[0] }).map((_, i) => ({
  i,
  x: round(132 + noise(i, 4.1) * 360),
  y: round(30 + noise(i, 6.3) * 340),
}));

const SHORTLIST_Y = [92, 164, 236, 308];
const SHORTLIST_X = 596;

const RINGS = [9, 15].map((r, k) => ring(0, 0, r, 12 + k * 0.03, 0.14));
const BRIEF_FRAMES = [10, 20, 31].map((h) => frame(BRIEF.x, BRIEF.y, h, 4.4));

const STEP_MS = 2300;

export function SearchSignals() {
  const reduced = useCalm();
  const last = SOURCING_STAGES.length - 1;
  const [stage, setStage] = useState(0);
  const [touched, setTouched] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.4,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reduced motion: show where the sequence ends. Stepping back stays available.
  const [settled, setSettled] = useState(false);
  if (reduced && !settled) {
    setSettled(true);
    setStage(last);
  }

  // Plays once while visible, then rests. Hovering or focusing it pauses.
  useEffect(() => {
    if (reduced || touched || paused || !inView || stage >= last) return;
    const timer = window.setTimeout(() => setStage((s) => Math.min(s + 1, last)), stage === 0 ? 1200 : STEP_MS);
    return () => window.clearTimeout(timer);
  }, [reduced, touched, paused, inView, stage, last]);

  const choose = useCallback((i: number) => {
    setTouched(true);
    setStage(i);
  }, []);

  const active = SOURCING_STAGES[stage];

  return (
    <div
      ref={ref}
      className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* The stages: approved labels, counts and notes. */}
      <ol className="flex flex-col" aria-label="The sourcing sequence">
        {SOURCING_STAGES.map((item, i) => {
          const current = i === stage;
          return (
            <li key={item.label} className="border-t first:border-t-0 lg:first:border-t">
              <button
                type="button"
                onClick={() => choose(i)}
                aria-current={current ? "step" : undefined}
                className={cx(
                  "group flex w-full items-start gap-4 py-4 text-left transition-colors duration-300",
                  current ? "text-[var(--ct-ink)]" : "text-[var(--ct-mute)] hover:text-[var(--ct-ink)]",
                )}
              >
                <span
                  className={cx(
                    "ct-meta mt-1 w-6 shrink-0 tabular-nums transition-colors",
                    current || i < stage ? "ct-green" : "ct-mute",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="ct-display ct-s">{item.label}</span>
                    <span className="font-mono text-[0.85rem] tabular-nums">{item.count}</span>
                  </span>
                  <span className={cx("ct-collapse", "mt-1")} data-open={current ? "true" : "false"}>
                    <span className="block">
                      <span className="block max-w-md pt-1 text-[0.92rem] leading-[1.55] text-[var(--ct-ink-2)]">
                        {item.note}
                      </span>
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* The field. */}
      <div className="lg:sticky lg:top-[calc(var(--ct-nav-h)+2rem)] lg:self-start">
        <div className="ct-window">
          <div className="ct-window-bar">
            <span className="ct-meta ct-mute">Search field · conceptual</span>
            <span className="ct-meta ct-green tabular-nums">{active.count}</span>
          </div>
          <div className="ct-field relative bg-[var(--ct-bg)]" style={{ aspectRatio: `${W} / ${H}` }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="ct-graphic absolute inset-0 h-full w-full" aria-hidden="true">
              {/* Connections back to the role. */}
              <g fill="none" stroke="var(--ct-green)" strokeWidth="0.8">
                {NODES.slice(0, VISIBLE[2]).map((n) => {
                  const on = stage >= 2 && stage <= 4 && n.i < VISIBLE[stage];
                  return (
                    <path
                      key={n.i}
                      d={flow(BRIEF.x + 12, BRIEF.y, n.x, n.y, 0.55)}
                      style={{
                        opacity: on ? (stage === 4 ? 0.6 : 0.28) : 0,
                        transition: reduced ? "none" : "opacity 700ms ease",
                      }}
                    />
                  );
                })}
                {SHORTLIST_Y.map((y, k) => (
                  <path
                    key={k}
                    d={flow(BRIEF.x + 12, BRIEF.y, SHORTLIST_X - 10, y, 0.6)}
                    strokeWidth="1.3"
                    style={{
                      opacity: stage === 5 ? 0.85 : 0,
                      transition: reduced ? "none" : "opacity 800ms ease 500ms",
                    }}
                  />
                ))}
              </g>

              {/* The sweep: a signal crossing the field once. */}
              {stage === 1 && !reduced && (
                <g className="ct-sweep">
                  <line x1="120" y1="18" x2="120" y2="382" stroke="var(--ct-green)" strokeWidth="1.2" />
                  <rect x="80" y="18" width="40" height="364" fill="url(#ct-sweep-fade)" />
                </g>
              )}
              <defs>
                <linearGradient id="ct-sweep-fade" x1="0" x2="1">
                  <stop offset="0" stopColor="var(--ct-green)" stopOpacity="0" />
                  <stop offset="1" stopColor="var(--ct-green)" stopOpacity="0.12" />
                </linearGradient>
              </defs>

              {/* Fragments. */}
              {NODES.map((n) => {
                const visible = n.i < VISIBLE[stage];
                const short = stage === 5 && n.i < 4;
                const x = short ? SHORTLIST_X : n.x;
                const y = short ? SHORTLIST_Y[n.i] : n.y;
                const fill =
                  short ? "var(--ct-signal)" : stage >= 2 && visible ? "var(--ct-green)" : "var(--ct-ink)";
                const opacity = !visible
                  ? stage === 0
                    ? 0.24
                    : 0.07
                  : stage === 0
                    ? 0.24
                    : stage === 1
                      ? 0.62
                      : 0.95;
                const scale = short ? 1.9 : visible && stage >= 2 ? 1.25 : 1;
                return (
                  <g
                    key={n.i}
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                      transition: reduced ? "none" : "transform 1100ms cubic-bezier(0.16,1,0.3,1)",
                    }}
                  >
                    {/* Read by a person. */}
                    {n.i < VISIBLE[3] && (
                      <circle
                        r="6.5"
                        fill="none"
                        stroke="var(--ct-ink)"
                        strokeWidth="0.8"
                        style={{
                          opacity: stage === 3 && visible ? 0.55 : 0,
                          transition: reduced ? "none" : "opacity 600ms ease",
                        }}
                      />
                    )}
                    {/* Context drawn around the few evaluated in depth. */}
                    {n.i < VISIBLE[4] &&
                      RINGS.map((d, k) => (
                        <path
                          key={k}
                          d={d}
                          fill="none"
                          stroke="var(--ct-ink)"
                          strokeWidth="0.7"
                          style={{
                            opacity: (stage === 4 && visible) || short ? 0.5 - k * 0.15 : 0,
                            transition: reduced ? "none" : "opacity 700ms ease",
                          }}
                        />
                      ))}
                    <circle
                      r="2.6"
                      style={{
                        fill,
                        opacity,
                        transform: `scale(${scale})`,
                        transition: reduced
                          ? "none"
                          : "opacity 700ms ease, fill 700ms ease, transform 700ms cubic-bezier(0.16,1,0.3,1)",
                      }}
                    />
                  </g>
                );
              })}

              {/* The role brief. */}
              <g fill="none" stroke="var(--ct-green)">
                {BRIEF_FRAMES.map((d, i) => (
                  <path key={i} d={d} strokeWidth={i === 0 ? 1.3 : 0.8} opacity={0.9 - i * 0.28} />
                ))}
              </g>
              <rect x={BRIEF.x - 6} y={BRIEF.y - 6} width="12" height="12" rx="3" fill="var(--ct-ink)" />
            </svg>

            <span className="ct-pin" style={{ left: pct(BRIEF.x, W), top: pct(BRIEF.y + 48, H) }} aria-hidden="true">
              <span className="ct-tag ct-b-green text-[var(--ct-green-deep)]">Role</span>
            </span>

            {/* Shortlist references — the illustrative candidates used across the site. */}
            {CANDIDATES.slice(0, 4).map((c, k) => (
              <span
                key={c.id}
                aria-hidden="true"
                className="absolute hidden -translate-y-1/2 sm:block"
                style={{
                  right: pct(W - SHORTLIST_X + 18, W),
                  top: pct(SHORTLIST_Y[k], H),
                  opacity: stage === 5 ? 1 : 0,
                  // Delay only on the way in, after the four have moved into place.
                  transition: reduced ? "none" : stage === 5 ? "opacity 600ms ease 900ms" : "opacity 250ms ease",
                }}
              >
                <span className="ct-meta rounded-[4px] bg-[var(--ct-surface)] px-1.5 py-0.5 text-[var(--ct-ink-2)]">
                  {c.ref}
                </span>
              </span>
            ))}
          </div>

          {/* Progress through the sequence. */}
          <div className="flex items-center gap-4 border-t px-4 py-3">
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {SOURCING_STAGES.map((s, i) => (
                <span
                  key={s.label}
                  className="h-[3px] flex-1 rounded-full transition-colors duration-500"
                  style={{ backgroundColor: i <= stage ? "var(--ct-green)" : "var(--ct-line)" }}
                />
              ))}
            </div>
            {stage === last ? (
              <button
                type="button"
                onClick={() => {
                  setTouched(false);
                  setStage(0);
                }}
                className="ct-meta ct-green min-h-9 px-1 hover:underline"
              >
                Replay
              </button>
            ) : (
              <span className="ct-meta ct-mute">{active.label}</span>
            )}
          </div>
        </div>

        <p className="sr-only" aria-live={touched ? "polite" : "off"}>
          Stage {stage + 1} of {SOURCING_STAGES.length}: {active.label}, {active.count}. {active.note}
        </p>
      </div>
    </div>
  );
}
