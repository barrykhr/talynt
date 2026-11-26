/**
 * PROPOSED — the Buddy editions' content (NEXT_PUBLIC_CT_EDITION, see
 * lib/contour/variant.ts). Every string here is new and needs the same approval
 * as the rest of proposed copy.
 *
 * TALYNT LABS is the company — an AI-native hiring agency. Buddy is its AI
 * hiring agent ("Buddy by TALYNT LABS"), a name of its own so the company can
 * add more agents later.
 *
 * Product capabilities follow TALYNT's live feature list (22 features, from
 * role insights to the inbox). Nothing here claims a capability outside that
 * list; the two items marked `soon` (voice calls, salary benchmarks) were
 * asked for by TALYNT as "Coming soon".
 *
 * The exported names (TALYN, TALYN_NAV) are kept from the first draft so the
 * components don't change; the agent on the page is Buddy.
 */

export const TALYN = {
  /* --- Hero ---------------------------------------------------------------- */
  hero: {
    title: "AI finds who to talk to.",
    titleItalic: "People do the talking.",
    lede: "TALYNT LABS is an AI-native hiring agency. Buddy, our AI hiring agent, turns your JD into a search, finds people every day, checks every criterion against the CV, and tells you when it’s a good time to reach out — so our recruiters and your hiring managers spend their time on the conversations that matter.",
    primary: "Book a demo",
    secondary: "Talk to us",
    pillars: ["Anchored to your JD", "Evidence for every criterion", "Hire for timing", "Pay only when you hire"],
  },

  /* --- The film (film edition): the seven scene cards ------------------------ */
  film: [
    { tag: "Talent intelligence, built for hiring.", title: "AI finds who to talk to.", titleItalic: "People do the talking.", body: "TALYNT LABS is an AI-native hiring agency. Share the role — Buddy, our AI hiring agent, takes it from there." },
    { tag: "Search by meaning", title: "Ask for the person.", titleItalic: "Get the person.", body: "Search your talent pool in plain English and see what Buddy understood. Buddy finds similar companies to source from, and looks for new people every day." },
    { tag: "Evidence-based screening", title: "Every criterion,", titleItalic: "checked against the CV.", body: "Each profile gets a score and a talent grade, with a quoted line from the CV for every criterion — and anyone missing a must-have ranks below." },
    { tag: "Outreach you approve", title: "Personal drafts.", titleItalic: "Sent when you say.", body: "Drafts built only from real profile facts. Nothing goes out until you approve it — and candidates answer in one click." },
    { tag: "Interest and scheduling", title: "Only people who said yes.", titleItalic: "On a slot they picked.", body: "Hiring managers meet only candidates who confirmed interest, and candidates book their own interview slot from a link." },
    { tag: "Interviews on the JD", title: "Every call,", titleItalic: "checked against the JD.", body: "Interview kits and deep-dives mapped to the JD. Buddy reads each call — did the candidate match it, did the interviewer ask about it — and flags risky questions." },
    { tag: "People decide", title: "Buddy finds. Buddy checks.", titleItalic: "People decide.", body: "The shortlist with the evidence behind each person. Your hiring manager says Interested, Not a fit, or asks a question.", primary: "Book a demo", secondary: "Talk to us" },
  ],

  /* --- The problem --------------------------------------------------------- */
  problem: {
    eyebrow: "The problem",
    title: "Everyone added AI to hiring.",
    titleItalic: "The shortlists didn’t get better.",
    lede: "More profiles, more filters, more automated messages. Hiring managers still settle for whoever applied, interviews drift from the JD, and nobody can say why someone is right.",
    points: [
      { label: "Keyword matching", body: "finds people who wrote the right words, not people who did the work." },
      { label: "Make-do shortlists", body: "hiring managers settle for what they’re given, not what they asked for." },
      { label: "Off-brief interviews", body: "questions wander from the JD, and what matters never gets asked." },
      { label: "No reasons", body: "a CV and a gut feel, with nothing that says why this person, for this role." },
    ],
  },

  /* --- How it works ------------------------------------------------------- */
  how: {
    eyebrow: "How Buddy works",
    title: "One role in.",
    titleItalic: "A shortlist with evidence out.",
    steps: [
      { id: "brief", title: "Read the role", body: "Buddy turns your JD into skills, criteria and a ready search query, and flags vague or exclusionary wording. You mark the must-haves." },
      { id: "calibrate", title: "Calibrate", body: "Your hiring manager reacts to 5–8 real profiles and says why. Buddy suggests sharper criteria — and remembers them for the next role." },
      { id: "search", title: "Find people", body: "Plain-English search of your talent pool, similar companies to source from, new people every day, and past candidates who nearly made it." },
      { id: "timing", title: "Time it", body: "A timing score shows when it’s a good moment to reach out, with every reason and its source." },
      { id: "screen", title: "Screen with evidence", body: "Every criterion checked against the CV with a quoted line. Review one candidate at a time: shortlist, hold or reject with a reason." },
      { id: "engage", title: "Reach out", body: "Personal drafts you approve. Candidates confirm interest in one click and book their own interview slot." },
      { id: "decide", title: "Interview and decide", body: "Interview kits and call checks against the JD. Your hiring manager reviews the shortlist with the evidence and decides." },
    ],
  },

  /* --- Insights ---------------------------------------------------------- */
  insights: {
    eyebrow: "Buddy Insights",
    title: "Every role understood.",
    titleItalic: "Every profile checked against it.",
    lede: "Two halves that meet at one point: fit against the role, with evidence. Role insights read the JD. Evidence-based screening reads each CV against it.",
    role: {
      name: "Role insights",
      title: "The JD, turned into a search.",
      items: [
        { label: "Skills and criteria", body: "The JD broken into the skills and criteria a candidate is measured against." },
        { label: "A ready search query", body: "A search string, ready to run, built from the criteria." },
        { label: "Wording check", body: "Flags vague or exclusionary wording in the JD before the search starts." },
        { label: "Must-haves", body: "Mark the non-negotiables. Anyone who clearly lacks one ranks below everyone who doesn’t. Nobody is hidden." },
        { label: "Calibration", body: "The hiring manager reacts to 5–8 real profiles and says why; Buddy suggests sharper criteria from the reasons." },
        { label: "Hiring memory", body: "Buddy remembers what each company’s hiring managers wanted, so the next role starts sharper." },
        { label: "Salary benchmarks", body: "Market ranges for the role.", soon: true },
      ],
    },
    candidate: {
      name: "Evidence-based screening",
      title: "Every criterion, checked against the CV.",
      items: [
        { label: "A quote for every criterion", body: "Each criterion is checked against the CV, with the line that proves it." },
        { label: "Essentials met", body: "How many of the role’s essentials the profile matches — “Matches 4 of 5 essentials”." },
        { label: "Profile score", body: "A score out of 100 against the role." },
        { label: "Talent grade", body: "A+, A, B or C — from the score, never instead of it." },
        { label: "Review mode", body: "One candidate at a time. S to shortlist, H to hold, R to reject — a reason is required." },
        { label: "Past candidates", body: "People who nearly made it for other roles come back for another look." },
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
    eyebrow: "What Buddy does",
    title: "An agent for the work.",
    titleItalic: "People for the decisions.",
    modules: [
      {
        id: "search",
        title: "Semantic search and sourcing",
        line: "Ask for the person. Get the person.",
        body: "Search your talent pool in plain English — “scaled payments at a startup” — and see what Buddy understood as chips you can edit.",
        points: [
          "What Buddy understood, as editable chips",
          "Target companies: similar companies to source from, each with source links",
          "Always looking: new people found every day for each open role",
          "Past candidates: people who nearly made it, resurfaced for another look",
        ],
      },
      {
        id: "timing",
        title: "Hire for timing",
        line: "Reach out when it’s a good moment.",
        body: "A timing score shows when it’s a good time to reach out, and why — with a source for every reason.",
        points: [
          "Time in the same title, from the CV",
          "Company news — layoffs, restructuring, acquisitions, leadership changes — each with a source link",
          "Public profile updates",
        ],
      },
      {
        id: "calibration",
        title: "Calibration and hiring memory",
        line: "Hire for what you want. Not what you’re given.",
        body: "Your hiring manager reacts to 5–8 real profiles and says why. Buddy turns the reasons into sharper criteria, and remembers them for the next role.",
        points: [
          "Would meet ✓ · Wouldn’t meet ✕ · Not sure — with a reason",
          "Suggested criteria from the reasons: “Add: Owned a Kafka migration”",
          "Must-haves: anyone who clearly lacks one ranks below — nobody is hidden",
          "Hiring memory per company, so the next role starts sharper",
        ],
      },
      {
        id: "screening",
        title: "Evidence-based screening",
        line: "A quote for every criterion.",
        body: "Every criterion is checked against the CV with a quoted line, plus a profile score and a talent grade. Then review one candidate at a time.",
        points: [
          "“Matches 4 of 5 essentials”, with the line from the CV",
          "Profile score and talent grade",
          "Review mode: S shortlist · H hold · R reject (a reason is required)",
          "Arrow keys to move between candidates",
        ],
      },
      {
        id: "outreach",
        title: "Outreach, interest and scheduling",
        line: "Personal drafts. Sent when you say.",
        body: "Drafts built only from real profile facts — you approve before anything is sent. Candidates confirm interest in one click and book their own slot.",
        points: [
          "Personalised drafts from real profile facts",
          "Nothing is sent until you approve it",
          "Interest check: hiring managers only meet people who said yes",
          "Self-scheduling: candidates pick their interview slot from a link",
        ],
        soon: ["Voice calls to candidates who go quiet"],
      },
      {
        id: "managers",
        title: "Interview kit and deep-dives",
        line: "Questions that test what the JD expects.",
        body: "Questions mapped to the JD and to each candidate’s open gaps, plus behavioural deep-dives tuned to company size.",
        points: [
          "Every question tagged to a JD requirement or an open gap",
          "Follow-up ladders, L1 → L3",
          "A benchmark for what a strong answer sounds like",
        ],
      },
      {
        id: "calls",
        title: "Call check",
        line: "Every interview, checked against the JD — both ways.",
        body: "Works with your notetaker. Buddy reads every interview call: did the candidate match the JD, and did the interviewer ask about it?",
        points: [
          "“Candidate matches 4 of 5” · “Questions on JD 63%”",
          "What was never asked: “Never asked: On-call ownership”",
          "Flags questions that touch personal or protected topics",
          "Hiring manager profiles: how each one actually interviews, per company",
        ],
      },
      {
        id: "authenticity",
        title: "Authenticity and integrity checks",
        line: "Check with a person. Never a verdict.",
        body: "Buddy checks answers for timeline, specificity and copied or AI-generated text, plus near-identical CVs and CV-versus-call mismatches. Anything that doesn’t add up goes to a person.",
        points: ["Timeline and specificity", "Copied or AI-generated text", "Near-identical CVs", "CV versus call: “CV says 8 years / on the call: about 5”"],
      },
      {
        id: "humans",
        title: "Hiring manager review and inbox",
        line: "Buddy finds. Buddy checks. People decide.",
        body: "The shortlist with the evidence behind each person. The hiring manager says Interested, Not a fit, or asks a question. One inbox holds everything that needs you.",
        points: ["Interested · Not a fit · Question", "One bell for everything that needs you", "Mark items Done, or Snooze them for a day", "A reject always needs a reason — no score rejects anyone"],
      },
    ],
  },

  /* --- The difference ------------------------------------------------------------------ */
  difference: {
    eyebrow: "The TALYNT difference",
    title: "Not a tool you operate.",
    titleItalic: "A hiring team that delivers.",
    points: [
      { title: "Done for you", body: "Buddy does the work, our team owns the outcome. You don’t learn another tool." },
      { title: "Hire for timing", body: "People who fit the role, reached at a good moment — with the reasons and sources." },
      { title: "Anchored to your JD", body: "Every search, screen, question and call check traces back to the role." },
      { title: "Evidence, not opinions", body: "Every criterion comes with a quoted line from the CV." },
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
      { title: "Talent teams", body: "Better-fitting profiles, every day, without more headcount." },
      { title: "Hiring managers", body: "The person you described — and interviews that stay on the JD." },
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
      "Company news and profile updates come with their source, so every reason can be checked.",
      "Nothing is sent to a candidate until a person approves it. Every candidate can opt out at any time.",
      "Interview questions on personal or protected topics are flagged.",
      "Integrity checks ask a person to look — they never give a verdict. A score never rejects anyone.",
    ],
  },

  /* --- Pricing ---------------------------------------------------------------------------------- */
  pricing: {
    eyebrow: "Pricing",
    title: "Pay only when you hire.",
    lede: "A percentage of CTC, charged when you hire. No retainers, no subscriptions.",
    steps: ["Book a demo", "Our team calls you and walks through a live role", "Buddy starts searching", "You pay when you hire"],
  },

  /* --- FAQ --------------------------------------------------------------------------------------- */
  faq: [
    { q: "Who is Buddy?", a: "Buddy is the AI hiring agent by TALYNT LABS. It reads your JD, finds people, checks every criterion against the CV, and checks interviews against the JD. Our team and your hiring managers make the calls." },
    { q: "Is TALYNT an agency or software?", a: "An AI-native hiring agency. Buddy is our agent; you work with our team, and you don’t have to learn a tool." },
    { q: "How does Buddy read a role?", a: "Role insights turn your JD into skills, criteria and a ready search query, and flag vague or exclusionary wording. You mark the must-haves, and your hiring manager calibrates on 5–8 real profiles." },
    { q: "What happens to people who miss a must-have?", a: "Anyone who clearly lacks one ranks below everyone who doesn’t. Nobody is hidden." },
    { q: "Where does Buddy find people?", a: "In your talent pool, by plain-English search; in similar companies Buddy profiles for you, each with source links; in new people found every day for each open role; and among past candidates who nearly made it." },
    { q: "What is the timing score?", a: "It shows when it’s a good moment to reach out: time in the same title from the CV, company news such as layoffs or leadership changes with a source link, and public profile updates." },
    { q: "How does screening work?", a: "Every criterion is checked against the CV with a quoted line, plus a profile score and a talent grade. You review one candidate at a time — shortlist, hold, or reject with a reason." },
    { q: "Do messages go out automatically?", a: "No. Buddy drafts personal messages from real profile facts, and nothing is sent until you approve it. Candidates confirm interest in one click and book their own interview slot." },
    { q: "What does the call check do?", a: "Working with your notetaker, Buddy checks each interview call against the JD both ways — did the candidate match it, and did the interviewer ask about it — and flags questions on personal or protected topics." },
    { q: "How do you check answers are genuine?", a: "Buddy checks for timeline, specificity and copied or AI-generated text, near-identical CVs and CV-versus-call mismatches. It never gives a verdict — it asks a person to check." },
    { q: "Do you replace my recruiters or hiring managers?", a: "No. Buddy finds and checks. People decide." },
    { q: "What does it cost?", a: "A percentage of CTC, charged only when you hire." },
  ],

  /* --- Close ------------------------------------------------------------------------------------- */
  close: {
    title: "Tell us who you’re looking for.",
    titleItalic: "Buddy starts searching today.",
    primary: "Book a demo",
    secondary: "Talk to us",
  },

  /* --- Meet Buddy: the agent, front and centre --------------------------------- */
  meet: {
    eyebrow: "Meet Buddy",
    title: "Meet Buddy.",
    titleItalic: "The AI hiring agent by TALYNT LABS.",
    lede: "Buddy does the work between a JD and a decision: it reads the role, finds people every day, checks every criterion against the CV, and checks every interview against the JD. Then it hands our recruiters and your hiring managers the evidence.",
    pillars: [
      { label: "Buddy finds", body: "Plain-English search, similar companies to source from, new people every day — and a timing score for when to reach out." },
      { label: "Buddy checks", body: "Every criterion against the CV with a quote, every interview against the JD, and anything that doesn’t add up." },
      { label: "People decide", body: "You approve every message. Your hiring manager decides. A reject always needs a reason." },
    ],
    status: "Buddy is working on · Senior Backend Engineer",
    tasks: [
      "Reading your JD and flagging vague wording",
      "Building the search query from your must-haves",
      "Searching your talent pool and 25 similar companies",
      "Scoring timing, with sources",
      "Checking every criterion against the CV",
      "Drafting outreach for your approval",
      "Building the interview kit",
    ],
    handoff: "Handing over to your team",
    primary: "Got a hiring problem? Tell us",
    secondary: "Ask Buddy",
  },

  /* --- The pop-up: "Got a hiring problem?" ------------------------------------------ */
  popup: {
    label: "Buddy · AI hiring agent",
    title: "Got a hiring problem?",
    body: "Buddy is here to help. Share the role — Buddy finds and checks the people, and your team decides.",
    ask: "What’s getting in the way?",
    helps: "How Buddy helps",
    problems: [
      { label: "Roles take too long to fill", answer: "Buddy turns your JD into a ready search, searches your talent pool in plain English, and looks for new people every day for each open role." },
      { label: "Candidates drop out", answer: "Candidates confirm interest in one click and book their own interview slot — so hiring managers only meet people who said yes." },
      { label: "Profiles don’t fit", answer: "Mark the must-haves, calibrate with your hiring manager on real profiles, and see every criterion checked against the CV with a quote." },
      { label: "Interviews go off-brief", answer: "Interview kits mapped to the JD, and a call check that shows what the interviewer never asked about." },
    ],
    primary: "Book a demo",
    secondary: "Meet Buddy",
    launcher: "Got a hiring problem?",
    launcherCta: "Ask Buddy",
    close: "Close",
  },

  soon: "Coming soon",
  illustrative: "Illustrative product visuals · a fictional role, candidates and data",
} as const;

/** The navigation for the Buddy editions: everything is on the homepage. */
export const TALYN_NAV = [
  { label: "Meet Buddy", hash: "meet-buddy" },
  { label: "How it works", hash: "how" },
  { label: "Insights", hash: "insights" },
  { label: "Capabilities", hash: "capabilities" },
  { label: "Pricing", hash: "pricing" },
  { label: "FAQ", hash: "faq" },
] as const;

/**
 * The film's laptop and phone screens in the Buddy film edition: the same
 * screens and motion as the original film, showing the live features that each
 * Buddy scene card describes. The original film keeps its own text (FILM in
 * proposed.ts).
 */
export const BUDDY_FILM_SCREENS = {
  brief: {
    app: "TALYNT · Buddy",
    nav: ["Roles", "Candidates", "Outreach", "Interviews"],
    eyebrow: "New role",
    role: "Senior Backend Engineer",
    meta: "Fintech · Bengaluru · Hybrid",
    needs: ["Payments infrastructure · Must-have ✓", "Event-driven systems · Must-have ✓", "On-call ownership · Must-have ✓"],
    button: "Find talent",
    busy: "Searching…",
  },
  sources: ["Your talent pool", "25 similar companies", "New since yesterday", "Past candidates", "Plain-English search", "Hiring memory"],
  shortlist: {
    header: "Screened against the JD, with quotes",
    people: [
      { initials: "AK", line: "Backend engineer · 7 years", reasons: ["“Led the settlement migration to Kafka”", "Matches 5 of 5 essentials"] },
      { initials: "RS", line: "Platform engineer · 9 years", reasons: ["“Owned on-call for core APIs”", "Matches 4 of 5 essentials"] },
      { initials: "MN", line: "Senior engineer · 6 years", reasons: ["“Event sourcing in production”", "Matches 4 of 5 essentials"] },
      { initials: "PD", line: "Staff engineer · 11 years", reasons: ["“Owned the ledger migration”", "Matches 4 of 5 essentials"] },
    ],
  },
  outreach: {
    compose: "Draft · from real profile facts",
    to: "Aarav · Backend engineer",
    subject: "Your payments-ledger work, and a role built around it",
    lines: [
      "Hi Aarav — you led the settlement migration to Kafka. A fintech",
      "team in Bengaluru is solving the same problem, and this role",
      "owns it. Would you like to hear more?",
    ],
    send: "Approve",
    sent: "Approved · sent",
    chat: "TALYNT LABS",
    channel: "Interest check",
    out: "Would you like to hear more about the Senior Backend role?",
    reply: "Yes, I’m interested",
  },
  nurture: {
    who: "Aarav · Backend engineer",
    warmth: "Interest",
    warm: "Confirmed",
    steps: [
      { channel: "Email", text: "Draft approved by the recruiter, then sent" },
      { channel: "Interest", text: "“Would you like to hear more?” → “Yes, I’m interested”" },
      { channel: "Schedule", text: "Picked an interview slot from the link" },
      { channel: "Inbox", text: "Hiring manager: interview on Wednesday" },
    ],
    invite: "Pick a time",
    when: "Wednesday · 10:00",
    accepted: "You’re booked",
  },
  pipeline: {
    stages: ["Sourced", "Screened", "Interested", "Interview", "Offer"],
    nudges: [
      "Call check · candidate matches 4 of 5",
      "Questions on JD 63% · never asked: on-call",
      "Flagged · “planning a family?” — protected topic",
    ],
  },
  decide: {
    header: "Hiring manager review · with the evidence",
    review: "Interested",
  },
} as const;
