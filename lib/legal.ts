import type { LegalSection } from "@/components/primitives/LegalBody";

/**
 * The legal text, in one place. The approved /privacy and /terms pages and the
 * design directions all render from here, so there is only ever one version.
 */

export const LEGAL_UPDATED = "September 2026";

export const PRIVACY_SECTIONS: LegalSection[] = [
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

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "These terms",
    paragraphs: [
      "These terms govern your use of this website. They do not govern any search we run for you — that work is covered by a separate written agreement.",
    ],
  },
  {
    heading: "Illustrative content",
    paragraphs: [
      "The product interfaces shown on this site are illustrative. Candidate references, names, companies, pipeline figures and evaluation readings shown within them are fictional and are there to demonstrate how our work is presented. They are not client data, and they are not claims about outcomes we have delivered.",
      "Where a figure appears without a stated source, treat it as an example rather than a metric.",
    ],
  },
  {
    heading: "Using the site",
    list: [
      "You may read, share and reference this site.",
      "You may not scrape it, reproduce it as your own, or use it to train systems without our written permission.",
      "You may not attempt to disrupt the site or gain access to anything on it that is not public.",
    ],
  },
  {
    heading: "No guarantee of outcome",
    paragraphs: [
      "Nothing on this site is a guarantee that a search will produce a particular hire, in a particular time, at a particular cost. What we commit to on an engagement is set out in the agreement for that engagement.",
    ],
  },
  {
    heading: "Intellectual property",
    paragraphs: [
      "The TALYNT and TALYNT LABS names, the wordmark, the site design and the software behind our platform belong to TALYNT LABS.",
    ],
  },
  {
    heading: "Third-party links",
    paragraphs: [
      "Where we link to another site, we are not responsible for what is on it.",
    ],
  },
  {
    heading: "Liability",
    paragraphs: [
      "We provide this website as it is. To the extent the law allows, we are not liable for loss arising from your use of it.",
    ],
  },
  {
    heading: "Governing law",
    paragraphs: [
      "These terms are governed by the laws of India, and the courts of India have jurisdiction over any dispute arising from them.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: ["Questions about these terms can go to hello@talyntlabs.com."],
  },
];
