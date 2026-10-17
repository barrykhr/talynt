import Link from "next/link";
import type { ReactNode } from "react";
import { HOW_WE_WORK, PHILOSOPHY } from "@/lib/contour/content";
import { COMPACT, CONTINUES, DECISION, EVALUATION, SHORTLIST } from "@/lib/contour/proposed";
import { ROUTES } from "@/lib/contour/site";
import type { Role } from "@/lib/candidate/roles";
import type { Passport } from "@/lib/candidate/passport-shape";
import type { Assessment, Evaluation, Response } from "@/lib/assessment/types";
import { RatingBadge } from "@/components/contour/assessment/Review";
import { SignalInNoise } from "@/components/contour/home/Problem";
import { Eyebrow, Headline, SectionHead } from "@/components/contour/ui";
import { Reveal } from "@/components/primitives/Reveal";
import { cx } from "@/lib/utils";

/**
 * The employer homepage's sections 02–07, told with drawings and short labels
 * so the page reads in a few screens. Approved wording is used where it is
 * already short (titles, headlines); the longer approved text these sections
 * condense is on /employers/approach, which each section links to.
 */

/* --- Icons: one stroke, one size, drawn for this page ----------------------- */

const ICON_PATHS: Record<string, ReactNode> = {
  understand: (
    <>
      <circle cx="10.5" cy="10.5" r="5.5" />
      <path d="M14.6 14.6 20 20" />
    </>
  ),
  define: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    </>
  ),
  discover: (
    <>
      <circle cx="12" cy="12" r="8" strokeDasharray="2 2.6" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.6" cy="7.4" r="1.6" fill="var(--ct-signal)" stroke="none" />
    </>
  ),
  evaluate: (
    <>
      <circle cx="9.5" cy="12" r="5.5" />
      <circle cx="14.5" cy="12" r="5.5" />
    </>
  ),
  calibrate: (
    <>
      <path d="M4 8h16M4 16h16" />
      <circle cx="9" cy="8" r="2" fill="var(--ct-surface)" />
      <circle cx="15" cy="16" r="2" fill="var(--ct-surface)" />
    </>
  ),
  decide: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </>
  ),
  context: (
    <>
      <circle cx="12" cy="12" r="2" fill="var(--ct-signal)" stroke="none" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="8.5" strokeDasharray="2 2.6" />
    </>
  ),
  requirement: (
    <>
      <rect x="6" y="3.5" width="12" height="17" rx="2.5" />
      <path d="M9 8.5h6M9 12h6M9 15.5h3.5" />
    </>
  ),
  competency: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  question: (
    <>
      <path d="M5 6.5a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V16h0a2 2 0 0 1-2-2Z" />
      <path d="M10.2 8.4a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1" />
      <circle cx="12" cy="13.4" r=".6" fill="currentColor" stroke="none" />
    </>
  ),
  answer: (
    <>
      <path d="M4 20h4L19.2 8.8a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  evidence: (
    <>
      <path d="M4 7h16M4 11.5h9M4 16h12" />
      <path d="M3.5 11.5h10" stroke="var(--ct-lime)" strokeWidth="4" opacity=".9" />
      <path d="M4 11.5h9" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6l-7-2.5Z" />
      <path d="m9 12 2.2 2.2L15.2 10" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l2.8 1.8M5 19 19 5" />
    </>
  ),
  version: (
    <>
      <path d="M4 12.6V5.5A1.5 1.5 0 0 1 5.5 4h7.1L20 11.4 11.4 20 4 12.6Z" />
      <circle cx="8.5" cy="8.5" r="1.4" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" />
    </>
  ),
};

export function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx("h-5 w-5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

function IconBadge({ name, tone = "green" }: { name: string; tone?: "green" | "violet" }) {
  return (
    <span
      className={cx(
        "relative z-[1] flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-[var(--ct-surface)]",
        tone === "violet" ? "ct-violet" : "ct-green",
      )}
      style={{ ["--ct-bc" as string]: tone === "violet" ? "var(--ct-violet)" : "var(--ct-green)" }}
    >
      <Icon name={name} />
    </span>
  );
}

/**
 * Steps along a line: across the page on a wide screen, down the left edge on
 * a phone. The line between two icons is the only connector.
 */
function IconSteps({
  steps,
  columns,
  label,
}: {
  steps: Array<{ icon: string; title: string; note: string; meta?: string }>;
  columns: 5 | 6;
  label: string;
}) {
  return (
    <ol aria-label={label} className={cx("grid lg:gap-x-4", columns === 6 ? "lg:grid-cols-6" : "lg:grid-cols-5")}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <Reveal as="li" key={s.title} delay={i * 0.05} className="relative grid grid-cols-[3rem_1fr] gap-x-4 pb-6 last:pb-0 lg:block lg:pb-0">
            {!last && <span aria-hidden="true" className="absolute top-12 bottom-0 left-6 w-px bg-[var(--ct-line-2)] lg:hidden" />}
            {!last && <span aria-hidden="true" className="absolute top-6 left-12 -right-4 hidden h-px bg-[var(--ct-line-2)] lg:block" />}
            <IconBadge name={s.icon} />
            <div className="pt-1 lg:pt-5">
              <p className="flex items-baseline gap-2">
                <span className="ct-meta ct-green tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="ct-display text-[1.3rem] leading-tight">{s.title}</span>
              </p>
              <p className="mt-1 text-[0.92rem] leading-snug text-[var(--ct-ink-2)]">{s.note}</p>
              {s.meta && <p className="ct-meta ct-mute mt-2 text-[0.64rem]">{s.meta}</p>}
            </div>
          </Reveal>
        );
      })}
    </ol>
  );
}

