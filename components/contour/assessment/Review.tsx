import type { ReactNode } from "react";
import type { Role } from "@/lib/candidate/roles";
import type { Passport } from "@/lib/candidate/passport-shape";
import type { Assessment, Evaluation, Finding, Rating, Response } from "@/lib/assessment/types";
import { LEVELS, RATING_LABEL } from "@/lib/assessment/rubric";
import { EVALUATION, REVIEW } from "@/lib/contour/proposed";
import { cx } from "@/lib/utils";

/**
 * The employer-facing assessment views. They render whatever assessment,
 * answers and evaluation they are given; on this site that is the labelled
 * demonstration in lib/assessment/demo.ts, because client access needs
 * accounts and a backend this site does not have. The evaluation passed in is
 * already the client view — TALYNT's internal notes are not in it.
 */

const LEVEL_FILL: Record<Rating, number> = { limited: 1, clear: 2, strong: 3, insufficient: 0 };

export function RatingBadge({ rating, className }: { rating: Rating; className?: string }) {
  const filled = LEVEL_FILL[rating];
  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <span className="flex gap-[3px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cx("h-[8px] w-[14px] rounded-[2px]", rating === "insufficient" && "border border-dashed ct-b-mute")}
            style={rating === "insufficient" ? undefined : { backgroundColor: i < filled ? "var(--ct-green)" : "var(--ct-line)" }}
          />
        ))}
      </span>
      <span className="ct-meta ct-ink2">{RATING_LABEL[rating]}</span>
    </span>
  );
}

/** The candidate's own words, with the passages a reviewer quoted marked where they sit. */
function Highlighted({ text, quotes }: { text: string; quotes: string[] }) {
  const ranges = quotes
    .map((q) => {
      const at = text.indexOf(q);
      return at >= 0 ? ([at, at + q.length] as const) : null;
    })
    .filter((r): r is readonly [number, number] => r !== null)
    .sort((a, b) => a[0] - b[0]);
  const parts: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], i) => {
    if (start < cursor) return;
    parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={i} className="rounded-[2px] bg-[var(--ct-lime)] px-0.5 text-[var(--ct-ink)]">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}

/** A finding's title sits one level below its column heading. */
function Finding({ level, children }: { level: 2 | 3; children: ReactNode }) {
  const Tag = level === 2 ? "h3" : "h4";
  return <Tag className="text-[0.98rem] font-medium">{children}</Tag>;
}

const KIND: Record<string, string> = { experience: "Experience question", scenario: "Scenario", functional: "Practical problem" };

function Column({ label, level, children, className }: { label: string; level: 2 | 3; children: ReactNode; className?: string }) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <section aria-label={label} className={cx("min-w-0 border-t lg:border-t-0 lg:border-l first:border-t-0 first:lg:border-l-0", className)}>
      <Heading className="ct-meta ct-mute border-b bg-[var(--ct-bg-2)] px-5 py-2.5">{label}</Heading>
      <div className="flex flex-col gap-6 p-5">{children}</div>
    </section>
  );
}

