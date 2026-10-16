"use client";

import { useCalm } from "@/lib/contour/motion";
import {motion} from "framer-motion";
import { useState } from "react";
import { CAPABILITIES, CONTEXT, GLOBAL, QUALITY } from "@/lib/contour/content";
import { ring } from "@/lib/contour/geometry";
import { cx } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* --------------------------------------------------------------------------
   Context: a job description becomes a hiring context.
   Each layer adds one contour around the person, so by the sixth the person
   is surrounded — which is the point of the section.
   -------------------------------------------------------------------------- */

const LAYER_RINGS = [6, 10, 14, 18, 22, 26].map((r, i) => ring(30, 30, r, 51 + i * 0.02, 0.1));

function LayerGlyph({ depth }: { depth: number }) {
  return (
    <svg viewBox="0 0 60 60" className="ct-graphic h-12 w-12 shrink-0" aria-hidden="true">
      {LAYER_RINGS.slice(0, depth).map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={i === depth - 1 ? "var(--ct-green)" : "var(--ct-ink)"}
          strokeWidth={i === depth - 1 ? 1.3 : 0.8}
          opacity={i === depth - 1 ? 1 : 0.35}
        />
      ))}
      <circle cx="30" cy="30" r="3" fill="var(--ct-signal)" />
    </svg>
  );
}

export function ContextLayers() {
  const reduced = useCalm();
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
      {/* The input: flat, literal, quietly insufficient. */}
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-[calc(var(--ct-nav-h)+2rem)]">
          <div className="ct-panel p-6">
            <p className="ct-meta ct-mute">{CONTEXT.inputLabel}</p>
            <ul className="mt-5 flex flex-col gap-2.5">
              {CONTEXT.jd.map((line, i) => (
                <li
                  key={line}
                  className="font-mono text-[0.82rem] leading-relaxed"
                  style={{ color: i === 0 ? "var(--ct-ink)" : "var(--ct-mute)" }}
                >
                  {line}
                </li>
              ))}
            </ul>
            <p className="ct-small mt-6 border-t pt-4">{CONTEXT.jdNote}</p>
          </div>
          <p className="ct-meta ct-green mt-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px w-10 bg-[var(--ct-green)]" />
            {CONTEXT.becomes}
          </p>
        </div>
      </div>

      <ol className="grid gap-px overflow-hidden rounded-[var(--ct-r-l)] border bg-[var(--ct-line)] sm:grid-cols-2 lg:col-span-8">
        {CONTEXT.layers.map((layer, i) => (
          <motion.li
            key={layer.label}
            className="flex flex-col gap-4 bg-[var(--ct-surface)] p-6"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={reduced ? { duration: 0 } : { duration: 0.7, delay: i * 0.06, ease: EASE }}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="ct-meta ct-green">
                {String(i + 1).padStart(2, "0")} · {layer.label}
              </p>
              <LayerGlyph depth={i + 1} />
            </div>
            <p className="ct-display text-[1.25rem] leading-snug">{layer.question}</p>
            <p className="ct-small">{layer.detail}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Quality: the same counts, different verbs. The verb is the work.
   -------------------------------------------------------------------------- */

export function QualityCompare() {
  const reduced = useCalm();
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <figure className="ct-panel flex flex-col justify-center p-7 sm:p-9 lg:col-span-4" style={{ backgroundColor: "var(--ct-bg-2)" }}>
        <p className="ct-meta ct-mute">{QUALITY.costLabel}</p>
        <p className="ct-display ct-m mt-5">{QUALITY.costTitle}</p>
        <p className="ct-body mt-4">{QUALITY.costBody}</p>
      </figure>

      {(["usual", "talynt"] as const).map((column, ci) => {
        const isTalynt = column === "talynt";
        return (
          <div
            key={column}
            className="ct-panel flex flex-col p-7 sm:p-9 lg:col-span-4"
            style={isTalynt ? { ["--ct-bc" as string]: "var(--ct-green)", backgroundColor: "var(--ct-green-wash)" } : undefined}
          >
            <p className={cx("ct-meta", isTalynt ? "ct-green" : "ct-mute")}>
              {isTalynt ? QUALITY.talynt : QUALITY.usual}
            </p>
            <ol className="mt-6 flex flex-col">
              {QUALITY.rows.map((row, i) => {
                const last = i === QUALITY.rows.length - 1;
                return (
                  <motion.li
                    key={row.talynt}
                    className="flex items-baseline gap-4 border-t py-3"
                    style={isTalynt ? { ["--ct-bc" as string]: "color-mix(in oklab, var(--ct-green) 30%, transparent)" } : undefined}
                    initial={reduced ? false : { opacity: 0, x: isTalynt ? 10 : -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={reduced ? { duration: 0 } : { duration: 0.6, delay: ci * 0.1 + i * 0.08, ease: EASE }}
                  >
                    <span
                      className={cx(
                        "min-w-[3ch] font-mono text-[clamp(1.4rem,2.6vw,2rem)] leading-none tabular-nums",
                        last && isTalynt ? "ct-green" : !isTalynt ? "ct-mute" : "",
                      )}
                    >
                      {isTalynt ? row.count : row.usualCount}
                    </span>
                    <span className={cx("ct-display text-[1.35rem]", !isTalynt && "ct-mute")}>
                      {isTalynt ? row.talynt : row.usual}
                    </span>
                  </motion.li>
                );
              })}
            </ol>
            <p className={cx("mt-auto border-t pt-5 text-[0.92rem] leading-[1.6]", isTalynt ? "" : "ct-mute")}>
              {isTalynt ? QUALITY.talyntNote : QUALITY.usualNote}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Capabilities: an accessible disclosure list, hairlines not cards.
   -------------------------------------------------------------------------- */

export function CapabilityList() {
  const [open, setOpen] = useState<string | null>(CAPABILITIES.areas[0].id);
  return (
    <div className="border-b">
      {CAPABILITIES.areas.map((area, i) => {
        const isOpen = open === area.id;
        return (
          <div key={area.id} className="border-t">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`cap-${area.id}`}
                onClick={() => setOpen(isOpen ? null : area.id)}
                className="group flex w-full items-baseline justify-between gap-6 py-6 text-left"
              >
                <span className="flex items-baseline gap-5">
                  <span className="ct-meta ct-green tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className={cx("ct-display ct-m transition-colors", !isOpen && "ct-mute group-hover:text-[var(--ct-ink)]")}>
                    {area.title}
                  </span>
                </span>
                <span aria-hidden="true" className={cx("text-2xl font-light transition-transform duration-300", isOpen && "rotate-45 ct-green")}>
                  +
                </span>
              </button>
            </h3>
            <div className="ct-collapse" data-open={isOpen ? "true" : "false"}>
              <div>
                <div id={`cap-${area.id}`} inert={!isOpen} className="grid gap-6 pb-8 md:grid-cols-2 md:pl-12">
                  <ul className="flex flex-wrap gap-2">
                    {area.items.map((item) => (
                      <li key={item} className="ct-tag text-[0.78rem]">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="ct-body max-w-md">{area.note}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Global: markets as a typeset list, with the approved coverage caveat.
   -------------------------------------------------------------------------- */

export function Markets() {
  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {GLOBAL.markets.map((m) => (
          <li key={m} className="ct-tag px-3 py-1.5 text-[0.8rem]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--ct-green)]" />
            {m}
          </li>
        ))}
      </ul>
      <p className="ct-small mt-5 max-w-md">{GLOBAL.note}</p>
    </div>
  );
}
