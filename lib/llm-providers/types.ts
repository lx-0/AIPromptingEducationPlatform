export type ProviderName = "anthropic" | "openai" | "google";

export type ModelConfig = {
  provider?: ProviderName;
  model?: string;
  temperature?: number;
  max_tokens?: number;
};

export type LLMMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StreamParams = {
  systemPrompt?: string | null;
  messages: LLMMessage[];
  config: ModelConfig;
  onChunk: (text: string) => void;
};

export type CompletionParams = {
  systemPrompt?: string | null;
  messages: LLMMessage[];
  config: ModelConfig;
};

export type CompletionResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
};

export interface LLMProvider {
  /** Stream a response, calling onChunk for each text delta. Returns full result. */
  stream(params: StreamParams): Promise<CompletionResult>;
  /** Non-streaming completion. */
  complete(params: CompletionParams): Promise<CompletionResult>;
}

// Models available per provider for UI display
export const PROVIDER_MODELS: Record<ProviderName, { id: string; label: string }[]> = {
  anthropic: [
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  ],
  openai: [
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  ],
  google: [
    { id: "gemini-2.5-flash-preview-04-17", label: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-pro-preview-03-25", label: "Gemini 2.5 Pro" },
  ],
};

export const DEFAULT_MODEL: Record<ProviderName, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o",
  google: "gemini-2.5-flash-preview-04-17",
};
