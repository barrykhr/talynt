// Prompt construction ported from the existing outreach agent
// (outreach-agent/generate.js on branch claude/zealous-pascal-10etms):
// the three personalisation levels and their research guides are kept;
// the output contract is extended so every claim carries its own evidence.

import { slugFromLinkedIn, type ResearchInput, type ResearchLevel } from "./schema";

// Verbatim research/writing guidance from the agent (WhatsApp-specific
// phrasing generalised so the same guide serves email drafts).
const LEVEL_GUIDE: Record<ResearchLevel, string> = {
  market: `PERSONALISATION LEVEL: MARKET (the talent market for this role)
Research (web search) the hiring market for this exact role, in the given location if any, as of the last 6-12 months:
- Demand vs supply: is this role hard to hire? Signals: number of open postings, how long postings stay open, how many companies are competing for the same profile.
- Pay: salary range and direction (rising/flat), notable premiums for scarce skills in this role.
- Skills: which skills in this role are scarce or newly in demand (e.g. a specific stack, domain or certification).
- Who else is hiring this role right now (types of companies, or named companies if clearly reported).
- Typical time-to-hire or notice periods if reported (e.g. 60-90 day notice periods in India).
Message: lead with ONE sharp, sourced market insight about hiring this role (a number or trend), show you understand why it is hard, then how the sender helps fill it faster or better. Light company mention only (the company name and that they are hiring this role). This works even when little is known about the company.`,

  company: `PERSONALISATION LEVEL: COMPANY (their current talent and hiring challenges)
Research (web search, and the company website or LinkedIn company page if given) the company's current situation:
- About the company: what it does, industry, approximate size, headquarters and locations.
- Recent announcements and developments in the last 12 months: launches, partnerships, new offices or markets, leadership changes.
- Funding: reported rounds, amounts, dates and investors, only if a source reports them.
- Hiring activity: open roles, which functions, roles re-posted or open a long time, new locations. Public job postings show hiring activity, not completed hires.
- Likely challenges for THIS role at THIS company (label these as inferences).
Message: reference one or two specific, sourced facts about their current team or hiring, name the challenge this creates for the role, ask ONE short question about their current talent/hiring challenge, then how the sender helps.`,

  person: `PERSONALISATION LEVEL: PERSON (the hiring manager / recipient)
Research the recipient using the person details given (name, title, notes). LinkedIn profiles are usually blocked to automated tools: never try to access LinkedIn profiles; rely on the notes the user pasted plus public info (talks, articles, interviews, company team page, news quotes). Also do light company research for context.
- Their role and what they own (team, function), anything they have publicly said about hiring or their team.
- Their likely priority for this role (label as inference).
Message: address them by first name, reference one specific thing about them or their team (from the notes or public sources), connect it to the role and their likely priority, then how the sender helps. Never pretend familiarity you don't have.`,
};

function senderProfile(s: ResearchInput["sender"]) {
  return [
    `Name: ${s.name || "(not set)"}`,
    `Company: ${s.company || "(not set)"}`,
    `What we offer: ${s.pitch || "(not set)"}`,
    `Call to action: ${s.cta || "Open to a quick call this week?"}`,
  ].join("\n");
}

const OUTPUT_CONTRACT = `Return ONLY a JSON object, no prose before or after, with these keys:
{
  "about_brief": string (2-4 sentence "About this company" brief built only from sourced findings),
  "industry": string | null,
  "employee_range": string | null (e.g. "201-500", only if a source reports it),
  "outreach_angle": string (1-2 sentences: the angle you would take and why),
  "draft_subject": string | null (email subject line when the channel is email),
  "draft_message": string (the draft),
  "findings": [
    {
      "category": "about" | "profile" | "announcement" | "funding" | "hiring" | "expansion" | "leadership" | "market" | "other",
      "statement": string (one claim, plain language),
      "evidence_kind": "verified_fact" | "reported_claim" | "inference",
      "confidence": "high" | "medium" | "low",
      "source_url": string | null (the exact page you read that supports the statement),
      "source_title": string | null,
      "published_on": "YYYY-MM-DD" | null (publication date of the source if shown),
      "excerpt": string | null (a short quote or close paraphrase from that page supporting the statement),
      "conflict_note": string | null (mention conflicting or weak evidence here)
    }
  ],
  "warnings": string[] (e.g. "Little public information found", "Sources disagree on headcount")
}

Evidence rules (strict):
- "verified_fact": stated directly by an authoritative source you retrieved (the company's own site or filings, an official job board). Include source_url and excerpt.
- "reported_claim": reported by a third party (news, databases) you retrieved. Include source_url and excerpt.
- "inference": your own reasoning from the facts above. Never present it as fact. source_url may be null.
- Never invent URLs, numbers, names, dates, investors or clients. If you could not find something, leave it out or add a warning.
- If sources conflict or evidence is weak, say so in conflict_note and lower the confidence.
- Do not access or cite LinkedIn profile pages. Do not use private or paywalled data.
- 4 to 12 findings is typical; quality over quantity.`;

