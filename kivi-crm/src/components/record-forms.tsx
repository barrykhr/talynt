"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ActionForm, SelectField, SubmitButton, TextAreaField, TextField,
} from "@/components/forms";
import { buttonClass } from "@/components/ui";
import {
  ACTIVITY_TYPES, FEE_BASES, LEAD_SOURCES, MANUAL_ACTIVITY_TYPES, OPPORTUNITY_STAGES, PRIORITIES, REQUIREMENT_STATUSES,
} from "@/lib/constants";
import { createCompany, updateCompany } from "@/lib/actions/companies";
import { createContact, updateContact } from "@/lib/actions/contacts";
import { createOpportunity, createRequirement, updateOpportunity, updateRequirement } from "@/lib/actions/opportunities";
import { logActivity } from "@/lib/actions/activities";
import type { Company, Contact, Opportunity, Requirement } from "@/lib/types";

export interface Option { value: string; label: string }

const sourceOptions = LEAD_SOURCES.values.map((v) => ({ value: v, label: LEAD_SOURCES.label[v] }));
const stageOptions = OPPORTUNITY_STAGES.values.map((v) => ({ value: v, label: OPPORTUNITY_STAGES.label[v] }));
const reqStatusOptions = REQUIREMENT_STATUSES.values.map((v) => ({ value: v, label: REQUIREMENT_STATUSES.label[v] }));

function FormActions({ cancelHref, submitLabel }: { cancelHref: string; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
      <Link href={cancelHref} className={buttonClass("secondary")}>Cancel</Link>
      <SubmitButton>{submitLabel}</SubmitButton>
    </div>
  );
}

// ------------------------------------------------------------------ Company
export function CompanyForm({ company, team, defaultOwner }: { company?: Company; team: Option[]; defaultOwner?: string }) {
  return (
    <ActionForm action={company ? updateCompany : createCompany} duplicateHrefBase="/companies" className="grid gap-4 sm:grid-cols-2">
      {company ? <input type="hidden" name="id" value={company.id} /> : null}
      <TextField label="Company name" name="name" required defaultValue={company?.name} autoFocus={!company} maxLength={200} className="sm:col-span-2" />
      <TextField label="Website or domain" name="website" defaultValue={company?.website ?? company?.domain ?? ""} placeholder="example.com" hint="Used to spot duplicates and match emails." />
      <TextField label="Location" name="location" defaultValue={company?.location ?? ""} placeholder="e.g. Pune, Bengaluru" />
      <TextField label="Industry" name="industry" defaultValue={company?.industry ?? ""} />
      <SelectField label="Owner" name="owner_id" options={team} placeholder="Unassigned" defaultValue={company?.owner_id ?? defaultOwner ?? ""} hint="One accountable person." />
      <SelectField label="Lead source" name="source" options={sourceOptions} placeholder="Not recorded" defaultValue={company?.source ?? ""} />
      <TextField label="Source detail" name="source_detail" defaultValue={company?.source_detail ?? ""} placeholder="e.g. referred by …, event name" />
      <p className="text-xs text-muted sm:col-span-2">MSA status is managed under Agreements on the company page. Active client = MSA signed + at least one live requirement.</p>
      <TextAreaField label="Notes" name="notes" rows={5} defaultValue={company?.notes ?? ""} className="sm:col-span-2" />
      <input type="hidden" name="domain" value="" />
      <FormActions cancelHref={company ? `/companies/${company.id}` : "/companies"} submitLabel={company ? "Save changes" : "Add company"} />
    </ActionForm>
  );
}

