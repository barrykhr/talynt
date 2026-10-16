"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROUTES, isCandidatePath } from "@/lib/contour/site";
import { useSavedRoles } from "@/lib/candidate/saved";
import { cx } from "@/lib/utils";

const LINKS = [
  { label: "For employers", href: ROUTES.employers, audience: "employer" },
  { label: "For candidates", href: ROUTES.candidates, audience: "candidate" },
  { label: "Opportunities", href: ROUTES.opportunities, audience: "candidate" },
  { label: "FAQ", href: ROUTES.faq, audience: "both" },
] as const;

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const pathname = usePathname();
  const candidate = isCandidatePath(pathname);
  const [lifted, setLifted] = useState(false);
  const [open, setOpen] = useState(false);
  const { saved, loaded } = useSavedRoles();
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

  const savedCount = loaded ? saved.length : 0;

  return (
    <header
      className={cx(
        "sticky top-0 transition-[background-color,border-color] duration-300",
        lifted || open
          ? "border-b bg-[color-mix(in_oklab,var(--ct-bg)_88%,transparent)] backdrop-blur-md"
          : "border-b ct-b-none",
      )}
      style={{ zIndex: "var(--ct-z-nav)" }}
    >
      <nav aria-label="Primary" className="ct-wrap flex h-[var(--ct-nav-h)] items-center justify-between gap-6">
        <Link href={ROUTES.home} className="shrink-0" aria-label="TALYNT LABS — home">
          {/* The approved lockup, as drawn. 36px tall keeps it above its 120px minimum width. */}
          <Image
            src="/brand/talynt-primary-light.svg"
            alt=""
            width={126}
            height={36}
            priority
            unoptimized
            className="h-9 w-auto"
          />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "relative flex h-10 items-center rounded-[var(--ct-r-s)] px-3.5 text-[0.92rem] transition-colors duration-200",
                    active ? "text-[var(--ct-ink)]" : "text-[var(--ct-mute)] hover:text-[var(--ct-ink)]",
                  )}
                >
                  {link.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3.5 -bottom-[0.95rem] h-[2px] rounded-full"
                      style={{
                        backgroundColor: link.audience === "candidate" ? "var(--ct-violet)" : "var(--ct-green)",
                      }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          {candidate ? (
            <Link
              href={ROUTES.dashboard}
              aria-current={isActive(pathname, ROUTES.dashboard) ? "page" : undefined}
              className="hidden h-10 items-center gap-2 rounded-[var(--ct-r-s)] px-3 text-[0.92rem] text-[var(--ct-ink-2)] transition-colors hover:text-[var(--ct-ink)] sm:inline-flex"
            >
              Your dashboard
              {savedCount > 0 && (
                <span className="ct-meta rounded-full bg-[var(--ct-violet-wash)] px-1.5 py-0.5 text-[0.62rem] text-[var(--ct-violet-ink)] tabular-nums">
                  <span className="sr-only">, </span>
                  {savedCount}
                  <span className="sr-only"> saved</span>
                </span>
              )}
            </Link>
          ) : (
            <Link
              href={ROUTES.contact}
              aria-current={isActive(pathname, ROUTES.contact) ? "page" : undefined}
              className="hidden h-10 items-center rounded-[var(--ct-r-s)] px-3 text-[0.92rem] text-[var(--ct-ink-2)] transition-colors hover:text-[var(--ct-ink)] sm:inline-flex"
            >
              Contact
            </Link>
          )}

          <Link
            href={candidate ? ROUTES.opportunities : ROUTES.enquiry}
            className="ct-btn ct-btn-primary hidden min-h-10 px-4 text-[0.9rem] sm:inline-flex"
          >
            {candidate ? "Explore roles" : "Build your team"}
          </Link>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="ct-menu"
            className="flex h-11 w-11 items-center justify-center rounded-[var(--ct-r-m)] border ct-b2 lg:hidden"
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
          className="fixed inset-x-0 bottom-0 top-[var(--ct-nav-h)] overflow-y-auto border-t bg-[var(--ct-bg)] lg:hidden"
          style={{ zIndex: "var(--ct-z-sheet)" }}
        >
          <div className="ct-wrap flex min-h-full flex-col justify-between gap-10 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <ul>
              {[{ label: "Home", href: ROUTES.home, audience: "both" as const }, ...LINKS].map((link) => (
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
                <Link
                  href={ROUTES.dashboard}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-4 text-[1rem] text-[var(--ct-ink-2)]"
                >
                  Your dashboard
                  {savedCount > 0 && <span className="ct-meta ct-violet">{savedCount} saved</span>}
                </Link>
              </li>
              <li className="border-b">
                <Link
                  href={ROUTES.contact}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-4 text-[1rem] text-[var(--ct-ink-2)]"
                >
                  Contact
                </Link>
              </li>
            </ul>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href={ROUTES.enquiry} onClick={() => setOpen(false)} className="ct-btn ct-btn-primary w-full">
                Build your team <span aria-hidden="true">→</span>
              </Link>
              <Link
                href={ROUTES.opportunities}
                onClick={() => setOpen(false)}
                className="ct-btn ct-btn-secondary w-full"
              >
                Explore roles <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
