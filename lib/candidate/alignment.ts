/**
 * Alignment between a Career Passport and a role.
 *
 * Deliberately not a score. A single number would be both more persuasive and
 * less true: it hides which dimension moved it, and it invites a person to
 * treat a number they cannot interrogate as a verdict on themselves.
 *
 * So this returns named dimensions, each with a state and the reason for that
 * state in plain language, plus the questions the comparison could not answer.
 * Every dimension is derived only from what the person entered themselves.
 */

import type { Passport } from "./passport";
import { formatCompensation, type Role } from "./roles";
import {
  DIRECTIONS,
  EXPERIENCE_BANDS,
  FUNCTIONS,
  LOCATIONS,
  VALUES,
  WORK_MODELS,
  labelFor,
} from "./taxonomy";

export type AlignmentState = "aligned" | "partly" | "differs" | "unknown";

export type AlignmentDimension = {
  id: string;
  label: string;
  state: AlignmentState;
  /** Why it reads this way. Always a sentence, never a number. */
  reason: string;
};

export type Alignment = {
  dimensions: AlignmentDimension[];
  /** Things the Passport cannot answer, which a conversation would. */
  questions: string[];
  /** True when there is not enough in the Passport to compare anything. */
  insufficient: boolean;
};

const BAND_ORDER = EXPERIENCE_BANDS.map((b) => b.id);

function bandDistance(a: string, b: string): number | null {
  const i = BAND_ORDER.indexOf(a);
  const j = BAND_ORDER.indexOf(b);
  if (i < 0 || j < 0) return null;
  return j - i;
}

