"use client";

import Link from "next/link";
import { useApplications, useSavedRoles } from "@/lib/candidate/saved";
import { usePassport } from "@/lib/candidate/passport";
import { appearanceReasons } from "@/lib/candidate/alignment";
import { ROLES, formatCompensation, roleBySlug } from "@/lib/candidate/roles";
import { Reveal } from "@/components/primitives/Reveal";
import { RoleCard } from "./RoleCard";

/**
 * Saved roles, and what this device has sent.
 *
 * The status column is deliberately thin. "Saved" and "Sent" are the only two
 * states anything here can actually report — there is no interview or offer
 * state because nothing reports one back, and inventing a pipeline stage would
 * be the most misleading thing on the page.
 */
export function SavedList() {
  const { saved, loaded } = useSavedRoles();
  const { applications, loaded: appsLoaded } = useApplications();
  const { passport } = usePassport();

  if (!loaded || !appsLoaded) {
    return <p className="mono-micro mt-14 text-fg-35">Reading this device…</p>;
  }

  const savedRoles = saved.map(roleBySlug).filter(Boolean) as typeof ROLES;
  const hasSignal = passport.functionIds.length > 0 || passport.directionIds.length > 0;

  return (
    <div className="mt-14 flex flex-col gap-24">
      <section aria-labelledby="saved-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-current/12 pb-5">
          <h2 id="saved-heading" className="display text-(length:--text-h3)">
            Saved
          </h2>
          <p className="mono-micro text-fg-35 tabular-nums">
            {savedRoles.length} {savedRoles.length === 1 ? "role" : "roles"} · this device
          </p>
        </div>

        {savedRoles.length > 0 ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {savedRoles.map((role, i) => (
              <Reveal key={role.slug} delay={i * 0.06}>
                <RoleCard
                  role={role}
                  reasons={
                    hasSignal ? appearanceReasons(passport, role).slice(0, 2) : undefined
                  }
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-lg border border-current/12 p-9 sm:p-12">
            <p className="mono-micro text-fg-40">Nothing saved</p>
            <p className="display mt-5 max-w-lg text-(length:--text-h3) text-balance">
              You haven&rsquo;t saved a role yet.
            </p>
            <p className="mt-5 max-w-xl text-[0.95rem] leading-[1.65] text-fg-60">
              Saving is a bookmark on this device and nothing more — no company
              is notified, and it does not start a process. It is there so you
              can read a role properly later rather than deciding in a hurry.
            </p>
            <div className="mt-8">
              <Link
                href="/candidates/roles"
                className="mono-micro text-signal transition-opacity duration-300 hover:opacity-70"
              >
                Read the open roles →
              </Link>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="sent-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-current/12 pb-5">
          <h2 id="sent-heading" className="display text-(length:--text-h3)">
            Sent from this device
          </h2>
          <p className="mono-micro text-fg-35 tabular-nums">
            {applications.length} {applications.length === 1 ? "application" : "applications"}
          </p>
        </div>

        {applications.length > 0 ? (
          <>
            <ul className="mt-8 flex flex-col">
              {applications.map((app) => {
                const role = roleBySlug(app.slug);
                if (!role) return null;
                return (
                  <li
                    key={app.slug}
                    className="flex flex-col gap-3 border-t border-current/10 py-5 first:border-t-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/candidates/roles/${role.slug}`}
                        className="text-[1rem] transition-colors duration-300 hover:text-signal"
                      >
                        {role.title}
                      </Link>
                      <p className="mono-micro mt-1.5 text-fg-35">
                        {role.company} · {formatCompensation(role.compensation)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <span className="mono-micro text-fg-40 tabular-nums">
                        {new Date(app.sentAt).toLocaleDateString()}
                      </span>
                      <span
                        className={
                          app.delivered
                            ? "mono-micro rounded-full border border-signal/40 bg-signal/10 px-2.5 py-1 leading-none text-signal"
                            : "mono-micro rounded-full border border-current/20 px-2.5 py-1 leading-none text-fg-50"
                        }
                      >
                        {app.delivered ? "Sent" : "Not delivered"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-8 max-w-2xl text-[0.88rem] leading-[1.65] text-fg-45">
              This is a record of what this browser sent, not a live status. We
              don&rsquo;t show an interview or offer stage here because nothing
              reports one back to this page — the honest place for that is the
              conversation you&rsquo;ll be having with a person.
            </p>
          </>
        ) : (
          <p className="mt-8 max-w-xl text-[0.95rem] leading-[1.65] text-fg-55">
            Nothing sent from this browser yet.
          </p>
        )}
      </section>
    </div>
  );
}
