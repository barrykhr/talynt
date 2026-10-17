import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ROLES, roleBySlug } from "@/lib/candidate/roles";
import { APPLICATIONS } from "@/lib/contour/proposed";
import { ROUTES } from "@/lib/contour/site";
import { AssessmentRunner } from "@/components/contour/candidate/AssessmentRunner";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ROLES.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const role = roleBySlug((await params).slug);
  return { title: role ? `Assessment · ${role.title}` : "Assessment" };
}

export default async function AssessmentPage({ params }: Params) {
  const role = roleBySlug((await params).slug);
  if (!role) notFound();
  return (
    <>
      <header className="ct-wrap pt-10 pb-8 md:pt-14">
        <nav aria-label="Breadcrumb" className="ct-meta flex flex-wrap items-center gap-2">
          <Link href={ROUTES.applications} className="ct-green hover:underline">
            {APPLICATIONS.eyebrow}
          </Link>
          <span aria-hidden="true" className="ct-mute">
            /
          </span>
          <Link href={ROUTES.application(role.slug)} className="ct-green hover:underline">
            {role.title}
          </Link>
          <span aria-hidden="true" className="ct-mute">
            /
          </span>
          <span className="ct-mute" aria-current="page">
            Assessment
          </span>
        </nav>
        <h1 className="sr-only">Assessment for {role.title}</h1>
      </header>
      <section aria-label="Assessment" className="ct-wrap pb-[var(--ct-section)]">
        <AssessmentRunner role={role} />
      </section>
    </>
  );
}
