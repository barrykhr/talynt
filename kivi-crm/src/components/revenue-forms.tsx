"use client";

import { ActionForm, ConfirmAction, SelectField, SubmitButton, TextField, TextAreaField } from "@/components/forms";
import { addCredit, cancelInvoice, createInvoice, recordPayment, reversePayment, saveAgreement, savePlacement, saveRevenueEvent, markRevenueEventEarned, reverseRevenueEvent } from "@/lib/actions/revenue";
import { AGREEMENT_KINDS, AGREEMENT_STATUSES, PLACEMENT_STATUSES } from "@/lib/constants";
import type { Agreement, Placement } from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

export function AgreementForm({ companyId, back, agreement }: { companyId: string; back: string; agreement?: Agreement }) {
  return (
    <ActionForm action={saveAgreement} resetOnSuccess={!agreement} className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-2">
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="back" value={back} />
      {agreement ? <input type="hidden" name="id" value={agreement.id} /> : null}
      <SelectField label="Type" name="kind" defaultValue={agreement?.kind ?? "msa"} options={AGREEMENT_KINDS.values.map((v) => ({ value: v, label: AGREEMENT_KINDS.label[v] }))} />
      <SelectField label="Status" name="status" defaultValue={agreement?.status ?? "in_discussion"} options={AGREEMENT_STATUSES.values.map((v) => ({ value: v, label: AGREEMENT_STATUSES.label[v] }))} />
      <TextField label="Signed on" name="signed_on" type="date" defaultValue={agreement?.signed_on ?? ""} hint="Required when signed." />
      <TextField label="Expires on" name="expires_on" type="date" defaultValue={agreement?.expires_on ?? ""} />
      <TextField label="Reference / document link" name="reference" defaultValue={agreement?.reference ?? ""} className="sm:col-span-2" placeholder="e.g. Drive link or contract number" />
      <TextAreaField label="Agreed terms (fee %, payment terms, replacement guarantee…)" name="terms" rows={3} defaultValue={agreement?.terms ?? ""} className="sm:col-span-2" />
      <div className="sm:col-span-2"><SubmitButton>{agreement ? "Save agreement" : "Add agreement"}</SubmitButton></div>
    </ActionForm>
  );
}

export function PlacementForm({ requirementId, currency, back, placement }: { requirementId: string; currency: string; back: string; placement?: Placement }) {
  return (
    <ActionForm action={savePlacement} resetOnSuccess={!placement} className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-3">
      <input type="hidden" name="requirement_id" value={requirementId} />
      <input type="hidden" name="back" value={back} />
      {placement ? <input type="hidden" name="id" value={placement.id} /> : null}
      <TextField label="Label (no candidate details)" name="label" defaultValue={placement?.label ?? ""} placeholder="e.g. Hire 1" />
      <SelectField label="Status" name="status" defaultValue={placement?.status ?? "offer_accepted"} options={PLACEMENT_STATUSES.values.map((v) => ({ value: v, label: PLACEMENT_STATUSES.label[v] }))} />
      <TextField label="Offer accepted on" name="offer_accepted_on" type="date" required defaultValue={placement?.offer_accepted_on ?? today()} />
      <TextField label="Joined on" name="joined_on" type="date" defaultValue={placement?.joined_on ?? ""} />
      <TextField label={`Fee for this placement (${currency})`} name="fee_amount" inputMode="decimal" defaultValue={placement?.fee_amount ?? ""} />
      <TextField label="First-year compensation (optional)" name="compensation" inputMode="decimal" defaultValue={placement?.compensation ?? ""} />
      <input type="hidden" name="currency" value={currency} />
      <div className="sm:col-span-3"><SubmitButton>{placement ? "Save placement" : "Record placement"}</SubmitButton></div>
    </ActionForm>
  );
}

export function MilestoneForm({ requirementId, currency, back }: { requirementId: string; currency: string; back: string }) {
  return (
    <ActionForm action={saveRevenueEvent} resetOnSuccess className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-3">
      <input type="hidden" name="requirement_id" value={requirementId} />
      <input type="hidden" name="back" value={back} />
      <input type="hidden" name="currency" value={currency} />
      <SelectField label="Kind" name="kind" defaultValue="retainer_milestone" options={[{ value: "retainer_milestone", label: "Retainer / milestone" }, { value: "contract_margin", label: "Contract margin" }, { value: "other", label: "Other" }]} />
      <TextField label={`Amount (${currency})`} name="amount" inputMode="decimal" required />
      <TextField label="Milestone met on" name="earned_on" type="date" hint="Leave blank if not met yet." />
      <TextField label="Description" name="description" className="sm:col-span-3" placeholder="e.g. Retainer 1 of 3 — shortlist delivered" />
      <div className="sm:col-span-3"><SubmitButton>Add milestone</SubmitButton></div>
    </ActionForm>
  );
}

