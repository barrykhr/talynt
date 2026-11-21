"use client";

import { useActionState, useState } from "react";
import { buttonClass } from "@/components/ui";
import { draftFromAcceptedFacts, reviewFinding, saveDraft, startResearch } from "@/lib/actions/research";
import { sendCrmEmail } from "@/lib/actions/google";
import type { OutreachDraft } from "@/lib/types";

function Msg({ state }: { state: { ok?: boolean; error?: string; message?: string } }) {
  if (state.error) return <p role="alert" className="text-sm text-danger">{state.error}</p>;
  if (state.ok && state.message) return <p role="status" className="text-sm text-ok">{state.message}</p>;
  return null;
}

export function ResearchStartForm({ companyId, opportunityId, contacts, back, providerLabel, canIncludeConversations }: {
  companyId: string; opportunityId: string | null; contacts: { value: string; label: string }[]; back: string; providerLabel: string; canIncludeConversations: boolean;
}) {
  const [state, action, pending] = useActionState(startResearch, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="opportunity_id" value={opportunityId ?? ""} />
      <input type="hidden" name="back" value={back} />
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-xs text-muted">Depth
          <select name="level" className="input mt-1 h-9 py-1.5" defaultValue="company">
            <option value="company">Company — team, hiring, news</option>
            <option value="market">Market — talent market for the role</option>
            <option value="person">Person — the hiring contact</option>
          </select>
        </label>
        <label className="text-xs text-muted">Contact (optional)
          <select name="contact_id" className="input mt-1 h-9 py-1.5" defaultValue="">
            <option value="">None</option>
            {contacts.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted">Draft for
          <select name="channel" className="input mt-1 h-9 py-1.5" defaultValue="email">
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp (copy & send yourself)</option>
          </select>
        </label>
      </div>
      <label className="block text-xs text-muted">Extra context for the researcher (optional)
        <textarea name="notes" rows={2} maxLength={1500} className="input mt-1" placeholder="e.g. They mentioned expanding the Pune data team" />
      </label>
      <label className={`flex items-start gap-2 text-sm ${canIncludeConversations ? "" : "opacity-60"}`}>
        <input type="checkbox" name="include_conversations" disabled={!canIncludeConversations} className="mt-1 h-4 w-4 accent-accent" />
        <span>Include dates and subjects of recent CRM-linked conversations (never message bodies)
          {!canIncludeConversations ? <span className="block text-xs text-muted">Available once you connect your own Google account in Settings.</span> : null}
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass("primary")}>{pending ? "Starting…" : "Research company"}</button>
        <span className="text-xs text-muted">Uses {providerLabel}. Only the company, role, location and the options above are sent.</span>
      </div>
      <Msg state={state} />
    </form>
  );
}

export function FindingReview({ id, back, category }: { id: string; back: string; category: string }) {
  const [state, action, pending] = useActionState(reviewFinding, {});
  const [mode, setMode] = useState<"" | "correct">("");
  if (state.ok) return <span role="status" className="text-ok">{state.message}</span>;
  const applyDefault = category === "about" ? "about" : category === "profile" ? "industry" : "";
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="back" value={back} />
      <label className="flex items-center gap-1 text-muted">
        <span className="sr-only">Apply to company field</span>
        <select name="apply_to" defaultValue={applyDefault} className="input h-7 w-auto py-0 text-xs">
          <option value="">Don&apos;t update profile</option>
          <option value="about">Use as company “About”</option>
          <option value="industry">Set industry</option>
          <option value="employee_range">Set employee range</option>
        </select>
      </label>
      {mode === "correct" ? (
        <>
          <input name="corrected" required maxLength={1000} placeholder="Corrected statement" className="input h-7 w-64 py-0 text-xs" />
          <button name="state" value="corrected" disabled={pending} className={buttonClass("primary", "sm")}>Save correction</button>
        </>
      ) : (
        <>
          <button name="state" value="accepted" disabled={pending} className={buttonClass("subtle", "sm")}>Accept</button>
          <button type="button" onClick={() => setMode("correct")} className={buttonClass("ghost", "sm")}>Correct…</button>
          <button name="state" value="dismissed" disabled={pending} className={buttonClass("ghost", "sm")}>Dismiss</button>
        </>
      )}
      {state.error ? <span role="alert" className="text-danger">{state.error}</span> : null}
    </form>
  );
}

