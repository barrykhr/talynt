"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ROLES } from "@/lib/candidate/roles";
import { usePassport } from "@/lib/candidate/passport";
import { appearanceReasons } from "@/lib/candidate/alignment";
import {
  EMPTY_FILTERS,
  FILTER_LABELS,
  activeCount,
  filterOptions,
  fromParams,
  optionLabel,
  search,
  toParams,
  type FilterKey,
  type Filters,
} from "@/lib/contour/roles";
import { ROLES_PAGE } from "@/lib/contour/content";
import { ROUTES } from "@/lib/contour/site";
import { RoleRow } from "./RoleRow";
import { cx } from "@/lib/utils";

const OPTIONS = filterOptions();

/**
 * Explore opportunities.
 *
 * Search and filters live in the URL, so a filtered list can be bookmarked,
 * shared and navigated with the back button. Results are the live role data;
 * when nothing matches, the page says so rather than padding the list.
 */
export function RoleExplorer() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { passport, loaded } = usePassport();

  const [filters, setFilters] = useState<Filters>(() => fromParams(params));
  const [usePassportMatch, setUsePassportMatch] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Keep the URL in step with the filters without adding a history entry per keystroke.
  useEffect(() => {
    const next = toParams(filters);
    const current = params.toString() ? `?${params.toString()}` : "";
    if (next !== current) router.replace(`${pathname}${next}`, { scroll: false });
  }, [filters, params, pathname, router]);

  const hasPassport = loaded && (passport.functionIds.length > 0 || passport.workModelIds.length > 0 || passport.directionIds.length > 0);

  const results = useMemo(() => {
    let list = search(filters);
    if (usePassportMatch && hasPassport) {
      list = list.filter(
        (role) =>
          (passport.functionIds.length === 0 || passport.functionIds.includes(role.functionId)) &&
          (passport.workModelIds.length === 0 || role.workModelIds.some((w) => passport.workModelIds.includes(w))),
      );
    }
    return list;
  }, [filters, usePassportMatch, hasPassport, passport]);

  const toggle = (key: FilterKey, id: string) =>
    setFilters((f) => ({ ...f, [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id] }));

  const clear = () => {
    setFilters(EMPTY_FILTERS);
    setUsePassportMatch(false);
  };

  const count = activeCount(filters) + (usePassportMatch ? 1 : 0);
  const chips = (Object.keys(FILTER_LABELS) as FilterKey[]).flatMap((key) => filters[key].map((id) => ({ key, id })));

  return (
    <div>
      {/* --- Search ------------------------------------------------------- */}
      <div className="flex flex-col gap-3 border-y py-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="role-search" className="ct-meta ct-mute">
            Role, company, skill or keyword
          </label>
          <div className="relative mt-2">
            <svg viewBox="0 0 20 20" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ct-mute)]">
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              id="role-search"
              type="search"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              placeholder={ROLES_PAGE.searchPlaceholder}
              autoComplete="off"
              className="ct-input pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            className="ct-btn ct-btn-secondary flex-1 lg:hidden"
          >
            Filters{count > 0 && <span className="ct-meta ct-green tabular-nums">· {count}</span>}
          </button>
          {hasPassport && (
            <button
              type="button"
              aria-pressed={usePassportMatch}
              onClick={() => setUsePassportMatch((v) => !v)}
              className={cx("ct-btn flex-1", usePassportMatch ? "ct-btn-primary" : "ct-btn-secondary")}
            >
              <span aria-hidden="true">{usePassportMatch ? "●" : "○"}</span>
              {ROLES_PAGE.matchPassport}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-10 pt-8 lg:grid-cols-12 lg:gap-10">
        {/* --- Filters: a rail on desktop ------------------------------------ */}
        <section className="hidden lg:col-span-3 lg:block" aria-label="Filters">
          <div className="sticky top-[calc(var(--ct-nav-h)+1.5rem)] flex flex-col gap-8">
            <FilterGroups filters={filters} onToggle={toggle} idPrefix="rail" />
            {count > 0 && (
              <button type="button" onClick={clear} className="ct-btn ct-btn-quiet w-fit text-[0.9rem] text-[var(--ct-green)]">
                Clear all filters
              </button>
            )}
          </div>
        </section>

        {/* --- Results ------------------------------------------------------- */}
        <div className="lg:col-span-9">
          <h2 className="sr-only">Results</h2>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="ct-meta ct-ink2" role="status" aria-live="polite">
              {results.length === ROLES.length
                ? `${ROLES.length} open roles`
                : `${results.length} of ${ROLES.length} open ${ROLES.length === 1 ? "role" : "roles"}`}
            </p>
            {chips.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Active filters">
                {chips.map(({ key, id }) => (
                  <li key={`${key}-${id}`}>
                    <button
                      type="button"
                      onClick={() => toggle(key, id)}
                      className="ct-tag ct-b-green min-h-8 bg-[var(--ct-green-wash)] text-[var(--ct-green-deep)] hover:bg-[var(--ct-surface)]"
                    >
                      {optionLabel(key, id)}
                      <span aria-hidden="true">×</span>
                      <span className="sr-only">— remove {FILTER_LABELS[key].toLowerCase()} filter</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {results.length > 0 ? (
            <div className="mt-5 border-b">
              {results.map((role) => (
                <RoleRow
                  key={role.slug}
                  role={role}
                  reasons={usePassportMatch && hasPassport ? appearanceReasons(passport, role).slice(0, 3) : undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState filtered={count > 0} onClear={clear} />
          )}

          <p className="ct-small mt-8 max-w-2xl">
            Company names come in conversation, not on a listing. Saving a role is a bookmark on this device — no one is
            notified.
          </p>
        </div>
      </div>

      {sheetOpen && (
        <FilterSheet
          filters={filters}
          onToggle={toggle}
          onClear={clear}
          resultCount={results.length}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}

function FilterGroups({
  filters,
  onToggle,
  idPrefix,
}: {
  filters: Filters;
  onToggle: (key: FilterKey, id: string) => void;
  idPrefix: string;
}) {
  return (
    <>
      <fieldset>
        <legend className="ct-meta ct-ink2">{FILTER_LABELS.loc}</legend>
        <div className="mt-3 flex flex-col gap-4">
          {OPTIONS.loc.map((group) => (
            <div key={group.region}>
              <p className="ct-small text-[0.8rem]">{group.region}</p>
              <ul className="mt-1.5 flex flex-col">
                {group.options.map((o) => (
                  <CheckRow key={o.id} id={`${idPrefix}-loc-${o.id}`} label={o.label} count={o.count} checked={filters.loc.includes(o.id)} onChange={() => onToggle("loc", o.id)} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="ct-meta ct-ink2">{FILTER_LABELS.wm}</legend>
        <p className="ct-small mt-1 text-[0.8rem]">How you’d work — separate from where.</p>
        <ul className="mt-2 flex flex-col">
          {OPTIONS.wm.map((o) => (
            <CheckRow key={o.id} id={`${idPrefix}-wm-${o.id}`} label={o.label} count={o.count} checked={filters.wm.includes(o.id)} onChange={() => onToggle("wm", o.id)} />
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="ct-meta ct-ink2">{FILTER_LABELS.fn}</legend>
        <ul className="mt-2 flex flex-col">
          {OPTIONS.fn.map((o) => (
            <CheckRow key={o.id} id={`${idPrefix}-fn-${o.id}`} label={o.label} count={o.count} checked={filters.fn.includes(o.id)} onChange={() => onToggle("fn", o.id)} />
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="ct-meta ct-ink2">{FILTER_LABELS.lvl}</legend>
        <ul className="mt-2 flex flex-col">
          {OPTIONS.lvl.map((o) => (
            <CheckRow
              key={o.id}
              id={`${idPrefix}-lvl-${o.id}`}
              label={o.label}
              hint={o.note}
              count={o.count}
              checked={filters.lvl.includes(o.id)}
              onChange={() => onToggle("lvl", o.id)}
            />
          ))}
        </ul>
      </fieldset>
    </>
  );
}

function CheckRow({
  id,
  label,
  hint,
  count,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <li>
      <label htmlFor={id} className="flex min-h-10 cursor-pointer items-start gap-3 py-1.5">
        <input id={id} type="checkbox" className="ct-check" checked={checked} onChange={onChange} />
        <span className="flex-1 text-[0.93rem] leading-snug">
          {label}
          {hint && <span className="ct-small block text-[0.78rem]">{hint}</span>}
        </span>
        <span className="ct-meta ct-mute tabular-nums">{count}</span>
      </label>
    </li>
  );
}

function FilterSheet({
  filters,
  onToggle,
  onClear,
  resultCount,
  onClose,
}: {
  filters: Filters;
  onToggle: (key: FilterKey, id: string) => void;
  onClear: () => void;
  resultCount: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    opener.current = document.activeElement;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("button, input")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>("button, input"));
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 lg:hidden" style={{ zIndex: "var(--ct-z-sheet)" }}>
      <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--ct-ink)_35%,transparent)]" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Filter roles"
        className="absolute inset-x-0 bottom-0 flex max-h-[88svh] flex-col rounded-t-[var(--ct-r-l)] bg-[var(--ct-bg)]"
      >
        <div className="flex items-center justify-between border-b px-5 py-3">
          <p className="ct-display ct-s">Filters</p>
          <button type="button" onClick={onClose} className="ct-btn ct-btn-quiet">
            Close
          </button>
        </div>
        <div className="flex flex-col gap-8 overflow-y-auto px-5 py-6">
          <FilterGroups filters={filters} onToggle={onToggle} idPrefix="sheet" />
        </div>
        <div className="flex gap-2 border-t px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onClear} className="ct-btn ct-btn-secondary">
            Clear
          </button>
          <button type="button" onClick={onClose} className="ct-btn ct-btn-primary flex-1">
            Show {resultCount} {resultCount === 1 ? "role" : "roles"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="ct-panel mt-6 p-7 sm:p-10">
      <p className="ct-meta ct-mute">Nothing here</p>
      <p className="ct-display ct-m mt-4">{filtered ? ROLES_PAGE.emptyFiltered : ROLES_PAGE.emptyNone}</p>
      <p className="ct-body mt-4 max-w-xl">{filtered ? ROLES_PAGE.emptyFilteredLead : ROLES_PAGE.emptyNoneBody}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        {filtered && (
          <button type="button" onClick={onClear} className="ct-btn ct-btn-primary">
            Clear all filters
          </button>
        )}
        <Link href={ROUTES.profile} className="ct-btn ct-btn-secondary">
          Build your Career Passport
        </Link>
      </div>
    </div>
  );
}
