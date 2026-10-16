"use client";

import Link from "next/link";
import { useState } from "react";
import { PASSPORT_PARTS, partComplete, usePassport, type PassportPartId } from "@/lib/candidate/passport";
import { useApplications, useSavedRoles } from "@/lib/candidate/saved";
import { formatCompensation, roleBySlug } from "@/lib/candidate/roles";
import {
  AVAILABILITY,
  COMPANY_STAGES,
  DIRECTIONS,
  EXPERIENCE_BANDS,
  FUNCTIONS,
  LOCATIONS,
  VALUES,
  WORK_MODELS,
  labelFor,
  labelsFor,
} from "@/lib/candidate/taxonomy";
import { CAREER_ARC, PASSPORT } from "@/lib/contour/content";
import { ROUTES } from "@/lib/contour/site";
import { cx } from "@/lib/utils";

/**
 * Everything this browser holds, in one place, and nothing it doesn't.
 *
 * The Passport is read as past, present and future. Applications show only
 * the two states this page can honestly know — sent, or not delivered — and
 * saved roles are bookmarks no company sees. All of it can be erased here.
 */

const STEP_FOR: Record<PassportPartId, string> = {
  about: "you",
  experience: "experience",
  direction: "preferences",
  preferences: "preferences",
  values: "preferences",
};

