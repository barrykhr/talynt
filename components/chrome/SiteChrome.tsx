"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { ScrollProgress } from "./ScrollProgress";

/**
 * Design directions under /directions are self-contained alternatives — they
 * bring their own navigation, footer and type system, so the shared site chrome
 * steps out of the way for them.
 */
export function SiteChrome({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname?.startsWith("/directions")) {
    return <>{children}</>;
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-signal focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-paper-50"
      >
        Skip to content
      </a>
      <ScrollProgress />
      <Navigation />
      <main id="main">{children}</main>
      {footer}
    </>
  );
}
