"use client";

import type { SignalId } from "@/lib/conversation";
import { TRANSCRIPT } from "@/lib/conversation";
import { cx } from "@/lib/utils";

/**
 * A transcript where the evidence is clickable. Selecting a phrase shows the
 * signal it informed — and selecting a signal shows the phrase behind it.
 * Nothing is inferred that isn't traceable to something the person said.
 */
export function ConversationTranscript({
  active,
  onSelect,
}: {
  active: SignalId | null;
  onSelect: (signal: SignalId | null) => void;
}) {
  return (
    <div className="rounded-lg border border-current/12 bg-ink-850/60">
      <div className="flex items-center justify-between border-b border-current/10 px-6 py-4">
        <span className="mono-micro opacity-45">
          Structured conversation · Illustrative
        </span>
        <span className="mono-micro flex items-center gap-2 text-signal">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" />
          Recording
        </span>
      </div>

      <div className="flex flex-col gap-7 p-6 sm:p-8">
        {TRANSCRIPT.map((exchange, i) => {
          const isRecruiter = exchange.speaker === "Recruiter";
          return (
            <div key={i}>
              <div className="mb-2.5 flex items-baseline gap-3">
                <span
                  className={cx(
                    "mono-micro",
                    isRecruiter ? "text-signal" : "opacity-55",
                  )}
                >
                  {exchange.speaker}
                </span>
                <span className="font-mono text-[0.68rem] tabular-nums opacity-30">
                  {exchange.timestamp}
                </span>
              </div>

              <p
                className={cx(
                  "text-[0.98rem] leading-[1.65]",
                  isRecruiter ? "opacity-85" : "opacity-70",
                )}
              >
                {exchange.segments.map((segment, j) => {
                  if (!segment.signal) return <span key={j}>{segment.text}</span>;
                  const isActive = active === segment.signal;
                  return (
                    <button
                      key={j}
                      type="button"
                      onMouseEnter={() => onSelect(segment.signal!)}
                      onFocus={() => onSelect(segment.signal!)}
                      onClick={() =>
                        onSelect(isActive ? null : segment.signal!)
                      }
                      aria-pressed={isActive}
                      className={cx(
                        "cursor-pointer rounded-[3px] text-left underline decoration-dotted decoration-1 underline-offset-[5px] transition-colors duration-300",
                        isActive
                          ? "bg-signal/25 text-paper-50 decoration-signal"
                          : "decoration-current/30 hover:bg-signal/10",
                      )}
                    >
                      {segment.text}
                    </button>
                  );
                })}
              </p>
            </div>
          );
        })}
      </div>

      <p className="border-t border-current/10 px-6 py-4 text-[0.82rem] leading-relaxed opacity-45">
        Sample content. Real conversations are confidential and are never shared
        without the candidate&rsquo;s consent.
      </p>
    </div>
  );
}
