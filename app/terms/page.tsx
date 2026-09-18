import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives/PageHeader";
import { LegalBody, type LegalSection } from "@/components/primitives/LegalBody";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The terms on which TALYNT LABS makes this website available, including how to read the illustrative interface content shown on it.",
};

const SECTIONS: LegalSection[] = [
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

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Terms"
        title="The terms of this site."
        lede="Short, and worth reading if you are looking at the interfaces on the homepage and wondering what is real."
      />
      <LegalBody sections={SECTIONS} updated="September 2026" />
    </>
  );
}
