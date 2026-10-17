"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ROLES } from "@/lib/candidate/roles";
import { ENTRY } from "@/lib/contour/proposed";
import { AUDIENCE_HOME, useAudience, type Audience } from "@/lib/contour/audience";
import { flow, frame, noise, ring, round } from "@/lib/contour/geometry";
import { cx } from "@/lib/utils";

/**
 * The opening choice. Two options, each the whole of its panel, drawn out of
 * one TALYNT mark between them: a career pathway to the left, a search
 * narrowing to a shortlist to the right. It is a page, not a modal — nothing
 * blocks the rest of the site, and the choice is remembered on this device so
 * a returning visitor sees it marked rather than being asked to start over.
 */

const VB = { w: 360, h: 220 };
const CANDIDATE_ROLES = ["staff-data-engineer-fintech", "design-lead-consumer", "product-manager-developer-tools"]
  .map((slug) => ROLES.find((r) => r.slug === slug)?.title.split(",")[0])
  .filter(Boolean) as string[];

const ROLE_Y = [46, 110, 174];
const PERSON = { x: 302, y: 110 };
const PERSON_RINGS = [15, 25, 35].map((r, i) => ring(PERSON.x, PERSON.y, r, 21 + i, 0.12));
const ROLE_X = 150;
const ROLE_FRAMES = ROLE_Y.map((y) => frame(ROLE_X, y, 17, 4.4));

function CandidateDrawing() {
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="h-full w-full" aria-hidden="true">
      <g fill="none" stroke="var(--ct-violet)" strokeWidth="1.2">
        {ROLE_Y.map((y, i) => (
          <path key={y} d={flow(PERSON.x - 36, PERSON.y, ROLE_X + 22, y, 0.55)} pathLength={1} className="ct-draw" style={{ ["--d" as string]: `${700 + i * 160}ms` }} />
        ))}
      </g>
      {PERSON_RINGS.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--ct-violet)" strokeWidth={i === 0 ? 1.1 : 0.8} opacity={0.9 - i * 0.25} pathLength={1} className="ct-draw" style={{ ["--d" as string]: `${400 + i * 120}ms` }} />
      ))}
      <circle cx={PERSON.x} cy={PERSON.y} r="4.5" fill="var(--ct-signal)" />
      {ROLE_Y.map((y, i) => (
        <g key={y} className="ct-appear" style={{ ["--d" as string]: `${1300 + i * 160}ms` }}>
          <path d={ROLE_FRAMES[i]} fill="var(--ct-surface)" stroke="var(--ct-ink)" strokeWidth="1.1" />
          <rect x={ROLE_X - 6} y={y - 6} width="12" height="12" rx="3" fill="var(--ct-ink)" />
          <text x={ROLE_X - 26} y={y + 3.5} textAnchor="end" className="font-mono" fontSize="9.5" fill="var(--ct-ink-2)" letterSpacing="0.04em">
            {CANDIDATE_ROLES[i]}
          </text>
          {/* Its own assessment */}
          <g transform={`translate(${ROLE_X + 9} ${y + 4})`}>
            <rect width="13" height="16" rx="2.5" fill="var(--ct-violet-wash)" stroke="var(--ct-violet)" strokeWidth="0.8" />
            <path d="M3.5 5.5h6M3.5 8.5h6M3.5 11.5h4" stroke="var(--ct-violet-ink)" strokeWidth="0.9" />
          </g>
        </g>
      ))}
    </svg>
  );
}

const BRIEF = { x: 66, y: 110 };
const BRIEF_FRAMES = [12, 21].map((h) => frame(BRIEF.x, BRIEF.y, h, 4.4));
const REQUIREMENTS = [
  { y: 94, w: 38 },
  { y: 110, w: 28 },
  { y: 126, w: 34 },
];
const FRAGMENTS = Array.from({ length: 30 }).map((_, i) => ({
  i,
  x: round(156 + noise(i, 8.3) * 112),
  y: round(28 + noise(i, 4.7) * 164),
}));
const RELEVANT = [3, 9, 14, 21, 26];
/** The three relevant fragments that reach the shortlist, top to bottom, so no lines cross. */
const FEEDS = [...RELEVANT].sort((a, b) => FRAGMENTS[a].y - FRAGMENTS[b].y).filter((_, k) => k % 2 === 0);
const SHORT_Y = [82, 110, 138];

