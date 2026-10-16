/**
 * Direction C — approved copy, re-homed.
 *
 * Every string here is taken word for word from the approved site. Each block
 * names the file it comes from, so the content map can be audited line by line
 * and a change to the approved wording has one obvious place to land.
 *
 * Only typography changes: straight apostrophes are set as ’. Anything that is
 * NOT approved copy lives in `proposed.ts` and is marked for sign-off there.
 */

/* ===========================================================================
   Client site — app/page.tsx and components/sections/*
   =========================================================================== */

/** components/sections/Hero.tsx */
export const HERO = {
  eyebrow: "Talent intelligence, built for hiring",
  titleLead: "Hiring is",
  titleMark: "more than",
  titleTail: "finding the right CV.",
  lede: "TALYNT LABS combines deep sourcing, human conversations and intelligent technology to help companies find people who fit the role, the team and the context.",
  primary: "Build your team",
  secondary: "See how we work",
  pillars: ["Deep sourcing", "Human conversations", "Structured evaluation", "Human judgment"],
} as const;

/** components/sections/Problem.tsx + components/visuals/FunnelCascade.tsx */
export const PROBLEM = {
  eyebrow: "The problem",
  title: "The hiring funnel is full of information.",
  titleQuiet: "Very little of it is intelligence.",
  lede: "Volume is not the constraint. Nobody is short of profiles, platforms or inbound applications. What is scarce is the reasoning that turns all of it into a decision you can stand behind.",
  close: "The hard part isn’t finding people.",
  closeItalic: "It’s knowing who deserves your attention.",
  funnel: [
    { label: "Profiles in the market", value: "10,000" },
    { label: "Potential matches", value: "Hundreds" },
    { label: "Conversations", value: "Dozens" },
    { label: "Meaningful candidates", value: "A handful" },
    { label: "The hire", value: "One person" },
  ],
} as const;

/** components/sections/Philosophy.tsx */
export const PHILOSOPHY = {
  eyebrow: "The TALYNT philosophy",
  title: "Less noise.",
  titleItalic: "More signal.",
  caption: "Sixty-four profiles. One worth your afternoon.",
  principles: [
    {
      title: "We source deeply.",
      body: "We don’t wait for the right person to apply. We search across the talent market to find people who may never have entered your funnel.",
    },
    {
      title: "We understand context.",
      body: "A candidate can have every skill on the job description and still be wrong for the environment. We understand the company, the team, the leadership and what success actually looks like.",
    },
    {
      title: "We improve decisions.",
      body: "Technology helps us structure information and surface meaningful signals. Human judgment brings the context.",
    },
  ],
} as const;

/** components/sections/Sourcing.tsx (stages: components/visuals/TalentUniverse.tsx) */
export const SOURCING = {
  eyebrow: "Sourcing",
  title: "The best candidate",
  titleItalic: "isn’t always looking.",
  lede: "We don’t wait for applications. We go looking.",
  note: "Illustrative. Volumes vary by role, market and mandate.",
} as const;

/** components/sections/Context.tsx */
export const CONTEXT = {
  eyebrow: "Context",
  title: "A job description",
  titleItalic: "is not a hiring context.",
  lede: "Before we search, we understand what success actually means in your environment.",
  inputLabel: "Input · Job description",
  jd: [
    "Senior Full Stack Engineer",
    "5+ years of experience",
    "React, Node, TypeScript",
    "Experience with AWS",
    "Strong communication skills",
    "Fast-paced environment",
    "Bachelor’s degree preferred",
  ],
  jdNote: "Everything above is true. None of it tells you who will do well here.",
  becomes: "Becomes",
  layers: [
    {
      label: "Business context",
      question: "What has to be true for this business in twelve months?",
      detail: "Stage, funding, pressure, constraints, and the commitments this hire inherits.",
    },
    {
      label: "Team context",
      question: "What does this team already have, and what is missing?",
      detail: "Size, seniority mix, how work is divided, and the gap this person is actually filling.",
    },
    {
      label: "Role context",
      question: "What does this person own in their first ninety days?",
      detail: "Scope, autonomy, the decisions they make alone, and the ones they don’t.",
    },
    {
      label: "Leadership context",
      question: "How does the person they report to actually lead?",
      detail: "Direction versus latitude, feedback style, and what earns trust here.",
    },
    {
      label: "Success context",
      question: "What would make you say, at six months, that this worked?",
      detail: "The outcome behind the requirement — usually absent from the job description.",
    },
    {
      label: "Candidate context",
      question: "Why would someone good leave a good role for this one?",
      detail: "The honest case for the opportunity, including what it will cost them.",
    },
  ],
  close: "Hiring starts",
  closeItalic: "before",
  closeTail: "sourcing.",
} as const;

