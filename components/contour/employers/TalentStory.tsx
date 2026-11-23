"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HOW_WE_WORK } from "@/lib/contour/content";
import { COMPACT, STORY } from "@/lib/contour/proposed";
import { ROUTES } from "@/lib/contour/site";
import { frame, noise, ring, round } from "@/lib/contour/geometry";
import { useCalm } from "@/lib/contour/motion";
import { cx } from "@/lib/utils";

/**
 * "One search. Six layers of understanding", told as one drawing that changes
 * as the page scrolls — the way a product film turns one object from stage to
 * stage. Here the object is a field of people around a role: the role is
 * understood and defined, the market is searched, people are evaluated and
 * narrowed, the shortlist is calibrated, and four remain, each with a reason.
 *
 * The chapter text is the approved six layers, word for word. The drawing is a
 * concept and says so; no number in it is a real search.
 *
 * Scroll drives it while the section is pinned. With reduced motion the
 * drawing changes chapter by chapter without in-between movement; without
 * script, every chapter is listed in order and the drawing shows the last one.
 */

const N = 44; // people in the drawing
const C = 300; // centre of the 600×600 drawing
const CHAPTERS = HOW_WE_WORK.layers.length; // 6
const SHORTLIST = [3, 11, 19, 27]; // the four who remain
const RELEVANT = new Set([...SHORTLIST, 7, 15, 23, 31, 35, 39, 42, 1]);
const CALIBRATED = new Set([...SHORTLIST, 7, 15, 23, 31]);

type Dot = { x: number; y: number; r: number; o: number; lime: number };

/** Where each person sits in each chapter. */
function layout(i: number, chapter: number): Dot {
  const a = (i / N) * Math.PI * 2 + noise(i, 2) * 0.5;
  const isRelevant = RELEVANT.has(i);
  switch (chapter) {
    case 0: {
      // Understand: the market, out of focus, around the role and its context.
      const r = 200 + noise(i, 3) * 70;
      return { x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, r: 3.2, o: 0.28, lime: 0 };
    }
    case 1: {
      // Define: the same people, held further off while the role is written down.
      const r = 230 + noise(i, 3) * 50;
      return { x: C + Math.cos(a) * r, y: C + Math.sin(a) * r, r: 2.8, o: 0.2, lime: 0 };
    }
    case 2: {
      // Discover: the search spreads across the whole market.
      return { x: 50 + noise(i, 5) * 500, y: 60 + noise(i, 7) * 480, r: 4, o: 0.75, lime: isRelevant ? 0.6 : 0 };
    }
    case 3: {
      // Evaluate: relevant people drawn into one stream toward the role; the rest fall away.
      if (!isRelevant) return { x: 50 + noise(i, 5) * 500, y: 60 + noise(i, 7) * 480, r: 2.6, o: 0.12, lime: 0 };
      const k = [...RELEVANT].sort((p, q) => p - q).indexOf(i);
      const t = k / (RELEVANT.size - 1);
      return { x: C + Math.sin(t * Math.PI * 1.6) * 70 * (1 - t), y: 70 + t * 210, r: 5, o: 1, lime: 1 };
    }
    case 4: {
      // Calibrate: what you said about the first people sharpens the circle.
      if (!CALIBRATED.has(i)) return { x: C + Math.cos(a) * 270, y: C + Math.sin(a) * 270, r: 2.4, o: 0.08, lime: 0 };
      const k = [...CALIBRATED].sort((p, q) => p - q).indexOf(i);
      const b = (k / CALIBRATED.size) * Math.PI * 2 - Math.PI / 2;
      return { x: C + Math.cos(b) * 120, y: C + Math.sin(b) * 120, r: SHORTLIST.includes(i) ? 7 : 4.5, o: SHORTLIST.includes(i) ? 1 : 0.55, lime: SHORTLIST.includes(i) ? 1 : 0.4 };
    }
    default: {
      // Decide: four people, each with the reasoning attached.
      const k = SHORTLIST.indexOf(i);
      if (k === -1) return { x: C + Math.cos(a) * 290, y: C + Math.sin(a) * 290, r: 2, o: 0, lime: 0 };
      return { x: 120 + k * 120, y: 252, r: 9, o: 1, lime: 1 };
    }
  }
}

const LAYOUTS = Array.from({ length: CHAPTERS }, (_, c) => Array.from({ length: N }, (_, i) => layout(i, c)));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** The scene at a point between chapters: `p` runs from 0 to CHAPTERS - 1. */
function dotsAt(p: number): Dot[] {
  const k = Math.min(Math.floor(p), CHAPTERS - 2);
  const t = ease(Math.min(1, Math.max(0, p - k)));
  return LAYOUTS[k].map((d, i) => {
    const e = LAYOUTS[k + 1][i];
    return { x: mix(d.x, e.x, t), y: mix(d.y, e.y, t), r: mix(d.r, e.r, t), o: mix(d.o, e.o, t), lime: mix(d.lime, e.lime, t) };
  });
}

