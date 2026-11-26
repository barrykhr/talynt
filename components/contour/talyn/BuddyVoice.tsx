"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { TALYN } from "@/lib/contour/talyn";
import { VOICE_AGENT_ID } from "@/lib/contour/variant";
import { ContactForm } from "@/components/contour/ContactForm";
import { cx } from "@/lib/utils";

/**
 * Meet Buddy: a spoken intake. Buddy greets the visitor out loud, asks what
 * their hiring problem is, answers it, then asks four questions (role,
 * seniority and location, must-haves, start) and builds a brief on screen as
 * they talk. The brief pre-fills the real enquiry form, which sends exactly as
 * it does everywhere else — nothing is sent before the visitor sends it.
 *
 * How it works, honestly:
 * - Buddy's voice is pre-recorded (public/buddy-voice, the same voice as the
 *   ads). The questions are fixed; the reply to the first answer is chosen by
 *   simple keyword matching. There is no language model behind this page.
 * - Answers are heard with the browser's own speech recognition
 *   (SpeechRecognition / webkitSpeechRecognition) where it exists. Every
 *   answer can also be tapped (suggestion chips) or typed.
 * - With an ElevenLabs agent configured (NEXT_PUBLIC_ELEVENLABS_AGENT_ID) the
 *   site also shows its free-form voice agent (VoiceAgent.tsx).
 *
 * Audio only starts after the visitor presses a button. Captions show every
 * word Buddy says. With reduced motion, nothing orbits or pulses.
 */

const V = TALYN.voice;
type LineKey = keyof typeof V.lines;
type StepId = (typeof V.steps)[number]["id"];
const QUESTION: Record<Exclude<StepId, "problem">, LineKey> = { role: "q-role", level: "q-level", must: "q-must", when: "q-when" };
const VOICE_BASE = "/buddy-voice/";

/** The reply to the hiring problem: simple keywords, never a guess dressed up as understanding. */
function ackFor(text: string): LineKey {
  const t = text.toLowerCase();
  if (/(drop|ghost|quiet|disappear|back(ed|s)? out|no.?show|respond|reply|offer)/.test(t)) return "ack-dropout";
  if (/(interview|question|off.?brief|hiring manager|panel)/.test(t)) return "ack-interviews";
  if (/(fit|quality|relevant|wrong|match|skill|right (people|person|candidate)|calibre|caliber)/.test(t)) return "ack-fit";
  if (/(long|slow|time|week|month|fill|fast|quick|speed|urgent|delay)/.test(t)) return "ack-time";
  return "ack-other";
}

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
};

function makeRecognition(): Recognition | null {
  if (typeof window === "undefined") return null;
  const W = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const C = W.SpeechRecognition ?? W.webkitSpeechRecognition;
  if (!C) return null;
  const r = new C();
  r.lang = "en-IN";
  r.interimResults = true;
  r.continuous = false;
  return r;
}

type Phase = "intro" | "speaking" | "listening" | "waiting" | "done";

