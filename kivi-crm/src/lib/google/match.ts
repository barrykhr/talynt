// Decides whether a synced email/event is CRM-related. Pure, unit-tested.
//
//   logged  — at least one participant is a known CRM contact → shared activity
//   review  — no contact matched, but a participant's work domain belongs to a
//             CRM company → private review queue for the mailbox owner
//   skip    — nothing CRM-related (personal or unrelated mail) → not stored

import { ALLOWED_DOMAIN } from "@/lib/constants";
import { domainFromEmail, PERSONAL_EMAIL_DOMAINS } from "@/lib/normalize";

export interface ContactRef { id: string; email: string; company_id: string | null }
export interface CompanyRef { id: string; domain: string }

export type MatchResult =
  | { kind: "logged"; contactId: string; companyId: string | null; matchedEmails: string[] }
  | { kind: "review"; companyId: string; externalEmails: string[] }
  | { kind: "skip" };

/** Participants other than the mailbox owner and KiviTronics colleagues. */
export function externalParticipants(emails: string[], selfEmail: string): string[] {
  const self = selfEmail.toLowerCase();
  return [...new Set(emails.map((e) => e.toLowerCase()))].filter(
    (e) => e !== self && domainFromEmail(e) !== ALLOWED_DOMAIN,
  );
}

export function classify(emails: string[], selfEmail: string, contacts: ContactRef[], companies: CompanyRef[]): MatchResult {
  const external = externalParticipants(emails, selfEmail);
  if (external.length === 0) return { kind: "skip" };
  const byEmail = new Map(contacts.map((c) => [c.email.toLowerCase(), c]));
  const matched = external.map((e) => byEmail.get(e)).filter(Boolean) as ContactRef[];
  if (matched.length > 0) {
    const primary = matched[0];
    return { kind: "logged", contactId: primary.id, companyId: primary.company_id, matchedEmails: matched.map((m) => m.email) };
  }
  const byDomain = new Map(companies.map((c) => [c.domain, c]));
  for (const e of external) {
    const d = domainFromEmail(e);
    if (d && !PERSONAL_EMAIL_DOMAINS.has(d) && byDomain.has(d)) {
      return { kind: "review", companyId: byDomain.get(d)!.id, externalEmails: external };
    }
  }
  return { kind: "skip" };
}
