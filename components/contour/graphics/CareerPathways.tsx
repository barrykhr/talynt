"use client";

import { useCalm } from "@/lib/contour/motion";
import Link from "next/link";
import {motion} from "framer-motion";
import { useMemo, useState } from "react";
import { ROLES, formatCompensation } from "@/lib/candidate/roles";
import { DIRECTIONS, EXPERIENCE_BANDS, labelFor } from "@/lib/candidate/taxonomy";
import { usePassport } from "@/lib/candidate/passport";
import { CAREER_ARC } from "@/lib/contour/content";
import { flow, pct, ring } from "@/lib/contour/geometry";
import { ROUTES } from "@/lib/contour/site";
import { cx } from "@/lib/utils";

/**
 * GRAPHIC C — career pathways.
 *
 * Past converges into the present; the present opens into several futures.
 * There is no ladder here: every branch is a legitimate direction, including
 * "I'm still working it out".
 *
 * It is not decoration. Choosing a branch lists the open roles that were
 * written to serve that direction — real roles, from the same data as the
 * roles page — and can save the direction to the Career Passport on this
 * device. Nothing is sent anywhere.
 */

const W = 960;
const H = 440;
const PRESENT = { x: 360, y: 220 };
const PAST = [
  { x: 92, y: 120 },
  { x: 70, y: 220 },
  { x: 92, y: 320 },
];
const END_X = 700;
const ENDS = DIRECTIONS.map((d, i) => ({
  ...d,
  y: 46 + i * ((H - 92) / (DIRECTIONS.length - 1)),
}));
const PRESENT_RINGS = [14, 26, 40].map((r, i) => ring(PRESENT.x, PRESENT.y, r, 21 + i * 0.02, 0.1));
const EASE = [0.16, 1, 0.3, 1] as const;

