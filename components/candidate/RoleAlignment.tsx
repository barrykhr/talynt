"use client";

import Link from "next/link";
import { useMemo } from "react";
import { alignRole, type AlignmentState } from "@/lib/candidate/alignment";
import { usePassport, completedParts } from "@/lib/candidate/passport";
import type { Role } from "@/lib/candidate/roles";
import { cx } from "@/lib/utils";

/**
 * "Is this role right for me?"
 *
 * No score. Named dimensions, each with a state and the reason for it, drawn
 * only from what the person entered themselves — plus the questions the
 * comparison cannot settle, which are the more useful half.
 */

const STATE_LABEL: Record<AlignmentState, string> = {
  aligned: "Lines up",
  partly: "Partly",
  differs: "Differs",
  unknown: "Not known",
};

const STATE_CLASS: Record<AlignmentState, string> = {
  aligned: "border-signal/40 bg-signal/10 text-signal",
  partly: "border-current/25 text-fg-75",
  differs: "border-current/25 text-fg-60",
  unknown: "border-current/15 text-fg-40",
};

export function RoleAlignment({ role }: { role: Role }) {
  const { passport, loaded } = usePassport();
  const alignment = useMemo(() => alignRole(passport, role), [passport, role]);
  const filled = loaded ? completedParts(passport).length : 0;

  return (
    <div className="rounded-lg border border-current/12 p-6 sm:p-9">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="display text-(length:--text-h3)">Is this role right for me?</h2>
        <span className="mono-micro text-fg-35">
          {loaded ? `${filled} of 5 Passport sections filled` : "Reading your Passport…"}
        </span>
      </div>

      {loaded && alignment.insufficient ? (
        <div className="mt-7">
          <p className="max-w-2xl text-[0.98rem] leading-[1.65] text-fg-65">
            There isn&rsquo;t enough in your Career Passport yet to compare this
            role to what you want. We&rsquo;re not going to guess — an invented
            reading is worse than none.
          </p>
          <div className="mt-7">
            <Link
              href="/candidates/passport"
              className="mono-micro text-signal transition-opacity duration-300 hover:opacity-70"
            >
              Fill in your Passport →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-5 max-w-2xl text-[0.95rem] leading-[1.65] text-fg-55">
            Built from what you told us, nothing else. There is no score here on
            purpose: a number would hide which of these moved it.
          </p>

          <ul className="mt-8 flex flex-col">
            {alignment.dimensions.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-3 border-t border-current/10 py-5 first:border-t-0 sm:flex-row sm:items-start sm:gap-6"
              >
                <div className="flex shrink-0 items-center gap-3 sm:w-64">
                  <span
                    className={cx(
                      "mono-micro shrink-0 rounded-full border px-2.5 py-1 leading-none",
                      STATE_CLASS[d.state],
                    )}
                  >
                    {STATE_LABEL[d.state]}
                  </span>
                  <span className="text-[0.9rem] text-fg-80">{d.label}</span>
                </div>
                <p className="text-[0.92rem] leading-[1.65] text-fg-60">{d.reason}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-9 border-t border-current/10 pt-7">
        <p className="mono-micro text-fg-40">Questions to consider</p>
        <ul className="mt-5 flex flex-col gap-3">
          {alignment.questions.map((q) => (
            <li key={q} className="flex gap-4">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal" aria-hidden="true" />
              <span className="text-[0.94rem] leading-[1.65] text-fg-70">{q}</span>
            </li>
          ))}
        </ul>
        <p className="mt-7 text-[0.88rem] leading-[1.6] text-fg-45">
          Nothing on this panel is shared with the company. It is a reading for
          you, computed on your own device.
        </p>
      </div>
    </div>
  );
}
