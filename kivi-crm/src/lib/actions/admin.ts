"use server";

import { revalidatePath } from "next/cache";
import { AuthError, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, formDataToObject, inviteSchema, memberUpdateSchema } from "@/lib/validation";
import { friendlyDbError } from "@/lib/db-errors";
import { ALLOWED_DOMAIN } from "@/lib/constants";
import type { ActionState } from "@/lib/types";

// Admin checks happen twice: here (fast, friendly message) and inside the
// SECURITY DEFINER SQL functions (authoritative, cannot be bypassed).

export async function inviteMember(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Not allowed." };
  }
  const parsed = inviteSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (!parsed.data.email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    return { fieldErrors: { email: `Use a @${ALLOWED_DOMAIN} address` } };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_invite_user", {
    p_email: parsed.data.email, p_full_name: parsed.data.full_name ?? "", p_role: parsed.data.role,
  });
  if (error) return { error: friendlyDbError(error, "admin.invite") };
  revalidatePath("/admin");
  return { ok: true, message: `${parsed.data.email} can now sign in with Google.` };
}

export async function updateMember(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Not allowed." };
  }
  const parsed = memberUpdateSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) return { error: "Choose a valid role and status." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_user", {
    p_user_id: parsed.data.user_id, p_role: parsed.data.role, p_status: parsed.data.status, p_full_name: null,
  });
  if (error) return { error: friendlyDbError(error, "admin.update") };
  revalidatePath("/admin");
  return { ok: true, message: "Saved." };
}
