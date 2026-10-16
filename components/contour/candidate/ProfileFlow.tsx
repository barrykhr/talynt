"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePassport, type Passport, type PassportExperience } from "@/lib/candidate/passport";
import { useApplications } from "@/lib/candidate/saved";
import { ROLES, formatCompensation, roleBySlug, type Role } from "@/lib/candidate/roles";
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
import { APPLY, PASSPORT } from "@/lib/contour/content";
import { EMAIL, ROUTES } from "@/lib/contour/site";
import { locationsLabel, workModelLabel } from "@/lib/contour/roles";
import { Choices, TagField, TextArea, TextField } from "./Fields";
import { Meeting } from "@/components/contour/graphics/Meeting";
import { cx } from "@/lib/utils";

/**
 * One flow for two jobs.
 *
 *   apply   — from a role page: about you → why this role → experience →
 *             preferences → review → consent and send.
 *   profile — from "Submit your profile": about you → experience →
 *             preferences → choose a role → review → consent and send.
 *
 * Both post to the existing /api/candidate-application route. There is no
 * general talent pool behind this site, so a profile is always sent with a
 * role the person chose — the page says that instead of pretending otherwise.
 *
 * Everything typed is saved to the Career Passport on this device as it is
 * typed. Nothing leaves the device until the last step is confirmed, and the
 * confirmation reflects what the server actually said.
 */

type StepId = "you" | "why" | "experience" | "preferences" | "role" | "review" | "send";
type Step = { id: StepId; label: string; optional?: boolean };

const APPLY_STEPS: Step[] = [
  { id: "you", label: "About you" },
  { id: "why", label: "Why this role" },
  { id: "experience", label: "Experience", optional: true },
  { id: "preferences", label: "Preferences", optional: true },
  { id: "review", label: "Review" },
  { id: "send", label: "Consent and send" },
];

const PROFILE_STEPS: Step[] = [
  { id: "you", label: "About you" },
  { id: "experience", label: "Experience", optional: true },
  { id: "preferences", label: "Preferences", optional: true },
  { id: "role", label: "Choose a role" },
  { id: "review", label: "Review" },
  { id: "send", label: "Consent and send" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BYTES = 8 * 1024 * 1024;

type Errors = Partial<Record<string, string>>;
type Result =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; role: Role }
  | { kind: "fallback"; role: Role; message: string }
  | { kind: "error"; message: string };

function hasPassportDetail(p: Passport): boolean {
  return Boolean(
    p.functionIds.length ||
      p.skills.length ||
      p.experience.length ||
      p.directionIds.length ||
      p.workModelIds.length ||
      p.preferredLocationIds.length ||
      p.valueIds.length ||
      p.directionNote ||
      p.valuesNote ||
      p.compensationExpectation,
  );
}

function profilePayload(p: Passport) {
  return {
    functionIds: p.functionIds,
    skills: p.skills,
    experience: p.experience.map(({ title, organisation, from, to, summary }) => ({ title, organisation, from, to, summary })),
    directionIds: p.directionIds,
    directionNote: p.directionNote,
    workModelIds: p.workModelIds,
    preferredLocationIds: p.preferredLocationIds,
    preferredRegions: p.preferredRegions,
    stageIds: p.stageIds,
    compensationExpectation: p.compensationExpectation,
    valueIds: p.valueIds,
    valuesNote: p.valuesNote,
  };
}

/** Drafts of the free-text answers survive a reload, for this tab only. */
function useDraft(key: string): [string, (v: string) => void] {
  const [value, setValue] = useState("");
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(key);
      // Restoring a draft is a one-off read from an external store on mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setValue(saved);
    } catch {
      /* storage blocked: the draft lives in memory only */
    }
  }, [key]);
  const set = (v: string) => {
    setValue(v);
    try {
      window.sessionStorage.setItem(key, v);
    } catch {
      /* ignore */
    }
  };
  return [value, set];
}

