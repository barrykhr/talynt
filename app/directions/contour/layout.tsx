import type { Metadata, Viewport } from "next";
import { Source_Serif_4 } from "next/font/google";
import "./contour.css";
import "./motion.css";
import "./film.css";
import { MotionProvider } from "@/components/contour/MotionProvider";
import { MOTION, THEME_COLOR, VARIANT } from "@/lib/contour/variant";

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
 *
 * Two kinds of page sit under this layout: the entry screen (./page.tsx), which
 * is the opening choice and carries no navigation, and everything else in
 * (main), which shares the navigation and footer.
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
    // Absolute, so the root layout's "%s — TALYNT LABS" isn't appended to the home page title.
    absolute: "TALYNT LABS — Talent intelligence, built for hiring · Direction C",
    template: "%s — TALYNT LABS · Direction C",
  },
  description:
    "Design direction C for TALYNT LABS: a light, editorial alternative built on the approved content, the live candidate data and the existing enquiry and application workflows.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
};

export default function ContourLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`ct ${MOTION ? `ct-v ct-${VARIANT} ct-motion ` : ""}${serif.variable}`}>
      <MotionProvider>{children}</MotionProvider>
    </div>
  );
}