/** components/sections/Conversation.tsx + components/cards/* */
export const CONVERSATION = {
  eyebrow: "Conversation intelligence",
  title: "A CV tells us what someone has done.",
  titleItalic: "A conversation tells us why.",
  lede: "We structure conversations to uncover the context a resume cannot. Select a phrase to see the signal it informed — or a signal to find the words behind it.",
  transcriptLabel: "Structured conversation · Illustrative",
  transcriptNote: "Sample content. Real conversations are confidential and are never shared without the candidate’s consent.",
  signalsLabel: "Signals surfaced",
  signalsNote: "Every reading traces back to something the candidate said. We don’t infer personality, and we don’t score people.",
} as const;

/** components/sections/Fit.tsx + components/visuals/CompatibilityGrid.tsx */
export const FIT = {
  eyebrow: "Fit",
  title: "Fit isn’t about being similar.",
  titleItalic: "It’s about being compatible.",
  lede: "We look at how someone works, communicates, makes decisions, handles ambiguity, responds to feedback and approaches ownership — and compare those signals with the reality of the team they’re joining.",
  inputs: ["Candidate", "Role", "Team", "Leadership", "Company"],
  result: "Compatibility",
  close: "Five dimensions align. One doesn’t.",
  closeQuiet: "We tell you which, before you meet them.",
  gridLabel: "Compatibility reading · Illustrative",
  environment: "The environment",
  candidate: "The candidate",
  gapLabel: "Gap — named",
  alignedLabel: "Aligned",
  dimensions: [
    {
      label: "Ambiguity",
      poles: ["Needs a defined brief", "Writes the brief"],
      environment: 74,
      candidate: 80,
      note: "The role is under-specified by design. They prefer it that way.",
    },
    {
      label: "Decision-making",
      poles: ["Builds consensus", "Decides, then informs"],
      environment: 62,
      candidate: 57,
      note: "Both sides expect a decision to be argued before it is made.",
    },
    {
      label: "Communication",
      poles: ["Written, asynchronous", "Verbal, in the room"],
      environment: 34,
      candidate: 41,
      note: "A distributed team that writes things down. They already work this way.",
    },
    {
      label: "Ownership",
      poles: ["Owns the task", "Owns the outcome"],
      environment: 84,
      candidate: 86,
      note: "Nobody here is handed scope. They have been asking for exactly this.",
    },
    {
      label: "Feedback",
      poles: ["Softened", "Direct and immediate"],
      environment: 82,
      candidate: 52,
      note: "The real gap. This team is blunter than their last one. Worth naming in week one — not a reason to pass.",
    },
    {
      label: "Pace",
      poles: ["Deliberate", "Ship and iterate"],
      environment: 71,
      candidate: 75,
      note: "Series B tempo. They have shipped at this speed before.",
    },
  ],
} as const;

/** components/sections/HumanAI.tsx */
export const HUMAN_AI = {
  eyebrow: "Human + AI",
  title: "AI finds signals.",
  titleItalic: "People understand them.",
  machine: "Machine intelligence",
  human: "Human intelligence",
  pairs: [
    ["Search", "Context"],
    ["Matching", "Judgment"],
    ["Enrichment", "Nuance"],
    ["Analysis", "Empathy"],
    ["Structured evaluation", "Decision-making"],
    ["Conversation intelligence", "Motivation"],
    ["Pattern detection", "Culture"],
    ["Workflow", "Relationships"],
    ["Analytics", "Trust"],
  ],
  close: "Neither works",
  closeItalic: "alone.",
} as const;

/** components/sections/Intelligence.tsx */
export const INTELLIGENCE = {
  eyebrow: "TALYNT Intelligence",
  title: "Built in-house.",
  titleItalic: "Used on every search.",
  lede: "Our internal talent intelligence platform brings sourcing, candidate intelligence, structured evaluation and recruitment workflows into one operating system.",
  asideLead: "The platform isn’t what we sell. The search is.",
  aside: "TALYNT OS is the engine underneath it — the reason our shortlists arrive with reasoning attached, and the reason the fourth search we run for you is better than the first.",
  note: "Illustrative interface. Candidate references and readings are fictional.",
  capabilities: [
    { label: "Sourcing", note: "Search across the market, not just the inbox." },
    { label: "Candidate intelligence", note: "Experience, signals and reasoning in one record." },
    { label: "Conversation intelligence", note: "Structured interviews, consistently captured." },
    { label: "Recruitment workflow", note: "One place the whole search actually lives." },
    { label: "Analytics", note: "What is working in this search, and what isn’t." },
    { label: "Client visibility", note: "Progress your team can see without asking." },
  ],
  reasoningLabel: "Why we’re recommending this person",
  watchLabel: "What to watch",
} as const;

