"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Mark, Wordmark } from "@/components/primitives/Wordmark";
import { ModeSwitch } from "./ModeSwitch";
import { transition } from "@/lib/motion";
import { cx } from "@/lib/utils";

/**
 * The same navigation, pointed at a different set of destinations.
 *
 * Structure, height, lift threshold, underline behaviour and the mobile
 * overlay are the client navigation's — deliberately, so a person moving
 * between the two never feels a seam.
 */

const LINKS = [
  { label: "Explore roles", href: "/candidates/roles" },
  { label: "Career Passport", href: "/candidates/passport" },
  { label: "How we evaluate", href: "/candidates/how-we-evaluate" },
  { label: "Saved roles", href: "/candidates/saved" },
];

export function CandidateNav() {
  const { scrollY } = useScroll();
  const pathname = usePathname();
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
          aria-label="Candidate"
          className="wrap flex h-[4.5rem] items-center justify-between gap-6"
        >
          <div className="flex items-center gap-5">
            <Link
              href="/candidates"
              className="flex items-center gap-3 text-paper-100"
              aria-label="TALYNT LABS — for candidates"
              onClick={() => setOpen(false)}
            >
              <Mark className="h-7 w-7" />
              <Wordmark variant="inline" className="text-[0.95rem]" />
            </Link>
            {/* Wrapped rather than given `hidden md:inline-flex`: putting two
                display utilities on one element leaves the winner up to the
                order Tailwind emits them in. */}
            <span className="hidden md:block">
              <ModeSwitch className="text-paper-100" />
            </span>
          </div>

          <ul className="hidden items-center gap-8 lg:flex">
            {LINKS.map((link) => {
              const active =
                link.href === "/candidates"
                  ? pathname === link.href
                  : pathname?.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "group relative text-[0.9rem] transition-colors duration-300 hover:text-paper-100",
                      active ? "text-paper-100" : "text-paper-100/65",
                    )}
                  >
                    {link.label}
                    <span
                      className={cx(
                        "absolute -bottom-1.5 left-0 h-px bg-signal transition-[width] duration-400 ease-(--ease-out-expo) group-hover:w-full",
                        active ? "w-full" : "w-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <Link
              href="/candidates/passport"
              className="hidden rounded-full bg-paper-100 px-5 py-2.5 text-[0.88rem] font-medium text-ink-900 transition-colors duration-300 hover:bg-signal hover:text-paper-50 sm:inline-flex"
            >
              Create your Career Passport
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="candidate-menu"
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
            id="candidate-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition.fast}
            className="fixed inset-0 z-40 flex flex-col justify-between overflow-y-auto bg-ink-950 px-(--spacing-gutter) pt-28 pb-12 lg:hidden"
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
            <div className="mt-10 flex flex-col gap-6">
              <Link
                href="/candidates/passport"
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-signal px-7 py-4 font-medium text-paper-50"
              >
                Create your Career Passport <span aria-hidden="true">→</span>
              </Link>
              <div className="flex items-center justify-between gap-4">
                <p className="mono-micro text-paper-100/40">Hiring instead?</p>
                <ModeSwitch className="text-paper-100" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