/** How present chapter `k`'s own marks are at `p`: 1 on the chapter, 0 a chapter away. */
const weight = (p: number, k: number) => Math.max(0, 1 - Math.abs(p - k) * 1.6);

const CONTEXT_RINGS = [70, 100, 130].map((r, i) => ring(C, C, r, 61 + i * 0.03, 0.12));
const ROLE_FRAME = frame(C, C, 42);
const ROLE_FRAME_SMALL = frame(C, 330, 30);

function Scene({ p }: { p: number }) {
  const dots = dotsAt(p);
  const w = (k: number) => round(weight(p, k));
  // The role's frame: centre stage while it is understood and defined, then it
  // waits below the stream for the people being evaluated.
  const frameAt = p < 2.2 ? 1 : Math.max(0, 1 - (p - 2.2) * 2.5);
  const smallFrame = Math.max(0, Math.min(1, (p - 2.6) * 2.5)) * (p < 4.3 ? 1 : Math.max(0, 1 - (p - 4.3) * 2.5));
  return (
    <svg viewBox="0 0 600 600" className="h-full w-full" role="img" aria-label={STORY.drawingLabel}>
      <defs>
        <radialGradient id="story-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--ct-lime)" stopOpacity="0.28" />
          <stop offset="60%" stopColor="var(--ct-lime)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="var(--ct-lime)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r="250" fill="url(#story-glow)" />

      {/* 01 Understand: the role inside its context. */}
      <g opacity={w(0)}>
        {CONTEXT_RINGS.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--ct-ink)" strokeOpacity={0.5 - i * 0.12} strokeWidth="1" />
        ))}
      </g>

      {/* The role. */}
      <g opacity={round(frameAt)}>
        <path d={ROLE_FRAME} fill="var(--ct-surface)" stroke="var(--ct-lime)" strokeWidth="1.5" />
        <rect x={C - 9} y={C - 9} width="18" height="18" rx="4.5" fill="var(--ct-ink)" />
      </g>

      {/* 02 Define: what this person owns, decides and inherits. */}
      <g opacity={w(1)}>
        {STORY.define.map((label, i) => (
          <g key={label} transform={`translate(${C + 70} ${C - 34 + i * 30})`}>
            <line x1="0" y1="0" x2="26" y2="0" stroke="var(--ct-line-2)" strokeWidth="1" />
            <text x="34" y="4" fill="var(--ct-ink)" fontFamily="var(--ct-mono)" fontSize="11" letterSpacing="1">
              {label.toUpperCase()}
            </text>
            <line x1="34" y1="11" x2={34 + 30 + i * 12} y2="11" stroke="var(--ct-lime)" strokeWidth="2" strokeLinecap="round" />
          </g>
        ))}
      </g>

      {/* 03 Discover: a sweep across the market. */}
      <g opacity={w(2)}>
        <circle cx={C} cy={C} r={round(120 + (p % 1) * 160)} fill="none" stroke="var(--ct-lime)" strokeOpacity="0.35" strokeDasharray="2 6" />
        <circle cx={C} cy={C} r="250" fill="none" stroke="var(--ct-line-2)" strokeDasharray="1 7" />
      </g>

      {/* 04–05 The role waiting below the stream. */}
      <g opacity={round(smallFrame)}>
        <path d={ROLE_FRAME_SMALL} fill="var(--ct-surface)" stroke="var(--ct-lime)" strokeWidth="1.5" />
        <rect x={C - 7} y={323} width="14" height="14" rx="3.5" fill="var(--ct-ink)" />
      </g>

      {/* 05 Calibrate: feedback closes the loop. */}
      <g opacity={w(4)}>
        <path d={`M${C + 150} ${C}A150 150 0 1 1 ${C} ${C - 150}`} fill="none" stroke="var(--ct-lime)" strokeOpacity="0.6" strokeWidth="1.25" strokeDasharray="3 5" />
        <path d={`M${C - 6} ${C - 156}L${C + 2} ${C - 150}L${C - 6} ${C - 144}`} fill="none" stroke="var(--ct-lime)" strokeWidth="1.25" />
      </g>

      {/* 06 Decide: four cards, a reason under each person. */}
      <g opacity={w(5)}>
        {SHORTLIST.map((_, k) => (
          <g key={k} transform={`translate(${72 + k * 120} 200)`}>
            <rect width="96" height="150" rx="12" fill="var(--ct-surface)" stroke="var(--ct-line-2)" />
            {[0, 1, 2].map((l) => (
              <rect key={l} x="16" y={84 + l * 16} width={64 - l * 14 - (k % 2) * 6} height="5" rx="2.5" fill={l === 0 ? "var(--ct-lime)" : "var(--ct-line-2)"} />
            ))}
          </g>
        ))}
        <text x={C} y="398" textAnchor="middle" fill="var(--ct-mute)" fontFamily="var(--ct-mono)" fontSize="11" letterSpacing="1.5">
          {STORY.shortlist.toUpperCase()}
        </text>
      </g>

      {/* The people. */}
      {dots.map((d, i) =>
        d.o < 0.01 ? null : (
          <circle
            key={i}
            cx={round(d.x)}
            cy={round(d.y)}
            r={round(d.r)}
            fill={d.lime > 0.5 ? "var(--ct-lime)" : "var(--ct-ink)"}
            opacity={round(d.o)}
          />
        ),
      )}
    </svg>
  );
}

