import { cx } from "@/lib/utils";
import { Reveal } from "./Reveal";

type SectionHeaderProps = {
  /** Two-part index label, e.g. "04" + "Context". */
  index?: string;
  eyebrow?: string;
  /** Lines are set deliberately — the break is part of the typography. */
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  headingId?: string;
  as?: "h2" | "h3";
};

export function SectionHeader({
  index,
  eyebrow,
  title,
  lede,
  align = "left",
  className,
  headingId,
  as: Heading = "h2",
}: SectionHeaderProps) {
  return (
    <header
      className={cx(
        "flex flex-col",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {(index || eyebrow) && (
        <Reveal className="mb-8 flex items-baseline gap-4 md:mb-12">
          {index && (
            <span className="mono-micro text-signal tabular-nums">{index}</span>
          )}
          {eyebrow && (
            <span className="mono-micro text-fg-55">{eyebrow}</span>
          )}
        </Reveal>
      )}

      <Reveal delay={0.05}>
        <Heading
          id={headingId}
          className="display text-(length:--text-h2) text-balance"
        >
          {title}
        </Heading>
      </Reveal>

      {lede && (
        <Reveal delay={0.12}>
          <p
            className={cx(
              "mt-7 max-w-2xl text-(length:--text-lede) leading-[1.4] text-fg-65",
              align === "center" && "mx-auto",
            )}
          >
            {lede}
          </p>
        </Reveal>
      )}
    </header>
  );
}
