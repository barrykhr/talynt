import "server-only";
import { claudeProvider } from "./claude";
import { openaiProvider } from "./openai";
import { outreachAgentProvider } from "./outreach-agent";
import type { ResearchProvider } from "./types";

export const PROVIDERS: ResearchProvider[] = [claudeProvider, openaiProvider, outreachAgentProvider];

/**
 * The provider used for new research. RESEARCH_PROVIDER picks one explicitly;
 * otherwise the first configured provider in order: Claude, OpenAI, agent.
 * Returns null when none is configured — the UI then says so instead of
 * pretending research is available.
 */
export function activeProvider(): ResearchProvider | null {
  const wanted = process.env.RESEARCH_PROVIDER?.trim();
  if (wanted === "none") return null;
  if (wanted) return PROVIDERS.find((p) => p.id === wanted && p.configured()) ?? null;
  return PROVIDERS.find((p) => p.configured()) ?? null;
}

export function providerById(id: string): ResearchProvider | null {
  return PROVIDERS.find((p) => p.id === id) ?? null;
}

export type { ResearchProvider } from "./types";
