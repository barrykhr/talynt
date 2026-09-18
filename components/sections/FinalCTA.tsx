"use client";

import { useState } from "react";
import { Section } from "@/components/primitives/Section";
import { Reveal } from "@/components/primitives/Reveal";
import { cx } from "@/lib/utils";

const CONTACT_EMAIL = "hello@talyntlabs.com";

const FIELDS = [
  { name: "name", label: "Name", type: "text", autoComplete: "name", required: true },
  {
    name: "email",
    label: "Work email",
    type: "email",
    autoComplete: "email",
    required: true,
  },
  {
    name: "company",
    label: "Company",
    type: "text",
    autoComplete: "organization",
    required: false,
  },
  {
    name: "hiringFor",
    label: "What are you hiring for?",
    type: "text",
    autoComplete: "off",
    required: false,
  },
] as const;

type Status = "idle" | "sending" | "sent" | "fallback" | "error";

export function FinalCTA() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    const data = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as {
        ok: boolean;
        fallback?: boolean;
        error?: string;
      };

      if (result.ok) {
        setStatus("sent");
        return;
      }

      setError(result.error ?? "Something went wrong.");
      setStatus(result.fallback ? "fallback" : "error");
    } catch {
      setError("We couldn't reach the server.");
      setStatus("fallback");
    }
  }

  return (
    <Section id="contact" tone="paper" aria-labelledby="contact-heading">
      <div className="wrap grid gap-16 lg:grid-cols-[1fr_1fr] lg:gap-24">
        <div>
          <Reveal className="mb-10 flex items-baseline gap-4">
            <span className="mono-micro text-signal">16</span>
            <span className="mono-micro opacity-50">Start a search</span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="contact-heading" className="display text-(length:--text-h2)">
              Let&rsquo;s find the people who{" "}
              <span className="italic">move your business forward.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-9 max-w-md text-(length:--text-lede) leading-[1.45] opacity-65">
              Tell us what you&rsquo;re building, what you&rsquo;re hiring for and
              where you need help.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-12 border-t border-ink-900/15 pt-8">
              <p className="mono-micro mb-3 opacity-45">Or write to us directly</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="display text-(length:--text-h3) underline decoration-signal decoration-1 underline-offset-8 transition-colors duration-300 hover:text-signal"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          {status === "sent" ? (
            <div className="flex h-full flex-col justify-center rounded-lg border border-signal/35 bg-signal/[0.06] p-9">
              <p className="mono-micro text-signal">Received</p>
              <p className="display mt-6 text-(length:--text-h3) text-balance">
                Thank you. A person — not an autoresponder — will read this and
                come back to you.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-7" noValidate>
              {FIELDS.map((field) => (
                <div key={field.name} className="flex flex-col gap-2.5">
                  <label
                    htmlFor={field.name}
                    className="mono-micro flex items-center gap-2 opacity-50"
                  >
                    {field.label}
                    {field.required && (
                      <span className="text-signal" aria-hidden="true">
                        *
                      </span>
                    )}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    required={field.required}
                    className="border-b border-ink-900/25 bg-transparent pb-3 text-[1.05rem] transition-colors duration-300 outline-none placeholder:opacity-30 focus:border-signal"
                  />
                </div>
              ))}

              <div className="flex flex-col gap-2.5">
                <label htmlFor="message" className="mono-micro opacity-50">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="resize-none border-b border-ink-900/25 bg-transparent pb-3 text-[1.05rem] transition-colors duration-300 outline-none focus:border-signal"
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-5">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className={cx(
                    "group inline-flex items-center gap-3 rounded-full bg-ink-900 px-7 py-3.5 text-[0.95rem] font-medium text-paper-100 transition-colors duration-300",
                    status === "sending"
                      ? "opacity-60"
                      : "hover:bg-signal hover:text-paper-50",
                  )}
                >
                  {status === "sending" ? "Sending" : "Build your team"}
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </button>
                <p className="mono-micro max-w-[18rem] opacity-40">
                  We reply to every enquiry, including the ones we can&rsquo;t help
                  with.
                </p>
              </div>

              <div aria-live="polite" className="min-h-6">
                {(status === "fallback" || status === "error") && (
                  <p className="text-[0.9rem] leading-relaxed text-signal-700">
                    {error}{" "}
                    {status === "fallback" && (
                      <>
                        Please email{" "}
                        <a
                          href={`mailto:${CONTACT_EMAIL}`}
                          className="underline underline-offset-4"
                        >
                          {CONTACT_EMAIL}
                        </a>{" "}
                        and we&rsquo;ll pick it up from there.
                      </>
                    )}
                  </p>
                )}
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </Section>
  );
}
