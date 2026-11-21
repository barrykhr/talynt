import type { Metadata } from "next";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { googleConfig, googleConfigProblems } from "@/lib/env";
import { param, type SearchParams } from "@/lib/data/query";
import { displayName } from "@/lib/data/team";
import { Badge, Card, DescriptionList, Notice, PageHeader, buttonClass } from "@/components/ui";
import { ConfirmAction, InlineAction } from "@/components/forms";
import { ReviewItemForm } from "@/components/review-item";
import { IconCalendar, IconMail } from "@/components/icons";
import { disconnectGoogle, ignoreReviewItem, syncNow } from "@/lib/actions/google";
import { getMyConnections } from "@/components/communication";
import { PRODUCT_LABEL, PRODUCT_SCOPES, type GoogleProduct } from "@/lib/google/scopes";
import { contactOptions, companyOptions } from "@/lib/data/lookups";
import { formatDateTime, formatRelative } from "@/lib/time";
import type { GoogleConnectionStatus, SyncReviewItem } from "@/lib/types";

export const metadata: Metadata = { title: "Settings & connections" };

const ERRORS: Record<string, string> = {
  not_configured: "Google integration isn't configured on the server yet.",
  bad_state: "The connection request expired or didn't match your session. Please try again.",
  consent_denied: "You didn't grant access, so nothing was connected.",
  google_error: "Google returned an error. Please try again.",
  wrong_account: "Please connect your own @kivitronicsconsulting.com account — the one you signed in with. Nothing was saved.",
  scopes_missing: "Some permissions were unticked on Google's consent screen, so the connection wasn't saved. Try again and allow all requested access.",
  connect_failed: "We couldn't finish connecting. Please try again.",
  bad_request: "Unknown connection type.",
};

const PRODUCT_INFO: Record<GoogleProduct, { icon: React.ReactNode; does: string[]; doesNot: string[] }> = {
  gmail: {
    icon: <IconMail />,
    does: [
      "Send email as you from company, contact, opportunity and requirement pages",
      "Log threads with known CRM contacts (sender, recipients, subject, date)",
      "Suggest threads with people at CRM companies for you to review",
    ],
    doesNot: ["Read or store message bodies or attachments", "Log personal or unrelated email", "Share your mailbox or tokens with teammates"],
  },
  calendar: {
    icon: <IconCalendar />,
    does: ["Log meetings with CRM contacts", "Create meetings from CRM records on your calendar", "Keep times and cancellations in sync"],
    doesNot: ["Change your calendar settings or sharing", "Log events without CRM contacts"],
  },
};

