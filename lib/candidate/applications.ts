"use client";

/**
 * Applications, one per role, each with its own assessment.
 *
 * The profile (the Career Passport) is reused by every application and never
 * written to by one: what a candidate says about a particular role — why they
 * want it, their questions, their assessment answers — lives here, on the
 * application, and nowhere else.
 *
 * Like the Passport, this is stored on the candidate's own device. There are no
 * accounts, so nothing here can be read by anyone else, and nothing is sent
 * until the candidate sends it.
 *
 * The rules that keep it honest:
 * - one application per role on this device; opening it again opens the same one;
 * - its assessment is built once, when the application is started, and kept —
 *   reopening the page never builds a different one;
 * - if the role's requirements change before the assessment is sent, it is
 *   marked out of date and the candidate is asked to refresh it (answers to
 *   questions that still apply are kept); after it is sent, it stays exactly as
 *   it was, labelled with the version it was answered against.
 */

import { useCallback } from "react";
import type { Role } from "./roles";
import type { Passport } from "./passport-shape";
import { createLocalStore, useHydrated, useLocalStore } from "./store";
import { buildAssessment } from "@/lib/assessment/generate";
import { definitionFor } from "@/lib/assessment/bank";
import { profileVersion } from "@/lib/assessment/profile";
import { requirementsVersion } from "@/lib/assessment/requirements";
import { rubricVersion } from "@/lib/assessment/rubric";
import type { Assessment, Response } from "@/lib/assessment/types";

export type CandidateApplication = {
  id: string;
  roleSlug: string;
  createdAt: string;
  updatedAt: string;
  /** The profile this application draws on. */
  profileId: string;
  /** Role-specific, and kept here — never written back into the profile. */
  why: string;
  questionsForCompany: string;
  /** Whether the full profile goes with the application, or only what the role needs. */
  includeProfile: boolean;
  assessment: Assessment | null;
  /** Why an assessment could not be built, when it could not. Shown, never hidden. */
  unavailable: { reason: string; at: string } | null;
  responses: Record<string, Response>;
  submittedAt: string | null;
  /** True when a destination accepted it; false when the candidate was given the email route instead. */
  delivered: boolean | null;
  /** The profile version that was sent. */
  sentProfileVersion: string | null;
};

const KEY = "talynt.applications.v2";
const EMPTY: CandidateApplication[] = [];

const store = createLocalStore<CandidateApplication[]>(KEY, EMPTY, (raw) =>
  Array.isArray(raw) ? (raw as CandidateApplication[]).filter((a) => a && typeof a.roleSlug === "string") : EMPTY,
);

/** A random id. Never derived from anything the person typed. */
export function randomId(prefix: string): string {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${uuid}`;
}

export const REQUIRE_APPROVED = process.env.NEXT_PUBLIC_TALYNT_REQUIRE_APPROVED_ASSESSMENTS === "1";

const UNAVAILABLE: Record<string, string> = {
  "no-material": "There is no assessment for this role yet.",
  "requirements-changed": "This role's requirements were updated and its assessment is being re-checked.",
  "awaiting-review": "This role's assessment is waiting for review.",
  invalid: "This role's assessment did not pass its checks.",
};

function build(role: Role, passport: Passport, applicationId: string, now: string) {
  return buildAssessment({
    role,
    profile: passport,
    profileVersion: profileVersion(passport),
    applicationId,
    assessmentId: randomId("asm"),
    now,
    requireApproved: REQUIRE_APPROVED,
  });
}

/** Is a draft's assessment still the one this role would build today? */
export function assessmentState(application: CandidateApplication, role: Role): "current" | "out-of-date" | "unavailable" {
  if (!application.assessment) return "unavailable";
  const definition = definitionFor(role.slug);
  const current =
    application.assessment.requirementsVersion === requirementsVersion(role) &&
    (!definition || application.assessment.rubricVersion === rubricVersion(definition));
  return current ? "current" : "out-of-date";
}

function write(next: CandidateApplication[]) {
  store.set(next);
}

function patchOne(slug: string, patch: (a: CandidateApplication) => CandidateApplication) {
  write(store.get().map((a) => (a.roleSlug === slug ? patch(a) : a)));
}

export function useCandidateApplications() {
  const applications = useLocalStore(store);
  const loaded = useHydrated();

  const find = useCallback((slug: string) => applications.find((a) => a.roleSlug === slug), [applications]);

  /**
   * Start an application, or return the one already started. Idempotent: the
   * assessment is built here, once, and only here.
   */
  const start = useCallback((role: Role, passport: Passport): CandidateApplication => {
    const existing = store.get().find((a) => a.roleSlug === role.slug);
    if (existing) return existing;
    const now = new Date().toISOString();
    const id = randomId("app");
    const result = build(role, passport, id, now);
    const application: CandidateApplication = {
      id,
      roleSlug: role.slug,
      createdAt: now,
      updatedAt: now,
      profileId: passport.profileId,
      why: "",
      questionsForCompany: "",
      // Opt-in: without it, a role receives only what the application needs.
      includeProfile: false,
      assessment: result.ok ? result.assessment : null,
      unavailable: result.ok ? null : { reason: UNAVAILABLE[result.reason] ?? UNAVAILABLE.invalid, at: now },
      responses: {},
      submittedAt: null,
      delivered: null,
      sentProfileVersion: null,
    };
    write([application, ...store.get()]);
    return application;
  }, []);

  /**
   * Rebuild a draft's assessment after the role changed, or after material
   * became available. Answers to questions that are still asked are kept.
   * Never touches a sent application.
   */
  const refresh = useCallback((role: Role, passport: Passport) => {
    const now = new Date().toISOString();
    patchOne(role.slug, (a) => {
      if (a.submittedAt) return a;
      const result = build(role, passport, a.id, now);
      if (!result.ok) return { ...a, assessment: null, unavailable: { reason: UNAVAILABLE[result.reason] ?? UNAVAILABLE.invalid, at: now }, updatedAt: now };
      const kept = Object.fromEntries(Object.entries(a.responses).filter(([id]) => result.assessment.questions.some((q) => q.id === id)));
      return { ...a, assessment: result.assessment, unavailable: null, responses: kept, updatedAt: now };
    });
  }, []);

  const saveResponse = useCallback((slug: string, questionId: string, text: string) => {
    const now = new Date().toISOString();
    patchOne(slug, (a) => (a.submittedAt ? a : { ...a, responses: { ...a.responses, [questionId]: { questionId, text, updatedAt: now } }, updatedAt: now }));
  }, []);

  const update = useCallback((slug: string, patch: Partial<Pick<CandidateApplication, "why" | "questionsForCompany" | "includeProfile">>) => {
    patchOne(slug, (a) => (a.submittedAt ? a : { ...a, ...patch, updatedAt: new Date().toISOString() }));
  }, []);

  const markSent = useCallback((slug: string, outcome: { delivered: boolean; profileVersion: string }) => {
    const now = new Date().toISOString();
    patchOne(slug, (a) => ({ ...a, submittedAt: now, delivered: outcome.delivered, sentProfileVersion: outcome.profileVersion, updatedAt: now }));
  }, []);

  /** Only a draft can be discarded. A sent application is a record of what was sent. */
  const discard = useCallback((slug: string) => {
    write(store.get().filter((a) => a.roleSlug !== slug || a.submittedAt));
  }, []);

  const clearAll = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* nothing to recover from */
    }
    write(EMPTY);
  }, []);

  return { applications, loaded, find, start, refresh, saveResponse, update, markSent, discard, clearAll };
}
