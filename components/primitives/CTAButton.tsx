import Link from "next/link";
import { cx } from "@/lib/utils";

type CTAButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "signal" | "outline" | "quiet";
  className?: string;
  trailing?: "arrow" | "down" | "none";
};

const base =
  "group relative inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-[0.95rem] font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform] duration-300 ease-(--ease-out-expo) active:translate-y-px";

const variants = {
  signal:
    "bg-signal text-paper-50 hover:bg-signal-600",
  outline:
    "border border-current/25 hover:border-current/60 hover:bg-current/[0.06]",
  quiet: "px-0 hover:text-signal",
} as const;

export function CTAButton({
  href,
  children,
  variant = "signal",
  className,
  trailing = "arrow",
}: CTAButtonProps) {
  // In-page anchors stay plain anchors; anything that changes route uses Link.
  const isAnchor = href.startsWith("#");

  const content = (
    <>
      <span>{children}</span>
      {trailing !== "none" && (
        <span
          aria-hidden="true"
          className={cx(
            "transition-transform duration-300 ease-(--ease-out-expo)",
            trailing === "arrow"
              ? "group-hover:translate-x-1"
              : "group-hover:translate-y-1",
          )}
        >
          {trailing === "arrow" ? "→" : "↓"}
        </span>
      )}
    </>
  );

  const classes = cx(base, variants[variant], className);

  if (isAnchor) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
