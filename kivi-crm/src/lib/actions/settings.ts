"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { friendlyDbError } from "@/lib/db-errors";
import { OPPORTUNITY_STAGES } from "@/lib/constants";
import { str, withMember } from "./helpers";
import type { ActionState } from "@/lib/types";

const pct = z.preprocess((v) => Number(v), z.number().int().min(0).max(100));

export async function saveWorkspaceSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  return withMember("settings.workspace", async ({ supabase, member }) => {
    if (member.role !== "admin") return { error: "Only administrators can change workspace settings." };
    const probs: Record<string, number> = {};
    for (const stage of OPPORTUNITY_STAGES.values) {
      const p = pct.safeParse(str(fd, `prob_${stage}`));
      if (!p.success) return { fieldErrors: { [`prob_${stage}`]: "0–100" }, error: "Stage probabilities must be whole numbers 0–100." };
      probs[stage] = p.data;
    }
    const cadence = Number(str(fd, "monitoring_default_cadence_days"));
    if (!Number.isInteger(cadence) || cadence < 1 || cadence > 90) return { fieldErrors: { monitoring_default_cadence_days: "1–90 days" } };
    const earned = str(fd, "placement_earned_on");
    // RLS + policy restrict this update to admins regardless of the check above.
    const { error, count } = await supabase.from("app_settings").update({
      stage_probabilities: probs,
      booked_requires_msa: str(fd, "booked_requires_msa") === "on",
      booked_requires_accepted: str(fd, "booked_requires_accepted") === "on",
      booked_requires_terms: str(fd, "booked_requires_terms") === "on",
      placement_earned_on: earned === "offer_accepted" ? "offer_accepted" : "joining",
      monitoring_enabled: str(fd, "monitoring_enabled") === "on",
      monitoring_default_cadence_days: cadence,
      research_enabled: str(fd, "research_enabled") === "on",
    }, { count: "exact" }).eq("id", true);
    if (error) return { error: friendlyDbError(error, "settings.workspace") };
    if (!count) return { error: "You don't have permission to change workspace settings." };
    // Placement earnings depend on the earned rule: refresh them now.
    await supabase.rpc("refresh_placement_earnings");
    revalidatePath("/", "layout");
    return { ok: true, message: "Workspace settings saved and audited." };
  });
}

export async function saveSyncPreferences(_: ActionState, fd: FormData): Promise<ActionState> {
  return withMember("settings.sync", async ({ supabase, member }) => {
    const days = Number(str(fd, "history_window_days"));
    const row = {
      user_id: member.id,
      gmail_sync_enabled: str(fd, "gmail_sync_enabled") === "on",
      gmail_mode: str(fd, "gmail_mode") === "contacts_only" ? "contacts_only" : "contacts_and_review",
      history_window_days: [7, 30, 90].includes(days) ? days : 30,
      calendar_sync_enabled: str(fd, "calendar_sync_enabled") === "on",
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("sync_preferences").upsert(row, { onConflict: "user_id" });
    if (error) return { error: friendlyDbError(error, "settings.sync") };
    revalidatePath("/settings");
    return { ok: true, message: "Sync preferences saved. They apply from the next sync." };
  });
}
