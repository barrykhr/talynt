import Link from "next/link";
import { buttonClass } from "@/components/ui";

export interface FilterField {
  name: string;
  label: string;
  type: "search" | "select" | "date" | "text";
  options?: { value: string; label: string }[];
  placeholder?: string;
  value: string;
}

/**
 * Plain GET form: filters live in the URL, so every view is linkable and the
 * active filters are always visible. Works without JavaScript.
 */
export function FilterBar({ action, fields, keep = {}, summary }: {
  action: string; fields: FilterField[]; keep?: Record<string, string>; summary?: React.ReactNode;
}) {
  const active = fields.filter((f) => f.value).length;
  return (
    <form action={action} method="get" className="card mb-4 p-3" aria-label="Filters">
      {Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        {fields.map((f) => (
          <div key={f.name} className={f.type === "search" ? "col-span-2" : undefined}>
            <label htmlFor={`f-${f.name}`} className="mb-1 block text-xs text-muted">{f.label}</label>
            {f.type === "select" ? (
              <select id={`f-${f.name}`} name={f.name} defaultValue={f.value} className="input h-9 py-1.5">
                <option value="">{f.placeholder ?? "Any"}</option>
                {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input
                id={`f-${f.name}`}
                name={f.name}
                type={f.type === "search" ? "search" : f.type}
                defaultValue={f.value}
                placeholder={f.placeholder}
                className="input h-9 py-1.5"
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted">{summary ?? (active ? `${active} filter${active === 1 ? "" : "s"} applied` : "No filters applied")}</div>
        <div className="flex gap-2">
          {active ? (
            <Link href={`${action}${keep.view ? `?view=${encodeURIComponent(keep.view)}` : ""}`} className={buttonClass("ghost", "sm")}>Clear filters</Link>
          ) : null}
          <button type="submit" className={buttonClass("secondary", "sm")}>Apply</button>
        </div>
      </div>
    </form>
  );
}
