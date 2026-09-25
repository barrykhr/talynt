"use client";

import { useSavedRoles } from "@/lib/candidate/saved";
import { cx } from "@/lib/utils";

/**
 * Saving is a local bookmark and nothing more — no notification is sent, and
 * no client is told. The copy says exactly that rather than implying a
 * pipeline the person has not entered.
 */
export function SaveButton({
  slug,
  className,
  withLabel = false,
}: {
  slug: string;
  className?: string;
  withLabel?: boolean;
}) {
  const { isSaved, toggle, loaded } = useSavedRoles();
  const saved = loaded && isSaved(slug);

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={saved}
      title={saved ? "Saved on this device" : "Save on this device"}
      className={cx(
        "mono-micro inline-flex items-center gap-2 rounded-full border px-3 py-1.5 leading-none transition-colors duration-300",
        saved
          ? "border-signal/40 bg-signal/10 text-signal"
          : "border-current/15 text-fg-50 hover:border-current/40 hover:text-fg-75",
        className,
      )}
    >
      <span aria-hidden="true">{saved ? "●" : "○"}</span>
      {withLabel ? (saved ? "Saved" : "Save this role") : <span className="sr-only">{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
