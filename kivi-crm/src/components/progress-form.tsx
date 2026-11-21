"use client";

import { useActionState } from "react";
import { updateRequirementProgress } from "@/lib/actions/opportunities";
import { REQUIREMENT_STATUSES, type RequirementStatus } from "@/lib/constants";
import { buttonClass } from "@/components/ui";

export function ProgressForm({ id, status, filled, volume }: { id: string; status: RequirementStatus; filled: number; volume: number }) {
  const [state, action, pending] = useActionState(updateRequirementProgress, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor={`rs-${id}`} className="mb-1 block text-[13px] font-medium text-ink-soft">Delivery status</label>
        <select id={`rs-${id}`} name="status" defaultValue={status} className="input">
          {REQUIREMENT_STATUSES.values.map((s) => <option key={s} value={s}>{REQUIREMENT_STATUSES.label[s]}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`rf-${id}`} className="mb-1 block text-[13px] font-medium text-ink-soft">Placed (of {volume})</label>
        <input id={`rf-${id}`} name="positions_filled" type="number" min={0} max={volume} defaultValue={filled} className="input" inputMode="numeric" />
      </div>
      <button type="submit" disabled={pending} className={buttonClass("primary")}>{pending ? "Saving…" : "Update"}</button>
      {state.error ? <p role="alert" className="text-sm text-danger sm:col-span-3">{state.error}</p> : null}
      {state.ok && !pending ? <p role="status" className="text-sm text-ok sm:col-span-3">{state.message}</p> : null}
    </form>
  );
}
