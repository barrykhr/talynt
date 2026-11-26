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

/**
 * Talyn editions of the mono colourway (NEXT_PUBLIC_CT_EDITION): the same
 * black-and-lime site with the Talyn content (lib/contour/talyn.ts), in two
 * versions of the homepage.
 *
 *   film     the scroll-flipped film, then Talyn Insights and the capabilities
 *   product  a product-led page: the Talyn console, a product tour, live widgets
 */
const ED = process.env.NEXT_PUBLIC_CT_EDITION;
export const EDITION: "none" | "film" | "product" = VARIANT === "mono" && (ED === "film" || ED === "product") ? ED : "none";
export const TALYN_EDITION = EDITION !== "none";

/** ElevenLabs Conversational AI agent for the website voice assistant (a public id, not a key). */
export const VOICE_AGENT_ID = /^[A-Za-z0-9_-]{8,80}$/.test(process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? "")
  ? (process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID as string)
  : null;

/**
 * The Buddy editions are drawn in the bright palette of the Buddy ads: an
 * off-white page, black type and lime accents (.ct-bright, contour.css, on top
 * of the mono tokens).
 */
export const BRIGHT = TALYN_EDITION;
export const THEME_COLOR_BRIGHT = "#f4f3ee";
