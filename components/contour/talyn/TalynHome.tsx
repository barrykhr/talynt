import { EDITION } from "@/lib/contour/variant";
import { HiringFilm } from "@/components/contour/film/HiringFilm";
import {
  TalynCapabilities,
  TalynClose,
  TalynDifference,
  TalynFaq,
  TalynHero,
  TalynHow,
  TalynInsights,
  TalynPricing,
  TalynPrivacy,
  TalynProblem,
  TalynWho,
} from "./Sections";

/**
 * The Talyn editions' homepage.
 *   film     the scroll-flipped film tells "how it works"; the sections follow.
 *   product  the Talyn console opens; the seven steps, then a product tour.
 */
export function TalynHome() {
  if (EDITION === "film") {
    return (
      <>
        <div id="how" className="scroll-mt-0">
          <HiringFilm talyn />
        </div>
        <TalynProblem index="01" />
        <TalynInsights index="02" />
        <TalynCapabilities index="03" />
        <TalynDifference index="04" />
        <TalynWho index="05" />
        <TalynPrivacy index="06" />
        <TalynPricing index="07" />
        <TalynFaq index="08" />
        <TalynClose />
      </>
    );
  }
  return (
    <>
      <TalynHero />
      <TalynProblem index="01" />
      <TalynHow index="02" />
      <TalynInsights index="03" />
      <TalynCapabilities index="04" tour />
      <TalynDifference index="05" />
      <TalynWho index="06" />
      <TalynPrivacy index="07" />
      <TalynPricing index="08" />
      <TalynFaq index="09" />
      <TalynClose />
    </>
  );
}
