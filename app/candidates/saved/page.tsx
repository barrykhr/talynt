import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives/PageHeader";
import { Section } from "@/components/primitives/Section";
import { SavedList } from "@/components/candidate/SavedList";

export const metadata: Metadata = {
  title: "Saved roles",
  description:
    "The roles you've saved on this device, and a record of what you've sent.",
  alternates: { canonical: "/candidates/saved" },
  robots: { index: false, follow: true },
};

export default function SavedPage() {
  return (
    <>
      <PageHeader
        eyebrow="Saved roles"
        title={
          <>
            Read it twice
            <br />
            <span className="italic">before you decide.</span>
          </>
        }
        lede="Saved roles and sent applications live in this browser. Nothing here has been shared with a company, and saving a role tells nobody anything."
      />
      <Section flush className="pb-(--spacing-section)">
        <div className="wrap">
          <SavedList />
        </div>
      </Section>
    </>
  );
}
