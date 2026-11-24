"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { EMPLOYER_HERO, FILM } from "@/lib/contour/proposed";
import { TALYN } from "@/lib/contour/talyn";
import { HUMAN_AI, PROBLEM } from "@/lib/contour/content";
import { ROUTES } from "@/lib/contour/site";
import { useCalm } from "@/lib/contour/motion";
import { WhatsAppIcon } from "@/components/contour/chrome/Icons";
import { cx } from "@/lib/utils";

/**
 * The homepage of the employer-only colourways: one screen that never scrolls
 * away. Each turn of the wheel (or swipe, or arrow key) flips it to the next
 * scene — the brief and the one click, the search across every source, the
 * few who fit, the outreach on WhatsApp and email, the relationship kept warm,
 * the follow-ups through every stage, and the decision that stays human.
 *
 * Mechanics: the section is as tall as its scenes; the stage inside is pinned,
 * and the scroll position only chooses which scene is showing. Proximity
 * snapping settles the scroll on a scene. Each scene's inner animation (film.css)
 * plays when it arrives and its resting state is the end state, so with
 * reduced motion — or before script runs — every scene simply shows its result.
 */

const N = FILM.scenes.length;
type State = "past" | "active" | "next";
const stateOf = (i: number, active: number): State => (i < active ? "past" : i === active ? "active" : "next");

