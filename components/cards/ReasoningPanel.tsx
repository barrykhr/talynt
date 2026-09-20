import type { Candidate } from "@/lib/candidates";

/**
 * The output of the whole system: why this person, in sentences a hiring
 * manager can argue with. Reasoning is the deliverable — not a score.
 */
export function ReasoningPanel({ candidate }: { candidate: Candidate }) {
  return (
    <section
      aria-label={`Why we are recommending ${candidate.ref}`}
      className="rounded-md border border-signal/25 bg-signal/[0.06] p-5 sm:p-6"
    >
      <h4 className="mono-micro text-signal">
        Why we&rsquo;re recommending this person
      </h4>
      <ul className="mt-5 flex flex-col gap-4">
        {candidate.reasoning.map((line, i) => (
          <li key={i} className="flex gap-3.5">
            <span
              aria-hidden="true"
              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal"
            />
            <span className="text-[0.9rem] leading-[1.6] text-fg-85">{line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-signal/20 pt-5">
        <p className="mono-micro mb-2.5 text-fg-50">What to watch</p>
        <p className="text-[0.88rem] leading-[1.6] text-fg-70">
          {candidate.watchFor}
        </p>
      </div>
    </section>
  );
}
