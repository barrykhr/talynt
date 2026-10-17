import Image from "next/image";
import Link from "next/link";
import { TAGLINE } from "@/lib/contour/content";
import { ENTRY } from "@/lib/contour/proposed";
import { ROUTES } from "@/lib/contour/site";
import { EntryChoice } from "@/components/contour/entry/EntryChoice";

/**
 * The entry screen: one question, two ways in. No navigation bar and no wall
 * of copy — the approved tagline, the question, and the two journeys. Every
 * other page carries a switch back to the other side.
 */
export default function Entry() {
  return (
    <div className="flex min-h-[100svh] flex-col">
      <a href="#ct-main" className="ct-skip">
        Skip to content
      </a>
      <header className="ct-wrap flex items-center justify-between gap-6 py-6">
        <Link href={ROUTES.home} aria-label="TALYNT LABS — home" className="shrink-0">
          <Image src="/brand/talynt-primary-light.svg" alt="" width={126} height={36} priority unoptimized className="h-9 w-auto" />
        </Link>
        <nav aria-label="Company">
          <ul className="flex items-center gap-1 text-[0.9rem]">
            {[
              { label: "About", href: ROUTES.about },
              { label: "FAQ", href: ROUTES.faq },
              { label: "Contact", href: ROUTES.contact },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-10 items-center rounded-[var(--ct-r-s)] px-2.5 text-[var(--ct-mute)] transition-colors hover:text-[var(--ct-ink)] sm:px-3">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="ct-main" tabIndex={-1} className="ct-wrap flex flex-1 flex-col justify-center pt-6 pb-10 outline-none md:pt-10">
        <div className="text-center">
          <p className="ct-meta ct-mute">{TAGLINE}</p>
          <h1 className="ct-display ct-xl mt-5">{ENTRY.question}</h1>
        </div>
        <div className="mt-10 md:mt-14">
          <EntryChoice />
        </div>
      </main>

      <footer className="ct-wrap flex flex-col gap-3 border-t py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="ct-small max-w-xl text-[0.86rem]">{ENTRY.remembered}</p>
        <ul className="ct-meta ct-mute flex items-center gap-4">
          <li>
            <Link href={ROUTES.privacy} className="hover:text-[var(--ct-ink)]">
              Privacy
            </Link>
          </li>
          <li>
            <Link href={ROUTES.terms} className="hover:text-[var(--ct-ink)]">
              Terms
            </Link>
          </li>
          <li>© {new Date().getFullYear()} TALYNT LABS</li>
        </ul>
      </footer>
    </div>
  );
}
