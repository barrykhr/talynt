import type { AssessmentDefinition, Competency, Grounding, Question, QuestionKind } from "./types";

/**
 * PROPOSED — every word in this file is new content awaiting TALYNT review.
 *
 * One definition per role. Each competency is drawn from one of the role's
 * essential requirements (see `from`), and each has two equivalent questions —
 * one about the candidate's own experience, one scenario — so the generator
 * can offer whichever suits the person without changing what is assessed.
 *
 * Rules every question here follows, and lib/assessment/validate.ts checks:
 * - it asks about the role's requirements, never about the person's background
 *   for its own sake, and never about protected characteristics;
 * - it never asks for confidential information from a current or past employer;
 * - it needs no paid tool, no live coding environment, and no time limit;
 * - "what a useful answer covers" is shown before the candidate writes.
 *
 * `writtenFor` is the role's requirements version at the time of writing. If
 * the role changes, the definition stops being served until it is re-checked
 * and `writtenFor` updated — see requirementsVersion().
 */

const LONG: Question["response"] = { format: "text", suggestedWords: [100, 250], maxWords: 400 };
const SHORT: Question["response"] = { format: "text", suggestedWords: [60, 180], maxWords: 300 };

const c = (id: string, label: string, meaning: string, from: Grounding[], cues: string[]): Competency => ({
  id,
  label,
  meaning,
  from,
  cues,
});

const q = (
  id: string,
  kind: QuestionKind,
  competencyIds: string[],
  prompt: string,
  guidance: string[],
  response: Question["response"] = LONG,
): Question => ({ id, kind, competencyIds, prompt, guidance, response });

const E = (index: number): Grounding => ({ kind: "essential", index });
const S = (skill: string): Grounding => ({ kind: "skill", skill });

