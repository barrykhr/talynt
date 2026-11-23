/**
 * Build-time design variants of this direction.
 *
 *   NEXT_PUBLIC_CT_VARIANT unset   the full design: the entry choice, employers
 *                                  and candidates, in the editorial palette.
 *   NEXT_PUBLIC_CT_VARIANT=mono    the employer site on its own: black, white
 *                                  and lime, in motion.
 *   NEXT_PUBLIC_CT_VARIANT=cream   the employer site on its own: cream, cobalt
 *                                  blue and a touch of tangerine, in motion.
 *
 * Read at build time (it is a NEXT_PUBLIC_ value), so each is a separate
 * build; the default build is exactly the full design.
 */
const RAW = process.env.NEXT_PUBLIC_CT_VARIANT;
export const VARIANT: "full" | "mono" | "cream" = RAW === "mono" ? "mono" : RAW === "cream" ? "cream" : "full";

/** Both colourways are the employer site on its own. */
export const EMPLOYERS_ONLY = VARIANT !== "full";

/** Both colourways carry the scroll-driven motion layer (components/contour/motion). */
export const MOTION = VARIANT !== "full";

/** The page colour behind each variant, for the browser's theme colour. */
export const THEME_COLOR = { full: "#fafaf7", mono: "#0a0a0a", cream: "#f4eee3" }[VARIANT];

/**
 * The approved lockups. Mono uses the single-colour files, inverted to white on
 * its black page. Cream uses the full-colour light lockup on cream, and the
 * dark tagline lockup in the footer, which sits on a deep blue band.
 */
export const LOGO = {
  full: { primary: "/brand/talynt-primary-light.svg", tagline: "/brand/talynt-tagline-light.svg" },
  mono: { primary: "/brand/talynt-primary-mono.svg", tagline: "/brand/talynt-tagline-mono.svg" },
  cream: { primary: "/brand/talynt-primary-light.svg", tagline: "/brand/talynt-tagline-dark.svg" },
}[VARIANT];

/** Every brand file a build of this variant links to (the static export copies these). */
export const LOGO_FILES = Object.values(LOGO);
