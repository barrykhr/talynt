import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives/PageHeader";
import { LegalBody, type LegalSection } from "@/components/primitives/LegalBody";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How TALYNT LABS handles personal information belonging to candidates, clients and visitors to this website.",
  robots: { index: true, follow: true },
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Who we are",
    paragraphs: [
      "TALYNT LABS is a talent intelligence and recruitment company. This policy explains how we handle personal information belonging to visitors to this website, to candidates we speak with, and to the people we work with at client companies.",
    ],
  },
  {
    heading: "Information we collect",
    list: [
      "Information you give us directly — your name, work email, company and anything you write in an enquiry form or send to us by email.",
      "Candidate information — your CV or professional history, the notes and structured records of conversations you have with us, and the preferences you share about roles, compensation and location.",
      "Information from professional and public sources — professional networking profiles, public portfolios, company websites and talent databases we license.",
      "Technical information — standard server logs generated when you load this website, including IP address, browser type and the pages requested.",
    ],
  },
  {
    heading: "How we use it",
    list: [
      "To respond to enquiries and to run searches we have been engaged to run.",
      "To assess whether a role and a candidate are a genuine match, and to explain our reasoning to the client.",
      "To keep you informed about a search you are part of.",
      "To operate, secure and improve our own recruitment tooling.",
    ],
    paragraphs: [
      "We do not sell personal information. We do not use automated processing alone to reject a candidate — every candidate who reaches evaluation is read by a person.",
    ],
  },
  {
    heading: "Sharing your information",
    paragraphs: [
      "We share candidate information with a client only when the candidate has agreed to be put forward for that specific role. We use a small number of service providers — for example hosting, email and applicant tracking infrastructure — who process information on our instructions and are bound to keep it confidential.",
      "We may disclose information where we are legally required to do so.",
    ],
  },
  {
    heading: "Keeping it",
    paragraphs: [
      "We keep candidate information for as long as it remains useful for the purpose it was shared with us, and for as long as we are required to keep records. If you would prefer that we did not keep it, tell us and we will remove it.",
    ],
  },
  {
    heading: "Your rights",
    paragraphs: [
      "You can ask us what we hold about you, ask us to correct it, ask us to delete it, or object to how we are using it. Write to privacy@talyntlabs.com and we will respond.",
    ],
  },
  {
    heading: "Security",
    paragraphs: [
      "We restrict access to personal information to the people who need it to do the work, and we hold it in systems protected by access controls and encryption in transit. No system is perfect; if something goes wrong that affects you, we will tell you.",
    ],
  },
  {
    heading: "Changes and contact",
    paragraphs: [
      "If this policy changes in a way that affects you, we will update the date at the top of this page. Questions about any of it can go to privacy@talyntlabs.com.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title="What we hold, and why."
        lede="We ask candidates to trust us with their career, and clients to trust us with their hiring. This page explains what happens to the information that changes hands."
      />
      <LegalBody sections={SECTIONS} updated="September 2026" />
    </>
  );
}
