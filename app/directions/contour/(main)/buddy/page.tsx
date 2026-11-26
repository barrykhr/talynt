import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TALYN_EDITION } from "@/lib/contour/variant";
import { BuddyVoice } from "@/components/contour/talyn/BuddyVoice";

export const metadata: Metadata = {
  title: "Meet Buddy",
  description: "Talk to Buddy, the AI hiring agent by TALYNT LABS: tell it your hiring problem and it builds a brief for our team.",
};

/** Meet Buddy — the spoken intake. Only in the Buddy editions (NEXT_PUBLIC_CT_EDITION). */
export default function BuddyPage() {
  if (!TALYN_EDITION) notFound();
  return (
    <section aria-label="Talk to Buddy" className="bv-page">
      <div className="ct-wrap">
        <BuddyVoice />
      </div>
    </section>
  );
}