export function BuddyVoice() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [voiceInput, setVoiceInput] = useState(true);
  const [micOk, setMicOk] = useState(true);
  const [muted, setMuted] = useState(false);
  const [line, setLine] = useState<LineKey>("hello");
  const [said, setSaid] = useState(0); // words of the current line shown so far
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<StepId, string>>>({});
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const [speech, setSpeech] = useState(false);

  const audio = useRef<HTMLAudioElement | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const rec = useRef<Recognition | null>(null);
  const retried = useRef(false);
  const input = useRef<HTMLInputElement | null>(null);
  const queue = useRef<LineKey[]>([]);
  const after = useRef<(() => void) | null>(null);
  const answerRef = useRef<(text: string) => void>(() => {});

  const words = V.lines[line].split(" ");

  // Drive the orb from Buddy's voice: amplitude → --amp on the stage.
  useEffect(() => {
    let raf = 0;
    const data = new Uint8Array(256);
    const tick = () => {
      const a = analyser.current;
      const el = audio.current;
      if (a && el && !el.paused) {
        a.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += Math.abs(v - 128);
        stage.current?.style.setProperty("--amp", Math.min(1, sum / data.length / 28).toFixed(3));
        if (el.duration) setSaid(Math.ceil((el.currentTime / el.duration) * words.length * 1.08));
      } else stage.current?.style.setProperty("--amp", "0");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [words.length]);

  const listen = useCallback(() => {
    setHeard("");
    setTyped("");
    setPhase("listening");
    if (!voiceInput || !micOk) {
      window.requestAnimationFrame(() => input.current?.focus());
      return;
    }
    const r = makeRecognition();
    if (!r) {
      setMicOk(false);
      window.requestAnimationFrame(() => input.current?.focus());
      return;
    }
    rec.current = r;
    let finalText = "";
    r.onspeechstart = () => setSpeech(true);
    r.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText = text;
      }
      setHeard(text);
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "audio-capture") setMicOk(false);
    };
    r.onend = () => {
      setSpeech(false);
      rec.current = null;
      if (finalText.trim()) answerRef.current(finalText.trim());
      else setPhase("waiting");
    };
    try {
      r.start();
    } catch {
      setMicOk(false);
    }
  }, [voiceInput, micOk]);

  const play = useCallback(
    (keys: LineKey[], then: () => void) => {
      queue.current = [...keys];
      after.current = then;
      const next = () => {
        const key = queue.current.shift();
        if (!key) {
          after.current?.();
          return;
        }
        setLine(key);
        setSaid(0);
        setPhase("speaking");
        const el = audio.current;
        if (!el || muted) {
          // Muted: show the whole line, wait a reading beat, carry on.
          setSaid(999);
          window.setTimeout(next, Math.min(4000, 900 + V.lines[key].length * 28));
          return;
        }
        el.src = `${VOICE_BASE}${key}.mp3`;
        el.onended = () => {
          setSaid(999);
          window.setTimeout(next, 250);
        };
        el.play().catch(() => {
          setSaid(999);
          window.setTimeout(next, 1500);
        });
      };
      next();
    },
    [muted],
  );

  const answer = useCallback(
    (text: string) => {
      rec.current?.abort();
      const id = V.steps[step].id;
      setAnswers((a) => ({ ...a, [id]: text }));
      setHeard(text);
      retried.current = false;
      const nextStep = step + 1;
      if (nextStep >= V.steps.length) {
        play(["wrap"], () => setPhase("done"));
        return;
      }
      setStep(nextStep);
      const q = QUESTION[V.steps[nextStep].id as Exclude<StepId, "problem">];
      play(step === 0 ? [ackFor(text), q] : [q], listen);
    },
    [step, play, listen],
  );
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  // Nothing heard: ask once more, then wait for a tap or typing.
  useEffect(() => {
    if (phase !== "waiting" || !voiceInput || !micOk || retried.current) return;
    retried.current = true;
    play(["again"], listen);
  }, [phase, voiceInput, micOk, play, listen]);

  const begin = (withVoice: boolean) => {
    setVoiceInput(withVoice);
    if (withVoice && !makeRecognition()) setMicOk(false);
    const el = audio.current;
    if (el && !ctx.current) {
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const c = new AC();
        const src = c.createMediaElementSource(el);
        const an = c.createAnalyser();
        an.fftSize = 512;
        src.connect(an);
        an.connect(c.destination);
        ctx.current = c;
        analyser.current = an;
      } catch {
        /* the orb simply won't follow the voice */
      }
    }
    void ctx.current?.resume();
    play(["hello"], listen);
  };

  const restart = () => {
    rec.current?.abort();
    audio.current?.pause();
    setAnswers({});
    setStep(0);
    setHeard("");
    play(["hello"], listen);
  };

  useEffect(() => {
    if (audio.current) audio.current.muted = muted;
  }, [muted]);

  useEffect(() => () => rec.current?.abort(), []);

  const current = V.steps[Math.min(step, V.steps.length - 1)];
  const brief = V.steps.map((s) => `${s.label}: ${answers[s.id] ?? "—"}`).join("\n");
  const submitTyped = () => {
    const t = typed.trim();
    if (t) answer(t);
  };

  return (
    <div className="bv" data-phase={phase} data-no-reveal>
      <audio ref={audio} preload="auto" crossOrigin="anonymous" />

      <div className="bv-grid">
        <div className="bv-stage" ref={stage}>
          {/* Orbiting capabilities, decoration only */}
          <div className="bv-orbit" aria-hidden="true">
            {["Role insights", "Semantic search", "Switch intent", "Timing score", "Evidence screening", "Follow-ups", "Interview kit", "Call check"].map((c, i) => (
              <span key={c} style={{ "--i": i } as CSSProperties}>
                {c}
              </span>
            ))}
          </div>

          <div className="bv-orb" aria-hidden="true">
            <i />
            <i />
            <i />
            <b />
            <span className="bv-bars">
              {Array.from({ length: 5 }).map((_, i) => (
                <em key={i} style={{ "--i": i } as CSSProperties} />
              ))}
            </span>
          </div>

          {phase === "intro" ? (
            <div className="bv-intro">
              <p className="ct-meta ct-green">{V.eyebrow}</p>
              <h1 className="ct-display bv-title">
                {V.title} <span className="ct-italic">{V.titleItalic}</span>
              </h1>
              <p className="ct-lede bv-lede">{V.intro}</p>
              <div className="bv-actions">
                <button type="button" className="ct-btn ct-btn-primary bv-go" onClick={() => begin(true)}>
                  <MicIcon /> {V.start}
                </button>
                <button type="button" className="ct-btn ct-btn-secondary" onClick={() => begin(false)}>
                  {V.type}
                </button>
              </div>
              <p className="ct-small bv-note">{V.soundOff}</p>
            </div>
          ) : (
            <div className="bv-talk">
              <p className="bv-caption" aria-live="polite">
                <span className="sr-only">Buddy: {V.lines[line]}</span>
                <span aria-hidden="true">
                  {words.map((w, i) => (
                    <span key={`${line}-${i}`} className={cx("bv-word", i < said && "is-on")}>
                      {w}{" "}
                    </span>
                  ))}
                </span>
              </p>

              {phase !== "done" && (
                <div className="bv-you">
                  {heard && <p className="bv-heard">“{heard}”</p>}
                  <div className="bv-controls">
                    {voiceInput && micOk ? (
                      <button
                        type="button"
                        className={cx("bv-mic", phase === "listening" && "is-on", speech && "is-speech")}
                        onClick={() => (phase === "listening" ? rec.current?.stop() : listen())}
                        disabled={phase === "speaking"}
                        aria-pressed={phase === "listening"}
                      >
                        <MicIcon /> {phase === "listening" ? V.listening : V.tap}
                      </button>
                    ) : null}
                    <form
                      className="bv-type"
                      onSubmit={(e) => {
                        e.preventDefault();
                        submitTyped();
                      }}
                    >
                      <label className="sr-only" htmlFor="bv-input">
                        {current.label}
                      </label>
                      <input
                        id="bv-input"
                        ref={input}
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        placeholder={V.placeholder}
                        disabled={phase === "speaking"}
                        autoComplete="off"
                      />
                      <button type="submit" className="ct-btn ct-btn-primary" disabled={phase === "speaking" || !typed.trim()}>
                        {V.send}
                      </button>
                    </form>
                  </div>
                  <div className="bv-chips" role="group" aria-label={`Suggestions: ${current.label}`}>
                    {current.chips.map((c) => (
                      <button key={c} type="button" className="bv-chip" disabled={phase === "speaking"} onClick={() => answer(c)}>
                        {c}
                      </button>
                    ))}
                    <button type="button" className="bv-chip is-quiet" disabled={phase === "speaking"} onClick={() => answer("—")}>
                      {V.skip}
                    </button>
                  </div>
                  {voiceInput && !micOk && <p className="ct-small bv-note">{V.noMic}</p>}
                </div>
              )}

              <div className="bv-tools">
                <button type="button" className="bv-tool" onClick={() => setMuted((m) => !m)} aria-pressed={muted}>
                  {muted ? V.unmute : V.mute}
                </button>
                <button type="button" className="bv-tool" onClick={restart}>
                  {V.restart}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="bv-brief" aria-labelledby="bv-brief-title">
          <div className="bv-brief-head">
            <span className="bv-mark" aria-hidden="true" />
            <h2 id="bv-brief-title" className="ct-display">
              {phase === "done" ? V.doneTitle : V.brief}
            </h2>
          </div>
          <ol className="bv-steps">
            {V.steps.map((s, i) => (
              <li key={s.id} className={cx(answers[s.id] && "is-done", phase !== "intro" && phase !== "done" && i === step && "is-now")}>
                <span className="bv-dot" aria-hidden="true" />
                <span className="bv-label">{s.label}</span>
                <span className="bv-value">{answers[s.id] ?? (i === step && phase !== "intro" ? "…" : "")}</span>
              </li>
            ))}
          </ol>
          {phase === "intro" && <p className="ct-small bv-empty">{V.briefEmpty}</p>}
          {phase === "done" && (
            <div className="bv-form">
              <p className="ct-small">{V.doneBody}</p>
              <ContactForm idPrefix="buddy-enquiry" initial={{ hiringFor: answers.role && answers.role !== "—" ? answers.role : "", message: `Brief from Buddy\n${brief}` }} />
            </div>
          )}
          <p className="ct-small bv-privacy">{V.privacy}</p>
          {VOICE_AGENT_ID && <p className="ct-small bv-privacy">{V.freeform}</p>}
        </aside>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="bv-ic" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}