// ------------------------------------------------------------------ Contact
export function ContactForm({ contact, team, companies, defaultCompany, defaultOwner, compact }: {
  contact?: Contact; team: Option[]; companies: Option[]; defaultCompany?: string; defaultOwner?: string; compact?: boolean;
}) {
  return (
    <ActionForm action={contact ? updateContact : createContact} duplicateHrefBase="/contacts" resetOnSuccess={compact} className="grid gap-4 sm:grid-cols-2">
      {contact ? <input type="hidden" name="id" value={contact.id} /> : null}
      {compact ? <input type="hidden" name="stay" value="1" /> : null}
      <TextField label="Full name" name="full_name" required defaultValue={contact?.full_name} maxLength={160} autoFocus={!contact && !compact} />
      <TextField label="Role / title" name="role_title" defaultValue={contact?.role_title ?? ""} placeholder="e.g. Head of Talent" />
      {compact && defaultCompany ? (
        <input type="hidden" name="company_id" value={defaultCompany} />
      ) : (
        <SelectField label="Company" name="company_id" options={companies} placeholder="No company" defaultValue={contact?.company_id ?? defaultCompany ?? ""} />
      )}
      <TextField label="Work email" name="email" type="email" defaultValue={contact?.email ?? ""} autoComplete="off" />
      <TextField label="Phone / WhatsApp" name="phone" type="tel" defaultValue={contact?.phone ?? ""} />
      <SelectField label="Owner" name="owner_id" options={team} placeholder="Unassigned" defaultValue={contact?.owner_id ?? defaultOwner ?? ""} />
      {!compact ? (
        <>
          <SelectField label="Lead source" name="source" options={sourceOptions} placeholder="Not recorded" defaultValue={contact?.source ?? ""} />
          <TextField label="Location" name="location" defaultValue={contact?.location ?? ""} />
          <TextField label="LinkedIn profile URL" name="linkedin_url" defaultValue={contact?.linkedin_url ?? ""} hint="Paste manually. The CRM never scrapes LinkedIn." className="sm:col-span-2" />
        </>
      ) : null}
      <TextAreaField label="Notes" name="notes" rows={compact ? 2 : 4} defaultValue={contact?.notes ?? ""} className="sm:col-span-2" />
      {compact ? (
        <div className="flex justify-end sm:col-span-2"><SubmitButton>Add contact</SubmitButton></div>
      ) : (
        <FormActions cancelHref={contact ? `/contacts/${contact.id}` : "/contacts"} submitLabel={contact ? "Save changes" : "Add contact"} />
      )}
    </ActionForm>
  );
}