export function Dashboard() {
  const { passport, clear, loaded } = usePassport();
  const { saved, toggle } = useSavedRoles();
  const { applications } = useApplications();
  const [confirmErase, setConfirmErase] = useState(false);

  if (!loaded) {
    return (
      <p className="ct-meta ct-mute py-16" role="status">
        Reading this device…
      </p>
    );
  }

  const done = PASSPORT_PARTS.filter((p) => partComplete(passport, p.id));
  const empty = done.length === 0 && !passport.name && !passport.email;
  const dash = "—";

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
      {/* --- The Passport --------------------------------------------------- */}
      <section className="lg:col-span-8" aria-labelledby="passport-heading">
        <div className="ct-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 sm:px-7">
            <h2 id="passport-heading" className="ct-display ct-s">
              Career Passport
            </h2>
            <Link href={ROUTES.profile} className="ct-btn ct-btn-secondary min-h-10 text-[0.9rem]">
              {empty ? "Start it" : "Edit"} <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Completeness, never quality. */}
          <ol className="flex flex-wrap gap-x-5 gap-y-2 border-b px-5 py-3 sm:px-7" aria-label="Passport sections">
            {PASSPORT_PARTS.map((part) => {
              const complete = partComplete(passport, part.id);
              return (
                <li key={part.id}>
                  <Link
                    href={`${ROUTES.profile}?step=${STEP_FOR[part.id]}`}
                    className={cx("ct-meta inline-flex min-h-8 items-center gap-1.5", complete ? "ct-green" : "ct-mute hover:text-[var(--ct-ink)]")}
                  >
                    <span aria-hidden="true">{complete ? "●" : "○"}</span>
                    {part.label}
                    <span className="sr-only">{complete ? " — filled in" : " — not filled in yet"}</span>
                  </Link>
                </li>
              );
            })}
            <li className="ct-meta ct-mute ml-auto tabular-nums">
              {done.length} of {PASSPORT_PARTS.length}
            </li>
          </ol>

          {empty ? (
            <div className="px-5 py-10 sm:px-7">
              <p className="ct-display ct-m">Nothing here yet.</p>
              <p className="ct-body mt-3 max-w-xl">
                Your Career Passport takes about eight minutes. It stays on this device until you send it with a role you
                choose.
              </p>
              <Link href={ROUTES.profile} className="ct-btn ct-btn-primary mt-6">
                Build your Career Passport <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-3">
              {/* Past */}
              <Column label={CAREER_ARC.stages[0].label} title={CAREER_ARC.stages[0].title}>
                {passport.experience.length > 0 ? (
                  <ul className="flex flex-col gap-3">
                    {passport.experience.map((e) => (
                      <li key={e.id}>
                        <p className="text-[0.95rem]">{e.title || "Untitled role"}</p>
                        <p className="ct-small text-[0.82rem]">
                          {[e.organisation, e.from && `${e.from}–${e.to || "now"}`].filter(Boolean).join(" · ") || dash}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ct-small">No roles added.</p>
                )}
                <Item label="CV" value={passport.resume ? passport.resume.name : "Not attached"} />
                <Item label="Skills" value={passport.skills.join(", ") || dash} />
              </Column>

              {/* Present */}
              <Column label={CAREER_ARC.stages[1].label} title={CAREER_ARC.stages[1].title} present>
                <Item label="Name" value={passport.name || dash} />
                <Item label="Headline" value={passport.headline || dash} />
                <Item label="Based in" value={passport.currentLocationId ? labelFor(LOCATIONS, passport.currentLocationId) : dash} />
                <Item label="Level" value={passport.bandId ? labelFor(EXPERIENCE_BANDS, passport.bandId) : dash} />
                <Item label="What you do" value={labelsFor(FUNCTIONS, passport.functionIds).join(", ") || dash} />
                <Item label="Could start" value={passport.availabilityId ? labelFor(AVAILABILITY, passport.availabilityId) : dash} />
              </Column>

              {/* Future */}
              <Column label={CAREER_ARC.stages[2].label} title={CAREER_ARC.stages[2].title}>
                <Item label="Direction" value={labelsFor(DIRECTIONS, passport.directionIds).join(", ") || dash} />
                <Item label="How you’d work" value={labelsFor(WORK_MODELS, passport.workModelIds).join(", ") || dash} />
                <Item label="Where" value={labelsFor(LOCATIONS, passport.preferredLocationIds).join(", ") || dash} />
                <Item label="Stage" value={labelsFor(COMPANY_STAGES, passport.stageIds).join(", ") || dash} />
                <Item
                  label="What matters"
                  value={labelsFor(VALUES, passport.valueIds).map((v, i) => `${i + 1}. ${v}`).join("  ") || dash}
                />
                <Item label="Compensation" value={passport.compensationExpectation || dash} />
              </Column>
            </div>
          )}
        </div>

        {/* Alerts and data, in the approved words. */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="ct-panel p-5 sm:p-6">
            <p className="ct-meta ct-mute">Talent alerts · {PASSPORT.alertsLabel}</p>
            <p className="ct-small mt-3 text-[var(--ct-ink-2)]">{PASSPORT.alertsBody}</p>
          </div>
          <div className="ct-panel p-5 sm:p-6">
            <p className="ct-meta ct-mute">Your data</p>
            <p className="ct-small mt-3 text-[var(--ct-ink-2)]">{PASSPORT.dataBody}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3" aria-live="polite">
              {confirmErase ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      clear();
                      setConfirmErase(false);
                    }}
                    className="ct-btn ct-btn-primary min-h-10 text-[0.9rem]"
                  >
                    {PASSPORT.eraseConfirm}
                  </button>
                  <button type="button" onClick={() => setConfirmErase(false)} className="ct-btn ct-btn-quiet min-h-10 text-[0.9rem]">
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmErase(true)} disabled={empty} className="ct-btn ct-btn-secondary min-h-10 text-[0.9rem]">
                  {PASSPORT.erase}
                </button>
              )}
              {passport.updatedAt && (
                <span className="ct-meta ct-mute">Last saved {new Date(passport.updatedAt).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- What this device sent and saved -------------------------------- */}
      <div className="flex flex-col gap-6 lg:col-span-4">
        <section className="ct-panel" aria-labelledby="sent-heading">
          <div className="flex items-baseline justify-between gap-3 border-b px-5 py-4">
            <h2 id="sent-heading" className="ct-display ct-s">
              Applications
            </h2>
            <span className="ct-meta ct-mute tabular-nums">{applications.length}</span>
          </div>
          {applications.length > 0 ? (
            <ul className="px-5">
              {applications.map((app) => {
                const role = roleBySlug(app.slug);
                if (!role) return null;
                return (
                  <li key={app.slug} className="flex flex-col gap-2 border-t py-4 first:border-t-0">
                    <Link href={ROUTES.role(role.slug)} className="text-[0.98rem] hover:text-[var(--ct-green)]">
                      {role.title}
                    </Link>
                    <div className="flex items-center justify-between gap-3">
                      <span className="ct-meta ct-mute tabular-nums">{new Date(app.sentAt).toLocaleDateString()}</span>
                      <span
                        className={cx(
                          "ct-meta rounded-full px-2.5 py-1",
                          app.delivered ? "bg-[var(--ct-green-wash)] text-[var(--ct-green-deep)]" : "bg-[var(--ct-bg-2)] text-[var(--ct-ink-2)]",
                        )}
                      >
                        {app.delivered ? "Sent" : "Not delivered"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="ct-small px-5 py-5">Nothing sent from this browser yet.</p>
          )}
          <p className="ct-small border-t px-5 py-4 text-[0.82rem]">{PASSPORT.sentNote}</p>
        </section>

        <section className="ct-panel" aria-labelledby="saved-heading">
          <div className="flex items-baseline justify-between gap-3 border-b px-5 py-4">
            <h2 id="saved-heading" className="ct-display ct-s">
              Saved roles
            </h2>
            <span className="ct-meta ct-mute tabular-nums">{saved.length}</span>
          </div>
          {saved.length > 0 ? (
            <ul className="px-5">
              {saved.map((slug) => {
                const role = roleBySlug(slug);
                if (!role) return null;
                return (
                  <li key={slug} className="flex items-start justify-between gap-3 border-t py-4 first:border-t-0">
                    <div>
                      <Link href={ROUTES.role(role.slug)} className="text-[0.98rem] hover:text-[var(--ct-green)]">
                        {role.title}
                      </Link>
                      <p className="ct-small text-[0.82rem]">
                        {role.company} · {formatCompensation(role.compensation)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(slug)}
                      className="ct-btn ct-btn-quiet min-h-9 shrink-0 text-[0.85rem] text-[var(--ct-mute)]"
                      aria-label={`Remove ${role.title} from saved roles`}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-5 py-5">
              <p className="ct-small">{PASSPORT.savedEmpty}</p>
              <Link href={ROUTES.opportunities} className="ct-link mt-3 inline-block text-[0.92rem]">
                Read the open roles →
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Column({
  label,
  title,
  present = false,
  children,
}: {
  label: string;
  title: string;
  present?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("flex flex-col gap-4 border-t px-5 py-6 sm:px-7 md:border-t-0 md:border-l md:first:border-l-0", present && "bg-[var(--ct-bg)]")}>
      <div>
        <p className="ct-meta flex items-center gap-2">
          {present && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--ct-signal)]" />}
          <span className={present ? "text-[var(--ct-ink)]" : "ct-mute"}>{label}</span>
        </p>
        <p className="ct-display mt-1 text-[1.2rem]">{title}</p>
      </div>
      {children}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="ct-meta ct-mute text-[0.65rem]">{label}</p>
      <p className="mt-0.5 text-[0.92rem] leading-snug break-words">{value}</p>
    </div>
  );
}
