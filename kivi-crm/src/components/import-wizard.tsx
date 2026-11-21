"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import { commitImport, parseImportFile, previewImport, type CommitResult, type ImportInput, type PreviewResult } from "@/lib/actions/import";
import { IMPORT_FIELDS, REQUIRED_FIELDS, type Decision, type ImportField, type ImportKind, type Mapping } from "@/lib/import/plan";
import { Badge, buttonClass, cx } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

const KIND_INFO: Record<ImportKind, { label: string; help: string }> = {
  leads: { label: "Leads", help: "Each row becomes a company (or links to an existing one), a contact and a New-lead opportunity." },
  companies: { label: "Companies only", help: "Each row becomes a company. Existing companies are never changed." },
  contacts: { label: "Contacts", help: "Each row becomes a contact, linked to a company when one is given." },
};

const DECISION_LABEL: Record<Decision, string> = { link: "Use existing (don't change it)", update: "Update existing with this row", skip: "Skip row", create: "Create new anyway" };

export function ImportWizard() {
  const [parsed, parseAction] = useActionState(parseImportFile, {});
  const [kind, setKind] = useState<ImportKind>("leads");
  const [ownerMode, setOwnerMode] = useState<"me" | "unassigned">("me");
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [result, setResult] = useState<CommitResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [parsedKey, setParsedKey] = useState<string | undefined>(undefined);

  // Reset downstream steps whenever a new file is parsed.
  const fileKey = parsed.ok ? `${parsed.filename}:${parsed.rows?.length}` : undefined;
  if (fileKey !== parsedKey) {
    setParsedKey(fileKey);
    setMapping(parsed.mapping ?? null);
    setPreview(null);
    setResult(null);
    setDecisions({});
  }

  const input = useMemo<ImportInput | null>(() => (parsed.ok && mapping ? {
    kind, filename: parsed.filename!, headers: parsed.headers!, rows: parsed.rows!, mapping: mapping as ImportInput["mapping"], ownerMode,
  } : null), [parsed, mapping, kind, ownerMode]);

  const missingRequired = REQUIRED_FIELDS[kind].filter((group) => !group.some((f) => mapping?.[f] !== undefined));

  function runPreview() {
    if (!input) return;
    startTransition(async () => {
      setResult(null);
      const p = await previewImport(input);
      setPreview(p);
      const d: Record<string, Decision> = {};
      p.rows?.forEach((r) => { if (r.needsDecision) d[String(r.row)] = r.defaultDecision; });
      setDecisions(d);
    });
  }

  function runCommit() {
    if (!input) return;
    startTransition(async () => {
      const r = await commitImport({ ...input, decisions });
      setResult(r);
      if (r.ok) setPreview(null);
    });
  }

  const step = result?.ok ? 4 : preview?.ok ? 3 : parsed.ok ? 2 : 1;

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2 text-[13px]" aria-label="Import steps">
        {["Upload", "Map columns", "Review & resolve duplicates", "Results"].map((s, i) => (
          <li key={s} aria-current={step === i + 1 ? "step" : undefined}
            className={cx("rounded-full px-3 py-1", step === i + 1 ? "bg-accent text-white" : step > i + 1 ? "bg-accent-soft text-accent-ink" : "bg-sunken text-muted")}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      {/* Step 1 */}
      <section className="card p-4" aria-labelledby="step1">
        <h2 id="step1" className="text-sm font-semibold">1. Upload a spreadsheet</h2>
        <p className="mt-1 text-sm text-muted">CSV or .xlsx, up to 5 MB and {2000} rows. The first row must be column headings. Formulas are never run — only their saved values are read.</p>
        <form action={parseAction} className="mt-3 flex flex-wrap items-center gap-3">
          <label htmlFor="import-file" className="sr-only">Spreadsheet file</label>
          <input id="import-file" name="file" type="file" required accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="block text-sm file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-sm" />
          <SubmitButton variant="secondary" pendingLabel="Reading…">Read file</SubmitButton>
        </form>
        {parsed.error ? <p role="alert" className="mt-3 text-sm text-danger">{parsed.error}</p> : null}
        {parsed.ok ? (
          <p role="status" className="mt-3 text-sm text-ok">
            Read {parsed.rows!.length} row{parsed.rows!.length === 1 ? "" : "s"} and {parsed.headers!.length} columns from <strong>{parsed.filename}</strong>.
            {parsed.truncated ? <span className="text-warn"> Only the first 2,000 rows will be imported — split larger files.</span> : null}
          </p>
        ) : null}
      </section>

      {/* Step 2 */}
      {parsed.ok && mapping ? (
        <section className="card p-4" aria-labelledby="step2">
          <h2 id="step2" className="text-sm font-semibold">2. What are you importing, and which column is which?</h2>
          <fieldset className="mt-3">
            <legend className="sr-only">Import type</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(KIND_INFO) as ImportKind[]).map((k) => (
                <label key={k} className={cx("cursor-pointer rounded-md border p-3 text-sm", kind === k ? "border-accent bg-accent-soft/50" : "border-line")}>
                  <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => { setKind(k); setPreview(null); }} className="mr-2 accent-accent" />
                  <span className="font-medium">{KIND_INFO[k].label}</span>
                  <span className="mt-1 block text-xs text-muted">{KIND_INFO[k].help}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(IMPORT_FIELDS) as ImportField[]).map((f) => {
              const required = REQUIRED_FIELDS[kind].some((g) => g.includes(f));
              return (
                <div key={f}>
                  <label htmlFor={`map-${f}`} className="mb-1 block text-xs font-medium text-ink-soft">
                    {IMPORT_FIELDS[f].label}{required ? <span className="text-danger"> *</span> : null}
                  </label>
                  <select id={`map-${f}`} className="input h-9 py-1.5" value={mapping[f] ?? ""}
                    onChange={(e) => { setPreview(null); setMapping((m) => { const next = { ...m }; if (e.target.value === "") delete next[f]; else next[f] = Number(e.target.value); return next; }); }}>
                    <option value="">— Not in file —</option>
                    {parsed.headers!.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
              );
            })}
          </div>

          <fieldset className="mt-4 text-sm">
            <legend className="mb-1 text-xs font-medium text-ink-soft">Owner for rows without a recognised owner</legend>
            <label className="mr-4"><input type="radio" checked={ownerMode === "me"} onChange={() => { setOwnerMode("me"); setPreview(null); }} className="mr-1.5 accent-accent" />Me</label>
            <label><input type="radio" checked={ownerMode === "unassigned"} onChange={() => { setOwnerMode("unassigned"); setPreview(null); }} className="mr-1.5 accent-accent" />Leave unassigned</label>
          </fieldset>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={runPreview} disabled={pending || missingRequired.length > 0} className={buttonClass("primary")}>
              {pending && !preview ? "Checking…" : "Preview & check duplicates"}
            </button>
            {missingRequired.length ? <span className="text-sm text-warn">Map a column for: {missingRequired.map((g) => g.map((f) => IMPORT_FIELDS[f].label).join(" or ")).join(", ")}</span> : null}
          </div>
          {preview?.error ? <p role="alert" className="mt-3 text-sm text-danger">{preview.error}</p> : null}
        </section>
      ) : null}

      {/* Step 3 */}
      {preview?.ok && preview.rows ? (
        <section className="card" aria-labelledby="step3">
          <div className="border-b border-line p-4">
            <h2 id="step3" className="text-sm font-semibold">3. Review</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <Badge tone="ok">{preview.summary!.ready} ready</Badge>
              <Badge tone="warn">{preview.summary!.duplicates} possible duplicates</Badge>
              <Badge tone="danger">{preview.summary!.invalid} with errors (will be skipped)</Badge>
              <Badge tone="info">{preview.summary!.warnings} with warnings</Badge>
            </div>
            {preview.summary!.duplicates > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted">Set all duplicates to:</span>
                {(["link", "skip"] as Decision[]).map((d) => (
                  <button key={d} type="button" className={buttonClass("secondary", "sm")}
                    onClick={() => setDecisions((prev) => Object.fromEntries(Object.keys(prev).map((k) => {
                      const row = preview.rows!.find((r) => String(r.row) === k)!;
                      return [k, row.allowedDecisions.includes(d) ? d : prev[k]];
                    })))}>{DECISION_LABEL[d]}</button>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-xs text-muted">Nothing is overwritten unless you choose “Update existing”. “Use existing” links new contacts and leads to the record already in the CRM without changing it.</p>
          </div>
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Import preview</caption>
              <thead className="sticky top-0"><tr>
                <th scope="col" className="table-head px-3 py-2">Row</th>
                <th scope="col" className="table-head px-3 py-2">Company</th>
                <th scope="col" className="table-head px-3 py-2">Contact</th>
                <th scope="col" className="table-head px-3 py-2">Checks</th>
                <th scope="col" className="table-head px-3 py-2">Action</th>
              </tr></thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.row} className={cx("border-b border-line align-top", r.errors.length ? "bg-danger-soft/40" : r.needsDecision ? "bg-warn-soft/40" : "")}>
                    <td className="px-3 py-2 tabular-nums text-muted">{r.row}</td>
                    <td className="px-3 py-2">{r.company.name ?? <span className="text-faint">—</span>}<div className="text-xs text-muted">{[r.company.domain, r.company.location].filter(Boolean).join(" · ")}</div></td>
                    <td className="px-3 py-2">{r.contact.full_name ?? <span className="text-faint">—</span>}<div className="text-xs text-muted">{[r.contact.role_title, r.contact.email].filter(Boolean).join(" · ")}</div></td>
                    <td className="px-3 py-2 text-xs">
                      {r.errors.map((e) => <div key={e} className="text-danger">{e}</div>)}
                      {r.existingCompany ? <div className="text-warn">Company exists: <Link className="link" target="_blank" href={`/companies/${r.existingCompany.company_id}`}>{r.existingCompany.name}</Link> ({r.existingCompany.reason.replace(/_/g, " ")})</div> : null}
                      {r.existingContact ? <div className="text-warn">Contact exists: <Link className="link" target="_blank" href={`/contacts/${r.existingContact.contact_id}`}>{r.existingContact.full_name}</Link></div> : null}
                      {r.duplicateInFileOf ? <div className="text-warn">Repeats row {r.duplicateInFileOf}</div> : null}
                      {r.warnings.map((w) => <div key={w} className="text-muted">{w}</div>)}
                      {!r.errors.length && !r.needsDecision && !r.warnings.length ? <span className="text-ok">OK</span> : null}
                    </td>
                    <td className="px-3 py-2">
                      {r.errors.length ? <span className="text-xs text-danger">Will be skipped</span> : r.needsDecision ? (
                        <>
                          <label className="sr-only" htmlFor={`d-${r.row}`}>Action for row {r.row}</label>
                          <select id={`d-${r.row}`} className="input h-8 py-1 text-[13px]" value={decisions[String(r.row)] ?? r.defaultDecision}
                            onChange={(e) => setDecisions((d) => ({ ...d, [String(r.row)]: e.target.value as Decision }))}>
                            {r.allowedDecisions.map((d) => <option key={d} value={d}>{DECISION_LABEL[d]}</option>)}
                          </select>
                        </>
                      ) : <span className="text-xs text-muted">Import</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line p-4">
            <button type="button" onClick={runPreview} disabled={pending} className={buttonClass("ghost")}>Re-check</button>
            <button type="button" onClick={runCommit} disabled={pending} className={buttonClass("primary")}>
              {pending ? "Importing…" : `Import ${preview.summary!.total - preview.summary!.invalid} row${preview.summary!.total - preview.summary!.invalid === 1 ? "" : "s"}`}
            </button>
          </div>
          {result?.error ? <p role="alert" className="px-4 pb-4 text-sm text-danger">{result.error}</p> : null}
        </section>
      ) : null}

      {/* Step 4 */}
      {result?.ok && result.counts ? (
        <section className="card p-4" aria-labelledby="step4" role="status">
          <h2 id="step4" className="text-sm font-semibold">4. Import finished</h2>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Badge tone="ok">{result.counts.created} imported</Badge>
            <Badge tone="info">{result.counts.updated} updated</Badge>
            <Badge tone="warn">{result.counts.skipped} skipped</Badge>
            <Badge tone="danger">{result.counts.failed} failed</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {result.importId && result.counts.skipped + result.counts.failed > 0 ? (
              <a href={`/api/import/${result.importId}/report`} className={buttonClass("secondary", "sm")}>Download skipped & failed rows (CSV)</a>
            ) : null}
            {result.importId ? <a href={`/api/import/${result.importId}/report?all=1`} className={buttonClass("ghost", "sm")}>Full report (CSV)</a> : null}
            <Link href="/companies" className={buttonClass("ghost", "sm")}>View companies</Link>
            <Link href="/pipeline" className={buttonClass("ghost", "sm")}>View pipeline</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
