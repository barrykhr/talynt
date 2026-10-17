"use client";

/**
 * Which side of TALYNT the visitor chose on the entry screen. Kept on this
 * device only — it is a convenience, so a returning visitor isn't asked again
 * and the navigation shows their side first. It is never sent anywhere.
 */

import { useCallback } from "react";
import { createLocalStore, useHydrated, useLocalStore } from "@/lib/candidate/store";
import { ROUTES } from "./site";

export type Audience = "employer" | "candidate";

const store = createLocalStore<Audience | null>("talynt.audience.v1", null, (raw) =>
  raw === "employer" || raw === "candidate" ? raw : null,
);

export function useAudience() {
  const audience = useLocalStore(store);
  const loaded = useHydrated();
  const choose = useCallback((next: Audience) => store.set(next), []);
  return { audience, loaded, choose };
}

export const AUDIENCE_HOME: Record<Audience, string> = {
  employer: ROUTES.employers,
  candidate: ROUTES.candidates,
};

/** Which side a page belongs to, when it belongs to one. */
export function audienceOf(pathname: string | null): Audience | null {
  if (!pathname) return null;
  const within = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  if ([ROUTES.candidates, ROUTES.opportunities, ROUTES.profile, ROUTES.applications].some(within)) return "candidate";
  if (within(ROUTES.employers)) return "employer";
  return null;
}