export function EarnButton({ id, back }: { id: string; back: string }) {
  return (
    <ConfirmAction action={markRevenueEventEarned} hidden={{ id, back }} label="Mark earned" variant="secondary" size="sm"
      title="Milestone met?" description="Earned means the contractual milestone has happened. It is not invoiced or paid yet." confirmLabel="Mark earned">
      <TextField label="Met on" name="earned_on" type="date" required defaultValue={today()} />
    </ConfirmAction>
  );
}

export function ReverseEventButton({ id, back }: { id: string; back: string }) {
  return (
    <ConfirmAction action={reverseRevenueEvent} hidden={{ id, back }} label="Reverse" variant="ghost" size="sm"
      title="Reverse this revenue event?" description="It stays in history marked reversed and stops counting as earned." confirmLabel="Reverse">
      <TextField label="Reason" name="reason" required />
    </ConfirmAction>
  );
}

export function InvoiceForm({ companyId, requirementId, currency, back }: { companyId: string; requirementId?: string; currency: string; back: string }) {
  return (
    <ActionForm action={createInvoice} resetOnSuccess className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-3">
      <input type="hidden" name="company_id" value={companyId} />
      {requirementId ? <input type="hidden" name="requirement_id" value={requirementId} /> : null}
      <input type="hidden" name="back" value={back} />
      <TextField label="Invoice number" name="invoice_number" required />
      <TextField label={`Amount (${currency})`} name="amount" inputMode="decimal" required />
      <TextField label="Currency" name="currency" defaultValue={currency} maxLength={3} readOnly={Boolean(requirementId)} hint={requirementId ? "Matches the requirement." : undefined} />
      <TextField label="Issued on" name="issued_on" type="date" required defaultValue={today()} />
      <TextField label="Due on" name="due_on" type="date" required defaultValue={inDays(30)} />
      <TextField label="Notes" name="notes" />
      <div className="sm:col-span-3"><SubmitButton>Record invoice</SubmitButton></div>
    </ActionForm>
  );
}

export function PaymentForm({ invoiceId, currency, outstanding, back }: { invoiceId: string; currency: string; outstanding: number; back: string }) {
  return (
    <ActionForm action={recordPayment} resetOnSuccess className="grid gap-2 sm:grid-cols-4 sm:items-end">
      <input type="hidden" name="invoice_id" value={invoiceId} />
      <input type="hidden" name="back" value={back} />
      <TextField label={`Amount received (${currency})`} name="amount" inputMode="decimal" required defaultValue={outstanding} hint="Partial payments are fine." />
      <TextField label="Received on" name="received_on" type="date" required defaultValue={today()} />
      <TextField label="Reference (UTR/cheque)" name="reference" />
      <SubmitButton variant="secondary">Record payment</SubmitButton>
    </ActionForm>
  );
}

export function CreditButton({ invoiceId, back }: { invoiceId: string; back: string }) {
  return (
    <ConfirmAction action={addCredit} hidden={{ invoice_id: invoiceId, back }} label="Credit / rebate" variant="ghost" size="sm"
      title="Record a credit or rebate" description="Reduces what the customer owes. It is not cash received." confirmLabel="Record credit">
      <div className="grid gap-2">
        <TextField label="Amount" name="amount" inputMode="decimal" required />
        <TextField label="Date" name="adjusted_on" type="date" required defaultValue={today()} />
        <TextField label="Reason" name="reason" required placeholder="e.g. Replacement guarantee rebate" />
      </div>
    </ConfirmAction>
  );
}

export function CancelInvoiceButton({ id, back }: { id: string; back: string }) {
  return (
    <ConfirmAction action={cancelInvoice} hidden={{ id, back }} label="Cancel invoice" variant="ghost" size="sm"
      title="Cancel this invoice?" description="Only possible when no payments are recorded against it. It stays in history." confirmLabel="Cancel invoice">
      <TextField label="Reason" name="reason" required />
    </ConfirmAction>
  );
}

export function ReversePaymentButton({ id, back }: { id: string; back: string }) {
  return (
    <ConfirmAction action={reversePayment} hidden={{ id, back }} label="Reverse" variant="ghost" size="sm"
      title="Reverse this payment?" description="Use this for bounced or mistaken payments. It stays in history and stops counting as realized revenue." confirmLabel="Reverse payment">
      <TextField label="Reason" name="reason" required />
    </ConfirmAction>
  );
}
