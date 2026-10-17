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
import { EMPTY_PASSPORT, revivePassport, type Passport } from "./passport-shape";

export {
  EMPTY_PASSPORT,
  PASSPORT_PARTS,
  completedParts,
  partComplete,
  revivePassport,
  type Passport,
  type PassportEducation,
  type PassportExperience,
  type PassportPartId,
} from "./passport-shape";

const KEY = "talynt.passport.v1";

const store = createLocalStore<Passport>(KEY, EMPTY_PASSPORT, revivePassport);

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
