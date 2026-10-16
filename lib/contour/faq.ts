/**
 * FAQ — PROPOSED COPY, FOR APPROVAL.
 *
 * The approved site has no FAQ, so there is nothing to preserve here. Every
 * answer below is assembled only from statements the site already makes, and
 * each one names its source so a reviewer can check it against the original.
 * Where the honest answer is "this site doesn't do that yet", it says so.
 * Nothing here adds a policy, a promise or a capability.
 */

import { EMAIL, ROUTES } from "./site";

export type FaqSource = { label: string; href: string };

export type Faq = {
  id: string;
  category: CategoryId;
  question: string;
  answer: string[];
  sources: FaqSource[];
  /** Shown on the homepage preview. */
  featured?: boolean;
};

export const CATEGORIES = [
  { id: "general", label: "General" },
  { id: "employers", label: "Employers" },
  { id: "candidates", label: "Candidates" },
  { id: "privacy", label: "Privacy and support" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

const SRC = {
  home: { label: "Homepage", href: "/" },
  about: { label: "About", href: ROUTES.about },
  privacy: { label: "Privacy policy", href: ROUTES.privacy },
  terms: { label: "Terms", href: ROUTES.terms },
  evaluate: { label: "How we evaluate", href: ROUTES.howWeEvaluate },
  candidates: { label: "For candidates", href: "/candidates" },
  roles: { label: "Explore roles", href: "/candidates/roles" },
  passport: { label: "Career Passport", href: "/candidates/passport" },
  saved: { label: "Saved roles", href: "/candidates/saved" },
} satisfies Record<string, FaqSource>;

export const FAQS: Faq[] = [
  /* --- General ---------------------------------------------------------- */
  {
    id: "what-is-talynt-labs",
    category: "general",
    featured: true,
    question: "What is TALYNT LABS?",
    answer: [
      "TALYNT LABS sits between executive search, modern recruitment and talent intelligence. We were built around one idea: that better hiring decisions come from better signals, not more profiles.",
      "We combine deep sourcing, human conversations and intelligent technology to help companies find people who fit the role, the team and the context.",
    ],
    sources: [SRC.about, SRC.home],
  },
  {
    id: "how-does-talynt-work",
    category: "general",
    question: "How does TALYNT work?",
    answer: [
      "Every search goes through six layers we refuse to skip: we understand your business, team and role; define the hiring context; discover people across the talent market, including people who were never going to apply; evaluate experience, skills, motivation, context and conversation together; calibrate from your feedback; and give you a focused shortlist with the reasoning behind every candidate.",
      "Technology helps us structure information and surface meaningful signals. Human judgment brings the context.",
    ],
    sources: [SRC.home],
  },
  {
    id: "is-the-interface-real",
    category: "general",
    question: "Are the product interfaces on this site real data?",
    answer: [
      "No. The product interfaces shown on this site are illustrative. Candidate references, names, companies, pipeline figures and evaluation readings shown within them are fictional and are there to demonstrate how our work is presented. They are not client data, and they are not claims about outcomes we have delivered.",
    ],
    sources: [SRC.terms],
  },

  /* --- Employers -------------------------------------------------------- */
  {
    id: "start-a-hiring-conversation",
    category: "employers",
    featured: true,
    question: "How do I start a hiring conversation?",
    answer: [
      `Tell us what you’re building, what you’re hiring for and where you need help — through the enquiry form, or by writing to ${EMAIL.general}. We reply to every enquiry, including the ones we can’t help with.`,
    ],
    sources: [SRC.home],
  },
  {
    id: "what-information-is-needed",
    category: "employers",
    question: "What information is needed to discuss a hiring requirement?",
    answer: [
      "To start, only your name and a work email. The form also asks for your company and what you are hiring for, and leaves room for a message.",
      "Once we are talking, we go well beyond the job description: the business context, the team, the role, how the person they report to actually leads, what success would look like at six months, and the honest case for the opportunity. A job description is not a hiring context.",
    ],
    sources: [SRC.home],
  },
  {
    id: "how-does-recruitment-work",
    category: "employers",
    question: "How does the recruitment process work?",
    answer: [
      "We search where the role actually lives — not only where people are already applying. A recruiter reads every profile that reaches screening; there is no automated rejection. Structured conversations cover motivation, ownership, communication and context.",
      "We would rather present four highly relevant people with clear reasoning than twenty loosely matched profiles, and each comes with what to watch for. The second shortlist is sharper than the first, because we learn from your feedback.",
    ],
    sources: [SRC.home],
  },
  {
    id: "which-roles-and-markets",
    category: "employers",
    question: "Which roles and markets do you cover?",
    answer: [
      "Technology (engineering, AI, data, product), go-to-market (sales, marketing, customer success), leadership (executives, functional leaders, critical hires) and operations (finance, people, operations and business functions).",
      "We are built to search across India, the United States, the United Kingdom, Europe, the Middle East and APAC. Coverage on a given mandate is agreed before the search begins.",
    ],
    sources: [SRC.home],
  },

  /* --- Candidates ------------------------------------------------------- */
  {
    id: "do-i-need-an-account",
    category: "candidates",
    featured: true,
    question: "Do I need an account to explore roles?",
    answer: [
      "No. There are no accounts on this site. Every open role can be read in full — including the compensation band, the team, the process and what to consider before you apply — without signing up for anything.",
    ],
    sources: [SRC.roles],
  },
  {
    id: "how-do-i-submit-my-profile",
    category: "candidates",
    featured: true,
    question: "How can I submit my profile?",
    answer: [
      "Build your Career Passport — where you’ve been, where you are and where this is going — and send it with an application to a specific role. Your profile only ever reaches us with a role you have chosen and confirmed.",
      "There is no general talent pool on this site yet, and no profile of you reaches a company without you choosing that role and confirming it.",
    ],
    sources: [SRC.candidates, SRC.passport],
  },
  {
    id: "how-is-my-information-used",
    category: "candidates",
    question: "How is my information used?",
    answer: [
      "To assess whether a role and a candidate are a genuine match, to explain our reasoning to the client, and to keep you informed about a search you are part of. We do not sell personal information.",
      "An application is passed to the one client whose role you applied to. It is not added to a database that other clients search, and it is not used for any other role without asking you again.",
    ],
    sources: [SRC.privacy],
  },
  {
    id: "can-i-update-my-profile",
    category: "candidates",
    question: "Can I update my profile?",
    answer: [
      "Yes. Your Career Passport is saved in this browser as you type, and you can change or erase any of it at any time. Because it lives on this device, it is not on your other devices, and clearing your browser data clears it.",
      `For anything you have already sent us, you can ask us to correct it or delete it by writing to ${EMAIL.privacy}.`,
    ],
    sources: [SRC.passport, SRC.privacy],
  },
  {
    id: "application-status",
    category: "candidates",
    question: "How can I check my application status?",
    answer: [
      "Your dashboard shows what this browser saved and sent, and whether each application was delivered. It is a record, not a live status: there is no interview or offer stage on this site, because nothing reports one back to it.",
      `A person reads every application — not a filter. You’ll hear from us within five working days either way, with a reason. If that doesn’t happen, chase us at ${EMAIL.talent}.`,
    ],
    sources: [SRC.saved, SRC.candidates],
  },
  {
    id: "is-there-a-score",
    category: "candidates",
    question: "Do you score candidates or reject them automatically?",
    answer: [
      "No score. We write down named signals, each with the evidence behind it, and we show you the same ones we show the client.",
      "We do not use automated processing alone to reject a candidate — every candidate who reaches evaluation is read by a person.",
    ],
    sources: [SRC.evaluate, SRC.privacy],
  },
  {
    id: "why-no-company-names",
    category: "candidates",
    question: "Why don’t role listings name the company?",
    answer: [
      "Company names come in conversation, not on a listing — that is the client’s call and we respect it. Everything else is on the page: the band, the team, the process, and what to consider before you apply.",
    ],
    sources: [SRC.roles],
  },

  /* --- Privacy and support ---------------------------------------------- */
  {
    id: "who-can-access-my-information",
    category: "privacy",
    featured: true,
    question: "Who can access my information?",
    answer: [
      "We share candidate information with a client only when the candidate has agreed to be put forward for that specific role. We use a small number of service providers — for example hosting, email and applicant tracking infrastructure — who process information on our instructions and are bound to keep it confidential.",
      "We restrict access to personal information to the people who need it to do the work.",
    ],
    sources: [SRC.privacy],
  },
  {
    id: "contact-the-team",
    category: "privacy",
    question: "How can I contact the team?",
    answer: [
      `Employers: ${EMAIL.general}, or the enquiry form. Candidates: ${EMAIL.talent}. Anything about your personal information: ${EMAIL.privacy}.`,
    ],
    sources: [SRC.home, SRC.privacy],
  },
  {
    id: "request-help",
    category: "privacy",
    question: "How can I request help with my data?",
    answer: [
      `You can ask us what we hold about you, ask us to correct it, ask us to delete it, or object to how we are using it. Write to ${EMAIL.privacy} and we will respond.`,
    ],
    sources: [SRC.privacy],
  },
];
