import { cx } from "@/lib/utils";

type WordmarkProps = {
  /** "lockup" stacks LABS beneath TALYNT; "inline" sets them on one line. */
  variant?: "lockup" | "inline";
  className?: string;
};

/**
 * TALYNT is the brand. LABS is the descriptor and never competes with it.
 * The same lockup rules carry to TALYNT Intelligence and TALYNT OS.
 */
export function Wordmark({ variant = "lockup", className }: WordmarkProps) {
  return (
    <span
      className={cx(
        "inline-flex select-none",
        variant === "lockup" ? "flex-col items-start" : "items-baseline gap-2",
        className,
      )}
    >
      <span className="display-sans text-[1.05em] leading-none font-semibold tracking-[-0.02em] uppercase">
        Talynt
      </span>
      <span
        className={cx(
          "mono-micro text-signal",
          variant === "lockup"
            ? "mt-[0.28em] ml-[0.12em] leading-none"
            : "leading-none",
        )}
        aria-hidden="true"
      >
        Labs
      </span>
      <span className="sr-only">Labs</span>
    </span>
  );
}

/** The mark: a signal held inside the frame. Works down to 16px. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cx("h-8 w-8", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="7" className="fill-paper-100" />
      <path d="M7 10.5h18" stroke="#0b0b0d" strokeWidth="2.6" strokeLinecap="square" />
      <path d="M16 10.5V25" stroke="#0b0b0d" strokeWidth="2.6" strokeLinecap="square" />
      <circle cx="16" cy="18.5" r="2.9" fill="#ff4d1c" />
    </svg>
  );
}
