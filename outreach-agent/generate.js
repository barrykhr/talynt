// Research a company on the web and draft a personalised WhatsApp outreach message.
// Uses OpenAI if OPENAI_API_KEY is set in .env, otherwise Claude (ANTHROPIC_API_KEY).
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const MODEL = "claude-opus-5-5";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5";
let anthropic, openai;

function senderProfile() {
  return [
    `Name: ${process.env.SENDER_NAME || "(not set)"}`,
    `Company: ${process.env.SENDER_COMPANY || "(not set)"}`,
    `What we offer: ${process.env.SENDER_PITCH || "(not set)"}`,
    `Call to action: ${process.env.SENDER_CTA || "Open to a quick call this week?"}`,
  ].join("\n");
}

const SYSTEM = `You write short, personal cold-outreach messages that are sent over WhatsApp, one person at a time, after the sender reviews them.

Process:
1. Read the source message (usually a job post or hiring announcement shared in a WhatsApp chat). Work out the role being hired for. If several roles appear, pick the main one and list the others.
2. Research the company the user names: what it does, size/stage, recent news (funding, launches, expansion), and any signal about why it is hiring this role. If the user gives a LinkedIn company page link, try to open it first; LinkedIn often blocks automated access, so if it does not load, use the company slug in the link (linkedin.com/company/<slug>) to identify the company and research it with web search (its website, news, funding). If no company name is given, take it from the LinkedIn link or the source message. Keep research focused: a few searches are enough.
3. Write the outreach message from the sender to the hiring contact.

Message rules:
- WhatsApp style: plain text, 50 to 110 words, no headings, no bullet lists, no hashtags, at most one emoji (zero is fine).
- Open with one specific, true detail about the company from your research (not generic praise).
- Name the role and connect it to exactly how the sender can help, using the sender's offer below. Be concrete.
- End with the sender's call to action and sign off with the sender's first name.
- Never invent facts, numbers, clients or names. If research found little, keep the company detail modest rather than guessing.
- Do not address the recipient by name unless the source message gives it.

Sender profile:
${senderProfile()}

Return ONLY a JSON object, no prose before or after, with these keys:
{"role": string, "other_roles": string[], "company_summary": string (2-4 sentences of what you found, with the key facts), "sources": string[] (URLs you relied on), "message": string (the WhatsApp message)}`;

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

export async function generateOutreach({ sourceMessage, companyName, linkedinUrl, notes }) {
  const slug = slugFromLinkedIn(linkedinUrl);
  const userText = [
    companyName ? `Company name: ${companyName}` : null,
    linkedinUrl ? `Company LinkedIn page: ${linkedinUrl}` : null,
    slug ? `(LinkedIn slug suggests the company is: ${slug})` : null,
    notes ? `Extra notes from me: ${notes}` : null,
    "",
    "Source message:",
    "<<<",
    sourceMessage,
    ">>>",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const result = process.env.OPENAI_API_KEY
    ? await draftWithOpenAI(userText)
    : await draftWithClaude(userText);
  return {
    role: result.role || "",
    otherRoles: result.other_roles || [],
    companySummary: result.company_summary || "",
    sources: result.sources || [],
    message: result.message || "",
  };
}

async function draftWithOpenAI(userText) {
  openai ??= new OpenAI();
  const response = await openai.responses.create({
    model: OPENAI_MODEL,
    instructions: SYSTEM,
    input: userText,
    tools: [{ type: "web_search" }],
  });
  return extractJson(response.output_text);
}

async function draftWithClaude(userText) {
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
      system: SYSTEM,
      tools: [
        { type: "web_search_20260209", name: "web_search", max_uses: 5 },
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
