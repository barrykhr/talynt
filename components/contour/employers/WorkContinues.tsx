import { CONTINUES } from "@/lib/contour/proposed";
import { Illustrative } from "@/components/contour/ui";
import { Reveal } from "@/components/primitives/Reveal";

/**
 * "The work continues": the day the role is shared, the search, and the
 * morning the shortlist is there to read. A story about how a search is
 * organised — the qualifier that it is not a delivery time stays beside it.
 */

function Sun({ phase }: { phase: number }) {
  // A small arc: the sun high, setting, and rising again.
  const positions = [
    { cx: 40, cy: 14 },
    { cx: 70, cy: 34 },
    { cx: 10, cy: 34 },
  ];
  const p = positions[phase];
  return (
    <svg viewBox="0 0 80 40" className="h-8 w-16" aria-hidden="true">
      <path d="M4 36a36 30 0 0 1 72 0" fill="none" stroke="var(--ct-line-2)" strokeWidth="1" strokeDasharray="2 3" />
      <path d="M0 36.5h80" stroke="var(--ct-line-2)" strokeWidth="1" />
      <circle cx={p.cx} cy={p.cy} r="5" fill={phase === 1 ? "var(--ct-violet)" : "var(--ct-signal)"} />
    </svg>
  );
}

export function WorkContinues() {
  return (
    <div>
      <ol className="grid gap-px overflow-hidden rounded-[var(--ct-r-l)] border bg-[var(--ct-line)] lg:grid-cols-3">
        {CONTINUES.panels.map((panel, i) => (
          <Reveal as="li" key={panel.when} delay={i * 0.08} className="flex flex-col bg-[var(--ct-surface)] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="ct-meta ct-green">{panel.when}</p>
              <Sun phase={i} />
            </div>
            <h3 className="ct-display ct-m mt-5">{panel.title}</h3>
            <p className="ct-small mt-3">{panel.body}</p>
            {i === 1 ? (
              <ol className="mt-4 flex flex-col">
                {panel.points.map((point, k) => (
                  <li key={point} className="grid grid-cols-[1.25rem_1fr] items-center gap-3 border-t py-2.5 text-[0.95rem] first:border-t-0">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full border"
                      style={{ backgroundColor: k < 4 ? "var(--ct-green)" : "transparent", ["--ct-bc" as string]: "var(--ct-green)" }}
                    />
                    {point}
                  </li>
                ))}
              </ol>
            ) : i === 2 ? (
              <ul className="mt-4 flex flex-col gap-2">
                {panel.points.map((point, k) => (
                  <li key={point} className="flex items-center gap-3 rounded-[var(--ct-r-s)] border px-3 py-2.5 text-[0.93rem]">
                    <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: k === 0 ? "var(--ct-signal)" : k === 3 ? "var(--ct-violet)" : "var(--ct-green)" }} />
                    {point}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {panel.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-[0.95rem] leading-snug">
                    <span aria-hidden="true" className="mt-[0.45rem] h-1.5 w-3 shrink-0 rounded-full bg-[var(--ct-green)]" />
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        ))}
      </ol>
      <Illustrative className="mt-5 max-w-3xl">{CONTINUES.qualifier}</Illustrative>
    </div>
  );
}
