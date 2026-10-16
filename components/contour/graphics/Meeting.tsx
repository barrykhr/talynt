import { frame, ring } from "@/lib/contour/geometry";
import { cx } from "@/lib/utils";

/**
 * GRAPHIC E — the meeting.
 *
 * Two bodies of context. On the left, a role and the company around it, drawn
 * in the logo's rounded-square frame. On the right, a person and the context
 * around them, drawn as contour. Where they overlap is the only part that
 * matters to a hire — and it is the part neither side can see alone.
 *
 * `offset` pulls the two apart (in viewBox units) so a parent can animate the
 * meeting; at 0 they overlap as drawn.
 */

export const ROLE_RINGS = [16, 28, 40, 52, 64].map((h) => frame(118, 80, h, 4.2));
export const PERSON_RINGS = [12, 24, 36, 48, 60, 70].map((r, i) => ring(206, 80, r, 4 + i * 0.02, 0.07));

export function Meeting({
  className,
  offset = 0,
  decorative = false,
  label = "Two bodies of context — a role and a person — overlapping. The overlap is highlighted.",
  idPrefix = "meet",
}: {
  className?: string;
  offset?: number;
  decorative?: boolean;
  label?: string;
  idPrefix?: string;
}) {
  const clipId = `${idPrefix}-clip`;
  return (
    <svg
      viewBox="0 0 320 160"
      className={cx("ct-graphic overflow-visible", className)}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={PERSON_RINGS[PERSON_RINGS.length - 1]} transform={`translate(${offset} 0)`} />
        </clipPath>
      </defs>

      {/* The overlap, highlighted: where the role's context meets the person's. */}
      <g clipPath={`url(#${clipId})`}>
        <path d={ROLE_RINGS[ROLE_RINGS.length - 1]} transform={`translate(${-offset} 0)`} fill="var(--ct-lime)" />
      </g>

      <g transform={`translate(${-offset} 0)`} fill="none" stroke="var(--ct-green)" strokeWidth="0.9">
        {ROLE_RINGS.map((d, i) => (
          <path key={i} d={d} opacity={0.85 - i * 0.13} />
        ))}
        <rect x="111" y="73" width="14" height="14" rx="3.5" fill="var(--ct-ink)" stroke="none" />
      </g>

      <g transform={`translate(${offset} 0)`} fill="none" stroke="var(--ct-ink)" strokeWidth="0.8">
        {PERSON_RINGS.map((d, i) => (
          <path key={i} d={d} opacity={0.7 - i * 0.1} />
        ))}
        <circle cx="206" cy="80" r="6" fill="var(--ct-signal)" stroke="none" />
      </g>

      <line
        x1={125 - offset}
        y1="80"
        x2={200 + offset}
        y2="80"
        stroke="var(--ct-ink)"
        strokeWidth="0.8"
        strokeDasharray="2 3"
      />
    </svg>
  );
}
