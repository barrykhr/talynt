"use client";

import { MotionConfig } from "framer-motion";

/**
 * Tells framer-motion to honour the visitor's reduced-motion setting for every
 * animation in this direction — including the shared Reveal primitive, which
 * does not check it itself. Transforms are dropped; content is never withheld.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
