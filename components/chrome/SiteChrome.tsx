"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { ScrollProgress } from "./ScrollProgress";
import { CandidateNav } from "@/components/candidate/CandidateNav";
import { CandidateFooter } from "@/components/candidate/CandidateFooter";

/**
 * Design directions under /directions are self-contained alternatives — they
 * bring their own navigation, footer and type system, so the shared site chrome
 * steps out of the way for them.
 *
 * /candidates keeps the chrome and swaps its destinations: the same header
 * geometry and the same footer composition, pointed at the candidate's routes.
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

  const candidate = pathname?.startsWith("/candidates") ?? false;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-signal focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-paper-50"
      >
        Skip to content
      </a>
      <ScrollProgress />
      {candidate ? <CandidateNav /> : <Navigation />}
      <main id="main">{children}</main>
      {candidate ? <CandidateFooter /> : footer}
    </>
  );
}
