import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { Philosophy } from "@/components/sections/Philosophy";
import { Sourcing } from "@/components/sections/Sourcing";
import { Context } from "@/components/sections/Context";
import { Conversation } from "@/components/sections/Conversation";
import { Fit } from "@/components/sections/Fit";
import { HumanAI } from "@/components/sections/HumanAI";
import { Intelligence } from "@/components/sections/Intelligence";
import { Quality } from "@/components/sections/Quality";
import { HowWeWork } from "@/components/sections/HowWeWork";
import { ClientVisibility } from "@/components/sections/ClientVisibility";
import { Convergence } from "@/components/sections/Convergence";
import { Scale } from "@/components/sections/Scale";
import { Global } from "@/components/sections/Global";
import { ForTalent } from "@/components/sections/ForTalent";
import { Capabilities } from "@/components/sections/Capabilities";
import { Manifesto } from "@/components/sections/Manifesto";
import { FinalCTA } from "@/components/sections/FinalCTA";

/**
 * The homepage is a single narrative, not a stack of sections:
 * problem → philosophy → sourcing → context → conversation → intelligence →
 * human judgment → process → visibility → partnership → decision.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Philosophy />
      <Sourcing />
      <Context />
      <Conversation />
      <Fit />
      <HumanAI />
      <Intelligence />
      <Quality />
      <HowWeWork />
      <ClientVisibility />
      <Convergence />
      <Scale />
      <Global />
      <ForTalent />
      <Capabilities />
      <Manifesto />
      <FinalCTA />
    </>
  );
}
