"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/utils";

/**
 * The one control that belongs to both experiences.
 *
 * It is a segmented pill in the existing button language — hairline border,
 * full pill radius, the same 300ms colour transition — so it reads as part of
 * the navigation it sits in rather than a bolted-on toggle.
 */
export function ModeSwitch({ className }: { className?: string }) {
  const pathname = usePathname();
  const candidate = pathname?.startsWith("/candidates") ?? false;

  return (
    <div
      className={cx(
        "inline-flex items-center rounded-full border border-current/15 p-0.5",
        className,
      )}
      role="group"
      aria-label="Choose your view"
    >
      <Segment href="/" active={!candidate}>
        Client
      </Segment>
      <Segment href="/candidates" active={candidate}>
        Candidate
      </Segment>
    </div>
  );
}

function Segment({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "mono-micro rounded-full px-3 py-1.5 leading-none transition-colors duration-300 ease-(--ease-out-expo)",
        active
          ? "bg-current/[0.12] text-fg-85"
          : "text-fg-45 hover:text-fg-70",
      )}
    >
      {children}
    </Link>
  );
}
