import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ROLES, formatCompensation, roleBySlug } from "@/lib/candidate/roles";
import { COMPANY_STAGES, EXPERIENCE_BANDS, FUNCTIONS, VALUES, labelFor } from "@/lib/candidate/taxonomy";
import { ROLE_PAGE, ROLES_PAGE } from "@/lib/contour/content";
import { locationsLabel, remoteNote, workModelLabel } from "@/lib/contour/roles";
import { ROUTES } from "@/lib/contour/site";
import { SaveToggle } from "@/components/contour/candidate/RoleRow";
import { Alignment, MobileApplyBar } from "@/components/contour/candidate/Alignment";
import { ProfileFlow } from "@/components/contour/candidate/ProfileFlow";
import { Reveal } from "@/components/primitives/Reveal";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ROLES.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const role = roleBySlug(slug);
  if (!role) return { title: "Role not found" };
  return { title: role.title, description: role.summary };
}

/**
 * A role, read properly. Everything the role data holds is shown and nothing
 * is added: no salary that isn't stated, no culture claims, no company name
 * the client hasn't released. The band and the application action stay in
 * reach — a rail on desktop, a bar on phones — without covering the reading.
 */
export default async function RolePage({ params }: Params) {
  const { slug } = await params;
  const role = roleBySlug(slug);
  if (!role) notFound();

  const related = ROLES.filter((r) => r.slug !== role.slug && r.functionId === role.functionId).slice(0, 2);
  const remote = remoteNote(role);
  const posted = new Date(role.posted).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const facts: Array<{ label: string; value: string }> = [
    { label: ROLE_PAGE.facts.level, value: labelFor(EXPERIENCE_BANDS, role.bandId) },
    { label: "Location", value: locationsLabel(role) },
    { label: ROLE_PAGE.facts.workModel, value: workModelLabel(role) },
    { label: ROLE_PAGE.facts.team, value: role.teamSize },
    { label: ROLE_PAGE.facts.reportsTo, value: role.reportsTo },
    { label: ROLE_PAGE.facts.stage, value: labelFor(COMPANY_STAGES, role.stageId) },
    { label: ROLE_PAGE.facts.posted, value: posted },
  ];

  return (
    <>
      {/* --- Masthead --------------------------------------------------------- */}
      <header className="ct-wrap pt-10 pb-12 md:pt-16">
        <nav aria-label="Breadcrumb" className="ct-meta flex flex-wrap items-center gap-2">
          <Link href={ROUTES.opportunities} className="ct-green hover:underline">
            {ROLES_PAGE.eyebrow}
          </Link>
          <span aria-hidden="true" className="ct-mute">
            /
          </span>
          <span className="ct-mute" aria-current="page">
            {labelFor(FUNCTIONS, role.functionId)}
          </span>
        </nav>
        <h1 className="ct-display ct-xl mt-7 max-w-5xl">{role.title}</h1>
        <p className="ct-lede mt-5">{role.company}</p>
        <p className="ct-body mt-4 max-w-2xl">{role.summary}</p>
        <div id="role-actions" className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#apply" className="ct-btn ct-btn-primary">
            {ROLE_PAGE.apply} <span aria-hidden="true">↓</span>
          </a>
          <SaveToggle slug={role.slug} title={role.title} withLabel />
          <a href="#fit" className="ct-btn ct-btn-quiet text-[var(--ct-violet-ink)]">
            {ROLE_PAGE.alignmentTitle}
          </a>
        </div>
      </header>

      <div className="ct-wrap grid gap-12 pb-[var(--ct-section)] lg:grid-cols-12 lg:gap-10">
        {/* --- The facts, always in reach ------------------------------------ */}
        <section className="lg:order-2 lg:col-span-4" aria-label="Role facts">
          <div className="ct-panel lg:sticky lg:top-[calc(var(--ct-nav-h)+1.5rem)]">
            <div className="border-b p-5">
              <p className="ct-meta ct-mute">{ROLE_PAGE.facts.compensation}</p>
              <p className="mt-2 font-mono text-[1.5rem] leading-none tabular-nums">{formatCompensation(role.compensation)}</p>
              <p className="ct-small mt-1.5 text-[0.82rem]">{ROLES_PAGE.perYear}</p>
              {role.compensation.note && <p className="ct-small mt-3 text-[0.85rem]">{role.compensation.note}</p>}
            </div>
            <dl className="px-5 py-2">
              {facts.map((f) => (
                <div key={f.label} className="grid grid-cols-[7.5rem_1fr] gap-3 border-t py-2.5 first:border-t-0">
                  <dt className="ct-meta ct-mute pt-0.5">{f.label}</dt>
                  <dd className="text-[0.92rem] leading-snug">{f.value}</dd>
                </div>
              ))}
            </dl>
            {remote && <p className="ct-small border-t px-5 py-3 text-[0.85rem]">{remote}</p>}
            <div className="hidden flex-col gap-2 border-t p-5 md:flex">
              <a href="#apply" className="ct-btn ct-btn-primary w-full">
                {ROLE_PAGE.apply} <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </section>

        {/* --- The reading ------------------------------------------------------ */}
        <article className="lg:order-1 lg:col-span-8" aria-labelledby="the-role">
          <Block id="the-role" index="01" title={ROLE_PAGE.sections.role}>
            <Prose body={role.theRole} />
          </Block>
          <Block index="02" title={ROLE_PAGE.sections.why}>
            <Prose body={role.whyExists} />
          </Block>
          <Block index="03" title={ROLE_PAGE.sections.success}>
            <ol className="flex flex-col">
              {role.success.map((s) => (
                <li key={s.heading} className="grid gap-3 border-t py-5 first:border-t-0 first:pt-0 sm:grid-cols-[9rem_1fr] sm:gap-6">
                  <p className="ct-meta ct-green pt-1">{s.heading}</p>
                  <ul className="flex flex-col gap-2">
                    {s.body.map((line) => (
                      <li key={line} className="ct-body text-[var(--ct-ink)]">
                        {line}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </Block>
          <Block index="04" title={ROLE_PAGE.sections.lookingFor}>
            <div className="grid gap-8 md:grid-cols-3">
              <Requirements label={ROLE_PAGE.needed} items={role.lookingFor.essential} tone="green" />
              <Requirements label={ROLE_PAGE.helpful} items={role.lookingFor.helpful} tone="ink" />
              <Requirements label={ROLE_PAGE.notRequired} items={role.lookingFor.notRequired} tone="mute" />
            </div>
            <p className="ct-small mt-6">{ROLE_PAGE.notRequiredNote}</p>
            {role.skills.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Skills">
                {role.skills.map((s) => (
                  <li key={s} className="ct-tag">
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </Block>
          <Block index="05" title={ROLE_PAGE.sections.howYouWork}>
            <div className="flex flex-col gap-6">
              {role.howYouWork.map((s) => (
                <div key={s.heading}>
                  <p className="ct-meta ct-mute">{s.heading}</p>
                  <Prose body={s.body} className="mt-2" />
                </div>
              ))}
            </div>
          </Block>
          <Block index="06" title={ROLE_PAGE.sections.matters}>
            <ul className="flex flex-col">
              {role.whatMatters.map((line) => (
                <li key={line} className="ct-body border-t py-3 text-[var(--ct-ink)] first:border-t-0 first:pt-0">
                  {line}
                </li>
              ))}
            </ul>
            <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="What this environment rewards">
              {role.valueIds.map((v) => (
                <li key={v} className="ct-tag">
                  {labelFor(VALUES, v)}
                </li>
              ))}
            </ul>
          </Block>
          <Block index="07" title={ROLE_PAGE.sections.leads}>
            <ul className="flex flex-col gap-2">
              {role.couldTakeYouTo.map((line) => (
                <li key={line} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ct-violet)]" />
                  <span className="ct-body text-[var(--ct-ink)]">{line}</span>
                </li>
              ))}
            </ul>
            <p className="ct-small mt-5">{ROLE_PAGE.leadsNote}</p>
          </Block>
          <Block index="08" title={ROLE_PAGE.sections.consider}>
            <ul className="flex flex-col gap-3">
              {role.consider.map((line) => (
                <li key={line} className="border-l-2 pl-4 text-[1rem] leading-[1.65]" style={{ ["--ct-bc" as string]: "var(--ct-lime)" }}>
                  {line}
                </li>
              ))}
            </ul>
            <p className="ct-small mt-5">{ROLE_PAGE.considerNote}</p>
          </Block>
          <Block index="09" title={`${ROLE_PAGE.processTitle} ${ROLE_PAGE.processTitleItalic}`}>
            <ol className="flex flex-col">
              {role.process.map((p, i) => (
                <li key={p.step} className="grid grid-cols-[2rem_1fr] gap-3 border-t py-3 first:border-t-0">
                  <span className="ct-meta ct-green tabular-nums pt-1">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="text-[1rem] font-medium">{p.step}</p>
                    <p className="ct-small">{p.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Block>

          <section id="fit" aria-labelledby="fit-heading" className="scroll-mt-[calc(var(--ct-nav-h)+1rem)] pt-12">
            <Alignment role={role} />
          </section>

          <section id="apply" aria-labelledby="apply-heading" className="scroll-mt-[calc(var(--ct-nav-h)+1rem)] pt-16">
            <h2 id="apply-heading" className="ct-display ct-l">
              Apply, in <span className="ct-italic">six steps.</span>
            </h2>
            <p className="ct-lede mt-4 max-w-2xl">{ROLE_PAGE.applyNote}</p>
            <div className="mt-8">
              <ProfileFlow role={role} />
            </div>
          </section>
        </article>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="ct-tint py-16">
          <div className="ct-wrap">
            <h2 id="related-heading" className="ct-display ct-m">
              {ROLE_PAGE.others} {labelFor(FUNCTIONS, role.functionId)} {ROLE_PAGE.othersTail}
            </h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={ROUTES.role(r.slug)} className="ct-panel group block p-6 transition-colors ct-hb-ink">
                    <p className="ct-meta ct-mute">{r.company}</p>
                    <p className="ct-display ct-s mt-2 group-hover:text-[var(--ct-green)]">{r.title}</p>
                    <p className="ct-small mt-2">{r.summary}</p>
                    <p className="mt-4 font-mono text-[0.85rem] tabular-nums">{formatCompensation(r.compensation)} a year →</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <MobileApplyBar role={role} />
    </>
  );
}

function Block({ id, index, title, children }: { id?: string; index: string; title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section className="border-t py-10 first:border-t-0 first:pt-0">
        <div className="mb-6 flex items-baseline gap-4">
          <span className="ct-meta ct-green tabular-nums">{index}</span>
          <h2 id={id} className="ct-display ct-m">
            {title}
          </h2>
        </div>
        {children}
      </section>
    </Reveal>
  );
}

function Prose({ body, className }: { body: string[]; className?: string }) {
  return (
    <div className={className}>
      {body.map((p) => (
        <p key={p} className="ct-body mt-4 max-w-2xl text-[1.04rem] text-[var(--ct-ink)] first:mt-0">
          {p}
        </p>
      ))}
    </div>
  );
}

function Requirements({ label, items, tone }: { label: string; items: string[]; tone: "green" | "ink" | "mute" }) {
  return (
    <div>
      <p className={tone === "green" ? "ct-meta ct-green" : "ct-meta ct-mute"}>{label}</p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className={tone === "mute" ? "ct-small" : "text-[0.96rem] leading-[1.55]"}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
