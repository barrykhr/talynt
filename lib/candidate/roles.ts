/**
 * Opportunities, written the way we would want one written for us.
 *
 * A role here is not a job advert. It carries the reasoning behind the hire —
 * why it exists, what success actually looks like, and what is genuinely hard
 * about it — because that is what a person needs to decide, and none of it
 * survives a bullet list of requirements.
 *
 * Company names are withheld until a conversation starts. That is deliberate
 * and stated in the UI, not a gap in the data.
 */

export type RoleSection = { heading: string; body: string[] };

export type Role = {
  slug: string;
  title: string;
  /** Anonymised company descriptor. Real names come in conversation. */
  company: string;
  functionId: string;
  bandId: string;
  stageId: string;
  workModelIds: string[];
  locationIds: string[];
  /** Stated up front. Never withheld to offer stage. */
  compensation: { low: number; high: number; currency: string; period: "year"; note?: string };
  /** Short line used on the card and in search. */
  summary: string;
  teamSize: string;
  reportsTo: string;
  posted: string;
  /** The values this environment genuinely rewards, drawn from VALUES. */
  valueIds: string[];
  /** Direction ids this role can plausibly serve. Used for alignment, not ranking. */
  directionIds: string[];
  skills: string[];
  theRole: string[];
  whyExists: string[];
  success: RoleSection[];
  lookingFor: { essential: string[]; helpful: string[]; notRequired: string[] };
  howYouWork: RoleSection[];
  whatMatters: string[];
  couldTakeYouTo: string[];
  /** The honest caveat. Every role has one. */
  consider: string[];
  process: Array<{ step: string; detail: string }>;
};

