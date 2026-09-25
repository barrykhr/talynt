"use client";

import Link from "next/link";
import { formatCompensation, type Role } from "@/lib/candidate/roles";
import {
  EXPERIENCE_BANDS,
  LOCATIONS,
  WORK_MODELS,
  labelFor,
} from "@/lib/candidate/taxonomy";
import { SaveButton } from "./SaveButton";
import { cx } from "@/lib/utils";

/**
 * The role card uses the existing card language exactly: 0.5rem radius,
 * hairline border at 12%, mono metadata, one hover state. The only thing
 * that is new is what it chooses to put on the card — the compensation band
 * and the reason it appeared, both of which are usually withheld.
 */
export function RoleCard({
  role,
  reasons,
  className,
}: {
  role: Role;
  /** Why this role is in front of you. Omitted when there is nothing honest to say. */
  reasons?: string[];
  className?: string;
}) {
  return (
    <article
      className={cx(
        "group relative rounded-lg border border-current/12 p-6 transition-colors duration-300 hover:border-current/30 hover:bg-paper-100/[0.03] sm:p-7",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mono-micro text-fg-40">{role.company}</p>
          <h3 className="display mt-3 text-(length:--text-h3) text-balance">
            <Link href={`/candidates/roles/${role.slug}`} className="hover:text-signal">
              <span className="absolute inset-0" aria-hidden="true" />
              {role.title}
            </Link>
          </h3>
        </div>
        <SaveButton slug={role.slug} className="relative z-10 shrink-0" />
      </div>

      <p className="mt-4 text-[0.95rem] leading-[1.6] text-fg-65">{role.summary}</p>

      <dl className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Meta label="Level" value={labelFor(EXPERIENCE_BANDS, role.bandId)} />
        <Meta
          label="Where"
          value={role.locationIds.map((l) => labelFor(LOCATIONS, l)).join(" · ")}
        />
        <Meta
          label="Model"
          value={role.workModelIds.map((w) => labelFor(WORK_MODELS, w)).join(" / ")}
        />
      </dl>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-current/10 pt-5">
        <p className="font-mono text-[0.85rem] tabular-nums text-signal">
          {formatCompensation(role.compensation)}
          <span className="mono-micro ml-2 text-fg-40">per year · stated up front</span>
        </p>
        <span className="mono-micro text-fg-45 transition-transform duration-300 ease-(--ease-out-expo) group-hover:translate-x-1">
          Read the role →
        </span>
      </div>

      {reasons && reasons.length > 0 && (
        <div className="mt-5 border-t border-current/10 pt-5">
          <p className="mono-micro mb-3 text-fg-40">Why this appears</p>
          <ul className="flex flex-col gap-1.5">
            {reasons.map((reason) => (
              <li key={reason} className="text-[0.85rem] leading-[1.55] text-fg-55">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="mono-micro text-fg-35">{label}</dt>
      <dd className="text-[0.85rem] text-fg-70">{value}</dd>
    </div>
  );
}
