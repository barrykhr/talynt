"use client";

import { ActionForm, Disclosure, SubmitButton, TextAreaField, TextField } from "@/components/forms";
import { IconCalendar, IconMail } from "@/components/icons";
import { createCrmMeeting, sendCrmEmail } from "@/lib/actions/google";
import type { RecordLinks } from "@/components/communication";

function LinkInputs({ links, back }: { links: RecordLinks; back: string }) {
  return (
    <>
      <input type="hidden" name="back" value={back} />
      {Object.entries(links).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
    </>
  );
}

export function ComposeEmail({ links, defaultTo, back, fromEmail, recipients }: {
  links: RecordLinks; defaultTo: string; back: string; fromEmail: string; recipients: { value: string; label: string }[];
}) {
  return (
    <Disclosure summary={<><IconMail /> Compose email</>}>
      <ActionForm action={sendCrmEmail} className="space-y-3">
        <LinkInputs links={links} back={back} />
        <p className="text-xs text-muted">Sends from <strong className="font-medium text-ink-soft">{fromEmail}</strong> and logs a copy on this record.</p>
        <TextField label="To" name="to" required defaultValue={defaultTo} list="crm-recipients" placeholder="name@company.com" autoComplete="off" />
        {recipients.length ? (
          <datalist id="crm-recipients">{recipients.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</datalist>
        ) : null}
        <TextField label="Subject" name="subject" required maxLength={250} />
        <TextAreaField label="Message" name="body" required rows={7} />
        <div className="flex justify-end"><SubmitButton pendingLabel="Sending…">Send email</SubmitButton></div>
      </ActionForm>
    </Disclosure>
  );
}

export function ScheduleMeeting({ links, back, defaultAttendee }: { links: RecordLinks; back: string; defaultAttendee: string }) {
  return (
    <Disclosure summary={<><IconCalendar /> Schedule meeting</>}>
      <ActionForm action={createCrmMeeting} className="space-y-3">
        <LinkInputs links={links} back={back} />
        <TextField label="Title" name="title" required maxLength={250} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Starts" name="starts_at" type="datetime-local" required />
          <TextField label="Minutes" name="duration_minutes" type="number" min={5} max={600} defaultValue={30} />
        </div>
        <TextField label="Attendees" name="attendee_emails" defaultValue={defaultAttendee} hint="Comma-separated email addresses." />
        <TextField label="Location or video link" name="location" />
        <TextAreaField label="Agenda" name="description" rows={3} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="send_invites" defaultChecked className="h-4 w-4 accent-accent" /> Email invitations to attendees
        </label>
        <div className="flex justify-end"><SubmitButton pendingLabel="Creating…">Add to my calendar</SubmitButton></div>
      </ActionForm>
    </Disclosure>
  );
}
