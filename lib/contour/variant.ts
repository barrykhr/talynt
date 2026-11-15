/**
 * Build-time design variants of this direction.
 *
 *   NEXT_PUBLIC_CT_VARIANT unset   the full design: the entry choice, employers
 *                                  and candidates, in the editorial palette.
 *   NEXT_PUBLIC_CT_VARIANT=mono    the employer site only, in black and white
 *                                  with a touch of lime. Same pages, same copy;
 *                                  the candidate pages are not linked from it.
 *
 * Read at build time (it is a NEXT_PUBLIC_ value), so the two are separate
 * builds; the default build is exactly the full design.
 */
export const VARIANT: "full" | "mono" = process.env.NEXT_PUBLIC_CT_VARIANT === "mono" ? "mono" : "full";

/** The mono variant is the employer site on its own. */
export const EMPLOYERS_ONLY = VARIANT === "mono";

/**
 * The approved lockups. The mono variant uses the approved single-colour
 * files; they draw in black and are inverted on the black sections.
 */
export const LOGO =
  VARIANT === "mono"
    ? { primary: "/brand/talynt-primary-mono.svg", tagline: "/brand/talynt-tagline-mono.svg" }
    : { primary: "/brand/talynt-primary-light.svg", tagline: "/brand/talynt-tagline-light.svg" };