export function ProfileFlow({ role, initialStep }: { role?: Role; initialStep?: string }) {
  const mode: "apply" | "profile" = role ? "apply" : "profile";
  const steps = mode === "apply" ? APPLY_STEPS : PROFILE_STEPS;
  // Deep links may only open steps that need nothing earlier to be chosen.
  const startIndex = ["you", "experience", "preferences"].includes(initialStep ?? "")
    ? Math.max(0, steps.findIndex((s) => s.id === initialStep))
    : 0;

  const { passport, update, loaded } = usePassport();
  const { record, find } = useApplications();
  const [stepIndex, setStepIndex] = useState(startIndex);
  const [errors, setErrors] = useState<Errors>({});
  const [chosenSlug, setChosenSlug] = useState<string>("");
  const [why, setWhy] = useDraft(`ct.draft.why.${role?.slug ?? "profile"}`);
  const [questions, setQuestions] = useDraft(`ct.draft.questions.${role?.slug ?? "profile"}`);
  const [includePassport, setIncludePassport] = useState(mode === "profile");
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const shownStep = useRef(startIndex);

  const step = steps[stepIndex];
  const target = role ?? (chosenSlug ? roleBySlug(chosenSlug) : undefined);
  const already = target ? find(target.slug) : undefined;
  const willIncludePassport = mode === "profile" || includePassport;

  // Move focus to the new step's heading so keyboard and screen-reader users
  // land where the content changed — only when the step actually changes.
  useEffect(() => {
    if (shownStep.current === stepIndex) return;
    shownStep.current = stepIndex;
    headingRef.current?.focus();
  }, [stepIndex]);

  function validate(id: StepId): Errors {
    const e: Errors = {};
    if (id === "you") {
      if (!passport.name.trim()) e.name = "Your name, so a person knows who they’re reading.";
      if (!passport.email.trim()) e.email = "An email we can reply to.";
      else if (!EMAIL_RE.test(passport.email.trim())) e.email = "That email address doesn’t look right.";
      if (!passport.currentLocationId) e.based = "Where you are based — choose one.";
    }
    if (id === "why" && why.trim().length < 40) e.why = APPLY.whyBlocking;
    if (id === "role" && !chosenSlug) e.role = "Choose the role to send your profile with.";
    if (id === "send" && !consent) e.consent = "We need your confirmation before sending anything.";
    return e;
  }

  function go(next: number) {
    setErrors({});
    setStepIndex(Math.max(0, Math.min(steps.length - 1, next)));
    window.requestAnimationFrame(() => {
      document.getElementById("ct-flow")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function proceed() {
    const found = validate(step.id);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      window.requestAnimationFrame(() => document.getElementById(`flow-${first}`)?.focus());
      return;
    }
    go(stepIndex + 1);
  }

  async function send() {
    const found = validate("send");
    setErrors(found);
    if (Object.keys(found).length || !target) {
      window.requestAnimationFrame(() => document.getElementById("flow-consent")?.focus());
      return;
    }
    setResult({ kind: "sending" });
    try {
      const response = await fetch("/api/candidate-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleSlug: target.slug,
          roleTitle: target.title,
          name: passport.name,
          email: passport.email,
          headline: passport.headline,
          locationId: passport.currentLocationId,
          availabilityId: passport.availabilityId,
          bandId: passport.bandId,
          why,
          questions,
          resumeName: passport.resume?.name ?? null,
          consentGiven: true,
          ...(willIncludePassport ? { profile: profilePayload(passport) } : {}),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; fallback?: boolean; error?: string };
      if (response.ok && data.ok) {
        record({ slug: target.slug, sentAt: new Date().toISOString(), delivered: true });
        setResult({ kind: "sent", role: target });
      } else if (data.fallback) {
        record({ slug: target.slug, sentAt: new Date().toISOString(), delivered: false });
        setResult({ kind: "fallback", role: target, message: data.error ?? "We couldn’t deliver that automatically." });
      } else {
        setResult({ kind: "error", message: data.error ?? "That didn’t go through." });
        return;
      }
      window.requestAnimationFrame(() => resultRef.current?.focus());
    } catch {
      record({ slug: target.slug, sentAt: new Date().toISOString(), delivered: false });
      setResult({ kind: "fallback", role: target, message: "We couldn’t reach our server just now." });
      window.requestAnimationFrame(() => resultRef.current?.focus());
    }
  }

  /* --- Confirmation: only ever what the server actually said ------------- */

  if (result.kind === "sent" || result.kind === "fallback") {
    const sent = result.kind === "sent";
    return (
      <div ref={resultRef} tabIndex={-1} role="status" className="ct-panel overflow-hidden outline-none">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className={cx("ct-meta", sent ? "ct-green" : "ct-mute")}>{sent ? APPLY.sentLabel : APPLY.notDeliveredLabel}</p>
            <p className="ct-display ct-m mt-4">{sent ? APPLY.sentTitle : result.message}</p>
            {sent ? (
              <p className="ct-body mt-4 max-w-xl">
                {APPLY.sentBody}{" "}
                <a href={`mailto:${EMAIL.talent}`} className="ct-link">
                  {EMAIL.talent}
                </a>
                .
              </p>
            ) : (
              <p className="ct-body mt-4 max-w-xl">
                {APPLY.notDeliveredBody}{" "}
                <a href={`mailto:${EMAIL.talent}?subject=${encodeURIComponent(result.role.slug)}`} className="ct-link">
                  {EMAIL.talent}
                </a>{" "}
                with <span className="font-mono text-[0.9em]">{result.role.slug}</span> {APPLY.notDeliveredTail}
              </p>
            )}
            <p className="ct-small mt-4">
              Role: {result.role.title} · {willIncludePassport ? "Career Passport included" : "Career Passport not included"}
            </p>
            {!sent && (
              <details className="mt-6">
                <summary className="ct-meta cursor-pointer text-[var(--ct-ink-2)] hover:text-[var(--ct-ink)]">{APPLY.copyWhat}</summary>
                <pre className="mt-3 overflow-x-auto rounded-[var(--ct-r-s)] border bg-[var(--ct-bg)] p-4 font-mono text-[0.8rem] leading-[1.7] whitespace-pre-wrap">
                  {[
                    `Role: ${result.role.title} (${result.role.slug})`,
                    `Name: ${passport.name}`,
                    `Email: ${passport.email}`,
                    `Based: ${passport.currentLocationId ? labelFor(LOCATIONS, passport.currentLocationId) : "—"}`,
                    `Available: ${passport.availabilityId ? labelFor(AVAILABILITY, passport.availabilityId) : "—"}`,
                    "",
                    "Why this role:",
                    why || "—",
                    "",
                    "Questions:",
                    questions || "—",
                  ].join("\n")}
                </pre>
              </details>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={ROUTES.dashboard} className="ct-btn ct-btn-primary">
                Your dashboard <span aria-hidden="true">→</span>
              </Link>
              <Link href={ROUTES.opportunities} className="ct-btn ct-btn-secondary">
                More roles
              </Link>
            </div>
          </div>
          <div className="hidden items-center lg:flex">
            <Meeting className="w-full" decorative />
          </div>
        </div>
      </div>
    );
  }

  /* --- The steps ---------------------------------------------------------- */

  const errorList = Object.entries(errors).filter(([, v]) => v);

  return (
    <div id="ct-flow" className="ct-panel scroll-mt-[calc(var(--ct-nav-h)+1rem)]">
      {/* Progress: where you are, what is left, and which steps are optional. */}
      <nav aria-label="Progress" className="border-b px-5 py-4 sm:px-8">
        <ol className="ct-rail flex gap-1 overflow-x-auto">
          {steps.map((s, i) => {
            const current = i === stepIndex;
            const done = i < stepIndex;
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  disabled={i > stepIndex}
                  onClick={() => go(i)}
                  aria-current={current ? "step" : undefined}
                  className={cx(
                    "relative flex min-h-10 items-center gap-2 rounded-[var(--ct-r-s)] px-2.5 text-[0.85rem] transition-colors",
                    current ? "bg-[var(--ct-bg-2)] text-[var(--ct-ink)]" : done ? "text-[var(--ct-ink-2)] hover:bg-[var(--ct-bg-2)]" : "text-[var(--ct-faint)]",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cx(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-mono",
                      done ? "bg-[var(--ct-green)] text-[var(--ct-bg)]" : current ? "bg-[var(--ct-ink)] text-[var(--ct-bg)]" : "border",
                    )}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  {s.label}
                  {s.optional && <span className="sr-only"> (optional)</span>}
                  {done && <span className="sr-only"> (completed)</span>}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-[var(--ct-line)]" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[var(--ct-green)] transition-[width] duration-500"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </nav>

      <div className="px-5 py-8 sm:px-8 sm:py-10">
        <p className="ct-meta ct-mute">
          Step {stepIndex + 1} of {steps.length}
          {step.optional && " · optional"}
        </p>
        <h2 ref={headingRef} tabIndex={-1} className="ct-display ct-m mt-2 outline-none">
          {stepTitle(step.id, mode)}
        </h2>
        <p className="ct-body mt-3 max-w-2xl">{stepIntro(step.id, mode)}</p>

        {errorList.length > 0 && (
          <div role="alert" className="mt-6 rounded-[var(--ct-r-s)] border px-4 py-3" style={{ ["--ct-bc" as string]: "#b3401f" }}>
            <p className="ct-error font-medium">
              {errorList.length === 1 ? "One thing needs fixing" : `${errorList.length} things need fixing`} before you continue:
            </p>
            <ul className="mt-1 list-disc pl-5">
              {errorList.map(([field, message]) => (
                <li key={field} className="ct-error">
                  <a href={`#flow-${field}`} className="underline underline-offset-2">
                    {message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-8">
          {step.id === "you" && (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                <TextField id="flow-name" label="Your name" value={passport.name} onChange={(name) => update({ name })} required autoComplete="name" error={errors.name} />
                <TextField
                  id="flow-email"
                  label="Email"
                  type="email"
                  value={passport.email}
                  onChange={(email) => update({ email })}
                  required
                  autoComplete="email"
                  hint="Used to reply to you about a role. Nothing else."
                  error={errors.email}
                />
              </div>
              <TextField
                id="flow-headline"
                label="One line about what you do"
                value={passport.headline}
                onChange={(headline) => update({ headline })}
                placeholder="Senior backend engineer, mostly payments infrastructure"
                hint={PASSPORT.headlineHint}
              />
              <Choices
                id="flow-based"
                legend="Where you are based"
                options={LOCATIONS}
                selected={passport.currentLocationId ? [passport.currentLocationId] : []}
                onChange={(ids) => update({ currentLocationId: ids[0] ?? "" })}
                multiple={false}
                required
                hint="Choose the closest. Where you’d be willing to work comes later, and separately."
                error={errors.based}
              />
              <Choices
                id="flow-availability"
                legend="When you could start"
                options={AVAILABILITY}
                selected={passport.availabilityId ? [passport.availabilityId] : []}
                onChange={(ids) => update({ availabilityId: ids[0] ?? "" })}
                multiple={false}
              />
            </>
          )}

          {step.id === "why" && role && (
            <>
              <TextArea
                id="flow-why"
                label="Why this role, in your own words"
                value={why}
                onChange={setWhy}
                required
                rows={7}
                hint={APPLY.whyHint}
                error={errors.why}
                placeholder="The part about owning a surface through a rewrite is the thing I’ve been trying to get back to since…"
              />
              <div className="rounded-[var(--ct-r-m)] bg-[var(--ct-bg-2)] p-5">
                <p className="ct-meta ct-mute">{APPLY.fromRole}</p>
                <p className="ct-body mt-2">{role.whyExists[0]}</p>
              </div>
              <TextArea
                id="flow-questions"
                label="Anything you’d want answered"
                value={questions}
                onChange={setQuestions}
                rows={4}
                hint={`${APPLY.questionsBody} ${APPLY.questionsHint}`}
                placeholder="How much of the on-call load actually falls on this surface?"
              />
              <div className="rounded-[var(--ct-r-m)] border p-5">
                <p className="ct-meta ct-mute">{APPLY.worthAsking}</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {role.consider.map((c) => (
                    <li key={c} className="ct-small text-[var(--ct-ink-2)]">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {step.id === "experience" && (
            <>
              <ResumeField />
              <Choices id="flow-functions" legend="What you do" options={FUNCTIONS} selected={passport.functionIds} onChange={(functionIds) => update({ functionIds })} hint="Pick more than one if more than one is true." />
              <Choices
                id="flow-band"
                legend="Your level"
                options={EXPERIENCE_BANDS}
                selected={passport.bandId ? [passport.bandId] : []}
                onChange={(ids) => update({ bandId: ids[0] ?? "" })}
                multiple={false}
                hint={PASSPORT.levelHint}
              />
              <TagField id="flow-skills" label="Skills and tools" values={passport.skills} onChange={(skills) => update({ skills })} hint={PASSPORT.skillsHint} placeholder="Python, dbt, Snowflake — press Enter after each" />
              <ExperienceList />
            </>
          )}

          {step.id === "preferences" && (
            <>
              <Choices id="flow-workmodels" legend="How you want to work" options={WORK_MODELS} selected={passport.workModelIds} onChange={(workModelIds) => update({ workModelIds })} hint="A way of working, separate from where." />
              <Choices id="flow-places" legend="Where you’d work" options={LOCATIONS} selected={passport.preferredLocationIds} onChange={(preferredLocationIds) => update({ preferredLocationIds })} />
              <Choices id="flow-directions" legend="Where this is going" options={DIRECTIONS} selected={passport.directionIds} onChange={(directionIds) => update({ directionIds })} hint={PASSPORT.directionLede} />
              <TextArea
                id="flow-direction-note"
                label={PASSPORT.directionNoteLabel}
                value={passport.directionNote}
                onChange={(directionNote) => update({ directionNote })}
                rows={3}
                hint={PASSPORT.directionNoteHint}
              />
              <Choices
                id="flow-values"
                legend="What matters to you"
                options={VALUES}
                selected={passport.valueIds}
                onChange={(valueIds) => update({ valueIds })}
                ranked
                max={6}
                hint={PASSPORT.valuesLede}
              />
              <Choices id="flow-stages" legend="Company stage" options={COMPANY_STAGES} selected={passport.stageIds} onChange={(stageIds) => update({ stageIds })} hint={PASSPORT.stageHint} />
              <TextField
                id="flow-compensation"
                label="Compensation expectation"
                value={passport.compensationExpectation}
                onChange={(compensationExpectation) => update({ compensationExpectation })}
                placeholder="₹50–65L, or £110k base"
                hint={PASSPORT.compensationHint}
              />
            </>
          )}

          {step.id === "role" && (
            <RolePicker selected={chosenSlug} onSelect={(slug) => setChosenSlug(slug)} error={errors.role} note={why} onNote={setWhy} />
          )}

          {step.id === "review" && target && (
            <Review
              passport={passport}
              role={target}
              why={why}
              questions={questions}
              includePassport={willIncludePassport}
              mode={mode}
              onEdit={(id) => go(steps.findIndex((s) => s.id === id))}
              onTogglePassport={mode === "apply" && hasPassportDetail(passport) ? setIncludePassport : undefined}
            />
          )}

          {step.id === "send" && target && (
            <div className="flex flex-col gap-6">
              {already && (
                <p className="ct-small rounded-[var(--ct-r-s)] bg-[var(--ct-bg-2)] px-4 py-3">
                  This device already sent an application for this role on {new Date(already.sentAt).toLocaleDateString()}
                  {already.delivered ? "." : " — delivery was not confirmed."} Sending again is fine if something has changed.
                </p>
              )}
              <div className="rounded-[var(--ct-r-m)] bg-[var(--ct-bg-2)] p-5 sm:p-6">
                <p className="ct-meta ct-mute">Where this goes, and how it is used</p>
                <ul className="mt-3 flex flex-col gap-2 text-[0.95rem] leading-[1.6]">
                  <li>
                    It goes to TALYNT LABS for <strong className="font-medium">{target.title}</strong> — {target.company}. {APPLY.consentBody}
                  </li>
                  <li>A person reads it — not a filter.</li>
                  <li>
                    You can ask us what we hold, ask us to correct or delete it, at{" "}
                    <a href={`mailto:${EMAIL.privacy}`} className="ct-link">
                      {EMAIL.privacy}
                    </a>
                    . The full policy is in our{" "}
                    <Link href={ROUTES.privacy} className="ct-link">
                      privacy policy
                    </Link>
                    .
                  </li>
                </ul>
              </div>
              <div className="flex items-start gap-3">
                <input
                  id="flow-consent"
                  type="checkbox"
                  className="ct-check mt-1"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (e.target.checked) setErrors((er) => ({ ...er, consent: undefined }));
                  }}
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={errors.consent ? "flow-consent-error" : "flow-consent-body"}
                />
                <div>
                  <label htmlFor="flow-consent" className="text-[1rem] font-medium">
                    {APPLY.consentLabel}
                  </label>
                  <p id="flow-consent-body" className="ct-small mt-1">
                    Off until you tick it. Each application asks again.
                  </p>
                  {errors.consent && (
                    <p id="flow-consent-error" className="ct-error mt-2">
                      {errors.consent}
                    </p>
                  )}
                </div>
              </div>
              {result.kind === "error" && (
                <p className="ct-error" role="alert">
                  {result.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* --- Controls --------------------------------------------------- */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
          <button type="button" onClick={() => go(stepIndex - 1)} disabled={stepIndex === 0} className="ct-btn ct-btn-quiet disabled:opacity-40">
            <span aria-hidden="true">←</span> Back
          </button>
          <div className="flex flex-wrap items-center gap-3">
            {step.optional && (
              <button type="button" onClick={() => go(stepIndex + 1)} className="ct-btn ct-btn-quiet text-[var(--ct-mute)]">
                Skip for now
              </button>
            )}
            {step.id === "send" ? (
              <button type="button" onClick={send} disabled={result.kind === "sending"} className="ct-btn ct-btn-primary">
                {result.kind === "sending" ? "Sending…" : mode === "apply" ? "Send application" : "Send my profile"}
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              <button type="button" onClick={proceed} className="ct-btn ct-btn-primary">
                Continue <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </div>

        <p className="ct-small mt-6">
          {loaded ? "Saved to your Career Passport on this device as you type. " : ""}
          {APPLY.rather}{" "}
          <Link href={ROUTES.contact} className="ct-link">
            {APPLY.ratherLink}
          </Link>{" "}
          {APPLY.ratherTail}
        </p>
      </div>
    </div>
  );
}

/* --- Copy for each step. Proposed where the approved site had none. ---------- */

function stepTitle(id: StepId, mode: "apply" | "profile"): string {
  switch (id) {
    case "you":
      return "Start with your name.";
    case "why":
      return APPLY.whyTitle;
    case "experience":
      return "Your experience.";
    case "preferences":
      return "How and where you want to work.";
    case "role":
      return "Choose the role to send it with.";
    case "review":
      return APPLY.reviewTitle;
    case "send":
      return mode === "apply" ? "Consent, then send." : "Consent, then send your profile.";
  }
}

function stepIntro(id: StepId, mode: "apply" | "profile"): string {
  switch (id) {
    case "you":
      return "Only what a person needs to reply to you. If you have a Career Passport on this device, it is already filled in — editing here updates it.";
    case "why":
      return APPLY.whyBody;
    case "experience":
      return mode === "apply"
        ? "Attach a CV, or point us at what you’ve built. Either is fine — and none of it is required to apply."
        : PASSPORT.experienceLede;
    case "preferences":
      return PASSPORT.preferencesLede;
    case "role":
      return "There is no general talent pool behind this site. A profile reaches us only with a role you have chosen — so pick the one you want it read against.";
    case "review":
      return mode === "apply"
        ? "Read it. Nothing below leaves your device until you confirm on the next step."
        : "Read it. Your Career Passport is sent with this role, and nothing leaves your device until you confirm on the next step.";
    case "send":
      return "Off by default. Nothing here is assumed from the fact that you filled in a form.";
  }
}

/* --- Pieces --------------------------------------------------------------- */

function ResumeField() {
  const { passport, update } = usePassport();
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.95rem] font-medium">
        Your CV <span className="ct-mute ml-2 text-[0.78rem] font-normal">Optional</span>
      </span>
      {passport.resume ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--ct-r-s)] border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[0.95rem]">{passport.resume.name}</p>
            <p className="ct-meta ct-mute mt-1 tabular-nums">{(passport.resume.size / 1024).toFixed(0)} KB · on this device</p>
          </div>
          <button type="button" onClick={() => update({ resume: null })} className="ct-btn ct-btn-quiet min-h-10 text-[0.88rem]">
            Remove
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={input}
            id="flow-cv"
            type="file"
            accept=".pdf,.doc,.docx,.txt,.rtf"
            className="sr-only"
            onChange={(e) => {
              setError(null);
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > MAX_BYTES) {
                setError("That file is over 8 MB. A CV should not be — send a smaller one.");
                return;
              }
              update({ resume: { name: file.name, size: file.size, addedAt: new Date().toISOString() } });
            }}
          />
          <label htmlFor="flow-cv" className="ct-btn ct-btn-secondary cursor-pointer">
            Choose a file <span aria-hidden="true">↑</span>
          </label>
        </div>
      )}
      {error && <p className="ct-error">{error}</p>}
      <p className="ct-small text-[0.85rem]">
        PDF, Word or plain text, under 8 MB. Nothing reads it to fill in your Passport. Only the file’s name travels with an
        application — there is no upload service behind this site yet, so the file itself stays on your device.
      </p>
    </div>
  );
}

function ExperienceList() {
  const { passport, update } = usePassport();
  const patch = (id: string, p: Partial<PassportExperience>) =>
    update({ experience: passport.experience.map((e) => (e.id === id ? { ...e, ...p } : e)) });

  return (
    <fieldset>
      <legend className="text-[0.95rem] font-medium">
        Roles that matter <span className="ct-mute ml-2 text-[0.78rem] font-normal">Optional</span>
      </legend>
      <p className="ct-small mt-1 text-[0.85rem]">{PASSPORT.experienceSummaryHint}</p>
      <ul className="mt-4 flex flex-col gap-4">
        {passport.experience.map((entry, i) => (
          <li key={entry.id} className="rounded-[var(--ct-r-m)] border p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id={`exp-${entry.id}-title`} label="Title" value={entry.title} onChange={(title) => patch(entry.id, { title })} />
              <TextField id={`exp-${entry.id}-org`} label="Organisation" value={entry.organisation} onChange={(organisation) => patch(entry.id, { organisation })} />
              <TextField id={`exp-${entry.id}-from`} label="From" value={entry.from} onChange={(from) => patch(entry.id, { from })} placeholder="2021" />
              <TextField id={`exp-${entry.id}-to`} label="To" value={entry.to} onChange={(to) => patch(entry.id, { to })} placeholder="Now" />
            </div>
            <div className="mt-4">
              <TextArea id={`exp-${entry.id}-summary`} label="What you actually did" value={entry.summary} onChange={(summary) => patch(entry.id, { summary })} rows={3} />
            </div>
            <button
              type="button"
              onClick={() => update({ experience: passport.experience.filter((e) => e.id !== entry.id) })}
              className="ct-btn ct-btn-quiet mt-2 min-h-10 text-[0.88rem] text-[var(--ct-mute)]"
            >
              Remove role {i + 1}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() =>
          update({
            experience: [...passport.experience, { id: `exp-${Date.now()}`, title: "", organisation: "", from: "", to: "", summary: "" }],
          })
        }
        className="ct-btn ct-btn-secondary mt-4"
      >
        Add a role <span aria-hidden="true">+</span>
      </button>
    </fieldset>
  );
}

function RolePicker({
  selected,
  onSelect,
  error,
  note,
  onNote,
}: {
  selected: string;
  onSelect: (slug: string) => void;
  error?: string;
  note: string;
  onNote: (v: string) => void;
}) {
  const sorted = useMemo(() => [...ROLES].sort((a, b) => (a.posted < b.posted ? 1 : -1)), []);
  return (
    <div className="flex flex-col gap-8">
      <fieldset id="flow-role" tabIndex={-1} aria-invalid={error ? true : undefined} aria-describedby={error ? "flow-role-error" : undefined} className="outline-none">
        <legend className="text-[0.95rem] font-medium">
          Open roles <span className="ct-green ml-2 text-[0.78rem] font-normal">Required to send</span>
        </legend>
        <ul className="mt-3 flex flex-col gap-2">
          {sorted.map((r) => {
            const on = selected === r.slug;
            return (
              <li key={r.slug}>
                <label
                  className={cx(
                    "flex cursor-pointer items-start gap-3 rounded-[var(--ct-r-m)] border p-4 transition-colors",
                    on ? "ct-b-green bg-[var(--ct-green-wash)]" : "ct-hb-ink",
                  )}
                >
                  <input type="radio" name="flow-role" className="mt-1 accent-[var(--ct-green)]" checked={on} onChange={() => onSelect(r.slug)} />
                  <span className="flex-1">
                    <span className="block text-[1rem] font-medium">{r.title}</span>
                    <span className="ct-small block">
                      {r.company} · {labelFor(EXPERIENCE_BANDS, r.bandId)} · {locationsLabel(r)} · {workModelLabel(r)}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[0.82rem] tabular-nums">{formatCompensation(r.compensation)}</span>
                </label>
              </li>
            );
          })}
        </ul>
        {error && (
          <p id="flow-role-error" className="ct-error mt-3">
            {error}
          </p>
        )}
      </fieldset>
      <TextArea
        id="flow-note"
        label="Anything you’d like the hiring manager to know"
        value={note}
        onChange={onNote}
        rows={4}
        hint="Sent with your profile. A sentence on why this role is enough."
      />
      <p className="ct-small">
        Not ready to send it anywhere? Everything so far is already saved on this device —{" "}
        <Link href={ROUTES.dashboard} className="ct-link">
          see it in your dashboard
        </Link>
        .
      </p>
    </div>
  );
}

function Review({
  passport,
  role,
  why,
  questions,
  includePassport,
  mode,
  onEdit,
  onTogglePassport,
}: {
  passport: Passport;
  role: Role;
  why: string;
  questions: string;
  includePassport: boolean;
  mode: "apply" | "profile";
  onEdit: (id: StepId) => void;
  onTogglePassport?: (v: boolean) => void;
}) {
  const dash = "—";
  return (
    <div className="flex flex-col gap-8">
      <ReviewBlock title="The role" onEdit={mode === "profile" ? () => onEdit("role") : undefined}>
        <Row label="Role" value={`${role.title} — ${formatCompensation(role.compensation)} a year`} />
        <Row label="Company" value={role.company} />
      </ReviewBlock>

      <ReviewBlock title="About you" onEdit={() => onEdit("you")}>
        <Row label="Name" value={passport.name || dash} />
        <Row label="Email" value={passport.email || dash} />
        <Row label="Headline" value={passport.headline || dash} />
        <Row label="Based in" value={passport.currentLocationId ? labelFor(LOCATIONS, passport.currentLocationId) : dash} />
        <Row label="Could start" value={passport.availabilityId ? labelFor(AVAILABILITY, passport.availabilityId) : dash} />
        <Row label="Level" value={passport.bandId ? labelFor(EXPERIENCE_BANDS, passport.bandId) : dash} />
        <Row label="CV" value={passport.resume ? `${passport.resume.name} (file name only)` : "Not attached"} />
      </ReviewBlock>

      <ReviewBlock title={mode === "apply" ? "Why this role" : "Your note"} onEdit={() => onEdit(mode === "apply" ? "why" : "role")}>
        <Row label={mode === "apply" ? "In your words" : "Note"} value={why || dash} block />
        {mode === "apply" && <Row label="Your questions" value={questions || dash} block />}
      </ReviewBlock>

      <div>
        {onTogglePassport && (
          <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-[var(--ct-r-m)] bg-[var(--ct-violet-wash)] p-4">
            <input type="checkbox" className="ct-check mt-0.5" checked={includePassport} onChange={(e) => onTogglePassport(e.target.checked)} />
            <span>
              <span className="block text-[0.98rem] font-medium">Also send my Career Passport</span>
              <span className="ct-small block">Experience, skills, direction and preferences, as listed below. Off unless you choose it.</span>
            </span>
          </label>
        )}
        <ReviewBlock
          title={includePassport ? "Career Passport — sent with this application" : "Career Passport — stays on this device"}
          onEdit={() => onEdit("experience")}
          muted={!includePassport}
        >
          <Row label="What you do" value={labelsFor(FUNCTIONS, passport.functionIds).join(", ") || dash} />
          <Row label="Skills" value={passport.skills.join(", ") || dash} />
          <Row
            label="Roles"
            value={
              passport.experience.length
                ? passport.experience.map((e) => [e.title, e.organisation].filter(Boolean).join(" · ") + (e.from ? ` (${e.from}–${e.to || "now"})` : "")).join("\n")
                : dash
            }
            block
          />
          <Row label="How you’d work" value={labelsFor(WORK_MODELS, passport.workModelIds).join(", ") || dash} />
          <Row label="Where you’d work" value={labelsFor(LOCATIONS, passport.preferredLocationIds).join(", ") || dash} />
          <Row label="Direction" value={labelsFor(DIRECTIONS, passport.directionIds).join(", ") || dash} />
          <Row label="What matters" value={labelsFor(VALUES, passport.valueIds).map((v, i) => `${i + 1}. ${v}`).join("  ") || dash} />
          <Row label="Compensation" value={passport.compensationExpectation || dash} />
        </ReviewBlock>
      </div>
    </div>
  );
}

function ReviewBlock({
  title,
  onEdit,
  muted = false,
  children,
}: {
  title: string;
  onEdit?: () => void;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cx("rounded-[var(--ct-r-m)] border", muted && "bg-[var(--ct-bg)]")} aria-label={title}>
      <div className="flex items-center justify-between gap-4 border-b px-4 py-2.5">
        <h3 className={cx("ct-meta", muted ? "ct-mute" : "ct-ink2")}>{title}</h3>
        {onEdit && (
          <button type="button" onClick={onEdit} className="ct-meta ct-green min-h-9 px-1 hover:underline">
            Edit
          </button>
        )}
      </div>
      <dl className={cx("px-4", muted && "opacity-75")}>{children}</dl>
    </section>
  );
}

function Row({ label, value, block = false }: { label: string; value: string; block?: boolean }) {
  return (
    <div className={cx("border-t py-3 first:border-t-0", block ? "flex flex-col gap-1" : "grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4")}>
      <dt className="ct-small text-[0.85rem]">{label}</dt>
      <dd className="text-[0.95rem] leading-[1.6] whitespace-pre-wrap">{value}</dd>
    </div>
  );
}