// ------------------------------------------------------------------ Contact picker (checkboxes)
function ContactPicker({ contacts, selected }: { contacts: (Option & { companyId: string | null })[]; selected: string[] }) {
  if (contacts.length === 0) {
    return <p className="text-sm text-muted">No contacts at this company yet. Add them from the company page.</p>;
  }
  return (
    <fieldset>
      <legend className="mb-1 text-[13px] font-medium text-ink-soft">Contacts involved</legend>
      <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-md border border-line p-2.5">
        {contacts.map((c) => (
          <label key={c.value} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="contact_ids" value={c.value} defaultChecked={selected.includes(c.value)} className="h-4 w-4 accent-accent" />
            {c.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function useCompanyScoped<T extends { companyId: string | null }>(initialCompany: string, items: T[]) {
  const [companyId, setCompanyId] = useState(initialCompany);
  return { companyId, setCompanyId, scoped: items.filter((i) => i.companyId === companyId) };
}

// ------------------------------------------------------------------ Opportunity
export function OpportunityForm({ opportunity, team, companies, contacts, selectedContacts = [], defaultCompany, defaultOwner }: {
  opportunity?: Opportunity; team: Option[]; companies: Option[]; contacts: (Option & { companyId: string | null })[];
  selectedContacts?: string[]; defaultCompany?: string; defaultOwner?: string;
}) {
  const { companyId, setCompanyId, scoped } = useCompanyScoped(opportunity?.company_id ?? defaultCompany ?? "", contacts);
  const [stage, setStage] = useState<string>(opportunity?.stage ?? "new_lead");
  return (
    <ActionForm action={opportunity ? updateOpportunity : createOpportunity} className="grid gap-4 sm:grid-cols-2">
      {opportunity ? <input type="hidden" name="id" value={opportunity.id} /> : null}
      <SelectField label="Company" name="company_id" required options={companies} placeholder="Choose a company…" value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
      <TextField label="Opportunity name" name="title" required defaultValue={opportunity?.title} placeholder="e.g. Q3 engineering hiring" />
      <SelectField label="Sales stage" name="stage" options={stageOptions} value={stage} onChange={(e) => setStage(e.target.value)} />
      <SelectField label="Owner" name="owner_id" options={team} placeholder="Unassigned" defaultValue={opportunity?.owner_id ?? defaultOwner ?? ""} />
      <p className="text-xs text-muted sm:col-span-2"><span className="text-danger">*</span> Only company and name are required. Everything else can be added as you learn it.</p>
      {stage === "lost" ? (
        <TextAreaField label="Loss reason" name="loss_reason" required rows={2} defaultValue={opportunity?.loss_reason ?? ""} className="sm:col-span-2" />
      ) : (
        <input type="hidden" name="loss_reason" value={opportunity?.loss_reason ?? ""} />
      )}
      {stage === "nurture" ? (
        <>
          <TextField label="Why nurture?" name="nurture_reason" required defaultValue={opportunity?.nurture_reason ?? ""} placeholder="e.g. Hiring freeze until April" />
          <TextField label="Revisit on" name="revisit_on" type="date" defaultValue={opportunity?.revisit_on ?? ""} hint="Becomes the next follow-up." />
        </>
      ) : (
        <>
          <input type="hidden" name="nurture_reason" value={opportunity?.nurture_reason ?? ""} />
          <input type="hidden" name="revisit_on" value={opportunity?.revisit_on ?? ""} />
        </>
      )}
      {stage === "won" && !opportunity ? (
        <p className="text-xs text-warn sm:col-span-2">Won needs a signed MSA and an accepted live requirement — create the opportunity first, then mark it Won.</p>
      ) : null}
      <TextField label="Next action" name="next_action" defaultValue={opportunity?.next_action ?? ""} placeholder="e.g. Send fee proposal" />
      <TextField label="Next follow-up" name="next_follow_up_on" type="date" defaultValue={opportunity?.next_follow_up_on ?? ""} hint="Opportunities without one show as “No next action”." />
      <SelectField label="Priority" name="priority" options={PRIORITIES.values.map((v) => ({ value: v, label: PRIORITIES.label[v] }))} defaultValue={opportunity?.priority ?? "normal"} />
      <SelectField label="Lead source" name="source" options={sourceOptions} placeholder="Not recorded" defaultValue={opportunity?.source ?? ""} />
      <TextField label="Hiring role or need" name="hiring_need" defaultValue={opportunity?.hiring_need ?? ""} placeholder="e.g. 5 Java developers" />
      <TextField label="Hiring volume" name="hiring_volume" type="number" min={1} inputMode="numeric" defaultValue={opportunity?.hiring_volume ?? ""} />
      <TextField label="Location" name="location" defaultValue={opportunity?.location ?? ""} />
      <TextField label="Expected close" name="expected_close_on" type="date" defaultValue={opportunity?.expected_close_on ?? ""} />
      <TextField label="Estimated value" name="estimated_value" inputMode="decimal" defaultValue={opportunity?.estimated_value ?? ""} hint="Used for pipeline revenue." />
      <TextField label="Currency" name="currency" defaultValue={opportunity?.currency ?? "INR"} maxLength={3} />
      <details className="rounded-md border border-line p-3 sm:col-span-2" open={Boolean(opportunity?.hiring_timing || opportunity?.next_agreed_step || opportunity?.decision_maker_contact_id)}>
        <summary className="cursor-pointer text-sm font-medium">Qualification (optional) — decision-maker, timing, fee basis, next step</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <SelectField label="Decision-maker" name="decision_maker_contact_id" options={scoped} placeholder="Not identified yet" defaultValue={opportunity?.decision_maker_contact_id ?? ""} />
          <TextField label="Hiring timing" name="hiring_timing" defaultValue={opportunity?.hiring_timing ?? ""} placeholder="e.g. Start within 6 weeks" />
          <TextField label="Budget" name="budget" defaultValue={opportunity?.budget ?? ""} placeholder="e.g. 18–24 LPA" />
          <TextField label="Fee basis discussed" name="fee_basis_note" defaultValue={opportunity?.fee_basis_note ?? ""} placeholder="e.g. 8.33% of CTC" />
          <TextField label="Next agreed step" name="next_agreed_step" defaultValue={opportunity?.next_agreed_step ?? ""} className="sm:col-span-2" />
          <TextField label="Probability override (%)" name="probability_override" type="number" min={0} max={100} defaultValue={opportunity?.probability_override ?? ""} hint="Leave blank to use the stage default." />
        </div>
      </details>
      <div className="sm:col-span-2">
        {companyId ? <ContactPicker contacts={scoped} selected={selectedContacts} /> : <p className="text-sm text-muted">Choose a company to pick contacts.</p>}
      </div>
      <TextAreaField label="Notes" name="notes" rows={4} defaultValue={opportunity?.notes ?? ""} className="sm:col-span-2" />
      <FormActions cancelHref={opportunity ? `/pipeline/${opportunity.id}` : "/pipeline"} submitLabel={opportunity ? "Save changes" : "Add opportunity"} />
    </ActionForm>
  );
}

// ------------------------------------------------------------------ Requirement
export function RequirementForm({ requirement, team, companies, contacts, opportunities, selectedContacts = [], defaultCompany, defaultOpportunity, defaultOwner }: {
  requirement?: Requirement; team: Option[]; companies: Option[]; contacts: (Option & { companyId: string | null })[];
  opportunities: (Option & { companyId: string | null })[]; selectedContacts?: string[];
  defaultCompany?: string; defaultOpportunity?: string; defaultOwner?: string;
}) {
  const { companyId, setCompanyId, scoped } = useCompanyScoped(requirement?.company_id ?? defaultCompany ?? "", contacts);
  const opps = opportunities.filter((o) => o.companyId === companyId);
  return (
    <ActionForm action={requirement ? updateRequirement : createRequirement} className="grid gap-4 sm:grid-cols-2">
      {requirement ? <input type="hidden" name="id" value={requirement.id} /> : null}
      <SelectField label="Company" name="company_id" required options={companies} placeholder="Choose a company…" value={companyId} onChange={(e) => setCompanyId(e.target.value)} />
      <SelectField label="From opportunity" name="opportunity_id" options={opps} placeholder="None" defaultValue={requirement?.opportunity_id ?? defaultOpportunity ?? ""} hint="Optional link to the sales deal." />
      <TextField label="Role" name="role_title" required defaultValue={requirement?.role_title} placeholder="e.g. Senior Data Engineer" className="sm:col-span-2" />
      <TextField label="Hiring volume" name="hiring_volume" type="number" min={1} required inputMode="numeric" defaultValue={requirement?.hiring_volume ?? 1} />
      <SelectField label="Delivery status" name="status" options={reqStatusOptions} defaultValue={requirement?.status ?? "new_requirement"} />
      <SelectField label="Owner" name="owner_id" options={team} placeholder="Unassigned" defaultValue={requirement?.owner_id ?? defaultOwner ?? ""} />
      <SelectField label="Client contact" name="client_contact_id" options={scoped} placeholder="Not set" defaultValue={requirement?.client_contact_id ?? ""} />
      <TextField label="Location" name="location" defaultValue={requirement?.location ?? ""} />
      <TextField label="Expected start" name="expected_start_on" type="date" defaultValue={requirement?.expected_start_on ?? ""} />
      <TextField label="Next action" name="next_action" defaultValue={requirement?.next_action ?? ""} placeholder="e.g. Share 3 profiles" />
      <TextField label="Next action due" name="next_action_on" type="date" defaultValue={requirement?.next_action_on ?? ""} />
      <TextField label="Timeline" name="timeline_notes" defaultValue={requirement?.timeline_notes ?? ""} placeholder="e.g. Shortlist within 2 weeks" className="sm:col-span-2" />
      <fieldset className="rounded-md border border-line p-3 sm:col-span-2">
        <legend className="px-1 text-sm font-medium">Commercial terms (drive revenue forecasts)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField label="Fee basis" name="fee_basis" placeholder="Not set" defaultValue={requirement?.fee_basis ?? ""} options={FEE_BASES.values.map((v) => ({ value: v, label: FEE_BASES.label[v] }))} />
          <TextField label="Fee %" name="fee_percent" inputMode="decimal" defaultValue={requirement?.fee_percent ?? ""} hint="For % of first-year pay." />
          <TextField label="Expected compensation (per hire)" name="expected_compensation" inputMode="decimal" defaultValue={requirement?.expected_compensation ?? ""} />
          <TextField label="Fee per hire" name="fee_per_hire" inputMode="decimal" defaultValue={requirement?.fee_per_hire ?? ""} hint="For fixed fees." />
          <TextField label="Estimated total fee (override)" name="estimated_total_fee" inputMode="decimal" defaultValue={requirement?.estimated_total_fee ?? ""} hint="Otherwise calculated × volume." />
          <TextField label="Currency" name="currency" defaultValue={requirement?.currency ?? "INR"} maxLength={3} />
          <TextField label="Probability (%)" name="probability" type="number" min={0} max={100} defaultValue={requirement?.probability ?? ""} />
          <TextField label="Forecast placement date" name="forecast_placement_on" type="date" defaultValue={requirement?.forecast_placement_on ?? ""} />
          <TextField label="Budget / commercial notes" name="budget_notes" defaultValue={requirement?.budget_notes ?? ""} />
          <TextAreaField label="Agreed terms" name="commercial_terms" rows={2} defaultValue={requirement?.commercial_terms ?? ""} className="sm:col-span-3" placeholder="e.g. 8.33% of fixed CTC, 90-day replacement, invoice on joining" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="client_accepted" defaultChecked={Boolean(requirement?.client_accepted_at)} className="h-4 w-4 accent-accent" /> Client accepted this requirement</label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="terms_agreed" defaultChecked={Boolean(requirement?.terms_agreed_at)} className="h-4 w-4 accent-accent" /> Commercial terms agreed</label>
        </div>
      </fieldset>
      <div className="sm:col-span-2">
        {companyId ? <ContactPicker contacts={scoped} selected={selectedContacts} /> : <p className="text-sm text-muted">Choose a company to pick hiring contacts.</p>}
      </div>
      <TextAreaField label="Notes" name="notes" rows={4} defaultValue={requirement?.notes ?? ""} className="sm:col-span-2" />
      <FormActions cancelHref={requirement ? `/requirements/${requirement.id}` : "/requirements"} submitLabel={requirement ? "Save changes" : "Add requirement"} />
    </ActionForm>
  );
}

// ------------------------------------------------------------------ Activity / task
export function ActivityForm({ links, team, defaultOwner, back, contacts, defaultType = "note", companies }: {
  links: { company_id?: string | null; contact_id?: string | null; opportunity_id?: string | null; requirement_id?: string | null };
  team: Option[]; defaultOwner: string; back: string; contacts?: Option[]; defaultType?: string; companies?: Option[];
}) {
  const [type, setType] = useState(defaultType);
  const isTask = type === "task";
  const typeOptions = MANUAL_ACTIVITY_TYPES.map((v) => ({ value: v, label: ACTIVITY_TYPES.label[v] }));
  return (
    <ActionForm action={logActivity} resetOnSuccess className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="back" value={back} />
      {Object.entries(links).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      {companies ? <SelectField label="Company" name="company_id" required options={companies} placeholder="Choose a company…" className="sm:col-span-2" hint="Every activity and task is linked to a record." /> : null}
      <SelectField label="Type" name="type" options={typeOptions} value={type} onChange={(e) => setType(e.target.value)} />
      {contacts && contacts.length > 0 && !links.contact_id ? (
        <SelectField label="With contact" name="contact_id" options={contacts} placeholder="No specific contact" />
      ) : <div className="hidden sm:block" />}
      <TextField label={isTask ? "Task" : "Summary"} name="subject" required maxLength={300} className="sm:col-span-2"
        placeholder={isTask ? "e.g. Send revised proposal" : type === "whatsapp" ? "e.g. Shared JD on WhatsApp" : "What happened?"} />
      {isTask ? (
        <>
          <TextField label="Due" name="due_at" type="datetime-local" required />
          <SelectField label="Owner" name="owner_id" options={team} defaultValue={defaultOwner} required />
          <TextField label="Remind me at" name="reminder_at" type="datetime-local" hint="Optional. Shows in My tasks when due." />
        </>
      ) : (
        <TextField label="When" name="occurred_at" type="datetime-local" hint="Leave blank for now." />
      )}
      <TextAreaField label="Details" name="body" rows={3} className="sm:col-span-2" />
      {type === "whatsapp" ? (
        <p className="text-xs text-muted sm:col-span-2">WhatsApp messages are logged manually — the CRM doesn&apos;t connect to WhatsApp.</p>
      ) : null}
      <div className="flex justify-end sm:col-span-2">
        <SubmitButton>{isTask ? "Add task" : "Log activity"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
