import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/chrome/Navigation";
import { Footer } from "@/components/chrome/Footer";
import { ScrollProgress } from "@/components/chrome/ScrollProgress";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
});

const SITE_URL = "https://talyntlabs.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TALYNT LABS — Talent Intelligence, Built for Hiring",
    template: "%s — TALYNT LABS",
  },
  description:
    "TALYNT LABS combines deep talent sourcing, human conversations and intelligent technology to help companies make better hiring decisions.",
  applicationName: "TALYNT LABS",
  authors: [{ name: "TALYNT LABS" }],
  keywords: [
    "talent intelligence",
    "executive search",
    "technical recruitment",
    "talent sourcing",
    "hiring",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "TALYNT LABS",
    title: "TALYNT LABS — Talent Intelligence, Built for Hiring",
    description:
      "Deep sourcing, human conversations and intelligent technology — so companies hire people who fit the role, the team and the context.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TALYNT LABS — Talent Intelligence, Built for Hiring",
    description:
      "Deep sourcing, human conversations and intelligent technology — so companies hire people who fit the role, the team and the context.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  width: "device-width",
  initialScale: 1,
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TALYNT LABS",
  url: SITE_URL,
  slogan: "Talent intelligence, built for hiring.",
  description:
    "TALYNT LABS combines deep talent sourcing, human conversations and intelligent technology to help companies make better hiring decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${newsreader.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          // Structured data is static, author-controlled content.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-signal focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-paper-50"
        >
          Skip to content
        </a>
        <ScrollProgress />
        <Navigation />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
