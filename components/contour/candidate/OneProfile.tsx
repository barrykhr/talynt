import Link from "next/link";
import { ROLES } from "@/lib/candidate/roles";
import { definitionFor } from "@/lib/assessment/bank";
import { ONE_PROFILE } from "@/lib/contour/proposed";
import { ROUTES } from "@/lib/contour/site";

/**
 * ONE CAREER PROFILE ─┬─ ROLE A → its own assessment
 *                     ├─ ROLE B → its own assessment
 *                     └─ ROLE C → its own assessment
 *
 * Drawn as real structure — a list of real roles and the competencies each
 * role's assessment actually asks about — so it reads the same to a screen
 * reader as it looks.
 */
const SLUGS = ["staff-data-engineer-fintech", "product-manager-developer-tools", "enterprise-account-executive-emea"];

export function OneProfileDiagram() {
  const rows = SLUGS.map((slug) => ({ role: ROLES.find((r) => r.slug === slug)!, definition: definitionFor(slug)! }));
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_3rem_minmax(0,2fr)] lg:items-center lg:gap-0">
      <div className="ct-panel p-6" style={{ ["--ct-bc" as string]: "var(--ct-violet)" }}>
        <p className="ct-meta ct-violet">{ONE_PROFILE.profile}</p>
        <ul className="mt-4 flex flex-col">
          {["Experience", "Skills", "Education", "Preferences"].map((p) => (
            <li key={p} className="border-t py-2 text-[0.95rem] first:border-t-0">
              {p}
            </li>
          ))}
        </ul>
        <p className="ct-small mt-4">{ONE_PROFILE.profileNote}</p>
      </div>

      <div aria-hidden="true" className="hidden h-full lg:block">
        <svg viewBox="0 0 48 300" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0 150H18M18 40V260M18 40H48M18 150H48M18 260H48" fill="none" stroke="var(--ct-violet)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      <ul className="flex flex-col gap-3" aria-label="Three applications from one profile">
        {rows.map(({ role, definition }, i) => (
          <li key={role.slug} className="grid gap-3 rounded-[var(--ct-r-m)] border bg-[var(--ct-surface)] p-4 sm:grid-cols-[minmax(0,0.9fr)_1.25rem_minmax(0,1.3fr)] sm:items-center sm:gap-4">
            <div>
              <p className="ct-meta ct-mute">Application {String.fromCharCode(65 + i)}</p>
              <Link href={ROUTES.role(role.slug)} className="ct-display ct-s mt-1 block hover:text-[var(--ct-green)]">
                {role.title}
              </Link>
            </div>
            <span aria-hidden="true" className="ct-mute hidden sm:block">
              →
            </span>
            <div>
              <p className="ct-meta ct-violet">{ONE_PROFILE.assessment}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {definition.competencies.map((c) => (
                  <li key={c.id} className="ct-tag text-[0.7rem]">
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
