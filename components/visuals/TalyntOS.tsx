"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CANDIDATES, ROLE_CONTEXT } from "@/lib/candidates";
import { CandidateCard } from "@/components/cards/CandidateCard";
import { ReasoningPanel } from "@/components/cards/ReasoningPanel";
import { SignalBadge, SignalRow } from "@/components/primitives/SignalBadge";
import { transition } from "@/lib/motion";
import { cx } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", icon: "▦" },
  { label: "Jobs", icon: "▤" },
  { label: "Candidates", icon: "◍" },
  { label: "Sourcing", icon: "◎" },
  { label: "Conversations", icon: "◔" },
  { label: "Analytics", icon: "◫" },
];

/**
 * TALYNT OS — the internal operating system, shown as it is used: a real
 * shortlist for a real-shaped role, with the reasoning attached to each person.
 * Interactive, because a static screenshot would be marketing.
 */
export function TalyntOS() {
  const [activeId, setActiveId] = useState(CANDIDATES[0].id);
  const candidate = CANDIDATES.find((c) => c.id === activeId) ?? CANDIDATES[0];

  return (
    <div className="overflow-hidden rounded-xl border border-paper-100/12 bg-ink-850 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
      {/* Application chrome */}
      <div className="flex items-center justify-between gap-4 border-b border-paper-100/10 bg-ink-800/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-paper-100/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-paper-100/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-signal/70" />
          </span>
          <span className="mono-micro ml-2 opacity-60">
            Talynt<span className="text-signal"> OS</span>
          </span>
        </div>
        <div className="hidden flex-1 justify-center sm:flex">
          <span className="mono-micro w-full max-w-xs rounded-full border border-paper-100/10 px-4 py-1.5 text-center opacity-30">
            Search talent, roles, conversations
          </span>
        </div>
        <span className="mono-micro opacity-35">Recruiter workspace</span>
      </div>

      <div className="grid lg:grid-cols-[13rem_minmax(0,17rem)_minmax(0,1fr)]">
        {/* Sidebar */}
        <nav
          aria-label="TALYNT OS navigation"
          className="hidden flex-col gap-0.5 border-r border-paper-100/10 p-3 lg:flex"
        >
          {NAV.map((item, i) => (
            <span
              key={item.label}
              className={cx(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.85rem]",
                i === 1
                  ? "bg-paper-100/[0.06] text-paper-100"
                  : "text-paper-100/40",
              )}
            >
              <span aria-hidden="true" className="text-[0.75rem] opacity-70">
                {item.icon}
              </span>
              {item.label}
            </span>
          ))}
          <div className="mt-auto rounded-md border border-paper-100/10 p-3">
            <p className="mono-micro opacity-35">Active searches</p>
            <p className="mt-1.5 font-mono text-[1.4rem] leading-none tabular-nums">
              07
            </p>
          </div>
        </nav>

        {/* Shortlist column */}
        <div className="border-b border-paper-100/10 lg:border-r lg:border-b-0">
          <div className="border-b border-paper-100/10 px-4 py-4">
            <p className="mono-micro text-signal">{ROLE_CONTEXT.title}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {ROLE_CONTEXT.facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="mono-micro opacity-30">{fact.label}</dt>
                  <dd className="mt-0.5 text-[0.8rem] opacity-70">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <span className="mono-micro opacity-40">Shortlist</span>
            <span className="mono-micro tabular-nums opacity-40">
              {CANDIDATES.length}
            </span>
          </div>

          <ul className="flex snap-x gap-3 overflow-x-auto p-4 pt-2 lg:flex-col lg:overflow-visible">
            {CANDIDATES.map((c) => (
              <li
                key={c.id}
                className="w-[16rem] shrink-0 snap-start lg:w-auto lg:shrink"
              >
                <CandidateCard
                  candidate={c}
                  selected={c.id === activeId}
                  onSelect={() => setActiveId(c.id)}
                />
              </li>
            ))}
          </ul>
        </div>

        {/* Candidate intelligence */}
        <div className="p-5 sm:p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={transition.fast}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="display text-(length:--text-h3)">
                    {candidate.ref}
                  </h3>
                  <p className="mt-1.5 text-[0.9rem] opacity-55">
                    {candidate.headline}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <SignalBadge key={skill}>{skill}</SignalBadge>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div>
                  <p className="mono-micro mb-3 opacity-40">
                    Candidate intelligence
                  </p>
                  <div>
                    {candidate.signals.map((signal) => (
                      <SignalRow
                        key={signal.label}
                        label={signal.label}
                        strength={signal.strength}
                      />
                    ))}
                  </div>
                </div>

                <ReasoningPanel candidate={candidate} />
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-paper-100/10 pt-6 sm:grid-cols-4">
                {[
                  { label: "Last conversation", value: "3 days ago" },
                  { label: "Evaluated by", value: "Search lead" },
                  { label: "Shared with client", value: "Yes" },
                  { label: "Next step", value: "Client review" },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="mono-micro opacity-30">{item.label}</dt>
                    <dd className="mt-1.5 text-[0.82rem] opacity-70">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
