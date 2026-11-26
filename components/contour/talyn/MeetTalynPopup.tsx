"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { TALYN } from "@/lib/contour/talyn";
import { VOICE_AGENT_ID } from "@/lib/contour/variant";
import { cx } from "@/lib/utils";
import { TalynOrb } from "./TalynOrb";

/** Fired by any "Ask Talyn" button on the page to open the pop-up. */
export const OPEN_TALYN = "talyn:open";

const SEEN = "buddy-popup-seen";
const noop = () => () => {};
const AUTO_AFTER_MS = 6000;

const read = () => {
  try {
    return window.sessionStorage.getItem(SEEN) === "1";
  } catch {
    return false;
  }
};
const remember = () => {
  try {
    window.sessionStorage.setItem(SEEN, "1");
  } catch {
    /* private mode: it may show again on the next page, which is fine */
  }
};

/**
 * "Got a hiring problem? Buddy is here to help." A small, non-modal card in the
 * corner of the Talyn editions. It opens by itself once per visit — after a few
 * seconds or once the reader starts scrolling — and folds into a launcher when
 * closed. On phones only the launcher shows until it is tapped. It never covers
 * the enquiry form, never takes focus when it opens by itself, and closes with
 * Escape.
 *
 * The answers are written copy about how Talyn helps, not a live chat: nothing
 * chosen here is sent anywhere. The calls to action go to the enquiry form.
 * Without script nothing renders, and the page's own buttons do the same job.
 */
export function MeetTalynPopup() {
  // Client only: without script there is no pop-up (the page's own buttons do the job).
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const launcher = useRef<HTMLButtonElement | null>(null);
  const id = useId();
  const p = TALYN.popup;

  const show = useCallback((focus: boolean) => {
    setOpen(true);
    remember();
    if (focus) window.requestAnimationFrame(() => panel.current?.focus());
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    remember();
    window.requestAnimationFrame(() => launcher.current?.focus());
  }, []);

  // Open once per visit: after a pause, or once the reader scrolls a screen.
  // On phones the card would cover the page, so only the launcher shows there.
  useEffect(() => {
    if (read() || window.matchMedia("(max-width: 640px)").matches) return;
    let done = false;
    const auto = () => {
      if (done) return;
      done = true;
      cleanup();
      show(false);
    };
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.9) auto();
    };
    const timer = window.setTimeout(auto, AUTO_AFTER_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }
    return cleanup;
  }, [show]);

  // "Ask Talyn" buttons elsewhere on the page.
  useEffect(() => {
    const onOpen = () => show(true);
    window.addEventListener(OPEN_TALYN, onOpen);
    return () => window.removeEventListener(OPEN_TALYN, onOpen);
  }, [show]);

  // Step aside while the enquiry form is on screen.
  useEffect(() => {
    const form = document.getElementById("enquiry");
    if (!form) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), { rootMargin: "0px 0px -20% 0px" });
    io.observe(form);
    return () => io.disconnect();
  }, []);

  if (!ready) return null;

  return (
    <div className={cx("tl-pop", VOICE_AGENT_ID && "has-voice", hidden && "is-away")} aria-hidden={hidden || undefined} inert={hidden || undefined}>
      {open ? (
        <div
          ref={panel}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${id}-title`}
          tabIndex={-1}
          className="tl-pop-card"
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
        >
          <div className="tl-pop-head">
            <TalynOrb size="sm" />
            <p className="tl-pop-label">{p.label}</p>
            <button type="button" className="tl-pop-x" onClick={close} aria-label={p.close}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p id={`${id}-title`} className="tl-pop-title">
            {p.title}
          </p>
          <p className="tl-pop-body">{p.body}</p>

          <p className="tl-pop-ask">{p.ask}</p>
          <div className="tl-pop-chips">
            {p.problems.map((q, i) => (
              <button key={q.label} type="button" className="tl-pop-chip" aria-pressed={pick === i} onClick={() => setPick(pick === i ? null : i)}>
                {q.label}
              </button>
            ))}
          </div>
          <div aria-live="polite">
            {pick !== null && (
              <div className="tl-pop-answer" key={pick}>
                <p className="tl-pop-helps">{p.helps}</p>
                <p>{p.problems[pick].answer}</p>
              </div>
            )}
          </div>

          <div className="tl-pop-actions">
            <a href="#enquiry" className="ct-btn ct-btn-primary" onClick={() => setOpen(false)}>
              {p.primary}
              <span className="ct-btn-arrow" aria-hidden="true">
                →
              </span>
            </a>
            <a href="#meet-buddy" className="ct-btn ct-btn-secondary" onClick={() => setOpen(false)}>
              {p.secondary}
            </a>
          </div>
        </div>
      ) : (
        <button ref={launcher} type="button" className="tl-pop-launch" onClick={() => show(true)} aria-haspopup="dialog">
          <TalynOrb size="xs" />
          <span>
            <span className="tl-pop-launch-q">{p.launcher}</span> <b>{p.launcherCta}</b>
          </span>
        </button>
      )}
    </div>
  );
}

/** An "Ask Talyn" button that opens the pop-up. */
export function AskTalynButton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <button type="button" className={cx("ct-btn ct-btn-secondary", className)} onClick={() => window.dispatchEvent(new Event(OPEN_TALYN))}>
      {children}
    </button>
  );
}