/** components/sections/Quality.tsx */
export const QUALITY = {
  eyebrow: "Quality over quantity",
  title: "We don’t send more.",
  titleItalic: "We send better.",
  lede: "We would rather present four highly relevant people with clear reasoning than twenty loosely matched profiles. The pipeline looks similar from the outside. The work inside it is not the same.",
  costLabel: "The cost of the usual process",
  costTitle: "A long search is not a free search.",
  costBody: "Every extra week a role stays open has a price: work that doesn’t happen, a team carrying the gap, and interview hours spent discovering what one good conversation would have surfaced in the first week.",
  usual: "The usual process",
  talynt: "TALYNT",
  rows: [
    { usualCount: "184", usual: "profiles", count: "184", talynt: "sourced" },
    { usualCount: "47", usual: "screened", count: "47", talynt: "understood" },
    { usualCount: "11", usual: "shortlisted", count: "11", talynt: "evaluated" },
    { usualCount: "6", usual: "interviews", count: "4", talynt: "recommended" },
  ],
  talyntNote: "Four people. Each one with the reasoning behind why they are in front of you — including what to watch for.",
  usualNote: "Six interviews to find out what a conversation would have told you in the first week.",
  note: "Illustrative figures. Volumes vary by role, market and mandate.",
} as const;

/** components/sections/HowWeWork.tsx */
export const HOW_WE_WORK = {
  eyebrow: "How we work",
  title: "One search.",
  titleItalic: "Six layers of understanding.",
  lede: "Not a process diagram. Six things we refuse to skip, on every mandate, at every company size.",
  layers: [
    { title: "Understand", body: "We understand your business, team and role — including the parts nobody wrote down." },
    { title: "Define", body: "We translate the role into a hiring context: what this person owns, decides and inherits." },
    { title: "Discover", body: "We search deeply across the talent market, including people who were never going to apply." },
    { title: "Evaluate", body: "We combine experience, skills, motivation, context and conversation — then read them together." },
    { title: "Calibrate", body: "We learn continuously from your feedback. The second shortlist is sharper than the first." },
    { title: "Decide", body: "We give you a focused shortlist with the reasoning behind every candidate." },
  ],
  close: "Here are the people we believe deserve your time",
  closeItalic: "— and why.",
} as const;

/** components/sections/ClientVisibility.tsx + components/visuals/ClientDashboard.tsx */
export const VISIBILITY = {
  eyebrow: "Client visibility",
  title: "Your hiring process.",
  titleItalic: "Visible, not buried in email.",
  lede: "You should not have to ask a recruiter for a status update. Four questions should always have an answer:",
  answers: [
    "Where the search actually stands",
    "How many candidates sit at each stage",
    "Who has been shortlisted, and why",
    "What happens next, and when",
  ],
  note: "Illustrative interface representing the current client-visibility direction. Company and figures are fictional.",
  nextLabel: "What happens next",
  next: "Offer extended to Candidate 0148. Decision expected Friday. Candidate 0203 is held warm as cover.",
  daysLabel: "Days open",
  daysHint: "Measured from the day we agreed the hiring context — not the day the role was posted.",
  role: "Full Stack Developer",
  status: "Offer stage",
} as const;

/** components/sections/Convergence.tsx */
export const SEQUENCE = {
  eyebrow: "The TALYNT sequence",
  fragments: ["Role", "Skills", "Experience", "Motivation", "Context", "Team", "Values", "Conversation"],
  statements: ["The right context.", "The right person.", "The better decision."],
} as const;

/** components/sections/Scale.tsx */
export const SCALE = {
  eyebrow: "For companies",
  title: "Different scale.",
  titleItalic: "Same standard.",
  lede: "What changes with company size is the complexity of the context. What the search itself has to prove does not.",
  stages: [
    {
      name: "Early-stage",
      thesis: "Critical first hires. Build the foundation.",
      body: "The first ten people set the ceiling for the next hundred. At this stage a wrong hire isn’t a cost — it’s a direction. We spend more time on context here than anywhere else, because there is less of it written down.",
    },
    {
      name: "Growth",
      thesis: "Scale teams without lowering the hiring bar.",
      body: "Volume arrives and the bar quietly moves. We hold it where you set it — and when the market genuinely can’t meet it, we tell you that instead of sending you people who don’t.",
    },
    {
      name: "Enterprise",
      thesis: "Consistency, visibility and intelligence across complex hiring environments.",
      body: "More stakeholders, more process, more noise. The work is making one standard survive all of it, across functions, geographies and hiring managers who have never met each other.",
    },
  ],
  constantsLabel: "What doesn’t change, at any size",
  constants: [
    "A human reads every profile",
    "Four people, not forty",
    "Reasoning attached to every candidate",
    "We tell you what we’re unsure about",
  ],
} as const;

