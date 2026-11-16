// Research a role/company/person on the web and draft a personalised WhatsApp outreach message.
// Uses OpenAI if OPENAI_API_KEY is set in .env, otherwise Claude (ANTHROPIC_API_KEY).
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const MODEL = "claude-opus-5-5";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5";
let anthropic, openai;

export const LEVELS = ["market", "company", "person"];

function senderProfile(senderName) {
  return [
    `Name: ${senderName || process.env.SENDER_NAME || "(not set)"}`,
    `Company: ${process.env.SENDER_COMPANY || "(not set)"}`,
    `What we offer: ${process.env.SENDER_PITCH || "(not set)"}`,
    `Call to action: ${process.env.SENDER_CTA || "Open to a quick call this week?"}`,
  ].join("\n");
}

// What to research and how to write, per personalisation level.
const LEVEL_GUIDE = {
  market: `PERSONALISATION LEVEL: MARKET (the talent market for this role)
Research (web search) the hiring market for this exact role, in the given location if any, as of the last 6-12 months:
- Demand vs supply: is this role hard to hire? Signals: number of open postings, how long postings stay open, how many companies are competing for the same profile.
- Pay: salary range and direction (rising/flat), notable premiums for scarce skills in this role.
- Skills: which skills in this role are scarce or newly in demand (e.g. a specific stack, domain or certification).
- Who else is hiring this role right now (types of companies, or named companies if clearly reported).
- Typical time-to-hire or notice periods if reported (e.g. 60-90 day notice periods in India).
Message: lead with ONE sharp, sourced market insight about hiring this role (a number or trend), show you understand why it is hard, then how the sender helps fill it faster or better. Light company mention only (the company name and that they are hiring this role). This works even when little is known about the company.`,

  company: `PERSONALISATION LEVEL: COMPANY (their current talent and hiring challenges)
Research (web search, and the LinkedIn company page if given) the company's current talent situation:
- Current team: approximate headcount and growth, size/shape of the team this role sits in (e.g. engineering, sales), notable leaders.
- Hiring activity: how many open roles, which functions, roles that have been open a long time or re-posted, new offices/locations.
- Triggers that create hiring pressure: recent funding, launches, expansion, leadership changes, layoffs or attrition, a new market.
- Likely challenges for THIS role at THIS company: competing with bigger employers for the same profile, niche skills, scaling fast, location.
Message: reference one or two specific, true facts about their current team or hiring (e.g. "you've grown the engineering team fast since the Series B and have 12 tech roles open"), name the challenge this creates for the role, ask ONE short question about their current talent/hiring challenge (e.g. "is the bottleneck finding people with X, or getting them through notice period?"), then how the sender helps.`,

  person: `PERSONALISATION LEVEL: PERSON (the hiring manager / recipient)
Research the recipient using the person details given (name, title, notes, profile link). LinkedIn profiles are usually blocked to automated tools, so rely on the notes the user pasted, plus web search for public info (talks, articles, interviews, company team page, news quotes). Also do light company research for context.
- Their role and what they own (team, function), their background (previous companies, domain), anything they have publicly said about hiring or their team.
- Their likely priority for this role (e.g. a VP Eng scaling a platform team cares about senior ICs who can own systems).
Message: address them by first name, reference one specific thing about them or their team (from the notes or public sources), connect it to the role and their likely priority, then how the sender helps. Never pretend familiarity you don't have.`,
};

function buildSystem(level, senderName) {
  return `You write short, personal cold-outreach messages sent over WhatsApp to hiring decision-makers, one at a time, after the sender reviews them.

Steps:
1. Work out the ROLE. If the user entered a role, use it exactly. Otherwise read the source message (usually a job post shared on WhatsApp) and extract the main role (list any others). Note the seniority, key skills and location if given.
2. Identify the company: from the company name, or the LinkedIn company link (if the page doesn't load, the slug in linkedin.com/company/<slug> names the company), or the source message.
3. Research according to the level below. Keep it focused: a few good searches beat many.
4. Write the message.

${LEVEL_GUIDE[level]}

Message rules (all levels):
- Everything must be about the ROLE: name it, and show you understand what makes it hard or important.
- WhatsApp style: plain text, 50 to 110 words, no headings, no bullet lists, no hashtags, at most one emoji (zero is fine).
- Use the sender's offer below to say concretely how they help with this role. End with the sender's call to action and sign off with the sender's first name.
- Never invent facts, numbers, names or clients. Only use a number if a source supports it. If research found little, say less rather than guess.
- Only address the recipient by name if the user or the source message gives it.

Sender profile:
${senderProfile(senderName)}

Return ONLY a JSON object, no prose before or after, with these keys:
{"role": string, "other_roles": string[], "company": string, "research_points": string[] (3 to 5 short findings you used, each with its key fact), "sources": string[] (URLs you relied on), "message": string (the WhatsApp message)}`;
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return JSON");
  return JSON.parse(text.slice(start, end + 1));
}

export function slugFromLinkedIn(url) {
  const m = String(url || "").match(/linkedin\.com\/(?:company|school|showcase)\/([^/?#]+)/i);
  return m ? decodeURIComponent(m[1]).replace(/[-_]+/g, " ").trim() : "";
}

export async function generateOutreach(input) {
  const {
    level = "company", senderName, role, location, sourceMessage, companyName, linkedinUrl, notes,
    personName, personTitle, personUrl, personNotes,
  } = input;
  const slug = slugFromLinkedIn(linkedinUrl);
  const line = (label, v) => (v && String(v).trim() ? `${label}: ${String(v).trim()}` : null);
  const userText = [
    line("Role to write about", role),
    line("Location", location),
    line("Company name", companyName),
    line("Company LinkedIn page", linkedinUrl),
    slug ? `(LinkedIn slug suggests the company is: ${slug})` : null,
    ...(level === "person"
      ? [
          line("Recipient name", personName),
          line("Recipient title", personTitle),
          line("Recipient profile link", personUrl),
          line("What I know about the recipient", personNotes),
        ]
      : []),
    line("Extra notes from me", notes),
    "",
    "Source message:",
    "<<<",
    sourceMessage?.trim() || "(none given; use the role entered above)",
    ">>>",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const system = buildSystem(LEVELS.includes(level) ? level : "company", String(senderName || "").trim().slice(0, 60));
  const result = process.env.OPENAI_API_KEY
    ? await draftWithOpenAI(system, userText)
    : await draftWithClaude(system, userText);
  return {
    role: result.role || role || "",
    otherRoles: result.other_roles || [],
    company: result.company || companyName || "",
    researchPoints: result.research_points || [],
    sources: result.sources || [],
    message: result.message || "",
  };
}

async function draftWithOpenAI(system, userText) {
  openai ??= new OpenAI();
  const response = await openai.responses.create({
    model: OPENAI_MODEL,
    instructions: system,
    input: userText,
    tools: [{ type: "web_search" }],
  });
  return extractJson(response.output_text);
}

async function draftWithClaude(system, userText) {
  anthropic ??= new Anthropic();
  const messages = [{ role: "user", content: userText }];

  // Server-side web search can pause long turns; resume up to a few times.
  for (let i = 0; i < 5; i++) {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium" },
      // If a safety classifier declines, retry on a suitable fallback model in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      tools: [
        { type: "web_search_20260209", name: "web_search", max_uses: 6 },
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: 3 },
      ],
      messages,
    });

    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }
    if (response.stop_reason === "refusal") {
      throw new Error("The model declined this request. Try rephrasing the notes.");
    }

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    return extractJson(text);
  }
  throw new Error("Research took too many steps; try again.");
}
