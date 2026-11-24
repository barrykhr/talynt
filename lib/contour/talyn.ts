/**
 * PROPOSED — the Talyn editions' content (NEXT_PUBLIC_CT_EDITION, see
 * lib/contour/variant.ts). Every string here is new and was drafted section by
 * section with TALYNT; it needs the same approval as the rest of proposed copy.
 *
 * TALYNT LABS is the company — an AI-native hiring agency. Talyn is its AI
 * hiring agent. Talyn Insights is Talyn's intelligence module, with two halves:
 * Role Insights (the JD) and Candidate Insights (each profile against the JD).
 *
 * Capabilities marked `soon` are planned, and the site says "Coming soon".
 * The approved tagline (content.ts TAGLINE) and "AI finds signals. People
 * understand them." (HUMAN_AI) are used as written elsewhere.
 */

export const TALYN = {
  /* --- Hero ---------------------------------------------------------------- */
  hero: {
    title: "AI finds who to talk to.",
    titleItalic: "People do the talking.",
    lede: "TALYNT LABS is an AI-native hiring agency. Talyn, our hiring agent, reads your JD, searches by meaning, reads intent and context, and keeps every candidate engaged around the clock — so our recruiters and your hiring managers spend their time on the conversations that matter.",
    primary: "Book a demo",
    secondary: "Talk to us",
    pillars: ["Hire for intent and context", "Anchored to your JD", "Evidence with every candidate", "Pay only when you hire"],
  },

  /* --- The film (film edition): the seven scene cards ------------------------ */
  film: [
    { tag: "Talent intelligence, built for hiring.", title: "AI finds who to talk to.", titleItalic: "People do the talking.", body: "TALYNT LABS is an AI-native hiring agency. Tell us the role — Talyn, our hiring agent, takes it from there, around the clock." },
    { tag: "Search by meaning", title: "Ask for the person.", titleItalic: "Get the person.", body: "Talyn searches professional networks, job boards, developer communities, portfolios, referrals and our own talent pool — by meaning and context, not keywords." },
    { tag: "Score with evidence", title: "Scored against your JD.", titleItalic: "Out of 100, with reasons.", body: "Talyn Insights grades every profile A+ to C against the role, with the evidence behind each point and every gap still open." },
    { tag: "Hyperpersonalised outreach", title: "One campaign per role.", titleItalic: "One message per person.", body: "Email first, about each candidate’s own profile — then WhatsApp once they opt in. Voice calls coming soon." },
    { tag: "Keep everyone close", title: "Relationships,", titleItalic: "not transactions.", body: "Every candidate hears from us at every step. Talyn closes open gaps by chat and checks every answer for authenticity along the way." },
    { tag: "Follow-ups and health", title: "Nothing goes quiet", titleItalic: "between steps.", body: "Eight intent signals, live candidate and pipeline health, and automated follow-ups at every stage — so drift is caught before anyone drops out." },
    { tag: "You decide", title: "Hire for what you want.", titleItalic: "Not what you’re given.", body: "A shortlist with scores, evidence and intent — and an interview kit mapped to your JD. A person always makes the call.", primary: "Book a demo", secondary: "Talk to us" },
  ],

  /* --- The problem --------------------------------------------------------- */
  problem: {
    eyebrow: "The problem",
    title: "Everyone added AI to hiring.",
    titleItalic: "The shortlists didn’t get better.",
    lede: "More profiles, more filters, more automated messages. Hiring managers still settle for whoever applied, candidates still drop out in silence, and nobody can say why someone is right.",
    points: [
      { label: "Keyword matching", body: "finds people who wrote the right words, not people who did the work." },
      { label: "Make-do shortlists", body: "hiring managers settle for what they’re given, not what they asked for." },
      { label: "Silent drop-outs", body: "candidates go quiet between steps, and nobody notices until it’s too late." },
      { label: "No reasons", body: "a CV and a gut feel, with nothing that says why this person, for this role." },
    ],
  },

  /* --- How Talyn works ------------------------------------------------------- */
  how: {
    eyebrow: "How Talyn works",
    title: "One role in.",
    titleItalic: "A shortlist with reasons out.",
    steps: [
      { id: "brief", title: "Read the role", body: "Talyn reads your JD and turns it into a search plan: must-haves, adjacent titles, Boolean strings and an interview kit." },
      { id: "search", title: "Search by meaning", body: "Ask for the person you want, in plain words. Talyn searches every source by meaning and context, around the clock." },
      { id: "score", title: "Score with evidence", body: "Every profile is scored out of 100 against the JD, with the evidence behind the score and the gaps still open." },
      { id: "reach", title: "Reach out, personally", body: "One campaign per role. Email first, about each candidate’s own profile — then WhatsApp once they opt in." },
      { id: "close", title: "Close the gaps", body: "Talyn asks about every open gap by chat and checks each answer for authenticity against the profile." },
      { id: "engage", title: "Keep everyone close", body: "Follow-ups, reminders and next steps at every stage. Health scores flag anyone drifting before they drop out." },
      { id: "decide", title: "You decide", body: "A shortlist with scores, evidence and intent. Your hiring managers interview with questions mapped to the JD." },
    ],
  },

  /* --- Talyn Insights ---------------------------------------------------------- */
  insights: {
    eyebrow: "Talyn Insights",
    title: "Every role understood.",
    titleItalic: "Every profile read against it.",
    lede: "Talyn Insights has two halves that meet at one point: fit against the role, with evidence. Role Insights reads the JD. Candidate Insights reads each profile against it.",
    role: {
      name: "Role Insights",
      title: "The JD, turned into a search plan.",
      items: [
        { label: "The role, parsed", body: "Must-haves and nice-to-haves, responsibilities, seniority, core and adjacent skills, stack, domain, location and work model." },
        { label: "Boolean strings", body: "Ready-to-run search strings for recruiters, for every kind of source." },
        { label: "Adjacent titles", body: "Every other name this role goes by, so nobody is missed for a title." },
        { label: "Growth path", body: "The market-standard path into this role and where it leads next." },
        { label: "Feeder companies", body: "Where people who do this work tend to come from — suggestions for the search." },
        { label: "JD quality check", body: "Flags vague, conflicting or exclusionary requirements before the search starts." },
        { label: "Calibration questions", body: "What to agree with the hiring manager up front, so the search hits the target." },
        { label: "Ideal candidate profile", body: "The person the JD describes, in one page." },
        { label: "Interview kit", body: "Questions mapped to every requirement, so interviews test what the JD expects." },
        { label: "Talent pool", body: "How many profiles our sources match for this role." },
        { label: "Salary benchmarks", body: "Market ranges for the role.", soon: true },
      ],
    },
    candidate: {
      name: "Candidate Insights",
      title: "Every profile, scored against the JD.",
      items: [
        { label: "Career history and tenure", body: "Roles, moves and tenure patterns, read in context." },
        { label: "Skills and recent activity", body: "What they’ve worked with, and what they’ve been doing lately." },
        { label: "Role fitment", body: "How closely the profile matches each requirement in the JD." },
        { label: "Evidence-based score", body: "A score out of 100, with the evidence behind every point." },
        { label: "Talent grade", body: "A+, A, B or C — from the score, never instead of it." },
        { label: "Gaps against the JD", body: "Every requirement the profile doesn’t yet prove, listed one by one." },
        { label: "Next questions", body: "Talyn drafts the questions that would close each gap — and asks them." },
      ],
      grades: [
        { grade: "A+", range: "95–100" },
        { grade: "A", range: "80–94" },
        { grade: "B", range: "65–79" },
        { grade: "C", range: "Under 65" },
      ],
    },
  },

  /* --- Capabilities --------------------------------------------------------------- */
  capabilities: {
    eyebrow: "What Talyn does",
    title: "An agent for the work.",
    titleItalic: "People for the decisions.",
    modules: [
      {
        id: "search",
        title: "Semantic search and automated sourcing",
        line: "Ask for the person. Get the person.",
        body: "Describe who you need in plain language — “a backend engineer who has scaled payments in a fintech” — and Talyn searches by meaning, not keywords, across every source.",
        points: ["Search in plain words, or start from the JD", "Matches on meaning, experience and context — not titles", "Sourcing keeps running as new people appear"],
      },
      {
        id: "outreach",
        title: "Campaigns and hyperpersonalised outreach",
        line: "One campaign per role. One message per person.",
        body: "Every role gets a campaign. Add candidates, and Talyn writes to each one about their own profile — their work, their moves, why this role fits them.",
        points: [
          "A campaign for every role, with its own candidate list",
          "First message by email, written from each person’s profile",
          "Continues on WhatsApp once the candidate opts in",
          "Follow-up sequences that adapt to what each person says",
          "Pauses the moment someone replies or opts out",
          "Recruiters can review any message before it goes",
        ],
        soon: ["Voice calls to candidates who go quiet"],
      },
      {
        id: "gaps",
        title: "Automated gap-closing",
        line: "Talyn finds the gap. Then asks about it.",
        body: "When a profile leaves a requirement unproven, Talyn asks the candidate about it by chat and follows up until the evidence is in.",
        points: ["Gap-specific questions drafted from the JD", "Asked by chat, followed up automatically", "Answers added to the candidate’s evidence"],
        soon: ["By voice call"],
      },
      {
        id: "authenticity",
        title: "Authenticity checks",
        line: "Answers you can trust.",
        body: "Every answer is checked against the candidate’s own profile and work. Anything that doesn’t add up is flagged for a person — never silently rejected.",
        points: [
          "Timeline consistency — dates, titles and employers line up",
          "Specificity — real answers name systems, numbers and decisions",
          "Cross-channel consistency — the same story in chat and on a call",
          "Public evidence — claims backed by code, portfolios and talks",
          "Generated-answer detection — copy-pasted or AI-written replies",
          "Skill claim versus evidence — a stated skill shows up in their work",
        ],
      },
      {
        id: "engagement",
        title: "Continuous engagement",
        line: "Fewer drop-outs. Nobody left wondering.",
        body: "Talyn keeps every candidate warm from first message to offer — follow-ups, reminders, next steps and feedback — so silence never becomes a drop-out.",
        points: ["Reminders before every interview", "Next steps after every stage", "Feedback requests to hiring managers", "Drifting candidates flagged and re-engaged"],
        soon: ["A call when someone goes quiet after a recruiter’s call"],
      },
      {
        id: "intent",
        title: "Intent and health",
        line: "Hire people who want to move — and know why.",
        body: "Talyn reads intent from conversations and portal activity, and keeps a live health score on every candidate and every pipeline.",
        signals: [
          "Usual tenure in the industry",
          "Usual tenure in the role",
          "Activity on job portals",
          "Promotion stagnation",
          "Company events",
          "Profile refresh",
          "Conversation cues",
          "Role mismatch",
        ],
        health: {
          candidate: ["Responsiveness", "Recency of contact", "Interest and sentiment", "Time in stage", "Strength of intent", "Open risks: notice, counter-offers"],
          pipeline: ["Coverage per stage", "Conversion between stages", "Velocity", "Drop-off rate", "Share of healthy candidates"],
          bands: [
            { band: "Healthy", range: "75+" },
            { band: "Watch", range: "50–74" },
            { band: "At risk", range: "Under 50" },
          ],
        },
      },
      {
        id: "managers",
        title: "For hiring managers",
        line: "Hire for what you want. Not what you’re given.",
        body: "You don’t have to make do with whoever applied. Talyn searches for the person you described, closes the gaps against your JD, and shows why each candidate fits. In the interview, your questions match your expectations — the interview kit maps every question to a requirement in the JD and to each candidate’s open gaps.",
        points: ["Log in to see fit, evidence, gaps, intent and health", "Add your input — Talyn sharpens the search", "An interview kit for every candidate, mapped to the JD", "Every hire made with the reasons written down"],
      },
      {
        id: "humans",
        title: "Human in the loop",
        line: "An agent that does the work. People who make the calls.",
        body: "Recruiters make the first calls and own the relationship. Talyn handles the volume, the follow-ups and the evidence. A score never rejects anyone — a person always decides.",
        points: ["Recruiters own every relationship", "Every message can be reviewed", "No automatic rejections, ever"],
      },
    ],
  },

  /* --- The difference ------------------------------------------------------------------ */
  difference: {
    eyebrow: "The TALYNT difference",
    title: "Not a tool you operate.",
    titleItalic: "A hiring team that delivers.",
    points: [
      { title: "Done for you", body: "Talyn does the work, our team owns the outcome. You don’t learn another tool." },
      { title: "Intent and context", body: "People who fit the role, the team and the moment — and who want to move." },
      { title: "Anchored to your JD", body: "Every search, score, question and interview kit traces back to the role." },
      { title: "Evidence, not opinions", body: "Every candidate arrives with a score, the evidence and the gaps already explored." },
      { title: "Pay only when you hire", body: "A percentage of CTC. Nothing before that." },
    ],
  },

  /* --- Who it’s for ----------------------------------------------------------------------- */
  who: {
    eyebrow: "Who it’s for",
    title: "For anyone hiring in India.",
    titleItalic: "Any role.",
    audiences: [
      { title: "Startup founders", body: "The right first hires, without building a recruiting team." },
      { title: "Talent teams", body: "More relevant profiles and fewer drop-outs, without more headcount." },
      { title: "Hiring managers", body: "The person you described — and interviews that test what the JD expects." },
    ],
    roles: ["Engineering", "Product", "Design", "Data", "Sales", "Marketing", "Operations", "Finance", "Leadership"],
  },

  /* --- Privacy and consent ------------------------------------------------------------------- */
  privacy: {
    eyebrow: "Privacy and consent",
    title: "Candidates are people.",
    titleItalic: "We treat their data that way.",
    points: [
      "Work-related information only: career history, skills, public work. Never anything personal.",
      "First contact is by email. We continue on WhatsApp only when the candidate opts in.",
      "Every candidate can opt out at any time — and we stop.",
      "A grade never rejects anyone. A person always decides.",
      "We collect only what hiring needs, and delete it when it’s no longer needed.",
    ],
  },

  /* --- Pricing ---------------------------------------------------------------------------------- */
  pricing: {
    eyebrow: "Pricing",
    title: "Pay only when you hire.",
    lede: "A percentage of CTC, charged when you hire. No retainers, no subscriptions.",
    steps: ["Book a demo", "Our team calls you and walks through a live role", "Talyn starts searching", "You pay when you hire"],
  },

  /* --- FAQ --------------------------------------------------------------------------------------- */
  faq: [
    { q: "How does Talyn work?", a: "You share the role. Talyn reads the JD, searches by meaning across every source, scores each profile against the role with evidence, reaches out personally, closes gaps by chat, keeps candidates engaged and hands you a shortlist with the reasons attached. Our team checks every step." },
    { q: "What’s the best thing about Talyn?", a: "It hires for intent and context, not keywords — people who fit the role and want to move, with the evidence to prove both." },
    { q: "Is TALYNT an agency or software?", a: "An AI-native hiring agency. Talyn is our agent; you work with our team, and you don’t have to learn a tool." },
    { q: "What is Talyn Insights?", a: "Talyn’s intelligence module. Role Insights turns your JD into a search plan and an interview kit. Candidate Insights scores every profile against the JD out of 100, with evidence and gaps." },
    { q: "What does a score of 87 mean?", a: "The profile meets the role’s requirements strongly, with evidence for each — grade A. Scores always come with the evidence and the open gaps. A score never rejects anyone." },
    { q: "How do you know someone wants to move?", a: "Talyn reads eight work-related signals, from tenure patterns and promotion stagnation to company events, profile refreshes and what they say in conversation. Never anything personal." },
    { q: "How do you contact candidates?", a: "Email first, about their own profile. WhatsApp once they opt in. Everyone can opt out at any time." },
    { q: "How do you reduce drop-outs?", a: "Every candidate hears from us at every step, and health scores flag anyone drifting so Talyn and our recruiters re-engage them early." },
    { q: "How do you check answers are genuine?", a: "Six authenticity checks — timeline, specificity, cross-channel consistency, public evidence, generated-answer detection and skill claims against evidence. Anything that doesn’t add up goes to a person." },
    { q: "Do you replace my recruiters or hiring managers?", a: "No. Talyn handles the volume, follow-ups and evidence. People make the calls." },
    { q: "Which roles and locations?", a: "All roles, across India." },
    { q: "What does it cost?", a: "A percentage of CTC, charged only when you hire." },
  ],

  /* --- Close ------------------------------------------------------------------------------------- */
  close: {
    title: "Tell us who you’re looking for.",
    titleItalic: "Talyn starts searching today.",
    primary: "Book a demo",
    secondary: "Talk to us",
  },

  /* --- Meet Talyn: the agent, front and centre --------------------------------- */
  meet: {
    eyebrow: "Meet Talyn",
    title: "Meet Talyn.",
    titleItalic: "Our hiring agent that hires for intent.",
    lede: "Talyn is the AI agent at the heart of TALYNT LABS. It doesn’t stop at who matches your JD — it reads who actually wants this role, in your context, right now. Then it hands our recruiters and your hiring managers the reasons, so every conversation is worth having.",
    pillars: [
      { label: "Intent", body: "Who is likely open to a move, and why — read from eight switch signals, not guessed from a keyword." },
      { label: "Context", body: "Your team, your stage and the problem this hire solves — so Talyn searches for the person, not the title." },
      { label: "Reasons", body: "Every candidate arrives with a score, the evidence behind it and the gaps still open. A person always makes the call." },
    ],
    status: "Talyn is working on · Senior Backend Engineer",
    tasks: [
      "Reading your JD",
      "Mapping adjacent titles and the growth path",
      "Searching our sources by meaning",
      "Reading switch intent",
      "Drafting personal outreach",
      "Preparing questions for every profile",
      "Building your interview kit",
    ],
    handoff: "Handing over to your recruiter",
    primary: "Got a hiring problem? Tell us",
    secondary: "Ask Talyn",
  },

  /* --- The pop-up: "Got a hiring problem?" ------------------------------------------ */
  popup: {
    label: "Talyn · AI hiring agent",
    title: "Got a hiring problem?",
    body: "Talyn is here to help. Share the role — Talyn finds people who fit and are open to a move, and our team does the talking.",
    ask: "What’s getting in the way?",
    helps: "How Talyn helps",
    problems: [
      { label: "Roles take too long to fill", answer: "Talyn starts searching our sources as soon as your JD is in, and keeps working around the clock — outreach and follow-ups included." },
      { label: "Candidates drop out", answer: "Talyn tracks candidate and pipeline health at every stage, and follows up before anyone goes quiet." },
      { label: "Profiles don’t fit", answer: "Talyn scores every profile against your JD out of 100, with the evidence and the gaps — and reads intent, so you meet people who want the role." },
      { label: "Interviews go off-brief", answer: "Your hiring managers get an interview kit built on the JD, with questions for each candidate’s open gaps." },
    ],
    primary: "Book a demo",
    secondary: "Meet Talyn",
    launcher: "Got a hiring problem?",
    launcherCta: "Ask Talyn",
    close: "Close",
  },

  soon: "Coming soon",
  illustrative: "Illustrative · a fictional role, candidates and data",
} as const;

/** The navigation for the Talyn editions: everything is on the homepage. */
export const TALYN_NAV = [
  { label: "Meet Talyn", hash: "meet-talyn" },
  { label: "How it works", hash: "how" },
  { label: "Talyn Insights", hash: "insights" },
  { label: "Capabilities", hash: "capabilities" },
  { label: "Pricing", hash: "pricing" },
  { label: "FAQ", hash: "faq" },
] as const;