export function AssessmentReview({
  role,
  candidate,
  assessment,
  responses,
  evaluation,
  headingLevel = 3,
}: {
  headingLevel?: 2 | 3;
  role: Role;
  candidate: { ref: string; profile: Passport };
  assessment: Assessment;
  responses: Record<string, Response>;
  evaluation: Omit<Evaluation, "internalNotes">;
}) {
  const competencyFor = (index: number) => assessment.competencies.find((c) => c.from.some((g) => g.kind === "essential" && g.index === index));
  const findingFor = (id: string): Finding | undefined => evaluation.findings.find((f) => f.competencyId === id);
  const reviewed = evaluation.reviewer.reviewedAt
    ? new Date(evaluation.reviewer.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="ct-window">
      <div className="ct-window-bar flex-wrap gap-2">
        <span className="ct-meta ct-mute">
          {REVIEW.eyebrow} · {role.title} · {candidate.ref}
        </span>
        <span className="ct-meta ct-mute tabular-nums">
          {assessment.requirementsVersion} · {assessment.rubricVersion}
        </span>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* --- The role ---------------------------------------------------- */}
        <Column label={REVIEW.columns.role} level={headingLevel}>
          <div>
            <p className="ct-display ct-s">{role.title}</p>
            <p className="ct-small mt-1">{role.company}</p>
          </div>
          <div>
            <p className="ct-meta ct-green">Essential</p>
            <ol className="mt-3 flex flex-col gap-3">
              {role.lookingFor.essential.map((req, i) => {
                const c = competencyFor(i);
                return (
                  <li key={req} className="border-t pt-3 first:border-t-0 first:pt-0">
                    <p className="text-[0.9rem] leading-snug">{req}</p>
                    {c && <p className="ct-meta ct-green mt-1.5 text-[0.66rem]">→ {c.label}</p>}
                  </li>
                );
              })}
            </ol>
          </div>
          <div>
            <p className="ct-meta ct-mute">Not required</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {role.lookingFor.notRequired.map((n) => (
                <li key={n} className="ct-small text-[0.84rem]">
                  {n}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t pt-4">
            <p className="ct-meta ct-mute">Rubric levels</p>
            <dl className="mt-2 flex flex-col gap-2">
              {(Object.keys(LEVELS) as Array<keyof typeof LEVELS>).map((k) => (
                <div key={k}>
                  <dt>
                    <RatingBadge rating={k} />
                  </dt>
                  <dd className="ct-small mt-0.5 text-[0.82rem]">{LEVELS[k].description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Column>

        {/* --- The candidate ---------------------------------------------- */}
        <Column label={REVIEW.columns.candidate} level={headingLevel}>
          <div>
            <p className="ct-display ct-s">{candidate.ref}</p>
            <p className="ct-small mt-1">{candidate.profile.headline}</p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {candidate.profile.experience.map((e) => (
                <li key={e.id} className="text-[0.88rem] leading-snug">
                  <span className="font-medium">{e.title}</span>, {e.organisation} · {e.from}–{e.to}
                </li>
              ))}
            </ul>
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills">
              {candidate.profile.skills.map((s) => (
                <li key={s} className="ct-tag text-[0.7rem]">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <ol className="flex flex-col">
            {assessment.questions.map((q, i) => {
              const finding = findingFor(q.competencyIds[0]);
              const quotes = (finding?.evidence ?? []).filter((e) => e.questionId === q.id).map((e) => e.quote);
              const comp = assessment.competencies.find((c) => q.competencyIds.includes(c.id));
              return (
                <li key={q.id} className="border-t py-5 first:border-t-0 first:pt-0">
                  <p className="ct-meta ct-mute">
                    Q{i + 1} · {KIND[q.kind]} · <span className="ct-green">{comp?.label}</span>
                  </p>
                  <p className="ct-display mt-2 text-[1.08rem] leading-snug">{q.prompt}</p>
                  <p className="mt-3 text-[0.93rem] leading-[1.65] text-[var(--ct-ink-2)]">
                    <Highlighted text={responses[q.id]?.text ?? ""} quotes={quotes} />
                  </p>
                </li>
              );
            })}
          </ol>
        </Column>

        {/* --- The evaluation --------------------------------------------- */}
        <Column label={REVIEW.columns.evaluation} level={headingLevel}>
          {evaluation.findings.map((f) => {
            const c = assessment.competencies.find((x) => x.id === f.competencyId);
            return (
              <article key={f.competencyId} className="border-t pt-5 first:border-t-0 first:pt-0">
                <Finding level={headingLevel}>{c?.label}</Finding>
                <RatingBadge rating={f.rating} className="mt-2" />
                <p className="ct-meta ct-mute mt-4">Evidence</p>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {f.evidence.map((e) => (
                    <li key={e.quote} className="border-l-2 pl-3 text-[0.88rem] leading-snug" style={{ ["--ct-bc" as string]: "var(--ct-lime)" }}>
                      “{e.quote}”
                    </li>
                  ))}
                </ul>
                <p className="ct-meta ct-mute mt-4">Reading</p>
                <p className="mt-1.5 text-[0.9rem] leading-[1.55]">{f.interpretation}</p>
                {f.followUps.length > 0 && (
                  <>
                    <p className="ct-meta ct-mute mt-4">Ask next</p>
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {f.followUps.map((q) => (
                        <li key={q} className="text-[0.9rem] leading-snug text-[var(--ct-violet-ink)]">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {f.confidence && <p className="ct-meta ct-mute mt-3">Reviewer confidence · {f.confidence}</p>}
              </article>
            );
          })}
          <div className="border-t pt-5">
            <p className="ct-meta ct-mute">Summary</p>
            <p className="mt-1.5 text-[0.92rem] leading-[1.6]">{evaluation.summaryForClient}</p>
            <p className="ct-meta ct-green mt-4">
              {evaluation.reviewer.status === "reviewed" ? `Reviewed by a ${evaluation.reviewer.by}${reviewed ? ` · ${reviewed}` : ""}` : "Draft — not yet reviewed"}
            </p>
            <p className="ct-small mt-3 text-[0.84rem]">No overall score. Nothing here rejects anyone — the decision is yours.</p>
          </div>
        </Column>
      </div>
    </div>
  );
}

/** The chain for each competency: requirement → competency → question → answer → evidence. */
export function AssessmentFlow({
  role,
  assessment,
  responses,
  evaluation,
}: {
  role: Role;
  assessment: Assessment;
  responses: Record<string, Response>;
  evaluation: Omit<Evaluation, "internalNotes">;
}) {
  return (
    <div>
      <ol className="hidden grid-cols-5 gap-4 border-b pb-3 xl:grid" aria-hidden="true">
        {EVALUATION.steps.map((s, i) => (
          <li key={s.id} className="flex items-baseline gap-2">
            <span className="ct-meta ct-green tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <span className="ct-meta ct-mute">{s.label}</span>
          </li>
        ))}
      </ol>
      <ol className="flex flex-col">
        {assessment.competencies.map((c) => {
          const essential = c.from.find((g) => g.kind === "essential");
          const requirement = essential && essential.kind === "essential" ? role.lookingFor.essential[essential.index] : "";
          const q = assessment.questions.find((x) => x.competencyIds.includes(c.id));
          const finding = evaluation.findings.find((f) => f.competencyId === c.id);
          const answer = q ? responses[q.id]?.text ?? "" : "";
          const quote = finding?.evidence[0]?.quote;
          const cells: Array<{ label: string; body: ReactNode }> = [
            { label: EVALUATION.steps[0].label, body: <p className="text-[0.92rem] leading-snug">{requirement}</p> },
            {
              label: EVALUATION.steps[1].label,
              body: (
                <>
                  <p className="text-[0.98rem] font-medium leading-snug">{c.label}</p>
                  <p className="ct-small mt-1 text-[0.84rem]">{c.meaning}</p>
                </>
              ),
            },
            {
              label: EVALUATION.steps[2].label,
              body: (
                <>
                  <p className="ct-meta ct-mute text-[0.62rem]">{q ? KIND[q.kind] : ""}</p>
                  <p className="mt-1 text-[0.9rem] leading-snug">{q?.prompt}</p>
                </>
              ),
            },
            {
              label: EVALUATION.steps[3].label,
              body: (
                <p className="text-[0.88rem] leading-[1.55] text-[var(--ct-ink-2)]">
                  {quote ? <Highlighted text={answer.length > 260 ? `${answer.slice(0, 260)}…` : answer} quotes={[quote]} /> : answer.slice(0, 260)}
                </p>
              ),
            },
            {
              label: EVALUATION.steps[4].label,
              body: finding ? (
                <>
                  <RatingBadge rating={finding.rating} />
                  <p className="mt-2 text-[0.88rem] leading-snug">{finding.interpretation}</p>
                </>
              ) : null,
            },
          ];
          return (
            <li key={c.id} className="grid gap-4 border-b py-6 xl:grid-cols-5">
              {cells.map((cell, i) => (
                <div key={cell.label} className="relative min-w-0 xl:pr-4">
                  <p className="ct-meta ct-green mb-1.5 xl:hidden">
                    {String(i + 1).padStart(2, "0")} · {cell.label}
                  </p>
                  {cell.body}
                  {i < cells.length - 1 && (
                    <span aria-hidden="true" className="ct-mute absolute top-0 -right-1 hidden text-[0.8rem] xl:block">
                      →
                    </span>
                  )}
                </div>
              ))}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
