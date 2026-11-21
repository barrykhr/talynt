"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cx } from "@/components/ui";
import {
  IconBriefcase, IconBuilding, IconChart, IconHome, IconPipeline, IconSettings, IconShield, IconTask,
  IconUpload, IconUser, IconX,
} from "@/components/icons";

const NAV = [
  { href: "/", label: "Overview", icon: IconHome },
  { href: "/companies", label: "Companies", icon: IconBuilding },
  { href: "/contacts", label: "Contacts", icon: IconUser },
  { href: "/pipeline", label: "Pipeline", icon: IconPipeline },
  { href: "/requirements", label: "Requirements", icon: IconBriefcase },
  { href: "/activities", label: "Activities & tasks", icon: IconTask },
  { href: "/reports", label: "Reports", icon: IconChart },
  { href: "/import", label: "Import & export", icon: IconUpload },
];

export function SideNav({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const item = (href: string, label: string, Icon: typeof IconHome) => (
    <Link
      key={href}
      href={href}
      onClick={onNavigate}
      aria-current={active(href) ? "page" : undefined}
      className={cx(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        active(href) ? "bg-surface font-medium text-ink shadow-xs ring-1 ring-line" : "text-ink-soft hover:bg-surface/70 hover:text-ink",
      )}
    >
      <Icon className={active(href) ? "text-accent" : "text-muted"} />
      {label}
    </Link>
  );
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV.map((n) => item(n.href, n.label, n.icon))}
      <div className="my-3 border-t border-line" />
      {item("/settings", "Settings & connections", IconSettings)}
      {isAdmin ? item("/admin", "Team & audit", IconShield) : null}
    </nav>
  );
}

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm"
      >
        {open ? "Close" : "Menu"}
      </button>
      {open ? (
        <div id="mobile-nav" className="fixed inset-x-0 top-14 z-40 border-b border-line bg-canvas p-3 shadow-lg">
          <SideNav isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}

// Fixed messages for ?notice= codes after redirects. Only known codes are
// shown, so a crafted URL can't display arbitrary text.
const NOTICES: Record<string, string> = {
  company_created: "Company added.",
  company_updated: "Company saved.",
  company_archived: "Company archived. You can restore it from the archived filter.",
  company_restored: "Company restored.",
  companies_merged: "Companies merged. The duplicate was archived and linked to this record.",
  contact_created: "Contact added.",
  contact_updated: "Contact saved.",
  contact_archived: "Contact archived.",
  contact_restored: "Contact restored.",
  contacts_merged: "Contacts merged.",
  opportunity_created: "Opportunity added to the pipeline.",
  opportunity_updated: "Opportunity saved.",
  opportunity_archived: "Opportunity archived.",
  opportunity_restored: "Opportunity restored.",
  requirement_created: "Requirement added.",
  requirement_updated: "Requirement saved.",
  requirement_archived: "Requirement archived.",
  requirement_restored: "Requirement restored.",
  activity_archived: "Activity removed from the timeline (archived).",
  email_sent: "Email sent from your Gmail and logged to the CRM.",
  meeting_created: "Meeting added to your Google Calendar and logged.",
  gmail_connected: "Gmail connected.",
  calendar_connected: "Google Calendar connected.",
  disconnected: "Disconnected. Tokens were revoked and deleted.",
  import_done: "Import finished. Review the results below.",
  user_invited: "Team member added. They can now sign in with Google.",
};

export function NoticeToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const code = params.get("notice");
  const message = code ? NOTICES[code] : undefined;
  const [dismissed, setDismissed] = useState<string | null>(null);
  const visible = Boolean(message) && dismissed !== code;

  useEffect(() => {
    if (!message || !code) return;
    const t = setTimeout(() => {
      setDismissed(code);
      const next = new URLSearchParams(params.toString());
      next.delete("notice");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 4500);
    return () => clearTimeout(t);
  }, [message, code, params, pathname, router]);

  if (!message || !visible) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-ok/20 bg-surface px-4 py-3 text-sm shadow-lg">
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-ok" aria-hidden />
      <span className="text-ink">{message}</span>
      <button type="button" onClick={() => setDismissed(code)} className="ml-1 text-muted hover:text-ink" aria-label="Dismiss">
        <IconX />
      </button>
    </div>
  );
}