/** components/sections/Global.tsx + components/visuals/GlobalNetwork.tsx */
export const GLOBAL = {
  eyebrow: "Global",
  title: "Talent has no borders.",
  titleItalic: "Neither do we.",
  lede: "We help companies access exceptional talent across markets while keeping the hiring process deeply human.",
  markets: ["India", "United States", "United Kingdom", "Europe", "Middle East", "APAC"],
  note: "Markets we are built to search across. Coverage on a given mandate is agreed before the search begins.",
} as const;

/** components/sections/ForTalent.tsx */
export const FOR_TALENT = {
  eyebrow: "For talent",
  title: "We recruit people.",
  titleItalic: "Not profiles.",
  lede: "Every candidate we speak to is more than a CV in a database.",
  dimensions: [
    "Where you’ve been",
    "What you’re good at",
    "What you’re looking for",
    "Why you’re moving",
    "What motivates you",
    "Where you want to go",
  ],
  expectLabel: "What you can expect",
  commitments: [
    { title: "We tell you the compensation band", body: "Before the first interview, not at offer stage." },
    { title: "We tell you why, if it’s a no", body: "A real reason from the client, not a template." },
    { title: "We ask before we submit you anywhere", body: "Your profile is not sent into the market on your behalf." },
  ],
  close: "If the opportunity isn’t right, we’d rather tell you than",
  closeItalic: "force a match.",
  cta: "Talk to TALYNT",
} as const;

/** components/sections/Capabilities.tsx */
export const CAPABILITIES = {
  eyebrow: "Capabilities",
  title: "Talent, wherever",
  titleItalic: "the business needs it.",
  areas: [
    {
      id: "technology",
      title: "Technology",
      note: "Roles where the hiring context is usually technical and the failure mode usually isn’t.",
      items: ["Engineering", "AI", "Data", "Product"],
    },
    {
      id: "gtm",
      title: "Go-to-market",
      note: "People whose results depend heavily on the stage and the motion they’re selling into.",
      items: ["Sales", "Marketing", "Customer Success"],
    },
    {
      id: "leadership",
      title: "Leadership",
      note: "Searches where the shortlist is short by definition and the reasoning matters most.",
      items: ["Executives", "Functional Leaders", "Critical Hires"],
    },
    {
      id: "operations",
      title: "Operations",
      note: "The functions that decide whether everything else in the company actually runs.",
      items: ["Finance", "People", "Operations", "Business Functions"],
    },
  ],
} as const;

/** components/sections/Manifesto.tsx */
export const MANIFESTO = {
  title: "Hiring is",
  titleItalic: "human.",
  middle: [
    "Technology can search faster.",
    "AI can surface patterns.",
    "Data can organise information.",
  ],
  turn: "But people still make decisions about people.",
  belief: "We don’t believe the future of recruitment is human versus AI. It’s human",
  beliefItalic: "with",
  beliefTail: "intelligence.",
  triad: ["Better signals.", "Better conversations.", "Better decisions."],
  signoff: "That’s Talynt Labs.",
} as const;

/** components/sections/FinalCTA.tsx + app/api/contact/route.ts */
export const ENQUIRY = {
  eyebrow: "Start a search",
  title: "Let’s find the people who",
  titleItalic: "move your business forward.",
  lede: "Tell us what you’re building, what you’re hiring for and where you need help.",
  direct: "Or write to us directly",
  fields: {
    name: "Name",
    email: "Work email",
    company: "Company",
    hiringFor: "What are you hiring for?",
    message: "Message",
  },
  submit: "Build your team",
  sending: "Sending",
  promise: "We reply to every enquiry, including the ones we can’t help with.",
  receivedLabel: "Received",
  received: "Thank you. A person — not an autoresponder — will read this and come back to you.",
  fallbackLead: "Please email",
  fallbackTail: "and we’ll pick it up from there.",
} as const;

/** app/about/page.tsx */
export const ABOUT = {
  title: "A talent company that thinks",
  titleItalic: "like a product company.",
  lede: "TALYNT LABS sits between executive search, modern recruitment and talent intelligence. We were built around one idea: that better hiring decisions come from better signals, not more profiles.",
  beliefsLabel: "What we believe",
  beliefs: [
    {
      title: "Hiring is a context problem, not a matching problem.",
      body: "A candidate can meet every requirement on a job description and still be wrong for the environment. Most hiring failures are context failures, and context is not something a filter can read.",
    },
    {
      title: "Quality is a refusal, not an aspiration.",
      body: "Sending fewer candidates is harder than sending more. It means doing the work of deciding, and being accountable for the decision. That is the work we are paid for.",
    },
    {
      title: "Technology should make judgment better, not optional.",
      body: "We build our own tooling because the alternative is shaping our process around software that was designed for volume. AI finds signals. People understand them.",
    },
    {
      title: "Candidates are not inventory.",
      body: "The person on the other side of the search is making one of the larger decisions of their year. They get a real conversation, a real reason and a real answer.",
    },
  ],
  partnership: "TALYNT is the partnership.",
  partnershipItalic: "LABS is how we keep improving it.",
  partnershipBody: "The service is the product. The technology is the engine that makes the service different — and it is ours, so it changes as fast as what we learn.",
  eyebrow: "About",
  description: "TALYNT LABS is a talent intelligence company. We combine deep sourcing, human conversations and technology built in-house to help companies make better hiring decisions.",
  primary: "Build your team",
  secondary: "See how we work",
} as const;

