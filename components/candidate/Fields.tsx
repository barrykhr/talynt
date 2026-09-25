"use client";

import { useId } from "react";
import type { Option, Place } from "@/lib/candidate/taxonomy";
import { cx } from "@/lib/utils";

/**
 * Form controls in the existing language: full pills for choices, hairline
 * borders, signal only for what is selected. No new shapes, no new radii,
 * no new accent.
 */

export function ChipGroup({
  legend,
  hint,
  options,
  selected,
  onChange,
  multiple = true,
  /** Selection order is meaningful for ranked questions. */
  showRank = false,
  max,
}: {
  legend: string;
  hint?: string;
  options: Option[] | Place[];
  selected: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  showRank?: boolean;
  max?: number;
}) {
  const toggle = (id: string) => {
    if (!multiple) {
      onChange(selected[0] === id ? [] : [id]);
      return;
    }
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
      return;
    }
    if (max && selected.length >= max) return;
    onChange([...selected, id]);
  };

  return (
    <fieldset>
      <legend className="mono-micro text-fg-45">{legend}</legend>
      {hint && (
        <p className="mt-3 max-w-xl text-[0.9rem] leading-[1.6] text-fg-55">{hint}</p>
      )}
      <div className="mt-5 flex flex-wrap gap-2.5">
        {options.map((option) => {
          const active = selected.includes(option.id);
          const rank = showRank ? selected.indexOf(option.id) + 1 : 0;
          const note = "note" in option ? option.note : undefined;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              aria-pressed={active}
              title={note}
              className={cx(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.88rem] transition-colors duration-300 ease-(--ease-out-expo)",
                active
                  ? "border-signal/45 bg-signal/10 text-signal-300"
                  : "border-current/15 text-fg-70 hover:border-current/40 hover:text-fg-85",
              )}
            >
              {showRank && active && (
                <span className="mono-micro tabular-nums text-signal">{rank}</span>
              )}
              {option.label}
            </button>
          );
        })}
      </div>
      {max && (
        <p className="mono-micro mt-4 text-fg-35">
          {selected.length} of {max} chosen
        </p>
      )}
      {/* The notes are on the chips as titles; repeat the selected ones in text
          so they are available to a screen reader and on touch. */}
      {selected.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {options
            .filter((o) => selected.includes(o.id) && "note" in o && o.note)
            .map((o) => (
              <li key={o.id} className="text-[0.85rem] leading-[1.55] text-fg-45">
                <span className="text-fg-70">{o.label}</span> — {(o as Option).note}
              </li>
            ))}
        </ul>
      )}
    </fieldset>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mono-micro block text-fg-45">
        {label}
        {required && <span className="ml-1 text-signal">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-md border border-current/15 bg-transparent px-4 py-3 text-[0.98rem] transition-colors duration-300 placeholder:text-fg-30 hover:border-current/30 focus:border-signal/50 focus:outline-none"
      />
      {hint && <p className="mt-2.5 text-[0.85rem] leading-[1.55] text-fg-45">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mono-micro block text-fg-45">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full resize-y rounded-md border border-current/15 bg-transparent px-4 py-3 text-[0.98rem] leading-[1.6] transition-colors duration-300 placeholder:text-fg-30 hover:border-current/30 focus:border-signal/50 focus:outline-none"
      />
      {hint && <p className="mt-2.5 text-[0.85rem] leading-[1.55] text-fg-45">{hint}</p>}
    </div>
  );
}

/** A consent control. Off by default, always, and never pre-ticked. */
export function ConsentToggle({
  label,
  body,
  checked,
  onChange,
}: {
  label: string;
  body: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-4 border-t border-current/10 py-5 first:border-t-0 first:pt-0">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-signal)]"
      />
      <div>
        <label htmlFor={id} className="block text-[0.98rem] leading-snug">
          {label}
        </label>
        <p className="mt-2 text-[0.88rem] leading-[1.6] text-fg-55">{body}</p>
      </div>
    </div>
  );
}

/** Free-text list, comma separated. Used for skills. */
export function TagInput({
  label,
  values,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mono-micro block text-fg-45">
        {label}
      </label>
      <input
        id={id}
        value={values.join(", ")}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        className="mt-3 w-full rounded-md border border-current/15 bg-transparent px-4 py-3 text-[0.98rem] transition-colors duration-300 placeholder:text-fg-30 hover:border-current/30 focus:border-signal/50 focus:outline-none"
      />
      {hint && <p className="mt-2.5 text-[0.85rem] leading-[1.55] text-fg-45">{hint}</p>}
    </div>
  );
}
