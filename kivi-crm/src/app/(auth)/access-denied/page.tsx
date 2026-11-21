import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "../actions";
import { buttonClass } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { IconShield } from "@/components/icons";

export const metadata: Metadata = { title: "Access denied" };

const REASONS: Record<string, { title: string; body: string }> = {
  domain_not_allowed: {
    title: "That account isn't a KiviTronics Workspace account",
    body: "Only verified @kivitronicsconsulting.com Google Workspace accounts can use this CRM. Sign in again and pick your work account.",
  },
  not_google_identity: {
    title: "Please sign in with Google",
    body: "This CRM only accepts KiviTronics Google Workspace sign-in.",
  },
  not_provisioned: {
    title: "You haven't been added to the CRM yet",
    body: "Your Workspace account is valid, but an administrator needs to add you to the team before you can sign in. Ask an admin to invite you, then try again.",
  },
  disabled: {
    title: "Your CRM access has been turned off",
    body: "An administrator has disabled this account. Contact an admin if you think this is a mistake.",
  },
  identity_mismatch: {
    title: "This email is linked to a different sign-in",
    body: "Your team record is already connected to another Google identity. An administrator needs to reset it.",
  },
  not_member: {
    title: "You don't have access to the CRM",
    body: "Your session is valid but your account isn't an active team member. Contact an administrator.",
  },
  admin_only: {
    title: "Administrators only",
    body: "That page is limited to CRM administrators.",
  },
};

export default async function AccessDeniedPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason = "not_member" } = await searchParams;
  const info = REASONS[reason] ?? REASONS.not_member;
  return (
    <div className="w-full max-w-md">
      <div className="card p-7">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-warn-soft text-warn [&_svg]:h-5 [&_svg]:w-5">
          <IconShield />
        </div>
        <h1 className="text-lg font-semibold">{info.title}</h1>
        <p className="mt-2 text-sm text-muted">{info.body}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {reason === "admin_only" ? (
            <Link href="/" className={buttonClass("primary")}>Back to overview</Link>
          ) : (
            <Link href="/sign-in" className={buttonClass("primary")}>Try a different account</Link>
          )}
          <form action={signOut}>
            <SubmitButton variant="secondary" pendingLabel="Signing out…">Sign out</SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
