import type { ProviderResult, ResearchInput, RetrievedSource } from "../schema";

export interface ProviderOutput {
  raw: ProviderResult;
  /** Pages the provider actually retrieved, or null when it can't report them. */
  retrieved: RetrievedSource[] | null;
  model: string | null;
  extraWarnings?: string[];
}

export interface ResearchProvider {
  id: string;
  label: string;
  /** True only when the credentials/endpoint needed to call it are configured. */
  configured(): boolean;
  missingConfig(): string[];
  supportsDraftOnly: boolean;
  research(input: ResearchInput, signal: AbortSignal): Promise<ProviderOutput>;
  draft(input: ResearchInput, signal: AbortSignal): Promise<ProviderOutput>;
}
