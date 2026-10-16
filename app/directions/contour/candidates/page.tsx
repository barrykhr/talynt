import type { Metadata } from "next";
import Link from "next/link";
import { ROLES } from "@/lib/candidate/roles";
import {
  ABOUT,
  CANDIDATE_HERO,
  CANDIDATE_PAGE,
  CAREER_ARC,
  DIRECTION,
  EVALUATE,
  FOR_TALENT,
} from "@/lib/contour/content";
import { ROUTES } from "@/lib/contour/site";
import { ButtonLink, Eyebrow, Headline, SectionHead } from "@/components/contour/ui";
import { CareerPathways } from "@/components/contour/graphics/CareerPathways";
import { RoleRow } from "@/components/contour/candidate/RoleRow";
import { QuickQuestions } from "@/components/contour/candidate/QuickQuestions";
import { Reveal } from "@/components/primitives/Reveal";

export const metadata: Metadata = {
  title: "For candidates",
  description:
    "Roles written with the reasoning behind them, compensation stated up front, and a Career Passport that asks where you are going — not only where you have been.",
};

/**
 * The candidate side, given the same care as the client side: the approved
 * candidate argument, the career pathways drawing wired to real roles, the
 * newest roles, the commitments, and how evaluation works — no score.
 */
export default function CandidatesPage() {
  const latest = [...ROLES].sort((a, b) => (a.posted < b.posted ? 1 : -1)).slice(0, 3);

  return (
    <>
      {/* --- Hero ------------------------------------------------------------ */}
      <section aria-labelledby="candidates-heading" className="relative overflow-hidden">
        <div className="ct-wrap grid gap-12 pt-12 pb-16 md:pt-20 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Eyebrow tone="violet">{CANDIDATE_HERO.eyebrow}</Eyebrow>
            <Headline as="h1" id="candidates-heading" lead={CANDIDATE_HERO.title} turn={CANDIDATE_HERO.titleItalic} size="xl" className="mt-7" />
            <p className="ct-lede mt-7 max-w-xl">{CANDIDATE_HERO.lede}</p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <ButtonLink href={ROUTES.opportunities}>{CANDIDATE_HERO.primary}</ButtonLink>
              <ButtonLink href={ROUTES.profile} variant="secondary" arrow="none">
                {CANDIDATE_HERO.secondary}
              </ButtonLink>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="ct-panel p-6 sm:p-8">
              <p className="ct-meta ct-violet">{CANDIDATE_HERO.questionsLabel}</p>
              <ol className="mt-5 flex flex-col">
                {CANDIDATE_HERO.questions.map((item, i) => (
                  <li key={item.q} className="grid grid-cols-[2rem_1fr] gap-2 border-t py-4 first:border-t-0 first:pt-0">
                    <span className="ct-meta ct-violet tabular-nums pt-1">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="ct-display text-[1.25rem] leading-snug">{item.q}</p>
                      <p className="ct-small mt-1">{item.a}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
        <div className="ct-wrap pb-6">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-5 md:grid-cols-4">
            {CANDIDATE_HERO.pillars.map((p, i) => (
              <li key={p} className="flex items-baseline gap-3">
                <span className="ct-meta ct-violet tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[0.92rem] text-[var(--ct-ink-2)]">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- A career in three parts, and where it could go ------------------ */}
      <section id="pathways" aria-labelledby="pathways-heading" className="ct-section ct-tint scroll-mt-[var(--ct-nav-h)]">
        <div className="ct-wrap">
          <SectionHead index="01" tone="violet" eyebrow={CAREER_ARC.eyebrow} id="pathways-heading" lead={CAREER_ARC.title} turn={CAREER_ARC.titleItalic} lede={CAREER_ARC.lede} />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-[var(--ct-r-l)] border bg-[var(--ct-line)] md:grid-cols-3">
            {CAREER_ARC.stages.map((stage) => {
              const present = stage.key === "present";
              return (
                <li key={stage.key} className={present ? "bg-[var(--ct-surface)] p-6" : "bg-[var(--ct-bg)] p-6"}>
                  <p className="ct-meta flex items-center gap-2">
                    {present && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--ct-signal)]" />}
                    <span className={present ? "text-[var(--ct-ink)]" : "ct-mute"}>{stage.label}</span>
                  </p>
                  <p className="ct-display ct-s mt-3">{stage.title}</p>
                  <p className="ct-small mt-2">{stage.body}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {stage.facets.map((f) => (
                      <li key={f} className="ct-tag">
                        {f}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
          <div className="mt-6">
            <CareerPathways />
          </div>
        </div>
      </section>

      {/* --- The other two questions ---------------------------------------- */}
      <section id="direction" aria-labelledby="direction-heading" className="ct-section">
        <div className="ct-wrap">
          <SectionHead index="02" tone="violet" eyebrow={DIRECTION.eyebrow} id="direction-heading" lead={DIRECTION.title} turn={DIRECTION.titleItalic} lede={DIRECTION.lede} />
          <p className="ct-small mt-4">
            {DIRECTION.q3} —{" "}
            <Link href="#pathways" className="ct-link">
              answered in the pathways above
            </Link>
            .
          </p>
          <div className="mt-12">
            <QuickQuestions />
          </div>
        </div>
      </section>

      {/* --- Open roles ------------------------------------------------------ */}
      <section id="roles" aria-labelledby="roles-heading" className="ct-section ct-tint">
        <div className="ct-wrap">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead index="03" tone="violet" eyebrow={CANDIDATE_PAGE.rolesEyebrow} id="roles-heading" lead={CANDIDATE_PAGE.rolesTitle} turn={CANDIDATE_PAGE.rolesTitleItalic} lede={CANDIDATE_PAGE.rolesLede} />
            <ButtonLink href={ROUTES.opportunities} variant="secondary">
              All {ROLES.length} open roles
            </ButtonLink>
          </div>
          <div className="mt-12 border-b">
            {latest.map((role) => (
              <RoleRow key={role.slug} role={role} />
            ))}
          </div>
        </div>
      </section>

      {/* --- What this is, and what to expect -------------------------------- */}
      <section id="expect" aria-labelledby="expect-heading" className="ct-section">
        <div className="ct-wrap grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Eyebrow index="04" tone="violet">
              {CANDIDATE_PAGE.unlikeEyebrow}
            </Eyebrow>
            <Headline lead={CANDIDATE_PAGE.unlikeTitle} turn={CANDIDATE_PAGE.unlikeTitleItalic} className="mt-6" />
            <ul className="mt-10 flex flex-col">
              {CANDIDATE_PAGE.unlike.map((item) => (
                <li key={item.label} className="grid gap-1 border-t py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
                  <span className={item.active ? "ct-meta ct-violet" : "ct-meta ct-mute"}>{item.label}</span>
                  <span className={item.active ? "text-[1rem]" : "ct-small"}>{item.body}</span>
                </li>
              ))}
            </ul>
            <p className="ct-display ct-s mt-8">
              {FOR_TALENT.close} <span className="ct-italic">{FOR_TALENT.closeItalic}</span>
            </p>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <Eyebrow tone="violet">{CANDIDATE_PAGE.commitmentsEyebrow}</Eyebrow>
            <h2 id="expect-heading" className="ct-display ct-m mt-6">
              {CANDIDATE_PAGE.commitmentsTitle} <span className="ct-italic">{CANDIDATE_PAGE.commitmentsTitleItalic}</span>
            </h2>
            <ol className="mt-8 flex flex-col">
              {CANDIDATE_PAGE.commitments.map((c, i) => (
                <Reveal as="li" key={c.title} delay={i * 0.06} className="grid grid-cols-[2.5rem_1fr] gap-2 border-t py-5">
                  <span className="ct-meta ct-violet tabular-nums pt-1">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="ct-display text-[1.3rem] leading-snug">{c.title}</p>
                    <p className="ct-small mt-1.5">{c.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* --- How we evaluate, briefly ---------------------------------------- */}
      <section id="evaluate" aria-labelledby="evaluate-heading" className="ct-section ct-tint">
        <div className="ct-wrap grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <SectionHead index="05" tone="violet" eyebrow="How we evaluate" id="evaluate-heading" lead={EVALUATE.title} turn={EVALUATE.titleItalic} size="m" />
            <p className="ct-body mt-6">{EVALUATE.lede}</p>
            <p className="ct-display ct-s mt-8">
              {EVALUATE.reservation} <span className="ct-italic">{EVALUATE.reservationItalic}</span> {EVALUATE.reservationTail}
            </p>
            <Link href={ROUTES.howWeEvaluate} className="ct-btn ct-btn-secondary mt-8">
              {CANDIDATE_PAGE.evaluateLink.replace(" →", "")} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="flex flex-col gap-10 lg:col-span-6 lg:col-start-7">
            <div>
              <p className="ct-meta ct-mute">
                {EVALUATE.signalsEyebrow} · {EVALUATE.signalsTitle} {EVALUATE.signalsTitleItalic}
              </p>
              <ul className="mt-4">
                {EVALUATE.signals.map((s) => (
                  <li key={s.name} className="grid gap-1 border-t py-3 sm:grid-cols-[13rem_1fr] sm:gap-4">
                    <span className="text-[0.98rem] font-medium">{s.name}</span>
                    <span className="ct-small">{s.what}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="ct-meta ct-mute">{EVALUATE.notLookedEyebrow}</p>
              <ul className="mt-4">
                {EVALUATE.notLookedAt.map((line) => (
                  <li key={line} className="border-t py-3 text-[0.98rem] text-[var(--ct-ink-2)] line-through decoration-[var(--ct-faint)] decoration-1">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <p className="ct-body border-l-2 pl-4" style={{ ["--ct-bc" as string]: "var(--ct-violet)" }}>
              {ABOUT.beliefs[3].title} {ABOUT.beliefs[3].body}
            </p>
          </div>
        </div>
      </section>

      {/* --- Close ----------------------------------------------------------- */}
      <section aria-labelledby="close-heading" className="ct-section">
        <div className="ct-wrap-narrow text-center">
          <h2 id="close-heading" className="ct-display ct-l">
            {CANDIDATE_PAGE.closeTitle} <span className="ct-italic block">{CANDIDATE_PAGE.closeTitleItalic}</span>
          </h2>
          <p className="ct-lede mx-auto mt-6 max-w-xl">{CANDIDATE_PAGE.closeLede}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={ROUTES.profile}>{CANDIDATE_PAGE.closePrimary}</ButtonLink>
            <ButtonLink href={ROUTES.opportunities} variant="secondary">
              {CANDIDATE_PAGE.closeSecondary}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
