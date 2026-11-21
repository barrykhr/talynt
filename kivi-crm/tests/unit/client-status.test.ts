import { describe, expect, it } from "vitest";
import { deriveClientStatus, isActiveClient, isLiveRequirement, placementProgress } from "@/lib/domain/client-status";
import { REQUIREMENT_STATUSES } from "@/lib/constants";

describe("active-client rule (MSA signed + at least one live requirement)", () => {
  it("treats every delivery stage except On hold and Closed/filled as live", () => {
    const live = REQUIREMENT_STATUSES.values.filter(isLiveRequirement);
    expect(live).toEqual(["new_requirement", "sourcing", "candidates_shared", "interviews", "offer", "placed"]);
  });

  it("requires a signed MSA", () => {
    expect(isActiveClient("not_started", [{ status: "sourcing" }])).toBe(false);
    expect(isActiveClient("in_discussion", [{ status: "sourcing" }])).toBe(false);
    expect(isActiveClient("signed", [{ status: "sourcing" }])).toBe(true);
  });

  it("requires at least one live, non-archived requirement", () => {
    expect(deriveClientStatus("signed", [])).toBe("msa_signed_no_live_requirement");
    expect(deriveClientStatus("signed", [{ status: "on_hold" }, { status: "closed_filled" }])).toBe("msa_signed_no_live_requirement");
    expect(deriveClientStatus("signed", [{ status: "interviews", archived_at: "2026-01-01" }])).toBe("msa_signed_no_live_requirement");
    expect(deriveClientStatus("signed", [{ status: "closed_filled" }, { status: "offer" }])).toBe("active_client");
    expect(deriveClientStatus("not_started", [])).toBe("prospect");
  });

  it("clamps placement progress for display", () => {
    expect(placementProgress(2, 4)).toEqual({ filled: 2, volume: 4, percent: 50 });
    expect(placementProgress(9, 4).filled).toBe(4);
    expect(placementProgress(-1, 0)).toEqual({ filled: 0, volume: 1, percent: 0 });
  });
});