export function TalentStory({ index }: { index: string }) {
  const calm = useCalm();
  const ref = useRef<HTMLElement | null>(null);
  // Start on the last chapter so the server's drawing (and a reader without
  // script) shows where the search ends; the browser moves it to chapter one.
  const [p, setP] = useState(CHAPTERS - 1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frameId = 0;
    const update = () => {
      frameId = 0;
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const progress = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;
      setP(progress * (CHAPTERS - 1));
    };
    const onScroll = () => {
      if (!frameId) frameId = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  // Reduced motion: whole chapters, no in-between movement.
  const shown = calm ? Math.round(p) : p;
  const active = Math.round(p);

  return (
    <section
      ref={ref}
      id="how-we-work"
      aria-labelledby="how-heading"
      className="ct-story scroll-mt-[var(--ct-nav-h)]"
      style={{ height: `calc(${CHAPTERS} * 26svh + 100svh)` }}
    >
      <div className="ct-story-stage sticky top-0 flex h-[100svh] flex-col overflow-hidden pt-[var(--ct-nav-h)]">
        <div className="ct-wrap flex items-end justify-between gap-6 pt-6 md:pt-8">
          <div>
            <p className="ct-meta flex items-center gap-3">
              <span className="ct-green tabular-nums">{index}</span>
              <span aria-hidden="true" className="h-px w-6 bg-[var(--ct-line-2)]" />
              <span className="ct-mute">{HOW_WE_WORK.eyebrow}</span>
            </p>
            <h2 id="how-heading" className="ct-display mt-3 text-[clamp(1.5rem,1.1rem+1.4vw,2.35rem)] leading-[1.1]">
              {HOW_WE_WORK.title} <span className="ct-italic">{HOW_WE_WORK.titleItalic}</span>
            </h2>
          </div>
          <Link href={`${ROUTES.approach}#how-we-work`} className="ct-link hidden shrink-0 text-[0.92rem] sm:inline-flex">
            {COMPACT.more} <span aria-hidden="true">&nbsp;→</span>
          </Link>
        </div>

        <div className="ct-wrap relative grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-4 pb-6 lg:grid-cols-12 lg:grid-rows-1 lg:items-center lg:gap-8 lg:pb-10">
          {/* The drawing. */}
          <figure className="relative min-h-0 lg:col-span-6 lg:col-start-4 lg:h-full">
            <div className="mx-auto aspect-square h-full max-h-full max-w-full">
              <Scene p={shown} />
            </div>
            <figcaption className="ct-meta ct-mute absolute bottom-0 left-0 text-[0.6rem]">{STORY.concept}</figcaption>
          </figure>

          {/* The chapters: one at a time, alternating sides, like a film's title cards. */}
          <ol className="ct-story-chapters relative min-h-[12.5rem] lg:contents">
            {HOW_WE_WORK.layers.map((layer, k) => {
              const on = k === active;
              return (
                <li
                  key={layer.title}
                  aria-current={on ? "step" : undefined}
                  className={cx(
                    "ct-story-chapter absolute inset-x-0 top-0 transition-[opacity,transform] duration-500 lg:static",
                    "lg:row-start-1 lg:self-center",
                    k % 2 === 0 ? "lg:col-span-3 lg:col-start-1" : "lg:col-span-3 lg:col-start-10 lg:text-right",
                    on ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0",
                  )}
                >
                  <p className="ct-meta ct-green tabular-nums">
                    {String(k + 1).padStart(2, "0")} <span className="ct-mute">/ {String(CHAPTERS).padStart(2, "0")}</span>
                  </p>
                  <h3 className="ct-display mt-2 text-[clamp(1.9rem,1.3rem+2.2vw,3.4rem)] leading-none">{layer.title}</h3>
                  <p className="ct-body mt-3 max-w-sm text-[0.98rem] lg:max-w-none">{layer.body}</p>
                  <p className="ct-meta ct-mute mt-3 text-[0.62rem]">{COMPACT.layers[k].who}</p>
                </li>
              );
            })}
          </ol>

          {/* Where you are in the six. */}
          <ol aria-hidden="true" className="absolute right-[var(--ct-gutter)] bottom-6 flex gap-1.5 lg:bottom-10">
            {HOW_WE_WORK.layers.map((layer, k) => (
              <li
                key={layer.title}
                className={cx("h-1 rounded-full transition-all duration-300", k === active ? "w-6 bg-[var(--ct-lime)]" : "w-2 bg-[var(--ct-line-2)]")}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