function statusBadge(c?: GoogleConnectionStatus) {
  if (!c || c.status === "disconnected") return <Badge>Not connected</Badge>;
  if (c.status === "connected") return <Badge tone="ok">Connected</Badge>;
  if (c.status === "needs_reauth") return <Badge tone="danger">Reconnect needed</Badge>;
  return <Badge tone="warn">Sync error</Badge>;
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const member = await requireMemberPage();
  const sp = await searchParams;
  const configured = Boolean(googleConfig());
  const problems = configured ? [] : googleConfigProblems();
  const conns = configured ? await getMyConnections() : [];
  const supabase = await createClient();
  const { data: reviewData } = await supabase.from("sync_review_items").select("*").eq("state", "pending").order("occurred_at", { ascending: false }).limit(25);
  const review = (reviewData ?? []) as SyncReviewItem[];
  const [contacts, companies] = review.length ? await Promise.all([contactOptions(supabase), companyOptions(supabase)]) : [[], []];
  const error = param(sp, "error");

  return (
    <>
      <PageHeader title="Settings & connections" description="Your profile and your personal Google connections. Each person connects their own Gmail and Calendar." />
      {error && ERRORS[error] ? <div className="mb-6"><Notice tone="danger">{ERRORS[error]}</Notice></div> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          {!configured ? (
            <Notice tone="warn" title="Gmail & Calendar: awaiting Google Cloud configuration">
              <p>The integration code is installed but not active on this server. An administrator needs to finish the Google Cloud setup (docs/GOOGLE.md). Missing:</p>
              <ul className="mt-1 list-disc pl-5">{problems.map((p) => <li key={p}><code className="text-xs">{p.split(" ")[0]}</code> {p.split(" ").slice(1).join(" ")}</li>)}</ul>
              <p className="mt-2">Until then, log emails, calls, meetings and WhatsApp messages manually from any record.</p>
            </Notice>
          ) : null}

          {(["gmail", "calendar"] as GoogleProduct[]).map((product) => {
            const c = conns.find((x) => x.product === product);
            const active = c && c.status !== "disconnected";
            const info = PRODUCT_INFO[product];
            const res = (c?.last_sync_result ?? {}) as { checked?: number; logged?: number; updated?: number; review?: number };
            return (
              <Card key={product} title={<span className="flex items-center gap-2">{info.icon} {PRODUCT_LABEL[product]} {statusBadge(c)}</span>}
                actions={configured ? (
                  active ? (
                    <>
                      {c!.status !== "needs_reauth" ? <InlineAction action={syncNow} hidden={{ product }} variant="secondary" title={`Sync ${PRODUCT_LABEL[product]} now`}>Sync now</InlineAction> : null}
                      <a href={`/api/integrations/google/connect?product=${product}`} className={buttonClass(c!.status === "needs_reauth" ? "primary" : "ghost", "sm")}>Reconnect</a>
                      <ConfirmAction action={disconnectGoogle} hidden={{ product }} label="Disconnect" size="sm" title={`Disconnect ${PRODUCT_LABEL[product]}?`}
                        description="We'll revoke the CRM's access at Google and delete the stored tokens. Activities already logged stay in the CRM." confirmLabel="Disconnect" />
                    </>
                  ) : (
                    <a href={`/api/integrations/google/connect?product=${product}`} className={buttonClass("primary", "sm")}>Connect {PRODUCT_LABEL[product]}</a>
                  )
                ) : null}>
                {active ? (
                  <DescriptionList items={[
                    { label: "Account", value: c!.google_email },
                    { label: "Connected", value: formatDateTime(c!.connected_at) },
                    { label: "Last sync", value: c!.last_sync_at ? `${formatRelative(c!.last_sync_at)}` : "Not yet" },
                    { label: "Last result", value: c!.last_sync_at ? `${res.checked ?? 0} checked · ${res.logged ?? 0} logged${res.updated ? ` · ${res.updated} updated` : ""} · ${res.review ?? 0} to review` : "—" },
                  ]} />
                ) : null}
                {c?.last_error ? <div className="mt-3"><Notice tone={c.status === "needs_reauth" ? "danger" : "warn"}>{c.last_error}</Notice></div> : null}
                <div className={`${active ? "mt-4 border-t border-line pt-4" : ""} grid gap-4 text-sm sm:grid-cols-2`}>
                  <div><div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">What it does</div><ul className="list-disc space-y-0.5 pl-4 text-ink-soft">{info.does.map((d) => <li key={d}>{d}</li>)}</ul></div>
                  <div><div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">What it never does</div><ul className="list-disc space-y-0.5 pl-4 text-ink-soft">{info.doesNot.map((d) => <li key={d}>{d}</li>)}</ul></div>
                </div>
                <details className="mt-3 text-xs text-muted">
                  <summary className="cursor-pointer">Google permissions requested</summary>
                  <ul className="mt-1 space-y-0.5 font-mono">{PRODUCT_SCOPES[product].map((s) => <li key={s}>{s}</li>)}</ul>
                </details>
              </Card>
            );
          })}

          <Card title={`Review queue · ${review.length}`} id="review">
            <p className="mb-3 text-sm text-muted">
              Emails and meetings from your account with people at CRM companies who aren&apos;t contacts yet. Only you can see this queue.
              Log the ones that matter; ignore the rest and they won&apos;t be suggested again.
            </p>
            {review.length === 0 ? <p className="text-sm text-faint">Nothing to review.</p> : (
              <ul className="divide-y divide-line">
                {review.map((item) => (
                  <li key={item.id} className="py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium">{item.subject ?? "(no subject)"}</div>
                        <div className="text-xs text-muted">{item.product === "gmail" ? "Email" : "Meeting"} · {formatDateTime(item.occurred_at)} · {item.participants.slice(0, 4).map((p) => p.email).join(", ")}</div>
                      </div>
                      <InlineAction action={ignoreReviewItem} hidden={{ id: item.id }} title="Ignore — not CRM-related">Ignore</InlineAction>
                    </div>
                    <ReviewItemForm id={item.id} contacts={contacts} companies={companies} suggestedCompany={item.suggested_company_id} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Your profile">
            <DescriptionList items={[
              { label: "Name", value: displayName(member) },
              { label: "Email", value: member.email },
              { label: "Role", value: member.role === "admin" ? "Administrator" : "Member" },
            ]} />
            <p className="mt-3 text-xs text-muted">Names and roles are managed by an administrator{member.role === "admin" ? <> in <Link className="link" href="/admin">Team &amp; audit</Link></> : null}.</p>
          </Card>
          <Card title="WhatsApp">
            <p className="text-sm text-muted">There is no WhatsApp integration. Log WhatsApp conversations as activities (type “WhatsApp”) on the relevant record, and use “WhatsApp” as the lead source for leads that came in that way.</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
