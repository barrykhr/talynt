"use client";

import { useEffect, useRef, useState } from "react";
import { useCalm } from "@/lib/contour/motion";
import { EMPLOYER_HERO, PROGRESSION } from "@/lib/contour/proposed";
import { flow, frame, noise, round } from "@/lib/contour/geometry";
import { cx } from "@/lib/utils";

/**
 * The employer hero's drawing: a role brief arrives, its requirements become
 * visible, people in the market appear, relevant experience lights up, and a
 * shortlist emerges. A concept, labelled as one — it does not show, or claim,
 * a search running anywhere.
 *
 * Plays once when it scrolls into view, then rests. Reduced motion shows the
 * last stage. Stepping through by hand is always available.
 */

const W = 520;
const H = 340;
const BRIEF = { x: 70, y: 170 };
const REQ = [
  { y: 140, w: 56, label: "Owns the platform" },
  { y: 170, w: 44, label: "Correct numbers" },
  { y: 200, w: 50, label: "Holds a position" },
];
const NODES = Array.from({ length: 46 }).map((_, i) => ({
  i,
  x: round(220 + noise(i, 3.7) * 170),
  y: round(28 + noise(i, 9.1) * 284),
}));
const RELEVANT = [2, 7, 11, 19, 24, 31, 38];
const FEEDS = [...RELEVANT].sort((a, b) => NODES[a].y - NODES[b].y).filter((_, k) => k % 2 === 0).slice(0, 3);
const SHORT_Y = [118, 170, 222];

export function SourcingProgression() {
  const calm = useCalm();
  const last = PROGRESSION.length - 1;
  const [stage, setStage] = useState(0);
  const [touched, setTouched] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (calm || touched || !inView || stage >= last) return;
    const t = window.setTimeout(() => setStage((s) => Math.min(s + 1, last)), stage === 0 ? 700 : 1300);
    return () => window.clearTimeout(t);
  }, [calm, touched, inView, stage, last]);

  const shown = calm && !touched ? last : stage;
  const on = (n: number) => shown >= n;
  const fade = (n: number, delay = 0) => ({
    opacity: on(n) ? 1 : 0,
    transition: calm ? "none" : `opacity 700ms ease ${delay}ms`,
  });
  const draw = (n: number, delay = 0) => ({
    strokeDasharray: 1,
    strokeDashoffset: on(n) ? 0 : 1,
    transition: calm ? "none" : `stroke-dashoffset 1000ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  });

  return (
    <figure ref={ref} className="ct-window">
      <div className="ct-window-bar">
        <span className="ct-meta ct-mute">{EMPLOYER_HERO.graphicLabel}</span>
        <span className="ct-meta ct-green tabular-nums">
          {shown + 1}/{PROGRESSION.length}
        </span>
      </div>
      <div className="ct-field relative bg-[var(--ct-bg)]" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          {/* 1 — the brief */}
          <g style={fade(0)}>
            {[14, 26, 38].map((h, i) => (
              <path key={h} d={frame(BRIEF.x, BRIEF.y, h, 4.4)} fill="none" stroke="var(--ct-green)" strokeWidth={i === 0 ? 1.4 : 0.8} opacity={1 - i * 0.28} />
            ))}
            <rect x={BRIEF.x - 7} y={BRIEF.y - 7} width="14" height="14" rx="3.5" fill="var(--ct-ink)" />
          </g>
          {/* 2 — what it needs */}
          {REQ.map((r, i) => (
            <g key={r.y}>
              <path d={`M118 ${r.y}h${r.w}`} stroke="var(--ct-green)" strokeWidth="2.6" strokeLinecap="round" pathLength={1} style={draw(1, i * 140)} />
              <text x={118} y={r.y - 8} fontSize="9" className="font-mono" fill="var(--ct-ink-2)" style={fade(1, 200 + i * 140)}>
                {r.label}
              </text>
            </g>
          ))}
          {/* 3 — people in the market */}
          {NODES.map((n) => {
            const relevant = RELEVANT.includes(n.i);
            const lit = relevant && on(3);
            const dim = on(3) && !relevant;
            return (
              <circle
                key={n.i}
                cx={n.x}
                cy={n.y}
                r={lit ? 4 : 2.6}
                fill={lit ? "var(--ct-green)" : "var(--ct-ink)"}
                style={{
                  opacity: !on(2) ? 0 : dim ? 0.12 : lit ? 1 : 0.32,
                  transition: calm ? "none" : `opacity 700ms ease ${(n.i % 8) * 40}ms, r 500ms ease`,
                }}
              />
            );
          })}
          {/* 4 — relevant experience, connected back to the requirements */}
          <g fill="none" stroke="var(--ct-green)" strokeWidth="0.9" opacity="0.55">
            {RELEVANT.map((i, k) => (
              <path key={i} d={flow(174, 170, NODES[i].x, NODES[i].y, 0.5)} pathLength={1} style={draw(3, k * 70)} />
            ))}
          </g>
          {/* 5 — the shortlist, with context */}
          <g fill="none" stroke="var(--ct-green)" strokeWidth="1.4">
            {FEEDS.map((i, k) => (
              <path key={i} d={flow(NODES[i].x, NODES[i].y, 420, SHORT_Y[k], 0.55)} pathLength={1} style={draw(4, k * 150)} />
            ))}
          </g>
          {SHORT_Y.map((y, k) => (
            <g key={y} style={fade(4, 500 + k * 150)}>
              <rect x="420" y={y - 16} width="88" height="32" rx="7" fill="var(--ct-surface)" stroke="var(--ct-ink)" strokeWidth="1" />
              <circle cx="436" cy={y} r="5" fill="var(--ct-signal)" />
              <path d={`M448 ${y - 5}h${44 - k * 6}`} stroke="var(--ct-ink-2)" strokeWidth="1.6" strokeLinecap="round" />
              <path d={`M448 ${y + 5}h${30 + k * 5}`} stroke="var(--ct-lime)" strokeWidth="4" strokeLinecap="round" />
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="border-t">
        <ol className="grid grid-cols-5" aria-label="Stages">
          {PROGRESSION.map((p, i) => (
            <li key={p.id} className="border-l first:border-l-0">
              <button
                type="button"
                onClick={() => {
                  setTouched(true);
                  setStage(i);
                }}
                aria-current={i === shown ? "step" : undefined}
                className={cx(
                  "flex h-full min-h-14 w-full flex-col items-start gap-1 px-2.5 py-2.5 text-left transition-colors sm:px-3",
                  i === shown ? "bg-[var(--ct-green-wash)]" : "hover:bg-[var(--ct-bg-2)]",
                )}
              >
                <span className={cx("ct-meta tabular-nums", i <= shown ? "ct-green" : "ct-mute")}>{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[0.74rem] leading-tight text-[var(--ct-ink-2)] sm:text-[0.8rem]">{p.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