export const ROLES: Role[] = [
  {
    slug: "senior-full-stack-engineer-b2b-platform",
    title: "Senior Full Stack Engineer",
    company: "Series B B2B platform · 140 people",
    functionId: "engineering",
    bandId: "senior",
    stageId: "series-b",
    workModelIds: ["remote", "hybrid"],
    locationIds: ["bengaluru", "pune", "anywhere"],
    compensation: {
      low: 4500000,
      high: 6500000,
      currency: "INR",
      period: "year",
      note: "Plus equity. The band is the real band — it is not an opening position.",
    },
    summary:
      "Own a product surface end to end on a platform that has outgrown the way it was first built.",
    teamSize: "8 engineers, 3 squads",
    reportsTo: "VP Engineering",
    posted: "2026-09-12",
    valueIds: ["autonomy", "craft", "impact", "transparency"],
    directionIds: ["deeper", "ownership", "broader"],
    skills: ["TypeScript", "React", "Node", "Postgres", "AWS"],
    theRole: [
      "You would own one of three product surfaces outright — its architecture, its roadmap input, its reliability and the engineers who work alongside you on it.",
      "This is not a ticket-taking role. The team works from problems, not specifications, and the person who owns a surface is expected to have an opinion about what should be built on it.",
    ],
    whyExists: [
      "The platform was built in eighteen months by four people who were, correctly, optimising for finding a market rather than for the next four years. They found the market. The architecture has not caught up.",
      "Two of those four have moved into leadership. The surface they built is now the one the company sells hardest and the one nobody feels confident changing.",
      "They are not hiring for capacity. They are hiring for someone to take that surface back under control while it keeps shipping.",
    ],
    success: [
      {
        heading: "First 90 days",
        body: [
          "You have read enough of the system to disagree with parts of it in specifics rather than in general.",
          "You have shipped at least two changes to the surface you will own, so the team has seen how you work before you start changing how they work.",
        ],
      },
      {
        heading: "Six months",
        body: [
          "The surface has a documented architecture that someone new could read in an afternoon.",
          "Deploy frequency on it has gone up, not down, while you were changing it. This is the hard part and they know it.",
        ],
      },
      {
        heading: "A year",
        body: [
          "The two founding engineers no longer get pulled into questions about this surface.",
          "You are the person the VP Engineering asks before committing to a date on it.",
        ],
      },
    ],
    lookingFor: {
      essential: [
        "You have owned a production system through a period where it had to change while it stayed up.",
        "You are comfortable across the stack — not equally strong everywhere, but not stopped by either end of it.",
        "You can explain a technical decision to someone who does not share your context, and change your mind when they push back with something good.",
      ],
      helpful: [
        "Experience at a company one stage ahead of Series B — you will recognise what is coming.",
        "You have inherited someone else's codebase and improved it without rewriting it.",
      ],
      notRequired: [
        "Management experience. This role does not carry headcount, and there is no expectation it will within the year.",
        "Their exact stack. They care that you have gone deep on something, not that it was this.",
      ],
    },
    howYouWork: [
      {
        heading: "How the team operates",
        body: [
          "Distributed by default, with two overlapping hours a day and everything of consequence written down.",
          "No daily stand-up. A weekly written update and a fortnightly planning conversation.",
        ],
      },
      {
        heading: "How decisions get made",
        body: [
          "Engineers write short design notes for anything that changes a contract between systems. Two people read it. Then it ships.",
          "The VP Engineering has a stated policy of not overruling a design note without writing a longer one.",
        ],
      },
    ],
    whatMatters: [
      "They would rather ship something narrow that works than something broad that mostly does.",
      "Disagreement in writing is normal and is not read as conflict.",
      "Nobody is rewarded for being available at 11pm, and the two people who were have stopped.",
    ],
    couldTakeYouTo: [
      "A staff or principal track — the company has two such roles and both were filled internally.",
      "Engineering leadership, if you want it. It is not the default and nobody will push you toward it.",
      "A founding engineering role elsewhere. Owning a surface through this kind of transition is the experience early-stage companies look hardest for.",
    ],
    consider: [
      "The surface you would own has real technical debt and some of it is load-bearing. The first six months involve saying no to feature work more often than is comfortable.",
      "The team is small enough that you will be on call. It is roughly one week in four.",
    ],
    process: [
      { step: "Conversation with TALYNT", detail: "45 minutes. About you, not a screen." },
      { step: "Hiring manager", detail: "60 minutes with the VP Engineering, about the surface and the problem." },
      { step: "Technical conversation", detail: "90 minutes, on your own code or theirs. No live algorithm puzzles." },
      { step: "Team conversation", detail: "Two engineers you would work with. They also answer your questions." },
      { step: "Decision", detail: "Within five working days of the last conversation, either way, with reasons." },
    ],
  },
  {
    slug: "staff-data-engineer-fintech",
    title: "Staff Data Engineer",
    company: "Regulated fintech · 600 people",
    functionId: "data",
    bandId: "lead",
    stageId: "growth",
    workModelIds: ["hybrid"],
    locationIds: ["mumbai", "bengaluru"],
    compensation: {
      low: 6000000,
      high: 8200000,
      currency: "INR",
      period: "year",
      note: "Band widens for candidates with regulated-reporting experience.",
    },
    summary:
      "Rebuild the reporting spine of a company whose regulator now asks questions its data cannot answer quickly.",
    teamSize: "14 across data engineering and platform",
    reportsTo: "Head of Data",
    posted: "2026-09-05",
    valueIds: ["craft", "clarity", "impact", "stability"],
    directionIds: ["deeper", "ownership", "change"],
    skills: ["Spark", "Python", "dbt", "Kafka", "Snowflake"],
    theRole: [
      "You would set the technical direction for how data moves through the company and be accountable for the correctness of what comes out of it.",
      "Staff here means influence without headcount: you would spend most of your time on design, review and the two or three problems nobody else can unblock.",
    ],
    whyExists: [
      "Reporting obligations that took a week to satisfy in 2023 now take three, because every new product added a pipeline rather than extending one.",
      "The Head of Data can describe the target architecture. They do not have anyone with the seniority and the time to drive it.",
    ],
    success: [
      {
        heading: "First 90 days",
        body: [
          "You can trace any number in the regulatory report back to its source without asking anyone.",
          "You have written the target-state document the team has been arguing about verbally for a year.",
        ],
      },
      {
        heading: "Six months",
        body: [
          "One of the three duplicated pipelines is gone, and nothing downstream noticed.",
          "New product surfaces plug into the spine rather than building beside it — at least once, deliberately, as proof.",
        ],
      },
      {
        heading: "A year",
        body: [
          "Regulatory reporting is a scheduled job, not a project.",
          "The team's design reviews are happening without you in the room.",
        ],
      },
    ],
    lookingFor: {
      essential: [
        "You have built data infrastructure that other engineers depend on, and lived with the consequences.",
        "You are precise about correctness. In this domain a number that is nearly right is wrong.",
        "You can hold a technical position in a room with compliance, finance and engineering in it.",
      ],
      helpful: [
        "Any regulated environment — finance, health, insurance. The instinct transfers more than the rules do.",
        "Experience decommissioning systems, which is harder than building them.",
      ],
      notRequired: [
        "Their exact warehouse. They have migrated twice and expect to again.",
        "A finance background. They will teach the domain; they cannot teach the engineering judgement.",
      ],
    },
    howYouWork: [
      {
        heading: "How the team operates",
        body: [
          "Three days a week in the Mumbai or Bengaluru office. This is not negotiable and they say so up front rather than at offer stage.",
          "Two-week cycles with a written review at the end of each.",
        ],
      },
      {
        heading: "How decisions get made",
        body: [
          "Architecture decisions go through a written RFC with a named decider. Most of the time, in this role, that would be you.",
          "Compliance has a veto on anything touching reporting, exercised roughly twice a year.",
        ],
      },
    ],
    whatMatters: [
      "Being right matters more than being fast, and the incentives actually reflect that.",
      "Nobody ships to production on a Friday, and nobody is asked to.",
      "The team has an unusually low turnover rate — four people have been there over five years.",
    ],
    couldTakeYouTo: [
      "Principal engineer, which exists here and is a genuine technical track.",
      "Head of Data Platform, if the function splits — plausible within two years at the current growth rate.",
      "Any regulated-data role anywhere. This experience is scarce and it travels.",
    ],
    consider: [
      "Three days in office, in Mumbai or Bengaluru. If that does not work for you, this role does not, and no amount of conversation will change it.",
      "The pace is deliberate. If you are energised by shipping weekly, you will find this slow.",
    ],
    process: [
      { step: "Conversation with TALYNT", detail: "45 minutes." },
      { step: "Head of Data", detail: "60 minutes on the architecture problem itself." },
      { step: "Design conversation", detail: "A real problem from their backlog, discussed, not tested." },
      { step: "Panel", detail: "Compliance, platform engineering, and one analyst who consumes the output." },
      { step: "Decision", detail: "Within a week, with reasons." },
    ],
  },
  {
    slug: "product-manager-developer-tools",
    title: "Product Manager, Developer Experience",
    company: "Developer tooling company · 70 people",
    functionId: "product",
    bandId: "senior",
    stageId: "series-a",
    workModelIds: ["remote-global", "remote"],
    locationIds: ["anywhere", "bengaluru", "berlin", "london"],
    compensation: {
      low: 95000,
      high: 130000,
      currency: "USD",
      period: "year",
      note: "Paid in local currency at a location-independent band.",
    },
    summary:
      "Build for engineers, who are the least forgiving users there are and the most honest.",
    teamSize: "A squad of 6; product org of 3",
    reportsTo: "Co-founder / CPO",
    posted: "2026-09-18",
    valueIds: ["autonomy", "craft", "impact", "flexibility"],
    directionIds: ["ownership", "broader", "change"],
    skills: ["Developer tools", "Technical PM", "Discovery", "API design"],
    theRole: [
      "You would own the part of the product engineers touch every day — the CLI, the SDKs and the first ten minutes of using the thing.",
      "You would be the third product person, which means you would write your own specs, run your own research, and be in the codebase enough to read a pull request.",
    ],
    whyExists: [
      "Adoption is strong and retention is not. People install it, get something working, and drift away in week three.",
      "The founders have a theory about why and no time to test it. They want someone whose full job is that question.",
    ],
    success: [
      {
        heading: "First 90 days",
        body: [
          "You have spoken to twenty users who churned, and the team has heard the recordings.",
          "You have a defensible answer to the week-three question, even if it is not the one anyone expected.",
        ],
      },
      {
        heading: "Six months",
        body: [
          "Two shipped changes aimed directly at that answer, with the retention curve measured before and after.",
          "The squad plans from a problem you framed rather than a list you were handed.",
        ],
      },
      {
        heading: "A year",
        body: [
          "Week-three retention has moved measurably, or you can say precisely why it did not and what that means for the product.",
        ],
      },
    ],
    lookingFor: {
      essential: [
        "You have built for a technical audience and know why that is different.",
        "You do your own discovery. There is no research function to hand it to.",
        "You are comfortable being the person who says the data does not support the thing everyone wants to build.",
      ],
      helpful: [
        "You have written code professionally at some point, or enough of it that engineers do not translate for you.",
        "Open-source community experience — a large part of the user base lives there.",
      ],
      notRequired: [
        "An engineering degree or a current ability to ship production code.",
        "Experience at their scale. They are looking for judgement, not a template.",
      ],
    },
    howYouWork: [
      {
        heading: "How the team operates",
        body: [
          "Fully remote across five timezones, asynchronous by necessity, with one four-hour overlap window.",
          "Everything is a document first. Meetings are for disagreement, not for status.",
        ],
      },
      {
        heading: "How decisions get made",
        body: [
          "The squad decides what to build within a quarterly problem the founders set.",
          "The CPO has overruled a squad decision twice in two years and wrote up both.",
        ],
      },
    ],
    whatMatters: [
      "Evidence beats seniority in an argument, consistently and visibly.",
      "They ship small and often, and they revert without ceremony.",
      "Nobody tracks hours. Several people work four-day weeks.",
    ],
    couldTakeYouTo: [
      "Leading the product function as the company grows — the CPO has said publicly they want to stop being it.",
      "A deeper developer-tools specialism, which is a small and well-paid world.",
      "Founding something. Three former employees have.",
    ],
    consider: [
      "Series A with roughly two years of runway. That is normal and it is also real.",
      "No research, design-ops or analytics support. If you need that scaffolding to do good work, you will feel its absence immediately.",
    ],
    process: [
      { step: "Conversation with TALYNT", detail: "45 minutes." },
      { step: "CPO", detail: "60 minutes about the retention problem, with real data shared." },
      { step: "Working session", detail: "Half a day, paid, on a problem from their actual backlog." },
      { step: "Squad conversation", detail: "The engineers and designer you would work with." },
      { step: "Decision", detail: "Within three days." },
    ],
  },
  {
    slug: "head-of-people-scaling-org",
    title: "Head of People",
    company: "Consumer marketplace · 300 people, doubling",
    functionId: "people",
    bandId: "head",
    stageId: "series-b",
    workModelIds: ["hybrid", "onsite"],
    locationIds: ["delhi-ncr", "bengaluru"],
    compensation: {
      low: 7000000,
      high: 9500000,
      currency: "INR",
      period: "year",
      note: "Includes meaningful equity; the band reflects the scope, not the headcount.",
    },
    summary:
      "Build the people function a company needs at 600 while it still has 300 people's worth of patience.",
    teamSize: "6, growing to 12",
    reportsTo: "CEO",
    posted: "2026-08-28",
    valueIds: ["clarity", "transparency", "impact", "growth"],
    directionIds: ["leading", "ownership", "broader"],
    skills: ["Org design", "Hiring systems", "Performance", "Compensation"],
    theRole: [
      "You would own hiring, performance, compensation and the organisational design of a company that is about to double.",
      "You would sit on the leadership team and be expected to disagree with it.",
    ],
    whyExists: [
      "The company grew from 90 to 300 in two years on instinct and goodwill. Both are running out at the same time.",
      "There is no compensation framework, no consistent performance conversation, and a hiring process that varies by whoever is running it.",
      "The CEO knows this is now a risk to the business rather than an HR inconvenience, which is the reason this role reports to them.",
    ],
    success: [
      {
        heading: "First 90 days",
        body: [
          "You have met every manager and can describe, accurately, where the company actually hurts rather than where it says it does.",
          "One thing is fixed. Small, visible, and chosen by you.",
        ],
      },
      {
        heading: "Six months",
        body: [
          "A compensation framework exists and has survived its first contact with a counter-offer.",
          "Hiring runs the same way in every function, and time-to-hire has not gone up.",
        ],
      },
      {
        heading: "A year",
        body: [
          "Managers run performance conversations without the people team in the room.",
          "The leadership team makes org decisions with your input before rather than after.",
        ],
      },
    ],
    lookingFor: {
      essential: [
        "You have built a people function through a doubling, not inherited a working one.",
        "You are credible with a leadership team on commercial terms, not only people terms.",
        "You have told a founder something they did not want to hear and kept the relationship.",
      ],
      helpful: [
        "Consumer or marketplace experience — the operational workforce is a different problem from the engineering one and this company has both.",
        "You have designed a compensation framework from nothing.",
      ],
      notRequired: [
        "A formal HR qualification.",
        "Experience at 1000+. They want someone who has done 300 to 600 well, which is a different skill.",
      ],
    },
    howYouWork: [
      {
        heading: "How the team operates",
        body: [
          "Four days a week in Delhi NCR or Bengaluru. Leadership is largely in Delhi.",
          "Weekly leadership meeting with a written pre-read; the CEO reads it.",
        ],
      },
      {
        heading: "How decisions get made",
        body: [
          "The CEO decides quickly and revisits rarely. Getting in front of a decision matters more here than appealing one.",
        ],
      },
    ],
    whatMatters: [
      "Speed is genuinely valued and genuinely costly, and the leadership team is now aware of the second part.",
      "The company is unusually honest internally about what is not working.",
      "Two of the six leadership roles are held by internal promotions.",
    ],
    couldTakeYouTo: [
      "Chief People Officer as the company grows — the CEO has been explicit that this is the intent, though nobody can promise it.",
      "A broader operating role. Two heads of people in this company's investor network have moved into COO positions.",
    ],
    consider: [
      "You are following two years of accumulated goodwill and inconsistency. Some of what you fix will feel, to long-tenured people, like something being taken away.",
      "Four days in office, and the leadership centre of gravity is Delhi. If you are Bengaluru-based, expect to travel.",
    ],
    process: [
      { step: "Conversation with TALYNT", detail: "60 minutes." },
      { step: "CEO", detail: "90 minutes, twice. The second one is the real one." },
      { step: "Leadership panel", detail: "Three functional leaders, separately." },
      { step: "Working session", detail: "You present how you would approach the first 90 days." },
      { step: "Decision", detail: "Within a week, with reasons." },
    ],
  },
  {
    slug: "security-engineer-platform",
    title: "Security Engineer, Platform",
    company: "Infrastructure company · 220 people",
    functionId: "security",
    bandId: "established",
    stageId: "series-b",
    workModelIds: ["remote", "hybrid"],
    locationIds: ["bengaluru", "hyderabad", "anywhere"],
    compensation: {
      low: 3200000,
      high: 4800000,
      currency: "INR",
      period: "year",
    },
    summary:
      "Security as an engineering problem, on a team that builds rather than audits.",
    teamSize: "4 in security, inside a platform org of 30",
    reportsTo: "Head of Platform",
    posted: "2026-09-20",
    valueIds: ["craft", "autonomy", "clarity", "mentorship"],
    directionIds: ["deeper", "change", "ownership"],
    skills: ["Cloud security", "IAM", "Threat modelling", "Go", "Kubernetes"],
    theRole: [
      "You would build the controls rather than write the policy: identity, secrets, workload isolation and the tooling that makes the safe path the easy one.",
      "You would be embedded with the platform team, reviewing designs before they are built rather than systems after they ship.",
    ],
    whyExists: [
      "Their customers are now large enough to send security questionnaires with real teeth, and the answers are currently assembled by hand.",
      "The team would rather build the controls that make the answers true than get better at writing the answers.",
    ],
    success: [
      {
        heading: "First 90 days",
        body: [
          "You have threat-modelled the two services that carry customer data and written it down.",
          "One control that engineers previously worked around has been replaced by one they use without noticing.",
        ],
      },
      {
        heading: "Six months",
        body: [
          "Secrets management is uniform across services.",
          "Security review is a step inside the design process, not a gate at the end of it.",
        ],
      },
      {
        heading: "A year",
        body: [
          "The questionnaires are answered from evidence the systems produce.",
        ],
      },
    ],
    lookingFor: {
      essential: [
        "You write code that other engineers run, not only scripts that you run.",
        "You understand cloud identity deeply enough to explain why a policy is wrong, not only that it is.",
        "You can push back on an engineering team without becoming the department of no.",
      ],
      helpful: [
        "Kubernetes and multi-tenant isolation experience.",
        "You have been on the receiving end of a real incident.",
      ],
      notRequired: [
        "Certifications. Nobody here will ask.",
        "Offensive security experience — useful, not the job.",
      ],
    },
    howYouWork: [
      {
        heading: "How the team operates",
        body: [
          "Remote-friendly with optional Bengaluru and Hyderabad offices; most of the team is remote.",
          "Security has no separate backlog — work goes through the platform team's planning.",
        ],
      },
      {
        heading: "How decisions get made",
        body: [
          "Security can block a launch. It has happened twice and both times were written up publicly inside the company.",
        ],
      },
    ],
    whatMatters: [
      "The safe path has to be the easy path or it will not be taken, and this team believes that rather than saying it.",
      "Incidents are reviewed without blame, and the write-ups are open to everyone.",
    ],
    couldTakeYouTo: [
      "Senior and then staff security engineering, which exists here as a track.",
      "Security architecture, or a platform engineering role — the boundary is thin on this team by design.",
    ],
    consider: [
      "Four people covering a 220-person company. You will have to choose what not to do, constantly.",
      "There is an on-call rotation for security incidents. It is quiet, and it is real.",
    ],
    process: [
      { step: "Conversation with TALYNT", detail: "45 minutes." },
      { step: "Head of Platform", detail: "45 minutes." },
      { step: "Technical conversation", detail: "A threat model on one of their real services." },
      { step: "Team conversation", detail: "Two platform engineers." },
      { step: "Decision", detail: "Within five working days." },
    ],
  },
  {
    slug: "design-lead-consumer",
    title: "Design Lead",
    company: "Health and wellbeing app · 45 people",
    functionId: "design",
    bandId: "lead",
    stageId: "series-a",
    workModelIds: ["remote", "hybrid"],
    locationIds: ["bengaluru", "mumbai", "anywhere"],
    compensation: {
      low: 4000000,
      high: 5500000,
      currency: "INR",
      period: "year",
      note: "Equity is meaningful at this stage and is explained honestly in conversation.",
    },
    summary:
      "Lead design at a company where design is the product, for users who did not ask to be there.",
    teamSize: "3 designers, growing to 5",
    reportsTo: "Co-founder",
    posted: "2026-09-08",
    valueIds: ["craft", "purpose", "autonomy", "impact"],
    directionIds: ["leading", "ownership", "deeper"],
    skills: ["Product design", "Design systems", "Research", "Accessibility"],
    theRole: [
      "You would lead a small design team and still design — roughly half your week on the work itself.",
      "You would own the design system, the research practice and the standard the team holds itself to.",
    ],
    whyExists: [
      "The founding designer is moving into a product role. The team has three good designers and no one setting the bar.",
      "The product is used by people managing a chronic condition. The consequences of a confusing interface here are not commercial.",
    ],
    success: [
      {
        heading: "First 90 days",
        body: [
          "You have run enough sessions with real users to have changed your mind about something.",
          "The team has a shared definition of done for design work.",
        ],
      },
      {
        heading: "Six months",
        body: [
          "The design system is a system rather than a library, and engineering uses it without asking.",
          "Accessibility is part of the review, not a remediation project.",
        ],
      },
      {
        heading: "A year",
        body: [
          "Two of the three designers are visibly better than when you arrived, and can say how.",
        ],
      },
    ],
    lookingFor: {
      essential: [
        "You have led designers and can describe how someone grew under you specifically.",
        "Your own craft is strong enough that the team would want your review.",
        "You take accessibility seriously as a design constraint rather than a compliance step.",
      ],
      helpful: [
        "Health, finance or any domain where a mistake in the interface has consequences.",
        "You have built a design system that survived its creator leaving.",
      ],
      notRequired: [
        "A management title. Several strong candidates for this role have never had one.",
      ],
    },
    howYouWork: [
      {
        heading: "How the team operates",
        body: [
          "Remote with a monthly in-person week in Bengaluru, paid for.",
          "Designers sit inside squads and meet as a craft group weekly.",
        ],
      },
      {
        heading: "How decisions get made",
        body: [
          "Design has genuine authority over the interface. Where it conflicts with a growth target, the founders decide, and they explain it.",
        ],
      },
    ],
    whatMatters: [
      "The team turns down growth tactics that would work. Not often, and not silently.",
      "Research is a habit, not an event.",
    ],
    couldTakeYouTo: [
      "Head of Design as the team grows past eight or so.",
      "A design systems or accessibility specialism, both of which are scarce and portable.",
    ],
    consider: [
      "Half management, half craft, which in practice means both feel under-resourced some weeks.",
      "Series A. The equity is meaningful and it is also equity.",
    ],
    process: [
      { step: "Conversation with TALYNT", detail: "45 minutes." },
      { step: "Portfolio conversation", detail: "90 minutes with the founding designer and a co-founder." },
      { step: "Team conversation", detail: "The three designers, without founders present." },
      { step: "Decision", detail: "Within a week." },
    ],
  },
  {
    slug: "enterprise-account-executive-emea",
    title: "Enterprise Account Executive, EMEA",
    company: "B2B SaaS · 180 people",
    functionId: "sales",
    bandId: "senior",
    stageId: "series-b",
    workModelIds: ["remote", "hybrid"],
    locationIds: ["london", "amsterdam", "berlin"],
    compensation: {
      low: 85000,
      high: 110000,
      currency: "GBP",
      period: "year",
      note: "Base of £85k–£110k with a 50/50 split. On-target earnings £170k–£220k.",
    },
    summary:
      "Sell a technical product to technical buyers in a market the company has proved but not yet built.",
    teamSize: "5 in EMEA, 22 globally",
    reportsTo: "VP Sales EMEA",
    posted: "2026-09-15",
    valueIds: ["autonomy", "clarity", "pace", "growth"],
    directionIds: ["ownership", "broader", "change"],
    skills: ["Enterprise sales", "Technical selling", "MEDDPICC", "Land and expand"],
    theRole: [
      "You would own a territory and a number, with the latitude to decide how you work it.",
      "Deals run six to nine months with three to six stakeholders, at least one of whom will be an engineer who has already formed an opinion.",
    ],
    whyExists: [
      "EMEA has gone from nothing to a quarter of revenue in eighteen months on four people. The pipeline now exceeds what four people can run properly.",
      "This is territory expansion, not backfill. The last person in a comparable seat was promoted.",
    ],
    success: [
      {
        heading: "First 90 days",
        body: [
          "You can demo the product yourself without a solutions engineer.",
          "Pipeline is built to roughly 2x, mostly self-sourced.",
        ],
      },
      {
        heading: "Six months",
        body: ["First closed-won deals in your territory, and a clear read on which segment converts."],
      },
      {
        heading: "A year",
        body: ["At or above quota, with a territory plan for the following year that you wrote."],
      },
    ],
    lookingFor: {
      essential: [
        "You have carried and hit an enterprise quota in a technical product category.",
        "You source your own pipeline. Marketing contributes roughly a third and that is not changing soon.",
        "You are comfortable being the least technical person in a room and still leading it.",
      ],
      helpful: [
        "Experience selling to engineering or platform buyers specifically.",
        "You have opened a territory rather than inherited one.",
      ],
      notRequired: [
        "Their exact category. Two of the strongest people on the team came from adjacent markets.",
      ],
    },
    howYouWork: [
      {
        heading: "How the team operates",
        body: [
          "Remote across EMEA, with a monthly team day in London.",
          "Weekly pipeline review that is genuinely a working session rather than an inspection.",
        ],
      },
      {
        heading: "How decisions get made",
        body: [
          "Discounting authority sits with the AE up to a threshold, which is unusually high here and is the thing most candidates check.",
        ],
      },
    ],
    whatMatters: [
      "Forecast honesty is the cultural line. Missing a number is survivable; a surprise is not.",
      "Nobody is measured on activity metrics.",
    ],
    couldTakeYouTo: [
      "A strategic or major-accounts seat, which exists here.",
      "Sales leadership — the EMEA VP was an AE at this company three years ago.",
    ],
    consider: [
      "The territory is genuinely new in parts. Two of the five countries have no reference customer yet.",
      "Long cycles. If you need monthly wins to stay motivated, this will be hard.",
    ],
    process: [
      { step: "Conversation with TALYNT", detail: "45 minutes." },
      { step: "VP Sales EMEA", detail: "60 minutes." },
      { step: "Demo and deal review", detail: "You present the product and walk a deal you actually ran." },
      { step: "Panel", detail: "A solutions engineer and a peer AE." },
      { step: "Decision", detail: "Within five working days." },
    ],
  },
  {
    slug: "engineering-manager-platform-india",
    title: "Engineering Manager, Platform",
    company: "Logistics technology · 900 people",
    functionId: "engineering",
    bandId: "head",
    stageId: "growth",
    workModelIds: ["hybrid"],
    locationIds: ["hyderabad", "bengaluru"],
    compensation: {
      low: 6500000,
      high: 9000000,
      currency: "INR",
      period: "year",
    },
    summary:
      "Manage two platform squads at a company where the platform is the reason the business works.",
    teamSize: "Two squads, 11 engineers",
    reportsTo: "Director of Engineering",
    posted: "2026-08-30",
    valueIds: ["clarity", "mentorship", "stability", "transparency"],
    directionIds: ["leading", "ownership"],
    skills: ["Engineering management", "Distributed systems", "Hiring", "Platform"],
    theRole: [
      "You would manage eleven engineers across two squads that own the services everything else in the company is built on.",
      "This is a people-first management role. You would not be expected to write production code, and you would be expected to read it.",
    ],
    whyExists: [
      "The two squads have been managed by a director carrying three other teams. It has worked and it has not scaled.",
      "Two engineers left in the last year citing a lack of direction rather than a lack of interest.",
    ],
    success: [
      {
        heading: "First 90 days",
        body: [
          "Every engineer has had a real conversation with you about where they are going.",
          "You can describe each squad's actual dependencies and where the company's risk sits.",
        ],
      },
      {
        heading: "Six months",
        body: [
          "Both squads have a roadmap they believe in and can explain to another team.",
          "Two open roles are filled well rather than quickly.",
        ],
      },
      {
        heading: "A year",
        body: [
          "Retention has stabilised, and at least one engineer has been promoted with a case you built.",
        ],
      },
    ],
    lookingFor: {
      essential: [
        "You have managed engineers for at least three years and can describe someone whose career changed because of you.",
        "You have a technical background deep enough to have earned the team's trust.",
        "You are good at hiring, and you can explain what good means to you.",
      ],
      helpful: [
        "Platform or infrastructure experience specifically — these teams build for other engineers.",
        "You have inherited a team in poor shape and turned it around.",
      ],
      notRequired: [
        "Current hands-on coding ability.",
        "Logistics domain knowledge.",
      ],
    },
    howYouWork: [
      {
        heading: "How the team operates",
        body: [
          "Three days a week in Hyderabad or Bengaluru.",
          "Managers run weekly one-to-ones and a monthly written team health review.",
        ],
      },
      {
        heading: "How decisions get made",
        body: [
          "Squads own their technical decisions; managers own scope, priority and people.",
        ],
      },
    ],
    whatMatters: [
      "Promotion cases are written, reviewed by a committee and shared with the person either way.",
      "The company has a real levelling framework and people can read their own.",
    ],
    couldTakeYouTo: [
      "Senior manager and then director — both exist and both have internal precedent.",
      "A head-of-platform role elsewhere, which this experience maps to directly.",
    ],
    consider: [
      "Two of the eleven engineers are, by the director's own account, in the wrong roles. That is the first hard conversation and it is waiting for you.",
      "A 900-person company has process. If you have only worked under 200, it will feel slow.",
    ],
    process: [
      { step: "Conversation with TALYNT", detail: "45 minutes." },
      { step: "Director of Engineering", detail: "60 minutes." },
      { step: "Management scenarios", detail: "Real situations from these squads, discussed openly." },
      { step: "Team conversation", detail: "Three engineers you would manage." },
      { step: "Decision", detail: "Within a week, with reasons." },
    ],
  },
];

export function roleBySlug(slug: string): Role | undefined {
  return ROLES.find((r) => r.slug === slug);
}

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

/** Compensation is always shown. Lakhs for INR, thousands elsewhere. */
export function formatCompensation(c: Role["compensation"]): string {
  const symbol = CURRENCY_SYMBOL[c.currency] ?? `${c.currency} `;
  if (c.currency === "INR") {
    const lakh = (n: number) => `${(n / 100000).toFixed(0)}L`;
    return `${symbol}${lakh(c.low)}–${lakh(c.high)}`;
  }
  const k = (n: number) => `${Math.round(n / 1000)}k`;
  return `${symbol}${k(c.low)}–${k(c.high)}`;
}
