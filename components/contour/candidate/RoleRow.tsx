"use client";

import Link from "next/link";
import { formatCompensation, type Role } from "@/lib/candidate/roles";
import { EXPERIENCE_BANDS, FUNCTIONS, labelFor } from "@/lib/candidate/taxonomy";
import { useSavedRoles } from "@/lib/candidate/saved";
import { locationsLabel, workModelLabel } from "@/lib/contour/roles";
import { ROUTES } from "@/lib/contour/site";
import { ROLES_PAGE } from "@/lib/contour/content";
import { cx } from "@/lib/utils";

/**
 * A role as a row, not a card: title, the company as the client allows it to
 * be described, the reasoning in one line, then the facts a person filters on —
 * with the band always visible.
 */
export function RoleRow({ role, reasons }: { role: Role; reasons?: string[] }) {
  return (
    <article className="group relative grid gap-4 border-t py-6 transition-colors md:grid-cols-12 md:gap-6">
      <div className="md:col-span-7">
        <p className="ct-meta ct-mute">
          {labelFor(FUNCTIONS, role.functionId)} · {role.company}
        </p>
        <h3 className="ct-display ct-s mt-2">
          <Link href={ROUTES.role(role.slug)} className="group-hover:text-[var(--ct-green)]">
            {/* The whole row is the link; the save button sits above it. */}
            <span aria-hidden="true" className="absolute inset-0" />
            {role.title}
          </Link>
        </h3>
        <p className="ct-body mt-2 max-w-2xl text-[0.95rem]">{role.summary}</p>
        {reasons && reasons.length > 0 && (
          <div className="mt-4 rounded-[var(--ct-r-s)] bg-[var(--ct-violet-wash)] px-3.5 py-2.5">
            <p className="ct-meta ct-violet">{ROLES_PAGE.whyAppears}</p>
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {reasons.map((r) => (
                <li key={r} className="text-[0.85rem] text-[var(--ct-ink-2)]">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 self-start md:col-span-4 md:grid-cols-1">
        <Fact label="Experience" value={labelFor(EXPERIENCE_BANDS, role.bandId)} />
        <Fact label="Location" value={locationsLabel(role)} />
        <Fact label="Work model" value={workModelLabel(role)} />
        <Fact label="Band" value={`${formatCompensation(role.compensation)} a year`} strong />
      </dl>

      <div className="relative z-10 md:col-span-1 md:flex md:items-start md:justify-end">
        <SaveToggle slug={role.slug} title={role.title} />
      </div>
    </article>
  );
}

function Fact({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 md:flex-row md:items-baseline md:gap-3">
      <dt className="ct-meta ct-mute md:w-24 md:shrink-0">{label}</dt>
      <dd className={cx("text-[0.9rem]", strong ? "font-mono tabular-nums text-[var(--ct-ink)]" : "text-[var(--ct-ink-2)]")}>
        {value}
      </dd>
    </div>
  );
}

/** A bookmark on this device. No company is told; the label says so. */
export function SaveToggle({ slug, title, withLabel = false }: { slug: string; title: string; withLabel?: boolean }) {
  const { isSaved, toggle, loaded } = useSavedRoles();
  const saved = loaded && isSaved(slug);
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={saved}
      aria-label={withLabel ? undefined : saved ? `Saved: ${title}` : `Save ${title} on this device`}
      title={saved ? "Saved on this device" : "Save on this device — no one is notified"}
      className={cx(
        "inline-flex min-h-11 items-center gap-2 rounded-[var(--ct-r-m)] border px-3 text-[0.88rem] transition-colors",
        saved ? "ct-b-violet bg-[var(--ct-violet-wash)] text-[var(--ct-violet-ink)]" : "ct-b2 ct-hb-ink bg-[var(--ct-surface)] text-[var(--ct-ink-2)]",
      )}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
        <path
          d="M4 2.5h8v11l-4-2.8-4 2.8z"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
      {withLabel ? (saved ? "Saved" : "Save this role") : <span className="md:sr-only">{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
