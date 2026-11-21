import "server-only";
import { createHash } from "node:crypto";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { Member } from "@/lib/auth";
import { displayName } from "@/lib/data/team";
import type { ResearchInput, ResearchLevel } from "./schema";

export function senderFor(member: Member): ResearchInput["sender"] {
  return {
    name: displayName(member),
    company: process.env.SENDER_COMPANY || "KiviTronics Consulting",
    pitch: process.env.SENDER_PITCH || "",
    cta: process.env.SENDER_CTA || "Open to a 15-minute call this week?",
  };
}

/**
 * Builds the minimum context a provider needs from CRM records. Conversation
 * metadata (dates/subjects only, never bodies) is included only when the user
 * ticked the option AND has their own Google account connected.
 */
export async function buildResearchInput(
  supabase: ServerSupabase,
  member: Member,
  opts: {
    companyId: string; opportunityId: string | null; contactId: string | null; requirementId: string | null;
    level: ResearchLevel; channel: "email" | "whatsapp"; includeConversations: boolean; extraNotes: string | null;
  },
): Promise<ResearchInput | null> {
  const { data: company } = await supabase.from("companies").select("name, website, domain, location").eq("id", opts.companyId).maybeSingle();
  if (!company) return null;
  const [opp, req, contact] = await Promise.all([
    opts.opportunityId ? supabase.from("opportunities").select("hiring_need, location, stage").eq("id", opts.opportunityId).maybeSingle() : Promise.resolve({ data: null }),
    opts.requirementId ? supabase.from("requirements").select("role_title, location").eq("id", opts.requirementId).maybeSingle() : Promise.resolve({ data: null }),
    opts.contactId ? supabase.from("contacts").select("full_name, role_title, linkedin_url").eq("id", opts.contactId).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  let conversations: ResearchInput["conversations"] = [];
  if (opts.includeConversations) {
    const { data: conns } = await supabase.rpc("my_google_connections");
    const hasGoogle = ((conns ?? []) as { status: string }[]).some((c) => c.status === "connected");
    if (hasGoogle) {
      let q = supabase.from("activities").select("occurred_at, type, subject, external_meta")
        .eq("company_id", opts.companyId).in("type", ["email", "meeting", "call", "whatsapp"]).is("archived_at", null)
        .order("occurred_at", { ascending: false }).limit(8);
      if (opts.contactId) q = q.eq("contact_id", opts.contactId);
      const { data: acts } = await q;
      conversations = ((acts ?? []) as { occurred_at: string; type: string; subject: string; external_meta: { direction?: string } }[]).map((a) => ({
        date: a.occurred_at.slice(0, 10), channel: a.type, subject: a.subject.slice(0, 200), direction: a.external_meta?.direction ?? null,
      }));
    }
  }

  const role = (req.data as { role_title?: string } | null)?.role_title ?? (opp.data as { hiring_need?: string } | null)?.hiring_need ?? null;
  const location = (req.data as { location?: string } | null)?.location ?? (opp.data as { location?: string } | null)?.location ?? company.location ?? null;
  const c = contact.data as { full_name: string; role_title: string | null; linkedin_url: string | null } | null;
  return {
    level: opts.level,
    company: {
      name: company.name,
      website: company.website ?? (company.domain ? `https://${company.domain}` : null),
      linkedinUrl: /linkedin\.com\/company\//i.test(c?.linkedin_url ?? "") ? c!.linkedin_url : null,
      location: company.location,
    },
    role,
    location,
    contact: c ? { name: c.full_name, title: c.role_title, notes: null } : null,
    crmContext: opts.extraNotes?.slice(0, 1500) || null,
    conversations,
    sender: senderFor(member),
    channel: opts.channel,
  };
}

/** Same input within 10 minutes → same job (double-clicks don't duplicate work). */
export function idempotencyKey(companyId: string, input: ResearchInput, provider: string, now = Date.now()) {
  const bucket = Math.floor(now / 600_000);
  return createHash("sha256").update(JSON.stringify({ companyId, provider, input, bucket })).digest("hex");
}
