"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { changeStage } from "@/lib/actions/opportunities";
import { OPPORTUNITY_STAGES, PIPELINE_FLOW, type OpportunityStage } from "@/lib/constants";
import { StageMover } from "@/components/stage-mover";
import { Badge, buttonClass, cx } from "@/components/ui";

export interface BoardCard {
  id: string; title: string; company: string; stage: OpportunityStage; ownerInitials: string; ownerName: string;
  value: string | null; followUp: string | null; followUpTone: "danger" | "warn" | "neutral" | "none"; stageAgeDays: number;
  priority: "low" | "normal" | "high"; noNextAction: boolean;
}

const NEEDS_REASON: OpportunityStage[] = ["lost", "nurture"];

/** Drag a card to another column, or use "Move…" (keyboard-friendly). The server validates every move. */
export function PipelineBoard({ cards }: { cards: BoardCard[] }) {
  const [items, setItems] = useState(cards);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<OpportunityStage | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [, startTransition] = useTransition();
  const columns: OpportunityStage[] = [...PIPELINE_FLOW, "nurture", "lost"];

  function drop(stage: OpportunityStage) {
    const card = items.find((c) => c.id === dragId);
    setDragId(null);
    setOver(null);
    if (!card || card.stage === stage) return;
    if (NEEDS_REASON.includes(stage)) {
      setMessage({ tone: "error", text: `Moving to ${OPPORTUNITY_STAGES.label[stage]} needs a reason — use “Move…” on the card.` });
      return;
    }
    const previous = card.stage;
    setItems((all) => all.map((c) => (c.id === card.id ? { ...c, stage, stageAgeDays: 0 } : c)));
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", card.id);
      fd.set("stage", stage);
      const res = await changeStage({}, fd);
      if (res.error) {
        setItems((all) => all.map((c) => (c.id === card.id ? { ...c, stage: previous } : c)));
        setMessage({ tone: "error", text: res.error });
      } else {
        setMessage({ tone: "ok", text: `Moved “${card.title}” to ${OPPORTUNITY_STAGES.label[stage]}.` });
      }
    });
  }

  return (
    <>
      <div aria-live="polite" className="min-h-6">
        {message ? <p className={cx("mb-2 text-sm", message.tone === "error" ? "text-danger" : "text-ok")}>{message.text}</p> : null}
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        <div className="flex min-w-max gap-3">
          {columns.map((stage) => {
            const col = items.filter((c) => c.stage === stage);
            return (
              <section key={stage} aria-label={`${OPPORTUNITY_STAGES.label[stage]} — ${col.length}`}
                onDragOver={(e) => { e.preventDefault(); setOver(stage); }} onDragLeave={() => setOver(null)} onDrop={() => drop(stage)}
                className={cx("flex w-[264px] shrink-0 flex-col rounded-lg border bg-sunken/50", over === stage ? "border-accent" : "border-line")}>
                <header className="flex items-center justify-between border-b border-line px-3 py-2">
                  <h2 className="text-[13px] font-semibold">{OPPORTUNITY_STAGES.label[stage]}</h2>
                  <Badge>{col.length}</Badge>
                </header>
                <ul className="flex flex-1 flex-col gap-2 p-2">
                  {col.length === 0 ? <li className="px-1 py-4 text-center text-xs text-faint">Drop here</li> : null}
                  {col.map((c) => (
                    <li key={c.id} draggable onDragStart={() => setDragId(c.id)} onDragEnd={() => setDragId(null)}
                      className={cx("cursor-grab rounded-md border bg-surface p-2.5 shadow-xs", dragId === c.id ? "opacity-50" : "", c.priority === "high" ? "border-l-4 border-l-accent border-line" : "border-line")}>
                      <Link href={`/pipeline/${c.id}`} className="block text-sm font-medium leading-snug hover:underline">{c.title}</Link>
                      <div className="mt-0.5 truncate text-xs text-muted">{c.company}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                        <span title={c.ownerName} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent-ink">{c.ownerInitials}</span>
                        {c.value ? <span className="tabular-nums text-ink-soft">{c.value}</span> : null}
                        {c.noNextAction ? <Badge tone="warn">No next action</Badge> : c.followUp ? <Badge tone={c.followUpTone === "none" ? "neutral" : c.followUpTone}>{c.followUp}</Badge> : null}
                        <span className="text-faint" title="Days in this stage">{c.stageAgeDays}d</span>
                      </div>
                      <details className="mt-1.5">
                        <summary className={buttonClass("ghost", "sm", "w-full cursor-pointer justify-start")}>Move…</summary>
                        <div className="pt-2"><StageMover id={c.id} stage={c.stage} compact /></div>
                      </details>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
