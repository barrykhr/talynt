"use client";

import { useId, useRef, useState } from "react";
import { CANDIDATES, PIPELINE, ROLE_CONTEXT } from "@/lib/candidates";
import { CONVERSATION_SIGNALS, TRANSCRIPT, type SignalId } from "@/lib/conversation";
import { CONVERSATION, INTELLIGENCE, VISIBILITY } from "@/lib/contour/content";
import { Illustrative, Reading } from "@/components/contour/ui";
import { cx } from "@/lib/utils";

/**
 * TALYNT OS, shown in this direction's language.
 *
 * Three views of the same illustrative search: the shortlist with reasoning
 * attached, the conversation the reasoning came from, and what the client
 * sees. Every reference and figure is the fictional content the live site
 * already uses — and the window says so, in its own frame, not in a footnote.
 */

const TABS = [
  { id: "shortlist", label: "Shortlist" },
  { id: "conversation", label: "Conversation" },
  { id: "client", label: "Client view" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** A single view in its own window, for pages that tell one part of the story. */
export function ProductWindow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ct-window">
      <div className="ct-window-bar">
        <span className="ct-meta text-[var(--ct-ink-2)]">Talynt OS · {title}</span>
        <span className="ct-meta ct-mute flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-2 w-2 rounded-[2px] border border-dashed ct-b-mute" />
          Illustrative
        </span>
      </div>
      {children}
    </div>
  );
}