function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="ct-link inline-flex items-center gap-1.5 text-[0.95rem]">
      {children} <span aria-hidden="true">→</span>
    </Link>
  );
}

/* --- 02 Less noise. More signal. ------------------------------------------- */

export function CompactPhilosophy({ index }: { index: string }) {
  return (
    <section id="philosophy" aria-labelledby="philosophy-heading" className="ct-section-tight ct-tint">
      <div className="ct-wrap grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="flex items-end justify-between gap-6 lg:col-span-5 lg:block">
          <div>
            <Eyebrow index={index}>{PHILOSOPHY.eyebrow}</Eyebrow>
            <Headline id="philosophy-heading" lead={PHILOSOPHY.title} turn={PHILOSOPHY.titleItalic} className="mt-6" />
          </div>
          <figure className="w-24 shrink-0 sm:w-32 lg:mt-8 lg:w-44">
            <SignalInNoise />
            <figcaption className="ct-meta ct-mute mt-2 hidden text-[0.62rem] lg:block">{PHILOSOPHY.caption}</figcaption>
          </figure>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-[var(--ct-r-l)] border bg-[var(--ct-line)] sm:grid-cols-3 lg:col-span-7">
          {PHILOSOPHY.principles.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.06} className="flex items-center gap-4 bg-[var(--ct-surface)] p-5 sm:flex-col sm:items-start sm:p-6">
              <IconBadge name={COMPACT.philosophy[i].icon} />
              <div>
                <h3 className="ct-display text-[1.25rem] leading-tight">{p.title}</h3>
                <p className="ct-small mt-1">{COMPACT.philosophy[i].note}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* --- 03 One search. Six layers. ------------------------------------------- */

export function CompactHowWeWork({ index }: { index: string }) {
  const steps = HOW_WE_WORK.layers.map((l, i) => ({
    icon: COMPACT.layers[i].icon,
    title: l.title,
    note: COMPACT.layers[i].note,
    meta: COMPACT.layers[i].who,
  }));
  return (
    <section id="how-we-work" aria-labelledby="how-heading" className="ct-section-tight scroll-mt-[var(--ct-nav-h)]">
      <div className="ct-wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead index={index} eyebrow={HOW_WE_WORK.eyebrow} id="how-heading" lead={HOW_WE_WORK.title} turn={HOW_WE_WORK.titleItalic} size="m" />
          <MoreLink href={`${ROUTES.approach}#how-we-work`}>{COMPACT.more}</MoreLink>
        </div>
        <div className="mt-10 lg:mt-12">
          <IconSteps steps={steps} columns={6} label={HOW_WE_WORK.titleItalic} />
        </div>
      </div>
    </section>
  );
}

/* --- 04 While you run the business ---------------------------------------- */

/** A small arc: the sun high, the night's search, and the sun rising again. */
function Sun({ phase }: { phase: number }) {
  const positions = [
    { cx: 40, cy: 14 },
    { cx: 70, cy: 34 },
    { cx: 10, cy: 34 },
  ];
  const p = positions[phase];
  return (
    <svg viewBox="0 0 80 40" className="h-8 w-16" aria-hidden="true">
      <path d="M4 36a36 30 0 0 1 72 0" fill="none" stroke="var(--ct-line-2)" strokeWidth="1" strokeDasharray="2 3" />
      <path d="M0 36.5h80" stroke="var(--ct-line-2)" strokeWidth="1" />
      <circle cx={p.cx} cy={p.cy} r="5" fill={phase === 1 ? "var(--ct-violet)" : "var(--ct-signal)"} />
    </svg>
  );
}

/** The day, the night's search and the morning, as one line the sun travels along. */
function DayArc() {
  const stops = [
    { left: "16.667%", top: "17.5%", fill: "var(--ct-signal)" },
    { left: "50%", top: "82.5%", fill: "var(--ct-violet)" },
    { left: "83.333%", top: "50%", fill: "var(--ct-signal)" },
  ];
  return (
    <div aria-hidden="true" className="relative hidden h-20 lg:block">
      <svg viewBox="0 0 600 80" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d="M0 56h600" stroke="var(--ct-line-2)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path
          d="M0 30C40 14 70 12 100 14S220 66 300 66 440 40 500 40 580 34 600 30"
          fill="none"
          stroke="var(--ct-green)"
          strokeWidth="1.25"
          strokeDasharray="3 4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {stops.map((s, i) => (
        <span
          key={i}
          className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-[var(--ct-bg-2)]"
          style={{ left: s.left, top: s.top, backgroundColor: s.fill }}
        />
      ))}
    </div>
  );
}

