/**
 * The vocabulary the candidate experience is built on.
 *
 * Everything here is data, not markup. Functions, bands, work models and
 * locations are read by the filters, the Career Passport and the role editor
 * alike, so adding a discipline or a city is a one-line change here and never
 * a component change. Nothing downstream hardcodes a member of these lists.
 */

export type Option = {
  id: string;
  label: string;
  /** Shown where the term itself could be read two ways. */
  note?: string;
};

/** Broad disciplines. Deliberately coarse — a taxonomy nobody can place
 *  themselves in is worse than one that is slightly too wide. */
export const FUNCTIONS: Option[] = [
  { id: "engineering", label: "Engineering" },
  { id: "data", label: "Data & Analytics" },
  { id: "product", label: "Product" },
  { id: "design", label: "Design" },
  { id: "security", label: "Security & Infrastructure" },
  { id: "sales", label: "Sales & Revenue" },
  { id: "marketing", label: "Marketing" },
  { id: "operations", label: "Operations" },
  { id: "finance", label: "Finance" },
  { id: "people", label: "People & Talent" },
];

/**
 * Bands, not years. A band describes the shape of the work — what you are
 * trusted to decide — rather than counting time served.
 */
export const EXPERIENCE_BANDS: Option[] = [
  { id: "early", label: "Early career", note: "0–2 years · learning the craft" },
  { id: "established", label: "Established", note: "3–6 years · owns their work" },
  { id: "senior", label: "Senior", note: "6–10 years · owns outcomes" },
  { id: "lead", label: "Lead / Staff", note: "8–14 years · owns direction" },
  { id: "head", label: "Head of / Director", note: "10+ years · owns a function" },
  { id: "exec", label: "Executive", note: "Owns the business line" },
];

export const WORK_MODELS: Option[] = [
  { id: "onsite", label: "On-site" },
  { id: "hybrid", label: "Hybrid" },
  { id: "remote", label: "Remote" },
  { id: "remote-global", label: "Remote, any timezone" },
];

/**
 * Locations carry a region so the filter can offer "anywhere in India"
 * without the role having to be re-tagged. Extend the list; nothing else moves.
 */
export type Place = { id: string; label: string; region: string };

export const LOCATIONS: Place[] = [
  { id: "bengaluru", label: "Bengaluru", region: "India" },
  { id: "hyderabad", label: "Hyderabad", region: "India" },
  { id: "pune", label: "Pune", region: "India" },
  { id: "mumbai", label: "Mumbai", region: "India" },
  { id: "delhi-ncr", label: "Delhi NCR", region: "India" },
  { id: "chennai", label: "Chennai", region: "India" },
  { id: "london", label: "London", region: "United Kingdom" },
  { id: "berlin", label: "Berlin", region: "Europe" },
  { id: "amsterdam", label: "Amsterdam", region: "Europe" },
  { id: "singapore", label: "Singapore", region: "APAC" },
  { id: "dubai", label: "Dubai", region: "Middle East" },
  { id: "new-york", label: "New York", region: "North America" },
  { id: "anywhere", label: "No fixed location", region: "Global" },
];

export const REGIONS = Array.from(new Set(LOCATIONS.map((l) => l.region)));

/**
 * Career direction. The point of the Passport is that these are different
 * questions — "what do you do" and "where is this going" rarely have the
 * same answer, and hiring usually only asks the first.
 */
export const DIRECTIONS: Option[] = [
  {
    id: "deeper",
    label: "Deeper in my craft",
    note: "More depth, more difficult problems, no appetite for management",
  },
  {
    id: "broader",
    label: "Broader scope",
    note: "More surface area, more of the business in view",
  },
  {
    id: "leading",
    label: "Leading people",
    note: "Building and growing a team, not only the work",
  },
  {
    id: "ownership",
    label: "More ownership",
    note: "Deciding what gets built, not only how",
  },
  {
    id: "change",
    label: "A change of context",
    note: "Different stage, industry or problem — same craft",
  },
  {
    id: "stability",
    label: "Stability and depth",
    note: "Staying put in a place worth staying in",
  },
  { id: "unsure", label: "I'm still working it out", note: "A legitimate answer" },
];

/**
 * What matters. Not perks — the conditions under which people do their best
 * work, and the conditions they leave over.
 */
export const VALUES: Option[] = [
  { id: "autonomy", label: "Autonomy over how I work" },
  { id: "clarity", label: "Clear priorities" },
  { id: "craft", label: "High technical standards" },
  { id: "pace", label: "Pace and momentum" },
  { id: "stability", label: "Predictability" },
  { id: "mentorship", label: "People I learn from" },
  { id: "impact", label: "Seeing my work used" },
  { id: "flexibility", label: "Control over my hours" },
  { id: "transparency", label: "Knowing why decisions are made" },
  { id: "growth", label: "A path I can see" },
  { id: "diversity", label: "A team unlike me" },
  { id: "purpose", label: "Work I believe in" },
];

export const COMPANY_STAGES: Option[] = [
  { id: "seed", label: "Seed", note: "Under 30 people · still finding the shape" },
  { id: "series-a", label: "Series A", note: "30–80 · proving it repeats" },
  { id: "series-b", label: "Series B/C", note: "80–400 · scaling what works" },
  { id: "growth", label: "Growth / Late stage", note: "400+ · structure exists" },
  { id: "public", label: "Public or established", note: "Process, scale, scrutiny" },
];

export const AVAILABILITY: Option[] = [
  { id: "now", label: "Available now" },
  { id: "30", label: "Within 30 days" },
  { id: "60", label: "30–60 days" },
  { id: "90", label: "60–90 days" },
  { id: "open", label: "Not looking, open to the right thing" },
];

export function labelFor(list: Option[] | Place[], id: string): string {
  return list.find((o) => o.id === id)?.label ?? id;
}

export function labelsFor(list: Option[] | Place[], ids: string[]): string[] {
  return ids.map((id) => labelFor(list, id));
}
