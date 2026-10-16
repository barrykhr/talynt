"use client";

import { useRef, useState } from "react";
import { ENQUIRY } from "@/lib/contour/content";
import { EMAIL } from "@/lib/contour/site";
import { cx } from "@/lib/utils";

/**
 * The enquiry form, on the existing route.
 *
 * POST /api/contact is unchanged: it forwards to CONTACT_WEBHOOK_URL, and when
 * no destination is configured it answers 503 with `fallback: true`. This form
 * keeps that contract exactly — "Received" only ever appears after the route
 * says ok, and every failure hands the person a working email address.
 *
 * What is new is the client-side care: required fields are checked before
 * sending, errors sit next to the field they belong to, and focus goes where
 * the person needs to look next.
 */

type Field = "name" | "email" | "company" | "hiringFor" | "message";
type Status = "idle" | "sending" | "sent" | "fallback" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ContactForm({ idPrefix = "enquiry" }: { idPrefix?: string }) {
  const [values, setValues] = useState<Record<Field, string>>({
    name: "",
    email: "",
    company: "",
    hiringFor: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  function validate(): Partial<Record<Field, string>> {
    const next: Partial<Record<Field, string>> = {};
    if (!values.name.trim()) next.name = "Your name, so we know who to reply to.";
    if (!values.email.trim()) next.email = "A work email we can reply to.";
    else if (!EMAIL_RE.test(values.email.trim())) next.email = "That email address doesn’t look right.";
    return next;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      formRef.current?.querySelector<HTMLElement>(`#${idPrefix}-${first}`)?.focus();
      return;
    }

    setStatus("sending");
    setServerMessage(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        fallback?: boolean;
        error?: string;
      };
      if (response.ok && data.ok) {
        setStatus("sent");
        requestAnimationFrame(() => resultRef.current?.focus());
        return;
      }
      setServerMessage(data.error ?? "Something went wrong.");
      setStatus(data.fallback ? "fallback" : "error");
    } catch {
      setServerMessage("We couldn’t reach the server.");
      setStatus("fallback");
    }
  }

  if (status === "sent") {
    return (
      <div
        ref={resultRef}
        tabIndex={-1}
        role="status"
        className="ct-panel flex flex-col justify-center p-7 outline-none sm:p-10"
        style={{ backgroundColor: "var(--ct-green-wash)", ["--ct-bc" as string]: "var(--ct-green)" }}
      >
        <p className="ct-meta ct-green">{ENQUIRY.receivedLabel}</p>
        <p className="ct-display ct-m mt-5">{ENQUIRY.received}</p>
      </div>
    );
  }

  const fields: Array<{
    name: Field;
    label: string;
    type?: string;
    autoComplete: string;
    required?: boolean;
    multiline?: boolean;
    half?: boolean;
  }> = [
    { name: "name", label: ENQUIRY.fields.name, autoComplete: "name", required: true, half: true },
    { name: "email", label: ENQUIRY.fields.email, type: "email", autoComplete: "email", required: true, half: true },
    { name: "company", label: ENQUIRY.fields.company, autoComplete: "organization", half: true },
    { name: "hiringFor", label: ENQUIRY.fields.hiringFor, autoComplete: "off", half: true },
    { name: "message", label: ENQUIRY.fields.message, autoComplete: "off", multiline: true },
  ];

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6" aria-describedby={`${idPrefix}-req`}>
      <p id={`${idPrefix}-req`} className="ct-small">
        Fields marked <span aria-hidden="true">*</span>
        <span className="sr-only">required</span> are required. Everything else is optional.
      </p>

      {errorCount > 0 && (
        <div role="alert" className="rounded-[var(--ct-r-s)] border px-4 py-3" style={{ ["--ct-bc" as string]: "#b3401f" }}>
          <p className="ct-error">
            {errorCount === 1 ? "One thing needs fixing" : `${errorCount} things need fixing`} before this can be sent.
          </p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {fields.map((f) => {
          const id = `${idPrefix}-${f.name}`;
          const error = errors[f.name];
          const common = {
            id,
            name: f.name,
            value: values[f.name],
            onChange: set(f.name),
            autoComplete: f.autoComplete,
            required: f.required,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": error ? `${id}-error` : undefined,
          };
          return (
            <div key={f.name} className={cx("flex flex-col gap-2", !f.half && "sm:col-span-2")}>
              <label htmlFor={id} className="text-[0.92rem] font-medium">
                {f.label}
                {f.required && (
                  <span aria-hidden="true" className="ct-green">
                    {" "}
                    *
                  </span>
                )}
              </label>
              {f.multiline ? (
                <textarea {...common} rows={4} className="ct-textarea" />
              ) : (
                <input {...common} type={f.type ?? "text"} className="ct-input" />
              )}
              {error && (
                <p id={`${id}-error`} className="ct-error">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
        <button type="submit" disabled={status === "sending"} className="ct-btn ct-btn-primary" aria-disabled={status === "sending"}>
          {status === "sending" ? (
            <>
              <span
                aria-hidden="true"
                className="h-3 w-3 animate-spin rounded-full border-2"
                style={{ borderColor: "var(--ct-bg)", borderTopColor: "transparent" }}
              />
              {ENQUIRY.sending}
            </>
          ) : (
            <>
              {ENQUIRY.submit} <span aria-hidden="true" className="ct-btn-arrow">→</span>
            </>
          )}
        </button>
        <p className="ct-small max-w-xs">{ENQUIRY.promise}</p>
      </div>

      <div aria-live="polite" className="min-h-6">
        {(status === "fallback" || status === "error") && (
          <p className="ct-error">
            {serverMessage}{" "}
            {status === "fallback" && (
              <>
                {ENQUIRY.fallbackLead}{" "}
                <a href={`mailto:${EMAIL.general}`} className="underline underline-offset-2">
                  {EMAIL.general}
                </a>{" "}
                {ENQUIRY.fallbackTail}
              </>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
