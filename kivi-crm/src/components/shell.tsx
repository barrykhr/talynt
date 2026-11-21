"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cx } from "@/components/ui";
import {
  IconBriefcase, IconBuilding, IconChart, IconHome, IconPipeline, IconRadar, IconRupee, IconSettings, IconShield, IconTask,
  IconUpload, IconUser, IconX,
} from "@/components/icons";

const NAV = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/pipeline", label: "Pipeline", icon: IconPipeline },
  { href: "/companies", label: "Companies", icon: IconBuilding },
  { href: "/contacts", label: "Contacts", icon: IconUser },
  { href: "/requirements", label: "Requirements", icon: IconBriefcase },
  { href: "/activities", label: "Tasks & activity", icon: IconTask },
  { href: "/research", label: "Research updates", icon: IconRadar },
  { href: "/revenue", label: "Revenue", icon: IconRupee },
  { href: "/reports", label: "Reports", icon: IconChart },
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
      {item("/settings", "Settings", IconSettings)}
      {item("/import", "Import & export", IconUpload)}
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
  lead_created: "Lead added to the pipeline. Set a next action so it doesn't stall.",
  settings_saved: "Workspace settings saved.",
};

/** Shows a calm banner when the browser goes offline; edits need a connection. */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (online) return null;
  return (
    <div role="status" className="border-b border-warn/20 bg-warn-soft px-4 py-2 text-center text-[13px] text-warn">
      You&apos;re offline. Changes can&apos;t be saved until your connection is back.
    </div>
  );
}

export function QuickCreate() {
  const [open, setOpen] = useState(false);
  const items = [
    ["/leads/new", "Lead", "Company + contact + opportunity in one step"],
    ["/companies/new", "Company", ""],
    ["/contacts/new", "Contact", ""],
    ["/requirements/new", "Requirement", ""],
    ["/activities?view=mine&new=1", "Task or activity", ""],
  ];
  return (
    <div className="relative">
      <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        className="inline-flex h-9 items-center gap-1 rounded-md bg-accent px-3 text-sm font-medium text-white hover:bg-accent-hover">
        + New
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-40 mt-1 w-64 rounded-lg border border-line bg-surface p-1 shadow-lg" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}>
          {items.map(([href, label, hint]) => (
            <Link key={href} role="menuitem" href={href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm hover:bg-sunken focus:bg-sunken">
              <span className="font-medium">{label}</span>
              {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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
