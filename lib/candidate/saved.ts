"use client";

/**
 * Saved roles, and the record of what has been sent.
 *
 * Both live on this device. That is a real limitation and the UI says so
 * rather than implying a synced account exists.
 */

import { useCallback } from "react";
import { createLocalStore, useHydrated, useLocalStore } from "./store";

/**
 * The only statuses we can honestly show. "Saved" is a local bookmark.
 * "Sent" means this device posted an application and the request was accepted.
 * There is no interview or offer status here, because nothing reports one back.
 */
export type ApplicationRecord = {
  slug: string;
  sentAt: string;
  /** False when delivery was not configured and the person was given the email route. */
  delivered: boolean;
};

const EMPTY_SAVED: string[] = [];
const EMPTY_SENT: ApplicationRecord[] = [];

function asArray<T>(raw: unknown, empty: T[]): T[] {
  return Array.isArray(raw) ? (raw as T[]) : empty;
}

const savedStore = createLocalStore<string[]>("talynt.saved.v1", EMPTY_SAVED, (raw) =>
  asArray<string>(raw, EMPTY_SAVED),
);

const sentStore = createLocalStore<ApplicationRecord[]>(
  "talynt.applications.v1",
  EMPTY_SENT,
  (raw) => asArray<ApplicationRecord>(raw, EMPTY_SENT),
);

export function useSavedRoles() {
  const saved = useLocalStore(savedStore);
  const loaded = useHydrated();

  const toggle = useCallback((slug: string) => {
    const current = savedStore.get();
    savedStore.set(
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug],
    );
  }, []);

  const isSaved = useCallback((slug: string) => saved.includes(slug), [saved]);

  return { saved, toggle, isSaved, loaded };
}

export function useApplications() {
  const applications = useLocalStore(sentStore);
  const loaded = useHydrated();

  const record = useCallback((entry: ApplicationRecord) => {
    sentStore.set([entry, ...sentStore.get().filter((a) => a.slug !== entry.slug)]);
  }, []);

  const find = useCallback(
    (slug: string) => applications.find((a) => a.slug === slug),
    [applications],
  );

  return { applications, record, find, loaded };
}
