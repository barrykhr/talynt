"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { cx } from "@/lib/utils";

const LINKS = [
  { label: "The journey", href: "#journey" },
  { label: "The standard", href: "#standard" },
  { label: "Capabilities", href: "#capabilities" },
];

export function PassageNav() {
  const { scrollY } = useScroll();
  const [lifted, setLifted] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setLifted(v > 80));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={cx(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        lifted
          ? "border-b border-[color:var(--pg-rule)] bg-[color:var(--pg-bone)]/90 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <nav
        aria-label="Primary"
        className={cx(
          "mx-auto flex h-20 w-full max-w-[96rem] items-center justify-between gap-8 px-6 transition-colors duration-500 sm:px-10",
          lifted ? "text-[color:var(--pg-char)]" : "text-white",
        )}
      >
        <Link href="/directions/passage" className="flex items-baseline gap-2.5">
          <span className="pg-display text-[1.45rem] leading-none">Talynt</span>
          <span className="pg-kicker text-[0.58rem] text-[color:var(--pg-signal)]">
            Labs
          </span>
        </Link>

        <ul className="hidden items-center gap-10 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="pg-kicker text-[0.62rem] opacity-70 transition-opacity duration-300 hover:opacity-100"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href="#start"
            className={cx(
              "pg-kicker hidden rounded-full px-5 py-2.5 text-[0.6rem] whitespace-nowrap transition-colors duration-500 sm:inline-flex",
              lifted
                ? "bg-[color:var(--pg-char)] text-[color:var(--pg-bone)] hover:bg-[color:var(--pg-signal)]"
                : "bg-white/95 text-[color:var(--pg-char)] hover:bg-[color:var(--pg-signal)] hover:text-white",
            )}
          >
            Start a search
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="passage-menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-current/30 md:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true" className="flex flex-col gap-[5px]">
              <span
                className={cx(
                  "block h-px w-4 bg-current transition-transform duration-300",
                  open && "translate-y-[3px] rotate-45",
                )}
              />
              <span
                className={cx(
                  "block h-px w-4 bg-current transition-transform duration-300",
                  open && "-translate-y-[3px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </nav>

      {open && (
        <ul
          id="passage-menu"
          className="border-t border-[color:var(--pg-rule)] bg-[color:var(--pg-bone)] px-6 pt-2 pb-6 text-[color:var(--pg-char)] md:hidden"
        >
          {LINKS.map((link) => (
            <li key={link.href} className="border-b border-[color:var(--pg-rule)]">
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="pg-display block py-4 text-[1.6rem]"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="pt-5 sm:hidden">
            <a
              href="#start"
              onClick={() => setOpen(false)}
              className="pg-kicker block rounded-full bg-[color:var(--pg-char)] px-6 py-4 text-center text-[0.62rem] text-[color:var(--pg-bone)]"
            >
              Start a search
            </a>
          </li>
        </ul>
      )}
    </header>
  );
}

const TICKER = [
  "Less noise. More signal.",
  "Deep sourcing",
  "Human conversations",
  "Structured evaluation",
  "Human judgment",
  "We recruit people, not profiles",
];

export function Marquee() {
  const run = [...TICKER, ...TICKER];
  return (
    <div
      className="overflow-hidden border-y border-[color:var(--pg-rule)] bg-[color:var(--pg-bone)] py-5"
      aria-hidden="true"
    >
      <div className="pg-marquee">
        {run.map((item, i) => (
          <span
            key={i}
            className="pg-display flex shrink-0 items-center gap-10 pr-10 text-[1.6rem] whitespace-nowrap opacity-80"
          >
            {item}
            <span className="text-[0.7rem] text-[color:var(--pg-signal)]">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function PassageFooter() {
  return (
    <footer className="bg-[color:var(--pg-moss)] text-[color:var(--pg-bone)]">
      <div className="mx-auto w-full max-w-[96rem] px-6 py-16 sm:px-10">
        <div className="flex flex-col gap-10 border-b border-[color:var(--pg-rule-inv)] pb-10 md:flex-row md:items-end md:justify-between">
          <div className="flex items-baseline gap-3">
            <span className="pg-display text-[2.6rem] leading-none">Talynt</span>
            <span className="pg-kicker text-[0.65rem] text-[color:var(--pg-signal)]">
              Labs
            </span>
          </div>
          <p className="pg-display text-[length:clamp(1.3rem,2vw,1.9rem)] opacity-75">
            Talent intelligence, built for hiring.
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="pg-kicker text-[0.6rem] opacity-45">
            Direction B — Passage · Design sample
          </p>
          <Link
            href="/"
            className="pg-kicker text-[0.6rem] text-[color:var(--pg-signal)] transition-opacity duration-300 hover:opacity-70"
          >
            ← See direction A
          </Link>
        </div>
      </div>
    </footer>
  );
}
