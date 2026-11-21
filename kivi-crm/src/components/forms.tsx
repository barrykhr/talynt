"use client";

import {
  createContext, useActionState, useContext, useEffect, useId, useRef, useState,
  type ReactNode, type SelectHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes,
} from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { ActionState } from "@/lib/types";
import { buttonClass, cx } from "@/components/ui";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

const FormStateContext = createContext<ActionState>({});

/**
 * Wraps a server action form: shows pending state, field errors, a form-level
 * error and success message, and the "possible duplicates" review step.
 */
export function ActionForm({
  action, children, className, resetOnSuccess, duplicateHrefBase, onSuccess,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  duplicateHrefBase?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    }
  }, [state, resetOnSuccess, onSuccess]);

  return (
    <FormStateContext.Provider value={state}>
      <form ref={ref} action={formAction} className={className} noValidate>
        {state.error ? (
          <div role="alert" className="mb-4 rounded-md border border-danger/20 bg-danger-soft px-3.5 py-3 text-sm text-danger">
            {state.error}
          </div>
        ) : null}
        {state.ok && state.message ? (
          <div role="status" className="mb-4 rounded-md border border-ok/20 bg-ok-soft px-3.5 py-3 text-sm text-ok">
            {state.message}
          </div>
        ) : null}
        {state.duplicates?.length ? (
          <div role="alert" className="mb-4 rounded-md border border-warn/25 bg-warn-soft px-3.5 py-3 text-sm">
            <p className="font-medium text-warn">This looks like it may already exist</p>
            <ul className="mt-2 space-y-1 text-ink-soft">
              {state.duplicates.map((d) => (
                <li key={d.id}>
                  {duplicateHrefBase ? (
                    <Link className="link" href={`${duplicateHrefBase}/${d.id}`} target="_blank">{d.label}</Link>
                  ) : d.label}
                  {d.detail ? <span className="text-muted"> · {d.detail}</span> : null}
                  <span className="text-muted"> — {d.reason}</span>
                </li>
              ))}
            </ul>
            <label className="mt-3 flex items-center gap-2 text-ink">
              <input type="checkbox" name="confirm_duplicate" value="yes" className="h-4 w-4 accent-accent" />
              It&apos;s a different record — create it anyway
            </label>
          </div>
        ) : null}
        {children}
      </form>
    </FormStateContext.Provider>
  );
}

export function useFieldError(name: string) {
  return useContext(FormStateContext).fieldErrors?.[name];
}

export function Field({
  label, name, hint, required, children, className,
}: { label: string; name: string; hint?: ReactNode; required?: boolean; children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => ReactNode; className?: string }) {
  const id = useId();
  const error = useFieldError(name);
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("min-w-0", className)}>
      <label htmlFor={id} className="mb-1 block text-[13px] font-medium text-ink-soft">
        {label}
        {required ? <span className="text-danger" aria-hidden> *</span> : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {hint && !error ? <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p> : null}
      {error ? <p id={`${id}-err`} className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}

export function TextField({ label, name, hint, required, className, ...rest }: {
  label: string; name: string; hint?: ReactNode; required?: boolean; className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "id">) {
  return (
    <Field label={label} name={name} hint={hint} required={required} className={className}>
      {(p) => <input name={name} className="input" required={required} {...p} {...rest} />}
    </Field>
  );
}

export function TextAreaField({ label, name, hint, required, className, rows = 4, ...rest }: {
  label: string; name: string; hint?: ReactNode; required?: boolean; className?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "id">) {
  return (
    <Field label={label} name={name} hint={hint} required={required} className={className}>
      {(p) => <textarea name={name} rows={rows} className="input resize-y" required={required} {...p} {...rest} />}
    </Field>
  );
}

export function SelectField({ label, name, hint, required, className, options, placeholder, ...rest }: {
  label: string; name: string; hint?: ReactNode; required?: boolean; className?: string;
  options: { value: string; label: string }[]; placeholder?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "id">) {
  return (
    <Field label={label} name={name} hint={hint} required={required} className={className}>
      {(p) => (
        <select name={name} className="input" required={required} {...p} {...rest}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </Field>
  );
}

export function SubmitButton({ children, variant = "primary", pendingLabel = "Saving…", className, name, value }: {
  children: ReactNode; variant?: "primary" | "secondary" | "danger" | "ghost" | "subtle"; pendingLabel?: string;
  className?: string; name?: string; value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} aria-busy={pending} className={buttonClass(variant, "md", className)}>
      {pending ? pendingLabel : children}
    </button>
  );
}

/**
 * A small form whose submit requires confirmation in an accessible dialog.
 * Used for archive, merge, disconnect and other consequential actions.
 */
export function ConfirmAction({
  action, hidden, label, title, description, confirmLabel = "Confirm", variant = "danger", size = "md", children,
}: {
  action: Action;
  hidden: Record<string, string>;
  label: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  variant?: "danger" | "secondary" | "primary" | "ghost";
  size?: "sm" | "md";
  children?: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(action, {});
  const titleId = useId();

  useEffect(() => {
    if (state.ok) dialogRef.current?.close();
  }, [state]);

  return (
    <>
      <button type="button" className={buttonClass(variant, size)} onClick={() => dialogRef.current?.showModal()}>
        {label}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(92vw,28rem)] rounded-xl border border-line bg-surface p-0 text-ink shadow-xl"
      >
        <form action={formAction} className="p-5">
          {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <h2 id={titleId} className="text-base font-semibold">{title}</h2>
          <div className="mt-2 text-sm text-muted">{description}</div>
          {children ? <div className="mt-4">{children}</div> : null}
          {state.error ? <p role="alert" className="mt-3 text-sm text-danger">{state.error}</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={buttonClass("secondary")} onClick={() => dialogRef.current?.close()}>
              Cancel
            </button>
            <SubmitButton variant={variant === "danger" ? "danger" : "primary"} pendingLabel="Working…">{confirmLabel}</SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}

/** Inline one-click action (e.g. complete a task) with pending + error feedback. */
export function InlineAction({ action, hidden, children, variant = "ghost", title, size = "sm" }: {
  action: Action; hidden: Record<string, string>; children: ReactNode; variant?: "ghost" | "secondary" | "subtle" | "primary"; title?: string; size?: "sm" | "md";
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <InlineSubmit variant={variant} title={title} size={size}>{children}</InlineSubmit>
      {state.error ? <span role="alert" className="text-xs text-danger">{state.error}</span> : null}
    </form>
  );
}

function InlineSubmit({ children, variant, title, size }: { children: ReactNode; variant: "ghost" | "secondary" | "subtle" | "primary"; title?: string; size: "sm" | "md" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" title={title} aria-label={title} disabled={pending} aria-busy={pending} className={buttonClass(variant, size)}>
      {pending ? "…" : children}
    </button>
  );
}

/** Collapsible panel used for "Log activity", "Add contact" etc. */
export function Disclosure({ summary, children, defaultOpen = false }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className={buttonClass(open ? "ghost" : "secondary", "sm")}>
        {summary}
      </button>
      <div id={id} hidden={!open} className="mt-3">{open ? children : null}</div>
    </div>
  );
}