/* ===========================================================================
   Candidate site — app/candidates/* and components/candidate/*
   =========================================================================== */

/** components/candidate/CandidateHero.tsx */
export const CANDIDATE_HERO = {
  eyebrow: "For candidates",
  title: "Don’t just find a job.",
  titleItalic: "Find the right next chapter.",
  lede: "A role is not a title and a salary. It is who you answer to, what you get to decide, and what you will have learned in two years. We write roles that say all three, and we ask you what you are actually looking for.",
  primary: "Explore roles",
  secondary: "Create your Career Passport",
  questionsLabel: "Three questions hiring skips",
  questions: [
    { q: "Why are you moving?", a: "Not “why this company” — what stopped working where you are." },
    { q: "What do you want to be doing in two years?", a: "Depth, scope, leadership, or something else entirely." },
    { q: "What would make you leave again?", a: "The conditions you will not repeat. Worth naming before you sign." },
  ],
  pillars: [
    "The band, up front",
    "The reasoning, not a pitch",
    "Your consent, every time",
    "A real answer, either way",
  ],
} as const;

/** app/candidates/page.tsx + components/candidate/CareerArc.tsx */
export const CAREER_ARC = {
  eyebrow: "How we read a career",
  title: "A CV is one third",
  titleItalic: "of the story.",
  lede: "Where you have been is the easiest part to verify and the least useful on its own. It says nothing about what you want next — and that is the part that decides whether a role works.",
  label: "A career, read in three parts",
  here: "You are here → Present",
  stages: [
    {
      key: "past",
      label: "Past",
      title: "What you’ve done",
      body: "Roles, systems, teams, decisions. The part a CV can carry — and the only part most hiring processes ever read.",
      facets: ["Roles held", "Problems solved", "Teams worked in"],
    },
    {
      key: "present",
      label: "Present",
      title: "Where you are now",
      body: "What you’re good at, what you’ve outgrown, and what made you start looking. This is the part that actually decides whether a role fits.",
      facets: ["Strengths", "Constraints", "Why now"],
    },
    {
      key: "future",
      label: "Future",
      title: "Where this is going",
      body: "Depth, scope, leadership, or a different context entirely. A role either moves you toward it or quietly away from it.",
      facets: ["Direction", "What matters", "What you’d trade"],
    },
  ],
  close: "Most hiring processes read the first panel and infer the other two. We ask.",
} as const;

/** app/candidates/page.tsx + components/candidate/DirectionPicker.tsx */
export const DIRECTION = {
  eyebrow: "Career direction",
  title: "Three questions.",
  titleItalic: "Then better roles.",
  lede: "Answer these and every role on this site starts telling you where it lines up with what you want — and where it doesn’t.",
  q1: "01 · What do you do?",
  q2: "02 · Where are you now?",
  q2hint: "Bands describe what you are trusted to decide, not how long you have been doing it.",
  q3: "03 · Where is this going?",
  q3hint: "Pick as many as are true. “I’m still working it out” is a real answer and we treat it as one.",
  whereLabel: "Where this goes",
  saved: "Saved to your Career Passport on this device. Nothing has been sent anywhere, and no company has been told you are looking.",
  unsaved: "Nothing is sent anywhere. Your answers are stored on this device until you choose to share them with a specific role.",
  seeRoles: "See roles that match →",
  finish: "Finish the Passport →",
} as const;