export function ProductShowcase({ initial = "shortlist" }: { initial?: TabId }) {
  const [tab, setTab] = useState<TabId>(initial);
  const base = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKey(e: React.KeyboardEvent, i: number) {
    const keys: Record<string, number> = {
      ArrowRight: (i + 1) % TABS.length,
      ArrowLeft: (i - 1 + TABS.length) % TABS.length,
      Home: 0,
      End: TABS.length - 1,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const next = keys[e.key];
    setTab(TABS[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div className="ct-window">
      <div className="ct-window-bar">
        <span className="flex items-center gap-3">
          <span aria-hidden="true" className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--ct-line-2)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--ct-line-2)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--ct-line-2)]" />
          </span>
          <span className="ct-meta text-[var(--ct-ink-2)]">Talynt OS</span>
        </span>
        <span className="ct-meta ct-mute flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-2 w-2 rounded-[2px] border border-dashed ct-b-mute" />
          Illustrative
        </span>
      </div>

      <div role="tablist" aria-label="TALYNT OS views" className="ct-rail flex gap-1 overflow-x-auto border-b px-3 pt-2">
        {TABS.map((t, i) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              id={`${base}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={cx(
                "relative min-h-11 shrink-0 px-3.5 text-[0.9rem] transition-colors",
                selected ? "text-[var(--ct-ink)]" : "text-[var(--ct-mute)] hover:text-[var(--ct-ink)]",
              )}
            >
              {t.label}
              <span
                aria-hidden="true"
                className="absolute inset-x-2 -bottom-px h-[2px] rounded-full transition-opacity"
                style={{ backgroundColor: "var(--ct-green)", opacity: selected ? 1 : 0 }}
              />
            </button>
          );
        })}
      </div>

      {TABS.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={tab !== t.id}
          tabIndex={0}
          className="outline-none"
        >
          {tab === t.id && t.id === "shortlist" && <Shortlist />}
          {tab === t.id && t.id === "conversation" && <Conversation />}
          {tab === t.id && t.id === "client" && <ClientView />}
        </div>
      ))}
    </div>
  );
}

function Shortlist() {
  const [activeId, setActiveId] = useState(CANDIDATES[0].id);
  const c = CANDIDATES.find((x) => x.id === activeId) ?? CANDIDATES[0];

  return (
    <div className="grid min-w-0 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
      <div className="min-w-0 border-b bg-[var(--ct-bg)] lg:border-r lg:border-b-0">
        <div className="border-b px-4 py-4">
          <p className="ct-meta ct-green">{ROLE_CONTEXT.title}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
            {ROLE_CONTEXT.facts.map((f) => (
              <div key={f.label}>
                <dt className="ct-meta ct-mute">{f.label}</dt>
                <dd className="mt-0.5 text-[0.82rem] text-[var(--ct-ink-2)]">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="ct-meta ct-mute flex justify-between px-4 pt-4">
          <span>Shortlist</span>
          <span className="tabular-nums">{CANDIDATES.length}</span>
        </p>
        <ul className="ct-rail flex gap-2 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
          {CANDIDATES.map((x) => {
            const on = x.id === activeId;
            return (
              <li key={x.id} className="w-[14rem] shrink-0 lg:w-auto">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActiveId(x.id)}
                  className={cx(
                    "w-full rounded-[var(--ct-r-m)] border px-3.5 py-3 text-left transition-colors",
                    on ? "ct-b-green bg-[var(--ct-green-wash)]" : "ct-hb-ink bg-[var(--ct-surface)]",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[0.92rem]">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: on ? "var(--ct-signal)" : "var(--ct-ink)" }}
                      />
                      {x.ref}
                    </span>
                    <span className="ct-meta ct-mute text-[0.62rem]">{x.status}</span>
                  </span>
                  <span className="mt-1 block text-[0.8rem] text-[var(--ct-mute)]">{x.headline}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="min-w-0 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="ct-display ct-m">{c.ref}</h3>
            <p className="ct-small mt-1">
              {c.headline} · {c.location} · {c.tenure}
            </p>
          </div>
          <ul className="flex flex-wrap gap-1.5" aria-label="Skills">
            {c.skills.map((s) => (
              <li key={s} className="ct-tag">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-7 grid gap-7 xl:grid-cols-2">
          <div>
            <p className="ct-meta ct-mute">Candidate intelligence</p>
            <ul className="mt-3">
              {c.signals.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-4 border-t py-2.5 first:border-t-0">
                  <span className="text-[0.88rem] text-[var(--ct-ink-2)]">{s.label}</span>
                  <Reading strength={s.strength} />
                </li>
              ))}
            </ul>
          </div>

          <section className="rounded-[var(--ct-r-m)] bg-[var(--ct-bg-2)] p-5" aria-label={`Why we are recommending ${c.ref}`}>
            <h4 className="ct-meta ct-green">{INTELLIGENCE.reasoningLabel}</h4>
            <ul className="mt-4 flex flex-col gap-3">
              {c.reasoning.map((line) => (
                <li key={line} className="flex gap-3 text-[0.9rem] leading-[1.6]">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-[2px] bg-[var(--ct-green)]" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-5 border-t ct-b2 pt-4">
              <p className="ct-meta ct-mute">{INTELLIGENCE.watchLabel}</p>
              <p className="mt-2 text-[0.88rem] leading-[1.6] text-[var(--ct-ink-2)]">
                <span className="ct-mark">{c.watchFor}</span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function Conversation() {
  const [active, setActive] = useState<SignalId | null>("motivation");

  return (
    <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="min-w-0 border-b p-5 sm:p-7 lg:border-r lg:border-b-0">
        <p className="ct-meta ct-mute">{CONVERSATION.transcriptLabel}</p>
        <div className="mt-5 flex flex-col gap-6">
          {TRANSCRIPT.map((ex) => {
            const recruiter = ex.speaker === "Recruiter";
            return (
              <div key={ex.timestamp}>
                <p className="ct-meta flex items-baseline gap-3">
                  <span className={recruiter ? "ct-green" : "ct-ink2"}>{ex.speaker}</span>
                  <span className="ct-mute tabular-nums">{ex.timestamp}</span>
                </p>
                <p className={cx("mt-2 text-[0.96rem] leading-[1.7]", recruiter ? "text-[var(--ct-ink-2)]" : "text-[var(--ct-ink)]")}>
                  {ex.segments.map((seg, i) =>
                    seg.signal ? (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={active === seg.signal}
                        onClick={() => setActive(active === seg.signal ? null : seg.signal!)}
                        className={cx(
                          "inline rounded-[3px] text-left underline decoration-dotted decoration-1 underline-offset-[5px] transition-colors [box-decoration-break:clone]",
                          active === seg.signal ? "bg-[var(--ct-lime)] decoration-[var(--ct-green)]" : "hover:bg-[var(--ct-lime-soft)]",
                        )}
                      >
                        {seg.text}
                      </button>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    ),
                  )}
                </p>
              </div>
            );
          })}
        </div>
        <p className="ct-small mt-6 border-t pt-4">{CONVERSATION.transcriptNote}</p>
      </div>

      <div className="min-w-0 p-5 sm:p-7">
        <p className="ct-meta ct-mute">{CONVERSATION.signalsLabel}</p>
        <ul className="mt-3">
          {CONVERSATION_SIGNALS.map((s) => {
            const on = active === s.id;
            return (
              <li key={s.id} className="border-t first:border-t-0">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActive(on ? null : s.id)}
                  className={cx(
                    "w-full rounded-[var(--ct-r-s)] px-2 py-3 text-left transition-colors",
                    on ? "bg-[var(--ct-green-wash)]" : "hover:bg-[var(--ct-bg-2)]",
                  )}
                >
                  <span className="flex items-center justify-between gap-4">
                    <span className="text-[0.9rem] font-medium">{s.label}</span>
                    <Reading strength={s.strength} />
                  </span>
                  <span className="ct-collapse" data-open={on ? "true" : "false"}>
                    <span>
                      <span className="block pt-2 text-[0.86rem] leading-[1.55] text-[var(--ct-ink-2)]">{s.reading}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="ct-small mt-4 border-t pt-4">{CONVERSATION.signalsNote}</p>
      </div>
    </div>
  );
}

export function ClientView() {
  const max = Math.max(...PIPELINE.map((p) => p.count));
  return (
    <div className="p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h3 className="ct-display ct-m">{VISIBILITY.role}</h3>
        <span className="ct-meta ct-green">{VISIBILITY.status}</span>
      </div>

      <ol className="mt-7 grid grid-cols-5 items-end gap-2 sm:gap-4" aria-label="Pipeline">
        {PIPELINE.map((p, i) => {
          const last = i === PIPELINE.length - 1;
          return (
            <li key={p.stage} className="flex flex-col gap-2">
              <span className={cx("font-mono text-[clamp(1.1rem,2.6vw,1.8rem)] leading-none tabular-nums", last && "ct-green")}>
                {p.count}
              </span>
              <span
                aria-hidden="true"
                className="block w-full rounded-[3px]"
                style={{
                  height: `${Math.max(6, (p.count / max) * 96)}px`,
                  backgroundColor: last ? "var(--ct-green)" : "var(--ct-line-2)",
                }}
              />
              <span className="ct-meta ct-mute truncate text-[0.6rem] sm:text-[0.68rem]">{p.stage}</span>
            </li>
          );
        })}
      </ol>

      <div className="mt-7 grid gap-3 sm:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[var(--ct-r-m)] bg-[var(--ct-green-wash)] p-5">
          <p className="ct-meta ct-green">{VISIBILITY.nextLabel}</p>
          <p className="mt-2 text-[0.92rem] leading-[1.6]">{VISIBILITY.next}</p>
        </div>
        <div className="rounded-[var(--ct-r-m)] border p-5">
          <p className="ct-meta ct-mute">{VISIBILITY.daysLabel}</p>
          <p className="mt-2 font-mono text-[1.6rem] leading-none tabular-nums">31</p>
          <p className="ct-small mt-2 text-[0.82rem]">{VISIBILITY.daysHint}</p>
        </div>
      </div>
      <Illustrative className="mt-5">{VISIBILITY.note}</Illustrative>
    </div>
  );
}
