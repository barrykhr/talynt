import type { Metadata } from "next";
import Link from "next/link";
import { ROLES } from "@/lib/candidate/roles";
import { WORK_MODELS } from "@/lib/candidate/taxonomy";
import { definitionFor } from "@/lib/assessment/bank";
import { CANDIDATE_HERO, CANDIDATE_PAGE, CAREER_ARC, DIRECTION, EVALUATE, FOR_TALENT } from "@/lib/contour/content";
import { ASSESSMENTS_FOR_CANDIDATES, CANDIDATE_HERO_PROPOSED, FIND, JOURNEY, ONE_PROFILE, PROFILE_CTA, UNDERSTAND } from "@/lib/contour/proposed";
import { filterOptions } from "@/lib/contour/roles";
import { ROUTES } from "@/lib/contour/site";
import { ButtonLink, Eyebrow, Headline, SectionHead } from "@/components/contour/ui";
import { CareerPathways } from "@/components/contour/graphics/CareerPathways";
import { ProfileToRoles } from "@/components/contour/graphics/ProfileToRoles";
import { OneProfileDiagram } from "@/components/contour/candidate/OneProfile";
import { RoleRow } from "@/components/contour/candidate/RoleRow";
import { QuickQuestions } from "@/components/contour/candidate/QuickQuestions";
import { FaqList } from "@/components/contour/FaqList";
import { Reveal } from "@/components/primitives/Reveal";

export const metadata: Metadata = {
  title: "For candidates",
  description:
    "Create your TALYNT profile once, explore open roles written with the reasoning behind them, and complete a short assessment built for each role you apply to.",
};

/**
 * The candidate homepage. Profile once; explore; a focused assessment per
 * role. Approved candidate copy is used as written (content.ts); new copy is
 * from proposed.ts. Roles, filters and assessment material are the real data.
 */