/** app/candidates/page.tsx */
export const CANDIDATE_PAGE = {
  rolesEyebrow: "Open roles",
  rolesTitle: "Roles written the way",
  rolesTitleItalic: "we’d want one written for us.",
  rolesLede: "Why the role exists. What success looks like at ninety days and at a year. What is genuinely hard about it. And the band.",
  unlikeEyebrow: "What this is",
  unlikeTitle: "Less noise.",
  unlikeTitleItalic: "More signal.",
  unlike: [
    { label: "A job board", body: "Lists titles. Leaves you to guess the rest.", active: false },
    { label: "A recruiter’s inbox", body: "Sends you five roles because they share a keyword with your CV.", active: false },
    { label: "This", body: "Reads the role, reads you, and tells you where the two don’t line up.", active: true },
  ],
  commitmentsEyebrow: "What you can expect",
  commitmentsTitle: "Four things we do",
  commitmentsTitleItalic: "that most processes don’t.",
  commitments: [
    {
      title: "The compensation band is on the role",
      body: "Every role on this site shows its band before you read a word of the requirements. Not at offer stage, not after two interviews.",
    },
    {
      title: "We ask before we send you anywhere",
      body: "Your Career Passport stays yours. No profile of you reaches a company without you choosing that role and confirming it.",
    },
    {
      title: "If it’s a no, you get the reason",
      body: "A real one, from the client, in their words. Not a template about other candidates being a closer match.",
    },
    {
      title: "We tell you what’s hard about the role",
      body: "Every role here has a section on what to consider. It is written before you apply, not disclosed after you accept.",
    },
  ],
  evaluateLink: "How we evaluate, in full →",
  closeTitle: "Start with what you want,",
  closeTitleItalic: "not what you’ve done.",
  closeLede: "The Career Passport takes about eight minutes. It stays on your device until you choose to share it with a specific role.",
  closePrimary: "Create your Career Passport",
  closeSecondary: "Or just read the roles",
} as const;

/** app/candidates/how-we-evaluate/page.tsx */
export const EVALUATE = {
  title: "No score.",
  titleItalic: "Reasons you can argue with.",
  lede: "We could give you a number out of a hundred. It would be more persuasive and less true — a single figure hides which part of it moved, and invites everyone to treat it as a verdict. So we write down named signals, each with the evidence behind it, and we show you the same ones we show the client.",
  signalsEyebrow: "TALYNT Signals",
  signalsTitle: "Five signals.",
  signalsTitleItalic: "Each one explainable.",
  signalsLede: "A signal is a reading with its reasoning attached. If we cannot say where one came from, it does not get written down.",
  signals: [
    { name: "Technical alignment", what: "Whether the work you’ve done maps onto the work this role needs.", from: "Your own account of what you built and decided — not a keyword match against a CV." },
    { name: "Role motivation", what: "Whether you want this role specifically, or a role.", from: "The conversation. It is the single strongest predictor of whether a hire stays, and the hardest to fake in either direction." },
    { name: "Team alignment", what: "Whether how you work fits how this team already works.", from: "Both sides described separately, then compared. Not a personality test." },
    { name: "Communication", what: "Whether you can make yourself understood to people who don’t share your context.", from: "How you explain your own work, in your own words." },
    { name: "Compensation alignment", what: "Whether the band and your expectation can meet.", from: "Asked directly, early, because finding out at offer stage wastes everybody’s month." },
  ],
  readings: [
    { strength: "emerging", body: "We’ve seen something, and not enough of it to lean on." },
    { strength: "solid", body: "Evidence, and a reason it might not hold everywhere." },
    { strength: "strong", body: "Consistent across the conversation and the work." },
    { strength: "confirmed", body: "Checked directly, usually because it’s a hard constraint." },
  ],
  notLookedEyebrow: "What we don’t look at",
  notLookedAt: [
    "Where you went to university, or whether you did",
    "How long you were at each company, taken on its own",
    "Gaps in your CV",
    "Whether you came from a recognisable logo",
    "How well you perform an interview format you’ll never use again",
  ],
  clientsSee: [
    "The five signals, with the evidence for each.",
    "Why we think this role fits you specifically, in a paragraph.",
    "What to watch for — where we have a real reservation.",
    "Your compensation expectation, because withholding it wastes their time and yours.",
  ],
  clientsDontSee: [
    "Your Career Passport, unless you applied to their role.",
    "What else you applied to, or saved.",
    "Anything you told us in confidence and asked us not to pass on.",
    "A score. There isn’t one to send.",
  ],
  reservation: "If we have a reservation about you, you hear it from us",
  reservationItalic: "before",
  reservationTail: "the client does.",
  modelLine: "Nothing about you is decided by a model. The technology finds candidates and organises evidence. A person reads it, and a person is accountable for what we tell the client.",
  description: "What TALYNT looks at, what we write down, what a client sees, and why there is no candidate score.",
  fromLabel: "Where it comes from",
  readingsLabel: "The four readings",
  readingsNote: "Four steps, deliberately coarse. A resolution we could not defend would be theatre — and a candidate whose every signal reads “strong” is a candidate nobody looked at properly.",
  twoSidedEyebrow: "Both directions",
  twoSidedTitle: "Fit isn’t about being similar.",
  twoSidedTurn: "It’s about being",
  twoSidedTurnItalic: "compatible.",
  twoSidedLede: "We write down what the company needs and what you’re looking for as two separate things, then compare them. Where they disagree, both sides are told.",
  clientsEyebrow: "What the client sees",
  clientsTitle: "The same signals,",
  clientsTitleItalic: "and one thing more.",
  clientsLede: "A client sees your signals, the reasoning behind each one, and a section called “what to watch for” — the honest caveat on you, written before they meet you.",
  clientsSeeLabel: "They see",
  clientsDontSeeLabel: "They don’t see",
  ignoredTitle: "Signals, not",
  ignoredTitleItalic: "proxies for signals.",
  ignoredLede: "Each of these is a shortcut that correlates with something real and predicts almost nothing on its own. They are the reason good people get filtered out before anybody reads their work.",
  ignoredNote: "We will ask about a gap or a short tenure if it is relevant to this role. We will not treat either as a finding on its own, and a client asking us to screen on one gets the same answer.",
  ignoredLink: "Read the open roles",
  closeTitle: "AI finds signals.",
  closeTitleItalic: "People understand them.",
  closePrimary: "Create your Career Passport",
  closeSecondary: "Explore roles",
} as const;

