"use client";

import { useActionState } from "react";
import { logReviewItem } from "@/lib/actions/google";
import { buttonClass } from "@/components/ui";

export function ReviewItemForm({ id, contacts, companies, suggestedCompany }: {
  id: string; contacts: { value: string; label: string; companyId: string | null }[]; companies: { value: string; label: string }[]; suggestedCompany: string | null;
}) {
  const [state, action, pending] = useActionState(logReviewItem, {});
  if (state.ok) return <p role="status" className="mt-2 text-sm text-ok">{state.message}</p>;
  const suggestedContacts = contacts.filter((c) => c.companyId === suggestedCompany);
  return (
    <form action={action} className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor={`rc-${id}`} className="mb-1 block text-xs text-muted">Company</label>
        <select id={`rc-${id}`} name="company_id" defaultValue={suggestedCompany ?? ""} className="input h-8 py-1 text-[13px]">
          <option value="">Choose…</option>
          {companies.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`rp-${id}`} className="mb-1 block text-xs text-muted">Contact (optional)</label>
        <select id={`rp-${id}`} name="contact_id" defaultValue="" className="input h-8 py-1 text-[13px]">
          <option value="">No specific contact</option>
          {(suggestedContacts.length ? suggestedContacts : contacts).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <button type="submit" disabled={pending} className={buttonClass("subtle", "sm")}>{pending ? "…" : "Log to CRM"}</button>
      {state.error ? <p role="alert" className="text-xs text-danger sm:col-span-3">{state.error}</p> : null}
    </form>
  );
}
