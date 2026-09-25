"use client";

import Link from "next/link";
import { useState } from "react";
import {
  PASSPORT_PARTS,
  partComplete,
  usePassport,
  type PassportExperience,
} from "@/lib/candidate/passport";
import {
  AVAILABILITY,
  COMPANY_STAGES,
  DIRECTIONS,
  EXPERIENCE_BANDS,
  FUNCTIONS,
  LOCATIONS,
  REGIONS,
  VALUES,
  WORK_MODELS,
} from "@/lib/candidate/taxonomy";
import { ChipGroup, ConsentToggle, TagInput, TextArea, TextField } from "./Fields";
import { ResumeUpload } from "./ResumeUpload";
import { Reveal } from "@/components/primitives/Reveal";
import { cx } from "@/lib/utils";

/**
 * The Career Passport.
 *
 * Five sections, answered in any order, saved to this device as they are
 * filled. There is no account, no server copy and no background sync — and the
 * page says so in the places where a person would reasonably assume otherwise.
 */
export function PassportEditor() {
  const { passport, update, clear, loaded } = usePassport();
  const [confirmClear, setConfirmClear] = useState(false);

  const done = loaded ? PASSPORT_PARTS.filter((p) => partComplete(passport, p.id)) : [];

  function addExperience() {
    const entry: PassportExperience = {
      id: `exp-${Date.now()}`,
      title: "",
      organisation: "",
      from: "",
      to: "",
      summary: "",
    };
    update({ experience: [...passport.experience, entry] });
  }

  function patchExperience(id: string, patch: Partial<PassportExperience>) {
    update({
      experience: passport.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  }

  function removeExperience(id: string) {
    update({ experience: passport.experience.filter((e) => e.id !== id) });
  }

  return (
    <>
      {/* --- Progress ----------------------------------------------------- */}
      <div className="sticky top-[4.5rem] z-30 border-y border-current/12 bg-ink-900/85 py-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <ol className="flex flex-wrap gap-x-5 gap-y-2">
            {PASSPORT_PARTS.map((part, i) => {
              const complete = loaded && partComplete(passport, part.id);
              return (
                <li key={part.id}>
                  <a
                    href={`#${part.id}`}
                    className="flex items-baseline gap-2 transition-opacity duration-300 hover:opacity-100"
                  >
                    <span
                      className={cx(
                        "mono-micro tabular-nums",
                        complete ? "text-signal" : "text-fg-30",
                      )}
                    >
                      {complete ? "●" : String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cx("mono-micro", complete ? "text-fg-70" : "text-fg-40")}
                    >
                      {part.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
          <p className="mono-micro text-fg-35 tabular-nums">
            {done.length} of {PASSPORT_PARTS.length} · saved on this device
          </p>
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-24">
        {/* --- 01 About you ---------------------------------------------- */}
        <Part id="about" index="01" title="About you">
          <div className="flex flex-col gap-9">
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField
                label="Your name"
                value={passport.name}
                onChange={(name) => update({ name })}
              />
              <TextField
                label="Email"
                type="email"
                value={passport.email}
                onChange={(email) => update({ email })}
                hint="Only used if you send an application or ask for an alert."
              />
            </div>
            <TextField
              label="One line about what you do"
              value={passport.headline}
              onChange={(headline) => update({ headline })}
              placeholder="Staff data engineer, mostly regulated reporting"
              hint="Write it the way you'd say it out loud, not the way a CV would."
            />
            <ChipGroup
              legend="Where you are now"
              options={LOCATIONS}
              selected={passport.currentLocationId ? [passport.currentLocationId] : []}
              onChange={(ids) => update({ currentLocationId: ids[0] ?? "" })}
              multiple={false}
            />
            <ChipGroup
              legend="What you do"
              hint="Pick more than one if more than one is true."
              options={FUNCTIONS}
              selected={passport.functionIds}
              onChange={(functionIds) => update({ functionIds })}
            />
            <ChipGroup
              legend="Your level"
              hint="Bands describe what you're trusted to decide, not years served."
              options={EXPERIENCE_BANDS}
              selected={passport.bandId ? [passport.bandId] : []}
              onChange={(ids) => update({ bandId: ids[0] ?? "" })}
              multiple={false}
            />
            <TagInput
              label="Skills and tools"
              values={passport.skills}
              onChange={(skills) => update({ skills })}
              placeholder="Python, dbt, Snowflake, Kafka"
              hint="Comma separated. Used to search roles, never to rank you."
            />
          </div>
        </Part>

        {/* --- 02 Experience --------------------------------------------- */}
        <Part
          id="experience"
          index="02"
          title="Experience"
          lede="Either attach a CV or write the two or three roles that matter. You do not need both."
        >
          <div className="flex flex-col gap-11">
            <ResumeUpload />

            <div>
              <p className="mono-micro text-fg-45">Roles</p>
              {passport.experience.length === 0 ? (
                <p className="mt-4 max-w-xl text-[0.92rem] leading-[1.65] text-fg-50">
                  Nothing added yet. This is optional — a CV covers it.
                </p>
              ) : (
                <ul className="mt-6 flex flex-col gap-8">
                  {passport.experience.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-md border border-current/12 p-5 sm:p-6"
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        <TextField
                          label="Title"
                          value={entry.title}
                          onChange={(title) => patchExperience(entry.id, { title })}
                        />
                        <TextField
                          label="Organisation"
                          value={entry.organisation}
                          onChange={(organisation) =>
                            patchExperience(entry.id, { organisation })
                          }
                        />
                        <TextField
                          label="From"
                          value={entry.from}
                          onChange={(from) => patchExperience(entry.id, { from })}
                          placeholder="2021"
                        />
                        <TextField
                          label="To"
                          value={entry.to}
                          onChange={(to) => patchExperience(entry.id, { to })}
                          placeholder="Now"
                        />
                      </div>
                      <div className="mt-5">
                        <TextArea
                          label="What you actually did"
                          value={entry.summary}
                          onChange={(summary) => patchExperience(entry.id, { summary })}
                          rows={3}
                          hint="One honest paragraph beats six bullet points."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExperience(entry.id)}
                        className="mono-micro mt-5 text-fg-40 transition-colors duration-300 hover:text-signal"
                      >
                        Remove this role
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={addExperience}
                className="mono-micro mt-7 inline-flex items-center gap-2 rounded-full border border-current/25 px-5 py-2.5 leading-none transition-colors duration-300 hover:border-current/60 hover:bg-current/[0.06]"
              >
                Add a role <span aria-hidden="true">+</span>
              </button>
            </div>
          </div>
        </Part>

        {/* --- 03 Career direction --------------------------------------- */}
        <Part
          id="direction"
          index="03"
          title="Career direction"
          lede="The part almost nobody asks, and the part that decides whether a role is worth your time."
        >
          <div className="flex flex-col gap-9">
            <ChipGroup
              legend="Where this is going"
              options={DIRECTIONS}
              selected={passport.directionIds}
              onChange={(directionIds) => update({ directionIds })}
            />
            <TextArea
              label="Anything you'd want a hiring manager to understand"
              value={passport.directionNote}
              onChange={(directionNote) => update({ directionNote })}
              rows={4}
              placeholder="I've managed before and I don't want to again — I want the hardest technical problems in the building."
              hint="Optional. Read by a person, not a filter."
            />
            <ChipGroup
              legend="Availability"
              options={AVAILABILITY}
              selected={passport.availabilityId ? [passport.availabilityId] : []}
              onChange={(ids) => update({ availabilityId: ids[0] ?? "" })}
              multiple={false}
            />
          </div>
        </Part>

        {/* --- 04 Work preferences --------------------------------------- */}
        <Part
          id="preferences"
          index="04"
          title="Work preferences"
          lede="Stated once, honoured everywhere. A role that breaks one of these should not reach you."
        >
          <div className="flex flex-col gap-9">
            <ChipGroup
              legend="How you want to work"
              options={WORK_MODELS}
              selected={passport.workModelIds}
              onChange={(workModelIds) => update({ workModelIds })}
            />
            <ChipGroup
              legend="Regions you'd work in"
              hint="Broad first — cities below, if you want to be specific."
              options={REGIONS.map((r) => ({ id: r, label: r }))}
              selected={passport.preferredRegions}
              onChange={(preferredRegions) => update({ preferredRegions })}
            />
            <ChipGroup
              legend="Cities"
              options={LOCATIONS}
              selected={passport.preferredLocationIds}
              onChange={(preferredLocationIds) => update({ preferredLocationIds })}
            />
            <ChipGroup
              legend="Company stage"
              hint="Some people are built for Seed and some are not. Neither is a flaw."
              options={COMPANY_STAGES}
              selected={passport.stageIds}
              onChange={(stageIds) => update({ stageIds })}
            />
            <TextField
              label="Compensation expectation"
              value={passport.compensationExpectation}
              onChange={(compensationExpectation) => update({ compensationExpectation })}
              placeholder="₹50–65L, or £110k base"
              hint="We publish every role's band, so this is only here so we can tell you early when a role can't reach you."
            />
          </div>
        </Part>

        {/* --- 05 What matters ------------------------------------------- */}
        <Part
          id="values"
          index="05"
          title="What matters to you"
          lede="Choose in order of importance — the order is the answer. Pick at least three."
        >
          <div className="flex flex-col gap-9">
            <ChipGroup
              legend="Ranked by what you pick first"
              options={VALUES}
              selected={passport.valueIds}
              onChange={(valueIds) => update({ valueIds })}
              showRank
              max={6}
            />
            <TextArea
              label="The conditions you won't repeat"
              value={passport.valuesNote}
              onChange={(valuesNote) => update({ valuesNote })}
              rows={4}
              placeholder="A place where the roadmap changed every three weeks and nobody would say why."
              hint="This is the most useful thing you can tell us and the least often asked."
            />
          </div>
        </Part>

        {/* --- Alerts ----------------------------------------------------- */}
        <Part
          id="alerts"
          index="06"
          title="Talent alerts"
          lede="Tell us what to watch for and we'll come to you when something real opens."
        >
          <div className="rounded-lg border border-current/12 p-6 sm:p-7">
            <p className="mono-micro text-fg-40">Not yet active</p>
            <p className="mt-5 max-w-2xl text-[0.95rem] leading-[1.65] text-fg-65">
              We are being straight with you: there is no alert delivery running
              behind this site yet. Your preferences above are everything an
              alert would need, and they are stored on your device ready for it —
              but nothing will email you today, and we are not going to pretend
              otherwise by taking a subscription we cannot honour.
            </p>
            <p className="mt-5 max-w-2xl text-[0.9rem] leading-[1.65] text-fg-50">
              In the meantime the roles page is the whole list, and{" "}
              <Link href="/#contact" className="text-signal hover:opacity-70">
                a direct message
              </Link>{" "}
              reaches a person.
            </p>
          </div>
        </Part>

        {/* --- Consent ---------------------------------------------------- */}
        <Part
          id="consent"
          index="07"
          title="Consent"
          lede="Off by default. Nothing here is assumed from the fact that you filled in a form."
        >
          <div className="rounded-lg border border-current/12 p-6 sm:p-7">
            <ConsentToggle
              label="You may show my Passport to a client when I apply to their role"
              body="Applies to the role you choose, at the moment you send it, and to nothing else. Each application asks again."
              checked={passport.consent.shareWithClients}
              onChange={(shareWithClients) =>
                update({
                  consent: {
                    ...passport.consent,
                    shareWithClients,
                    recordedAt: new Date().toISOString(),
                  },
                })
              }
            />
            <ConsentToggle
              label="Contact me when a role matches what I've described"
              body="Recorded now and honoured when alert delivery exists. Until then it does nothing, which is why it is worth saying rather than hiding."
              checked={passport.consent.talentAlerts}
              onChange={(talentAlerts) =>
                update({
                  consent: {
                    ...passport.consent,
                    talentAlerts,
                    recordedAt: new Date().toISOString(),
                  },
                })
              }
            />
            {passport.consent.recordedAt && (
              <p className="mono-micro mt-6 text-fg-35">
                Recorded {new Date(passport.consent.recordedAt).toLocaleString()}
              </p>
            )}
          </div>
        </Part>

        {/* --- Your data -------------------------------------------------- */}
        <Part id="data" index="08" title="Your data">
          <div className="rounded-lg border border-current/12 p-6 sm:p-7">
            <p className="max-w-2xl text-[0.95rem] leading-[1.65] text-fg-65">
              Your Career Passport lives in this browser and nowhere else. It is
              not on our servers, it is not on your other devices, and clearing
              your browser data clears it. That is a real limitation, not a
              privacy feature we are dressing up — but it does mean nothing
              about you exists anywhere until you choose to send it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {confirmClear ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      clear();
                      setConfirmClear(false);
                    }}
                    className="mono-micro rounded-full border border-signal/45 bg-signal/10 px-5 py-2.5 leading-none text-signal transition-colors duration-300 hover:bg-signal/20"
                  >
                    Yes, erase everything
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="mono-micro text-fg-45 transition-colors duration-300 hover:text-fg-80"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="mono-micro rounded-full border border-current/25 px-5 py-2.5 leading-none transition-colors duration-300 hover:border-current/60 hover:bg-current/[0.06]"
                >
                  Erase my Passport
                </button>
              )}
              {passport.updatedAt && (
                <p className="mono-micro text-fg-35">
                  Last saved {new Date(passport.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </Part>
      </div>
    </>
  );
}

function Part({
  id,
  index,
  title,
  lede,
  children,
}: {
  id: string;
  index: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-40">
      <Reveal className="mb-6 flex items-baseline gap-4 md:mb-8">
        <span className="mono-micro text-signal tabular-nums">{index}</span>
        <span className="h-px w-8 bg-current/25" aria-hidden="true" />
      </Reveal>
      <Reveal delay={0.05} className="mb-9">
        <h2 id={`${id}-heading`} className="display text-(length:--text-h2)">
          {title}
        </h2>
      </Reveal>
      {lede && (
        <Reveal delay={0.05}>
          <p className="mb-12 max-w-2xl text-(length:--text-lede) leading-[1.45] text-fg-60">
            {lede}
          </p>
        </Reveal>
      )}
      {children}
    </section>
  );
}
