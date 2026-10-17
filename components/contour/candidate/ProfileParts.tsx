"use client";

import { useRef, useState } from "react";
import { usePassport, type PassportEducation, type PassportExperience } from "@/lib/candidate/passport";
import { PASSPORT } from "@/lib/contour/content";
import { PROFILE } from "@/lib/contour/proposed";
import { TextArea, TextField } from "./Fields";

const MAX_BYTES = 8 * 1024 * 1024;

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/**
 * CV attachment. Records the file's name and size on this device; never reads
 * the file. There is no parsing service, and the copy says so rather than
 * implying one — nothing is pre-filled from a document nobody has read.
 */
export function ResumeField({ id = "profile-cv" }: { id?: string }) {
  const { passport, update } = usePassport();
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[0.95rem] font-medium">
        Your CV <span className="ct-mute ml-2 text-[0.78rem] font-normal">Optional</span>
      </span>
      {passport.resume ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--ct-r-s)] border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[0.95rem]">{passport.resume.name}</p>
            <p className="ct-meta ct-mute mt-1 tabular-nums">{(passport.resume.size / 1024).toFixed(0)} KB · on this device</p>
          </div>
          <button type="button" onClick={() => update({ resume: null })} className="ct-btn ct-btn-quiet min-h-10 text-[0.88rem]">
            Remove
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={input}
            id={id}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.rtf"
            className="sr-only"
            aria-describedby={`${id}-note`}
            onChange={(e) => {
              setError(null);
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > MAX_BYTES) {
                setError("That file is over 8 MB. A CV should not be — send a smaller one.");
                return;
              }
              update({ resume: { name: file.name, size: file.size, addedAt: new Date().toISOString() } });
            }}
          />
          <label htmlFor={id} className="ct-btn ct-btn-secondary cursor-pointer">
            Choose a file <span aria-hidden="true">↑</span>
          </label>
        </div>
      )}
      {error && (
        <p className="ct-error" role="alert">
          {error}
        </p>
      )}
      <p id={`${id}-note`} className="ct-small max-w-2xl text-[0.88rem]">
        PDF, Word or plain text, under 8 MB. {PROFILE.cvNote}
      </p>
    </div>
  );
}

export function ExperienceList() {
  const { passport, update } = usePassport();
  const patch = (id: string, p: Partial<PassportExperience>) =>
    update({ experience: passport.experience.map((e) => (e.id === id ? { ...e, ...p } : e)) });

  return (
    <fieldset>
      <legend className="text-[0.95rem] font-medium">
        Roles that matter <span className="ct-mute ml-2 text-[0.78rem] font-normal">Optional</span>
      </legend>
      <p className="ct-small mt-1 text-[0.88rem]">{PASSPORT.experienceSummaryHint}</p>
      <ul className="mt-4 flex flex-col gap-4">
        {passport.experience.map((entry, i) => (
          <li key={entry.id} className="rounded-[var(--ct-r-m)] border p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id={`exp-${entry.id}-title`} label="Title" value={entry.title} onChange={(title) => patch(entry.id, { title })} />
              <TextField id={`exp-${entry.id}-org`} label="Organisation" value={entry.organisation} onChange={(organisation) => patch(entry.id, { organisation })} />
              <TextField id={`exp-${entry.id}-from`} label="From" value={entry.from} onChange={(from) => patch(entry.id, { from })} placeholder="2021" />
              <TextField id={`exp-${entry.id}-to`} label="To" value={entry.to} onChange={(to) => patch(entry.id, { to })} placeholder="Now" />
            </div>
            <div className="mt-4">
              <TextArea id={`exp-${entry.id}-summary`} label="What you actually did" value={entry.summary} onChange={(summary) => patch(entry.id, { summary })} rows={3} />
            </div>
            <button
              type="button"
              onClick={() => update({ experience: passport.experience.filter((e) => e.id !== entry.id) })}
              className="ct-btn ct-btn-quiet mt-2 min-h-10 text-[0.88rem] text-[var(--ct-mute)]"
            >
              Remove role {i + 1}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => update({ experience: [...passport.experience, { id: newId("exp"), title: "", organisation: "", from: "", to: "", summary: "" }] })}
        className="ct-btn ct-btn-secondary mt-4"
      >
        Add a role <span aria-hidden="true">+</span>
      </button>
    </fieldset>
  );
}

export function EducationList() {
  const { passport, update } = usePassport();
  const patch = (id: string, p: Partial<PassportEducation>) =>
    update({ education: passport.education.map((e) => (e.id === id ? { ...e, ...p } : e)) });

  return (
    <fieldset>
      <legend className="text-[0.95rem] font-medium">
        {PROFILE.educationLabel} <span className="ct-mute ml-2 text-[0.78rem] font-normal">Optional</span>
      </legend>
      <p className="ct-small mt-1 text-[0.88rem]">{PROFILE.educationHint}</p>
      <ul className="mt-4 flex flex-col gap-4">
        {passport.education.map((entry, i) => (
          <li key={entry.id} className="rounded-[var(--ct-r-m)] border p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_8rem]">
              <TextField id={`edu-${entry.id}-qualification`} label="Qualification" value={entry.qualification} onChange={(qualification) => patch(entry.id, { qualification })} />
              <TextField id={`edu-${entry.id}-institution`} label="Institution" value={entry.institution} onChange={(institution) => patch(entry.id, { institution })} />
              <TextField id={`edu-${entry.id}-year`} label="Year" value={entry.year} onChange={(year) => patch(entry.id, { year })} />
            </div>
            <button
              type="button"
              onClick={() => update({ education: passport.education.filter((e) => e.id !== entry.id) })}
              className="ct-btn ct-btn-quiet mt-2 min-h-10 text-[0.88rem] text-[var(--ct-mute)]"
            >
              Remove education {i + 1}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => update({ education: [...passport.education, { id: newId("edu"), institution: "", qualification: "", year: "" }] })}
        className="ct-btn ct-btn-secondary mt-4"
      >
        {PROFILE.addEducation} <span aria-hidden="true">+</span>
      </button>
    </fieldset>
  );
}
