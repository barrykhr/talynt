import { Suspense } from "react";
import Link from "next/link";
import { requireMemberPage } from "@/lib/auth";
import { signOut } from "../(auth)/actions";
import { MobileNav, NoticeToast, SideNav } from "@/components/shell";
import { Avatar } from "@/components/ui";
import { IconSearch, IconSignOut } from "@/components/icons";
import { initials, displayName } from "@/lib/data/team";

// Every page in this group is personalised and permission-checked per request.
export const dynamic = "force-dynamic";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const member = await requireMemberPage();
  const isAdmin = member.role === "admin";

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="hidden border-r border-line bg-sunken/50 px-3 py-4 lg:flex lg:flex-col">
        <Link href="/" className="mb-5 flex items-center gap-2 px-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-[13px] font-bold text-white">K</span>
          <span className="text-sm font-semibold leading-tight">
            KiviTronics<span className="block text-xs font-normal text-muted">CRM</span>
          </span>
        </Link>
        <SideNav isAdmin={isAdmin} />
        <div className="mt-auto border-t border-line pt-3">
          <div className="flex items-center gap-2 px-2.5">
            <Avatar label={initials(member)} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{displayName(member)}</div>
              <div className="truncate text-xs text-muted">{isAdmin ? "Admin" : "Member"}</div>
            </div>
          </div>
          <form action={signOut} className="mt-2">
            <button type="submit" className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-ink-soft hover:bg-surface/70">
              <IconSignOut className="text-muted" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur sm:px-6">
          <MobileNav isAdmin={isAdmin} />
          <form action="/search" method="get" role="search" className="relative w-full max-w-md">
            <label htmlFor="global-search" className="sr-only">Search companies, contacts, roles and notes</label>
            <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              id="global-search"
              name="q"
              type="search"
              placeholder="Search companies, contacts, roles, notes…"
              className="input h-9 pl-8"
              autoComplete="off"
            />
          </form>
          <form action={signOut} className="ml-auto lg:hidden">
            <button type="submit" className="whitespace-nowrap text-sm text-ink-soft">Sign out</button>
          </form>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
      <Suspense fallback={null}>
        <NoticeToast />
      </Suspense>
    </div>
  );
}
