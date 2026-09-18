import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/chrome/Footer";
import { SiteChrome } from "@/components/chrome/SiteChrome";

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
      <head>
        {/* Without JavaScript the scroll-reveal never fires, so make sure the
            content is still there for readers and crawlers that don't run it. */}
        <noscript>
          <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <script
          type="application/ld+json"
          // Structured data is static, author-controlled content.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <SiteChrome footer={<Footer />}>{children}</SiteChrome>
      </body>
    </html>
  );
}
