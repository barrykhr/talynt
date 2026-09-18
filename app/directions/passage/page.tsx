import type { Metadata } from "next";
import { Fraunces, Inter_Tight } from "next/font/google";
import "./passage.css";
import { PassageNav, Marquee, PassageFooter } from "@/components/directions/passage/Chrome";
import { PassageHero } from "@/components/directions/passage/Hero";
import { Journey } from "@/components/directions/passage/Journey";
import { Proof } from "@/components/directions/passage/Proof";
import { Close } from "@/components/directions/passage/Close";

/**
 * DIRECTION B — "PASSAGE"
 *
 * An alternative expression of the same brand and the same copy: photography-led
 * and cinematic rather than instrument-led and editorial, light rather than dark,
 * a warm display serif against a neo-grotesque rather than a news serif against
 * a geometric sans.
 *
 * Direction A argues by showing the machinery. This one argues by showing the
 * people the machinery is for.
 */

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Passage — Design direction B",
  description:
    "An alternative design direction for TALYNT LABS: photography-led, cinematic, light-dominant.",
  robots: { index: false, follow: false },
};

export default function PassagePage() {
  return (
    <div className={`passage ${fraunces.variable} ${interTight.variable}`}>
      <PassageNav />
      <main>
        <PassageHero />
        <Marquee />
        <Journey />
        <Proof />
        <Close />
      </main>
      <PassageFooter />
    </div>
  );
}
