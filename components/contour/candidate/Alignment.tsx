"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { alignRole, appearanceReasons, type AlignmentState } from "@/lib/candidate/alignment";
import { completedParts, usePassport } from "@/lib/candidate/passport";
import { formatCompensation, type Role } from "@/lib/candidate/roles";
import { ROLE_PAGE } from "@/lib/contour/content";
import { ROUTES } from "@/lib/contour/site";
import { cx } from "@/lib/utils";

/**
 * "Is this role right for me?" — the live alignment logic, in this direction's
 * language. Named dimensions with reasons, never a score, computed on this
 * device from what the person entered and shared with no one.
 */

const STATE: Record<AlignmentState, { label: string; glyph: string; className: string }> = {
  aligned: { label: "Lines up", glyph: "●", className: "bg-[var(--ct-green-wash)] text-[var(--ct-green-deep)]" },
  partly: { label: "Partly", glyph: "◐", className: "bg-[var(--ct-lime-soft)] text-[var(--ct-ink)]" },
  differs: { label: "Differs", glyph: "○", className: "bg-[var(--ct-bg-2)] text-[var(--ct-ink-2)]" },
  unknown: { label: "Not known", glyph: "·", className: "border text-[var(--ct-mute)]" },
};

export function Alignment({ role }: { role: Role }) {
  const { passport, loaded } = usePassport();
  const alignment = useMemo(() => alignRole(passport, role), [passport, role]);
  const filled = loaded ? completedParts(passport).length : 0;
  const reasons = appearanceReasons(passport, role);
  const hasSignal = passport.functionIds.length > 0 || passport.directionIds.length > 0 || passport.workModelIds.length > 0;

  return (
    <div className="ct-panel overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b px-5 py-4 sm:px-7">
        <h2 id="fit-heading" className="ct-display ct-s">
          {ROLE_PAGE.alignmentTitle}
        </h2>
        <span className="ct-meta ct-mute">{loaded ? `${filled} of 5 Passport sections filled` : "Reading your Passport…"}</span>
      </div>

      <div className="px-5 py-6 sm:px-7">
        {!loaded ? (
          <p className="ct-small">Reading this device…</p>
        ) : alignment.insufficient ? (
          <div>
            <p className="ct-body max-w-2xl">{ROLE_PAGE.alignmentEmpty}</p>
            <Link href={`${ROUTES.profile}?step=experience`} className="ct-btn ct-btn-secondary mt-5">
              Fill in your Passport <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          <>
            <p className="ct-small max-w-2xl">{ROLE_PAGE.alignmentLede}</p>
            <ul className="mt-5">
              {alignment.dimensions.map((d) => (
                <li key={d.id} className="grid gap-2 border-t py-4 sm:grid-cols-[14rem_1fr] sm:gap-6">
                  <div className="flex items-center gap-3">
                    <span className={cx("ct-meta inline-flex min-w-[6.5rem] items-center gap-1.5 rounded-full px-2.5 py-1", STATE[d.state].className)}>
                      <span aria-hidden="true">{STATE[d.state].glyph}</span>
                      {STATE[d.state].label}
                    </span>
                    <span className="text-[0.92rem] font-medium">{d.label}</span>
                  </div>
                  <p className="ct-small text-[var(--ct-ink-2)]">{d.reason}</p>
                </li>
              ))}
            </ul>
          </>
        )}

        {loaded && hasSignal && (
          <div className="mt-6 rounded-[var(--ct-r-m)] bg-[var(--ct-violet-wash)] p-4">
            <p className="ct-meta ct-violet">Why this role appears</p>
            <ul className="mt-2 flex flex-col gap-1">
              {reasons.map((r) => (
                <li key={r} className="text-[0.9rem] text-[var(--ct-ink-2)]">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
        {loaded && !hasSignal && <p className="ct-small mt-6">{ROLE_PAGE.appearsEmpty}</p>}

        <div className="mt-7 border-t pt-6">
          <p className="ct-meta ct-mute">{ROLE_PAGE.questionsLabel}</p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {alignment.questions.map((q) => (
              <li key={q} className="flex gap-3 text-[0.95rem] leading-[1.6]">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ct-violet)]" />
                {q}
              </li>
            ))}
          </ul>
          <p className="ct-small mt-6">{ROLE_PAGE.alignmentPrivate}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * On phones, the application action stays one tap away without covering the
 * page: it appears once the header's own button has scrolled out of view, and
 * steps aside while the application itself is on screen.
 */
export function MobileApplyBar({ role }: { role: Role }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const header = document.getElementById("role-actions");
    const apply = document.getElementById("apply");
    if (!header || !apply) return;
    let headerGone = false;
    let applyShown = false;
    const sync = () => setVisible(headerGone && !applyShown);
    const a = new IntersectionObserver(([e]) => {
      headerGone = !e.isIntersecting && e.boundingClientRect.top < 0;
      sync();
    });
    const b = new IntersectionObserver(([e]) => {
      applyShown = e.isIntersecting;
      sync();
    });
    a.observe(header);
    b.observe(apply);
    return () => {
      a.disconnect();
      b.disconnect();
    };
  }, []);

  return (
    <>
      {/* Reserve the bar's height at the end of the page so it never hides content. */}
      <div aria-hidden="true" className="h-20 md:hidden" />
      <div
        className={cx(
          "fixed inset-x-0 bottom-0 border-t bg-[color-mix(in_oklab,var(--ct-bg)_94%,transparent)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 md:hidden",
          visible ? "translate-y-0" : "translate-y-full",
        )}
        style={{ zIndex: "var(--ct-z-sticky)" }}
        aria-hidden={!visible}
        inert={!visible}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[0.9rem] font-medium">{role.title}</p>
            <p className="font-mono text-[0.78rem] tabular-nums text-[var(--ct-ink-2)]">{formatCompensation(role.compensation)} a year</p>
          </div>
          <a href="#apply" className="ct-btn ct-btn-primary shrink-0">
            Apply <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </>
  );
}
