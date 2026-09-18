"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Mark, Wordmark } from "@/components/primitives/Wordmark";
import { transition } from "@/lib/motion";
import { cx } from "@/lib/utils";

const LINKS = [
  { label: "How we work", href: "/#how-we-work" },
  { label: "Talent intelligence", href: "/#intelligence" },
  { label: "For companies", href: "/#companies" },
  { label: "For talent", href: "/#for-talent" },
];

export function Navigation() {
  const { scrollY } = useScroll();
  const [lifted, setLifted] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setLifted(latest > 24);
  });

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={cx(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-(--ease-out-expo)",
          lifted && !open
            ? "border-b border-paper-100/10 bg-ink-900/72 backdrop-blur-xl"
            : "border-b border-transparent",
        )}
      >
        <nav
          aria-label="Primary"
          className="wrap flex h-[4.5rem] items-center justify-between gap-8"
        >
          <Link
            href="/"
            className="flex items-center gap-3 text-paper-100"
            aria-label="TALYNT LABS — home"
            onClick={() => setOpen(false)}
          >
            <Mark className="h-7 w-7" />
            <Wordmark variant="inline" className="text-[0.95rem]" />
          </Link>

          <ul className="hidden items-center gap-9 lg:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group relative text-[0.9rem] text-paper-100/65 transition-colors duration-300 hover:text-paper-100"
                >
                  {link.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-signal transition-[width] duration-400 ease-(--ease-out-expo) group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <Link
              href="/#contact"
              className="hidden rounded-full bg-paper-100 px-5 py-2.5 text-[0.88rem] font-medium text-ink-900 transition-colors duration-300 hover:bg-signal hover:text-paper-50 sm:inline-flex"
            >
              Build your team
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full border border-paper-100/20 text-paper-100 lg:hidden"
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <span className="flex flex-col gap-[5px]" aria-hidden="true">
                <span
                  className={cx(
                    "block h-px w-4 bg-current transition-transform duration-300 ease-(--ease-out-expo)",
                    open && "translate-y-[3px] rotate-45",
                  )}
                />
                <span
                  className={cx(
                    "block h-px w-4 bg-current transition-transform duration-300 ease-(--ease-out-expo)",
                    open && "-translate-y-[3px] -rotate-45",
                  )}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition.fast}
            className="fixed inset-0 z-40 flex flex-col justify-between bg-ink-950 px-(--spacing-gutter) pt-28 pb-12 lg:hidden"
          >
            <ul className="flex flex-col gap-1">
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transition.base, delay: 0.05 + i * 0.06 }}
                  className="border-b border-paper-100/10"
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="display block py-5 text-[2rem] text-paper-100"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="flex flex-col gap-6">
              <Link
                href="/#contact"
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-signal px-7 py-4 font-medium text-paper-50"
              >
                Build your team <span aria-hidden="true">→</span>
              </Link>
              <p className="mono-micro text-paper-100/40">
                Talent intelligence, built for hiring.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
