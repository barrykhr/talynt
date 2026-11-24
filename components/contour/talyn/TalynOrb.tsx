import { cx } from "@/lib/utils";

/** Talyn's mark: a lime core in two slow rings. Decorative. */
export function TalynOrb({ size = "md", className }: { size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  return (
    <span aria-hidden="true" className={cx("tl-orb", `is-${size}`, className)}>
      <i />
      <i />
      <b />
    </span>
  );
}
