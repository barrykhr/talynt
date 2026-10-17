/**
 * PROPOSED — every string in this file is new and needs TALYNT approval before
 * it goes live.
 *
 * Approved copy lives in ./content.ts, word for word, with its source named.
 * This file holds what the dual-entry experience, the reusable profile and the
 * role-specific assessments add. Where the brief supplied wording it is used as
 * given (typography aside); everything else is marked "(ours)".
 *
 * Nothing here promises a timeline, an interview, a job or an outcome.
 */

/** The opening choice. Wording from the brief. */
export const ENTRY = {
  question: "What brings you to TALYNT?",
  candidate: {
    label: "For candidates",
    title: "I’m looking for a job",
    body: "Explore opportunities, create your profile once, and discover roles that could be right for you.",
    cta: "Find my next opportunity",
  },
  employer: {
    label: "For employers",
    title: "I’m looking to hire",
    body: "Tell us who you’re looking for. We’ll help you find people who fit the role and the context behind it.",
    cta: "Find the right talent",
  },
  /** (ours) */
  lastTime: "Your last choice",
  remembered: "We remember your choice on this device only, so you aren’t asked again. Switch at any time from the top of any page.",
} as const;

/** (ours) The switch in the navigation. */
export const SWITCH = {
  label: "Choose your view",
  employers: "Employers",
  candidates: "Candidates",
} as const;

/* ===========================================================================
   Employers
   =========================================================================== */

/** Wording from the brief. */
export const EMPLOYER_HERO = {
  title: "Your next great hire shouldn’t depend on",
  titleItalic: "how many profiles someone can send you.",
  lede: "Tell us what the role needs. TALYNT helps you discover relevant people, understand their experience, and evaluate their fit against the requirements that matter.",
  primary: "Tell us who you’re looking for",
  secondary: "See how TALYNT works",
  /** (ours) */
  graphicLabel: "Concept · how a search narrows",
} as const;

/** (ours) The hero drawing's stages. A concept, not a live search. */
export const PROGRESSION = [
  { id: "brief", label: "The role brief" },
  { id: "requirements", label: "What it needs" },
  { id: "fragments", label: "People in the market" },
  { id: "relevant", label: "Relevant experience" },
  { id: "shortlist", label: "A shortlist, with context" },
] as const;

/**
 * (ours) The approved six layers (HOW_WE_WORK in content.ts) are the operating
 * model, so the employer page uses them as written. This adds only who does
 * each one, and where the role-specific assessment sits.
 */
export const HOW = {
  who: ["TALYNT and you", "TALYNT", "TALYNT, with technology", "TALYNT, with a role-specific assessment", "TALYNT and you", "You, with TALYNT"],
  searchLink: "See the search, drawn",
  detailLink: "How we work, in detail",
} as const;

/** Headline and lede from the brief; the panels are ours. */
export const CONTINUES = {
  eyebrow: "While you run the business",
  title: "You focus on the business.",
  titleItalic: "We’ll keep the talent search moving.",
  lede: "Once we understand the role, we work to identify relevant people, evaluate their experience against your requirements, and bring you profiles worth reviewing.",
  /** (ours) The honest qualifier. It stays next to the story wherever the story appears. */
  qualifier: "This describes how a search is organised, not a delivery time. How long a search takes depends on the role and the market.",
  panels: [
    {
      when: "During the day",
      title: "You share the role.",
      body: "We clarify it with you:",
      points: ["What the person needs to do", "The essential skills and experience", "The business context", "What the role expects in its first year"],
    },
    {
      when: "During the search",
      title: "The search narrows.",
      body: "Step by step:",
      points: ["Role requirements", "Talent discovery", "Relevant profiles identified", "Candidates evaluated", "Shortlist prepared"],
    },
    {
      when: "The next morning",
      title: "A shortlist with context.",
      body: "When you next look, you see who, and why:",
      points: ["Each person’s relevant experience", "Their assessment answers, quoted", "What a reviewer read in them", "What still needs asking"],
    },
  ],
} as const;

