"use client";

import Link from "next/link";
import { usePassport } from "@/lib/candidate/passport";
import { appearanceReasons } from "@/lib/candidate/alignment";
import { ROLES } from "@/lib/candidate/roles";
import { Reveal } from "@/components/primitives/Reveal";
import { RoleCard } from "./RoleCard";

/**
 * Open roles, with the reason each one is in front of you when the Passport
 * has enough in it to give a real one. When it doesn't, no reason is shown —
 * an invented explanation is worse than none.
 */
export function FeaturedRoles({ limit = 4 }: { limit?: number }) {
  const { passport, loaded } = usePassport();
  const hasSignal =
    loaded && (passport.functionIds.length > 0 || passport.directionIds.length > 0);

  const roles = hasSignal
    ? [...ROLES].sort((a, b) => {
        const score = (slug: string) => {
          const r = ROLES.find((x) => x.slug === slug)!;
          let n = 0;
          if (passport.functionIds.includes(r.functionId)) n += 2;
          if (passport.bandId === r.bandId) n += 1;
          if (passport.directionIds.some((d) => r.directionIds.includes(d))) n += 1;
          return n;
        };
        return score(b.slug) - score(a.slug);
      })
    : ROLES;

  return (
    <>
      <div className="mt-16 grid gap-6 lg:grid-cols-2">
        {roles.slice(0, limit).map((role, i) => (
          <Reveal key={role.slug} delay={i * 0.06}>
            <RoleCard
              role={role}
              reasons={hasSignal ? appearanceReasons(passport, role).slice(0, 3) : undefined}
            />
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.2}>
        <div className="mt-12">
          <Link
            href="/candidates/roles"
            className="mono-micro text-signal transition-opacity duration-300 hover:opacity-70"
          >
            All {ROLES.length} open roles →
          </Link>
        </div>
      </Reveal>
    </>
  );
}
