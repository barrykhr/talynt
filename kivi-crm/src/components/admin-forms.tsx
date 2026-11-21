"use client";

import { useActionState } from "react";
import { ActionForm, SelectField, SubmitButton, TextField } from "@/components/forms";
import { inviteMember, updateMember } from "@/lib/actions/admin";
import { buttonClass } from "@/components/ui";
import type { TeamMember } from "@/lib/types";

export function InviteForm() {
  return (
    <ActionForm action={inviteMember} resetOnSuccess className="grid gap-3 sm:grid-cols-[1.4fr_1fr_140px_auto] sm:items-end">
      <TextField label="Work email" name="email" type="email" required placeholder="name@kivitronicsconsulting.com" autoComplete="off" />
      <TextField label="Name" name="full_name" placeholder="Optional" />
      <SelectField label="Role" name="role" defaultValue="member" options={[{ value: "member", label: "Member" }, { value: "admin", label: "Admin" }]} />
      <SubmitButton>Add person</SubmitButton>
    </ActionForm>
  );
}

export function MemberRow({ m, isSelf }: { m: TeamMember; isSelf: boolean }) {
  const [state, action, pending] = useActionState(updateMember, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="user_id" value={m.id} />
      <label className="sr-only" htmlFor={`role-${m.id}`}>Role for {m.email}</label>
      <select id={`role-${m.id}`} name="role" defaultValue={m.role} className="input h-8 w-28 py-1 text-[13px]">
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <label className="sr-only" htmlFor={`status-${m.id}`}>Access for {m.email}</label>
      <select id={`status-${m.id}`} name="status" defaultValue={m.status === "disabled" ? "disabled" : "active"} className="input h-8 w-32 py-1 text-[13px]">
        <option value="active">{m.status === "invited" ? "Invited" : "Active"}</option>
        <option value="disabled">Disabled</option>
      </select>
      <button type="submit" disabled={pending} className={buttonClass("secondary", "sm")}
        onClick={(e) => {
          const form = e.currentTarget.form!;
          const disabling = (form.elements.namedItem("status") as HTMLSelectElement).value === "disabled" && m.status !== "disabled";
          if (disabling && !confirm(`Disable ${m.email}? They will lose access immediately.${isSelf ? " This is your own account." : ""}`)) e.preventDefault();
        }}>
        {pending ? "…" : "Save"}
      </button>
      {state.error ? <span role="alert" className="text-xs text-danger">{state.error}</span> : null}
      {state.ok && !pending ? <span role="status" className="text-xs text-ok">Saved</span> : null}
    </form>
  );
}
