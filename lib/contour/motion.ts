"use client";

import { useSyncExternalStore } from "react";

/**
 * prefers-reduced-motion, hydration-safe.
 *
 * framer-motion's own hook reads the media query during the first client
 * render, so a reduced-motion visitor's first render differs from the server's
 * HTML and React throws a hydration error. This reports `false` while
 * hydrating and the real preference immediately after, and re-renders if the
 * preference changes while the page is open.
 */
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useCalm(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
