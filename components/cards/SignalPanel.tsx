"use client";

import { MatchIndicator } from "@/components/primitives/SignalBadge";
import type { SignalId } from "@/lib/conversation";
import { CONVERSATION_SIGNALS } from "@/lib/conversation";
import { cx } from "@/lib/utils";

export function SignalPanel({
  active,
  onSelect,
}: {
  active: SignalId | null;
  onSelect: (signal: SignalId | null) => void;
}) {
  return (
    <div className="rounded-lg border border-current/12 bg-ink-850/60">
      <div className="flex items-center justify-between border-b border-current/10 px-6 py-4">
        <span className="mono-micro opacity-45">Signals surfaced</span>
        <span className="mono-micro opacity-30">06</span>
      </div>

      <ul>
        {CONVERSATION_SIGNALS.map((signal) => {
          const isActive = active === signal.id;
          return (
            <li key={signal.id} className="border-b border-current/8 last:border-b-0">
              <button
                type="button"
                onMouseEnter={() => onSelect(signal.id)}
                onFocus={() => onSelect(signal.id)}
                onClick={() => onSelect(isActive ? null : signal.id)}
                aria-pressed={isActive}
                className={cx(
                  "w-full px-6 py-4 text-left transition-colors duration-300",
                  isActive ? "bg-signal/10" : "hover:bg-paper-100/[0.03]",
                )}
              >
                <div className="flex items-center justify-between gap-5">
                  <span
                    className={cx(
                      "mono-label text-[0.7rem] transition-colors duration-300",
                      isActive ? "text-signal" : "opacity-70",
                    )}
                  >
                    {signal.label}
                  </span>
                  <MatchIndicator strength={signal.strength} />
                </div>
                <p
                  className={cx(
                    "mt-2 text-[0.86rem] leading-[1.6] transition-all duration-500",
                    isActive
                      ? "max-h-20 opacity-70"
                      : "max-h-0 overflow-hidden opacity-0 sm:max-h-20 sm:opacity-45",
                  )}
                >
                  {signal.reading}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-current/10 px-6 py-4 text-[0.82rem] leading-relaxed opacity-45">
        Every reading traces back to something the candidate said. We don&rsquo;t
        infer personality, and we don&rsquo;t score people.
      </p>
    </div>
  );
}
