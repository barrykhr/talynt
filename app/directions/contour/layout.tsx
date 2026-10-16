import type { Metadata, Viewport } from "next";
import { Source_Serif_4 } from "next/font/google";
import "./contour.css";
import { Nav } from "@/components/contour/chrome/Nav";
import { Footer } from "@/components/contour/chrome/Footer";
import { WhatsAppButton } from "@/components/contour/chrome/WhatsAppButton";
import { MotionProvider } from "@/components/contour/MotionProvider";

/**
 * DIRECTION C — "CONTOUR"
 *
 * The same brand, the same approved copy, the same candidate data and the same
 * endpoints as the live site — expressed light, editorial and map-like.
 *
 * Type: Source Serif 4 is the human voice (display), Geist is the interface
 * (it is the wordmark's own face), Geist Mono is the machine (signals and
 * metadata). Geist and Geist Mono are already loaded by the root layout, so
 * this direction adds one family.
 *
 * The approved site's chrome steps aside for /directions (see SiteChrome), so
 * nothing here touches it.
 */

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-ct-serif",
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "TALYNT LABS — Talent intelligence, built for hiring · Direction C",
    template: "%s — TALYNT LABS · Direction C",
  },
  description:
    "Design direction C for TALYNT LABS: a light, editorial alternative built on the approved content, the live candidate data and the existing enquiry and application workflows.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#fafaf7",
};

export default function ContourLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`ct ${serif.variable}`}>
      <MotionProvider>
        <a href="#ct-main" className="ct-skip">
          Skip to content
        </a>
        <Nav />
        <main id="ct-main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <Footer />
        <WhatsAppButton />
      </MotionProvider>
    </div>
  );
}