/** (ours) Role-specific evaluation, for employers. */
export const EVALUATION = {
  eyebrow: "Role-specific evaluation",
  title: "Evidence for the role you’re hiring for.",
  titleItalic: "Not a score.",
  lede: "Every application includes a short written assessment built from the role’s essential requirements. A TALYNT reviewer reads each answer against a rubric written for that role, and what you receive is the evidence — quoted from the candidate — with the reviewer’s reading kept separate from it.",
  steps: [
    { id: "requirements", label: "Role requirements", body: "The essential requirements, as agreed with you." },
    { id: "competencies", label: "Competencies", body: "What can fairly be assessed in writing, one per requirement." },
    { id: "questions", label: "Questions", body: "An experience question where the profile shows it, a realistic scenario where it doesn’t." },
    { id: "responses", label: "Responses", body: "The candidate’s own words, saved against this application only." },
    { id: "evidence", label: "Evidence", body: "Quotes, a reading, a rubric level, and what to ask next." },
  ],
  principles: [
    "Built from the role’s requirements, never from personal characteristics",
    "No time limits, no paid tools, nothing confidential asked for",
    "Versioned against the requirements it was written for",
    "Read by a person; nothing is rejected automatically",
  ],
  openReview: "Open the full review view",
} as const;

/** (ours) */
export const SHORTLIST = {
  eyebrow: "A shortlist with context",
  title: "Who, and",
  titleItalic: "why them.",
  lede: "A shortlisted candidate arrives with the role’s requirements on one side, their own profile and answers in the middle, and the evidence and open questions on the other — so the conversation you have next is the useful one.",
} as const;

/** (ours) */
export const DECISION = {
  eyebrow: "The human decision",
  title: "The assessment informs.",
  titleItalic: "You decide.",
  lede: "An assessment is one input, alongside the conversations, the candidate’s history and your own judgement. Nothing in it rejects anyone automatically, and nothing in it adds up to a single number.",
  points: [
    { title: "Evidence before interpretation", body: "What the candidate wrote is quoted. The reviewer’s reading is labelled as a reading." },
    { title: "Uncertainty is stated", body: "“Not enough to judge” is an answer, and it comes with the question to ask next." },
    { title: "Only what you are entitled to see", body: "You see the assessment for your role. Other clients never see it, and TALYNT’s internal notes stay internal." },
  ],
} as const;

/** (ours) The prototype review view. */
export const REVIEW = {
  eyebrow: "Assessment review",
  title: "One candidate, one role,",
  titleItalic: "all of the evidence.",
  lede: "The view a hiring manager would use: requirements on the left, the candidate’s profile and answers in the middle, the structured evaluation on the right.",
  demo: "Demonstration. The role and its assessment are real; the candidate, their answers and the evaluation are fictional, written to show the format. This is not a live client view — client access needs accounts, which this site does not have.",
  columns: { role: "The role", candidate: "The candidate", evaluation: "Evaluation" },
  boundariesTitle: "Who sees what",
  boundaries: [
    { title: "One client", body: "An application goes to the client whose role it is for, and to no other client." },
    { title: "Evidence, not notes", body: "TALYNT’s internal notes are removed before an evaluation is shared. A client sees the findings, the evidence and the summary." },
    { title: "Exactly what was asked", body: "Each assessment carries the requirements and rubric versions it was built from, so it is always read against the questions the candidate actually answered." },
    { title: "No automatic decisions", body: "There is no overall score and no automatic rejection. The decision belongs to the hiring team." },
  ],
  needsBackend:
    "To run this for real, client access needs accounts, a database and permissions enforced on the server — none of which this site has yet. The view above is built from the same data shapes and rules the backend would use.",
} as const;

/* ===========================================================================
   Candidates
   =========================================================================== */

/** Wording from the brief. */
export const CANDIDATE_HERO_PROPOSED = {
  title: "Your next opportunity should be",
  titleItalic: "more than another application.",
  lede: "Create your TALYNT profile once. Discover opportunities that fit your experience and interests, then show what you can bring to each role.",
  primary: "Explore opportunities",
  secondary: "Create my profile",
} as const;

/** Headline and body from the brief; labels ours. */
export const ONE_PROFILE = {
  eyebrow: "One profile, many applications",
  title: "One profile.",
  titleItalic: "More ways to find your next role.",
  lede: "Your experience shouldn’t need to be entered from scratch every time you apply. Build your TALYNT profile once, discover relevant roles, and complete a focused assessment for each opportunity.",
  profile: "Your profile",
  profileNote: "Written once. Reused by every application. Never changed by one.",
  assessment: "Its own assessment",
  graphicLabel: "One profile connecting to three of the open roles, each with an assessment built for it.",
} as const;

/** (ours) */
export const FIND = {
  eyebrow: "Find opportunities",
  title: "Search the roles",
  titleItalic: "that are actually open.",
  lede: "Search by keyword, location, work model, function and experience. Remote is a way of working, not a place, so it is a filter of its own.",
  search: "Search roles",
  placeholder: "Title, skill or keyword",
  employmentNote: "Every role is listed with its band and work model. Employment type isn’t filterable yet, because the role data doesn’t record it.",
} as const;

