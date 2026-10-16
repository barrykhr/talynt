"use client";

import Link from "next/link";
import { useId } from "react";
import type { Faq } from "@/lib/contour/faq";
import { cx } from "@/lib/utils";

/**
 * One question. A real button inside a heading, a labelled region, a height
 * transition that needs no measuring, and a stable id so the question can be
 * linked to directly. Hairlines, not cards.
 */
export function FaqItem({
  faq,
  open,
  onToggle,
  headingLevel = 3,
  showSources = true,
  linkBase,
}: {
  faq: Faq;
  open: boolean;
  onToggle: () => void;
  headingLevel?: 2 | 3;
  showSources?: boolean;
  /** Where the "link to this question" points. Defaults to this page. */
  linkBase?: string;
}) {
  const uid = useId();
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const panelId = `${uid}-panel`;
  const buttonId = `${uid}-button`;

  return (
    <div id={faq.id} className="scroll-mt-[calc(var(--ct-nav-h)+1.5rem)] border-t">
      <Heading className="m-0">
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="group flex w-full items-start justify-between gap-6 py-5 text-left"
        >
          <span className="text-[1.08rem] leading-snug font-medium tracking-[-0.01em] transition-colors group-hover:text-[var(--ct-green)]">
            {faq.question}
          </span>
          <span
            aria-hidden="true"
            className={cx(
              "relative mt-1.5 h-4 w-4 shrink-0 transition-transform duration-300",
              open && "rotate-45",
            )}
          >
            <span className="absolute top-1/2 left-0 h-[1.5px] w-4 -translate-y-1/2 bg-[var(--ct-ink)]" />
            <span className="absolute top-0 left-1/2 h-4 w-[1.5px] -translate-x-1/2 bg-[var(--ct-ink)]" />
          </span>
        </button>
      </Heading>
      <div className="ct-collapse" data-open={open ? "true" : "false"}>
        <div>
          <div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            // inert rather than hidden, so closing can animate while the
            // collapsed answer stays out of the tab order and the a11y tree.
            inert={!open}
            className="max-w-3xl pb-7"
          >
            {faq.answer.map((p) => (
              <p key={p} className="ct-body mt-3 first:mt-0">
                {p}
              </p>
            ))}
            {showSources && (
              <p className="ct-meta ct-mute mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>From</span>
                {faq.sources.map((s) => (
                  <Link key={s.href} href={s.href} className="ct-green hover:underline">
                    {s.label}
                  </Link>
                ))}
                <span aria-hidden="true">·</span>
                <a href={`${linkBase ?? ""}#${faq.id}`} className="hover:text-[var(--ct-ink)]">
                  Link to this question
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
