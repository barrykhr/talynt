import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

export interface Member {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  authUserId: string;
}

export class AuthError extends Error {
  constructor(public readonly code: "unauthenticated" | "forbidden", message: string) {
    super(message);
  }
}

/**
 * Resolves the signed-in, ACTIVE CRM member for this request (or null).
 * Uses getUser(), which verifies the session with Supabase Auth, then reads the
 * allowlist row through RLS-protected SQL. Cached per request.
 */
export const getMember = cache(async (): Promise<Member | null> => {
  const supabase = await createClient();
  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData.user) return null;
  const { data, error: rpcError } = await supabase.rpc("current_member");
  if (rpcError) return null;
  const row = (Array.isArray(data) ? data[0] : data) as
    | { id: string; email: string; full_name: string | null; role: AppRole; status: string }
    | undefined;
  if (!row || row.status !== "active") return null;
  return { id: row.id, email: row.email, full_name: row.full_name, role: row.role, authUserId: userData.user.id };
});

/** For pages and layouts: redirects when the visitor is not an active member. */
export async function requireMemberPage(): Promise<Member> {
  const member = await getMember();
  if (!member) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    redirect(data.user ? "/access-denied?reason=not_member" : "/sign-in");
  }
  return member;
}

export async function requireAdminPage(): Promise<Member> {
  const member = await requireMemberPage();
  if (member.role !== "admin") redirect("/access-denied?reason=admin_only");
  return member;
}

/** For server actions and route handlers: throws instead of redirecting. */
export async function requireMember(): Promise<Member> {
  const member = await getMember();
  if (!member) throw new AuthError("unauthenticated", "Your session has ended or you no longer have access. Please sign in again.");
  return member;
}

export async function requireAdmin(): Promise<Member> {
  const member = await requireMember();
  if (member.role !== "admin") throw new AuthError("forbidden", "Only administrators can do that.");
  return member;
}
