import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

/**
 * Direction C primitives. Deliberately few: a button, a section header, an
 * eyebrow, the reading indicator, and the label every illustrative interface
 * carries. Everything else is composed in place.
 */

type ButtonVariant = "primary" | "secondary" | "quiet";

export function ButtonLink({
  href,
  children,
  variant = "primary",
  arrow = "right",
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  arrow?: "right" | "down" | "none";
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className={cx("ct-btn", `ct-btn-${variant}`, className)}>
      {children}
      {arrow !== "none" && (
        <span className="ct-btn-arrow" aria-hidden="true">
          {arrow === "down" ? "↓" : "→"}
        </span>
      )}
    </Link>
  );
}

/** The person: the brand's node, lifted from the logo. Used sparingly. */
export function NodeDot({ className, tone = "signal" }: { className?: string; tone?: "signal" | "green" | "violet" | "ink" }) {
  const fill = {
    signal: "var(--ct-signal)",
    green: "var(--ct-green)",
    violet: "var(--ct-violet)",
    ink: "var(--ct-ink)",
  }[tone];
  return (
    <span
      aria-hidden="true"
      className={cx("inline-block h-[0.45rem] w-[0.45rem] shrink-0 rounded-full", className)}
      style={{ backgroundColor: fill }}
    />
  );
}

export function Eyebrow({
  index,
  children,
  tone = "green",
  className,
}: {
  index?: string;
  children: ReactNode;
  tone?: "green" | "violet" | "ink";
  className?: string;
}) {
  const color = tone === "violet" ? "ct-violet" : tone === "ink" ? "ct-ink2" : "ct-green";
  return (
    <p className={cx("ct-meta flex items-center gap-3", className)}>
      {index && <span className={cx(color, "tabular-nums")}>{index}</span>}
      {index && <span aria-hidden="true" className="h-px w-6 bg-[var(--ct-line-2)]" />}
      <span className="ct-mute">{children}</span>
    </p>
  );
}

/** Two-part editorial headline: a statement, then its turn in italic. */
export function Headline({
  as: Tag = "h2",
  id,
  lead,
  turn,
  size = "l",
  className,
  turnClassName,
}: {
  as?: "h1" | "h2" | "h3";
  id?: string;
  lead: ReactNode;
  turn?: ReactNode;
  size?: "xl" | "l" | "m" | "s";
  className?: string;
  turnClassName?: string;
}) {
  return (
    <Tag id={id} className={cx("ct-display", `ct-${size}`, className)}>
      {lead}
      {turn && (
        <>
          {" "}
          <span className={cx("ct-italic block", turnClassName)}>{turn}</span>
        </>
      )}
    </Tag>
  );
}

export function SectionHead({
  index,
  eyebrow,
  id,
  lead,
  turn,
  lede,
  tone,
  size = "l",
  className,
  children,
}: {
  index?: string;
  eyebrow: ReactNode;
  id: string;
  lead: ReactNode;
  turn?: ReactNode;
  lede?: ReactNode;
  tone?: "green" | "violet" | "ink";
  size?: "xl" | "l" | "m";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header className={cx("max-w-3xl", className)}>
      <Eyebrow index={index} tone={tone}>
        {eyebrow}
      </Eyebrow>
      <Headline id={id} lead={lead} turn={turn} size={size} className="mt-6" />
      {lede && <p className="ct-lede mt-6 max-w-2xl">{lede}</p>}
      {children}
    </header>
  );
}

/**
 * Every interface demonstration on this direction carries this label. It is
 * part of the design, not a footnote — /terms relies on it being there.
 */
export function Illustrative({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx("ct-meta ct-mute flex items-start gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="mt-[0.2rem] inline-block h-2.5 w-2.5 shrink-0 rounded-[3px] border border-dashed ct-b-mute"
      />
      <span>{children}</span>
    </p>
  );
}

export type Strength = "emerging" | "solid" | "strong" | "confirmed";

const FILLED: Record<Strength, number> = { emerging: 2, solid: 3, strong: 4, confirmed: 4 };
const STRENGTH_LABEL: Record<Strength, string> = {
  emerging: "Emerging",
  solid: "Solid",
  strong: "Strong",
  confirmed: "Confirmed",
};

/** A reading, not a score: four segments and a word. */
export function Reading({ strength, className }: { strength: Strength; className?: string }) {
  const filled = FILLED[strength];
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <span className="flex gap-[3px]" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-[7px] w-[7px] rounded-[2px]"
            style={{
              backgroundColor: i < filled ? "var(--ct-green)" : "var(--ct-line)",
            }}
          />
        ))}
      </span>
      <span className="ct-meta ct-ink2">{STRENGTH_LABEL[strength]}</span>
    </span>
  );
}
