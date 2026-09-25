"use client";

/**
 * The Career Passport.
 *
 * Stored on the visitor's own device and nowhere else until they explicitly
 * choose to send it somewhere. Nothing here is uploaded in the background,
 * nothing is inferred from behaviour, and nothing is created without the
 * person typing or selecting it.
 *
 * `storage` is the honest word for what this is: a single JSON document in
 * localStorage. If a backend is added later, this module is the only place
 * that changes.
 */

import { useCallback } from "react";
import { createLocalStore, useHydrated, useLocalStore } from "./store";

export type PassportExperience = {
  id: string;
  title: string;
  organisation: string;
  from: string;
  to: string;
  /** What they actually did. One field, deliberately, so it reads as a sentence. */
  summary: string;
};

export type Passport = {
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
  name: "",
  email: "",
  headline: "",
  currentLocationId: "",
  functionIds: [],
  bandId: "",
  skills: [],
  experience: [],
  resume: null,
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

const KEY = "talynt.passport.v1";

/**
 * Merge rather than trust: a document written by an older shape must not leave
 * a field undefined and crash a controlled input.
 */
function revive(raw: unknown): Passport {
  const parsed = (raw ?? {}) as Partial<Passport>;
  return {
    ...EMPTY_PASSPORT,
    ...parsed,
    consent: { ...EMPTY_PASSPORT.consent, ...(parsed.consent ?? {}) },
  };
}

const store = createLocalStore<Passport>(KEY, EMPTY_PASSPORT, revive);

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

export function usePassport() {
  const passport = useLocalStore(store);
  const loaded = useHydrated();

  const update = useCallback((patch: Partial<Passport>) => {
    store.set({ ...store.get(), ...patch, updatedAt: new Date().toISOString() });
  }, []);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* nothing to recover from */
    }
    store.set(EMPTY_PASSPORT);
  }, []);

  return { passport, update, clear, loaded };
}
