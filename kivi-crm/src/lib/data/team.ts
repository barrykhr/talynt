import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { TeamMember } from "@/lib/types";

/** The whole team (3 people today). RLS limits this to active members. */
export const getTeam = cache(async (): Promise<TeamMember[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_users")
    .select("id, email, full_name, role, status, last_sign_in_at, created_at")
    .order("full_name", { ascending: true, nullsFirst: false });
  return (data ?? []) as TeamMember[];
});

export async function getTeamMap(): Promise<Map<string, TeamMember>> {
  return new Map((await getTeam()).map((m) => [m.id, m]));
}

export function displayName(m: Pick<TeamMember, "full_name" | "email"> | null | undefined): string {
  if (!m) return "Unassigned";
  return m.full_name || m.email.split("@")[0];
}

export function initials(m: Pick<TeamMember, "full_name" | "email"> | null | undefined): string {
  if (!m) return "–";
  const name = m.full_name || m.email.split("@")[0];
  return name.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}
