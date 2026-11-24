import { TAGLINE } from "@/lib/contour/content";
import { TALYN } from "@/lib/contour/talyn";
import { EMAIL } from "@/lib/contour/site";
import { ButtonLink, Eyebrow, Headline, SectionHead } from "@/components/contour/ui";
import { ContactForm } from "@/components/contour/ContactForm";
import { Play } from "./Play";
import { TourNav } from "./TourNav";
import { CandidateScorecard, MODULE_WIDGET, RoleInsightsPanel, TalynConsole } from "./Widgets";
import { cx } from "@/lib/utils";
import type { CSSProperties } from "react";
import { AskTalynButton } from "./MeetTalynPopup";
import { TalynOrb } from "./TalynOrb";

/**
 * The Talyn editions' homepage sections. Both editions use these; the film
 * edition opens with the scroll-flipped film, the product edition with the
 * Talyn console and the seven-step strip.
 */

const pad = (n: number) => String(n).padStart(2, "0");

/* --- Hero (product edition) ------------------------------------------------- */

export function TalynHero() {
  const h = TALYN.hero;
  return (
    <section aria-labelledby="talyn-heading" className="tl-hero">
      <div className="ct-wrap grid gap-12 pt-10 pb-14 md:pt-16 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-5">
          <Eyebrow tone="green">{TAGLINE}</Eyebrow>
          <Headline as="h1" id="talyn-heading" lead={h.title} turn={h.titleItalic} size="xl" className="mt-7" />
          <p className="ct-lede mt-7 max-w-xl">{h.lede}</p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href="#enquiry">{h.primary}</ButtonLink>
            <ButtonLink href="#enquiry" variant="secondary" arrow="none">
              {h.secondary}
            </ButtonLink>
          </div>
        </div>
        <div className="lg:col-span-7">
          <Play auto>
            <TalynConsole />
          </Play>
        </div>
      </div>
      <div className="ct-wrap pb-6">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-5 md:grid-cols-4">
          {h.pillars.map((p, i) => (
            <li key={p} className="flex items-baseline gap-3">
              <span className="ct-meta ct-green tabular-nums">{pad(i + 1)}</span>
              <span className="text-[0.92rem] text-[var(--ct-ink-2)]">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* --- The problem ---------------------------------------------------------------- */

export function TalynProblem({ index }: { index: string }) {
  const p = TALYN.problem;
  return (
    <section id="problem" aria-labelledby="problem-heading" className="ct-section-tight ct-tint">
      <div className="ct-wrap grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-10">
        <SectionHead index={index} eyebrow={p.eyebrow} id="problem-heading" lead={p.title} turn={p.titleItalic} lede={p.lede} size="m" className="lg:col-span-6" />
        <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-6">
          {p.points.map((pt, i) => (
            <li key={pt.label} className="ct-panel p-5">
              <p className="ct-meta ct-green tabular-nums">{pad(i + 1)}</p>
              <p className="mt-2 text-[1.02rem] font-medium">{pt.label}</p>
              <p className="ct-small mt-1">{pt.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* --- Meet Talyn: the agent that hires for intent ------------------------------------ */

export function TalynMeet({ index }: { index: string }) {
  const m = TALYN.meet;
  return (
    <section id="meet-talyn" aria-labelledby="meet-heading" className="ct-section tl-meet">
      <div className="ct-wrap grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="lg:col-span-6">
          <SectionHead index={index} eyebrow={m.eyebrow} id="meet-heading" lead={m.title} turn={m.titleItalic} lede={m.lede} size="l" />
          <ul className="mt-10 grid gap-5">
            {m.pillars.map((p, i) => (
              <li key={p.label} className="tl-meet-pillar">
                <span className="ct-meta ct-green tabular-nums">{pad(i + 1)}</span>
                <span>
                  <b>{p.label}.</b> {p.body}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href="#enquiry">{m.primary}</ButtonLink>
            <AskTalynButton>{m.secondary}</AskTalynButton>
          </div>
        </div>
        <div className="lg:col-span-6">
          <Play threshold={0.35}>
            <div className="tl-agent">
              <div className="tl-agent-core">
                <TalynOrb size="lg" />
                <p className="tl-agent-name">Talyn</p>
                <p className="ct-meta">AI hiring agent · TALYNT LABS</p>
              </div>
              <p className="tl-agent-status">
                <span className="tw-led is-on" aria-hidden="true" /> {m.status}
              </p>
              <ol className="tl-agent-tasks">
                {m.tasks.map((t, i) => (
                  <li key={t} style={{ "--i": i } as CSSProperties}>
                    <svg viewBox="0 0 24 24" className="tw-ic tw-ok" aria-hidden="true">
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ol>
              <p className="tl-agent-handoff" style={{ "--i": m.tasks.length } as CSSProperties}>
                <span aria-hidden="true">→</span> {m.handoff}
              </p>
              <p className="tl-agent-note">{TALYN.illustrative}</p>
            </div>
          </Play>
        </div>
      </div>
    </section>
  );
}

/* --- How Talyn works: seven steps (product edition) ---------------------------------- */

export function TalynHow({ index }: { index: string }) {
  const h = TALYN.how;
  return (
    <section id="how" aria-labelledby="how-heading" className="ct-section-tight scroll-mt-[var(--ct-nav-h)]">
      <div className="ct-wrap">
        <SectionHead index={index} eyebrow={h.eyebrow} id="how-heading" lead={h.title} turn={h.titleItalic} size="m" />
        <Play className="mt-12">
          <ol className="tl-steps">
            {h.steps.map((s, i) => (
              <li key={s.id} className="tl-step" style={{ ["--i" as string]: i }}>
                <span className="tl-step-node">{pad(i + 1)}</span>
                <h3 className="ct-display tl-step-title">{s.title}</h3>
                <p className="ct-small tl-step-body">{s.body}</p>
              </li>
            ))}
          </ol>
        </Play>
      </div>
    </section>
  );
}

/* --- Talyn Insights ----------------------------------------------------------------------- */

export function TalynInsights({ index }: { index: string }) {
  const s = TALYN.insights;
  return (
    <section id="insights" aria-labelledby="insights-heading" className="ct-section-tight ct-tint scroll-mt-[var(--ct-nav-h)]">
      <div className="ct-wrap">
        <SectionHead index={index} eyebrow={s.eyebrow} id="insights-heading" lead={s.title} turn={s.titleItalic} lede={s.lede} size="m" className="max-w-4xl" />

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="lg:col-span-5">
            <p className="ct-meta ct-green">{s.role.name}</p>
            <h3 className="ct-display ct-s mt-3">{s.role.title}</h3>
            <dl className="tl-list mt-6">
              {s.role.items.map((it) => (
                <div key={it.label} className={cx("soon" in it && it.soon && "is-soon")}>
                  <dt>
                    {it.label}
                    {"soon" in it && it.soon && <span className="tl-soon">{TALYN.soon}</span>}
                  </dt>
                  <dd>{it.body}</dd>
                </div>
              ))}
            </dl>
          </div>
          <Play className="lg:col-span-7 lg:sticky lg:top-[calc(var(--ct-nav-h)+2rem)]">
            <RoleInsightsPanel />
          </Play>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-10">
          <Play className="order-2 lg:order-1 lg:col-span-7 lg:sticky lg:top-[calc(var(--ct-nav-h)+2rem)]">
            <CandidateScorecard />
          </Play>
          <div className="order-1 lg:order-2 lg:col-span-5">
            <p className="ct-meta ct-green">{s.candidate.name}</p>
            <h3 className="ct-display ct-s mt-3">{s.candidate.title}</h3>
            <dl className="tl-list mt-6">
              {s.candidate.items.map((it) => (
                <div key={it.label}>
                  <dt>{it.label}</dt>
                  <dd>{it.body}</dd>
                </div>
              ))}
            </dl>
            <ul className="tl-grades mt-6" aria-label="Talent grades">
              {s.candidate.grades.map((g) => (
                <li key={g.grade}>
                  <b>{g.grade}</b>
                  <span>{g.range}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --- Capabilities ---------------------------------------------------------------------------- */

export function TalynCapabilities({ index, tour = false }: { index: string; tour?: boolean }) {
  const c = TALYN.capabilities;
  return (
    <section id="capabilities" aria-labelledby="capabilities-heading" className="ct-section-tight scroll-mt-[var(--ct-nav-h)]">
      <div className="ct-wrap">
        <SectionHead index={index} eyebrow={c.eyebrow} id="capabilities-heading" lead={c.title} turn={c.titleItalic} size="m" />
        <div className={cx("mt-12", tour && "lg:grid lg:grid-cols-12 lg:gap-10")}>
          {tour && (
            <div className="hidden lg:col-span-3 lg:block">
              <TourNav items={c.modules.map((m) => ({ id: `cap-${m.id}`, label: m.title }))} />
            </div>
          )}
          <div className={cx("grid gap-16 lg:gap-24", tour && "lg:col-span-9")}>
            {c.modules.map((m, i) => {
              const Widget = MODULE_WIDGET[m.id];
              const flip = !tour && i % 2 === 1;
              return (
                <article key={m.id} id={`cap-${m.id}`} className="tl-module scroll-mt-[calc(var(--ct-nav-h)+2rem)]">
                  <div className={cx("grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-10")}>
                    <div className={cx("lg:col-span-5", flip && "lg:order-2")}>
                      <p className="ct-meta ct-green tabular-nums">
                        {pad(i + 1)} · {m.title}
                      </p>
                      <h3 className="ct-display ct-m mt-3">{m.line}</h3>
                      <p className="ct-body mt-4">{m.body}</p>
                      {"points" in m && m.points && (
                        <ul className="tl-points mt-5">
                          {m.points.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                          {"soon" in m &&
                            m.soon?.map((p) => (
                              <li key={p} className="is-soon">
                                {p} <span className="tl-soon">{TALYN.soon}</span>
                              </li>
                            ))}
                        </ul>
                      )}
                      {"signals" in m && (
                        <div className="tl-health mt-5">
                          <p className="ct-meta ct-mute">Health bands</p>
                          <ul>
                            {m.health.bands.map((b) => (
                              <li key={b.band}>
                                <b>{b.band}</b> {b.range}
                              </li>
                            ))}
                          </ul>
                          <p className="ct-small mt-3">
                            Candidate health: {m.health.candidate.join(" · ")}. Pipeline health: {m.health.pipeline.join(" · ")}.
                          </p>
                          <p className="ct-small mt-2">Salary benchmarks — {TALYN.soon.toLowerCase()}.</p>
                        </div>
                      )}
                    </div>
                    <Play className={cx("lg:col-span-7", flip && "lg:order-1")}>
                      <Widget />
                    </Play>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --- The difference, who it's for, privacy --------------------------------------------------------- */

export function TalynDifference({ index }: { index: string }) {
  const d = TALYN.difference;
  return (
    <section id="difference" aria-labelledby="difference-heading" className="ct-section-tight ct-tint">
      <div className="ct-wrap">
        <SectionHead index={index} eyebrow={d.eyebrow} id="difference-heading" lead={d.title} turn={d.titleItalic} size="m" />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {d.points.map((p, i) => (
            <li key={p.title} className="ct-panel tl-diff p-5">
              <p className="ct-meta ct-green tabular-nums">{pad(i + 1)}</p>
              <p className="ct-display mt-3 text-[1.3rem] leading-tight">{p.title}</p>
              <p className="ct-small mt-2">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function TalynWho({ index }: { index: string }) {
  const w = TALYN.who;
  return (
    <section id="who" aria-labelledby="who-heading" className="ct-section-tight">
      <div className="ct-wrap grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-5">
          <SectionHead index={index} eyebrow={w.eyebrow} id="who-heading" lead={w.title} turn={w.titleItalic} size="m" />
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Roles we hire for">
            {w.roles.map((r) => (
              <li key={r} className="ct-tag">
                {r}
              </li>
            ))}
          </ul>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3 lg:col-span-7">
          {w.audiences.map((a) => (
            <li key={a.title} className="ct-panel p-6">
              <p className="ct-display text-[1.4rem] leading-tight">{a.title}</p>
              <p className="ct-small mt-2">{a.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function TalynPrivacy({ index }: { index: string }) {
  const p = TALYN.privacy;
  return (
    <section id="privacy-consent" aria-labelledby="privacy-heading" className="ct-section-tight ct-tint">
      <div className="ct-wrap grid gap-10 lg:grid-cols-12 lg:gap-10">
        <SectionHead index={index} eyebrow={p.eyebrow} id="privacy-heading" lead={p.title} turn={p.titleItalic} size="m" className="lg:col-span-5" />
        <ul className="tl-points is-large lg:col-span-7">
          {p.points.map((pt) => (
            <li key={pt}>{pt}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* --- Pricing, FAQ, close ---------------------------------------------------------------------------- */

export function TalynPricing({ index }: { index: string }) {
  const p = TALYN.pricing;
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="ct-section-tight scroll-mt-[var(--ct-nav-h)]">
      <div className="ct-wrap grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-5">
          <Eyebrow index={index}>{p.eyebrow}</Eyebrow>
          <h2 id="pricing-heading" className="ct-display ct-l mt-6">
            {p.title}
          </h2>
          <p className="ct-lede mt-5">{p.lede}</p>
          <div className="mt-8">
            <ButtonLink href="#enquiry">{TALYN.hero.primary}</ButtonLink>
          </div>
        </div>
        <ol className="tl-flow lg:col-span-7">
          {p.steps.map((s, i) => (
            <li key={s}>
              <span className="ct-meta ct-green tabular-nums">{pad(i + 1)}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function TalynFaq({ index }: { index: string }) {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="ct-section-tight ct-tint scroll-mt-[var(--ct-nav-h)]">
      <div className="ct-wrap grid gap-10 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <Eyebrow index={index}>Questions</Eyebrow>
          <h2 id="faq-heading" className="ct-display ct-l mt-6">
            Asked, <span className="ct-italic">and answered.</span>
          </h2>
        </div>
        <div className="tl-faq lg:col-span-8">
          {TALYN.faq.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TalynClose() {
  const c = TALYN.close;
  return (
    <section id="enquiry" aria-labelledby="enquiry-heading" className="ct-section scroll-mt-[var(--ct-nav-h)]">
      <div className="ct-wrap grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <Eyebrow tone="green">{TAGLINE}</Eyebrow>
          <Headline id="enquiry-heading" lead={c.title} turn={c.titleItalic} className="mt-6" />
          <p className="ct-small mt-8">
            Or write to us directly{" "}
            <a href={`mailto:${EMAIL.general}`} className="ct-link">
              {EMAIL.general}
            </a>
          </p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <ContactForm idPrefix="talyn-enquiry" />
        </div>
      </div>
    </section>
  );
}