export function CareerPathways() {
  const reduced = useCalm();
  const { passport, update, loaded } = usePassport();
  const [picked, setPicked] = useState<string | null>(null);

  // Until someone chooses, start from what their Passport already says.
  const selected = picked ?? (loaded ? (passport.directionIds[0] ?? null) : null);
  const direction = DIRECTIONS.find((d) => d.id === selected) ?? null;

  const roles = useMemo(
    () => (selected && selected !== "unsure" ? ROLES.filter((r) => r.directionIds.includes(selected)) : []),
    [selected],
  );

  const inPassport = Boolean(selected && loaded && passport.directionIds.includes(selected));

  const draw = (delay: number, duration = 1) =>
    reduced ? { duration: 0 } : { duration, delay, ease: EASE };

  return (
    <div className="ct-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-7">
        <span className="ct-meta ct-mute">{CAREER_ARC.label}</span>
        <span className="ct-meta ct-violet">Choose where this is going</span>
      </div>

      {/* Desktop and tablet: the drawing. */}
      <div className="relative hidden md:block" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="ct-graphic absolute inset-0 h-full w-full" aria-hidden="true">
          {/* Past converging. */}
          <g fill="none" stroke="var(--ct-ink)" strokeWidth="1">
            {PAST.map((p, i) => (
              <motion.path
                key={i}
                d={flow(p.x + 6, p.y, PRESENT.x - 14, PRESENT.y, 0.6)}
                initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.35 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={draw(0.1 + i * 0.1)}
              />
            ))}
          </g>
          {PAST.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="5" fill="var(--ct-bg)" stroke="var(--ct-ink)" strokeWidth="1.2" />
          ))}

          {/* Futures opening out. */}
          <g fill="none">
            {ENDS.map((end, i) => {
              const on = selected === end.id;
              const dim = selected !== null && !on;
              return (
                <motion.path
                  key={end.id}
                  d={flow(PRESENT.x + 14, PRESENT.y, END_X, end.y, 0.5)}
                  stroke="var(--ct-violet)"
                  strokeWidth={on ? 2.2 : 1.1}
                  strokeDasharray={end.id === "unsure" ? "3 5" : undefined}
                  initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: dim ? 0.28 : 0.9 }}
                  animate={{ opacity: dim ? 0.28 : on ? 1 : 0.9 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={draw(0.5 + i * 0.07, 1.1)}
                />
              );
            })}
          </g>
          {ENDS.map((end) => (
            <circle
              key={end.id}
              cx={END_X}
              cy={end.y}
              r={selected === end.id ? 5.5 : 4}
              fill={selected === end.id ? "var(--ct-violet)" : "var(--ct-bg)"}
              stroke="var(--ct-violet)"
              strokeWidth="1.4"
            />
          ))}

          {/* The present: where the person actually stands. */}
          <g fill="none" stroke="var(--ct-ink)" strokeWidth="0.8">
            {PRESENT_RINGS.map((d, i) => (
              <path key={i} d={d} opacity={0.5 - i * 0.13} />
            ))}
          </g>
          <circle cx={PRESENT.x} cy={PRESENT.y} r="8" fill="var(--ct-signal)" />
        </svg>

        {/* Labels for past and present: the approved facets. */}
        {CAREER_ARC.stages[0].facets.map((facet, i) => (
          <span key={facet} aria-hidden="true" className="ct-pin" style={{ left: pct(PAST[i].x, W), top: pct(PAST[i].y + 22, H) }}>
            <span className="ct-meta ct-mute">{facet}</span>
          </span>
        ))}
        <span className="ct-pin" style={{ left: pct(PRESENT.x, W), top: pct(PRESENT.y + 62, H) }} aria-hidden="true">
          <span className="ct-tag">You, now</span>
        </span>
        <span className="ct-pin" style={{ left: pct(70, W), top: pct(40, H) }} aria-hidden="true">
          <span className="ct-meta ct-ink2">Past</span>
        </span>
        <span className="ct-pin" style={{ left: pct(PRESENT.x, W), top: pct(40, H) }} aria-hidden="true">
          <span className="ct-meta text-[var(--ct-ink)]">Present</span>
        </span>

        {/* The futures are the controls. */}
        <div role="group" aria-label="Where is this going?">
          {ENDS.map((end) => (
            <DirectionButton
              key={end.id}
              id={end.id}
              label={end.label}
              selected={selected === end.id}
              onSelect={setPicked}
              className="absolute -translate-y-1/2"
              style={{ left: pct(END_X + 14, W), top: pct(end.y, H) }}
            />
          ))}
        </div>
      </div>

      {/* Phones: the same choice as a list, with the path implied by the rule. */}
      <div className="px-5 pt-5 md:hidden">
        <ol className="relative flex flex-col gap-1 border-l-2 pl-5 ct-b-violet">
          <li className="ct-meta ct-ink2 pb-1">Past — {CAREER_ARC.stages[0].facets.join(" · ")}</li>
          <li className="ct-meta flex items-center gap-2 pb-3">
            <span aria-hidden="true" className="-ml-[1.72rem] h-3 w-3 rounded-full bg-[var(--ct-signal)]" />
            You, now
          </li>
        </ol>
        <div role="group" aria-label="Where is this going?" className="flex flex-col gap-2 pt-3 pb-1">
          {ENDS.map((end) => (
            <DirectionButton key={end.id} id={end.id} label={end.label} selected={selected === end.id} onSelect={setPicked} wide />
          ))}
        </div>
      </div>

      {/* What the choice means: real roles, and a way to keep the answer. */}
      <div className="border-t px-5 py-6 sm:px-7" aria-live="polite">
        {direction ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] lg:gap-10">
            <div>
              <p className="ct-display ct-s">{direction.label}</p>
              {direction.note && <p className="ct-small mt-2">{direction.note}</p>}
              <button
                type="button"
                onClick={() =>
                  update({
                    directionIds: inPassport
                      ? passport.directionIds.filter((d) => d !== direction.id)
                      : [...passport.directionIds, direction.id],
                  })
                }
                aria-pressed={inPassport}
                className={cx("ct-btn mt-5 min-h-10 px-4 text-[0.9rem]", inPassport ? "ct-btn-secondary" : "ct-btn-primary")}
              >
                {inPassport ? "Saved to your Passport ✓" : "Save to my Career Passport"}
              </button>
              <p className="ct-small mt-3">Stored on this device only. Nothing is sent anywhere.</p>
            </div>
            <div>
              {direction.id === "unsure" ? (
                <p className="ct-body">
                  A legitimate answer. Every role on this site says where it could lead — read a few and see whether
                  any of it pulls at you.{" "}
                  <Link href={ROUTES.opportunities} className="ct-link">
                    Read the open roles
                  </Link>
                  .
                </p>
              ) : roles.length > 0 ? (
                <>
                  <p className="ct-meta ct-mute">
                    {roles.length} open {roles.length === 1 ? "role was" : "roles were"} written to offer this
                  </p>
                  <ul className="mt-3 flex flex-col">
                    {roles.map((role) => (
                      <li key={role.slug} className="border-t first:border-t-0">
                        <Link
                          href={ROUTES.role(role.slug)}
                          className="group flex items-baseline justify-between gap-4 py-3"
                        >
                          <span>
                            <span className="text-[0.98rem] group-hover:text-[var(--ct-green)]">{role.title}</span>
                            <span className="ct-small block">
                              {labelFor(EXPERIENCE_BANDS, role.bandId)} · {role.company}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[0.8rem] text-[var(--ct-ink-2)] tabular-nums">
                            {formatCompensation(role.compensation)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="ct-body">
                  No open role is written around this direction right now. Roles are added as clients bring them.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="ct-body">
            {CAREER_ARC.close} Choose a direction to see the open roles written to offer it.
          </p>
        )}
      </div>
    </div>
  );
}

function DirectionButton({
  id,
  label,
  selected,
  onSelect,
  className,
  style,
  wide = false,
}: {
  id: string;
  label: string;
  selected: boolean;
  onSelect: (id: string | null) => void;
  className?: string;
  style?: React.CSSProperties;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(selected ? null : id)}
      className={cx(
        "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-left text-[0.86rem] transition-colors duration-200",
        selected
          ? "ct-b-violet bg-[var(--ct-violet-wash)] text-[var(--ct-violet-ink)]"
          : "ct-b2 ct-hb-ink bg-[var(--ct-surface)] text-[var(--ct-ink-2)]",
        wide && "min-h-11 w-full justify-between rounded-[var(--ct-r-m)] px-4",
        className,
      )}
      style={style}
    >
      {label}
      {wide && (
        <span aria-hidden="true" className="ct-meta">
          {selected ? "●" : "○"}
        </span>
      )}
    </button>
  );
}
