export type { LLMProvider, ModelConfig, LLMMessage, CompletionResult, ProviderName } from "./types";
export { PROVIDER_MODELS, DEFAULT_MODEL } from "./types";

import { anthropicProvider } from "./anthropic";
import { openaiProvider } from "./openai";
import { googleProvider } from "./google";
import type { LLMProvider, ProviderName } from "./types";

export function getProvider(provider: ProviderName | string | undefined): LLMProvider {
  switch (provider) {
    case "openai":
      return openaiProvider;
    case "google":
      return googleProvider;
    case "anthropic":
    default:
      return anthropicProvider;
  }
}
