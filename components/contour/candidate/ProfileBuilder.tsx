"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePassport, type Passport } from "@/lib/candidate/passport";
import { randomId, useCandidateApplications } from "@/lib/candidate/applications";
import { roleBySlug } from "@/lib/candidate/roles";
import { AVAILABILITY, DIRECTIONS, EXPERIENCE_BANDS, FUNCTIONS, LOCATIONS, WORK_MODELS, labelFor, labelsFor } from "@/lib/candidate/taxonomy";
import { profileVersion } from "@/lib/assessment/profile";
import { PASSPORT } from "@/lib/contour/content";
import { PROFILE } from "@/lib/contour/proposed";
import { ROUTES } from "@/lib/contour/site";
import { cx } from "@/lib/utils";
import { Choices, TagField, TextArea, TextField } from "./Fields";
import { EducationList, ExperienceList, ResumeField } from "./ProfileParts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Errors = Partial<Record<"name" | "email" | "headline", string>>;

function validateAbout(p: Passport): Errors {
  const e: Errors = {};
  if (!p.name.trim()) e.name = "Your name, so a person can reply to you.";
  if (!p.email.trim()) e.email = "An email we can reply to.";
  else if (!EMAIL_RE.test(p.email.trim())) e.email = "That email address doesn’t look right.";
  if (!p.headline.trim()) e.headline = "One line in your own words.";
  return e;
}

/**
 * The reusable profile: created once, then managed. It is the Career Passport —
 * one document on this device — with a random profile id assigned the first
 * time it is saved, so applications can say which profile they came from.
 */
