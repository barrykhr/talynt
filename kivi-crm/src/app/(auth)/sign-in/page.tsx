import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signInWithGoogle } from "../actions";
import { getMember } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { Notice } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled. You can try again whenever you're ready.",
  missing_code: "Google didn't return a sign-in code. Please try again.",
  exchange_failed: "We couldn't complete sign-in. The link may have expired — please try again.",
  start_failed: "We couldn't reach the sign-in service. Please try again in a moment.",
};

function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SITE_URL);
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const ready = configured();
  if (ready && (await getMember())) redirect(safeRedirectPath(sp.next, "/"));

  const error = sp.error ? ERRORS[sp.error] ?? ERRORS.exchange_failed : null;

  return (
    <div className="w-full max-w-sm">
      <div className="card p-7">
        <div className="mb-6">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-accent">KiviTronics</div>
          <h1 className="mt-1 text-xl font-semibold">Sign in to the CRM</h1>
          <p className="mt-1 text-sm text-muted">
            Use your <span className="font-medium text-ink-soft">@kivitronicsconsulting.com</span> Google Workspace account.
          </p>
        </div>

        <div className="space-y-3">
          {sp.signed_out ? <Notice tone="ok" title="You've signed out." /> : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {!ready ? (
            <Notice tone="warn" title="Not configured yet">
              Supabase environment variables are missing. See docs/SETUP.md.
            </Notice>
          ) : null}
        </div>

        <form action={signInWithGoogle} className="mt-5">
          <input type="hidden" name="next" value={safeRedirectPath(sp.next, "/")} />
          {ready ? (
            <SubmitButton variant="primary" pendingLabel="Redirecting to Google…" className="w-full">
              Continue with Google
            </SubmitButton>
          ) : null}
        </form>

        <p className="mt-6 text-xs leading-relaxed text-muted">
          Access is limited to team members an administrator has added. If you&apos;re new, ask an admin to add you first.
        </p>
      </div>
    </div>
  );
}
