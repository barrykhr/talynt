"use client";

/**
 * A tiny localStorage-backed store, read through useSyncExternalStore.
 *
 * Two reasons it exists rather than a useState-and-useEffect pair in each hook:
 * every component reading the same key stays in sync (a save on a card updates
 * the count in the nav), and the server snapshot is an explicit, stable value
 * so hydration has nothing to mismatch on.
 *
 * The cached snapshot matters. useSyncExternalStore compares snapshots by
 * identity, so parsing JSON on every read would loop forever.
 */

import { useSyncExternalStore } from "react";

export type LocalStore<T> = {
  get: () => T;
  /** The value React renders on the server and during hydration. */
  getServer: () => T;
  set: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createLocalStore<T>(
  key: string,
  empty: T,
  /** Reconcile a stored document that may predate the current shape. */
  revive: (raw: unknown) => T = (raw) => raw as T,
): LocalStore<T> {
  let cache: T | null = null;
  const listeners = new Set<() => void>();

  function read(): T {
    if (cache !== null) return cache;
    if (typeof window === "undefined") {
      cache = empty;
      return cache;
    }
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? revive(JSON.parse(raw)) : empty;
    } catch {
      // A blocked or unparseable store reads as empty rather than throwing.
      cache = empty;
    }
    return cache;
  }

  function emit() {
    listeners.forEach((listener) => listener());
  }

  if (typeof window !== "undefined") {
    // Another tab changing the same key invalidates this one's cache.
    window.addEventListener("storage", (event) => {
      if (event.key === key) {
        cache = null;
        emit();
      }
    });
  }

  return {
    get: read,
    getServer: () => empty,
    set(next: T) {
      cache = next;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Persistence can fail (private mode, quota). The in-memory value
        // still stands for this session so typing is never lost mid-form.
      }
      emit();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Read a store. Returns the server value until hydration completes. */
export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}

/**
 * Whether the real stored value is in hand yet. False on the server and on the
 * first client render, so a component can avoid claiming "nothing saved" before
 * it has looked.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

const noopSubscribe = () => () => {};
