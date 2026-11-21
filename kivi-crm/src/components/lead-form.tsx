"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionForm, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/forms";
import { buttonClass } from "@/components/ui";
import { createLead } from "@/lib/actions/leads";
import { LEAD_SOURCES, PRIORITIES } from "@/lib/constants";
import type { WebSubmission } from "@/lib/types";

export function LeadForm({ companies, team, defaultOwner, submission, researchAvailable }: {
  companies: { value: string; label: string }[]; team: { value: string; label: string }[]; defaultOwner: string;
  submission: WebSubmission | null; researchAvailable: boolean;
}) {
  const [existing, setExisting] = useState("");
  return (
    <ActionForm action={createLead} duplicateHrefBase="/companies" className="space-y-6">
      {submission ? <input type="hidden" name="web_submission_id" value={submission.id} /> : null}
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold">Company <span className="font-normal text-muted">(required)</span></legend>
        <SelectField label="Existing company" name="company_id" options={companies} placeholder="— New company —" value={existing} onChange={(e) => setExisting(e.target.value)} className="sm:col-span-2" />
        {!existing ? (
          <>
            <TextField label="New company name" name="company_name" required defaultValue={submission?.company_name ?? ""} />
            <TextField label="Website" name="website" placeholder="example.com" hint="Helps spot duplicates." />
          </>
        ) : null}
        <TextField label="Location" name="location" defaultValue={submission?.location ?? ""} />
        <SelectField label="Lead source" name="source" required options={LEAD_SOURCES.values.map((v) => ({ value: v, label: LEAD_SOURCES.label[v] }))} defaultValue={submission ? "website" : "referral"} />
        <TextField label="Source detail" name="source_detail" placeholder="e.g. referred by …, event name" defaultValue={submission?.page_url ?? ""} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold">Contact <span className="font-normal text-muted">(optional)</span></legend>
        <TextField label="Name" name="contact_name" defaultValue={submission?.full_name ?? ""} />
        <TextField label="Role" name="contact_role" placeholder="e.g. Head of Talent" />
        <TextField label="Work email" name="contact_email" type="email" defaultValue={submission?.email ?? ""} hint="An existing contact with this email is linked, not duplicated." />
        <TextField label="Phone / WhatsApp" name="contact_phone" defaultValue={submission?.phone ?? ""} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold">Opportunity <span className="font-normal text-muted">(all optional — add as you learn)</span></legend>
        <TextField label="Hiring role or need" name="hiring_need" defaultValue={submission?.role_needed ?? ""} />
        <TextField label="Hiring volume" name="hiring_volume" type="number" min={1} defaultValue={submission?.hiring_volume ?? ""} />
        <TextField label="Budget / commercial terms" name="budget" />
        <SelectField label="Owner" name="owner_id" options={team} placeholder="Unassigned" defaultValue={defaultOwner} />
        <TextField label="Next action" name="next_action" placeholder="e.g. Call to qualify" />
        <TextField label="Next follow-up" name="next_follow_up_on" type="date" />
        <SelectField label="Priority" name="priority" options={PRIORITIES.values.map((v) => ({ value: v, label: PRIORITIES.label[v] }))} defaultValue="normal" />
        <TextAreaField label="Notes" name="notes" rows={3} defaultValue={submission?.message ?? ""} className="sm:col-span-2" />
      </fieldset>

      <label className={`flex items-start gap-2 text-sm ${researchAvailable ? "" : "opacity-60"}`}>
        <input type="checkbox" name="research_now" disabled={!researchAvailable} className="mt-1 h-4 w-4 accent-accent" />
        <span>Research this company after saving{researchAvailable ? " (results arrive in a few minutes for review; nothing is sent)" : <span className="block text-xs text-muted">Research isn&apos;t configured yet.</span>}</span>
      </label>
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Link href="/pipeline" className={buttonClass("secondary")}>Cancel</Link>
        <SubmitButton>Add lead</SubmitButton>
      </div>
    </ActionForm>
  );
}
