"use client";

import Link from "next/link";
import { usePassport } from "@/lib/candidate/passport";
import { EXPERIENCE_BANDS, FUNCTIONS } from "@/lib/candidate/taxonomy";
import { DIRECTION } from "@/lib/contour/content";
import { ROUTES } from "@/lib/contour/site";
import { Choices } from "./Fields";

/**
 * The first two of the approved three questions — what you do, where you are.
 * The third, where this is going, is the pathways drawing above it. Answers go
 * to the Career Passport on this device; nothing is sent.
 */
export function QuickQuestions() {
  const { passport, update, loaded } = usePassport();
  const answered = passport.functionIds.length > 0 || Boolean(passport.bandId) || passport.directionIds.length > 0;

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
      <div className="flex flex-col gap-8 lg:col-span-8">
        <Choices
          id="q-functions"
          legend={DIRECTION.q1}
          options={FUNCTIONS}
          selected={passport.functionIds}
          onChange={(functionIds) => update({ functionIds })}
        />
        <Choices
          id="q-band"
          legend={DIRECTION.q2}
          hint={DIRECTION.q2hint}
          options={EXPERIENCE_BANDS}
          selected={passport.bandId ? [passport.bandId] : []}
          onChange={(ids) => update({ bandId: ids[0] ?? "" })}
          multiple={false}
        />
      </div>
      <div className="lg:col-span-4">
        <div className="ct-panel p-6" aria-live="polite">
          <p className="ct-meta ct-mute">{DIRECTION.whereLabel}</p>
          <p className="ct-body mt-3">{answered && loaded ? DIRECTION.saved : DIRECTION.unsaved}</p>
          <div className="mt-5 flex flex-col gap-2">
            <Link href={ROUTES.opportunities} className="ct-link text-[0.95rem]">
              {DIRECTION.seeRoles}
            </Link>
            <Link href={ROUTES.profile} className="ct-link text-[0.95rem]">
              {DIRECTION.finish}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
