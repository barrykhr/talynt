import type { SignalStrength } from "@/components/primitives/SignalBadge";

export type Candidate = {
  id: string;
  ref: string;
  headline: string;
  location: string;
  tenure: string;
  status: "Recommended" | "In evaluation" | "In conversation";
  signals: Array<{ label: string; strength: SignalStrength }>;
  skills: string[];
  reasoning: string[];
  watchFor: string;
};

/**
 * Illustrative interface content. Candidate references are fictional.
 * Readings are intentionally uneven — a shortlist where everyone is perfect
 * is a shortlist nobody needs a recruiter for.
 */
export const CANDIDATES: Candidate[] = [
  {
    id: "0148",
    ref: "Candidate 0148",
    headline: "Senior Engineer · Product-led B2B",
    location: "Remote · India",
    tenure: "7 years",
    status: "Recommended",
    signals: [
      { label: "Technical alignment", strength: "strong" },
      { label: "Role motivation", strength: "strong" },
      { label: "Team alignment", strength: "strong" },
      { label: "Communication", strength: "strong" },
      { label: "Compensation alignment", strength: "confirmed" },
    ],
    skills: ["React", "Node", "TypeScript", "AWS"],
    reasoning: [
      "Has built and owned a product surface end to end at a company one stage ahead of yours — the constraints will be familiar, not novel.",
      "Wants a say in what gets built, which is exactly the latitude this role carries and the reason your last two hires here didn't stay.",
      "Works the way this team already works: writes decisions down, distributed by default, comfortable without a finished roadmap.",
    ],
    watchFor:
      "Has mentored engineers but never carried headcount. If this role grows into a lead position within a year, that is a conversation to have now.",
  },
  {
    id: "0203",
    ref: "Candidate 0203",
    headline: "Staff Engineer · Infrastructure-heavy",
    location: "Pune · Hybrid",
    tenure: "9 years",
    status: "Recommended",
    signals: [
      { label: "Technical alignment", strength: "strong" },
      { label: "Role motivation", strength: "solid" },
      { label: "Team alignment", strength: "strong" },
      { label: "Communication", strength: "solid" },
      { label: "Compensation alignment", strength: "solid" },
    ],
    skills: ["TypeScript", "Go", "AWS", "Postgres"],
    reasoning: [
      "The deepest systems background on this shortlist. If the next twelve months are about load rather than surface area, they are the strongest option here.",
      "Has taken a platform through a Series B to Series C scaling curve once already.",
    ],
    watchFor:
      "Motivation is solid rather than strong. They are not unhappy where they are — this will need a real case for the opportunity, not a process.",
  },
  {
    id: "0176",
    ref: "Candidate 0176",
    headline: "Senior Engineer · Early-stage generalist",
    location: "Bengaluru · Remote",
    tenure: "5 years",
    status: "In evaluation",
    signals: [
      { label: "Technical alignment", strength: "solid" },
      { label: "Role motivation", strength: "strong" },
      { label: "Team alignment", strength: "strong" },
      { label: "Communication", strength: "strong" },
      { label: "Compensation alignment", strength: "confirmed" },
    ],
    skills: ["React", "Node", "TypeScript", "Python"],
    reasoning: [
      "The clearest upward trajectory of the four. Two years behind the brief on paper; not behind it in the work they describe.",
      "The only candidate who asked what had already been tried and failed here.",
    ],
    watchFor:
      "Below the stated experience bar. Worth meeting only if you would trade two years of tenure for appetite — we think you should, but that is your call.",
  },
  {
    id: "0159",
    ref: "Candidate 0159",
    headline: "Senior Engineer · Marketplace background",
    location: "Remote · India",
    tenure: "8 years",
    status: "In conversation",
    signals: [
      { label: "Technical alignment", strength: "strong" },
      { label: "Role motivation", strength: "solid" },
      { label: "Team alignment", strength: "solid" },
      { label: "Communication", strength: "strong" },
      { label: "Compensation alignment", strength: "emerging" },
    ],
    skills: ["React", "Node", "GraphQL", "AWS"],
    reasoning: [
      "Technically the closest match to the current stack and the fastest likely ramp.",
      "Has worked under a VP Engineering with a similar operating style, which is the relationship this role lives or dies on.",
    ],
    watchFor:
      "Compensation expectation sits above the band as written. We have raised it rather than waiting for offer stage.",
  },
];

export const ROLE_CONTEXT = {
  title: "Senior Full Stack Engineer",
  facts: [
    { label: "Team", value: "8 engineers" },
    { label: "Reports to", value: "VP Engineering" },
    { label: "Stage", value: "Series B" },
    { label: "Location", value: "Remote / India" },
  ],
};

export const PIPELINE = [
  { stage: "Sourced", count: 184 },
  { stage: "Screened", count: 47 },
  { stage: "Shortlisted", count: 11 },
  { stage: "Interview", count: 6 },
  { stage: "Offer", count: 2 },
];
