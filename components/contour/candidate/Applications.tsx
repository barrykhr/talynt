"use client";

import Link from "next/link";
import { useState } from "react";
import { ROLES, roleBySlug, type Role } from "@/lib/candidate/roles";
import { usePassport } from "@/lib/candidate/passport";
import { useSavedRoles } from "@/lib/candidate/saved";
import { assessmentState, useCandidateApplications, type CandidateApplication } from "@/lib/candidate/applications";
import { completeness } from "@/lib/assessment/evaluate";
import { profileVersion } from "@/lib/assessment/profile";
import { APPLY, PASSPORT } from "@/lib/contour/content";
import { APPLICATIONS, ASSESSMENT, PROFILE } from "@/lib/contour/proposed";
import { EMAIL, ROUTES } from "@/lib/contour/site";
import { cx } from "@/lib/utils";
import { Answers } from "./AssessmentRunner";
import { RoleRow } from "./RoleRow";

const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function statusOf(a: CandidateApplication): { label: string; tone: "green" | "mute" | "violet" } {
  if (a.submittedAt) return a.delivered ? { label: APPLICATIONS.sent, tone: "green" } : { label: APPLICATIONS.notDelivered, tone: "mute" };
  return { label: APPLICATIONS.draft, tone: "violet" };
}

/** Every application on this device, the profile they share, and saved roles. */
export function ApplicationsList() {
  const { applications, loaded } = useCandidateApplications();
  const { passport, loaded: passportLoaded } = usePassport();
  const { saved } = useSavedRoles();

  if (!loaded || !passportLoaded) return <div aria-busy="true" className="ct-panel h-64 animate-pulse" />;

  const savedRoles = ROLES.filter((r) => saved.includes(r.slug) && !applications.some((a) => a.roleSlug === r.slug));

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
      <section aria-labelledby="apps-heading" className="lg:col-span-8">
        <h2 id="apps-heading" className="sr-only">
          Applications
        </h2>
        {applications.length === 0 ? (
          <div className="ct-panel p-6">
            <p className="ct-body">{APPLICATIONS.empty}</p>
            <Link href={ROUTES.opportunities} className="ct-btn ct-btn-primary mt-5">
              Explore opportunities <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col">
            {applications.map((a) => {
              const role = roleBySlug(a.roleSlug);
              if (!role) return null;
              const status = statusOf(a);
              const answered = a.assessment ? completeness(a.assessment, a.responses) : null;
              const outOfDate = !a.submittedAt && assessmentState(a, role) === "out-of-date";
              return (
                <li key={a.id} className="grid gap-3 border-t py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
                  <div>
                    <p className={cx("ct-meta", status.tone === "green" ? "ct-green" : status.tone === "violet" ? "ct-violet" : "ct-mute")}>
                      {status.label}
                      {outOfDate && " · assessment needs refreshing"}
                    </p>
                    <p className="ct-display ct-s mt-2">{role.title}</p>
                    <p className="ct-small mt-1">
                      {role.company} · {APPLICATIONS.started} {date(a.createdAt)}
                      {a.submittedAt ? ` · sent ${date(a.submittedAt)}` : answered ? ` · ${APPLICATIONS.answered(answered.answered, answered.total)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!a.submittedAt && (
                      <Link href={ROUTES.assessment(role.slug)} className="ct-btn ct-btn-primary min-h-10 text-[0.9rem]">
                        {APPLICATIONS.continue} <span className="sr-only">{role.title}</span>
                      </Link>
                    )}
                    <Link href={ROUTES.application(role.slug)} className="ct-btn ct-btn-secondary min-h-10 text-[0.9rem]">
                      {APPLICATIONS.view} <span className="sr-only">{role.title}</span>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="ct-small mt-6 max-w-2xl">{PASSPORT.sentNote}</p>
        <p className="ct-small mt-3 max-w-2xl">{PASSPORT.savedLede}</p>

        {savedRoles.length > 0 && (
          <section aria-labelledby="saved-heading" className="mt-14">
            <p className="ct-meta ct-violet">{APPLICATIONS.savedTitle}</p>
            <h2 id="saved-heading" className="ct-display ct-m mt-3">
              {PASSPORT.savedTitle} <span className="ct-italic">{PASSPORT.savedTitleItalic}</span>
            </h2>
            <div className="mt-4">
              {savedRoles.map((r) => (
                <RoleRow key={r.slug} role={r} />
              ))}
            </div>
          </section>
        )}
      </section>

      <div className="lg:col-span-4">
        <div className="ct-panel p-6">
          <h2 id="apps-profile-heading" className="ct-meta ct-mute">
            {APPLICATIONS.profileTitle}
          </h2>
          {passport.profileId ? (
            <>
              <p className="ct-display ct-s mt-3">{passport.name}</p>
              <p className="ct-small mt-1">{passport.headline}</p>
              <p className="ct-meta ct-mute mt-4 tabular-nums">
                {PROFILE.version} {profileVersion(passport)}
              </p>
              <Link href={ROUTES.profile} className="ct-btn ct-btn-secondary mt-5 min-h-10 text-[0.9rem]">
                Review my profile
              </Link>
            </>
          ) : (
            <>
              <p className="ct-body mt-3">You haven’t created your profile yet. Every application starts from it.</p>
              <Link href={ROUTES.profile} className="ct-btn ct-btn-primary mt-5 min-h-10 text-[0.9rem]">
                Create my profile
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** One application: where it is, what was sent, and what comes next. */
export function ApplicationDetail({ role }: { role: Role }) {
  const { find, loaded, discard } = useCandidateApplications();
  const [confirm, setConfirm] = useState(false);
  const a = find(role.slug);

  if (!loaded) return <div aria-busy="true" className="ct-panel h-64 animate-pulse" />;
  if (!a) {
    return (
      <div className="ct-panel p-6">
        <p className="ct-body">{ASSESSMENT.notStarted}</p>
        <Link href={`${ROUTES.role(role.slug)}#apply`} className="ct-btn ct-btn-primary mt-5">
          {ASSESSMENT.startFromRole} <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  const answered = a.assessment ? completeness(a.assessment, a.responses) : null;
  const status = statusOf(a);
  const timeline: Array<{ label: string; detail: string; done: boolean }> = [
    { label: "Application started", detail: date(a.createdAt), done: true },
    {
      label: "Assessment",
      detail: a.assessment ? (answered ? APPLICATIONS.answered(answered.answered, answered.total) : "") : a.unavailable?.reason ?? "",
      done: Boolean(answered?.complete),
    },
    {
      label: a.submittedAt ? (a.delivered ? "Sent to TALYNT" : "Not delivered — email it instead") : "Not sent yet",
      detail: a.submittedAt ? date(a.submittedAt) : "",
      done: Boolean(a.submittedAt && a.delivered),
    },
  ];

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-7">
        <section aria-labelledby="timeline-heading">
          <h2 id="timeline-heading" className="ct-meta ct-mute">
            {APPLICATIONS.timeline}
          </h2>
          <ol className="mt-4 flex flex-col">
            {timeline.map((t) => (
              <li key={t.label} className="grid grid-cols-[1.5rem_1fr] gap-3 border-t py-4">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-2.5 w-2.5 rounded-full border"
                  style={{ backgroundColor: t.done ? "var(--ct-green)" : "transparent", ["--ct-bc" as string]: t.done ? "var(--ct-green)" : "var(--ct-line-2)" }}
                />
                <span>
                  <span className="block text-[1rem]">
                    {t.label}
                    <span className="sr-only">{t.done ? " (done)" : ""}</span>
                  </span>
                  {t.detail && <span className="ct-small block">{t.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
          {!a.submittedAt && (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={ROUTES.assessment(role.slug)} className="ct-btn ct-btn-primary">
                {APPLICATIONS.continue} <span aria-hidden="true">→</span>
              </Link>
              {!confirm ? (
                <button type="button" onClick={() => setConfirm(true)} className="ct-btn ct-btn-quiet text-[var(--ct-mute)]">
                  {APPLICATIONS.discard}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    discard(role.slug);
                    window.location.assign(ROUTES.applications);
                  }}
                  className="ct-btn ct-btn-secondary"
                >
                  {APPLICATIONS.discardConfirm}
                </button>
              )}
            </div>
          )}
          {a.submittedAt && !a.delivered && (
            <p className="ct-small mt-6 max-w-2xl">
              {APPLY.notDeliveredBody}{" "}
              <a href={`mailto:${EMAIL.talent}?subject=${encodeURIComponent(role.slug)}`} className="ct-link">
                {EMAIL.talent}
              </a>{" "}
              with “{role.slug}” in the subject line and it reaches the same person.
            </p>
          )}
        </section>

        {a.submittedAt && a.assessment && (
          <section aria-labelledby="sent-answers-heading" className="mt-14">
            <h2 id="sent-answers-heading" className="ct-display ct-m">
              What you sent
            </h2>
            <p className="ct-meta ct-mute mt-3 tabular-nums">
              {APPLICATIONS.sentWith} {APPLICATIONS.profileVersion} {a.sentProfileVersion} · {APPLICATIONS.requirementsVersion} {a.assessment.requirementsVersion} ·{" "}
              {APPLICATIONS.rubricVersion} {a.assessment.rubricVersion}
            </p>
            <div className="mt-6">
              <Answers app={a} questions={a.assessment.questions} />
            </div>
          </section>
        )}
      </div>

      <div className="lg:col-span-5">
        <div className="ct-panel p-6">
          <p className={cx("ct-meta", status.tone === "green" ? "ct-green" : status.tone === "violet" ? "ct-violet" : "ct-mute")}>{status.label}</p>
          <h2 id="next-heading" className="ct-display ct-s mt-3">
            {APPLICATIONS.nextStep}
          </h2>
          <ol className="mt-4 flex flex-col">
            {role.process.map((p, i) => (
              <li key={p.step} className="grid grid-cols-[1.75rem_1fr] gap-2 border-t py-3 first:border-t-0 first:pt-0">
                <span className="ct-meta ct-green tabular-nums pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block text-[0.95rem]">{p.step}</span>
                  <span className="ct-small block text-[0.86rem]">{p.detail}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="ct-small mt-4">{PASSPORT.sentNote}</p>
        </div>
      </div>
    </div>
  );
}
