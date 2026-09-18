import { cx } from "@/lib/utils";

type SectionProps = {
  id?: string;
  /** ink = the system at work. paper = the human argument. */
  tone?: "ink" | "paper";
  className?: string;
  children: React.ReactNode;
  /** Removes default vertical rhythm for full-bleed / pinned sections. */
  flush?: boolean;
  as?: "section" | "div";
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

export function Section({
  id,
  tone = "ink",
  className,
  children,
  flush = false,
  as: Tag = "section",
  ...aria
}: SectionProps) {
  return (
    <Tag
      id={id}
      {...aria}
      className={cx(
        "relative isolate",
        tone === "ink" ? "tone-ink" : "tone-paper",
        !flush && "py-(--spacing-section)",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
