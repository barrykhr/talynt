"use client";

import type { Candidate } from "@/lib/candidates";
import { cx } from "@/lib/utils";

const STATUS_TONE: Record<Candidate["status"], string> = {
  Recommended: "text-signal border-signal/40 bg-signal/10",
  "In evaluation": "opacity-60 border-current/20",
  "In conversation": "opacity-60 border-current/20",
};

export function CandidateCard({
  candidate,
  selected,
  onSelect,
}: {
  candidate: Candidate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cx(
        "w-full rounded-md border px-4 py-4 text-left transition-colors duration-300",
        selected
          ? "border-signal/50 bg-signal/[0.07]"
          : "border-current/12 hover:border-current/30 hover:bg-paper-100/[0.03]",
      )}
    >
      <span className="block font-mono text-[0.8rem] tracking-wide tabular-nums">
        {candidate.ref}
      </span>
      <span className="mt-2.5 block text-[0.9rem] leading-snug opacity-75">
        {candidate.headline}
      </span>
      <span className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="mono-micro opacity-35">
          {candidate.location} · {candidate.tenure}
        </span>
        <span
          className={cx(
            "mono-micro shrink-0 rounded-full border px-2 py-0.5 leading-none",
            STATUS_TONE[candidate.status],
          )}
        >
          {candidate.status}
        </span>
      </span>
    </button>
  );
}