export default function CandidatesPage() {
  const latest = [...ROLES].sort((a, b) => (a.posted < b.posted ? 1 : -1)).slice(0, 3);
  const options = filterOptions();
  const sample = definitionFor("staff-data-engineer-fintech")!;
  const sampleQuestion = sample.questions.find((q) => q.id === "de.correctness.fn")!;
  const sampleCompetency = sample.competencies.find((c) => c.id === "correctness")!;

  return (
    <>
      {/* --- Hero ------------------------------------------------------------ */}
      <section aria-labelledby="candidates-heading" className="relative overflow-hidden">
        <div className="ct-wrap grid gap-12 pt-10 pb-14 md:pt-16 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-6">
            <Eyebrow tone="violet">{CANDIDATE_HERO.eyebrow}</Eyebrow>
            <Headline as="h1" id="candidates-heading" lead={CANDIDATE_HERO_PROPOSED.title} turn={CANDIDATE_HERO_PROPOSED.titleItalic} size="l" className="mt-7" />
            <p className="ct-lede mt-7 max-w-xl">{CANDIDATE_HERO_PROPOSED.lede}</p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <ButtonLink href={ROUTES.opportunities}>{CANDIDATE_HERO_PROPOSED.primary}</ButtonLink>
              <ButtonLink href={ROUTES.profile} variant="secondary" arrow="none">
                {CANDIDATE_HERO_PROPOSED.secondary}
              </ButtonLink>
            </div>
          </div>
          <div className="lg:col-span-6">
            <ProfileToRoles />
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

      {/* --- The approved position, and the three questions ------------------- */}
      <section aria-labelledby="position-heading" className="ct-section ct-tint">
        <div className="ct-wrap grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <Headline id="position-heading" lead={CANDIDATE_HERO.title} turn={CANDIDATE_HERO.titleItalic} size="l" />
            <p className="ct-lede mt-6 max-w-xl">{CANDIDATE_HERO.lede}</p>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <div className="ct-panel p-6 sm:p-8">
              <p className="ct-meta ct-violet">{CANDIDATE_HERO.questionsLabel}</p>
              <ol className="mt-5 flex flex-col">
                {CANDIDATE_HERO.questions.map((item, i) => (
                  <li key={item.q} className="grid grid-cols-[2rem_1fr] gap-2 border-t py-4 first:border-t-0 first:pt-0">
                    <span className="ct-meta ct-violet tabular-nums pt-1">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="ct-display text-[1.2rem] leading-snug">{item.q}</p>
                      <p className="ct-small mt-1">{item.a}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
        <div className="ct-wrap mt-16 grid gap-10 border-t pt-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <Eyebrow tone="violet">{FOR_TALENT.eyebrow}</Eyebrow>
            <Headline lead={FOR_TALENT.title} turn={FOR_TALENT.titleItalic} size="m" className="mt-6" />
            <p className="ct-body mt-4 max-w-lg">{FOR_TALENT.lede}</p>
            <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="What we ask about">
              {FOR_TALENT.dimensions.map((d) => (
                <li key={d} className="ct-tag">
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="ct-meta ct-violet">{FOR_TALENT.expectLabel}</p>
            <ul className="mt-4 flex flex-col">
              {FOR_TALENT.commitments.map((c) => (
                <li key={c.title} className="border-t py-3.5">
                  <p className="text-[1rem] font-medium">{c.title}</p>
                  <p className="ct-small mt-0.5">{c.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --- 01 One profile, many applications ------------------------------- */}
      <section id="profile-once" aria-labelledby="one-profile-heading" className="ct-section">
        <div className="ct-wrap">
          <SectionHead index="01" tone="violet" eyebrow={ONE_PROFILE.eyebrow} id="one-profile-heading" lead={ONE_PROFILE.title} turn={ONE_PROFILE.titleItalic} lede={ONE_PROFILE.lede} />
          <div className="mt-14">
            <OneProfileDiagram />
          </div>
        </div>
      </section>

      {/* --- 02 Find opportunities ------------------------------------------- */}
      <section id="find" aria-labelledby="find-heading" className="ct-section ct-tint">
        <div className="ct-wrap">
          <SectionHead index="02" tone="violet" eyebrow={FIND.eyebrow} id="find-heading" lead={FIND.title} turn={FIND.titleItalic} lede={FIND.lede} />
          <form action={ROUTES.opportunities} method="get" role="search" aria-label="Search roles" className="mt-10 grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem_auto]">
            <label className="sr-only" htmlFor="find-q">
              {FIND.search}
            </label>
            <input id="find-q" name="q" type="search" placeholder={FIND.placeholder} className="ct-input" />
            <label className="sr-only" htmlFor="find-wm">
              Work model
            </label>
            <select id="find-wm" name="wm" className="ct-input" defaultValue="">
              <option value="">Any work model</option>
              {WORK_MODELS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
            <button type="submit" className="ct-btn ct-btn-primary">
              {FIND.search}
            </button>
          </form>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Browse by function">
            {options.fn
              .filter((o) => o.count > 0)
              .map((o) => (
                <li key={o.id}>
                  <Link href={`${ROUTES.opportunities}?fn=${o.id}`} className="ct-tag transition-colors ct-hb-ink">
                    {o.label} <span className="ct-mute tabular-nums">· {o.count}</span>
                  </Link>
                </li>
              ))}
          </ul>
          <p className="ct-small mt-4">{FIND.employmentNote}</p>

          <div className="mt-14 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="ct-meta ct-violet">{CANDIDATE_PAGE.rolesEyebrow}</p>
              <h3 className="ct-display ct-m mt-3">
                {CANDIDATE_PAGE.rolesTitle} <span className="ct-italic">{CANDIDATE_PAGE.rolesTitleItalic}</span>
              </h3>
              <p className="ct-body mt-3">{CANDIDATE_PAGE.rolesLede}</p>
            </div>
            <ButtonLink href={ROUTES.opportunities} variant="secondary">
              All {ROLES.length} open roles
            </ButtonLink>
          </div>
          <div className="mt-8 border-b">
            {latest.map((role) => (
              <RoleRow key={role.slug} role={role} />
            ))}
          </div>
        </div>
      </section>

      {/* --- 03 Understand the role ------------------------------------------ */}
      <section id="understand" aria-labelledby="understand-heading" className="ct-section">
        <div className="ct-wrap grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <SectionHead index="03" tone="violet" eyebrow={UNDERSTAND.eyebrow} id="understand-heading" lead={UNDERSTAND.title} turn={UNDERSTAND.titleItalic} lede={UNDERSTAND.lede} />
            <ul className="mt-10 grid gap-px overflow-hidden rounded-[var(--ct-r-l)] border bg-[var(--ct-line)] sm:grid-cols-2">
              {UNDERSTAND.anatomy.map((a) => (
                <li key={a.label} className="bg-[var(--ct-surface)] p-5">
                  <p className="text-[0.98rem] font-medium">{a.label}</p>
                  <p className="ct-small mt-1">{a.body}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <Eyebrow tone="violet">{CANDIDATE_PAGE.unlikeEyebrow}</Eyebrow>
            <Headline lead={CANDIDATE_PAGE.unlikeTitle} turn={CANDIDATE_PAGE.unlikeTitleItalic} size="m" className="mt-6" />
            <ul className="mt-8 flex flex-col">
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
        </div>
      </section>

      {/* --- 04 Where a role could take you (approved career arc) ------------ */}
      <section id="pathways" aria-labelledby="pathways-heading" className="ct-section ct-tint scroll-mt-[var(--ct-nav-h)]">
        <div className="ct-wrap">
          <SectionHead index="04" tone="violet" eyebrow={CAREER_ARC.eyebrow} id="pathways-heading" lead={CAREER_ARC.title} turn={CAREER_ARC.titleItalic} lede={CAREER_ARC.lede} />
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
          <div className="mt-16 border-t pt-12">
            <Eyebrow tone="violet">{DIRECTION.eyebrow}</Eyebrow>
            <Headline lead={DIRECTION.title} turn={DIRECTION.titleItalic} size="m" className="mt-6" />
            <p className="ct-lede mt-5 max-w-2xl">{DIRECTION.lede}</p>
            <p className="ct-small mt-4">
              {DIRECTION.q3} —{" "}
              <a href="#pathways" className="ct-link">
                answered in the pathways above
              </a>
              .
            </p>
            <div className="mt-10">
              <QuickQuestions />
            </div>
          </div>
        </div>
      </section>

      {/* --- 05 Role-specific assessments ------------------------------------ */}
      <section id="assessments" aria-labelledby="assessments-heading" className="ct-section">
        <div className="ct-wrap grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <SectionHead index="05" tone="violet" eyebrow={ASSESSMENTS_FOR_CANDIDATES.eyebrow} id="assessments-heading" lead={ASSESSMENTS_FOR_CANDIDATES.title} turn={ASSESSMENTS_FOR_CANDIDATES.titleItalic} lede={ASSESSMENTS_FOR_CANDIDATES.lede} />
            <ul className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {ASSESSMENTS_FOR_CANDIDATES.points.map((p) => (
                <li key={p.title} className="border-t pt-4">
                  <p className="text-[1rem] font-medium">{p.title}</p>
                  <p className="ct-small mt-1">{p.body}</p>
                </li>
              ))}
            </ul>
            <p className="ct-body mt-10 border-l-2 pl-4" style={{ ["--ct-bc" as string]: "var(--ct-violet)" }}>
              <span className="ct-display ct-s block">
                {EVALUATE.title} <span className="ct-italic">{EVALUATE.titleItalic}</span>
              </span>
              <span className="mt-2 block">{EVALUATE.modelLine}</span>
              <Link href={ROUTES.howWeEvaluate} className="ct-link mt-3 inline-block">
                {CANDIDATE_PAGE.evaluateLink.replace(" →", "")}
              </Link>
            </p>
          </div>
          <Reveal className="lg:col-span-5 lg:col-start-8">
            <figure className="ct-window">
              <div className="ct-window-bar">
                <span className="ct-meta ct-mute">{ASSESSMENTS_FOR_CANDIDATES.sampleLabel}</span>
                <span className="ct-meta ct-violet">Staff Data Engineer</span>
              </div>
              <div className="p-5 sm:p-6">
                <p className="ct-meta ct-mute">
                  Question 2 of 3 · <span className="ct-green">{sampleCompetency.label}</span>
                </p>
                <p className="ct-display mt-3 text-[1.3rem] leading-snug">{sampleQuestion.prompt}</p>
                <div className="mt-5 rounded-[var(--ct-r-s)] border p-4">
                  <p className="ct-meta ct-mute">A useful answer covers</p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {sampleQuestion.guidance.map((g) => (
                      <li key={g} className="flex gap-2.5 text-[0.92rem] leading-snug">
                        <span aria-hidden="true" className="mt-[0.5rem] h-[0.35rem] w-[0.35rem] shrink-0 rounded-full bg-[var(--ct-green)]" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
                <div aria-hidden="true" className="mt-4 h-24 rounded-[var(--ct-r-s)] border bg-[var(--ct-surface)]" />
                <p className="ct-meta ct-mute mt-2">
                  Around {sampleQuestion.response.suggestedWords[0]}–{sampleQuestion.response.suggestedWords[1]} words · no time limit
                </p>
              </div>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* --- 06 How applying works ------------------------------------------- */}
      <section id="journey" aria-labelledby="journey-heading" className="ct-section ct-tint">
        <div className="ct-wrap grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <SectionHead index="06" tone="violet" eyebrow={JOURNEY.eyebrow} id="journey-heading" lead={JOURNEY.title} turn={JOURNEY.titleItalic} size="m" />
            <ol className="mt-10 flex flex-col">
              {JOURNEY.steps.map((s, i) => (
                <Reveal as="li" key={s.title} delay={i * 0.04} className="grid grid-cols-[2.5rem_1fr] gap-2 border-t py-4">
                  <span className="ct-meta ct-violet tabular-nums pt-1">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="text-[1.02rem] font-medium">{s.title}</p>
                    <p className="ct-small mt-0.5">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <Eyebrow tone="violet">{CANDIDATE_PAGE.commitmentsEyebrow}</Eyebrow>
            <Headline lead={CANDIDATE_PAGE.commitmentsTitle} turn={CANDIDATE_PAGE.commitmentsTitleItalic} size="m" className="mt-6" />
            <ol className="mt-8 flex flex-col">
              {CANDIDATE_PAGE.commitments.map((c, i) => (
                <li key={c.title} className="grid grid-cols-[2.5rem_1fr] gap-2 border-t py-5">
                  <span className="ct-meta ct-violet tabular-nums pt-1">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="ct-display text-[1.25rem] leading-snug">{c.title}</p>
                    <p className="ct-small mt-1.5">{c.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* --- 07 Your profile ------------------------------------------------- */}
      <section id="create-profile" aria-labelledby="profile-cta-heading" className="ct-section">
        <div className="ct-wrap grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-7">
            <Eyebrow index="07" tone="violet">
              {PROFILE_CTA.eyebrow}
            </Eyebrow>
            <Headline id="profile-cta-heading" lead={PROFILE_CTA.title} turn={PROFILE_CTA.titleItalic} className="mt-6" />
            <p className="ct-lede mt-6 max-w-xl">{PROFILE_CTA.lede}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:col-span-4 lg:col-start-9 lg:justify-end">
            <ButtonLink href={ROUTES.profile}>{PROFILE_CTA.cta}</ButtonLink>
            <ButtonLink href={ROUTES.applications} variant="quiet" arrow="none">
              Your applications
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* --- FAQ ------------------------------------------------------------- */}
      <section id="faq" aria-labelledby="faq-heading" className="ct-section ct-tint">
        <div className="ct-wrap grid gap-10 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <Eyebrow tone="violet">Questions</Eyebrow>
            <h2 id="faq-heading" className="ct-display ct-l mt-6">
              For candidates
            </h2>
            <Link href={ROUTES.faq} className="ct-link mt-6 inline-block text-[0.95rem]">
              All questions
            </Link>
          </div>
          <div className="lg:col-span-8">
            <FaqList categories={["candidates"]} />
          </div>
        </div>
      </section>

      {/* --- Close (approved) ------------------------------------------------- */}
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
