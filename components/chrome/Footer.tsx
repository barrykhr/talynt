import Link from "next/link";
import { Mark } from "@/components/primitives/Wordmark";

const COLUMNS: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
  {
    title: "Company",
    links: [
      { label: "How we work", href: "/#how-we-work" },
      { label: "Talent intelligence", href: "/#intelligence" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/#contact" },
    ],
  },
  {
    title: "Audiences",
    links: [
      { label: "For companies", href: "/#companies" },
      { label: "For talent", href: "/#for-talent" },
      { label: "Capabilities", href: "/#capabilities" },
      { label: "Global", href: "/#global" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="tone-ink border-t border-paper-100/10">
      <div className="wrap py-20 md:py-24">
        <div className="grid gap-16 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-start gap-4">
              <Mark className="h-9 w-9 shrink-0" />
              <div>
                <p className="display-sans text-[1.6rem] leading-none uppercase">
                  Talynt
                </p>
                <p className="mono-micro mt-2 text-signal">Labs</p>
              </div>
            </div>
            <p className="display mt-8 max-w-sm text-(length:--text-h3) opacity-80">
              Talent intelligence, built for hiring.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <p className="mono-micro mb-5 opacity-40">{column.title}</p>
                <ul className="flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[0.92rem] opacity-65 transition-opacity duration-300 hover:opacity-100"
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

        <div className="mt-20 flex flex-col gap-6 border-t border-paper-100/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono-micro opacity-40">
            © {new Date().getFullYear()} TALYNT LABS. All rights reserved.
          </p>
          <div className="flex items-center gap-7">
            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mono-micro opacity-65 transition-opacity duration-300 hover:opacity-100"
            >
              LinkedIn ↗
            </a>
            <Link
              href="/#contact"
              className="mono-micro text-signal transition-opacity duration-300 hover:opacity-70"
            >
              Client login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