export function DraftFromFactsForm({ companyId, opportunityId, contacts, back, canIncludeConversations }: {
  companyId: string; opportunityId: string | null; contacts: { value: string; label: string }[]; back: string; canIncludeConversations: boolean;
}) {
  const [state, action, pending] = useActionState(draftFromAcceptedFacts, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="opportunity_id" value={opportunityId ?? ""} />
      <input type="hidden" name="back" value={back} />
      <select name="contact_id" aria-label="Contact" className="input h-8 w-auto py-1 text-[13px]" defaultValue="">
        <option value="">No contact</option>
        {contacts.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <select name="channel" aria-label="Channel" className="input h-8 w-auto py-1 text-[13px]" defaultValue="email">
        <option value="email">Email</option><option value="whatsapp">WhatsApp</option>
      </select>
      {canIncludeConversations ? (
        <label className="flex items-center gap-1 text-xs text-muted"><input type="checkbox" name="include_conversations" className="accent-accent" /> conversation history</label>
      ) : null}
      <button type="submit" disabled={pending} className={buttonClass("secondary", "sm")}>{pending ? "Drafting…" : "Draft from accepted facts"}</button>
      <Msg state={state} />
    </form>
  );
}

export function DraftEditor({ draft, back, gmailFrom, companyId, opportunityId }: {
  draft: OutreachDraft | null; back: string; gmailFrom: string | null; companyId?: string; opportunityId?: string | null;
}) {
  const [saveState, saveAction, saving] = useActionState(saveDraft, {});
  const [sendState, sendAction, sending] = useActionState(sendCrmEmail, {});
  const [body, setBody] = useState(draft?.body ?? "");
  const [subject, setSubject] = useState(draft?.subject ?? "");
  const [to, setTo] = useState("");
  const [copied, setCopied] = useState(false);
  const isWhatsApp = draft?.channel === "whatsapp";

  return (
    <div className="rounded-md border border-line p-3">
      {draft ? <div className="mb-2 text-xs text-muted">{isWhatsApp ? "WhatsApp" : "Email"} draft · {draft.level} level · created {new Date(draft.created_at).toLocaleDateString("en-IN")}</div> : null}
      <form action={saveAction} className="space-y-2">
        <input type="hidden" name="id" value={draft?.id ?? ""} />
        <input type="hidden" name="back" value={back} />
        {companyId ? <input type="hidden" name="company_id" value={companyId} /> : null}
        {opportunityId ? <input type="hidden" name="opportunity_id" value={opportunityId} /> : null}
        {!isWhatsApp ? (
          <label className="block text-xs text-muted">Subject
            <input name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={250} className="input mt-1" />
          </label>
        ) : null}
        <label className="block text-xs text-muted">Message
          <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={7} maxLength={6000} className="input mt-1" />
        </label>
        {!draft ? (
          <label className="text-xs text-muted">Channel <select name="channel" className="input ml-1 inline h-8 w-auto py-1 text-[13px]"><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select></label>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button name="status" value="draft" disabled={saving} className={buttonClass("secondary", "sm")}>{saving ? "Saving…" : "Save draft"}</button>
          {draft && isWhatsApp ? (
            <button name="status" value="copied_whatsapp" disabled={saving}
              onClick={() => { void navigator.clipboard?.writeText(body).then(() => setCopied(true)); }}
              className={buttonClass("primary", "sm")}>{copied ? "Copied" : "Copy for WhatsApp & log"}</button>
          ) : null}
          {draft ? <button name="status" value="discarded" disabled={saving} className={buttonClass("ghost", "sm")}>Discard</button> : null}
        </div>
        <Msg state={saveState} />
      </form>

      {draft && !isWhatsApp ? (
        gmailFrom ? (
          <form action={sendAction} className="mt-3 space-y-2 border-t border-line pt-3">
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="draft_id" value={draft.id} />
            <input type="hidden" name="company_id" value={draft.company_id} />
            {draft.opportunity_id ? <input type="hidden" name="opportunity_id" value={draft.opportunity_id} /> : null}
            {draft.contact_id ? <input type="hidden" name="contact_id" value={draft.contact_id} /> : null}
            <input type="hidden" name="subject" value={subject} />
            <input type="hidden" name="body" value={body} />
            <label className="block text-xs text-muted">Send to
              <input name="to" value={to} onChange={(e) => setTo(e.target.value)} required type="email" className="input mt-1" placeholder="name@company.com" />
            </label>
            <button type="submit" disabled={sending || !to || !subject || !body} className={buttonClass("primary", "sm")}>
              {sending ? "Sending…" : `Review done — send from ${gmailFrom}`}
            </button>
            <Msg state={sendState} />
          </form>
        ) : <p className="mt-2 text-xs text-muted">Connect your Gmail in Settings to send this from your own address, or copy it into your mail client.</p>
      ) : null}
    </div>
  );
}