/** A small set of line icons for the screens. */
function Glyph({ name, className }: { name: "mail" | "chat" | "call" | "doc" | "check" | "bell" | "search" | "user"; className?: string }) {
  const paths: Record<string, ReactNode> = {
    mail: (
      <>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
        <path d="m4.5 7 7.5 6 7.5-6" />
      </>
    ),
    chat: <path d="M5 18.5 6 15a7 7 0 1 1 3 3l-4 .5Z" />,
    call: <path d="M7 4.5h3l1.5 4-2 1.5a10 10 0 0 0 4.5 4.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 5 6.5a2 2 0 0 1 2-2Z" />,
    doc: (
      <>
        <path d="M7 3.5h7l4 4v13H7Z" />
        <path d="M10 12h5M10 15.5h5" />
      </>
    ),
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    bell: (
      <>
        <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5Z" />
        <path d="M10 20.5h4" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="M14.6 14.6 20 20" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className={cx("ct-glyph", className)} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const CHANNEL: Record<string, "mail" | "chat" | "call"> = { WhatsApp: "chat", Email: "mail", Call: "call" };
const v = (o: Record<string, string | number>) => o as CSSProperties;

/* --- The screens on the laptop -------------------------------------------- */

function ScreenBrief() {
  const b = FILM.brief;
  return (
    <div className="fs-app">
      <div className="fs-side">
        <span className="fs-mark" />
        {b.nav.map((n, i) => (
          <span key={n} className={cx("fs-nav", i === 0 && "is-on")}>
            {n}
          </span>
        ))}
      </div>
      <div className="fs-main">
        <p className="fs-eyebrow">{b.eyebrow}</p>
        <p className="fs-title">{b.role}</p>
        <p className="fs-muted">{b.meta}</p>
        <div className="fs-needs">
          {b.needs.map((n, i) => (
            <span key={n} className="fs-chip fs-in" style={v({ "--d": `${0.15 + i * 0.12}s` })}>
              {n}
            </span>
          ))}
        </div>
        <div className="fs-cta-row">
          <span className="fs-cta">
            <span className="fs-cta-idle">
              <Glyph name="search" /> {b.button}
            </span>
            <span className="fs-cta-busy">{b.busy}</span>
            <span className="fs-ripple" />
          </span>
        </div>
        <svg viewBox="0 0 24 24" className="fs-cursor" aria-hidden="true">
          <path d="M5 3l14 8-6 1.5L10 19Z" fill="#fff" stroke="#111" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/** The sources sit on a ring around TALYNT; the dots stream in from each. */
const RING = FILM.sources.map((_, i) => {
  const a = (i / FILM.sources.length) * Math.PI * 2 - Math.PI / 2;
  return { x: 50 + Math.cos(a) * 34, y: 44 + Math.sin(a) * 30 };
});

function ScreenSearch() {
  return (
    <div className="fs-search">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="fs-lines" aria-hidden="true">
        {RING.map((p, i) => (
          <line key={i} x1={p.x} y1={p.y} x2="50" y2="44" style={v({ "--d": `${0.2 + i * 0.15}s` })} />
        ))}
      </svg>
      {RING.map((p, i) => (
        <span key={`d${i}`}>
          {[0, 1, 2].map((k) => (
            <span
              key={k}
              className="fs-dot"
              style={v({ "--sx": `${p.x}%`, "--sy": `${p.y}%`, "--d": `${0.6 + i * 0.15 + k * 0.5}s` })}
            />
          ))}
        </span>
      ))}
      {FILM.sources.map((s, i) => (
        <span key={s} className="fs-source fs-in" style={v({ left: `${RING[i].x}%`, top: `${RING[i].y}%`, "--d": `${0.1 + i * 0.15}s` })}>
          <span className="fs-source-dot" />
          {s}
        </span>
      ))}
      <span className="fs-hub">
        <span className="fs-mark" />
      </span>
      <div className="fs-ticker">
        {PROBLEM.funnel.slice(0, 4).map((f, i) => (
          <span key={f.label} className={cx("fs-tick", i === 3 && "is-last")} style={v({ "--d": `${0.5 + i * 1.1}s`, "--o": `${1.6 + i * 1.1}s` })}>
            <b>{f.value}</b> {f.label.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScreenRelevant() {
  return (
    <div className="fs-relevant">
      <div className="fs-noise">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="fs-noise-row" style={v({ "--d": `${(i % 7) * 0.05}s`, "--w": `${40 + ((i * 37) % 45)}%` })} />
        ))}
      </div>
      <p className="fs-eyebrow fs-in" style={v({ "--d": "0.6s" })}>
        {FILM.shortlist.header}
      </p>
      <div className="fs-cards">
        {FILM.shortlist.people.map((p, i) => (
          <div key={p.initials} className="fs-card fs-rise" style={v({ "--d": `${0.75 + i * 0.15}s` })}>
            <span className="fs-avatar">{p.initials}</span>
            <span className="fs-card-line">{p.line}</span>
            <span className="fs-score">{["96 · A+", "91 · A", "84 · A", "81 · A"][i]}</span>
            {p.reasons.map((r) => (
              <span key={r} className="fs-reason">
                <Glyph name="check" /> {r}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenOutreach() {
  const o = FILM.outreach;
  return (
    <div className="fs-mail">
      <p className="fs-eyebrow">
        <Glyph name="mail" /> {o.compose}
      </p>
      <p className="fs-field">
        <span>To</span> {o.to}
      </p>
      <p className="fs-field">
        <span>Subject</span> <b className="fs-type" style={v({ "--d": "0.3s", "--t": "0.9s" })}>{o.subject}</b>
      </p>
      <div className="fs-body">
        {o.lines.map((l, i) => (
          <p key={i} className="fs-type" style={v({ "--d": `${1.2 + i * 0.75}s`, "--t": "0.75s" })}>
            {l}
          </p>
        ))}
      </div>
      <span className="fs-send">
        <span className="fs-send-idle">{o.send}</span>
        <span className="fs-send-done">
          <Glyph name="check" /> {o.sent}
        </span>
      </span>
    </div>
  );
}

function ScreenNurture() {
  const n = FILM.nurture;
  return (
    <div className="fs-nurture">
      <div className="fs-person">
        <span className="fs-avatar">AK</span>
        <div>
          <p className="fs-title fs-title-s">{n.who}</p>
          <p className="fs-muted">
            {n.warmth} · <b className="fs-warm">{n.warm}</b>
          </p>
        </div>
        <span className="fs-meter">
          <span className="fs-meter-fill" />
        </span>
      </div>
      <ol className="fs-timeline">
        {n.steps.map((s, i) => (
          <li key={i} className="fs-in" style={v({ "--d": `${0.35 + i * 0.32}s` })}>
            <span className="fs-step-icon">
              <Glyph name={CHANNEL[s.channel] ?? "doc"} />
            </span>
            <span className="fs-step-channel">{s.channel}</span>
            <span>{s.text}</span>
            <Glyph name="check" className="fs-step-check" />
          </li>
        ))}
      </ol>
    </div>
  );
}

function ScreenFollowUp() {
  const p = FILM.pipeline;
  // Three candidates each move one stage on while the screen is watched.
  const cards = [
    { col: 1, initials: "AK", d: "0.7s" },
    { col: 2, initials: "RS", d: "1.5s" },
    { col: 3, initials: "MN", d: "2.3s" },
  ];
  return (
    <div className="fs-pipeline">
      <div className="fs-cols">
        {p.stages.map((s, i) => (
          <div key={s} className="fs-col">
            <span className="fs-col-head">{s}</span>
            {cards
              .filter((c) => c.col === i)
              .map((c) => (
                <span key={c.initials} className="fs-pcard fs-move" style={v({ "--d": c.d })}>
                  <span className="fs-avatar fs-avatar-s">{c.initials}</span>
                  <span className="fs-pline" />
                </span>
              ))}
            {i === 0 && (
              <>
                <span className="fs-pcard is-ghost" />
                <span className="fs-pcard is-ghost" />
              </>
            )}
            {i === 4 && <span className="fs-pcard is-ghost" />}
          </div>
        ))}
      </div>
      <div className="fs-toasts">
        {p.nudges.map((t, i) => (
          <span key={t} className="fs-toast fs-pop" style={v({ "--d": `${0.9 + i * 0.8}s` })}>
            <Glyph name="bell" /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function ScreenDecide() {
  return (
    <div className="fs-decide">
      <p className="fs-eyebrow fs-in" style={v({ "--d": "0.1s" })}>
        <Glyph name="check" /> {FILM.decide.header}
      </p>
      {FILM.shortlist.people.map((p, i) => (
        <div key={p.initials} className="fs-row fs-in" style={v({ "--d": `${0.3 + i * 0.18}s` })}>
          <span className="fs-avatar fs-avatar-s">{p.initials}</span>
          <span className="fs-row-text">
            <b>{p.line}</b>
            <span>{p.reasons.join(" · ")}</span>
          </span>
          <span className="fs-review">{FILM.decide.review}</span>
        </div>
      ))}
    </div>
  );
}

const SCREENS = [ScreenBrief, ScreenSearch, ScreenRelevant, ScreenOutreach, ScreenNurture, ScreenFollowUp, ScreenDecide];

/* --- The phone, for WhatsApp and the calendar ------------------------------ */

function Phone({ active }: { active: number }) {
  const o = FILM.outreach;
  const n = FILM.nurture;
  return (
    <div className="ct-phone" data-on={active === 3 || active === 4 ? "true" : "false"}>
      <div className="ct-phone-screen">
        <div className="fp-head">
          <span className="fp-avatar">
            <WhatsAppIcon className="h-[1.1em] w-[1.1em]" />
          </span>
          <span>
            <b>{o.chat}</b>
            <span>{o.channel}</span>
          </span>
        </div>
        <div className="fp-body" data-scene={active === 4 ? "nurture" : "outreach"}>
          <div className="fp-chat">
            <p className="fp-bubble is-out">
              {o.out}
              <span className="fp-ticks">✓✓</span>
            </p>
            <p className="fp-typing">
              <span />
              <span />
              <span />
            </p>
            <p className="fp-bubble is-in">{o.reply}</p>
          </div>
          <div className="fp-invite">
            <span className="fp-invite-icon">
              <Glyph name="call" />
            </span>
            <b>{n.invite}</b>
            <span>{n.when}</span>
            <span className="fp-accepted">
              <Glyph name="check" /> {n.accepted}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- The film -------------------------------------------------------------- */

type Card = { id: string; tag: string; title: string; titleItalic: string; body: string; primary?: string; secondary?: string };

/** The scene cards: the original film's words, or the Talyn edition's. */
function cardsFor(talyn: boolean): Card[] {
  if (talyn) return FILM.scenes.map((s, i) => ({ id: s.id, ...TALYN.film[i] }));
  return FILM.scenes.map((s, i) => ({
    id: s.id,
    tag: i === 0 ? FILM.eyebrow : s.tag,
    title: i === 0 ? EMPLOYER_HERO.title : i === N - 1 ? HUMAN_AI.title : "title" in s ? s.title : "",
    titleItalic: i === 0 ? EMPLOYER_HERO.titleItalic : i === N - 1 ? HUMAN_AI.titleItalic : "titleItalic" in s ? s.titleItalic : "",
    body: s.body,
    ...("primary" in s ? { primary: s.primary, secondary: s.secondary } : {}),
  }));
}

export function HiringFilm({ talyn = false }: { talyn?: boolean } = {}) {
  const cards = cardsFor(talyn);
  const calm = useCalm();
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const t = -el.getBoundingClientRect().top / window.innerHeight;
      setActive(Math.min(N - 1, Math.max(0, Math.floor(t + 0.45))));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const go = useCallback(
    (i: number) => {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + i * window.innerHeight, behavior: calm ? "auto" : "smooth" });
    },
    [calm],
  );

  return (
    <section ref={ref} id="film" aria-labelledby="film-heading" className="ct-film" style={{ height: `calc(${N} * 100svh)` }}>
      {FILM.scenes.map((s, i) => (
        <span key={s.id} aria-hidden="true" className="ct-film-snap" style={{ top: `calc(${i} * 100svh)` }} />
      ))}

      <div className={cx("ct-film-stage", talyn && "is-talyn")} data-scene={FILM.scenes[active].id}>
        <div className="ct-film-glow" aria-hidden="true" />

        <div className="ct-wrap ct-film-grid">
          {/* The words: one scene at a time, flipping like title cards. */}
          <div className="ct-film-copy">
            {cards.map((s, i) => {
              const Heading = i === 0 ? "h1" : "h2";
              return (
                <article key={s.id} className="ct-film-card" data-state={stateOf(i, active)} onFocusCapture={() => i !== active && go(i)}>
                  <p className="ct-meta flex items-center gap-3">
                    <span className="ct-green tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span aria-hidden="true" className="h-px w-6 bg-[var(--ct-line-2)]" />
                    <span className="ct-mute">{s.tag}</span>
                  </p>
                  <Heading id={i === 0 ? "film-heading" : undefined} className={cx("ct-display ct-film-title", i === 0 && "is-lead")}>
                    {s.title} <span className="ct-italic block">{s.titleItalic}</span>
                  </Heading>
                  <p className="ct-lede ct-film-body">{s.body}</p>
                  {s.primary && (
                    <div className="mt-7 flex flex-wrap gap-3">
                      <a href="#enquiry" className="ct-btn ct-btn-primary">
                        {s.primary} <span aria-hidden="true">→</span>
                      </a>
                      {talyn ? (
                        <a href="#enquiry" className="ct-btn ct-btn-secondary">
                          {s.secondary}
                        </a>
                      ) : (
                        <Link href={ROUTES.approach} className="ct-btn ct-btn-secondary">
                          {s.secondary}
                        </Link>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* The laptop, and the phone beside it. */}
          <div className="ct-film-device" role="img" aria-label={`${FILM.label}. ${cards[active].tag}.`}>
            <div className="ct-laptop" aria-hidden="true">
              <div className="ct-laptop-lid">
                <div className="ct-laptop-screen">
                  <div className="fs-bar">
                    <span className="fs-lights">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>
                      {FILM.brief.app} <span className="fs-illus lg:hidden">· Illustrative</span>
                    </span>
                    <span className="fs-step">
                      {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="fs-viewport">
                    {SCREENS.map((Screen, i) => (
                      <div key={i} className="ct-screen" data-state={stateOf(i, active)}>
                        <Screen />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="ct-laptop-base" />
            </div>
            <div aria-hidden="true">
              <Phone active={active} />
            </div>
            <p className="ct-film-label" aria-hidden="true">
              {FILM.label}
            </p>
          </div>
        </div>

        {/* Where you are; and a way to any scene. */}
        <nav aria-label={FILM.nav} className="ct-film-dots">
          {FILM.scenes.map((s, i) => (
            <button key={s.id} type="button" onClick={() => go(i)} aria-current={i === active ? "step" : undefined} aria-label={`${String(i + 1).padStart(2, "0")} · ${s.tag}`}>
              <span />
            </button>
          ))}
        </nav>
        <p className="ct-film-hint" data-on={active === 0 ? "true" : "false"} aria-hidden="true">
          Scroll
          <span />
        </p>
      </div>
    </section>
  );
}
