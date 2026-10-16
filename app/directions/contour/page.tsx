import { Hero } from "@/components/contour/home/Hero";
import { Philosophy, Problem } from "@/components/contour/home/Problem";
import {
  ConvertSection,
  FaqSection,
  HowItWorksSection,
  HumanSection,
  IntelligenceSection,
  JourneysSection,
  ProductSection,
} from "@/components/contour/home/Sections";

/**
 * Direction C homepage. One argument, told in order:
 *
 *   the position (hero) → the problem → the philosophy → the search, drawn →
 *   two journeys and where they meet → the product → the human element →
 *   how it works for each side → the next step for each side → questions.
 */
export default function ContourHome() {
  return (
    <>
      <Hero />
      <Problem />
      <Philosophy />
      <IntelligenceSection />
      <JourneysSection />
      <ProductSection />
      <HumanSection />
      <HowItWorksSection />
      <ConvertSection />
      <FaqSection />
    </>
  );
}
