import type { Metadata } from "next";
import Link from "next/link";
import { REVIEW } from "@/lib/contour/proposed";
import { ROUTES } from "@/lib/contour/site";
import { DEMO_ASSESSMENT, DEMO_CANDIDATE, DEMO_EVALUATION, DEMO_RESPONSES, DEMO_ROLE } from "@/lib/assessment/demo";
import { clientView } from "@/lib/assessment/evaluate";
import { Eyebrow, Headline } from "@/components/contour/ui";
import { AssessmentReview } from "@/components/contour/assessment/Review";

export const metadata: Metadata = {
  title: "Assessment review",
  description: "A demonstration of the employer-facing assessment review: the role's requirements, the candidate's answers and the structured evaluation, side by side.",
};

/**
 * The employer-facing review, full width. A demonstration, and it says so
 * before anything else: the role and its assessment are real, the candidate,
 * answers and evaluation are fictional. The evaluation shown is clientView() —
 * the same function that would strip TALYNT's internal notes from a real one.
 */
export default function AssessmentReviewPage() {
  return (
    <>
      <header className="ct-wrap pt-10 pb-10 md:pt-14">
        <nav aria-label="Breadcrumb" className="ct-meta flex flex-wrap items-center gap-2">
          <Link href={ROUTES.employers} className="ct-green hover:underline">
            For employers
          </Link>
          <span aria-hidden="true" className="ct-mute">
            /
          </span>
          <span className="ct-mute" aria-current="page">
            {REVIEW.eyebrow}
          </span>
        </nav>
        <Eyebrow tone="green" className="mt-8">
          {REVIEW.eyebrow}
        </Eyebrow>
        <Headline as="h1" lead={REVIEW.title} turn={REVIEW.titleItalic} size="xl" className="mt-6 max-w-4xl" />
        <p className="ct-lede mt-6 max-w-2xl">{REVIEW.lede}</p>
        <p role="note" className="ct-panel mt-8 max-w-3xl p-4 text-[0.92rem] leading-[1.55]" style={{ ["--ct-bc" as string]: "var(--ct-line-2)", borderStyle: "dashed" }}>
          {REVIEW.demo}
        </p>
      </header>
      <section aria-label="Assessment review" className="ct-wrap pb-16">
        <AssessmentReview headingLevel={2} role={DEMO_ROLE} candidate={DEMO_CANDIDATE} assessment={DEMO_ASSESSMENT} responses={DEMO_RESPONSES} evaluation={clientView(DEMO_EVALUATION)} />
      </section>
      <section aria-labelledby="boundaries-heading" className="ct-section ct-tint">
        <div className="ct-wrap grid gap-10 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <h2 id="boundaries-heading" className="ct-display ct-l">
              {REVIEW.boundariesTitle}
            </h2>
            <p className="ct-small mt-5">{REVIEW.needsBackend}</p>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-[var(--ct-r-l)] border bg-[var(--ct-line)] sm:grid-cols-2 lg:col-span-8">
            {REVIEW.boundaries.map((b, i) => (
              <li key={b.title} className="bg-[var(--ct-surface)] p-6">
                <span className="ct-meta ct-green tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="ct-display ct-s mt-3">{b.title}</h3>
                <p className="ct-body mt-2">{b.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
