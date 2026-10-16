"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES, whatsappHref } from "@/lib/contour/site";
import { cx } from "@/lib/utils";
import { WhatsAppIcon } from "./Icons";

/**
 * A discreet way to reach a person.
 *
 * Renders nothing unless a verified number is configured. It never sits over
 * an application action: on the role pages and the profile flow it stays out
 * of the way on small screens, where those pages carry their own sticky bar,
 * and it steps aside everywhere once the footer (which repeats it) is in view.
 */
export function WhatsAppButton() {
  const href = whatsappHref();
  const pathname = usePathname();
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.getElementById("ct-footer");
    if (!footer) return;
    const observer = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting), {
      rootMargin: "0px 0px -40px 0px",
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  if (!href) return null;

  const busyOnMobile =
    pathname?.startsWith(`${ROUTES.opportunities}/`) || pathname?.startsWith(ROUTES.profile);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(
        "fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] items-center gap-2 rounded-full border ct-b2 bg-[var(--ct-surface)] px-3.5 text-[0.88rem] text-[var(--ct-ink)] shadow-[0_8px_24px_-12px_rgba(32,35,33,0.35)] transition-[opacity,transform] duration-300 ct-hb-green hover:text-[var(--ct-green-deep)]",
        "h-12 min-w-12 justify-center",
        busyOnMobile ? "hidden md:inline-flex" : "inline-flex",
        footerVisible && "pointer-events-none translate-y-2 opacity-0",
      )}
      style={{ zIndex: "var(--ct-z-float)" }}
      aria-label="Message TALYNT LABS on WhatsApp (opens in a new tab)"
      aria-hidden={footerVisible ? true : undefined}
      tabIndex={footerVisible ? -1 : undefined}
    >
      <WhatsAppIcon className="h-5 w-5 text-[var(--ct-green)]" />
      <span aria-hidden="true" className="hidden sm:inline">
        WhatsApp
      </span>
    </a>
  );
}