export const DEFINITIONS: AssessmentDefinition[] = [
  /* ---------------------------------------------------------------------- */
  {
    roleSlug: "senior-full-stack-engineer-b2b-platform",
    writtenFor: "req-7f26ab4b",
    revision: 1,
    status: "proposed",
    competencies: [
      c("change", "Changing a live system safely", "Changing a production system people depend on without taking it down — and living with what you chose.", [E(0)], ["production", "migration", "migrate", "rewrite", "refactor", "uptime", "incident", "legacy", "rollout", "platform"]),
      c("stack", "Working across the stack", "Moving between interface, API and data without stalling at either end.", [E(1), S("TypeScript"), S("React"), S("Node"), S("Postgres")], ["react", "typescript", "node", "postgres", "frontend", "front end", "backend", "back end", "api", "database", "full stack", "aws"]),
      c("explain", "Explaining and revising decisions", "Making a technical decision clear to someone outside it, and changing course when their challenge is good.", [E(2)], ["stakeholder", "product", "review", "rfc", "proposal", "architecture", "decision", "mentor"]),
    ],
    questions: [
      q("fs.change.exp", "experience", ["change"], "Tell us about a production system you changed significantly while people kept depending on it. What had to change, how did you keep it running during the change, and what did you live with afterwards?", ["The system, and why it had to change", "How you managed the risk while it stayed up", "What you would do differently now"]),
      q("fs.change.fn", "functional", ["change"], "You take over a product surface that carries live customer traffic. It was built quickly by people who have since moved on, and its data model now needs to change. Walk us through how you would approach your first two weeks with it.", ["How you would learn the system before changing it", "How you would sequence the change and keep it reversible", "What you would measure to know it was going well"]),
      q("fs.stack.exp", "experience", ["stack"], "Describe one change you shipped that touched more than one layer — interface, API and data. Where were you strongest, and where did you have to work to keep up?", ["The change, and the layers it touched", "Which part came easily and which did not", "How you got unstuck in the harder part"]),
      q("fs.stack.fn", "functional", ["stack"], "A page in the product has become slow, and nobody knows whether the cause is in the browser, the API or the database. How would you find out, and in what order?", ["Where you would look first, and why there", "How you would confirm the cause rather than guess it", "How you would decide what to fix first"]),
      q("fs.explain.exp", "experience", ["explain"], "Tell us about a technical decision you had to explain to someone who did not share your context — a product manager, a founder, a customer. Did their pushback change anything?", ["The decision, in the terms you used with them", "What they challenged", "Whether, and how, it changed your view"]),
      q("fs.explain.scn", "scenario", ["explain"], "Your product manager wants a feature shipped this quarter. You think the data model has to change first, or the feature will be fragile. Write the short message you would send them.", ["The trade-off, in plain terms", "What you would propose instead, or alongside", "What would change your mind"], SHORT),
    ],
    rubric: [
      { competencyId: "change", signals: ["Names a real system and what had to change in it", "Explains how risk was managed while it stayed up — sequencing, reversibility, monitoring", "Owns the consequences, including what they would now do differently"] },
      { competencyId: "stack", signals: ["Traces one change through more than one layer", "Is candid about which end is stronger", "Shows a method for getting unstuck rather than avoiding the weaker area"] },
      { competencyId: "explain", signals: ["Explains the decision without jargon", "Represents the other person's view fairly", "Describes changing, or holding, a position for stated reasons"] },
    ],
  },

  /* ---------------------------------------------------------------------- */
  {
    roleSlug: "staff-data-engineer-fintech",
    writtenFor: "req-6d8fa79c",
    revision: 1,
    status: "proposed",
    competencies: [
      c("infrastructure", "Data infrastructure others depend on", "Building pipelines and platforms other teams rely on, and owning what happens when they break.", [E(0), S("Spark"), S("Kafka"), S("dbt"), S("Snowflake")], ["pipeline", "platform", "warehouse", "kafka", "spark", "dbt", "snowflake", "airflow", "streaming", "data platform", "etl"]),
      c("correctness", "Correctness and data quality", "Treating a nearly-right number as wrong: reconciliation, tests and traceability.", [E(1)], ["reconciliation", "data quality", "quality", "testing", "validation", "lineage", "audit", "accuracy", "reporting", "regulatory"]),
      c("position", "Holding a technical position across functions", "Making and keeping a technical case with compliance, finance and engineering in the same room.", [E(2)], ["compliance", "finance", "regulatory", "stakeholder", "governance", "risk", "audit", "legal"]),
    ],
    questions: [
      q("de.infrastructure.exp", "experience", ["infrastructure"], "Tell us about data infrastructure you built that other engineers or teams came to depend on. What did they rely on it for, and what happened the first time it let them down?", ["Who depended on it, and for what", "A failure or limit, and how you responded", "A design choice you made for its users rather than for yourself"]),
      q("de.infrastructure.fn", "functional", ["infrastructure"], "Three teams have each built their own pipeline for the same transactions data, and their numbers disagree. Outline how you would move them onto one shared pipeline without breaking the reports that depend on the old ones.", ["How you would establish which numbers are right", "How you would migrate consumers without a big-bang cut-over", "How you would know an old pipeline was safe to remove"]),
      q("de.correctness.exp", "experience", ["correctness"], "Describe a time a number was nearly right and that was a problem. How was the discrepancy found, and what did you change so it could not happen quietly again?", ["The number, and why nearly right was wrong", "How the discrepancy was found and traced", "What you changed so it would surface next time"]),
      q("de.correctness.fn", "functional", ["correctness"], "A regulatory report's total differs from the finance team's total for the same period by 0.3%. Walk us through how you would find where the difference comes from.", ["Where you would start, and why", "How you would narrow it down step by step", "How you would confirm the fix and prevent a repeat"]),
      q("de.position.exp", "experience", ["position"], "Tell us about a time you held a technical position with people from compliance, finance or another non-engineering function in the room. What was the disagreement, and how did it end?", ["What each side needed", "How you made the technical case understandable", "Where you held firm and where you moved"]),
      q("de.position.scn", "scenario", ["position"], "Compliance asks for a change to a data retention rule that would make two existing pipelines much harder to run. Write how you would respond in the meeting.", ["What you would want to understand about the requirement first", "The options and their costs, in terms each function cares about", "What you would recommend"], SHORT),
    ],
    rubric: [
      { competencyId: "infrastructure", signals: ["Describes consumers and what they relied on", "Owns a failure and the response to it", "Shows design decisions taken for the people downstream"] },
      { competencyId: "correctness", signals: ["Checks correctness rather than assuming it", "Can trace a figure back to its source", "Puts something in place so discrepancies surface, not just a one-off fix"] },
      { competencyId: "position", signals: ["Understands the other functions' constraints", "Frames the technical case in their terms", "Holds or adjusts a position for stated reasons"] },
    ],
  },

  /* ---------------------------------------------------------------------- */
  {
    roleSlug: "product-manager-developer-tools",
    writtenFor: "req-2015c1e4",
    revision: 1,
    status: "proposed",
    competencies: [
      c("technical-audience", "Building for a technical audience", "Knowing what is different about building for developers — and acting on it.", [E(0), S("Developer tools"), S("API design")], ["developer", "developers", "api", "sdk", "devtools", "developer tools", "platform", "technical", "open source"]),
      c("discovery", "Doing your own discovery", "Finding, talking to and learning from users yourself, without a research team to hand it to.", [E(1), S("Discovery")], ["discovery", "interview", "interviews", "research", "users", "churn", "customer", "feedback"]),
      c("evidence", "Following the evidence", "Being the person who says the data does not support the thing everyone wants to build.", [E(2)], ["data", "metrics", "retention", "experiment", "analysis", "evidence", "prioritisation", "prioritization"]),
    ],
    questions: [
      q("pm.technical-audience.exp", "experience", ["technical-audience"], "Tell us about a product or feature you built for developers or another technical audience. What did building for them teach you that building for anyone else would not have?", ["The product and who it was for", "Something that was different about this audience", "A decision you made because of it"]),
      q("pm.technical-audience.scn", "scenario", ["technical-audience"], "Developers are signing up for the product and leaving in their third week. Before talking to anyone, what are the first three things you would want to know, and why?", ["The three questions", "Why each one matters", "Where you would look for the answers"]),
      q("pm.discovery.exp", "experience", ["discovery"], "Describe a discovery effort you ran yourself — who you spoke to, how you found them, and what changed because of it.", ["Who you spoke to, and how you reached them", "What you learned that you did not expect", "What changed as a result"]),
      q("pm.discovery.scn", "scenario", ["discovery"], "You have two weeks and no research team. Describe how you would find and talk to developers who have stopped using the product.", ["How you would find them and get them to talk", "What you would ask, and what you would avoid asking", "How you would share what you heard with the team"]),
      q("pm.evidence.exp", "experience", ["evidence"], "Tell us about a time the evidence did not support something people wanted to build. What did it say, and how did you handle the conversation?", ["What people wanted, and why", "What the evidence showed", "How the conversation went, and what was decided"]),
      q("pm.evidence.scn", "scenario", ["evidence"], "The team is excited about a feature that most of your user interviews suggest will not change retention. Write the short note you would send to the squad and your CPO.", ["What you heard, stated fairly", "What you recommend instead", "What evidence would change your view"], SHORT),
    ],
    rubric: [
      { competencyId: "technical-audience", signals: ["Names what is specific about technical users", "Connects that to a product decision", "Avoids generic product language"] },
      { competencyId: "discovery", signals: ["Describes a method they ran themselves", "Reports what surprised them", "Shows how findings changed the work"] },
      { competencyId: "evidence", signals: ["States the evidence and its limits accurately", "Handles disagreement without dismissing it", "Proposes a path, not only a no"] },
    ],
  },

  /* ---------------------------------------------------------------------- */
  {
    roleSlug: "head-of-people-scaling-org",
    writtenFor: "req-21438cb1",
    revision: 1,
    status: "proposed",
    competencies: [
      c("building", "Building a people function through growth", "Putting a people function in place while the company doubles — choosing what to build first.", [E(0), S("Org design"), S("Hiring systems")], ["people", "hr", "talent", "hiring", "org design", "scale", "scaling", "growth", "headcount", "people operations"]),
      c("commercial", "Commercial credibility", "Making people decisions in the commercial terms a leadership team uses.", [E(1), S("Compensation")], ["compensation", "budget", "cost", "revenue", "commercial", "leadership", "board", "planning", "finance"]),
      c("candour", "Candour with leadership", "Telling a founder something unwelcome and keeping the relationship.", [E(2)], ["founder", "ceo", "leadership", "feedback", "difficult", "coach", "executive"]),
    ],
    questions: [
      q("hp.building.exp", "experience", ["building"], "Tell us about a people function you built while the company roughly doubled. What did you put in place first, what did you leave until later, and why?", ["The starting point and the growth", "What you built first, and why that", "What you deliberately left for later"]),
      q("hp.building.scn", "scenario", ["building"], "A company of 300 is hiring in every function, and each function hires differently. Outline what you would standardise in your first quarter, and what you would deliberately leave alone.", ["What you would standardise first", "What you would leave alone, and why", "How you would know it was working"]),
      q("hp.commercial.exp", "experience", ["commercial"], "Describe a people decision you made or shaped where the case was commercial — cost, revenue or risk — rather than only a people case.", ["The decision", "The commercial case, and how you made it", "What happened"]),
      q("hp.commercial.scn", "scenario", ["commercial"], "The leadership team wants to freeze hiring to protect runway, but two teams are close to losing key people. How would you frame the options for them?", ["The options as you see them", "The costs and risks of each, in commercial terms", "Your recommendation"]),
      q("hp.candour.exp", "experience", ["candour"], "Tell us about a time you told a founder or CEO something they did not want to hear. How did you raise it, and what happened to the relationship?", ["What you needed to say, and why", "How you chose to raise it", "What happened afterwards"]),
      q("hp.candour.scn", "scenario", ["candour"], "A founder wants to promote a strong individual performer into management. You think it would be a mistake. Write how you would raise it with them.", ["What you would say, and how", "What you would offer as an alternative", "How you would keep the relationship"], SHORT),
    ],
    rubric: [
      { competencyId: "building", signals: ["Sequences the work deliberately", "Explains what was left for later and why", "Links what was built to the company's stage"] },
      { competencyId: "commercial", signals: ["Frames people decisions in commercial terms", "Quantifies or bounds costs and risks where possible", "Makes a recommendation rather than listing options"] },
      { competencyId: "candour", signals: ["Raises a difficult point directly", "Shows judgement about timing and framing", "Describes the relationship surviving the conversation"] },
    ],
  },

  /* ---------------------------------------------------------------------- */
  {
    roleSlug: "security-engineer-platform",
    writtenFor: "req-ac7b10d0",
    revision: 1,
    status: "proposed",
    competencies: [
      c("security-code", "Security code other engineers run", "Writing security tooling and controls that other engineers use rather than work around.", [E(0), S("Go")], ["tooling", "automation", "go", "golang", "ci", "pipeline", "library", "control", "secrets"]),
      c("identity", "Cloud identity and access", "Understanding cloud identity well enough to explain why a policy is wrong, not only that it is.", [E(1), S("IAM"), S("Cloud security")], ["iam", "identity", "access", "policy", "permissions", "least privilege", "cloud", "aws", "gcp", "azure", "kubernetes", "rbac"]),
      c("pushback", "Pushing back usefully", "Challenging an engineering team's plan without becoming the department of no.", [E(2), S("Threat modelling")], ["threat model", "threat modelling", "design review", "review", "risk", "engineering teams", "security review"]),
    ],
    questions: [
      q("se.security-code.exp", "experience", ["security-code"], "Tell us about security tooling or code you wrote that other engineers ran as part of their own work. How did you get them to use it rather than work around it?", ["What it did, and who ran it", "Why engineers might have avoided it", "What you did so they did not"]),
      q("se.security-code.fn", "functional", ["security-code"], "Engineers keep putting secrets in environment files because the official route is slow. Describe what you would build or change so the safe route becomes the easy one.", ["Why the current route is being avoided", "What you would build or change", "How you would know engineers had switched"]),
      q("se.identity.exp", "experience", ["identity"], "Describe an access policy or identity set-up you found was wrong. What was wrong with it, how did you explain why, and what did you change?", ["What was wrong, specifically", "How you explained it to the people who owned it", "What you changed, and how you checked it"]),
      q("se.identity.fn", "functional", ["identity"], "A service account used by a deployment pipeline has broad permissions across several cloud accounts. Walk us through how you would narrow it without breaking deploys.", ["How you would find out what it actually uses", "How you would tighten it in safe steps", "How you would catch a break before it reached production"]),
      q("se.pushback.exp", "experience", ["pushback"], "Tell us about a time you pushed back on an engineering team's plan for security reasons. What did you ask for, and what did you agree to instead?", ["The plan and the risk you saw", "What you asked for", "The compromise, and why it was acceptable"]),
      q("se.pushback.scn", "scenario", ["pushback"], "A team needs to ship a customer-facing feature this week, and its design stores more customer data than it needs. Write how you would respond in their design review.", ["The risk, in terms the team cares about", "What you would ask them to change now", "What could reasonably wait"], SHORT),
    ],
    rubric: [
      { competencyId: "security-code", signals: ["Built something other engineers ran", "Understands why controls get worked around", "Designs for adoption, and checks that it happened"] },
      { competencyId: "identity", signals: ["Explains precisely why a policy was wrong", "Narrows access in safe, verifiable steps", "Communicates the change to the owners"] },
      { competencyId: "pushback", signals: ["Frames risk in the team's terms", "Separates what must change now from what can wait", "Reaches an agreement rather than a veto"] },
    ],
  },

  /* ---------------------------------------------------------------------- */
  {
    roleSlug: "design-lead-consumer",
    writtenFor: "req-57b2ca5e",
    revision: 1,
    status: "proposed",
    competencies: [
      c("growing", "Growing designers", "Helping designers grow — and being able to say how one did, specifically.", [E(0)], ["lead", "led", "manager", "mentor", "mentored", "team", "coaching", "designers"]),
      c("craft", "Design craft", "Craft strong enough that the team would want your review.", [E(1), S("Product design"), S("Design systems")], ["design", "product design", "interaction", "prototype", "design system", "ux", "ui", "visual"]),
      c("accessibility", "Accessibility as a design constraint", "Treating accessibility as part of the design, not a compliance step at the end.", [E(2), S("Accessibility")], ["accessibility", "a11y", "wcag", "inclusive", "screen reader", "contrast"]),
    ],
    questions: [
      q("dl.growing.exp", "experience", ["growing"], "Tell us about a designer who grew while working with you. What did they find hard, what did you do, and how could you tell it was working?", ["The designer and what they found hard", "What you did, specifically", "How you knew it was working"]),
      q("dl.growing.scn", "scenario", ["growing"], "Three designers each solve similar problems in different ways, and engineering has noticed. How would you start building a shared standard without flattening their judgement?", ["Where you would start", "What you would standardise, and what you would not", "How you would bring the designers into it"]),
      q("dl.craft.exp", "experience", ["craft"], "Describe a piece of your own design work you are proud of. What was the hardest decision in it, and what did you reject along the way?", ["The problem and your part in it", "The hardest decision", "What you rejected, and why"]),
      q("dl.craft.scn", "scenario", ["craft"], "A sign-up flow is losing people at the identity check step. Describe how you would approach redesigning it, from what you would look at first to how you would know it worked.", ["What you would look at first", "How you would explore options", "How you would know the redesign worked"]),
      q("dl.accessibility.exp", "experience", ["accessibility"], "Tell us about a time accessibility changed a design decision you or your team made — not an audit finding fixed afterwards.", ["The decision", "How accessibility changed it", "What the result was for everyone using it"]),
      q("dl.accessibility.scn", "scenario", ["accessibility"], "A designer on your team presents a polished screen that relies on colour alone to show errors. What would you say in the review, and what would you ask for?", ["What you would say, and how", "What you would ask them to change", "How you would make this less likely next time"], SHORT),
    ],
    rubric: [
      { competencyId: "growing", signals: ["Describes one person's growth specifically", "Names what they did to support it", "Shows how progress was recognised"] },
      { competencyId: "craft", signals: ["Articulates a hard design decision", "Explains rejected alternatives", "Connects craft choices to outcomes"] },
      { competencyId: "accessibility", signals: ["Treats accessibility as a design input", "Gives a concrete example of it changing a decision", "Addresses it through process, not only fixes"] },
    ],
  },

  /* ---------------------------------------------------------------------- */
  {
    roleSlug: "enterprise-account-executive-emea",
    writtenFor: "req-1a839494",
    revision: 1,
    status: "proposed",
    competencies: [
      c("enterprise", "Enterprise selling against a quota", "Running complex enterprise deals in a technical category to a close.", [E(0), S("Enterprise sales"), S("MEDDPICC")], ["enterprise", "quota", "closed", "deal", "deals", "account executive", "sales", "meddpicc", "forecast"]),
      c("pipeline", "Building your own pipeline", "Sourcing most of your own pipeline, not waiting for marketing to supply it.", [E(1), S("Land and expand")], ["pipeline", "prospecting", "outbound", "territory", "sourcing", "sdr", "new logo", "land and expand"]),
      c("technical-rooms", "Leading technical conversations", "Leading a room in which you are the least technical person.", [E(2), S("Technical selling")], ["technical", "solutions engineer", "engineering", "platform", "demo", "evaluation", "proof of concept", "poc"]),
    ],
    questions: [
      q("ae.enterprise.exp", "experience", ["enterprise"], "Tell us about an enterprise deal in a technical category that you ran from first conversation to close. Who was involved, what nearly stopped it, and what did you do?", ["The deal's shape — size, buyers, length", "What nearly stopped it", "What you did that made the difference"]),
      q("ae.enterprise.scn", "scenario", ["enterprise"], "A deal you forecast to close this quarter has gone quiet after a positive technical evaluation. Walk us through what you would do over the next two weeks.", ["How you would find out what changed", "Who you would contact, and how", "How you would update your forecast"]),
      q("ae.pipeline.exp", "experience", ["pipeline"], "Describe how you built pipeline the last time marketing gave you only a small part of what you needed. What worked, and what did you stop doing?", ["Where your pipeline came from", "What worked", "What you stopped doing, and why"]),
      q("ae.pipeline.scn", "scenario", ["pipeline"], "You are opening a territory with no existing customers. Outline your first month of prospecting: who you would target first, and why.", ["Who you would target first", "How you would reach them", "How you would judge the month"]),
      q("ae.technical-rooms.exp", "experience", ["technical-rooms"], "Tell us about a meeting where you were the least technical person in the room and still led it. How did you prepare, and what did you do when a question went beyond you?", ["The meeting and who was there", "How you prepared", "What you did when you were out of your depth"]),
      q("ae.technical-rooms.scn", "scenario", ["technical-rooms"], "In a discovery call, a platform engineering lead says your product duplicates something their team built in-house. How would you respond?", ["What you would want to understand first", "How you would respond", "How you would move the conversation forward"], SHORT),
    ],
    rubric: [
      { competencyId: "enterprise", signals: ["Describes deal complexity and stakeholders", "Identifies a real risk and the response to it", "Shows forecasting discipline"] },
      { competencyId: "pipeline", signals: ["Self-sourced pipeline with a method", "Learns from what did not work", "Targets deliberately rather than broadly"] },
      { competencyId: "technical-rooms", signals: ["Prepares to lead without pretending expertise", "Uses technical colleagues well", "Keeps control of the conversation's direction"] },
    ],
  },

  /* ---------------------------------------------------------------------- */
  {
    roleSlug: "engineering-manager-platform-india",
    writtenFor: "req-e1f0136e",
    revision: 1,
    status: "proposed",
    competencies: [
      c("developing", "Developing engineers", "Managing engineers so that careers change — and being able to say how.", [E(0), S("Engineering management")], ["manager", "managed", "management", "mentor", "career", "promotion", "1:1", "one-to-one", "team lead"]),
      c("credibility", "Technical credibility", "A technical background deep enough to earn a platform team's trust.", [E(1), S("Distributed systems"), S("Platform")], ["distributed", "platform", "infrastructure", "architecture", "systems", "backend", "kubernetes", "services"]),
      c("hiring", "Hiring well", "Hiring well, and being able to explain what good means.", [E(2), S("Hiring")], ["hiring", "interview", "interviewing", "recruiting", "hire", "hired", "onboarding"]),
    ],
    questions: [
      q("em.developing.exp", "experience", ["developing"], "Tell us about an engineer whose career changed while you managed them. What did you see, what did you do, and what did they do?", ["What you noticed", "What you did, specifically", "What they did, and what changed"]),
      q("em.developing.scn", "scenario", ["developing"], "A strong senior engineer on your team has gone quiet in planning, and their reviews have become short. How would you approach it?", ["What you would want to understand", "How you would start the conversation", "What you would do with what you learned"]),
      q("em.credibility.exp", "experience", ["credibility"], "Describe a technical decision on your team where your own background made a difference to the outcome — and one where you deferred to the team.", ["The decision where you contributed", "The decision where you deferred", "How you judged which was which"]),
      q("em.credibility.scn", "scenario", ["credibility"], "Two squads disagree about whether to build a shared internal service or keep separate implementations. How would you help them decide?", ["What you would want each squad to show", "The criteria you would use", "How you would close the decision"]),
      q("em.hiring.exp", "experience", ["hiring"], "Tell us how you hire. What does a good hire mean to you, and how does your process find it?", ["What good means to you", "How your process tests for it", "A hire that taught you something"]),
      q("em.hiring.scn", "scenario", ["hiring"], "You have two open roles and pressure to fill them this month. A candidate is technically strong, but you have doubts about how they treat people. What do you do?", ["How you would test your doubt", "How you would weigh it against the pressure", "What you would decide, and how you would explain it"], SHORT),
    ],
    rubric: [
      { competencyId: "developing", signals: ["Describes one engineer's change specifically", "Names their own actions", "Credits the engineer's part"] },
      { competencyId: "credibility", signals: ["Shows real technical depth in a decision", "Knows when to defer", "Explains how they judge that line"] },
      { competencyId: "hiring", signals: ["Can say what good means", "Has a process that tests for it", "Holds the bar under pressure"] },
    ],
  },
];

export function definitionFor(roleSlug: string): AssessmentDefinition | undefined {
  return DEFINITIONS.find((d) => d.roleSlug === roleSlug);
}
