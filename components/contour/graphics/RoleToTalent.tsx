"use client";

import { useCalm } from "@/lib/contour/motion";
import {motion} from "framer-motion";
import { FIT, TWO_SIDED } from "@/lib/contour/content";
import { Illustrative } from "@/components/contour/ui";
import { cx } from "@/lib/utils";

/**
 * GRAPHIC D — role to talent.
 *
 * Two readings of the same idea. The connection draws what a role needs and
 * what a person wants as two separate columns, joined only where they meet.
 * The compatibility reading places the environment and the person on the same
 * axis, and highlights the distance between them — the distance is the finding.
 * Neither produces a number: a score would hide which dimension moved it.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const VIEW = { once: true, amount: 0.4 } as const;

function RoleGlyph({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-block h-2.5 w-2.5 shrink-0 rounded-[3px] bg-[var(--ct-green)]", className)}
    />
  );
}

function PersonGlyph({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx("inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--ct-signal)]", className)}
    />
  );
}

export function TwoSidedConnection({ className }: { className?: string }) {
  const reduced = useCalm();

  return (
    <figure className={cx("ct-panel p-5 sm:p-8", className)}>
      <div className="hidden grid-cols-[1fr_minmax(13rem,17rem)_1fr] items-center gap-6 pb-6 md:grid">
        <p className="ct-meta ct-mute flex items-center justify-end gap-2 text-right">
          {TWO_SIDED.company} <RoleGlyph />
        </p>
        <p className="ct-meta ct-green text-center">{TWO_SIDED.meets}</p>
        <p className="ct-meta ct-mute flex items-center gap-2">
          <PersonGlyph /> {TWO_SIDED.person}
        </p>
      </div>

      <ul className="flex flex-col">
        {TWO_SIDED.rows.map((row, i) => (
          <li
            key={row.dimension}
            className="grid gap-3 border-t py-5 md:grid-cols-[1fr_minmax(13rem,17rem)_1fr] md:items-center md:gap-6"
          >
            <p className="order-2 flex items-start gap-3 text-[0.98rem] leading-[1.5] text-[var(--ct-ink)] md:order-1 md:justify-end md:text-right">
              <RoleGlyph className="mt-1.5 md:hidden" />
              <span>
                <span className="sr-only">{TWO_SIDED.company}: </span>
                {row.client}
              </span>
            </p>

            {/* The connection: drawn outward from where the two sides meet. */}
            <div className="order-1 flex items-center gap-2 md:order-2">
              <RoleGlyph className="hidden md:inline-block" />
              <motion.span
                aria-hidden="true"
                className="hidden h-px flex-1 origin-right bg-[var(--ct-green)] md:block"
                initial={reduced ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={VIEW}
                transition={reduced ? { duration: 0 } : { duration: 0.8, delay: 0.1 + i * 0.08, ease: EASE }}
              />
              <span className="ct-tag ct-b-green shrink-0 text-[var(--ct-green-deep)]">{row.dimension}</span>
              <motion.span
                aria-hidden="true"
                className="hidden h-px flex-1 origin-left bg-[var(--ct-ink)] md:block"
                initial={reduced ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={VIEW}
                transition={reduced ? { duration: 0 } : { duration: 0.8, delay: 0.1 + i * 0.08, ease: EASE }}
              />
              <PersonGlyph className="hidden md:inline-block" />
            </div>

            <p className="order-3 flex items-start gap-3 text-[0.98rem] leading-[1.5] text-[var(--ct-ink)]">
              <PersonGlyph className="mt-1.5 md:hidden" />
              <span>
                <span className="sr-only">{TWO_SIDED.person}: </span>
                {row.candidate}
              </span>
            </p>
          </li>
        ))}
      </ul>

      <figcaption className="border-t pt-5">
        <Illustrative>{TWO_SIDED.note}</Illustrative>
      </figcaption>
    </figure>
  );
}

export function CompatibilityMap({ className }: { className?: string }) {
  const reduced = useCalm();

  return (
    <figure className={cx("ct-panel p-5 sm:p-8", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <span className="ct-meta ct-mute">{FIT.gridLabel}</span>
        <span className="flex flex-wrap items-center gap-5">
          <span className="ct-meta flex items-center gap-2 text-[var(--ct-ink-2)]">
            <RoleGlyph /> {FIT.environment}
          </span>
          <span className="ct-meta flex items-center gap-2 text-[var(--ct-ink-2)]">
            <PersonGlyph /> {FIT.candidate}
          </span>
        </span>
      </div>

      <ul className="flex flex-col">
        {FIT.dimensions.map((d, i) => {
          const lo = Math.min(d.environment, d.candidate);
          const gap = Math.abs(d.environment - d.candidate);
          const wide = gap > 20;
          const t = (delay: number) =>
            reduced ? { duration: 0 } : { duration: 1.1, delay: delay + i * 0.08, ease: EASE };
          return (
            <li key={d.label} className="border-t py-5">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <span className="text-[0.95rem] font-medium">{d.label}</span>
                <span className={cx("ct-meta", wide ? "ct-green" : "ct-mute")}>
                  {wide ? FIT.gapLabel : FIT.alignedLabel}
                </span>
              </div>

              <div className="relative h-8" aria-hidden="true">
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--ct-line-2)]" />
                {/* The distance between the two is the finding. */}
                <motion.span
                  className="absolute top-1/2 h-3 -translate-y-1/2 rounded-[2px]"
                  style={{
                    left: `${lo}%`,
                    width: `${Math.max(gap, 0.6)}%`,
                    backgroundColor: wide ? "var(--ct-lime)" : "var(--ct-lime-soft)",
                  }}
                  initial={reduced ? false : { opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={VIEW}
                  transition={t(0.45)}
                />
                <motion.span
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-[var(--ct-green)]"
                  initial={reduced ? false : { left: "50%", opacity: 0 }}
                  whileInView={{ left: `${d.environment}%`, opacity: 1 }}
                  viewport={VIEW}
                  transition={t(0.1)}
                />
                <motion.span
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ct-signal)]"
                  initial={reduced ? false : { left: "50%", opacity: 0 }}
                  whileInView={{ left: `${d.candidate}%`, opacity: 1 }}
                  viewport={VIEW}
                  transition={t(0.22)}
                />
              </div>

              <div className="flex items-baseline justify-between gap-6">
                <span className="ct-meta ct-mute">{d.poles[0]}</span>
                <span className="ct-meta ct-mute text-right">{d.poles[1]}</span>
              </div>

              <p className={cx("mt-3 max-w-2xl text-[0.92rem] leading-[1.6]", wide ? "text-[var(--ct-ink)]" : "ct-mute")}>
                {wide ? <span className="ct-mark">{d.note}</span> : d.note}
              </p>
              <p className="sr-only">
                {d.label}: the environment sits towards “{d.environment > 50 ? d.poles[1] : d.poles[0]}”, the
                candidate towards “{d.candidate > 50 ? d.poles[1] : d.poles[0]}”. {wide ? FIT.gapLabel : FIT.alignedLabel}.
              </p>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
