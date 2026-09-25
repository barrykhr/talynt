"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePassport } from "@/lib/candidate/passport";
import { useApplications } from "@/lib/candidate/saved";
import { formatCompensation, type Role } from "@/lib/candidate/roles";
import {
  AVAILABILITY,
  EXPERIENCE_BANDS,
  LOCATIONS,
  labelFor,
} from "@/lib/candidate/taxonomy";
import { transition } from "@/lib/motion";
import { ChipGroup, ConsentToggle, TextArea, TextField } from "./Fields";
import { ResumeUpload } from "./ResumeUpload";
import { cx } from "@/lib/utils";

/**
 * Applying, in six steps, one question at a time.
 *
 * Two rules run through it. Nothing is sent until the final step is confirmed —
 * there is no partial submission and no background save to a server. And the
 * confirmation tells the truth: if delivery is not configured for this
 * deployment, the person is given a direct email address rather than a
 * reassurance we cannot back.
 */

const STEPS = [
  { id: "you", label: "You" },
  { id: "where", label: "Where you are" },
  { id: "why", label: "Why this role" },
  { id: "experience", label: "Your experience" },
  { id: "questions", label: "Your questions" },
  { id: "review", label: "Review and send" },
] as const;

const FALLBACK_EMAIL = "talent@talyntlabs.com";

type Result =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "fallback"; message: string }
  | { kind: "error"; message: string };

