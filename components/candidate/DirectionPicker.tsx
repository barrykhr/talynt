"use client";

import Link from "next/link";
import { usePassport } from "@/lib/candidate/passport";
import { DIRECTIONS, EXPERIENCE_BANDS, FUNCTIONS } from "@/lib/candidate/taxonomy";
import { ChipGroup } from "./Fields";
import { Reveal } from "@/components/primitives/Reveal";

/**
 * The career-direction question, asked on the home page rather than buried in
 * a form — because it is the question that changes which roles are worth
 * reading, and almost nobody is asked it.
 *
 * Answers are saved to the Career Passport on this device as they are made.
 * Nothing is sent anywhere.
 */
export function DirectionPicker() {
  const { passport, update, loaded } = usePassport();
  const answered =
    passport.functionIds.length > 0 || passport.bandId || passport.directionIds.length > 0;

  return (
    <div className="mt-16 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
      <div className="flex flex-col gap-10">
        <Reveal>
          <ChipGroup
            legend="01 · What do you do?"
            options={FUNCTIONS}
            selected={passport.functionIds}
            onChange={(functionIds) => update({ functionIds })}
          />
        </Reveal>
        <Reveal delay={0.06}>
          <ChipGroup
            legend="02 · Where are you now?"
            hint="Bands describe what you are trusted to decide, not how long you have been doing it."
            options={EXPERIENCE_BANDS}
            selected={passport.bandId ? [passport.bandId] : []}
            onChange={(ids) => update({ bandId: ids[0] ?? "" })}
            multiple={false}
          />
        </Reveal>
      </div>

      <div className="flex flex-col gap-10">
        <Reveal delay={0.12}>
          <ChipGroup
            legend="03 · Where is this going?"
            hint="Pick as many as are true. “I'm still working it out” is a real answer and we treat it as one."
            options={DIRECTIONS}
            selected={passport.directionIds}
            onChange={(directionIds) => update({ directionIds })}
          />
        </Reveal>

        <Reveal delay={0.2}>
          <div className="rounded-lg border border-current/12 p-6">
            <p className="mono-micro text-fg-40">Where this goes</p>
            <p className="mt-4 text-[0.95rem] leading-[1.6] text-fg-65">
              {answered && loaded
                ? "Saved to your Career Passport on this device. Nothing has been sent anywhere, and no company has been told you are looking."
                : "Nothing is sent anywhere. Your answers are stored on this device until you choose to share them with a specific role."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/candidates/roles"
                className="mono-micro text-signal transition-opacity duration-300 hover:opacity-70"
              >
                See roles that match →
              </Link>
              <Link
                href="/candidates/passport"
                className="mono-micro text-fg-50 transition-colors duration-300 hover:text-fg-80"
              >
                Finish the Passport →
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
