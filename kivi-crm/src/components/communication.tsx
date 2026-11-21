import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { googleConfig } from "@/lib/env";
import { Card } from "@/components/ui";
import { ComposeEmail, ScheduleMeeting } from "@/components/communication-forms";
import { IconCalendar, IconMail } from "@/components/icons";
import type { Member } from "@/lib/auth";
import type { GoogleConnectionStatus } from "@/lib/types";

export interface RecordLinks {
  company_id?: string | null;
  contact_id?: string | null;
  opportunity_id?: string | null;
  requirement_id?: string | null;
}

export async function getMyConnections(): Promise<GoogleConnectionStatus[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_google_connections");
  return (data ?? []) as GoogleConnectionStatus[];
}

/** Email + meeting actions for a record, using the signed-in user's own Google account. */
export async function CommunicationPanel({ member, links, defaultTo, back, recipients }: {
  member: Member; links: RecordLinks; defaultTo: string; back: string; recipients: { value: string; label: string }[];
}) {
  void member;
  const configured = Boolean(googleConfig());
  const conns = configured ? await getMyConnections() : [];
  const gmail = conns.find((c) => c.product === "gmail" && c.status !== "disconnected");
  const cal = conns.find((c) => c.product === "calendar" && c.status !== "disconnected");
  const gmailOk = gmail?.status === "connected" || gmail?.status === "error";
  const calOk = cal?.status === "connected" || cal?.status === "error";

  return (
    <Card title="Email & meetings">
      {!configured ? (
        <p className="text-sm text-muted">
          Gmail and Calendar are awaiting Google Cloud configuration. Until then, log emails, calls, meetings and
          WhatsApp messages with <strong className="font-medium text-ink-soft">Log activity</strong>.
        </p>
      ) : (
        <div className="space-y-4">
          {gmailOk ? (
            <ComposeEmail links={links} defaultTo={defaultTo} back={back} fromEmail={gmail!.google_email} recipients={recipients} />
          ) : (
            <ConnectPrompt icon={<IconMail />} label={gmail?.status === "needs_reauth" ? "Reconnect Gmail to send" : "Connect Gmail to send from here"} />
          )}
          {calOk ? (
            <ScheduleMeeting links={links} back={back} defaultAttendee={defaultTo} />
          ) : (
            <ConnectPrompt icon={<IconCalendar />} label={cal?.status === "needs_reauth" ? "Reconnect Calendar to schedule" : "Connect Calendar to schedule meetings"} />
          )}
        </div>
      )}
    </Card>
  );
}

function ConnectPrompt({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Link href="/settings" className="flex items-center gap-2 rounded-md border border-dashed border-line-strong px-3 py-2.5 text-sm text-ink-soft hover:bg-sunken">
      <span className="text-muted">{icon}</span> {label}
    </Link>
  );
}
