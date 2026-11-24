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
  TalynMeet,
  TalynPricing,
  TalynPrivacy,
  TalynProblem,
  TalynWho,
} from "./Sections";
import { MeetTalynPopup } from "./MeetTalynPopup";

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
        <TalynMeet index="01" />
        <TalynProblem index="02" />
        <TalynInsights index="03" />
        <TalynCapabilities index="04" />
        <TalynDifference index="05" />
        <TalynWho index="06" />
        <TalynPrivacy index="07" />
        <TalynPricing index="08" />
        <TalynFaq index="09" />
        <TalynClose />
        <MeetTalynPopup />
      </>
    );
  }
  return (
    <>
      <TalynHero />
      <TalynMeet index="01" />
      <TalynProblem index="02" />
      <TalynHow index="03" />
      <TalynInsights index="04" />
      <TalynCapabilities index="05" tour />
      <TalynDifference index="06" />
      <TalynWho index="07" />
      <TalynPrivacy index="08" />
      <TalynPricing index="09" />
      <TalynFaq index="10" />
      <TalynClose />
      <MeetTalynPopup />
    </>
  );
}
