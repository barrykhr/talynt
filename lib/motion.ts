import type { Transition, Variants } from "framer-motion";

/** The brand's motion character: decisive entry, no bounce, no idling. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT_QUINT = [0.83, 0, 0.17, 1] as const;

export const transition = {
  fast: { duration: 0.45, ease: EASE_OUT_EXPO },
  base: { duration: 0.75, ease: EASE_OUT_EXPO },
  slow: { duration: 1.1, ease: EASE_OUT_EXPO },
} satisfies Record<string, Transition>;

/** Standard reveal: content rises into place once, then stays still. */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: transition.base },
};

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.slow },
};

/** Children resolve in sequence — information arriving, not decoration. */
export const staggerParent = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

export const VIEWPORT = { once: true, amount: 0.3 } as const;
export const VIEWPORT_EARLY = { once: true, amount: 0.15 } as const;