/** (ours) */
export const UNDERSTAND = {
  eyebrow: "Understand the role",
  title: "Know the role",
  titleItalic: "before you apply to it.",
  lede: "Each role says why it exists, what success looks like, what is essential, helpful and not required, the honest caveat, the band, and every step of its process.",
  anatomy: [
    { label: "Why it exists", body: "The business reason for the hire." },
    { label: "What success looks like", body: "At 90 days, six months and a year." },
    { label: "Essential · helpful · not required", body: "So you can tell what actually matters." },
    { label: "The honest caveat", body: "What is genuinely hard about it." },
    { label: "The process", body: "Every step, and when you’ll hear back." },
    { label: "Its assessment", body: "What it asks about, before you start." },
  ],
} as const;

/** (ours) */
export const ASSESSMENTS_FOR_CANDIDATES = {
  eyebrow: "Role-specific assessments",
  title: "An assessment",
  titleItalic: "written for the role.",
  lede: "When you apply, you answer a few written questions built from that role’s essential requirements — not a generic test reused for every job. Where your profile shows relevant experience, you’re asked about it. Where it doesn’t, you get a realistic scenario instead, so a gap in your CV isn’t held against you.",
  points: [
    { title: "No time limit", body: "Save as you go, leave, and come back on this device." },
    { title: "Nothing hidden", body: "Each question shows what a useful answer covers before you write." },
    { title: "Read by a person", body: "Against the role’s own criteria. It informs a decision; it doesn’t make one." },
    { title: "Kept to its role", body: "Your answers go with that one application, and nowhere else." },
  ],
  sampleLabel: "From a real role’s assessment",
} as const;

/** (ours) The real steps. */
export const JOURNEY = {
  eyebrow: "How applying works",
  title: "Every step,",
  titleItalic: "in order.",
  steps: [
    { title: "Create your profile", body: "Once. Your experience, skills, education and preferences." },
    { title: "Find a role", body: "Search, filter and save the ones worth a second read." },
    { title: "Read it properly", body: "What it needs, what it doesn’t, and its honest caveat." },
    { title: "Start your application", body: "Your assessment for that role is built from its requirements — once." },
    { title: "Answer, at your own pace", body: "Why this role, and a few written questions. Saved on this device as you go." },
    { title: "Review and send", body: "You see everything that will be sent before you send it." },
    { title: "A person reads it", body: "Then the role’s own process begins, starting with a conversation with TALYNT." },
  ],
} as const;

/** (ours) */
export const PROFILE_CTA = {
  eyebrow: "Your profile",
  title: "Start with",
  titleItalic: "your profile.",
  lede: "Six short steps, and only the basics are required. It stays on this device until you send an application, and you can change it at any time.",
  cta: "Create my profile",
  manage: "Review my profile",
} as const;

/* ===========================================================================
   Profile builder
   =========================================================================== */

/** (ours) */
export const PROFILE = {
  eyebrow: "Your TALYNT profile",
  title: "Create it once.",
  titleItalic: "Use it for every role.",
  lede: "Your profile holds what stays true whichever role you apply for. What you say about a particular role — and your assessment for it — belongs to that application, not here.",
  steps: [
    { id: "cv", label: "Your CV", intro: "Optional. Attach it so your applications can name it." },
    { id: "about", label: "About you", intro: "The basics, and a line in your own words." },
    { id: "experience", label: "Experience", intro: "The two or three roles that matter most. Assessments may ask you about relevant ones." },
    { id: "skills", label: "Skills and education", intro: "Skills help you find roles. They are never used to rank you." },
    { id: "preferences", label: "Preferences", intro: "Optional. How you want to work, and when you could start." },
    { id: "review", label: "Review and save", intro: "Check it before you save. You can change anything later." },
  ],
  cvNote:
    "We don’t read CVs automatically — there is no parsing service behind this site — so nothing is filled in from the file. Attaching it lets your applications name it; the details you write in the next steps are what roles and assessments use.",
  educationLabel: "Education",
  educationHint: "Only if it is relevant to the roles you want. Never required.",
  addEducation: "Add education",
  certificationsLabel: "Certifications",
  certificationsHint: "Optional. Comma separated.",
  save: "Save my profile",
  savedTitle: "Your profile is ready.",
  savedBody: "It is saved on this device. Every application you start will use it, and none will change it.",
  continueTo: "Continue to",
  manageTitle: "Your profile",
  edit: "Edit",
  version: "Profile version",
  updated: "Last updated",
  usedBy: "Used by",
  sharedTitle: "What a role receives when you apply",
  sharedAlways: "Always: your name, email, headline, location, availability and experience band — and your answers for that role.",
  sharedChoice: "If you choose: the rest of this profile — experience, skills, education, direction and preferences. You decide for each application.",
  sharedNever: "Never: anything from another application, or anything you haven’t sent.",
  erase: "Erase my profile",
  eraseNote: "This removes your profile from this device. Applications you have already sent are not affected.",
} as const;