function messageRules(channel: ResearchInput["channel"]) {
  return channel === "whatsapp"
    ? `Message rules: WhatsApp style, plain text, 50 to 110 words, no headings, no bullet lists, no hashtags, at most one emoji (zero is fine).`
    : `Message rules: a short plain-text email, 80 to 150 words, no headings or bullet lists, with a specific subject line.`;
}

export function buildResearchSystem(input: ResearchInput): string {
  return `You research companies and draft short, personal outreach for a recruiting consultancy. A person reviews and edits every draft and sends it themselves; you never send anything.

Steps:
1. Work out the ROLE from the CRM input (use it exactly when given).
2. Identify the company from its name and website (and the LinkedIn company slug if given; do not rely on LinkedIn pages loading).
3. Research according to the level below. Keep it focused: a few good searches beat many.
4. Record each useful claim as a finding with its evidence.
5. Write the draft using only sourced findings and the CRM context provided.

${LEVEL_GUIDE[input.level]}

${messageRules(input.channel)}
All levels: everything must be about the ROLE; use the sender's offer to say concretely how they help; end with the sender's call to action and sign off with the sender's first name. Only use a number if a source supports it. Only address the recipient by name if the CRM gives it.

Sender profile:
${senderProfile(input.sender)}

${OUTPUT_CONTRACT}`;
}

export function buildResearchUserText(input: ResearchInput): string {
  const line = (label: string, v: string | null | undefined) => (v && v.trim() ? `${label}: ${v.trim()}` : null);
  const slug = slugFromLinkedIn(input.company.linkedinUrl);
  return [
    line("Company name", input.company.name),
    line("Company website", input.company.website),
    line("Company LinkedIn page", input.company.linkedinUrl),
    slug ? `(LinkedIn slug suggests the company is: ${slug})` : null,
    line("Company location", input.company.location),
    line("Role to write about", input.role),
    line("Role location", input.location),
    ...(input.contact ? [line("Recipient name", input.contact.name), line("Recipient title", input.contact.title), line("What we know about the recipient", input.contact.notes)] : []),
    line("CRM context", input.crmContext),
    input.conversations.length
      ? `Recent CRM-linked conversations (metadata only):\n${input.conversations.map((c) => `- ${c.date} ${c.channel}${c.direction ? ` (${c.direction})` : ""}: ${c.subject}`).join("\n")}`
      : null,
    `Draft channel: ${input.channel}`,
  ].filter((l): l is string => l !== null).join("\n");
}

/** Draft-only prompt: no web research, uses accepted facts only. */
export function buildDraftSystem(input: ResearchInput): string {
  return `You draft short, personal outreach for a recruiting consultancy. A person reviews, edits and sends it themselves.
Use ONLY the accepted facts and CRM context provided — do not add any other facts, numbers or names. If the facts are thin, keep the message general rather than guessing.

${LEVEL_GUIDE[input.level].split("\n").filter((l) => l.startsWith("Message:")).join("\n")}
${messageRules(input.channel)}
End with the sender's call to action and sign off with the sender's first name.

Sender profile:
${senderProfile(input.sender)}

Return ONLY a JSON object: {"draft_subject": string | null, "draft_message": string, "outreach_angle": string, "findings": [], "warnings": string[]}`;
}

export function buildDraftUserText(input: ResearchInput): string {
  const facts = (input.acceptedFacts ?? []).map((f) => `- ${f.statement}${f.source_url ? ` (source: ${f.source_url})` : ""}`).join("\n");
  return `${buildResearchUserText(input)}\n\nAccepted facts (reviewed by the team):\n${facts || "(none)"}`;
}
