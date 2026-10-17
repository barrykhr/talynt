"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROUTES } from "@/lib/contour/site";
import { AUDIENCE_HOME, audienceOf, useAudience, type Audience } from "@/lib/contour/audience";
import { SWITCH } from "@/lib/contour/proposed";
import { useCandidateApplications } from "@/lib/candidate/applications";
import { cx } from "@/lib/utils";

/**
 * Two sides of one company. The links and the primary action follow the side
 * the page belongs to; on shared pages (FAQ, contact, legal) they follow the
 * visitor's last choice. The switch is always there, so nobody is trapped on
 * the side they picked first.
 */
const LINKS: Record<Audience, Array<{ label: string; href: string }>> = {
  employer: [
    { label: "How it works", href: `${ROUTES.employers}#how-we-work` },
    { label: "Evaluation", href: `${ROUTES.employers}#evaluation` },
    { label: "Shortlists", href: `${ROUTES.employers}#shortlist` },
    { label: "FAQ", href: ROUTES.faq },
  ],
  candidate: [
    { label: "Opportunities", href: ROUTES.opportunities },
    { label: "Your profile", href: ROUTES.profile },
    { label: "Applications", href: ROUTES.applications },
    { label: "FAQ", href: ROUTES.faq },
  ],
};

const ACTION: Record<Audience, { label: string; href: string }> = {
  employer: { label: "Tell us who you’re looking for", href: `${ROUTES.employers}#enquiry` },
  candidate: { label: "Explore opportunities", href: ROUTES.opportunities },
};

