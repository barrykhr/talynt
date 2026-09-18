import { cx } from "@/lib/utils";

export type SignalStrength = "emerging" | "solid" | "strong" | "confirmed";

const FILLED: Record<SignalStrength, number> = {
  emerging: 2,
  solid: 3,
  strong: 4,
  confirmed: 4,
};

const LABEL: Record<SignalStrength, string> = {
  emerging: "Emerging",
  solid: "Solid",
  strong: "Strong",
  confirmed: "Confirmed",
};

/**
 * A signal reading, not a score. Four segments and a word — deliberately
 * coarse, because a resolution we cannot defend would be theatre.
 */
export function MatchIndicator({
  strength,
  className,
}: {
  strength: SignalStrength;
  className?: string;
}) {
  const filled = FILLED[strength];
  return (
    <span className={cx("inline-flex items-center gap-3", className)}>
      <span className="flex gap-[3px]" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cx(
              "h-[3px] w-4 rounded-full transition-colors duration-500",
              i < filled ? "bg-signal" : "bg-current/15",
            )}
          />
        ))}
      </span>
      <span className="mono-micro whitespace-nowrap opacity-80">
        {LABEL[strength]}
      </span>
    </span>
  );
}

/** A named dimension of evidence surfaced from sourcing or conversation. */
export function SignalBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "signal";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "mono-micro inline-flex items-center rounded-full border px-2.5 py-1 leading-none",
        tone === "signal"
          ? "border-signal/40 bg-signal/10 text-signal-300"
          : "border-current/15 opacity-70",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Row used inside candidate and evaluation panels. */
export function SignalRow({
  label,
  strength,
}: {
  label: string;
  strength: SignalStrength;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-t border-current/10 py-2.5 first:border-t-0">
      <span className="text-[0.82rem] opacity-70">{label}</span>
      <MatchIndicator strength={strength} />
    </div>
  );
}