/* ===========================================================================
   Applications and the assessment
   =========================================================================== */

/** (ours) */
export const APPLY_PANEL = {
  title: "Apply with",
  titleItalic: "your profile.",
  needProfile: "Applying starts from your TALYNT profile, so you only write your experience once.",
  createProfile: "Create my profile first",
  usingProfile: "Using your profile",
  includes: "Your application adds",
  why: "Why this role — a few sentences",
  assessment: (n: number) => `A written assessment — ${n} questions, built from this role’s requirements`,
  assesses: "It asks about",
  start: "Start my application",
  continue: "Continue my application",
  view: "View my application",
  unavailable: "This role’s assessment isn’t available right now. You can still apply by email:",
} as const;

/** (ours) */
export const ASSESSMENT = {
  introEyebrow: "Before you start",
  introTitle: "An assessment for",
  purpose: (role: string) =>
    `These questions are built from what the ${role} role needs — its essential requirements — so the people reading your application can see how your experience connects to it.`,
  format: [
    "Written answers. Each question shows what a useful answer covers.",
    "No time limit. Your answers save on this device as you write, so you can stop and come back.",
    "You’ll review everything before anything is sent.",
  ],
  formatCount: (n: number) => `${n} questions, plus a few sentences on why this role.`,
  howUsed:
    "Your answers go with this application to TALYNT. A person reads them against the role’s criteria. They inform the decision rather than make it, and they are not used for any other role.",
  after: "What happens after you send it",
  accommodation:
    "If you need the questions in another format, or need anything else to take part on equal terms, email talent@talyntlabs.com and say what would help.",
  begin: "Begin",
  resume: "Continue where you left off",
  question: (i: number, n: number) => `Question ${i} of ${n}`,
  covers: "A useful answer covers",
  drawOn: "From your profile, you could draw on",
  confidential: "Leave out anything confidential — names, figures or code from an employer. Describe the shape of the problem instead.",
  words: (n: number, low: number, high: number, max: number) =>
    `${n} ${n === 1 ? "word" : "words"} · around ${low}–${high} works well · up to ${max}`,
  overLimit: (max: number) => `That is over the ${max}-word limit for this question.`,
  saved: "Saved on this device",
  saving: "Saving…",
  required: "Please answer this question before reviewing.",
  back: "Back",
  next: "Next question",
  toReview: "Review my answers",
  reviewTitle: "Everything that will be sent",
  includeProfile: "Also send the rest of my profile",
  includeProfileHint: "Experience, skills, education, direction and preferences. Without it, the role receives only what the application needs.",
  send: "Send my application",
  sending: "Sending…",
  edit: "Edit",
  outOfDate: "This role’s requirements changed after you started. Refresh the assessment to answer the current questions — your answers to any question that is still asked are kept.",
  refresh: "Refresh the assessment",
  unavailableTitle: "This assessment isn’t available right now",
  unavailableBody: "Rather than show you a broken or empty assessment, we’ve paused it. You can still apply by email:",
  sentVersion: "Answered against requirements version",
  notStarted: "You haven’t started an application for this role.",
  startFromRole: "Read the role and start there",
  readOnly: "Sent. These are the answers that went with your application.",
} as const;

/** (ours) */
export const APPLICATIONS = {
  eyebrow: "Your applications",
  title: "What you’ve started,",
  titleItalic: "and what you’ve sent.",
  lede: "Each application uses your one profile and has its own assessment. Everything here is on this device.",
  draft: "In progress",
  sent: "Sent",
  notDelivered: "Not delivered — use email",
  answered: (a: number, n: number) => `${a} of ${n} answered`,
  empty: "No applications yet. Start one from any role.",
  started: "Started",
  continue: "Continue",
  view: "View",
  discard: "Discard this draft",
  discardConfirm: "Yes, discard it",
  timeline: "Where it is",
  nextStep: "Next, from this role’s process",
  sentWith: "Sent with",
  profileVersion: "profile version",
  requirementsVersion: "requirements version",
  rubricVersion: "rubric version",
  savedTitle: "Saved roles",
  profileTitle: "Your profile",
} as const;
