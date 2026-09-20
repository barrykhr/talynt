"use client";

import { motion } from "framer-motion";
import { VIEWPORT_EARLY } from "@/lib/motion";
import { cx } from "@/lib/utils";

export function PipelineStage({
  stage,
  count,
  max,
  index,
  emphasis = false,
}: {
  stage: string;
  count: number;
  max: number;
  index: number;
  emphasis?: boolean;
}) {
  const ratio = max > 0 ? Math.max(count / max, 0.02) : 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="mono-micro text-fg-40">{stage}</span>
      </div>
      <span
        className={cx(
          "font-mono text-[clamp(1.5rem,2.4vw,2.1rem)] leading-none tabular-nums",
          emphasis ? "text-signal" : "opacity-85",
        )}
      >
        {String(count).padStart(2, "0")}
      </span>
      <span className="h-[3px] w-full overflow-hidden rounded-full bg-current/12">
        <motion.span
          className={cx(
            "block h-full origin-left rounded-full",
            emphasis ? "bg-signal" : "bg-current/45",
          )}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: ratio }}
          viewport={VIEWPORT_EARLY}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
        />
      </span>
    </div>
  );
}

export function DashboardMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-current/12 p-5">
      <p className="mono-micro text-fg-40">{label}</p>
      <p className="mt-3 font-mono text-[clamp(1.7rem,3vw,2.4rem)] leading-none tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-3 text-[0.82rem] leading-snug text-fg-50">{hint}</p>}
    </div>
  );
}
