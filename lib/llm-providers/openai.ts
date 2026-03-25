import OpenAI from "openai";
import type { LLMProvider, StreamParams, CompletionParams, CompletionResult } from "./types";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

function buildMessages(
  systemPrompt: string | null | undefined,
  messages: { role: "user" | "assistant"; content: string }[]
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const result: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (systemPrompt) {
    result.push({ role: "system", content: systemPrompt });
  }
  for (const m of messages) {
    result.push({ role: m.role, content: m.content });
  }
  return result;
}

export const openaiProvider: LLMProvider = {
  async stream({ systemPrompt, messages, config, onChunk }): Promise<CompletionResult> {
    const model = config.model ?? "gpt-4o";
    const temperature = config.temperature ?? 0.7;
    const maxTokens = config.max_tokens ?? 1024;

    let fullText = "";
    let inputTokens = 0;
    let outputTokens = 0;

    const stream = await getOpenAI().chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: buildMessages(systemPrompt, messages),
      stream: true,
      stream_options: { include_usage: true },
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        onChunk(delta);
      }
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens ?? 0;
        outputTokens = chunk.usage.completion_tokens ?? 0;
      }
    }

    return { text: fullText, inputTokens, outputTokens };
  },

  async complete({ systemPrompt, messages, config }): Promise<CompletionResult> {
    const model = config.model ?? "gpt-4o-mini";
    const temperature = config.temperature ?? 0.7;
    const maxTokens = config.max_tokens ?? 1024;

    const response = await getOpenAI().chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: buildMessages(systemPrompt, messages),
    });

    const text = response.choices[0]?.message?.content ?? "";
    return {
      text,
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    };
  },
};
