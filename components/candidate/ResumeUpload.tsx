"use client";

import { useRef, useState } from "react";
import { usePassport } from "@/lib/candidate/passport";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = ".pdf,.doc,.docx,.txt,.rtf";

/**
 * CV attachment.
 *
 * What this does: records the file's name and size on this device so the
 * application can name it, and holds the file in memory for this page only.
 *
 * What it deliberately does not do: parse it. There is no extraction service
 * behind this, so there is nothing to pre-fill your Passport from — and
 * inventing fields from a document we have not actually read would be worse
 * than asking you. The copy says so rather than implying a parser exists.
 */
export function ResumeUpload() {
  const { passport, update } = usePassport();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function accept(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("That file is over 8 MB. A CV should not be — send a smaller one.");
      return;
    }
    update({
      resume: {
        name: file.name,
        size: file.size,
        addedAt: new Date().toISOString(),
      },
    });
  }

  return (
    <div>
      <p className="mono-micro text-fg-45">Your CV</p>

      {passport.resume ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-md border border-current/15 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-[0.95rem]">{passport.resume.name}</p>
            <p className="mono-micro mt-1.5 text-fg-35 tabular-nums">
              {(passport.resume.size / 1024).toFixed(0)} KB · attached on this device
            </p>
          </div>
          <button
            type="button"
            onClick={() => update({ resume: null })}
            className="mono-micro shrink-0 text-fg-45 transition-colors duration-300 hover:text-signal"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => accept(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="inline-flex items-center gap-3 rounded-full border border-current/25 px-6 py-3 text-[0.92rem] transition-colors duration-300 hover:border-current/60 hover:bg-current/[0.06]"
          >
            Choose a file <span aria-hidden="true">↑</span>
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-[0.88rem] text-signal">{error}</p>}

      <p className="mt-4 max-w-xl text-[0.85rem] leading-[1.6] text-fg-45">
        PDF, Word or plain text, under 8 MB. We don&rsquo;t read it to fill in
        your Passport — there is no parser behind this and we&rsquo;d rather ask
        you than guess. It is attached to an application only when you send one.
      </p>
    </div>
  );
}
