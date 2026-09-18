"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PipelineStage, DashboardMetric } from "@/components/cards/PipelineStage";
import { transition } from "@/lib/motion";
import { cx } from "@/lib/utils";

type Role = {
  id: string;
  title: string;
  status: "Active" | "Offer stage";
  opened: string;
  pipeline: Array<{ stage: string; count: number }>;
  next: string;
  lastUpdate: string;
};

/** Illustrative client view. Numbers are examples, not company metrics. */
const ROLES: Role[] = [
  {
    id: "spm",
    title: "Senior Product Manager",
    status: "Active",
    opened: "18 days ago",
    pipeline: [
      { stage: "Sourced", count: 142 },
      { stage: "Screened", count: 38 },
      { stage: "Shortlisted", count: 9 },
      { stage: "Interview", count: 5 },
      { stage: "Offer", count: 1 },
    ],
    next: "Two final-stage conversations are scheduled this week. We will send a recommendation with both.",
    lastUpdate: "Updated 2 hours ago",
  },
  {
    id: "gtm",
    title: "GTM Engineer",
    status: "Active",
    opened: "9 days ago",
    pipeline: [
      { stage: "Sourced", count: 96 },
      { stage: "Screened", count: 27 },
      { stage: "Shortlisted", count: 7 },
      { stage: "Interview", count: 3 },
      { stage: "Offer", count: 0 },
    ],
    next: "A shortlist of three reaches you on Thursday. Two are not actively looking.",
    lastUpdate: "Updated yesterday",
  },
  {
    id: "fsd",
    title: "Full Stack Developer",
    status: "Offer stage",
    opened: "31 days ago",
    pipeline: [
      { stage: "Sourced", count: 184 },
      { stage: "Screened", count: 47 },
      { stage: "Shortlisted", count: 11 },
      { stage: "Interview", count: 6 },
      { stage: "Offer", count: 2 },
    ],
    next: "Offer extended to Candidate 0148. Decision expected Friday. Candidate 0203 is held warm as cover.",
    lastUpdate: "Updated 40 minutes ago",
  },
];

export function ClientDashboard() {
  const [activeId, setActiveId] = useState(ROLES[2].id);
  const role = ROLES.find((r) => r.id === activeId) ?? ROLES[0];
  const max = Math.max(...role.pipeline.map((p) => p.count));

  return (
    <div className="overflow-hidden rounded-xl border border-paper-100/12 bg-ink-850">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-paper-100/10 px-5 py-4 sm:px-7">
        <div className="flex items-baseline gap-4">
          <span className="mono-micro opacity-55">Client view</span>
          <span className="mono-micro opacity-25">Northwind Systems</span>
        </div>
        <span className="mono-micro flex items-center gap-2 text-signal">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" />
          {role.lastUpdate}
        </span>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
        <div className="border-b border-paper-100/10 p-5 sm:p-7 lg:border-r lg:border-b-0">
          <div className="mb-5 flex items-baseline justify-between">
            <span className="mono-micro opacity-40">Open roles</span>
            <span className="font-mono text-[1.6rem] leading-none tabular-nums opacity-85">
              07
            </span>
          </div>

          <ul className="flex flex-col gap-2">
            {ROLES.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(r.id)}
                  aria-pressed={r.id === activeId}
                  className={cx(
                    "w-full rounded-md border px-4 py-3.5 text-left transition-colors duration-300",
                    r.id === activeId
                      ? "border-signal/45 bg-signal/[0.07]"
                      : "border-paper-100/10 hover:border-paper-100/25",
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-[0.92rem] leading-snug">{r.title}</span>
                    <span
                      className={cx(
                        "mono-micro shrink-0",
                        r.status === "Offer stage" ? "text-signal" : "opacity-45",
                      )}
                    >
                      {r.status}
                    </span>
                  </span>
                  <span className="mono-micro mt-2 block opacity-30">
                    Opened {r.opened}
                  </span>
                </button>
              </li>
            ))}
            <li className="mono-micro px-4 py-3 opacity-25">
              + 4 more roles
            </li>
          </ul>
        </div>

        <div className="p-5 sm:p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={transition.fast}
            >
              <h3 className="display text-(length:--text-h3)">{role.title}</h3>

              <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-5 sm:gap-4">
                {role.pipeline.map((stage, i) => (
                  <PipelineStage
                    key={stage.stage}
                    stage={stage.stage}
                    count={stage.count}
                    max={max}
                    index={i}
                    emphasis={i === role.pipeline.length - 1}
                  />
                ))}
              </div>

              <div className="mt-9 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
                <div className="rounded-md border border-signal/25 bg-signal/[0.06] p-5">
                  <p className="mono-micro text-signal">What happens next</p>
                  <p className="mt-3 text-[0.92rem] leading-[1.6] opacity-80">
                    {role.next}
                  </p>
                </div>
                <DashboardMetric
                  label="Days open"
                  value={role.opened.replace(/\D/g, "")}
                  hint="Measured from the day we agreed the hiring context — not the day the role was posted."
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
