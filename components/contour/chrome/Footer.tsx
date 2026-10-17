import Image from "next/image";
import Link from "next/link";
import { EMAIL, LINKEDIN, ROUTES, whatsappHref } from "@/lib/contour/site";
import { Meeting } from "@/components/contour/graphics/Meeting";
import { LinkedInIcon, WhatsAppIcon } from "./Icons";

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Employers",
    links: [
      { label: "For employers", href: ROUTES.employers },
      { label: "How we work", href: `${ROUTES.employers}#how-we-work` },
      { label: "Client visibility", href: `${ROUTES.employers}#visibility` },
      { label: "Start a search", href: ROUTES.enquiry },
    ],
  },
  {
    title: "Candidates",
    links: [
      { label: "For candidates", href: ROUTES.candidates },
      { label: "Explore opportunities", href: ROUTES.opportunities },
      { label: "Submit your profile", href: ROUTES.profile },
      { label: "Your dashboard", href: ROUTES.applications },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "FAQ", href: ROUTES.faq },
      { label: "Contact", href: ROUTES.contact },
      { label: "About", href: ROUTES.about },
      { label: "How we evaluate", href: ROUTES.howWeEvaluate },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: ROUTES.privacy },
      { label: "Terms", href: ROUTES.terms },
    ],
  },
];

export function Footer() {
  const whatsapp = whatsappHref();

  return (
    <footer id="ct-footer" className="ct-tint border-t">
      <div className="ct-wrap pt-16 pb-10 md:pt-20">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_2fr] lg:gap-20">
          <div className="flex flex-col gap-8">
            {/* The endorsed lockup — the approved first-impression mark. */}
            <Image
              src="/brand/talynt-tagline-light.svg"
              alt="TALYNT LABS — Talent intelligence, built for hiring."
              width={210}
              height={80}
              unoptimized
              className="h-auto w-[210px]"
            />
            <Meeting className="w-full max-w-[17rem]" decorative />
            <div className="flex flex-col gap-1.5 text-[0.92rem]">
              <a href={`mailto:${EMAIL.general}`} className="ct-link w-fit">
                {EMAIL.general}
              </a>
              <a href={`mailto:${EMAIL.talent}`} className="w-fit text-[var(--ct-mute)] hover:text-[var(--ct-ink)]">
                {EMAIL.talent} <span className="ct-meta ct-mute">· candidates</span>
              </a>
            </div>
            {(LINKEDIN || whatsapp) && (
              <ul className="flex items-center gap-2" aria-label="TALYNT LABS elsewhere">
                {LINKEDIN && (
                  <li>
                    <a
                      href={LINKEDIN}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-11 items-center justify-center rounded-[var(--ct-r-m)] border ct-b2 text-[var(--ct-ink-2)] transition-colors ct-hb-ink hover:text-[var(--ct-ink)]"
                    >
                      <LinkedInIcon />
                      <span className="sr-only">TALYNT LABS on LinkedIn (opens in a new tab)</span>
                    </a>
                  </li>
                )}
                {whatsapp && (
                  <li>
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-11 items-center justify-center rounded-[var(--ct-r-m)] border ct-b2 text-[var(--ct-ink-2)] transition-colors ct-hb-ink hover:text-[var(--ct-ink)]"
                    >
                      <WhatsAppIcon />
                      <span className="sr-only">Message TALYNT LABS on WhatsApp (opens in a new tab)</span>
                    </a>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <p className="ct-meta ct-mute">{column.title}</p>
                <ul className="mt-5 flex flex-col gap-1">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-9 items-center text-[0.94rem] text-[var(--ct-ink-2)] transition-colors hover:text-[var(--ct-green)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t ct-b2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="ct-meta ct-mute">© {new Date().getFullYear()} TALYNT LABS. All rights reserved.</p>
          <p className="ct-meta ct-mute flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>Direction C — Contour · design review build</span>
            <Link href="/" className="ct-green hover:underline">
              Current site →
            </Link>
            <Link href="/directions/passage" className="ct-green hover:underline">
              Direction B →
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
