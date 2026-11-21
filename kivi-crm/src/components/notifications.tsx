import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InlineAction } from "@/components/forms";
import { IconBell } from "@/components/icons";
import { markNotificationsRead } from "@/lib/actions/research";
import { formatRelative } from "@/lib/time";
import type { AppNotification } from "@/lib/types";

/** In-app notifications (the CRM never sends external messages on its own). */
export async function NotificationsMenu() {
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("id, kind, title, body, link, created_at, read_at")
    .order("created_at", { ascending: false }).limit(8);
  const items = (data ?? []) as AppNotification[];
  const unread = items.filter((n) => !n.read_at).length;
  return (
    <details className="relative">
      <summary className="relative flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-line-strong bg-surface" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
        <IconBell />
        {unread ? <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">{unread}</span> : null}
      </summary>
      <div className="absolute right-0 z-40 mt-1 w-80 rounded-lg border border-line bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unread ? <InlineAction action={markNotificationsRead} hidden={{}} title="Mark all read">Mark all read</InlineAction> : null}
        </div>
        {items.length === 0 ? <p className="p-4 text-sm text-muted">Nothing new. Research signals and website enquiries appear here.</p> : (
          <ul className="max-h-80 divide-y divide-line overflow-y-auto">
            {items.map((n) => (
              <li key={n.id} className={n.read_at ? "opacity-70" : ""}>
                <Link href={n.link ?? "/"} className="block px-3 py-2.5 hover:bg-sunken">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body ? <div className="text-xs text-muted">{n.body}</div> : null}
                  <div className="mt-0.5 text-[11px] text-faint">{formatRelative(n.created_at)}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
