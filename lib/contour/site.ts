/**
 * Direction C — "Contour": routes and contact destinations.
 *
 * Every route in this direction lives under BASE so it sits beside the approved
 * site rather than replacing any of it. Legal pages are shared: the approved
 * privacy and terms text is the only version, so this direction links to it.
 */

export const BASE = "/directions/contour";

/** Prefix a path with the direction's base. `to("/faq#privacy")`. */
export function to(path = ""): string {
  if (!path || path === "/") return BASE;
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export const ROUTES = {
  home: to(),
  employers: to("/employers"),
  candidates: to("/candidates"),
  opportunities: to("/opportunities"),
  role: (slug: string) => to(`/opportunities/${slug}`),
  profile: to("/profile"),
  dashboard: to("/dashboard"),
  faq: to("/faq"),
  contact: to("/contact"),
  enquiry: to("/contact#enquiry"),
  /* Shared with the approved site — one source of legal truth. */
  privacy: "/privacy",
  terms: "/terms",
  about: "/about",
  howWeEvaluate: "/candidates/how-we-evaluate",
} as const;

/** Candidate-side routes switch the navigation's primary action. */
export function isCandidatePath(pathname: string | null): boolean {
  if (!pathname) return false;
  return [ROUTES.candidates, ROUTES.opportunities, ROUTES.profile, ROUTES.dashboard].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/* --------------------------------------------------------------------------
   Contact destinations
   -------------------------------------------------------------------------- */

/** The addresses already published on the approved site. */
export const EMAIL = {
  general: "hello@talyntlabs.com",
  talent: "talent@talyntlabs.com",
  privacy: "privacy@talyntlabs.com",
} as const;

/**
 * WhatsApp and LinkedIn.
 *
 * Neither has a verified destination in this repository: there is no business
 * number anywhere, and the approved footer points LinkedIn at linkedin.com's
 * home page. So both are configuration, not content. Set the variables and the
 * links appear; leave them unset and nothing renders — a dead or guessed
 * destination is worse than none.
 *
 *   NEXT_PUBLIC_TALYNT_WHATSAPP      international format, digits only: 9198xxxxxxxx
 *   NEXT_PUBLIC_TALYNT_LINKEDIN_URL  https://www.linkedin.com/company/<slug>/
 */
function whatsappNumber(): string | null {
  const raw = process.env.NEXT_PUBLIC_TALYNT_WHATSAPP ?? "";
  const digits = raw.replace(/[\s()+-]/g, "");
  return /^\d{8,15}$/.test(digits) ? digits : null;
}

function linkedinUrl(): string | null {
  const raw = (process.env.NEXT_PUBLIC_TALYNT_LINKEDIN_URL ?? "").trim();
  return /^https:\/\/(www\.)?linkedin\.com\/company\/[A-Za-z0-9_-]+\/?$/.test(raw) ? raw : null;
}

const WHATSAPP = whatsappNumber();

/** Short and editable — the person can change it before sending. */
export function whatsappHref(message = "Hello TALYNT LABS — "): string | null {
  if (!WHATSAPP) return null;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export const LINKEDIN = linkedinUrl();
