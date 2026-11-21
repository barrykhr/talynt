"use client";

import { useActionState, useState } from "react";
import { changeStage } from "@/lib/actions/opportunities";
import { OPPORTUNITY_STAGES, type OpportunityStage } from "@/lib/constants";
import { buttonClass } from "@/components/ui";

/** Keyboard-friendly stage change: pick a stage, add a reason if Lost, Move. */
export function StageMover({ id, stage, compact }: { id: string; stage: OpportunityStage; compact?: boolean }) {
  const [state, action, pending] = useActionState(changeStage, {});
  const [next, setNext] = useState<OpportunityStage>(stage);
  return (
    <form action={action} className="flex flex-col gap-1.5">
      <input type="hidden" name="id" value={id} />
      <div className="flex items-center gap-1.5">
        <label className="sr-only" htmlFor={`stage-${id}`}>Move to stage</label>
        <select
          id={`stage-${id}`}
          name="stage"
          value={next}
          onChange={(e) => setNext(e.target.value as OpportunityStage)}
          className={`input ${compact ? "h-8 py-1 text-[13px]" : "h-9 py-1.5"}`}
        >
          {OPPORTUNITY_STAGES.values.map((s) => <option key={s} value={s}>{OPPORTUNITY_STAGES.label[s]}</option>)}
        </select>
        <button type="submit" disabled={pending || next === stage} className={buttonClass("secondary", "sm")}>
          {pending ? "…" : "Move"}
        </button>
      </div>
      {next === "lost" && stage !== "lost" ? (
        <>
          <label className="sr-only" htmlFor={`loss-${id}`}>Loss reason</label>
          <input id={`loss-${id}`} name="loss_reason" required placeholder="Why was it lost?" className="input h-8 py-1 text-[13px]" maxLength={1000} />
        </>
      ) : null}
      {next === "nurture" && stage !== "nurture" ? (
        <>
          <label className="sr-only" htmlFor={`nur-${id}`}>Nurture reason</label>
          <input id={`nur-${id}`} name="nurture_reason" required placeholder="Why nurture? (e.g. budget next quarter)" className="input h-8 py-1 text-[13px]" maxLength={1000} />
          <label className="text-[11px] text-muted" htmlFor={`rev-${id}`}>Revisit on</label>
          <input id={`rev-${id}`} name="revisit_on" type="date" className="input h-8 py-1 text-[13px]" />
        </>
      ) : null}
      {next === "won" && stage !== "won" ? <p className="text-[11px] text-muted">Needs a signed MSA and an accepted live requirement.</p> : null}
      {state.error ? <p role="alert" className="text-xs text-danger">{state.error}</p> : null}
      {state.ok && !pending ? <p role="status" className="text-xs text-ok">Moved.</p> : null}
    </form>
  );
}
