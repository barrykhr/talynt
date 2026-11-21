// The narrowest Google scopes that support what the CRM actually does.
// See docs/GOOGLE.md for the reasoning and verification requirements.

export type GoogleProduct = "gmail" | "calendar";

const IDENTITY = ["openid", "email"];

export const PRODUCT_SCOPES: Record<GoogleProduct, string[]> = {
  // gmail.send      — send mail as the user (Sensitive scope).
  // gmail.metadata  — read headers/labels only, never message bodies or
  //                   attachments (Restricted scope). Used to log CRM-related
  //                   threads. We deliberately do NOT request gmail.readonly.
  gmail: [...IDENTITY, "https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.metadata"],
  // calendar.events — read events on the user's calendars and create meetings
  //                   (Sensitive scope). No access to calendar settings/ACLs.
  calendar: [...IDENTITY, "https://www.googleapis.com/auth/calendar.events"],
};

export const PRODUCT_LABEL: Record<GoogleProduct, string> = { gmail: "Gmail", calendar: "Google Calendar" };

export function missingScopes(product: GoogleProduct, granted: string[]): string[] {
  const have = new Set(granted);
  return PRODUCT_SCOPES[product].filter((s) => !IDENTITY.includes(s) && !have.has(s));
}

export function isGoogleProduct(v: unknown): v is GoogleProduct {
  return v === "gmail" || v === "calendar";
}
