import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives/PageHeader";
import { Section } from "@/components/primitives/Section";
import { PassportEditor } from "@/components/candidate/PassportEditor";

export const metadata: Metadata = {
  title: "Career Passport",
  description:
    "Where you've been, where you are, and where this is going — recorded once, on your own device, and shared only when you choose a role.",
  alternates: { canonical: "/candidates/passport" },
};

export default function PassportPage() {
  return (
    <>
      <PageHeader
        eyebrow="Career Passport"
        title={
          <>
            Not a profile.
            <br />
            <span className="italic">A record of what you want.</span>
          </>
        }
        lede="Eight sections, answered in any order, saved as you go. It stays in this browser until you send it with an application — no account, no server copy, nothing in a database clients can search."
      />
      <Section flush className="pb-(--spacing-section)">
        <div className="wrap">
          <PassportEditor />
        </div>
      </Section>
    </>
  );
}
