"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ROLES } from "@/lib/candidate/roles";
import { usePassport } from "@/lib/candidate/passport";
import { appearanceReasons } from "@/lib/candidate/alignment";
import {
  EXPERIENCE_BANDS,
  FUNCTIONS,
  LOCATIONS,
  REGIONS,
  WORK_MODELS,
  labelFor,
} from "@/lib/candidate/taxonomy";
import { Reveal } from "@/components/primitives/Reveal";
import { RoleCard } from "./RoleCard";
import { cx } from "@/lib/utils";

type Filters = {
  query: string;
  functionIds: string[];
  bandIds: string[];
  workModelIds: string[];
  locationIds: string[];
  regions: string[];
};

const EMPTY: Filters = {
  query: "",
  functionIds: [],
  bandIds: [],
  workModelIds: [],
  locationIds: [],
  regions: [],
};

export function RoleExplorer() {
  const { passport, loaded } = usePassport();
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [usePassportFilter, setUsePassportFilter] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const hasPassport =
    loaded && (passport.functionIds.length > 0 || passport.directionIds.length > 0);

  const activeCount =
    filters.functionIds.length +
    filters.bandIds.length +
    filters.workModelIds.length +
    filters.locationIds.length +
    filters.regions.length;

  const results = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return ROLES.filter((role) => {
      if (q) {
        const haystack = [
          role.title,
          role.company,
          role.summary,
          ...role.skills,
          labelFor(FUNCTIONS, role.functionId),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.functionIds.length && !filters.functionIds.includes(role.functionId))
        return false;
      if (filters.bandIds.length && !filters.bandIds.includes(role.bandId)) return false;
      if (
        filters.workModelIds.length &&
        !role.workModelIds.some((w) => filters.workModelIds.includes(w))
      )
        return false;
      if (
        filters.locationIds.length &&
        !role.locationIds.some((l) => filters.locationIds.includes(l))
      )
        return false;
      if (filters.regions.length) {
        const roleRegions = role.locationIds.map(
          (id) => LOCATIONS.find((l) => l.id === id)?.region,
        );
        if (!roleRegions.some((r) => r && filters.regions.includes(r))) return false;
      }
      if (usePassportFilter && hasPassport) {
        const fnOk =
          passport.functionIds.length === 0 ||
          passport.functionIds.includes(role.functionId);
        const wmOk =
          passport.workModelIds.length === 0 ||
          role.workModelIds.some((w) => passport.workModelIds.includes(w));
        if (!fnOk || !wmOk) return false;
      }
      return true;
    });
  }, [filters, usePassportFilter, hasPassport, passport]);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const toggleIn = (key: "functionIds" | "bandIds" | "workModelIds" | "locationIds" | "regions", id: string) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id],
    }));

  return (
    <div className="mt-14">
      {/* --- Search and filter controls ---------------------------------- */}
      <div className="flex flex-col gap-4 border-y border-current/12 py-5 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <label htmlFor="role-search" className="sr-only">
            Search roles
          </label>
          <input
            id="role-search"
            type="search"
            value={filters.query}
            placeholder="Search by title, skill or discipline"
            onChange={(e) => set("query", e.target.value)}
            className="w-full rounded-full border border-current/15 bg-transparent px-5 py-3 text-[0.95rem] transition-colors duration-300 placeholder:text-fg-30 hover:border-current/30 focus:border-signal/50 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            aria-expanded={panelOpen}
            aria-controls="filter-panel"
            className={cx(
              "mono-micro inline-flex items-center gap-2 rounded-full border px-4 py-2.5 leading-none transition-colors duration-300",
              activeCount
                ? "border-signal/45 bg-signal/10 text-signal"
                : "border-current/15 text-fg-55 hover:border-current/40 hover:text-fg-80",
            )}
          >
            Filters
            {activeCount > 0 && <span className="tabular-nums">· {activeCount}</span>}
            <span aria-hidden="true">{panelOpen ? "↑" : "↓"}</span>
          </button>

          {hasPassport && (
            <button
              type="button"
              onClick={() => setUsePassportFilter((v) => !v)}
              aria-pressed={usePassportFilter}
              className={cx(
                "mono-micro inline-flex items-center gap-2 rounded-full border px-4 py-2.5 leading-none transition-colors duration-300",
                usePassportFilter
                  ? "border-signal/45 bg-signal/10 text-signal"
                  : "border-current/15 text-fg-55 hover:border-current/40 hover:text-fg-80",
              )}
            >
              <span aria-hidden="true">{usePassportFilter ? "●" : "○"}</span>
              Match my Passport
            </button>
          )}

          {(activeCount > 0 || filters.query) && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY)}
              className="mono-micro text-fg-40 transition-colors duration-300 hover:text-fg-75"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {panelOpen && (
        <div
          id="filter-panel"
          className="grid gap-10 border-b border-current/12 py-9 md:grid-cols-2 xl:grid-cols-4"
        >
          <FilterGroup
            legend="Discipline"
            options={FUNCTIONS.map((f) => ({ id: f.id, label: f.label }))}
            selected={filters.functionIds}
            onToggle={(id) => toggleIn("functionIds", id)}
          />
          <FilterGroup
            legend="Level"
            options={EXPERIENCE_BANDS.map((b) => ({ id: b.id, label: b.label }))}
            selected={filters.bandIds}
            onToggle={(id) => toggleIn("bandIds", id)}
          />
          <FilterGroup
            legend="Work model"
            options={WORK_MODELS.map((w) => ({ id: w.id, label: w.label }))}
            selected={filters.workModelIds}
            onToggle={(id) => toggleIn("workModelIds", id)}
          />
          <div className="flex flex-col gap-8">
            <FilterGroup
              legend="Region"
              options={REGIONS.map((r) => ({ id: r, label: r }))}
              selected={filters.regions}
              onToggle={(id) => toggleIn("regions", id)}
            />
            <FilterGroup
              legend="City"
              options={LOCATIONS.map((l) => ({ id: l.id, label: l.label }))}
              selected={filters.locationIds}
              onToggle={(id) => toggleIn("locationIds", id)}
            />
          </div>
        </div>
      )}

      {/* --- Results ------------------------------------------------------ */}
      <p className="mono-micro mt-8 text-fg-40" role="status">
        {results.length === ROLES.length
          ? `${ROLES.length} open roles`
          : `${results.length} of ${ROLES.length} roles`}
      </p>

      {results.length > 0 ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {results.map((role, i) => (
            <Reveal key={role.slug} delay={Math.min(i, 5) * 0.05}>
              <RoleCard
                role={role}
                reasons={
                  hasPassport ? appearanceReasons(passport, role).slice(0, 3) : undefined
                }
              />
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyState
          hasFilters={activeCount > 0 || Boolean(filters.query) || usePassportFilter}
          onClear={() => {
            setFilters(EMPTY);
            setUsePassportFilter(false);
          }}
        />
      )}
    </div>
  );
}

function FilterGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: Array<{ id: string; label: string }>;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mono-micro text-fg-40">{legend}</legend>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggle(option.id)}
              aria-pressed={active}
              className={cx(
                "rounded-full border px-3.5 py-1.5 text-[0.85rem] transition-colors duration-300",
                active
                  ? "border-signal/45 bg-signal/10 text-signal-300"
                  : "border-current/15 text-fg-60 hover:border-current/40 hover:text-fg-85",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="mt-10 rounded-lg border border-current/12 p-9 sm:p-12">
      <p className="mono-micro text-fg-40">Nothing here</p>
      <p className="display mt-5 max-w-lg text-(length:--text-h3) text-balance">
        {hasFilters
          ? "No open role matches that."
          : "There are no open roles right now."}
      </p>
      <p className="mt-5 max-w-xl text-[0.95rem] leading-[1.65] text-fg-60">
        {hasFilters
          ? "We would rather show you nothing than show you something that doesn't fit. Widen the filters, or leave your Passport with us and we'll come to you when something real opens."
          : "Roles are added as clients bring them. There is nothing to pad the list with."}
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="mono-micro text-signal transition-opacity duration-300 hover:opacity-70"
          >
            Clear all filters →
          </button>
        )}
        <Link
          href="/candidates/passport#alerts"
          className="mono-micro text-fg-50 transition-colors duration-300 hover:text-fg-80"
        >
          Set up a talent alert →
        </Link>
      </div>
    </div>
  );
}
