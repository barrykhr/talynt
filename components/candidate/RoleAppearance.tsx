"use client";

import Link from "next/link";
import { usePassport } from "@/lib/candidate/passport";
import { appearanceReasons } from "@/lib/candidate/alignment";
import type { Role } from "@/lib/candidate/roles";

/**
 * "Why this role appears."
 *
 * Shown only when the Passport actually contains something to point at. With
 * an empty Passport there is no honest reason, so the panel says that instead
 * of manufacturing one.
 */
export function RoleAppearance({ role }: { role: Role }) {
  const { passport, loaded } = usePassport();
  if (!loaded) return null;

  const hasSignal =
    passport.functionIds.length > 0 ||
    passport.directionIds.length > 0 ||
    passport.workModelIds.length > 0;

  return (
    <div className="rounded-lg border border-current/12 p-6 sm:p-7">
      <p className="mono-micro text-fg-40">Why this role appears</p>
      {hasSignal ? (
        <ul className="mt-5 flex flex-col gap-2.5">
          {appearanceReasons(passport, role).map((reason) => (
            <li key={reason} className="flex gap-4">
              <span
                className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-signal"
                aria-hidden="true"
              />
              <span className="text-[0.92rem] leading-[1.65] text-fg-65">{reason}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 max-w-2xl text-[0.92rem] leading-[1.65] text-fg-60">
          You&rsquo;re seeing this because you opened it — there is nothing in
          your Career Passport yet for us to match against.{" "}
          <Link href="/candidates/passport" className="text-signal hover:opacity-70">
            Fill it in
          </Link>{" "}
          and every role starts telling you where it lines up with what you want,
          and where it doesn&rsquo;t.
        </p>
      )}
    </div>
  );
}
