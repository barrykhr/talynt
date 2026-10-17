"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Role } from "@/lib/candidate/roles";
import { usePassport, type Passport } from "@/lib/candidate/passport";
import { useApplications } from "@/lib/candidate/saved";
import { assessmentState, useCandidateApplications, type CandidateApplication } from "@/lib/candidate/applications";
import { completeness } from "@/lib/assessment/evaluate";
import { profileVersion } from "@/lib/assessment/profile";
import { toSubmission } from "@/lib/assessment/submission";
import type { Question } from "@/lib/assessment/types";
import { APPLY } from "@/lib/contour/content";
import { APPLICATIONS, ASSESSMENT } from "@/lib/contour/proposed";
import { EMAIL, ROUTES } from "@/lib/contour/site";
import { cx } from "@/lib/utils";
import { TextArea } from "./Fields";

type Result = { kind: "sent" } | { kind: "fallback"; message: string } | { kind: "error"; message: string };
type Phase = { kind: "intro" } | { kind: "why" } | { kind: "question"; index: number } | { kind: "review" } | { kind: "result"; result: Result };

const WHY_MIN = 40;
const words = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

function profilePayload(p: Passport) {
  return {
    functionIds: p.functionIds,
    skills: p.skills,
    experience: p.experience.map(({ title, organisation, from, to, summary }) => ({ title, organisation, from, to, summary })),
    education: p.education.map(({ institution, qualification, year }) => ({ institution, qualification, year })),
    certifications: p.certifications,
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

function transcript(role: Role, app: CandidateApplication): string {
  const lines = [`${role.title} — ${role.slug}`, "", APPLY.whyTitle, app.why, ""];
  for (const q of app.assessment?.questions ?? []) lines.push(q.prompt, app.responses[q.id]?.text ?? "", "");
  if (app.questionsForCompany) lines.push(APPLY.questionsTitle, app.questionsForCompany);
  return lines.join("\n");
}

/**
 * One application's assessment. Built once when the application was started
 * (see lib/candidate/applications.ts) and read from there — opening this page
 * again never builds a different one.
 */
export function AssessmentRunner({ role }: { role: Role }) {
  const { passport, loaded: passportLoaded } = usePassport();
  const { find, loaded, saveResponse, update, refresh, markSent } = useCandidateApplications();
  const { record } = useApplications();
  const app = find(role.slug);

  const [phase, setPhase] = useState<Phase>({ kind: "intro" });
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const shown = useRef<string | null>(null);
  const phaseKey = phase.kind === "question" ? `q${phase.index}` : phase.kind;

  useEffect(() => {
    if (shown.current !== null && shown.current !== phaseKey) heading.current?.focus();
    shown.current = phaseKey;
  }, [phaseKey]);

  if (!loaded || !passportLoaded) return <div aria-busy="true" className="ct-panel h-72 animate-pulse" />;

  if (!app) {
    return (
      <div className="ct-panel p-6 sm:p-8">
        <p className="ct-body">{ASSESSMENT.notStarted}</p>
        <Link href={`${ROUTES.role(role.slug)}#apply`} className="ct-btn ct-btn-primary mt-5">
          {ASSESSMENT.startFromRole} <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  const assessment = app.assessment;
  const state = assessmentState(app, role);
  const emailFallback = (
    <>
      <a href={`mailto:${EMAIL.talent}?subject=${encodeURIComponent(role.slug)}`} className="ct-link">
        {EMAIL.talent}
      </a>{" "}
      {APPLY.notDeliveredTail.replace(/^in the subject line/, `with “${role.slug}” in the subject line`)}
    </>
  );

  /* --- Not available: say so, never show an empty assessment ------------- */
  if (!assessment) {
    return (
      <div className="ct-panel p-6 sm:p-8" role="status">
        <p className="ct-meta ct-mute">{ASSESSMENT.unavailableTitle}</p>
        <p className="ct-body mt-3 max-w-2xl">{app.unavailable?.reason}</p>
        <p className="ct-body mt-3 max-w-2xl">
          {ASSESSMENT.unavailableBody} {emailFallback}
        </p>
        {!app.submittedAt && (
          <button type="button" onClick={() => refresh(role, passport)} className="ct-btn ct-btn-secondary mt-5">
            Try again
          </button>
        )}
      </div>
    );
  }

  const questions = assessment.questions;
  const status = completeness(assessment, app.responses);
  const sent = Boolean(app.submittedAt);

  /* --- Sent: read-only, exactly as it went -------------------------------- */
  if (sent && phase.kind !== "result") {
    return (
      <div className="flex flex-col gap-8">
        <div className="ct-panel p-6" role="status">
          <p className={cx("ct-meta", app.delivered ? "ct-green" : "ct-mute")}>{app.delivered ? APPLY.sentLabel : APPLY.notDeliveredLabel}</p>
          <p className="ct-body mt-2">{ASSESSMENT.readOnly}</p>
          <p className="ct-meta ct-mute mt-3 tabular-nums">
            {ASSESSMENT.sentVersion} {assessment.requirementsVersion} · {assessment.rubricVersion}
          </p>
          <Link href={ROUTES.application(role.slug)} className="ct-btn ct-btn-secondary mt-5">
            {APPLICATIONS.view} the application <span aria-hidden="true">→</span>
          </Link>
        </div>
        <Answers app={app} questions={questions} />
      </div>
    );
  }

  const steps: Array<{ key: string; label: string }> = [
    { key: "why", label: "Why this role" },
    ...questions.map((_, i) => ({ key: `q${i}`, label: `Question ${i + 1}` })),
    { key: "review", label: "Review" },
  ];

  function go(next: Phase) {
    setError(null);
    setPhase(next);
  }

  function leaveWhy() {
    if (app!.why.trim().length < WHY_MIN) {
      setError(APPLY.whyBlocking);
      document.getElementById("assessment-why")?.focus();
      return;
    }
    go({ kind: "question", index: 0 });
  }

  function leaveQuestion(index: number) {
    const q = questions[index];
    const text = app!.responses[q.id]?.text ?? "";
    if (!words(text)) {
      setError(ASSESSMENT.required);
      document.getElementById(`answer-${q.id}`)?.focus();
      return;
    }
    if (words(text) > q.response.maxWords) {
      setError(ASSESSMENT.overLimit(q.response.maxWords));
      document.getElementById(`answer-${q.id}`)?.focus();
      return;
    }
    go(index + 1 < questions.length ? { kind: "question", index: index + 1 } : { kind: "review" });
  }

  async function send() {
    if (!passport.profileId || !passport.name || !passport.email) {
      setError("Your profile is missing its name or email. Complete your profile, then come back — your answers are saved.");
      return;
    }
    if (!consent) {
      setError("Please confirm before anything is sent.");
      document.getElementById("assessment-consent")?.focus();
      return;
    }
    if (!status.complete || app!.why.trim().length < WHY_MIN) {
      setError("Every question needs an answer within its limit before you send.");
      return;
    }
    setSending(true);
    setError(null);
    const version = profileVersion(passport);
    let result: Result;
    try {
      const response = await fetch("/api/candidate-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleSlug: role.slug,
          roleTitle: role.title,
          name: passport.name,
          email: passport.email,
          headline: passport.headline,
          locationId: passport.currentLocationId,
          availabilityId: passport.availabilityId,
          bandId: passport.bandId,
          why: app!.why,
          questions: app!.questionsForCompany,
          resumeName: passport.resume?.name ?? null,
          consentGiven: true,
          applicationId: app!.id,
          profileId: passport.profileId,
          profileVersion: version,
          ...(app!.includeProfile ? { profile: profilePayload(passport) } : {}),
          assessment: toSubmission(assessment!, app!.responses),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; fallback?: boolean; error?: string };
      if (response.ok && data.ok) result = { kind: "sent" };
      else if (data.fallback) result = { kind: "fallback", message: data.error ?? "We couldn’t deliver that automatically." };
      else result = { kind: "error", message: data.error ?? "That didn’t go through." };
    } catch {
      result = { kind: "fallback", message: "We couldn’t reach the server." };
    }
    setSending(false);
    if (result.kind === "error") {
      setError(result.message);
      return;
    }
    const delivered = result.kind === "sent";
    markSent(role.slug, { delivered, profileVersion: version });
    record({ slug: role.slug, sentAt: new Date().toISOString(), delivered });
    go({ kind: "result", result });
  }

  /* --- Result ------------------------------------------------------------ */
  if (phase.kind === "result") {
    const ok = phase.result.kind === "sent";
    return (
      <div
        role="status"
        className="ct-panel p-6 sm:p-10"
        style={ok ? { backgroundColor: "var(--ct-green-wash)", ["--ct-bc" as string]: "var(--ct-green)" } : undefined}
      >
        <p className={cx("ct-meta", ok ? "ct-green" : "ct-mute")}>{ok ? APPLY.sentLabel : APPLY.notDeliveredLabel}</p>
        <h2 ref={heading} tabIndex={-1} className="ct-display ct-m mt-4">
          {ok ? APPLY.sentTitle : phase.result.kind === "fallback" ? phase.result.message : ""}
        </h2>
        <p className="ct-body mt-4 max-w-2xl">
          {ok ? (
            <>
              {APPLY.sentBody}{" "}
              <a href={`mailto:${EMAIL.talent}`} className="ct-link">
                {EMAIL.talent}
              </a>
              .
            </>
          ) : (
            <>
              {APPLY.notDeliveredBody} {emailFallback}
            </>
          )}
        </p>
        {!ok && (
          <button
            type="button"
            className="ct-btn ct-btn-secondary mt-5"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(transcript(role, app!));
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {APPLY.copyWhat}
          </button>
        )}
        {copied && <p className="ct-small mt-2">Copied.</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={ROUTES.application(role.slug)} className="ct-btn ct-btn-primary">
            {APPLICATIONS.view} the application <span aria-hidden="true">→</span>
          </Link>
          <Link href={ROUTES.opportunities} className="ct-btn ct-btn-quiet">
            Explore more roles
          </Link>
        </div>
      </div>
    );
  }

  /* --- Intro ------------------------------------------------------------- */
  if (phase.kind === "intro") {
    const started = Boolean(app.why) || status.answered > 0;
    return (
      <div className="flex flex-col gap-8">
        {state === "out-of-date" && <OutOfDate onRefresh={() => refresh(role, passport)} />}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <p className="ct-meta ct-mute">{ASSESSMENT.introEyebrow}</p>
            <h2 ref={heading} tabIndex={-1} className="ct-display ct-m mt-3">
              {ASSESSMENT.introTitle} <span className="ct-italic">{role.title}</span>
            </h2>
            <p className="ct-body mt-4 max-w-2xl">{ASSESSMENT.purpose(role.title)}</p>
            <ul className="mt-6 flex flex-col">
              <li className="border-t py-3 text-[1rem] font-medium">{ASSESSMENT.formatCount(questions.length)}</li>
              {ASSESSMENT.format.map((line) => (
                <li key={line} className="ct-small border-t py-3">
                  {line}
                </li>
              ))}
            </ul>
            <p className="ct-body mt-6 max-w-2xl">{ASSESSMENT.howUsed}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => go({ kind: "why" })} className="ct-btn ct-btn-primary" disabled={state === "out-of-date"}>
                {started ? ASSESSMENT.resume : ASSESSMENT.begin} <span aria-hidden="true">→</span>
              </button>
              {started && (
                <p className="ct-meta ct-mute">
                  {APPLICATIONS.answered(status.answered, status.total)}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="ct-panel p-5">
              <p className="ct-meta ct-mute">What it asks about</p>
              <ul className="mt-3 flex flex-col gap-3">
                {assessment.competencies.map((c) => (
                  <li key={c.id}>
                    <p className="text-[0.98rem] font-medium">{c.label}</p>
                    <p className="ct-small">{c.meaning}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="ct-panel p-5">
              <p className="ct-meta ct-mute">{ASSESSMENT.after}</p>
              <ol className="mt-3 flex flex-col">
                {role.process.slice(0, 3).map((p, i) => (
                  <li key={p.step} className="grid grid-cols-[1.75rem_1fr] gap-2 border-t py-2.5 first:border-t-0 first:pt-0">
                    <span className="ct-meta ct-green tabular-nums pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block text-[0.95rem]">{p.step}</span>
                      <span className="ct-small block text-[0.85rem]">{p.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <p className="ct-small">{ASSESSMENT.accommodation}</p>
          </div>
        </div>
      </div>
    );
  }

  /* --- Steps ------------------------------------------------------------- */
  const currentKey = phase.kind === "question" ? `q${phase.index}` : phase.kind;
  const currentIndex = steps.findIndex((s) => s.key === currentKey);

  return (
    <div className="flex flex-col gap-8">
      {state === "out-of-date" && <OutOfDate onRefresh={() => refresh(role, passport)} />}

      <nav aria-label="Assessment progress">
        <ol className="flex gap-1.5">
          {steps.map((s, i) => (
            <li key={s.key} className="flex-1">
              <span className="sr-only">
                {s.label}
                {i === currentIndex ? " (current)" : i < currentIndex ? " (done)" : ""}
              </span>
              <span
                aria-hidden="true"
                className="block h-[3px] rounded-full"
                style={{ backgroundColor: i <= currentIndex ? "var(--ct-green)" : "var(--ct-line)" }}
              />
            </li>
          ))}
        </ol>
      </nav>

      {phase.kind === "why" && (
        <section aria-labelledby="assessment-step-heading">
          <p className="ct-meta ct-mute">About this application</p>
          <h2 id="assessment-step-heading" ref={heading} tabIndex={-1} className="ct-display ct-m mt-3">
            {APPLY.whyTitle}
          </h2>
          <p className="ct-body mt-3 max-w-2xl">{APPLY.whyBody}</p>
          <div className="mt-6 max-w-3xl">
            <TextArea
              id="assessment-why"
              label="Why this role"
              value={app.why}
              onChange={(why) => update(role.slug, { why })}
              required
              rows={6}
              hint={APPLY.whyHint}
              error={error ?? undefined}
            />
          </div>
          <Controls onBack={() => go({ kind: "intro" })} onNext={leaveWhy} nextLabel={ASSESSMENT.next} />
        </section>
      )}

      {phase.kind === "question" && (
        <QuestionStep
          key={questions[phase.index].id}
          question={questions[phase.index]}
          index={phase.index}
          total={questions.length}
          competencyLabel={assessment.competencies.filter((c) => questions[phase.index].competencyIds.includes(c.id)).map((c) => c.label).join(", ")}
          pointer={assessment.pointers[questions[phase.index].id] ?? null}
          value={app.responses[questions[phase.index].id]?.text ?? ""}
          onChange={(text) => saveResponse(role.slug, questions[phase.index].id, text)}
          error={error}
          headingRef={heading}
          onBack={() => go(phase.index === 0 ? { kind: "why" } : { kind: "question", index: phase.index - 1 })}
          onNext={() => leaveQuestion(phase.index)}
          nextLabel={phase.index + 1 < questions.length ? ASSESSMENT.next : ASSESSMENT.toReview}
        />
      )}

      {phase.kind === "review" && (
        <section aria-labelledby="assessment-step-heading">
          <p className="ct-meta ct-mute">{APPLY.reviewTitle}</p>
          <h2 id="assessment-step-heading" ref={heading} tabIndex={-1} className="ct-display ct-m mt-3">
            {ASSESSMENT.reviewTitle}
          </h2>

          <dl className="ct-panel mt-6 divide-y">
            {[
              ["Name", passport.name],
              ["Email", passport.email],
              ["In a line", passport.headline],
              ["CV", passport.resume ? `${passport.resume.name} (file name only)` : ""],
            ].map(([label, value]) => (
              <div key={label} className="grid gap-1 px-5 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                <dt className="ct-meta ct-mute pt-0.5">{label}</dt>
                <dd className={value ? "text-[0.96rem]" : "ct-small"}>{value || "—"}</dd>
              </div>
            ))}
            <div className="grid gap-1 px-5 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
              <dt className="ct-meta ct-mute pt-0.5">{APPLY.whyTitle}</dt>
              <dd className="flex flex-col items-start gap-2">
                <span className="text-[0.96rem] whitespace-pre-line">{app.why}</span>
                <button type="button" className="ct-btn ct-btn-quiet min-h-9 px-0 text-[0.88rem]" onClick={() => go({ kind: "why" })}>
                  {ASSESSMENT.edit} <span className="sr-only">why this role</span>
                </button>
              </dd>
            </div>
            {questions.map((q, i) => (
              <div key={q.id} className="grid gap-1 px-5 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                <dt className="ct-meta ct-mute pt-0.5">Question {i + 1}</dt>
                <dd className="flex flex-col items-start gap-2">
                  <span className="ct-small">{q.prompt}</span>
                  <span className="text-[0.96rem] whitespace-pre-line">{app.responses[q.id]?.text}</span>
                  <button type="button" className="ct-btn ct-btn-quiet min-h-9 px-0 text-[0.88rem]" onClick={() => go({ kind: "question", index: i })}>
                    {ASSESSMENT.edit} <span className="sr-only">answer {i + 1}</span>
                  </button>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 grid max-w-3xl gap-6">
            <TextArea
              id="assessment-company-questions"
              label={APPLY.questionsTitle}
              value={app.questionsForCompany}
              onChange={(questionsForCompany) => update(role.slug, { questionsForCompany })}
              rows={3}
              hint={`${APPLY.questionsBody} ${APPLY.questionsHint}`}
            />
            <label className="ct-check flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--ct-green)]"
                checked={app.includeProfile}
                onChange={(e) => update(role.slug, { includeProfile: e.target.checked })}
              />
              <span>
                <span className="block text-[0.98rem]">{ASSESSMENT.includeProfile}</span>
                <span className="ct-small block">{ASSESSMENT.includeProfileHint}</span>
              </span>
            </label>
            <label className="ct-check flex items-start gap-3 border-t pt-6">
              <input
                id="assessment-consent"
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[var(--ct-green)]"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                <span className="block text-[0.98rem] font-medium">{APPLY.consentLabel}</span>
                <span className="ct-small block">{APPLY.consentBody}</span>
              </span>
            </label>
          </div>

          {error && (
            <p role="alert" className="ct-error mt-6">
              {error}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
            <button type="button" onClick={() => go({ kind: "question", index: questions.length - 1 })} className="ct-btn ct-btn-quiet">
              <span aria-hidden="true">←</span> {ASSESSMENT.back}
            </button>
            <button type="button" onClick={send} disabled={sending || state === "out-of-date"} aria-disabled={sending} className="ct-btn ct-btn-primary">
              {sending ? ASSESSMENT.sending : ASSESSMENT.send}
            </button>
          </div>
          <p className="ct-small mt-4">
            {APPLY.rather}{" "}
            <Link href={ROUTES.contact} className="ct-link">
              {APPLY.ratherLink}
            </Link>{" "}
            {APPLY.ratherTail}
          </p>
        </section>
      )}
    </div>
  );
}

function OutOfDate({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div role="status" className="ct-panel flex flex-wrap items-center justify-between gap-4 p-5" style={{ ["--ct-bc" as string]: "var(--ct-violet)" }}>
      <p className="ct-small max-w-2xl text-[var(--ct-ink)]">{ASSESSMENT.outOfDate}</p>
      <button type="button" onClick={onRefresh} className="ct-btn ct-btn-secondary">
        {ASSESSMENT.refresh}
      </button>
    </div>
  );
}

function Controls({ onBack, onNext, nextLabel }: { onBack: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
      <button type="button" onClick={onBack} className="ct-btn ct-btn-quiet">
        <span aria-hidden="true">←</span> {ASSESSMENT.back}
      </button>
      <button type="button" onClick={onNext} className="ct-btn ct-btn-primary">
        {nextLabel} <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function QuestionStep({
  question,
  index,
  total,
  competencyLabel,
  pointer,
  value,
  onChange,
  error,
  headingRef,
  onBack,
  onNext,
  nextLabel,
}: {
  question: Question;
  index: number;
  total: number;
  competencyLabel: string;
  pointer: { label: string } | null;
  value: string;
  onChange: (text: string) => void;
  error: string | null;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  const [touched, setTouched] = useState(false);
  const count = words(value);
  const [low, high] = question.response.suggestedWords;
  const over = count > question.response.maxWords;
  const id = `answer-${question.id}`;

  return (
    <section aria-labelledby="assessment-step-heading" className="grid gap-10 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-8">
        <p className="ct-meta ct-mute tabular-nums">
          {ASSESSMENT.question(index + 1, total)} · <span className="ct-green">{competencyLabel}</span>
        </p>
        <h2 id="assessment-step-heading" ref={headingRef} tabIndex={-1} className="ct-display mt-4 text-[clamp(1.35rem,2.4vw,1.75rem)] leading-[1.3]">
          {question.prompt}
        </h2>
        {pointer && (
          <p className="ct-small mt-4">
            {ASSESSMENT.drawOn}: <span className="text-[var(--ct-ink)]">{pointer.label}</span>
          </p>
        )}
        {/* On phones the guidance comes before the answer, not after it. */}
        <div className="mt-5 rounded-[var(--ct-r-m)] border p-4 lg:hidden">
          <p className="ct-meta ct-mute">{ASSESSMENT.covers}</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {question.guidance.map((g) => (
              <li key={g} className="flex gap-2.5 text-[0.93rem] leading-snug">
                <span aria-hidden="true" className="mt-[0.5rem] h-[0.35rem] w-[0.35rem] shrink-0 rounded-full bg-[var(--ct-green)]" />
                {g}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor={id} className="text-[0.95rem] font-medium">
            Your answer <span className="ct-green ml-2 text-[0.78rem] font-normal">Required</span>
          </label>
          <textarea
            id={id}
            className="ct-textarea"
            rows={10}
            value={value}
            onChange={(e) => {
              setTouched(true);
              onChange(e.target.value);
            }}
            aria-invalid={error || over ? true : undefined}
            aria-describedby={`${id}-count ${id}-confidential${error ? ` ${id}-error` : ""}`}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p id={`${id}-count`} className={cx("ct-meta tabular-nums", over ? "text-[#a83a1b]" : "ct-mute")}>
              {ASSESSMENT.words(count, low, high, question.response.maxWords)}
            </p>
            <p className="ct-meta ct-green" aria-live="polite">
              {touched ? ASSESSMENT.saved : ""}
            </p>
          </div>
          {(error || over) && (
            <p id={`${id}-error`} className="ct-error" role="alert">
              {error ?? ASSESSMENT.overLimit(question.response.maxWords)}
            </p>
          )}
          <p id={`${id}-confidential`} className="ct-small text-[0.86rem]">
            {ASSESSMENT.confidential}
          </p>
        </div>
        <Controls onBack={onBack} onNext={onNext} nextLabel={nextLabel} />
      </div>
      <div className="hidden lg:col-span-4 lg:block">
        <div className="ct-panel p-5 lg:sticky lg:top-[calc(var(--ct-nav-h)+1.5rem)]">
          <p className="ct-meta ct-mute">{ASSESSMENT.covers}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {question.guidance.map((g) => (
              <li key={g} className="flex gap-2.5 text-[0.95rem] leading-snug">
                <span aria-hidden="true" className="mt-[0.5rem] h-[0.35rem] w-[0.35rem] shrink-0 rounded-full bg-[var(--ct-green)]" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Answers({ app, questions }: { app: CandidateApplication; questions: Question[] }) {
  return (
    <dl className="flex flex-col">
      <div className="border-t py-5">
        <dt className="ct-meta ct-mute">{APPLY.whyTitle}</dt>
        <dd className="ct-body mt-2 whitespace-pre-line text-[var(--ct-ink)]">{app.why}</dd>
      </div>
      {questions.map((q, i) => (
        <div key={q.id} className="border-t py-5">
          <dt>
            <span className="ct-meta ct-mute">Question {i + 1}</span>
            <span className="ct-small mt-1 block">{q.prompt}</span>
          </dt>
          <dd className="ct-body mt-2 whitespace-pre-line text-[var(--ct-ink)]">{app.responses[q.id]?.text}</dd>
        </div>
      ))}
    </dl>
  );
}