/** app/candidates/roles/page.tsx */
export const ROLES_PAGE = {
  eyebrow: "Explore roles",
  titleLead: "Every role here has a",
  titleItalic: "reason",
  titleTail: "it exists.",
  lede: "Company names come in conversation, not on a listing — that is the client’s call and we respect it. Everything else is on the page: the band, the team, the process, and what to consider before you apply.",
  searchPlaceholder: "Search by title, skill or discipline",
  emptyFiltered: "No open role matches that.",
  emptyNone: "There are no open roles right now.",
  emptyNoneBody: "Roles are added as clients bring them. There is nothing to pad the list with.",
  emptyFilteredLead: "We would rather show you nothing than show you something that doesn’t fit.",
  matchPassport: "Match my Passport",
  whyAppears: "Why this appears",
  perYear: "per year · stated up front",
} as const;

/** app/candidates/roles/[slug]/page.tsx */
export const ROLE_PAGE = {
  back: "← All roles",
  apply: "Apply for this role",
  facts: {
    compensation: "Compensation",
    level: "Level",
    where: "Where",
    workModel: "Work model",
    team: "Team",
    reportsTo: "Reports to",
    stage: "Company stage",
    posted: "Posted",
  },
  sections: {
    role: "The role",
    why: "Why this role exists",
    success: "What success looks like",
    lookingFor: "What we’re looking for",
    howYouWork: "How you’ll work",
    matters: "What matters here",
    leads: "Where this role could take you",
    consider: "What to consider",
  },
  needed: "Needed",
  helpful: "Helpful, not required",
  notRequired: "Explicitly not required",
  notRequiredNote: "The third list is there because people rule themselves out of roles they would get. If you match the first list, apply.",
  leadsNote: "These are directions this role has led to, here or elsewhere. None of it is a promise — nobody can promise you a promotion, and anyone who does is selling you something.",
  considerNote: "Every role on this site has this section. If it were empty we would not have read the role properly.",
  processTitle: "The process, in full,",
  processTitleItalic: "before you start it.",
  applyNote: "One question at a time. Nothing is sent until you have read the last step and confirmed it.",
  alignmentTitle: "Is this role right for me?",
  alignmentLede: "Built from what you told us, nothing else. There is no score here on purpose: a number would hide which of these moved it.",
  alignmentEmpty: "There isn’t enough in your Career Passport yet to compare this role to what you want. We’re not going to guess — an invented reading is worse than none.",
  alignmentPrivate: "Nothing on this panel is shared with the company. It is a reading for you, computed on your own device.",
  questionsLabel: "Questions to consider",
  appearsEmpty: "You’re seeing this because you opened it — there is nothing in your Career Passport yet for us to match against.",
  others: "Other",
  othersTail: "roles",
} as const;

/** components/candidate/ApplicationFlow.tsx */
export const APPLY = {
  sentLabel: "Sent",
  sentTitle: "Your application is with us.",
  sentBody: "A person reads it — not a filter. You’ll hear from us within five working days either way, with a reason. If that doesn’t happen, chase us at",
  notDeliveredLabel: "Not delivered",
  notDeliveredBody: "We’re not going to tell you it arrived when it didn’t. Send the same thing to",
  notDeliveredTail: "in the subject line and it reaches the same person.",
  copyWhat: "Copy what you wrote",
  whyTitle: "Why this role?",
  whyBody: "Not why you’re a good candidate — we can read that. What about this specific role made you stop and read it.",
  whyHint: "Three or four sentences is plenty. Nobody here is counting words.",
  whyBlocking: "A few sentences. This is the part the hiring manager reads first.",
  questionsTitle: "What do you want to know?",
  questionsBody: "Your questions go to the hiring manager with the application, before the first conversation, so the answers arrive in it rather than after.",
  questionsHint: "Optional, and genuinely used.",
  worthAsking: "Worth asking about",
  fromRole: "From the role",
  reviewTitle: "This is everything that gets sent.",
  consentLabel: "Send this to TALYNT LABS for this role",
  consentBody: "We pass it to this one client. It is not added to a database that other clients search, and it is not used for any other role without asking you again.",
  rather: "Rather talk first?",
  ratherLink: "Ask us a question",
  ratherTail: "instead — applying is not the only way in.",
} as const;

