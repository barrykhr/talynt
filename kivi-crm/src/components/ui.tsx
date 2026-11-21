import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------- Buttons
type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md";

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra?: string) {
  return cx(
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60",
    size === "sm" ? "h-8 px-2.5 text-[13px]" : "h-9 px-3.5 text-sm",
    variant === "primary" && "bg-accent text-white shadow-xs hover:bg-accent-hover",
    variant === "secondary" && "border border-line-strong bg-surface text-ink shadow-xs hover:bg-sunken",
    variant === "ghost" && "text-ink-soft hover:bg-sunken",
    variant === "subtle" && "bg-accent-soft text-accent-ink hover:bg-accent-soft/70",
    variant === "danger" && "border border-danger/30 bg-surface text-danger hover:bg-danger-soft",
    extra,
  );
}

export function LinkButton({
  variant, size, className, ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

// ---------------------------------------------------------------- Badges
export type Tone = "neutral" | "accent" | "ok" | "warn" | "danger" | "info";

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-sunken text-ink-soft",
        tone === "accent" && "bg-accent-soft text-accent-ink",
        tone === "ok" && "bg-ok-soft text-ok",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "danger" && "bg-danger-soft text-danger",
        tone === "info" && "bg-info-soft text-info",
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- Layout
export function PageHeader({
  title, description, actions, eyebrow,
}: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-1 text-[13px] text-muted">{eyebrow}</div> : null}
        <h1 className="truncate text-xl font-semibold text-ink sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ title, actions, children, className, bodyClassName, id }: {
  title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string; id?: string;
}) {
  return (
    <section className={cx("card", className)} aria-labelledby={title && id ? `${id}-title` : undefined} id={id}>
      {title || actions ? (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          {title ? <h2 id={id ? `${id}-title` : undefined} className="text-sm font-semibold text-ink">{title}</h2> : <span />}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cx("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon, title, description, actions, compact }: {
  icon?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; compact?: boolean;
}) {
  return (
    <div className={cx("flex flex-col items-center text-center", compact ? "px-4 py-6" : "px-6 py-14")}>
      {icon ? (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
      ) : null}
      <h3 className={cx("font-semibold text-ink", compact ? "text-sm" : "text-base")}>{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-muted">{description}</p> : null}
      {actions ? <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({ label, value, hint, href, tone }: {
  label: string; value: ReactNode; hint?: ReactNode; href?: string; tone?: "warn" | "ok";
}) {
  const body = (
    <>
      <div className="text-[13px] text-muted">{label}</div>
      <div className={cx("mt-1 text-2xl font-semibold tabular-nums", tone === "warn" ? "text-warn" : "text-ink")}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-faint">{hint}</div> : null}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-4 transition-colors hover:border-line-strong">{body}</Link>
  ) : (
    <div className="card p-4">{body}</div>
  );
}

export function DescriptionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className="min-w-0">
          <dt className="text-xs text-muted">{it.label}</dt>
          <dd className="mt-0.5 break-words text-sm text-ink">{it.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function NotesText({ text, empty = "No notes yet." }: { text: string | null | undefined; empty?: string }) {
  // Rendered as plain text: React escapes it, so user content can never inject markup.
  return text ? (
    <p className="whitespace-pre-wrap break-words text-sm text-ink-soft">{text}</p>
  ) : (
    <p className="text-sm text-faint">{empty}</p>
  );
}

// ---------------------------------------------------------------- Tables
export function Table({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th scope="col" className={cx("table-head px-4 py-2.5", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cx("border-b border-line px-4 py-3 align-top", className)}>{children}</td>;
}

// ---------------------------------------------------------------- Navigation helpers
export function Pagination({ page, total, pageSize, hrefFor }: {
  page: number; total: number; pageSize: number; hrefFor: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav className="flex items-center justify-between gap-3 px-4 py-3 text-[13px] text-muted" aria-label="Pagination">
      <span>
        Showing <span className="tabular-nums text-ink">{from}–{to}</span> of <span className="tabular-nums text-ink">{total}</span>
      </span>
      <div className="flex gap-2">
        {page > 1 ? <LinkButton size="sm" href={hrefFor(page - 1)} rel="prev">Previous</LinkButton> : null}
        {page < pages ? <LinkButton size="sm" href={hrefFor(page + 1)} rel="next">Next</LinkButton> : null}
      </div>
    </nav>
  );
}

export function Tabs({ tabs, current, label }: { tabs: { key: string; label: ReactNode; href: string; count?: number }[]; current: string; label: string }) {
  return (
    <nav aria-label={label} className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === current ? "page" : undefined}
          className={cx(
            "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm",
            t.key === current ? "border-accent font-medium text-ink" : "border-transparent text-muted hover:text-ink",
          )}
        >
          {t.label}
          {typeof t.count === "number" ? <span className="ml-1.5 tabular-nums text-faint">{t.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

export function Avatar({ label, title }: { label: string; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-ink"
    >
      {label}
    </span>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "warn" | "danger" | "ok"; title?: ReactNode; children?: ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx(
        "rounded-md border px-3.5 py-3 text-sm",
        tone === "info" && "border-info/20 bg-info-soft text-info",
        tone === "warn" && "border-warn/20 bg-warn-soft text-warn",
        tone === "danger" && "border-danger/20 bg-danger-soft text-danger",
        tone === "ok" && "border-ok/20 bg-ok-soft text-ok",
      )}
    >
      {title ? <div className="font-medium">{title}</div> : null}
      {children ? <div className={cx(title ? "mt-0.5" : "", "text-ink-soft")}>{children}</div> : null}
    </div>
  );
}
