import { log } from "@/lib/log";

interface PgLikeError {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

const CONSTRAINT_MESSAGES: Record<string, string> = {
  companies_domain_unique: "Another company already uses this domain. Open it instead, or merge the two.",
  contacts_email_unique: "Another contact already uses this email address.",
  opportunities_lost_needs_reason: "Add a short loss reason before marking this lost.",
  requirements_filled_within_volume: "Placements cannot exceed the hiring volume.",
  activities_linked: "Link this to a company, contact, opportunity or requirement.",
  activities_task_fields: "Tasks need an owner and a due date.",
  app_users_email_domain: "Only @kivitronicsconsulting.com addresses can be added.",
};

// Messages raised deliberately by our SQL functions/triggers are written for
// people, so they can be shown as-is for these error codes.
const USER_FACING_CODES = new Set(["42501", "22023", "P0002", "23514"]);

/** Converts a database error into a message that is safe to show users. */
export function friendlyDbError(error: PgLikeError | null | undefined, context: string): string {
  if (!error) return "Something went wrong. Please try again.";
  const text = `${error.message ?? ""} ${error.details ?? ""}`;
  for (const [constraint, message] of Object.entries(CONSTRAINT_MESSAGES)) {
    if (text.includes(constraint)) return message;
  }
  if (error.code && USER_FACING_CODES.has(error.code) && error.message && error.message.length < 200 && !/violates/.test(error.message)) {
    return error.message;
  }
  if (error.code === "42501" || /row-level security/i.test(text)) {
    return "You don't have permission to do that.";
  }
  if (error.code === "23505") return "That would create a duplicate record.";
  if (error.code === "23503") return "A linked record no longer exists. Refresh and try again.";
  log.error("db.error", { context, code: error.code, message: error.message });
  return "Something went wrong saving this. Please try again.";
}
