"use client";

import { ActionForm, SelectField, SubmitButton, TextAreaField, TextField, InlineAction } from "@/components/forms";
import { addManualSignal, refreshMonitorNow, saveMonitor } from "@/lib/actions/research";
import { SIGNAL_TYPES } from "@/lib/constants";
import type { CompanyMonitor } from "@/lib/types";

export function MonitorForm({ companyId, back, monitor, defaultCadence }: { companyId: string; back: string; monitor: CompanyMonitor | null; defaultCadence: number }) {
  const types = monitor?.signal_types ?? ["hiring", "job_volume_change", "announcement", "funding", "expansion"];
  return (
    <ActionForm action={saveMonitor} className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-2">
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="back" value={back} />
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="enabled" defaultChecked={monitor?.enabled ?? true} className="h-4 w-4 accent-accent" /> Monitoring on</label>
      <TextField label="Check every (days)" name="cadence_days" type="number" min={1} max={90} defaultValue={monitor?.cadence_days ?? defaultCadence} hint="Weekly is plenty for most companies." />
      <TextField label="Greenhouse board token" name="greenhouse_board" defaultValue={monitor?.sources.greenhouse_board ?? ""} placeholder="e.g. acme (from boards.greenhouse.io/acme)" />
      <TextField label="Lever company id" name="lever_company" defaultValue={monitor?.sources.lever_company ?? ""} placeholder="e.g. acme (from jobs.lever.co/acme)" />
      <TextAreaField label="News / press RSS feeds (https, one per line)" name="rss_urls" rows={2} defaultValue={(monitor?.sources.rss_urls ?? []).join("\n")} className="sm:col-span-2" />
      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-[13px] font-medium text-ink-soft">Signal types</legend>
        <div className="flex flex-wrap gap-3">
          {SIGNAL_TYPES.values.map((t) => (
            <label key={t} className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="signal_types" value={t} defaultChecked={types.includes(t)} className="accent-accent" />{SIGNAL_TYPES.label[t]}</label>
          ))}
        </div>
      </fieldset>
      <div className="sm:col-span-2"><SubmitButton>Save monitoring</SubmitButton></div>
    </ActionForm>
  );
}

export function ManualSignalForm({ companyId, back }: { companyId: string; back: string }) {
  return (
    <ActionForm action={addManualSignal} resetOnSuccess className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-2">
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="back" value={back} />
      <SelectField label="Type" name="signal_type" options={SIGNAL_TYPES.values.filter((t) => t !== "job_volume_change").map((t) => ({ value: t, label: SIGNAL_TYPES.label[t] }))} defaultValue="announcement" />
      <TextField label="Published on" name="published_at" type="date" />
      <TextField label="Source link" name="source_url" type="url" required placeholder="https://…" className="sm:col-span-2" />
      <TextAreaField label="What happened" name="summary" rows={2} required className="sm:col-span-2" />
      <div className="sm:col-span-2"><SubmitButton>Add signal</SubmitButton></div>
    </ActionForm>
  );
}

export function RefreshMonitorButton({ companyId, back }: { companyId: string; back: string }) {
  return <InlineAction action={refreshMonitorNow} hidden={{ company_id: companyId, back }} variant="secondary" title="Check sources now">Check now</InlineAction>;
}
