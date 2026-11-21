import "server-only";
import OpenAI from "openai";
import { extractJson, providerResultSchema, ResearchError, type ResearchInput } from "../schema";
import { buildDraftSystem, buildDraftUserText, buildResearchSystem, buildResearchUserText } from "../prompt";
import type { ProviderOutput, ResearchProvider } from "./types";

// Ported unchanged in approach from outreach-agent/generate.js
// (draftWithOpenAI): Responses API with the web_search tool. This path does
// not report which pages were retrieved, so citations are not cross-checked
// and the UI says so.
const MODEL = process.env.OPENAI_MODEL || "gpt-5";

async function run(system: string, userText: string, withTools: boolean, signal: AbortSignal): Promise<ProviderOutput> {
  const client = new OpenAI({ timeout: 240_000, maxRetries: 2 });
  try {
    const response = await client.responses.create(
      { model: MODEL, instructions: system, input: userText, ...(withTools ? { tools: [{ type: "web_search" as const }] } : {}) },
      { signal },
    );
    const raw = providerResultSchema.parse(extractJson(response.output_text));
    return { raw, retrieved: withTools ? null : [], model: MODEL };
  } catch (err) {
    if (err instanceof ResearchError) throw err;
    if (err instanceof OpenAI.AuthenticationError) throw new ResearchError("The OpenAI API key was rejected.", false);
    if (err instanceof OpenAI.BadRequestError) throw new ResearchError("The research request was rejected by OpenAI.", false);
    if (err instanceof SyntaxError) throw new ResearchError("The research result was not valid JSON; it will retry.", true);
    throw new ResearchError("The OpenAI request failed; it will retry.", true);
  }
}

export const openaiProvider: ResearchProvider = {
  id: "openai",
  label: "OpenAI with web search",
  configured: () => Boolean(process.env.OPENAI_API_KEY),
  missingConfig: () => (process.env.OPENAI_API_KEY ? [] : ["OPENAI_API_KEY"]),
  supportsDraftOnly: true,
  research: (input: ResearchInput, signal) => run(buildResearchSystem(input), buildResearchUserText(input), true, signal),
  draft: (input: ResearchInput, signal) => run(buildDraftSystem(input), buildDraftUserText(input), false, signal),
};
