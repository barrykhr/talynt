"use client";

import { useId, useRef, useState } from "react";
import type { Option, Place } from "@/lib/candidate/taxonomy";
import { cx } from "@/lib/utils";

/**
 * Form fields for the candidate flows. Every field says whether it is required
 * or optional in words, carries its hint and its error by id, and marks itself
 * invalid only after the person has tried to move on.
 */

function Label({ htmlFor, label, required }: { htmlFor?: string; label: string; required?: boolean }) {
  const content = (
    <>
      {label}
      <span className={cx("ml-2 text-[0.78rem] font-normal", required ? "ct-green" : "ct-mute")}>
        {required ? "Required" : "Optional"}
      </span>
    </>
  );
  return htmlFor ? (
    <label htmlFor={htmlFor} className="text-[0.95rem] font-medium">
      {content}
    </label>
  ) : (
    <span className="text-[0.95rem] font-medium">{content}</span>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  required = false,
  type = "text",
  hint,
  error,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} label={label} required={required} />
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="ct-input"
      />
      {hint && (
        <p id={`${id}-hint`} className="ct-small text-[0.85rem]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="ct-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  id,
  label,
  value,
  onChange,
  required = false,
  hint,
  error,
  placeholder,
  rows = 5,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  rows?: number;
}) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} label={label} required={required} />
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="ct-textarea"
      />
      {hint && (
        <p id={`${id}-hint`} className="ct-small text-[0.85rem]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="ct-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** Chips backed by real radios or checkboxes. Ranked groups show the order. */
export function Choices({
  id,
  legend,
  options,
  selected,
  onChange,
  multiple = true,
  required = false,
  hint,
  error,
  ranked = false,
  max,
}: {
  id: string;
  legend: string;
  options: Array<Option | Place>;
  selected: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  required?: boolean;
  hint?: string;
  error?: string;
  ranked?: boolean;
  max?: number;
}) {
  const name = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  function toggle(optionId: string) {
    if (!multiple) {
      onChange(selected[0] === optionId ? [] : [optionId]);
      return;
    }
    if (selected.includes(optionId)) onChange(selected.filter((s) => s !== optionId));
    else if (!max || selected.length < max) onChange([...selected, optionId]);
  }

  return (
    <fieldset id={id} aria-describedby={describedBy} aria-invalid={error ? true : undefined} tabIndex={-1} className="outline-none">
      <legend>
        <Label label={legend} required={required} />
      </legend>
      {hint && (
        <p id={`${id}-hint`} className="ct-small mt-1 text-[0.85rem]">
          {hint}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = selected.includes(o.id);
          const rank = ranked ? selected.indexOf(o.id) + 1 : 0;
          const atMax = Boolean(multiple && max && selected.length >= max && !checked);
          return (
            <label key={o.id} className="ct-choice" title={"note" in o ? o.note : undefined}>
              <input
                type={multiple ? "checkbox" : "radio"}
                name={name}
                checked={checked}
                disabled={atMax}
                onChange={() => toggle(o.id)}
                onClick={(e) => {
                  // A second click on a chosen radio clears it, as the chip suggests.
                  if (!multiple && checked) {
                    e.preventDefault();
                    onChange([]);
                  }
                }}
              />
              <span>
                {ranked && checked && <span className="ct-meta ct-green tabular-nums">{rank}</span>}
                {o.label}
              </span>
            </label>
          );
        })}
      </div>
      {max && (
        <p className="ct-meta ct-mute mt-3">
          {selected.length} of {max} chosen
        </p>
      )}
      {/* Notes on the chosen options, readable on touch and by screen readers. */}
      {selected.some((s) => options.find((o) => o.id === s && "note" in o && o.note)) && (
        <ul className="mt-3 flex flex-col gap-1">
          {options
            .filter((o) => selected.includes(o.id) && "note" in o && o.note)
            .map((o) => (
              <li key={o.id} className="ct-small text-[0.85rem]">
                <span className="text-[var(--ct-ink)]">{o.label}</span> — {(o as Option).note}
              </li>
            ))}
        </ul>
      )}
      {error && (
        <p id={`${id}-error`} className="ct-error mt-3">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Skills as removable tags. Enter or comma adds one. */
export function TagField({
  id,
  label,
  values,
  onChange,
  hint,
  placeholder,
}: {
  id: string;
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  hint?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement | null>(null);

  function commit(text: string) {
    const parts = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()));
    if (parts.length) onChange([...values, ...parts].slice(0, 40));
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} label={label} />
      <div className="ct-input flex flex-wrap items-center gap-1.5 py-2" onClick={() => input.current?.focus()}>
        {values.map((v) => (
          <span key={v} className="ct-tag gap-1 pr-1">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[var(--ct-bg-2)]"
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={input}
          id={id}
          value={draft}
          placeholder={values.length ? "" : placeholder}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) commit(v);
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => draft && commit(draft)}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 outline-none"
        />
      </div>
      {hint && (
        <p id={`${id}-hint`} className="ct-small text-[0.85rem]">
          {hint}
        </p>
      )}
    </div>
  );
}
