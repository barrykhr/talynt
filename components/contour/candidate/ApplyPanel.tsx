"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Role } from "@/lib/candidate/roles";
import { usePassport } from "@/lib/candidate/passport";
import { REQUIRE_APPROVED, useCandidateApplications } from "@/lib/candidate/applications";
import { buildAssessment } from "@/lib/assessment/generate";
import { completeness } from "@/lib/assessment/evaluate";
import { APPLICATIONS, APPLY_PANEL } from "@/lib/contour/proposed";
import { EMAIL, ROUTES } from "@/lib/contour/site";

/**
 * Applying from a role page. The profile comes from the candidate's one
 * profile; the application adds what is specific to this role. Starting it
 * builds the role's assessment once and goes straight to it.
 */
export function ApplyPanel({ role }: { role: Role }) {
  const { passport, loaded: passportLoaded } = usePassport();
  const { find, start, loaded } = useCandidateApplications();
  const [starting, setStarting] = useState(false);
  const existing = find(role.slug);

  // What the assessment would look like for this person, without creating anything.
  const preview = useMemo(
    () =>
      buildAssessment({
        role,
        profile: passport,
        profileVersion: null,
        applicationId: "preview",
        assessmentId: "preview",
        now: "",
        requireApproved: REQUIRE_APPROVED,
      }),
    [role, passport],
  );

  if (!loaded || !passportLoaded) return <div aria-busy="true" className="ct-panel h-56 animate-pulse" />;

  if (existing) {
    const answered = existing.assessment ? completeness(existing.assessment, existing.responses) : null;
    const sent = Boolean(existing.submittedAt);
    return (
      <div className="ct-panel p-6 sm:p-8">
        <p className="ct-meta ct-green">{sent ? (existing.delivered ? APPLICATIONS.sent : APPLICATIONS.notDelivered) : APPLICATIONS.draft}</p>
        <p className="ct-body mt-3 text-[var(--ct-ink)]">
          {sent
            ? `Sent on ${new Date(existing.submittedAt!).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
            : `${APPLICATIONS.started} ${new Date(existing.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}${answered ? ` · ${APPLICATIONS.answered(answered.answered, answered.total)}` : ""}.`}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={sent ? ROUTES.application(role.slug) : ROUTES.assessment(role.slug)} className="ct-btn ct-btn-primary">
            {sent ? APPLY_PANEL.view : APPLY_PANEL.continue} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!passport.profileId) {
    return (
      <div className="ct-panel p-6 sm:p-8">
        <p className="ct-body text-[var(--ct-ink)]">{APPLY_PANEL.needProfile}</p>
        <Link href={`${ROUTES.profile}?role=${encodeURIComponent(role.slug)}`} className="ct-btn ct-btn-primary mt-6">
          {APPLY_PANEL.createProfile} <span aria-hidden="true">→</span>
        </Link>
        {preview.ok && <Assesses labels={preview.assessment.competencies.map((c) => c.label)} />}
      </div>
    );
  }

  return (
    <div className="ct-panel grid gap-0 md:grid-cols-2">
      <div className="border-b p-6 sm:p-8 md:border-r md:border-b-0">
        <p className="ct-meta ct-mute">{APPLY_PANEL.usingProfile}</p>
        <p className="ct-display ct-s mt-3">{passport.name}</p>
        <p className="ct-small mt-1">{passport.headline}</p>
        <Link href={ROUTES.profile} className="ct-link mt-4 inline-block text-[0.92rem]">
          Review my profile
        </Link>
      </div>
      <div className="p-6 sm:p-8">
        <p className="ct-meta ct-mute">{APPLY_PANEL.includes}</p>
        <ul className="mt-3 flex flex-col gap-2 text-[0.96rem]">
          <li>{APPLY_PANEL.why}</li>
          {preview.ok ? <li>{APPLY_PANEL.assessment(preview.assessment.questions.length)}</li> : null}
        </ul>
        {preview.ok ? (
          <>
            <Assesses labels={preview.assessment.competencies.map((c) => c.label)} />
            <button
              type="button"
              disabled={starting}
              onClick={() => {
                setStarting(true);
                start(role, passport);
                // A full page load: it works the same on the server-rendered site and the static copy.
                window.location.assign(ROUTES.assessment(role.slug));
              }}
              className="ct-btn ct-btn-primary mt-6"
            >
              {APPLY_PANEL.start} <span aria-hidden="true">→</span>
            </button>
          </>
        ) : (
          <p className="ct-small mt-4" role="status">
            {APPLY_PANEL.unavailable}{" "}
            <a href={`mailto:${EMAIL.talent}?subject=${encodeURIComponent(role.slug)}`} className="ct-link">
              {EMAIL.talent}
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}

function Assesses({ labels }: { labels: string[] }) {
  return (
    <div className="mt-5">
      <p className="ct-meta ct-mute">{APPLY_PANEL.assesses}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {labels.map((l) => (
          <li key={l} className="ct-tag">
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}
