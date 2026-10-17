import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ROLES, roleBySlug } from "@/lib/candidate/roles";
import { APPLICATIONS } from "@/lib/contour/proposed";
import { ROUTES } from "@/lib/contour/site";
import { ApplicationDetail } from "@/components/contour/candidate/Applications";

type Params = { params: Promise<{ slug: string }> };

/** One page per role: an application is identified by its role on this device. */
export function generateStaticParams() {
  return ROLES.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const role = roleBySlug((await params).slug);
  return { title: role ? `Your application · ${role.title}` : "Application" };
}

export default async function ApplicationPage({ params }: Params) {
  const role = roleBySlug((await params).slug);
  if (!role) notFound();
  return (
    <>
      <header className="ct-wrap pt-12 pb-10 md:pt-16">
        <nav aria-label="Breadcrumb" className="ct-meta flex flex-wrap items-center gap-2">
          <Link href={ROUTES.applications} className="ct-green hover:underline">
            {APPLICATIONS.eyebrow}
          </Link>
          <span aria-hidden="true" className="ct-mute">
            /
          </span>
          <span className="ct-mute" aria-current="page">
            {role.title}
          </span>
        </nav>
        <h1 className="ct-display ct-xl mt-7 max-w-4xl">{role.title}</h1>
        <p className="ct-lede mt-4">
          {role.company} ·{" "}
          <Link href={ROUTES.role(role.slug)} className="ct-link">
            read the role
          </Link>
        </p>
      </header>
      <section aria-label="Application" className="ct-wrap pb-[var(--ct-section)]">
        <ApplicationDetail role={role} />
      </section>
    </>
  );
}