function isActive(pathname: string | null, href: string) {
  if (!pathname || href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AudienceSwitch({ side, onChoose, className }: { side: Audience; onChoose: (a: Audience) => void; className?: string }) {
  return (
    <div role="group" aria-label={SWITCH.label} className={cx("items-center rounded-full border ct-b2 p-0.5", className ?? "inline-flex")}>
      {(["employer", "candidate"] as const).map((a) => (
        <Link
          key={a}
          href={AUDIENCE_HOME[a]}
          onClick={() => onChoose(a)}
          aria-current={side === a ? "true" : undefined}
          className={cx(
            "flex min-h-9 items-center rounded-full px-3 text-[0.84rem] transition-colors",
            side === a
              ? a === "candidate"
                ? "bg-[var(--ct-violet-wash)] text-[var(--ct-violet-ink)]"
                : "bg-[var(--ct-green-wash)] text-[var(--ct-green-deep)]"
              : "text-[var(--ct-mute)] hover:text-[var(--ct-ink)]",
          )}
        >
          {a === "employer" ? SWITCH.employers : SWITCH.candidates}
        </Link>
      ))}
    </div>
  );
}

export function Nav() {
  const pathname = usePathname();
  const { audience, choose } = useAudience();
  const side: Audience = audienceOf(pathname) ?? audience ?? "employer";
  const [lifted, setLifted] = useState(false);
  const [open, setOpen] = useState(false);
  const { applications, loaded } = useCandidateApplications();
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A route change closes the menu. Adjusting state while rendering is the
  // pattern React recommends for "reset when a prop changes".
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  // Menu open: lock scroll, move focus in, trap Tab, close on Escape.
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const toggle = toggleRef.current;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      Array.from(menu?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [toggle, ...focusables()].filter(Boolean) as HTMLElement[];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const drafts = loaded ? applications.filter((a) => !a.submittedAt).length : 0;
  const links = LINKS[side];
  const action = ACTION[side];
  const home = audienceOf(pathname) || audience ? AUDIENCE_HOME[side] : ROUTES.home;

  // Remember the side of any page the visitor lands on, so shared pages follow it.
  const pageSide = audienceOf(pathname);
  useEffect(() => {
    if (pageSide && pageSide !== audience) choose(pageSide);
  }, [pageSide, audience, choose]);

  return (
    <header
      className={cx("sticky top-0 transition-[border-color] duration-300", lifted || open ? "border-b" : "border-b ct-b-none")}
      style={{ zIndex: "var(--ct-z-nav)" }}
    >
      {/* The frosted ground sits on its own layer: a backdrop-filter on the
          header itself would become the containing block for the fixed menu
          panel below and collapse it to the header's height. */}
      <div
        aria-hidden="true"
        className={cx(
          "pointer-events-none absolute inset-0 -z-10 transition-[background-color] duration-300",
          (lifted || open) && "bg-[color-mix(in_oklab,var(--ct-bg)_88%,transparent)] backdrop-blur-md",
        )}
      />
      <nav aria-label="Primary" className="ct-wrap flex h-[var(--ct-nav-h)] items-center justify-between gap-4">
        <Link href={home} className="shrink-0" aria-label="TALYNT LABS — home">
          {/* The approved lockup, as drawn. 36px tall keeps it above its 120px minimum width. */}
          <Image src="/brand/talynt-primary-light.svg" alt="" width={126} height={36} priority unoptimized className="h-9 w-auto" />
        </Link>

        <ul className="hidden items-center gap-0.5 xl:flex">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "relative flex h-10 items-center gap-1.5 rounded-[var(--ct-r-s)] px-3 text-[0.92rem] transition-colors duration-200",
                    active ? "text-[var(--ct-ink)]" : "text-[var(--ct-mute)] hover:text-[var(--ct-ink)]",
                  )}
                >
                  {link.label}
                  {link.href === ROUTES.applications && drafts > 0 && (
                    <span className="ct-meta rounded-full bg-[var(--ct-violet-wash)] px-1.5 py-0.5 text-[0.62rem] text-[var(--ct-violet-ink)] tabular-nums">
                      <span className="sr-only">, </span>
                      {drafts}
                      <span className="sr-only"> in progress</span>
                    </span>
                  )}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 -bottom-[0.95rem] h-[2px] rounded-full"
                      style={{ backgroundColor: side === "candidate" ? "var(--ct-violet)" : "var(--ct-green)" }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <AudienceSwitch side={side} onChoose={choose} className="hidden md:inline-flex" />
          <Link href={action.href} className="ct-btn ct-btn-primary hidden min-h-10 px-4 text-[0.9rem] lg:inline-flex">
            {action.label}
          </Link>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="ct-menu"
            className="flex h-11 w-11 items-center justify-center rounded-[var(--ct-r-m)] border ct-b2 xl:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true" className="flex flex-col gap-[5px]">
              <span
                className={cx(
                  "block h-[1.5px] w-[18px] bg-[var(--ct-ink)] transition-transform duration-300",
                  open && "translate-y-[3.25px] rotate-45",
                )}
              />
              <span
                className={cx(
                  "block h-[1.5px] w-[18px] bg-[var(--ct-ink)] transition-transform duration-300",
                  open && "-translate-y-[3.25px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="ct-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-x-0 bottom-0 top-[var(--ct-nav-h)] overflow-y-auto border-t bg-[var(--ct-bg)] xl:hidden"
          style={{ zIndex: "var(--ct-z-sheet)" }}
        >
          <div className="ct-wrap flex min-h-full flex-col justify-between gap-10 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <div>
              <AudienceSwitch side={side} onChoose={(a) => { choose(a); setOpen(false); }} />
              <ul className="mt-4">
                {[{ label: side === "employer" ? "For employers" : "For candidates", href: AUDIENCE_HOME[side] }, ...links].map((link) => (
                  <li key={link.href} className="border-b">
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={pathname === link.href ? "page" : undefined}
                      className="ct-display flex items-center justify-between py-4 text-[1.75rem] leading-tight"
                    >
                      {link.label}
                      <span aria-hidden="true" className="ct-meta ct-mute">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
                <li className="border-b">
                  <Link href={ROUTES.contact} onClick={() => setOpen(false)} className="flex items-center justify-between py-4 text-[1rem] text-[var(--ct-ink-2)]">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <Link href={action.href} onClick={() => setOpen(false)} className="ct-btn ct-btn-primary w-full">
              {action.label} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