export function ProfileBuilder() {
  const { passport, update, clear, loaded } = usePassport();
  const { applications } = useCandidateApplications();
  const params = useSearchParams();
  const returnRole = roleBySlug(params.get("role") ?? "");

  const [mode, setMode] = useState<"auto" | "build" | "manage">("auto");
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [justSaved, setJustSaved] = useState(false);
  const [confirmErase, setConfirmErase] = useState(false);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const savedBanner = useRef<HTMLDivElement | null>(null);
  const shownStep = useRef<number | null>(null);

  const exists = Boolean(passport.profileId);
  const view = mode === "auto" ? (exists ? "manage" : "build") : mode;
  const version = useMemo(() => profileVersion(passport), [passport]);
  const usedBy = applications.length;

  // Saving moves focus to the confirmation, which also brings it into view.
  useEffect(() => {
    if (justSaved) savedBanner.current?.focus();
  }, [justSaved]);

  // Move focus to the step's heading when the step changes — not on first render.
  useEffect(() => {
    if (view !== "build") return;
    if (shownStep.current !== null && shownStep.current !== step) heading.current?.focus();
    shownStep.current = step;
  }, [step, view]);

  if (!loaded) {
    return <div aria-busy="true" className="ct-panel h-64 animate-pulse" />;
  }

  const steps = PROFILE.steps;
  const current = steps[step];

  function next() {
    if (current.id === "about") {
      const found = validateAbout(passport);
      setErrors(found);
      const first = Object.keys(found)[0];
      if (first) {
        document.getElementById(`profile-${first}`)?.focus();
        return;
      }
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function save() {
    const found = validateAbout(passport);
    setErrors(found);
    if (Object.keys(found).length) {
      setStep(steps.findIndex((s) => s.id === "about"));
      return;
    }
    update({ profileId: passport.profileId || randomId("prof") });
    setJustSaved(true);
    setMode("manage");
  }

  /* --- Manage ------------------------------------------------------------ */
  if (view === "manage") {
    const sections: Array<{ step: number; title: string; lines: string[] }> = [
      { step: 0, title: "CV", lines: [passport.resume ? `${passport.resume.name} · on this device` : "None attached"] },
      {
        step: 1,
        title: "About you",
        lines: [
          passport.name,
          passport.email,
          passport.headline,
          [labelFor(LOCATIONS, passport.currentLocationId), labelsFor(FUNCTIONS, passport.functionIds).join(", "), labelFor(EXPERIENCE_BANDS, passport.bandId)].filter(Boolean).join(" · "),
        ].filter(Boolean),
      },
      {
        step: 2,
        title: "Experience",
        lines: passport.experience.length ? passport.experience.map((e) => [e.title, e.organisation, [e.from, e.to].filter(Boolean).join("–")].filter(Boolean).join(", ")) : ["None added"],
      },
      {
        step: 3,
        title: "Skills and education",
        lines: [
          passport.skills.length ? passport.skills.join(", ") : "No skills added",
          ...passport.education.map((e) => [e.qualification, e.institution, e.year].filter(Boolean).join(", ")),
          ...(passport.certifications.length ? [passport.certifications.join(", ")] : []),
        ],
      },
      {
        step: 4,
        title: "Preferences",
        lines: [
          labelsFor(WORK_MODELS, passport.workModelIds).join(", ") || "No work model chosen",
          labelFor(AVAILABILITY, passport.availabilityId),
          labelsFor(DIRECTIONS, passport.directionIds).join(", "),
        ].filter(Boolean),
      },
    ];

    return (
      <div className="flex flex-col gap-10">
        {justSaved && (
          <div ref={savedBanner} tabIndex={-1} role="status" className="ct-panel scroll-mt-[calc(var(--ct-nav-h)+1rem)] p-6 outline-none sm:p-8" style={{ backgroundColor: "var(--ct-green-wash)", ["--ct-bc" as string]: "var(--ct-green)" }}>
            <p className="ct-meta ct-green">Saved</p>
            <p className="ct-display ct-m mt-3">{PROFILE.savedTitle}</p>
            <p className="ct-body mt-3 max-w-2xl">{PROFILE.savedBody}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {returnRole ? (
                <Link href={`${ROUTES.role(returnRole.slug)}#apply`} className="ct-btn ct-btn-primary">
                  {PROFILE.continueTo} {returnRole.title} <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <Link href={ROUTES.opportunities} className="ct-btn ct-btn-primary">
                  Explore opportunities <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
          <section aria-labelledby="profile-manage-heading" className="lg:col-span-7">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="profile-manage-heading" className="ct-display ct-m">
                {PROFILE.manageTitle}
              </h2>
              <p className="ct-meta ct-mute tabular-nums">
                {PROFILE.version} {version}
                {passport.updatedAt && (
                  <>
                    {" "}
                    · {PROFILE.updated} {new Date(passport.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </>
                )}
              </p>
            </div>
            <dl className="mt-6">
              {sections.map((s) => (
                <div key={s.title} className="grid gap-2 border-t py-5 sm:grid-cols-[11rem_1fr_auto] sm:gap-6">
                  <dt className="ct-meta ct-mute pt-1">{s.title}</dt>
                  <dd className="flex flex-col gap-1">
                    {s.lines.map((line, i) => (
                      <span key={`${s.title}-${i}`} className={i === 0 ? "text-[1rem]" : "ct-small"}>
                        {line}
                      </span>
                    ))}
                  </dd>
                  <dd>
                    <button
                      type="button"
                      className="ct-btn ct-btn-quiet min-h-10 text-[0.9rem]"
                      onClick={() => {
                        setJustSaved(false);
                        setMode("build");
                        setStep(s.step);
                      }}
                    >
                      {PROFILE.edit} <span className="sr-only">{s.title}</span>
                    </button>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="lg:col-span-5">
            <div className="ct-panel p-6">
              <h2 id="profile-shared-heading" className="ct-display ct-s">
                {PROFILE.sharedTitle}
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {[PROFILE.sharedAlways, PROFILE.sharedChoice, PROFILE.sharedNever].map((line) => (
                  <li key={line} className="ct-small border-t pt-3 first:border-t-0 first:pt-0">
                    {line}
                  </li>
                ))}
              </ul>
              <p className="ct-meta ct-mute mt-5">
                {PROFILE.usedBy} {usedBy} {usedBy === 1 ? "application" : "applications"} on this device ·{" "}
                <Link href={ROUTES.applications} className="ct-link">
                  see them
                </Link>
              </p>
            </div>
            <div className="mt-6 border-t pt-6">
              <p className="ct-small">{PASSPORT.dataBody}</p>
              {!confirmErase ? (
                <button type="button" onClick={() => setConfirmErase(true)} className="ct-btn ct-btn-quiet mt-3 min-h-10 text-[0.9rem] text-[var(--ct-mute)]">
                  {PROFILE.erase}
                </button>
              ) : (
                <div className="mt-3 flex flex-col gap-3" role="group" aria-label="Confirm erasing your profile">
                  <p className="ct-small">{PROFILE.eraseNote}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        clear();
                        setConfirmErase(false);
                        setJustSaved(false);
                        setMode("auto");
                        setStep(0);
                      }}
                      className="ct-btn ct-btn-secondary min-h-10 text-[0.9rem]"
                    >
                      {PASSPORT.eraseConfirm}
                    </button>
                    <button type="button" onClick={() => setConfirmErase(false)} className="ct-btn ct-btn-quiet min-h-10 text-[0.9rem]">
                      Keep it
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* --- Build ------------------------------------------------------------- */
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
      <nav aria-label="Profile steps" className="lg:col-span-3">
        <ol className="ct-rail flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {steps.map((s, i) => (
            <li key={s.id} className="shrink-0">
              <button
                type="button"
                onClick={() => (i <= step || exists ? setStep(i) : undefined)}
                aria-current={i === step ? "step" : undefined}
                disabled={i > step && !exists}
                className={cx(
                  "relative flex min-h-10 items-center gap-3 rounded-[var(--ct-r-s)] px-3 py-2 text-left text-[0.92rem] transition-colors",
                  i === step ? "bg-[var(--ct-green-wash)] text-[var(--ct-ink)]" : "text-[var(--ct-mute)] hover:text-[var(--ct-ink)] disabled:hover:text-[var(--ct-mute)]",
                )}
              >
                <span className={cx("ct-meta tabular-nums", i <= step ? "ct-green" : "ct-mute")}>{String(i + 1).padStart(2, "0")}</span>
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <section aria-labelledby="profile-step-heading" className="lg:col-span-8 lg:col-start-5">
        <p className="ct-meta ct-mute tabular-nums">
          Step {step + 1} of {steps.length}
        </p>
        <h2 id="profile-step-heading" ref={heading} tabIndex={-1} className="ct-display ct-m mt-3">
          {current.label}
        </h2>
        <p className="ct-body mt-3 max-w-2xl">{current.intro}</p>

        <div className="mt-8 flex flex-col gap-8">
          {current.id === "cv" && <ResumeField />}

          {current.id === "about" && (
            <>
              {Object.keys(errors).length > 0 && (
                <p role="alert" className="ct-error">
                  A few details are needed before you continue.
                </p>
              )}
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField id="profile-name" label="Name" value={passport.name} onChange={(name) => update({ name })} required autoComplete="name" error={errors.name} />
                <TextField id="profile-email" label="Email" type="email" value={passport.email} onChange={(email) => update({ email })} required autoComplete="email" error={errors.email} />
              </div>
              <TextField id="profile-headline" label="In a line" value={passport.headline} onChange={(headline) => update({ headline })} required hint={PASSPORT.headlineHint} error={errors.headline} />
              <Choices id="profile-location" legend="Where you are now" options={LOCATIONS} selected={passport.currentLocationId ? [passport.currentLocationId] : []} onChange={(ids) => update({ currentLocationId: ids[0] ?? "" })} multiple={false} />
              <Choices id="profile-function" legend="What you do" options={FUNCTIONS} selected={passport.functionIds} onChange={(functionIds) => update({ functionIds })} max={3} />
              <Choices id="profile-band" legend="Experience" options={EXPERIENCE_BANDS} selected={passport.bandId ? [passport.bandId] : []} onChange={(ids) => update({ bandId: ids[0] ?? "" })} multiple={false} hint={PASSPORT.levelHint} />
            </>
          )}

          {current.id === "experience" && <ExperienceList />}

          {current.id === "skills" && (
            <>
              <TagField id="profile-skills" label="Skills" values={passport.skills} onChange={(skills) => update({ skills })} hint={PASSPORT.skillsHint} />
              <EducationList />
              <TagField id="profile-certifications" label={PROFILE.certificationsLabel} values={passport.certifications} onChange={(certifications) => update({ certifications })} hint={PROFILE.certificationsHint} />
            </>
          )}

          {current.id === "preferences" && (
            <>
              <p className="ct-display ct-s">
                {PASSPORT.title} <span className="ct-italic">{PASSPORT.titleItalic}</span>
              </p>
              <Choices id="profile-work" legend="How you want to work" options={WORK_MODELS} selected={passport.workModelIds} onChange={(workModelIds) => update({ workModelIds })} />
              <Choices id="profile-availability" legend="When you could start" options={AVAILABILITY} selected={passport.availabilityId ? [passport.availabilityId] : []} onChange={(ids) => update({ availabilityId: ids[0] ?? "" })} multiple={false} />
              <Choices id="profile-direction" legend="Where you want your career to go" options={DIRECTIONS} selected={passport.directionIds} onChange={(directionIds) => update({ directionIds })} max={3} hint={PASSPORT.directionLede} />
              <TextArea id="profile-direction-note" label={PASSPORT.directionNoteLabel} value={passport.directionNote} onChange={(directionNote) => update({ directionNote })} rows={3} hint={PASSPORT.directionNoteHint} />
            </>
          )}

          {current.id === "review" && (
            <dl className="ct-panel divide-y">
              {[
                ["Name", passport.name],
                ["Email", passport.email],
                ["In a line", passport.headline],
                ["Where you are", labelFor(LOCATIONS, passport.currentLocationId)],
                ["What you do", labelsFor(FUNCTIONS, passport.functionIds).join(", ")],
                ["Experience band", labelFor(EXPERIENCE_BANDS, passport.bandId)],
                ["CV", passport.resume?.name ?? ""],
                ["Roles", passport.experience.map((e) => [e.title, e.organisation].filter(Boolean).join(", ")).join(" · ")],
                ["Skills", passport.skills.join(", ")],
                ["Education", passport.education.map((e) => [e.qualification, e.institution, e.year].filter(Boolean).join(", ")).join(" · ")],
                ["Certifications", passport.certifications.join(", ")],
                ["Work model", labelsFor(WORK_MODELS, passport.workModelIds).join(", ")],
                ["Availability", labelFor(AVAILABILITY, passport.availabilityId)],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-1 px-5 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                  <dt className="ct-meta ct-mute pt-0.5">{label}</dt>
                  <dd className={value ? "text-[0.96rem]" : "ct-small"}>{value || "—"}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t pt-6">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="ct-btn ct-btn-quiet">
              <span aria-hidden="true">←</span> Back
            </button>
          )}
          {current.id === "review" ? (
            <button type="button" onClick={save} className="ct-btn ct-btn-primary">
              {PROFILE.save}
            </button>
          ) : (
            <button type="button" onClick={next} className="ct-btn ct-btn-primary">
              Continue <span aria-hidden="true">→</span>
            </button>
          )}
          {exists && (
            <button type="button" onClick={() => setMode("manage")} className="ct-btn ct-btn-quiet ml-auto">
              Done editing
            </button>
          )}
        </div>
        <p className="ct-small mt-4">Everything you type is kept on this device as you go.</p>
      </section>
    </div>
  );
}
