import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, StreamParams, CompletionParams, CompletionResult } from "./types";

let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "sk-ant-...") {
      throw new Error("ANTHROPIC_API_KEY is not configured. Please set it in your environment variables.");
    }
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

export const anthropicProvider: LLMProvider = {
  async stream({ systemPrompt, messages, config, onChunk }): Promise<CompletionResult> {
    const model = config.model ?? "claude-sonnet-4-6";
    const temperature = config.temperature ?? 0.7;
    const maxTokens = config.max_tokens ?? 1024;

    let fullText = "";

    const stream = getAnthropic().messages.stream({
      model,
      max_tokens: maxTokens,
      temperature,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullText += event.delta.text;
        onChunk(event.delta.text);
      }
    }

    const finalMsg = await stream.finalMessage();
    return {
      text: fullText,
      inputTokens: finalMsg.usage?.input_tokens ?? 0,
      outputTokens: finalMsg.usage?.output_tokens ?? 0,
    };
  },

  async complete({ systemPrompt, messages, config }): Promise<CompletionResult> {
    const model = config.model ?? "claude-haiku-4-5-20251001";
    const maxTokens = config.max_tokens ?? 1024;

    const message = await getAnthropic().messages.create({
      model,
      max_tokens: maxTokens,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : "";
    return {
      text,
      inputTokens: message.usage?.input_tokens ?? 0,
      outputTokens: message.usage?.output_tokens ?? 0,
    };
  },
};
