import type { AssessmentDefinition, Rating, RubricLevel } from "./types";
import { fingerprint } from "./hash";

/**
 * PROPOSED — the rubric levels, shared by every role. What changes per role is
 * the list of signals that count as evidence for each competency.
 *
 * Three levels, deliberately coarse, and a fourth answer that is not a level at
 * all: "not enough to judge", which calls for a follow-up rather than counting
 * against anyone. There is no overall score, and nothing adds levels up.
 */
export const LEVELS: Record<RubricLevel, { label: string; description: string }> = {
  limited: {
    label: "Limited evidence",
    description: "Speaks generally. Little first-hand detail, or the answer does not reach this competency.",
  },
  clear: {
    label: "Clear evidence",
    description: "A concrete, first-hand example that covers some of the signals, with the reasoning given.",
  },
  strong: {
    label: "Strong evidence",
    description: "Concrete and first-hand, covering most of the signals, with reasoning and consequences made explicit.",
  },
};

export const RATING_LABEL: Record<Rating, string> = {
  limited: LEVELS.limited.label,
  clear: LEVELS.clear.label,
  strong: LEVELS.strong.label,
  insufficient: "Not enough to judge",
};

/** The version of a role's rubric: its signals plus the shared level wording. */
export function rubricVersion(definition: AssessmentDefinition): string {
  return fingerprint({ levels: LEVELS, rubric: definition.rubric }, "rub");
}
