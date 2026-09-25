import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives/PageHeader";
import { Section } from "@/components/primitives/Section";
import { RoleExplorer } from "@/components/candidate/RoleExplorer";

export const metadata: Metadata = {
  title: "Explore roles",
  description:
    "Open roles with the reasoning behind them, the compensation band stated up front, and an honest note on what is hard about each one.",
  alternates: { canonical: "/candidates/roles" },
};

export default function RolesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Explore roles"
        title={
          <>
            Every role here has a <span className="italic">reason</span> it exists.
          </>
        }
        lede="Company names come in conversation, not on a listing — that is the client's call and we respect it. Everything else is on the page: the band, the team, the process, and what to consider before you apply."
      />
      <Section flush className="pb-(--spacing-section)">
        <div className="wrap">
          <RoleExplorer />
        </div>
      </Section>
    </>
  );
}