export function CompactContinues({ index }: { index: string }) {
  return (
    <section id="continues" aria-labelledby="continues-heading" className="ct-section-tight ct-tint">
      <div className="ct-wrap">
        <SectionHead index={index} eyebrow={CONTINUES.eyebrow} id="continues-heading" lead={CONTINUES.title} turn={CONTINUES.titleItalic} size="m" className="max-w-4xl" />
        <div className="mt-10">
          <DayArc />
          <ol className="grid gap-3 lg:mt-4 lg:grid-cols-3 lg:gap-6">
            {COMPACT.continues.map((panel, i) => (
              <Reveal as="li" key={panel.when} delay={i * 0.08} className="rounded-[var(--ct-r-l)] border bg-[var(--ct-surface)] p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="ct-meta ct-green">{panel.when}</p>
                  <span className="lg:hidden">
                    <Sun phase={i} />
                  </span>
                </div>
                <h3 className="ct-display mt-2 text-[1.35rem] leading-tight">{panel.title}</h3>
                <ul className="mt-4 flex flex-wrap items-center gap-1.5">
                  {panel.tags.map((t, k) => (
                    <li key={t} className="flex items-center gap-1.5">
                      {i === 1 && k > 0 && (
                        <span aria-hidden="true" className="ct-mute text-[0.8rem]">
                          →
                        </span>
                      )}
                      <span className="ct-tag">{t}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </ol>
        </div>
        <p className="ct-small mt-5 max-w-3xl text-[0.84rem]">{CONTINUES.qualifier}</p>
      </div>
    </section>
  );
}

/* --- 05 Role-specific evaluation ------------------------------------------ */

type DemoProps = {
  role: Role;
  candidate: { ref: string; profile: Passport };
  assessment: Assessment;
  responses: Record<string, Response>;
  evaluation: Omit<Evaluation, "internalNotes">;
};

const KIND: Record<string, string> = { experience: "Experience question", scenario: "Scenario", functional: "Practical problem" };

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, "")}…` : s);

export function CompactEvaluation({ index, role, assessment, evaluation }: { index: string } & Omit<DemoProps, "candidate" | "responses">) {
  // One competency traced through the chain, from the labelled demonstration.
  const c = assessment.competencies[0];
  const essential = c.from.find((g) => g.kind === "essential");
  const requirement = essential && essential.kind === "essential" ? role.lookingFor.essential[essential.index] : "";
  const q = assessment.questions.find((x) => x.competencyIds.includes(c.id));
  const finding = evaluation.findings.find((f) => f.competencyId === c.id);
  const example: ReactNode[] = [
    clip(requirement, 64),
    c.label,
    q ? KIND[q.kind] : "",
    finding?.evidence[0] ? (
      <mark className="rounded-[2px] bg-[var(--ct-lime)] px-0.5 text-[var(--ct-ink)]">“{clip(finding.evidence[0].quote, 60)}”</mark>
    ) : null,
    finding ? <RatingBadge rating={finding.rating} /> : null,
  ];

  return (
    <section id="evaluation" aria-labelledby="evaluation-heading" className="ct-section-tight scroll-mt-[var(--ct-nav-h)]">
      <div className="ct-wrap">
        <SectionHead
          index={index}
          eyebrow={EVALUATION.eyebrow}
          id="evaluation-heading"
          lead={EVALUATION.title}
          turn={EVALUATION.titleItalic}
          lede={COMPACT.evaluationLede}
          size="m"
          className="max-w-4xl"
        />
        <div className="mt-10 lg:mt-12">
          <IconSteps steps={COMPACT.chain.map((s) => ({ icon: s.icon, title: s.label, note: s.note }))} columns={5} label="From requirement to evidence" />
          {/* The same chain, filled in for one competency. Wide screens only — it is an example, not the point. */}
          <div className="mt-6 hidden rounded-[var(--ct-r-m)] border border-dashed bg-[var(--ct-surface)] p-4 lg:block">
            <p className="ct-meta ct-mute text-[0.62rem]">For example · {role.title} · demonstration</p>
            <ol className="mt-2 grid grid-cols-5 gap-4">
              {example.map((cell, i) => (
                <li key={i} className="min-w-0 text-[0.86rem] leading-snug text-[var(--ct-ink-2)]">
                  {cell}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <ul className="mt-8 flex flex-wrap gap-2">
          {COMPACT.principles.map((p) => (
            <li key={p.label} className="flex items-center gap-2 rounded-full border bg-[var(--ct-surface)] py-1.5 pr-3.5 pl-2.5 text-[0.88rem]">
              <Icon name={p.icon} className="ct-green h-4 w-4" />
              {p.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* --- 06 A shortlist with context ------------------------------------------ */

export function CompactShortlist({ index, role, candidate, assessment, responses, evaluation }: { index: string } & DemoProps) {
  const strongest = evaluation.findings.find((f) => f.rating === "strong" && f.evidence[0]) ?? evaluation.findings[0];
  const quote = strongest?.evidence[0];
  const answer = quote ? responses[quote.questionId]?.text ?? "" : "";
  const followUp = evaluation.findings.flatMap((f) => f.followUps)[0];

  return (
    <section id="shortlist" aria-labelledby="shortlist-heading" className="ct-section-tight ct-tint scroll-mt-[var(--ct-nav-h)]">
      <div className="ct-wrap grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-4">
          <SectionHead index={index} eyebrow={SHORTLIST.eyebrow} id="shortlist-heading" lead={SHORTLIST.title} turn={SHORTLIST.titleItalic} lede={COMPACT.shortlistLede} size="m" />
          <div className="mt-8">
            <Link href={ROUTES.review} className="ct-btn ct-btn-secondary">
              {EVALUATION.openReview} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <figure className="lg:col-span-8">
          <div className="ct-window">
            <div className="ct-window-bar flex-wrap gap-2">
              <span className="ct-meta ct-mute">
                {role.title} · {candidate.ref}
              </span>
              <span className="ct-meta ct-mute tabular-nums">{assessment.requirementsVersion}</span>
            </div>
            <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <div className="flex flex-col gap-3 p-5">
                <p className="ct-meta ct-mute text-[0.62rem]">Against the role</p>
                <ul className="flex flex-col gap-3">
                  {evaluation.findings.map((f) => {
                    const comp = assessment.competencies.find((x) => x.id === f.competencyId);
                    return (
                      <li key={f.competencyId} className="flex flex-col gap-1.5">
                        <span className="text-[0.92rem] leading-snug">{comp?.label}</span>
                        <RatingBadge rating={f.rating} />
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="flex flex-col gap-3 border-t p-5 sm:border-t-0 sm:border-l">
                <p className="ct-meta ct-mute text-[0.62rem]">In their words</p>
                {quote && (
                  <p className="text-[0.92rem] leading-[1.6] text-[var(--ct-ink-2)]">
                    {answer.indexOf(quote.quote) > 0 && "… "}
                    <mark className="rounded-[2px] bg-[var(--ct-lime)] px-0.5 text-[var(--ct-ink)]">{quote.quote}</mark>
                    {" …"}
                  </p>
                )}
                {followUp && (
                  <>
                    <p className="ct-meta ct-mute mt-2 text-[0.62rem]">Ask next</p>
                    <p className="text-[0.9rem] leading-snug text-[var(--ct-violet-ink)]">{followUp}</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <figcaption className="ct-small mt-3 text-[0.82rem]">{COMPACT.demoNote}</figcaption>
        </figure>
      </div>
    </section>
  );
}

/* --- 07 The human decision ------------------------------------------------- */

export function CompactDecision({ index }: { index: string }) {
  return (
    <section id="decision" aria-labelledby="decision-heading" className="ct-section-tight">
      <div className="ct-wrap grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-5">
          <Eyebrow index={index}>{DECISION.eyebrow}</Eyebrow>
          <Headline id="decision-heading" lead={DECISION.title} turn={DECISION.titleItalic} size="m" className="mt-6" />
        </div>
        <ul className="grid gap-3 sm:grid-cols-3 lg:col-span-7">
          {COMPACT.decision.map((d, i) => (
            <Reveal as="li" key={d.title} delay={i * 0.06} className="flex items-center gap-4 sm:flex-col sm:items-start">
              <IconBadge name={d.icon} tone={i === 1 ? "violet" : "green"} />
              <div>
                <h3 className="text-[1rem] font-medium leading-snug">{d.title}</h3>
                <p className="ct-small mt-0.5 text-[0.86rem] leading-snug">{d.note}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