function EmployerDrawing() {
  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className="h-full w-full" aria-hidden="true">
      {BRIEF_FRAMES.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--ct-green)" strokeWidth={i === 0 ? 1.3 : 0.8} opacity={1 - i * 0.3} pathLength={1} className="ct-draw" style={{ ["--d" as string]: `${400 + i * 120}ms` }} />
      ))}
      <rect x={BRIEF.x - 5.5} y={BRIEF.y - 5.5} width="11" height="11" rx="3" fill="var(--ct-ink)" />
      {REQUIREMENTS.map((r, i) => (
        <path key={r.y} d={`M96 ${r.y}h${r.w}`} stroke="var(--ct-green)" strokeWidth="2.2" strokeLinecap="round" pathLength={1} className="ct-draw" style={{ ["--d" as string]: `${650 + i * 110}ms` }} />
      ))}
      {FRAGMENTS.map((f) => {
        const relevant = RELEVANT.includes(f.i);
        return (
          <circle
            key={f.i}
            cx={f.x}
            cy={f.y}
            r={relevant ? 3.2 : 2.2}
            fill={relevant ? "var(--ct-green)" : "var(--ct-ink)"}
            opacity={relevant ? 0.95 : 0.22}
            className="ct-appear"
            style={{ ["--d" as string]: `${relevant ? 1250 : 850 + (f.i % 6) * 40}ms` }}
          />
        );
      })}
      <g fill="none" stroke="var(--ct-green)" strokeWidth="0.8" opacity="0.6">
        {RELEVANT.map((i, k) => (
          <path key={i} d={flow(134, 110, FRAGMENTS[i].x, FRAGMENTS[i].y, 0.5)} pathLength={1} className="ct-draw" style={{ ["--d" as string]: `${1150 + k * 80}ms` }} />
        ))}
      </g>
      <g fill="none" stroke="var(--ct-green)" strokeWidth="1.2">
        {SHORT_Y.map((y, k) => {
          const from = FRAGMENTS[FEEDS[k]];
          return <path key={y} d={flow(from.x, from.y, 296, y, 0.55)} pathLength={1} className="ct-draw" style={{ ["--d" as string]: `${1600 + k * 140}ms` }} />;
        })}
      </g>
      {SHORT_Y.map((y, k) => (
        <g key={y} className="ct-appear" style={{ ["--d" as string]: `${1950 + k * 140}ms` }}>
          <rect x="296" y={y - 9} width="56" height="18" rx="5" fill="var(--ct-surface)" stroke="var(--ct-ink)" strokeWidth="0.9" />
          <circle cx="307" cy={y} r="3.6" fill="var(--ct-signal)" />
          <path d={`M316 ${y - 2}h${26 - k * 4}M316 ${y + 3}h${18 + k * 3}`} stroke="var(--ct-mute)" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

/** The TALYNT mark between the two options, with each side's path leaving it. */
function Origin() {
  return (
    <svg viewBox="0 0 96 220" className="h-full w-full" aria-hidden="true">
      <path d="M32 110H0" stroke="var(--ct-violet)" strokeWidth="1.2" fill="none" pathLength={1} className="ct-draw" style={{ ["--d" as string]: "200ms" }} />
      <path d="M64 110H96" stroke="var(--ct-green)" strokeWidth="1.2" fill="none" pathLength={1} className="ct-draw" style={{ ["--d" as string]: "200ms" }} />
      <rect x="34" y="96" width="28" height="28" rx="7" fill="var(--ct-ink)" />
      <path d="M41 104.5h14M48 104.5V117" stroke="var(--ct-bg)" strokeWidth="2.4" strokeLinecap="square" />
      <circle cx="48" cy="111.5" r="2.6" fill="var(--ct-signal)" />
    </svg>
  );
}

function Option({
  audience,
  last,
  onChoose,
}: {
  audience: Audience;
  last: boolean;
  onChoose: (a: Audience) => void;
}) {
  const copy = audience === "candidate" ? ENTRY.candidate : ENTRY.employer;
  const accent = audience === "candidate" ? "var(--ct-violet)" : "var(--ct-green)";
  const ink = audience === "candidate" ? "ct-violet" : "ct-green";
  return (
    <Link
      href={AUDIENCE_HOME[audience]}
      onClick={() => onChoose(audience)}
      className="ct-option ct-panel group flex h-full flex-col p-6 outline-offset-4 sm:p-8"
      style={{ ["--ct-accent" as string]: accent }}
    >
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className={cx("ct-meta", ink)}>{copy.label}</span>
        {last && <span className="ct-tag text-[0.7rem]">{ENTRY.lastTime}</span>}
      </span>
      <span className="mt-5 block h-32 w-full sm:h-auto sm:aspect-[360/220]">{audience === "candidate" ? <CandidateDrawing /> : <EmployerDrawing />}</span>
      <span className="ct-display ct-l mt-6 block">{copy.title}</span>
      <span className="ct-body mt-3 block max-w-md">{copy.body}</span>
      <span className="mt-auto pt-6 sm:pt-8">
        <span className="ct-btn ct-btn-primary pointer-events-none">
          {copy.cta} <span className="ct-btn-arrow" aria-hidden="true">→</span>
        </span>
      </span>
    </Link>
  );
}

export function EntryChoice() {
  const { audience, choose } = useAudience();
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setDrawn(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      data-drawn={drawn ? "true" : "false"}
      className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_6rem_minmax(0,1fr)] lg:gap-0"
      style={{ containerType: "inline-size" }}
    >
      <Option audience="candidate" last={audience === "candidate"} onChoose={choose} />
      <div className="hidden lg:block" aria-hidden="true">
        <div className="aspect-[96/220] w-full" style={{ marginTop: "calc(2rem + 1.15rem + 1.25rem + ((100cqw - 6rem) / 2 - 4rem) * 0.30556 - 110px)" }}>
          <Origin />
        </div>
      </div>
      <Option audience="employer" last={audience === "employer"} onChoose={choose} />
    </div>
  );
}
