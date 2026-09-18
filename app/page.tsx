import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { Philosophy } from "@/components/sections/Philosophy";
import { Sourcing } from "@/components/sections/Sourcing";
import { Context } from "@/components/sections/Context";
import { Conversation } from "@/components/sections/Conversation";
import { Fit } from "@/components/sections/Fit";
import { HumanAI } from "@/components/sections/HumanAI";
import { Intelligence } from "@/components/sections/Intelligence";

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
    </>
  );
}