/** components/candidate/PassportEditor.tsx + app/candidates/passport/page.tsx */
export const PASSPORT = {
  title: "Not a profile.",
  titleItalic: "A record of what you want.",
  headlineHint: "Write it the way you’d say it out loud, not the way a CV would.",
  levelHint: "Bands describe what you’re trusted to decide, not years served.",
  skillsHint: "Comma separated. Used to search roles, never to rank you.",
  experienceLede: "Either attach a CV or write the two or three roles that matter. You do not need both.",
  experienceSummaryHint: "One honest paragraph beats six bullet points.",
  directionLede: "The part almost nobody asks, and the part that decides whether a role is worth your time.",
  directionNoteLabel: "Anything you’d want a hiring manager to understand",
  directionNoteHint: "Optional. Read by a person, not a filter.",
  preferencesLede: "Stated once, honoured everywhere. A role that breaks one of these should not reach you.",
  stageHint: "Some people are built for Seed and some are not. Neither is a flaw.",
  compensationHint: "We publish every role’s band, so this is only here so we can tell you early when a role can’t reach you.",
  valuesLede: "Choose in order of importance — the order is the answer. Pick at least three.",
  valuesNoteLabel: "The conditions you won’t repeat",
  valuesNoteHint: "This is the most useful thing you can tell us and the least often asked.",
  alertsLabel: "Not yet active",
  alertsBody: "We are being straight with you: there is no alert delivery running behind this site yet. Your preferences above are everything an alert would need, and they are stored on your device ready for it — but nothing will email you today, and we are not going to pretend otherwise by taking a subscription we cannot honour.",
  dataBody: "Your Career Passport lives in this browser and nowhere else. It is not on our servers, it is not on your other devices, and clearing your browser data clears it. That is a real limitation, not a privacy feature we are dressing up — but it does mean nothing about you exists anywhere until you choose to send it.",
  erase: "Erase my Passport",
  eraseConfirm: "Yes, erase everything",
  savedTitle: "Read it twice",
  savedTitleItalic: "before you decide.",
  savedLede: "Saved roles and sent applications live in this browser. Nothing here has been shared with a company, and saving a role tells nobody anything.",
  savedEmpty: "Saving is a bookmark on this device and nothing more — no company is notified, and it does not start a process. It is there so you can read a role properly later rather than deciding in a hurry.",
  sentNote: "This is a record of what this browser sent, not a live status. We don’t show an interview or offer stage here because nothing reports one back to this page — the honest place for that is the conversation you’ll be having with a person.",
} as const;

/**
 * app/privacy/page.tsx and app/terms/page.tsx — the page headers. The legal text
 * itself is not copied: both sites render it from lib/legal.ts.
 */
export const LEGAL = {
  privacy: {
    eyebrow: "Privacy",
    title: "What we hold, and why.",
    lede: "We ask candidates to trust us with their career, and clients to trust us with their hiring. This page explains what happens to the information that changes hands.",
    description: "How TALYNT LABS handles personal information belonging to candidates, clients and visitors to this website.",
  },
  terms: {
    eyebrow: "Terms",
    title: "The terms of this site.",
    lede: "Short, and worth reading if you are looking at the interfaces on the homepage and wondering what is real.",
    description: "The terms on which TALYNT LABS makes this website available, including how to read the illustrative interface content shown on it.",
  },
  updatedLabel: "Last updated",
} as const;

/** app/layout.tsx — the tagline itself */
export const TAGLINE = "Talent intelligence, built for hiring.";

/** components/candidate/TwoSidedFit.tsx */
export const TWO_SIDED = {
  company: "What the company needs",
  meets: "meets",
  person: "What you’re looking for",
  rows: [
    {
      dimension: "The work",
      client: "A surface that needs owning through a rewrite",
      candidate: "Depth on something that matters, not more tickets",
    },
    {
      dimension: "Latitude",
      client: "Someone with an opinion about what gets built",
      candidate: "A say in the roadmap, not just the implementation",
    },
    {
      dimension: "How you communicate",
      client: "Distributed, written, asynchronous",
      candidate: "Time to think before answering",
    },
    {
      dimension: "Pace",
      client: "Series B tempo — ship, learn, revise",
      candidate: "Momentum, without the 11pm messages",
    },
    {
      dimension: "Where it leads",
      client: "A staff engineer in eighteen months",
      candidate: "Seniority without managing people",
    },
  ],
  note: "Illustrative, from a real shortlist with the identifying detail removed. Where two rows disagree we say so to both sides — that is the whole method, and it is why a no from us comes with a reason.",
} as const;