/** "a Engineering role" is the kind of seam that gives generated copy away. */
function article(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function list(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function alignRole(passport: Passport, role: Role): Alignment {
  const dimensions: AlignmentDimension[] = [];
  const questions: string[] = [];

  /* --- Discipline ------------------------------------------------------- */
  if (passport.functionIds.length === 0) {
    dimensions.push({
      id: "function",
      label: "Discipline",
      state: "unknown",
      reason: "Your Passport doesn't say which disciplines you work in yet.",
    });
  } else if (passport.functionIds.includes(role.functionId)) {
    dimensions.push({
      id: "function",
      label: "Discipline",
      state: "aligned",
      reason: (() => {
        const discipline = labelFor(FUNCTIONS, role.functionId);
        return `This is ${article(discipline)} ${discipline} role and that is one of yours.`;
      })(),
    });
  } else {
    dimensions.push({
      id: "function",
      label: "Discipline",
      state: "differs",
      reason: `This sits in ${labelFor(FUNCTIONS, role.functionId)}; you've told us you work in ${list(
        passport.functionIds.map((f) => labelFor(FUNCTIONS, f)),
      )}. That is not necessarily a barrier, but it is a real difference.`,
    });
  }

  /* --- Level ------------------------------------------------------------ */
  const distance = passport.bandId ? bandDistance(passport.bandId, role.bandId) : null;
  if (distance === null) {
    dimensions.push({
      id: "band",
      label: "Level",
      state: "unknown",
      reason: "Add your level to the Passport and we can compare this properly.",
    });
  } else if (distance === 0) {
    dimensions.push({
      id: "band",
      label: "Level",
      state: "aligned",
      reason: `The role is pitched at ${labelFor(EXPERIENCE_BANDS, role.bandId)}, which is where you placed yourself.`,
    });
  } else if (distance === 1) {
    dimensions.push({
      id: "band",
      label: "Level",
      state: "partly",
      reason: `This is a step up — ${labelFor(EXPERIENCE_BANDS, role.bandId)} against your ${labelFor(
        EXPERIENCE_BANDS,
        passport.bandId,
      )}. Worth reading what success looks like before deciding.`,
    });
  } else if (distance === -1) {
    dimensions.push({
      id: "band",
      label: "Level",
      state: "partly",
      reason: `This is pitched slightly below where you placed yourself. Some people want that; most should know it before they apply.`,
    });
  } else {
    dimensions.push({
      id: "band",
      label: "Level",
      state: "differs",
      reason: `There are ${Math.abs(distance)} bands between ${labelFor(
        EXPERIENCE_BANDS,
        passport.bandId,
      )} and ${labelFor(EXPERIENCE_BANDS, role.bandId)}. We'd be straight with you about that in a conversation.`,
    });
  }

  /* --- How you want to work -------------------------------------------- */
  if (passport.workModelIds.length === 0) {
    dimensions.push({
      id: "work-model",
      label: "How you want to work",
      state: "unknown",
      reason: "Your work-model preference isn't set yet.",
    });
  } else {
    const shared = passport.workModelIds.filter((w) => role.workModelIds.includes(w));
    if (shared.length) {
      dimensions.push({
        id: "work-model",
        label: "How you want to work",
        state: "aligned",
        reason: `This role supports ${list(shared.map((w) => labelFor(WORK_MODELS, w)))}, which you've said you want.`,
      });
    } else {
      dimensions.push({
        id: "work-model",
        label: "How you want to work",
        state: "differs",
        reason: `The role is ${list(
          role.workModelIds.map((w) => labelFor(WORK_MODELS, w)),
        )}; you've asked for ${list(
          passport.workModelIds.map((w) => labelFor(WORK_MODELS, w)),
        )}. This one rarely bends.`,
      });
    }
  }

  /* --- Location --------------------------------------------------------- */
  const wantsAnywhere =
    passport.workModelIds.includes("remote-global") ||
    passport.preferredLocationIds.includes("anywhere");
  const sharedPlaces = passport.preferredLocationIds.filter((l) => role.locationIds.includes(l));
  const roleRegions = new Set(
    role.locationIds.map((id) => LOCATIONS.find((l) => l.id === id)?.region).filter(Boolean),
  );
  const sharedRegions = passport.preferredRegions.filter((r) => roleRegions.has(r));

  if (!passport.preferredLocationIds.length && !passport.preferredRegions.length) {
    dimensions.push({
      id: "location",
      label: "Location",
      state: "unknown",
      reason: "You haven't told us where you'd work yet.",
    });
  } else if (sharedPlaces.length || wantsAnywhere) {
    dimensions.push({
      id: "location",
      label: "Location",
      state: "aligned",
      reason: wantsAnywhere && !sharedPlaces.length
        ? "You're open on location, and this role is too."
        : `Based in ${list(sharedPlaces.map((l) => labelFor(LOCATIONS, l)))}, which is on your list.`,
    });
  } else if (sharedRegions.length) {
    dimensions.push({
      id: "location",
      label: "Location",
      state: "partly",
      reason: `Same region — ${list(sharedRegions)} — but not a city you named.`,
    });
  } else {
    dimensions.push({
      id: "location",
      label: "Location",
      state: "differs",
      reason: `This role is in ${list(
        role.locationIds.map((l) => labelFor(LOCATIONS, l)),
      )}, which isn't among the places you've said you'd work.`,
    });
  }

  /* --- Direction -------------------------------------------------------- */
  if (passport.directionIds.length === 0) {
    dimensions.push({
      id: "direction",
      label: "Where you're heading",
      state: "unknown",
      reason: "This is the one that changes the answer most, and it's the one we don't have.",
    });
    questions.push("Does this role move you toward what you want next, or sideways?");
  } else if (passport.directionIds.includes("unsure")) {
    dimensions.push({
      id: "direction",
      label: "Where you're heading",
      state: "unknown",
      reason:
        "You've said you're still working it out, which is a fair answer. Read where this role could lead and see whether any of it pulls at you.",
    });
  } else {
    const shared = passport.directionIds.filter((d) => role.directionIds.includes(d));
    if (shared.length) {
      dimensions.push({
        id: "direction",
        label: "Where you're heading",
        state: "aligned",
        reason: `You said you want ${list(
          shared.map((d) => labelFor(DIRECTIONS, d).toLowerCase()),
        )}. This role is built to offer that.`,
      });
    } else {
      dimensions.push({
        id: "direction",
        label: "Where you're heading",
        state: "differs",
        reason: `You're looking for ${list(
          passport.directionIds.map((d) => labelFor(DIRECTIONS, d).toLowerCase()),
        )}. This role leads toward ${list(
          role.directionIds.map((d) => labelFor(DIRECTIONS, d).toLowerCase()),
        )}. Different, and worth being honest with yourself about.`,
      });
    }
  }

  /* --- What matters ----------------------------------------------------- */
  if (passport.valueIds.length < 3) {
    dimensions.push({
      id: "values",
      label: "What matters to you",
      state: "unknown",
      reason: "Name at least three things that matter and we can compare them to this environment.",
    });
  } else {
    const top = passport.valueIds.slice(0, 5);
    const shared = top.filter((v) => role.valueIds.includes(v));
    const missing = top.filter((v) => !role.valueIds.includes(v));
    if (shared.length >= 2) {
      dimensions.push({
        id: "values",
        label: "What matters to you",
        state: shared.length >= 3 ? "aligned" : "partly",
        reason: `This environment is described as rewarding ${list(
          shared.map((v) => labelFor(VALUES, v).toLowerCase()),
        )}.${
          missing.length
            ? ` It says nothing either way about ${list(missing.map((v) => labelFor(VALUES, v).toLowerCase()))}.`
            : ""
        }`,
      });
      if (missing.length) {
        questions.push(
          `You ranked ${list(
            missing.map((v) => labelFor(VALUES, v).toLowerCase()),
          )} highly. Nothing here speaks to it — ask.`,
        );
      }
    } else {
      dimensions.push({
        id: "values",
        label: "What matters to you",
        state: "differs",
        reason: `What you've ranked highest doesn't obviously overlap with what this environment describes rewarding. That is worth a direct question rather than an assumption.`,
      });
    }
  }

  /* --- Questions the comparison can't settle ---------------------------- */
  questions.push(
    ...role.consider.map((c, i) =>
      i === 0 ? `What the role itself says is hard: ${c}` : c,
    ),
  );
  if (!passport.compensationExpectation) {
    questions.push(
      `The band is stated — ${formatCompensation(role.compensation)} a year. Does that work for you?`,
    );
  }
  questions.push("What would have to be true here for you to still be glad in two years?");

  const known = dimensions.filter((d) => d.state !== "unknown").length;

  return { dimensions, questions: questions.slice(0, 5), insufficient: known < 2 };
}

/**
 * Why a role appeared in a list. Reasons only, in the person's own terms —
 * never a ranking, and never a claim we can't trace to something they entered.
 */
export function appearanceReasons(passport: Passport, role: Role): string[] {
  const reasons: string[] = [];
  if (passport.functionIds.includes(role.functionId)) {
    reasons.push(`You work in ${labelFor(FUNCTIONS, role.functionId)}.`);
  }
  if (passport.bandId === role.bandId) {
    reasons.push(`It's pitched at ${labelFor(EXPERIENCE_BANDS, role.bandId)}, where you placed yourself.`);
  }
  const wm = passport.workModelIds.filter((w) => role.workModelIds.includes(w));
  if (wm.length) reasons.push(`It supports ${list(wm.map((w) => labelFor(WORK_MODELS, w)))}.`);
  const loc = passport.preferredLocationIds.filter((l) => role.locationIds.includes(l));
  if (loc.length) reasons.push(`It's in ${list(loc.map((l) => labelFor(LOCATIONS, l)))}.`);
  const dir = passport.directionIds.filter((d) => role.directionIds.includes(d));
  if (dir.length) {
    reasons.push(`You said you want ${list(dir.map((d) => labelFor(DIRECTIONS, d).toLowerCase()))}.`);
  }
  if (reasons.length === 0) {
    reasons.push("Nothing in your Passport matched this one — you're seeing it because you searched.");
  }
  return reasons;
}
