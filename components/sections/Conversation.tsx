"use client";

import { useState } from "react";
import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { ConversationTranscript } from "@/components/cards/ConversationTranscript";
import { SignalPanel } from "@/components/cards/SignalPanel";
import type { SignalId } from "@/lib/conversation";

export function Conversation() {
  const [active, setActive] = useState<SignalId | null>(null);

  return (
    <Section id="conversation" tone="ink" aria-labelledby="conversation-heading">
      <div className="wrap">
        <SectionHeader
          index="05"
          eyebrow="Conversation intelligence"
          headingId="conversation-heading"
          title={
            <>
              A CV tells us what someone has done.
              <br />
              <span className="italic">A conversation tells us why.</span>
            </>
          }
          lede="We structure conversations to uncover the context a resume cannot. Select a phrase to see the signal it informed — or a signal to find the words behind it."
        />

        <div className="mt-20 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Reveal>
            <ConversationTranscript active={active} onSelect={setActive} />
          </Reveal>
          <Reveal delay={0.1}>
            <SignalPanel active={active} onSelect={setActive} />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