export function ApplicationFlow({ role }: { role: Role }) {
  const { passport, update } = usePassport();
  const { record, find } = useApplications();
  const [step, setStep] = useState(0);
  const [why, setWhy] = useState("");
  const [questions, setQuestions] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<Result>({ kind: "idle" });

  const already = find(role.slug);

  const blocking = useMemo(() => {
    switch (STEPS[step].id) {
      case "you":
        return !passport.name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(passport.email)
          ? "Your name and an email we can reply to."
          : null;
      case "where":
        return !passport.currentLocationId ? "Where you are based." : null;
      case "why":
        return why.trim().length < 40
          ? "A few sentences. This is the part the hiring manager reads first."
          : null;
      default:
        return null;
    }
  }, [step, passport, why]);

  async function send() {
    setResult({ kind: "sending" });
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
          why,
          questions,
          resumeName: passport.resume?.name ?? null,
          consentGiven: true,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        fallback?: boolean;
        error?: string;
      };

      if (response.ok && data.ok) {
        record({ slug: role.slug, sentAt: new Date().toISOString(), delivered: true });
        setResult({ kind: "sent" });
        return;
      }
      if (data.fallback) {
        record({ slug: role.slug, sentAt: new Date().toISOString(), delivered: false });
        setResult({
          kind: "fallback",
          message: data.error ?? "We couldn't deliver that automatically.",
        });
        return;
      }
      setResult({ kind: "error", message: data.error ?? "That didn't go through." });
    } catch {
      setResult({
        kind: "fallback",
        message: "We couldn't reach our server just now.",
      });
    }
  }

  if (result.kind === "sent") {
    return (
      <Panel>
        <p className="mono-micro text-signal">Sent</p>
        <p className="display mt-5 text-(length:--text-h3) text-balance">
          Your application is with us.
        </p>
        <p className="mt-5 max-w-xl text-[0.95rem] leading-[1.65] text-fg-65">
          A person reads it — not a filter. You&rsquo;ll hear from us within five
          working days either way, with a reason. If that doesn&rsquo;t happen,
          chase us at{" "}
          <a href={`mailto:${FALLBACK_EMAIL}`} className="text-signal hover:opacity-70">
            {FALLBACK_EMAIL}
          </a>
          .
        </p>
        <p className="mt-6 text-[0.88rem] leading-[1.6] text-fg-45">
          Your Career Passport stayed on your device. What we received is what
          you saw on the review step and nothing more.
        </p>
      </Panel>
    );
  }

  if (result.kind === "fallback") {
    return (
      <Panel>
        <p className="mono-micro text-fg-45">Not delivered</p>
        <p className="display mt-5 text-(length:--text-h3) text-balance">
          {result.message}
        </p>
        <p className="mt-5 max-w-xl text-[0.95rem] leading-[1.65] text-fg-65">
          We&rsquo;re not going to tell you it arrived when it didn&rsquo;t. Send
          the same thing to{" "}
          <a href={`mailto:${FALLBACK_EMAIL}`} className="text-signal hover:opacity-70">
            {FALLBACK_EMAIL}
          </a>{" "}
          with <span className="font-mono text-[0.9em]">{role.slug}</span> in the
          subject line and it reaches the same person.
        </p>
        <details className="mt-7">
          <summary className="mono-micro cursor-pointer text-fg-50 hover:text-fg-80">
            Copy what you wrote
          </summary>
          <pre className="mt-4 overflow-x-auto rounded-md border border-current/12 p-5 font-mono text-[0.8rem] leading-[1.7] whitespace-pre-wrap text-fg-70">
{`Role: ${role.title} (${role.slug})
Name: ${passport.name}
Email: ${passport.email}
Based: ${labelFor(LOCATIONS, passport.currentLocationId)}
Available: ${passport.availabilityId ? labelFor(AVAILABILITY, passport.availabilityId) : "—"}

Why this role:
${why}

Questions:
${questions || "—"}`}
          </pre>
        </details>
      </Panel>
    );
  }

  const current = STEPS[step];

  return (
    <div className="rounded-lg border border-current/12 p-6 sm:p-9">
      {already && (
        <p className="mono-micro mb-7 rounded-md border border-current/15 px-4 py-3 text-fg-50">
          This device already sent an application for this role on{" "}
          {new Date(already.sentAt).toLocaleDateString()}
          {already.delivered ? "." : " — delivery was not confirmed."} Sending
          again is fine if something has changed.
        </p>
      )}

      {/* Step rail. The same index-and-label pattern used across the site. */}
      <ol className="flex flex-wrap gap-x-5 gap-y-2">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex items-baseline gap-2">
            <span
              className={cx(
                "mono-micro tabular-nums",
                i === step ? "text-signal" : i < step ? "text-fg-55" : "text-fg-30",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={cx(
                "mono-micro",
                i === step ? "text-fg-85" : i < step ? "text-fg-45" : "text-fg-30",
              )}
            >
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-8 border-t border-current/10 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={transition.fast}
          >
            {current.id === "you" && (
              <div className="flex flex-col gap-7">
                <Intro
                  title="Start with your name."
                  body="If you have a Career Passport on this device, these are already filled in. Editing here updates it."
                />
                <div className="grid gap-6 sm:grid-cols-2">
                  <TextField
                    label="Your name"
                    value={passport.name}
                    onChange={(name) => update({ name })}
                    required
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={passport.email}
                    onChange={(email) => update({ email })}
                    required
                    hint="Used to reply to you about this role. Nothing else."
                  />
                </div>
                <TextField
                  label="One line about what you do"
                  value={passport.headline}
                  onChange={(headline) => update({ headline })}
                  placeholder="Senior backend engineer, mostly payments infrastructure"
                />
              </div>
            )}

            {current.id === "where" && (
              <div className="flex flex-col gap-9">
                <Intro
                  title="Where are you, and when could you start?"
                  body="Both matter to this role specifically — it is stated as hybrid in two cities."
                />
                <ChipGroup
                  legend="Based in"
                  options={LOCATIONS}
                  selected={passport.currentLocationId ? [passport.currentLocationId] : []}
                  onChange={(ids) => update({ currentLocationId: ids[0] ?? "" })}
                  multiple={false}
                />
                <ChipGroup
                  legend="Availability"
                  options={AVAILABILITY}
                  selected={passport.availabilityId ? [passport.availabilityId] : []}
                  onChange={(ids) => update({ availabilityId: ids[0] ?? "" })}
                  multiple={false}
                />
              </div>
            )}

            {current.id === "why" && (
              <div className="flex flex-col gap-7">
                <Intro
                  title="Why this role?"
                  body="Not why you're a good candidate — we can read that. What about this specific role made you stop and read it."
                />
                <TextArea
                  label="In your own words"
                  value={why}
                  onChange={setWhy}
                  rows={7}
                  placeholder="The part about owning a surface through a rewrite is the thing I've been trying to get back to since…"
                  hint="Three or four sentences is plenty. Nobody here is counting words."
                />
                <div className="rounded-md border border-current/12 p-5">
                  <p className="mono-micro text-fg-40">From the role</p>
                  <p className="mt-3 text-[0.92rem] leading-[1.65] text-fg-60">
                    {role.whyExists[0]}
                  </p>
                </div>
              </div>
            )}

            {current.id === "experience" && (
              <div className="flex flex-col gap-9">
                <Intro
                  title="Your experience."
                  body="Attach a CV, or point us at what you've built. Either is fine — we read both."
                />
                <ResumeUpload />
                <ChipGroup
                  legend="Your level"
                  options={EXPERIENCE_BANDS}
                  selected={passport.bandId ? [passport.bandId] : []}
                  onChange={(ids) => update({ bandId: ids[0] ?? "" })}
                  multiple={false}
                />
                {passport.experience.length > 0 && (
                  <div>
                    <p className="mono-micro text-fg-45">From your Passport</p>
                    <ul className="mt-4 flex flex-col">
                      {passport.experience.map((e) => (
                        <li
                          key={e.id}
                          className="border-t border-current/10 py-4 first:border-t-0 first:pt-0"
                        >
                          <p className="text-[0.95rem]">
                            {e.title}
                            {e.organisation && (
                              <span className="text-fg-50"> · {e.organisation}</span>
                            )}
                          </p>
                          <p className="mono-micro mt-1.5 text-fg-35">
                            {e.from} — {e.to || "now"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[0.88rem] leading-[1.6] text-fg-45">
                  Nothing on your Passport is sent with this application except
                  what appears on the review step.
                </p>
              </div>
            )}

            {current.id === "questions" && (
              <div className="flex flex-col gap-7">
                <Intro
                  title="What do you want to know?"
                  body="Your questions go to the hiring manager with the application, before the first conversation, so the answers arrive in it rather than after."
                />
                <TextArea
                  label="Anything you'd want answered"
                  value={questions}
                  onChange={setQuestions}
                  rows={6}
                  placeholder="How much of the on-call load actually falls on this surface?"
                  hint="Optional, and genuinely used."
                />
                <div className="rounded-md border border-current/12 p-5">
                  <p className="mono-micro text-fg-40">Worth asking about</p>
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {role.consider.map((c) => (
                      <li key={c} className="text-[0.9rem] leading-[1.65] text-fg-60">
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {current.id === "review" && (
              <div className="flex flex-col gap-8">
                <Intro
                  title="This is everything that gets sent."
                  body="Read it. Nothing below this line leaves your device until you press send."
                />
                <dl className="flex flex-col">
                  <Row label="Role" value={`${role.title} — ${formatCompensation(role.compensation)}`} />
                  <Row label="Name" value={passport.name || "—"} />
                  <Row label="Email" value={passport.email || "—"} />
                  <Row label="Headline" value={passport.headline || "—"} />
                  <Row
                    label="Based"
                    value={
                      passport.currentLocationId
                        ? labelFor(LOCATIONS, passport.currentLocationId)
                        : "—"
                    }
                  />
                  <Row
                    label="Available"
                    value={
                      passport.availabilityId
                        ? labelFor(AVAILABILITY, passport.availabilityId)
                        : "—"
                    }
                  />
                  <Row
                    label="Level"
                    value={passport.bandId ? labelFor(EXPERIENCE_BANDS, passport.bandId) : "—"}
                  />
                  <Row label="CV" value={passport.resume?.name ?? "Not attached"} />
                  <Row label="Why this role" value={why || "—"} block />
                  <Row label="Your questions" value={questions || "—"} block />
                </dl>

                <div className="border-t border-current/10 pt-2">
                  <ConsentToggle
                    label="Send this to TALYNT LABS for this role"
                    body="We pass it to this one client. It is not added to a database that other clients search, and it is not used for any other role without asking you again."
                    checked={confirmed}
                    onChange={setConfirmed}
                  />
                </div>

                {result.kind === "error" && (
                  <p className="text-[0.9rem] leading-[1.6] text-signal">{result.message}</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* --- Step controls ------------------------------------------------ */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-5 border-t border-current/10 pt-7">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="mono-micro text-fg-45 transition-colors duration-300 hover:text-fg-80 disabled:opacity-40"
        >
          ← Back
        </button>

        <div className="flex flex-wrap items-center gap-5">
          {blocking && <span className="text-[0.85rem] text-fg-45">{blocking}</span>}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={Boolean(blocking)}
              className="inline-flex items-center gap-3 rounded-full bg-signal px-7 py-3.5 text-[0.95rem] font-medium text-paper-50 transition-colors duration-300 hover:bg-signal-600 disabled:cursor-not-allowed disabled:bg-current/15 disabled:text-fg-40"
            >
              Continue <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={send}
              disabled={!confirmed || result.kind === "sending"}
              className="inline-flex items-center gap-3 rounded-full bg-signal px-7 py-3.5 text-[0.95rem] font-medium text-paper-50 transition-colors duration-300 hover:bg-signal-600 disabled:cursor-not-allowed disabled:bg-current/15 disabled:text-fg-40"
            >
              {result.kind === "sending" ? "Sending…" : "Send application"}
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-[0.85rem] leading-[1.6] text-fg-40">
        Rather talk first? <Link href="/#contact" className="text-signal hover:opacity-70">Ask us a question</Link>{" "}
        instead — applying is not the only way in.
      </p>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-current/12 p-6 sm:p-9">{children}</div>;
}

function Intro({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="display text-(length:--text-h3) text-balance">{title}</p>
      <p className="mt-3 max-w-xl text-[0.94rem] leading-[1.65] text-fg-55">{body}</p>
    </div>
  );
}

function Row({
  label,
  value,
  block = false,
}: {
  label: string;
  value: string;
  block?: boolean;
}) {
  return (
    <div
      className={cx(
        "border-t border-current/10 py-4 first:border-t-0 first:pt-0",
        block ? "flex flex-col gap-2" : "flex flex-wrap items-baseline gap-x-6 gap-y-1",
      )}
    >
      <dt className="mono-micro shrink-0 text-fg-35 sm:w-40">{label}</dt>
      <dd
        className={cx(
          "text-[0.93rem] leading-[1.65] text-fg-75",
          block && "whitespace-pre-wrap",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
