import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/primitives/Section";
import { Reveal } from "@/components/primitives/Reveal";
import { ROLES, formatCompensation, roleBySlug } from "@/lib/candidate/roles";
import {
  COMPANY_STAGES,
  EXPERIENCE_BANDS,
  FUNCTIONS,
  LOCATIONS,
  VALUES,
  WORK_MODELS,
  labelFor,
} from "@/lib/candidate/taxonomy";
import { RoleAlignment } from "@/components/candidate/RoleAlignment";
import { ApplicationFlow } from "@/components/candidate/ApplicationFlow";
import { SaveButton } from "@/components/candidate/SaveButton";
import { RoleAppearance } from "@/components/candidate/RoleAppearance";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ROLES.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const role = roleBySlug(slug);
  if (!role) return { title: "Role not found" };
  return {
    title: role.title,
    description: role.summary,
    alternates: { canonical: `/candidates/roles/${role.slug}` },
  };
}

export default async function RolePage({ params }: Params) {
  const { slug } = await params;
  const role = roleBySlug(slug);
  if (!role) notFound();

  const others = ROLES.filter(
    (r) => r.slug !== role.slug && r.functionId === role.functionId,
  ).slice(0, 2);

  return (
    <>
      {/* --- Masthead ------------------------------------------------------ */}
      <header className="wrap pt-32 pb-14 md:pt-40 md:pb-20">
        <Reveal className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/candidates/roles"
            className="mono-micro text-fg-45 transition-colors duration-300 hover:text-fg-80"
          >
            ← All roles
          </Link>
          <span className="mono-micro text-fg-30" aria-hidden="true">
            /
          </span>
          <span className="mono-micro text-signal">
            {labelFor(FUNCTIONS, role.functionId)}
          </span>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="display max-w-4xl text-(length:--text-h1) text-balance">
            {role.title}
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 text-(length:--text-lede) leading-[1.45] text-fg-60">
            {role.company}
          </p>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#apply"
              className="inline-flex items-center gap-3 rounded-full bg-signal px-7 py-3.5 text-[0.95rem] font-medium text-paper-50 transition-colors duration-300 hover:bg-signal-600"
            >
              Apply for this role <span aria-hidden="true">↓</span>
            </a>
            <SaveButton slug={role.slug} withLabel className="px-5 py-3 text-[0.9rem]" />
          </div>
        </Reveal>

        {/* Facts, including the band. Always. */}
        <Reveal delay={0.22}>
          <dl className="mt-14 grid gap-px overflow-hidden rounded-lg border border-current/12 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Compensation" value={formatCompensation(role.compensation)} accent />
            <Fact label="Level" value={labelFor(EXPERIENCE_BANDS, role.bandId)} />
            <Fact
              label="Where"
              value={role.locationIds.map((l) => labelFor(LOCATIONS, l)).join(" · ")}
            />
            <Fact
              label="Work model"
              value={role.workModelIds.map((w) => labelFor(WORK_MODELS, w)).join(" / ")}
            />
            <Fact label="Team" value={role.teamSize} />
            <Fact label="Reports to" value={role.reportsTo} />
            <Fact label="Company stage" value={labelFor(COMPANY_STAGES, role.stageId)} />
            <Fact
              label="Posted"
              value={new Date(role.posted).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
          </dl>
          {role.compensation.note && (
            <p className="mt-5 max-w-2xl text-[0.88rem] leading-[1.6] text-fg-45">
              {role.compensation.note}
            </p>
          )}
        </Reveal>
      </header>

      {/* --- Why this role appears ----------------------------------------- */}
      <Section flush className="pb-(--spacing-section)">
        <div className="wrap">
          <RoleAppearance role={role} />
        </div>
      </Section>

      {/* --- The role ------------------------------------------------------ */}
      <Section tone="paper" aria-labelledby="the-role">
        <div className="wrap grid gap-16 lg:grid-cols-[1fr_1.6fr] lg:gap-24">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="mono-micro text-signal">01</p>
            <h2 id="the-role" className="display mt-5 text-(length:--text-h2) text-balance">
              The role
            </h2>
          </div>
          <div className="flex flex-col gap-16">
            <Prose body={role.theRole} />

            <Block heading="Why this role exists" index="02">
              <Prose body={role.whyExists} />
            </Block>

            <Block heading="What success looks like" index="03">
              <ol className="flex flex-col">
                {role.success.map((s, i) => (
                  // The border classes live on the <li> itself; on the inner
                  // div every item would be "first" within its own wrapper.
                  <Reveal
                    as="li"
                    key={s.heading}
                    delay={i * 0.06}
                    className="border-t border-ink-900/15 py-7 first:border-t-0 first:pt-0"
                  >
                    <div>
                      <p className="mono-micro text-fg-40">{s.heading}</p>
                      <ul className="mt-4 flex flex-col gap-3">
                        {s.body.map((line) => (
                          <li key={line} className="flex gap-4">
                            <span
                              className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-signal"
                              aria-hidden="true"
                            />
                            <span className="text-[1rem] leading-[1.7] text-fg-75">
                              {line}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </Block>

            <Block heading="What we're looking for" index="04">
              <div className="flex flex-col gap-10">
                <Requirements label="Needed" items={role.lookingFor.essential} accent />
                <Requirements label="Helpful, not required" items={role.lookingFor.helpful} />
                <Requirements
                  label="Explicitly not required"
                  items={role.lookingFor.notRequired}
                  muted
                />
              </div>
              <p className="mt-9 text-[0.9rem] leading-[1.65] text-fg-50">
                The third list is there because people rule themselves out of
                roles they would get. If you match the first list, apply.
              </p>
            </Block>

            <Block heading="How you'll work" index="05">
              <div className="flex flex-col gap-9">
                {role.howYouWork.map((s) => (
                  <div key={s.heading}>
                    <p className="mono-micro text-fg-40">{s.heading}</p>
                    <Prose body={s.body} className="mt-4" />
                  </div>
                ))}
              </div>
            </Block>

            <Block heading="What matters here" index="06">
              <ul className="flex flex-col">
                {role.whatMatters.map((line, i) => (
                  <Reveal
                    as="li"
                    key={line}
                    delay={i * 0.06}
                    className="border-t border-ink-900/15 first:border-t-0"
                  >
                    <div className="flex items-baseline gap-5 py-5">
                      <span className="mono-micro text-signal tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[1rem] leading-[1.7] text-fg-75">{line}</span>
                    </div>
                  </Reveal>
                ))}
              </ul>
              <div className="mt-9 flex flex-wrap gap-2.5">
                {role.valueIds.map((v) => (
                  <span
                    key={v}
                    className="mono-micro rounded-full border border-current/20 px-3 py-1.5 leading-none text-fg-55"
                  >
                    {labelFor(VALUES, v)}
                  </span>
                ))}
              </div>
            </Block>

            <Block heading="Where this role could take you" index="07">
              <ul className="flex flex-col gap-4">
                {role.couldTakeYouTo.map((line) => (
                  <li key={line} className="flex gap-4">
                    <span
                      className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-signal"
                      aria-hidden="true"
                    />
                    <span className="text-[1rem] leading-[1.7] text-fg-75">{line}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-7 max-w-xl text-[0.88rem] leading-[1.65] text-fg-50">
                These are directions this role has led to, here or elsewhere.
                None of it is a promise — nobody can promise you a promotion,
                and anyone who does is selling you something.
              </p>
            </Block>

            <Block heading="What to consider" index="08">
              <ul className="flex flex-col gap-5">
                {role.consider.map((line) => (
                  <li
                    key={line}
                    className="border-l-2 border-signal pl-6 text-[1rem] leading-[1.7] text-fg-75"
                  >
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-7 text-[0.9rem] leading-[1.65] text-fg-50">
                Every role on this site has this section. If it were empty we
                would not have read the role properly.
              </p>
            </Block>
          </div>
        </div>
      </Section>

      {/* --- Alignment ----------------------------------------------------- */}
      <Section id="fit" aria-label="Is this role right for me">
        <div className="wrap">
          <RoleAlignment role={role} />
        </div>
      </Section>

      {/* --- Process ------------------------------------------------------- */}
      <Section tone="paper" aria-labelledby="process-heading">
        <div className="wrap">
          <p className="mono-micro text-signal">09</p>
          <h2
            id="process-heading"
            className="display mt-5 max-w-3xl text-(length:--text-h2) text-balance"
          >
            The process, in full,
            <br />
            <span className="italic">before you start it.</span>
          </h2>
          <ol className="mt-16 grid gap-px overflow-hidden rounded-lg border border-ink-900/15 md:grid-cols-2 xl:grid-cols-5">
            {role.process.map((p, i) => (
              <Reveal as="li" key={p.step} delay={i * 0.06}>
                <div className="h-full bg-paper-100 p-6">
                  <p className="mono-micro text-signal tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-4 text-[1rem] leading-snug">{p.step}</p>
                  <p className="mt-2.5 text-[0.88rem] leading-[1.6] text-fg-55">
                    {p.detail}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </Section>

      {/* --- Apply --------------------------------------------------------- */}
      <Section id="apply" aria-labelledby="apply-heading">
        <div className="wrap">
          <h2
            id="apply-heading"
            className="display max-w-2xl text-(length:--text-h2) text-balance"
          >
            Apply, in <span className="italic">six steps.</span>
          </h2>
          <p className="mt-7 max-w-2xl text-(length:--text-lede) leading-[1.45] text-fg-65">
            One question at a time. Nothing is sent until you have read the last
            step and confirmed it.
          </p>
          <div className="mt-14">
            <ApplicationFlow role={role} />
          </div>
        </div>
      </Section>

      {/* --- Related ------------------------------------------------------- */}
      {others.length > 0 && (
        <Section tone="paper" aria-labelledby="others-heading">
          <div className="wrap">
            <h2 id="others-heading" className="display text-(length:--text-h3)">
              Other {labelFor(FUNCTIONS, role.functionId)} roles
            </h2>
            <ul className="mt-10 grid gap-6 lg:grid-cols-2">
              {others.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/candidates/roles/${other.slug}`}
                    className="group block rounded-lg border border-ink-900/15 p-6 transition-colors duration-300 hover:border-ink-900/35 hover:bg-ink-900/[0.03]"
                  >
                    <p className="mono-micro text-fg-40">{other.company}</p>
                    <p className="display mt-3 text-(length:--text-h3) text-balance">
                      {other.title}
                    </p>
                    <p className="mt-4 text-[0.92rem] leading-[1.6] text-fg-60">
                      {other.summary}
                    </p>
                    <p className="mono-micro mt-5 text-signal transition-transform duration-300 ease-(--ease-out-expo) group-hover:translate-x-1">
                      {formatCompensation(other.compensation)} →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}
    </>
  );
}

function Fact({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-ink-900/60 p-5">
      <dt className="mono-micro text-fg-35">{label}</dt>
      <dd
        className={
          accent
            ? "mt-2.5 font-mono text-[1rem] tabular-nums text-signal"
            : "mt-2.5 text-[0.95rem] leading-snug text-fg-80"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function Block({
  heading,
  index,
  children,
}: {
  heading: string;
  index: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-ink-900/15 pt-12">
      <div className="mb-8 flex items-baseline gap-4">
        <span className="mono-micro text-signal tabular-nums">{index}</span>
        <h3 className="display text-(length:--text-h3)">{heading}</h3>
      </div>
      {children}
    </section>
  );
}

function Prose({ body, className }: { body: string[]; className?: string }) {
  return (
    <div className={className}>
      {body.map((paragraph, i) => (
        // The margin sits on the wrapper: each <p> is the first child of its
        // own reveal, so `first:mt-0` on the <p> would zero every one of them.
        <Reveal key={paragraph} delay={i * 0.05} className="mt-6 first:mt-0">
          <p className="max-w-2xl text-(length:--text-body) leading-[1.75] text-fg-75">
            {paragraph}
          </p>
        </Reveal>
      ))}
    </div>
  );
}

function Requirements({
  label,
  items,
  accent = false,
  muted = false,
}: {
  label: string;
  items: string[];
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <p className={accent ? "mono-micro text-signal" : "mono-micro text-fg-40"}>{label}</p>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-4">
            <span
              className={
                accent
                  ? "mt-2.5 h-1 w-1 shrink-0 rounded-full bg-signal"
                  : "mt-2.5 h-1 w-1 shrink-0 rounded-full bg-current/30"
              }
              aria-hidden="true"
            />
            <span
              className={
                muted
                  ? "text-[0.95rem] leading-[1.7] text-fg-55"
                  : "text-[1rem] leading-[1.7] text-fg-75"
              }
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
