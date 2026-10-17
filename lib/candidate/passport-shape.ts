/**
 * The Career Passport's shape and the pure rules about it — no React, no
 * storage — so the same definitions serve the browser, the server and tests.
 * The hooks live in ./passport.ts, which re-exports everything here.
 */

export type PassportExperience = {
  id: string;
  title: string;
  organisation: string;
  from: string;
  to: string;
  /** What they actually did. One field, deliberately, so it reads as a sentence. */
  summary: string;
};

export type PassportEducation = {
  id: string;
  institution: string;
  qualification: string;
  year: string;
};

export type Passport = {
  /**
   * A random identifier created the first time the profile is saved, so every
   * application from it can say which profile it came from. It identifies the
   * profile, not the person, and it is not derived from anything they typed.
   * Empty until then.
   */
  profileId: string;

  /** About you */
  name: string;
  email: string;
  headline: string;
  currentLocationId: string;
  functionIds: string[];
  bandId: string;
  skills: string[];

  /** Experience */
  experience: PassportExperience[];
  /** A filename and size only. The file itself is never read or parsed here. */
  resume: { name: string; size: number; addedAt: string } | null;
  education: PassportEducation[];
  /** As the person writes them. Never required. */
  certifications: string[];

  /** Career direction */
  directionIds: string[];
  directionNote: string;
  availabilityId: string;

  /** Work preferences */
  workModelIds: string[];
  preferredLocationIds: string[];
  preferredRegions: string[];
  stageIds: string[];
  compensationExpectation: string;

  /** What matters to you — ranked by the order of this array */
  valueIds: string[];
  valuesNote: string;

  /** Consent, recorded with a timestamp, never assumed */
  consent: {
    shareWithClients: boolean;
    talentAlerts: boolean;
    recordedAt: string | null;
  };

  updatedAt: string | null;
};

export const EMPTY_PASSPORT: Passport = {
  profileId: "",
  name: "",
  email: "",
  headline: "",
  currentLocationId: "",
  functionIds: [],
  bandId: "",
  skills: [],
  experience: [],
  resume: null,
  education: [],
  certifications: [],
  directionIds: [],
  directionNote: "",
  availabilityId: "",
  workModelIds: [],
  preferredLocationIds: [],
  preferredRegions: [],
  stageIds: [],
  compensationExpectation: "",
  valueIds: [],
  valuesNote: "",
  consent: { shareWithClients: false, talentAlerts: false, recordedAt: null },
  updatedAt: null,
};

/**
 * Merge rather than trust: a document written by an older shape must not leave
 * a field undefined and crash a controlled input.
 */
export function revivePassport(raw: unknown): Passport {
  const parsed = (raw ?? {}) as Partial<Passport>;
  return {
    ...EMPTY_PASSPORT,
    ...parsed,
    consent: { ...EMPTY_PASSPORT.consent, ...(parsed.consent ?? {}) },
  };
}

/**
 * Which parts of the Passport are filled in. Used to show progress honestly —
 * it reports completeness, not quality, and it is never turned into a score.
 */
export const PASSPORT_PARTS = [
  { id: "about", label: "About you" },
  { id: "experience", label: "Experience" },
  { id: "direction", label: "Career direction" },
  { id: "preferences", label: "Work preferences" },
  { id: "values", label: "What matters to you" },
] as const;

export type PassportPartId = (typeof PASSPORT_PARTS)[number]["id"];

export function partComplete(p: Passport, part: PassportPartId): boolean {
  switch (part) {
    case "about":
      return Boolean(p.name && p.headline && p.functionIds.length && p.bandId);
    case "experience":
      return p.experience.length > 0 || Boolean(p.resume);
    case "direction":
      return p.directionIds.length > 0;
    case "preferences":
      return p.workModelIds.length > 0;
    case "values":
      return p.valueIds.length >= 3;
  }
}

export function completedParts(p: Passport): PassportPartId[] {
  return PASSPORT_PARTS.map((x) => x.id).filter((id) => partComplete(p, id));
}
