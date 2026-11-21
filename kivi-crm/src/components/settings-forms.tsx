"use client";

import { ActionForm, SubmitButton, TextField } from "@/components/forms";
import { saveSyncPreferences, saveWorkspaceSettings } from "@/lib/actions/settings";
import { OPPORTUNITY_STAGES } from "@/lib/constants";
import type { AppSettings } from "@/lib/types";

function Check({ name, label, hint, checked }: { name: string; label: string; hint?: string; checked: boolean }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={checked} className="mt-1 h-4 w-4 accent-accent" />
      <span>{label}{hint ? <span className="block text-xs text-muted">{hint}</span> : null}</span>
    </label>
  );
}

export function WorkspaceSettingsForm({ s }: { s: AppSettings }) {
  return (
    <ActionForm action={saveWorkspaceSettings} className="space-y-6">
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Stage probabilities (for weighted pipeline)</legend>
        <p className="mb-3 text-xs text-muted">Each open opportunity&apos;s value × this percentage, unless the deal has its own probability.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {OPPORTUNITY_STAGES.values.map((st) => (
            <TextField key={st} label={OPPORTUNITY_STAGES.label[st]} name={`prob_${st}`} type="number" min={0} max={100} defaultValue={s.stage_probabilities[st] ?? 0} />
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-semibold">Booked revenue rule</legend>
        <p className="text-xs text-muted">A valued, live requirement counts as booked when all ticked conditions are true.</p>
        <Check name="booked_requires_msa" label="Company MSA is signed" checked={s.booked_requires_msa} hint="Default on. An MSA alone, without a valued live requirement, is never booked." />
        <Check name="booked_requires_accepted" label="Client accepted the requirement" checked={s.booked_requires_accepted} />
        <Check name="booked_requires_terms" label="Commercial terms agreed" checked={s.booked_requires_terms} />
      </fieldset>
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">When is a placement fee earned?</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="placement_earned_on" value="joining" defaultChecked={s.placement_earned_on === "joining"} className="accent-accent" /> When the candidate joins (default)</label>
          <label className="flex items-center gap-2"><input type="radio" name="placement_earned_on" value="offer_accepted" defaultChecked={s.placement_earned_on === "offer_accepted"} className="accent-accent" /> When the offer is accepted</label>
        </div>
        <p className="mt-1 text-xs text-muted">Earned is separate from invoiced and from cash received.</p>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-semibold">Research & monitoring</legend>
        <Check name="research_enabled" label="Allow company research" checked={s.research_enabled} hint="Uses the configured provider. Never sends messages." />
        <Check name="monitoring_enabled" label="Run scheduled monitoring for all companies" checked={s.monitoring_enabled} hint="Untick to pause every monitor at once." />
        <div className="max-w-xs"><TextField label="Default check cadence (days)" name="monitoring_default_cadence_days" type="number" min={1} max={90} defaultValue={s.monitoring_default_cadence_days} /></div>
      </fieldset>
      <SubmitButton>Save workspace settings</SubmitButton>
    </ActionForm>
  );
}

export function SyncPreferencesForm({ p }: { p: { gmail_sync_enabled: boolean; gmail_mode: string; history_window_days: number; calendar_sync_enabled: boolean } }) {
  return (
    <ActionForm action={saveSyncPreferences} className="space-y-3">
      <Check name="gmail_sync_enabled" label="Sync my Gmail" checked={p.gmail_sync_enabled} hint="Off = nothing from your mailbox is read; you can still send from the CRM." />
      <fieldset className="text-sm">
        <legend className="mb-1 text-xs text-muted">What to bring in</legend>
        <label className="flex items-start gap-2"><input type="radio" name="gmail_mode" value="contacts_only" defaultChecked={p.gmail_mode === "contacts_only"} className="mt-1 accent-accent" /> Only threads with existing CRM contacts</label>
        <label className="flex items-start gap-2"><input type="radio" name="gmail_mode" value="contacts_and_review" defaultChecked={p.gmail_mode !== "contacts_only"} className="mt-1 accent-accent" /> Also suggest threads with people at CRM companies (private review queue)</label>
      </fieldset>
      <label className="block text-xs text-muted">History window
        <select name="history_window_days" defaultValue={String(p.history_window_days)} className="input mt-1 h-9 w-auto py-1.5">
          <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
        </select>
      </label>
      <Check name="calendar_sync_enabled" label="Sync my Calendar" checked={p.calendar_sync_enabled} />
      <p className="text-xs text-muted">Emails and meetings logged to shared CRM records (subject, participants, date) are visible to the whole team. Your mailbox, message bodies and tokens are never shared.</p>
      <SubmitButton variant="secondary">Save sync preferences</SubmitButton>
    </ActionForm>
  );
}
