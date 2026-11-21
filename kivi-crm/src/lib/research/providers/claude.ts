import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { extractJson, providerResultSchema, ResearchError, type RetrievedSource, type ResearchInput } from "../schema";
import { buildDraftSystem, buildDraftUserText, buildResearchSystem, buildResearchUserText } from "../prompt";
import type { ProviderOutput, ResearchProvider } from "./types";

// Ported from outreach-agent/generate.js (draftWithClaude): same model, web
// search + fetch server tools, pause_turn resumption and refusal fallbacks.
// Added: records which pages were actually retrieved so citations can be
// cross-checked, and validates the JSON against the CRM's evidence schema.
const MODEL = process.env.RESEARCH_CLAUDE_MODEL || "claude-opus-5-5";

function toResearchError(err: unknown): ResearchError {
  if (err instanceof ResearchError) return err;
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new ResearchError("The Claude API key was rejected. An admin needs to check ANTHROPIC_API_KEY.", false);
  }
  if (err instanceof Anthropic.BadRequestError) return new ResearchError("The research request was rejected by the Claude API.", false);
  if (err instanceof Anthropic.RateLimitError) return new ResearchError("The Claude API is rate limiting requests; it will retry.", true);
  if (err instanceof Anthropic.APIConnectionError) return new ResearchError("Could not reach the Claude API; it will retry.", true);
  if (err instanceof Anthropic.APIError) return new ResearchError(`Claude API error ${err.status ?? ""}; it will retry.`, true);
  if (err instanceof SyntaxError) return new ResearchError("The research result was not valid JSON; it will retry.", true);
  return new ResearchError("Research failed unexpectedly.", true);
}

function collectRetrieved(content: Anthropic.Beta.BetaContentBlock[], into: Map<string, RetrievedSource>) {
  for (const block of content) {
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const r of block.content) into.set(r.url, { url: r.url, title: r.title, pageAge: r.page_age });
    } else if (block.type === "web_fetch_tool_result" && block.content.type === "web_fetch_result") {
      into.set(block.content.url, { url: block.content.url, title: block.content.content?.title ?? null, pageAge: null });
    }
  }
}

async function run(system: string, userText: string, withTools: boolean, signal: AbortSignal): Promise<ProviderOutput> {
  const client = new Anthropic({ timeout: 240_000, maxRetries: 2 });
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: userText }];
  const retrieved = new Map<string, RetrievedSource>();
  try {
    // Server-side web search can pause long turns; resume up to a few times.
    for (let i = 0; i < 5; i++) {
      const response = await client.beta.messages.create(
        {
          model: MODEL,
          max_tokens: 16000,
          output_config: { effort: "medium" },
          // If a safety classifier declines, the API retries on a suitable fallback model in the same call.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system,
          ...(withTools
            ? {
                tools: [
                  { type: "web_search_20260209", name: "web_search", max_uses: 6, blocked_domains: ["linkedin.com"] },
                  { type: "web_fetch_20260209", name: "web_fetch", max_uses: 4, blocked_domains: ["linkedin.com"] },
                ],
              }
            : {}),
          messages,
        },
        { signal },
      );
      collectRetrieved(response.content, retrieved);
      if (response.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: response.content });
        continue;
      }
      if (response.stop_reason === "refusal") {
        throw new ResearchError("The model declined this research request. Try different notes.", false);
      }
      const text = response.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("");
      const raw = providerResultSchema.parse(extractJson(text));
      return { raw, retrieved: withTools ? [...retrieved.values()] : [], model: response.model };
    }
    throw new ResearchError("Research took too many steps; it will retry.", true);
  } catch (err) {
    throw toResearchError(err);
  }
}

export const claudeProvider: ResearchProvider = {
  id: "claude",
  label: "Claude with web search",
  configured: () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
  missingConfig: () => (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? [] : ["ANTHROPIC_API_KEY"]),
  supportsDraftOnly: true,
  research: (input: ResearchInput, signal) => run(buildResearchSystem(input), buildResearchUserText(input), true, signal),
  draft: (input: ResearchInput, signal) => run(buildDraftSystem(input), buildDraftUserText(input), false, signal),
};
