import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMProvider, StreamParams, CompletionParams, CompletionResult } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? "");

function buildHistory(
  messages: { role: "user" | "assistant"; content: string }[]
): { role: "user" | "model"; parts: { text: string }[] }[] {
  // All messages except the last one become history; the last user message is the current prompt.
  return messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

function lastUserMessage(messages: { role: "user" | "assistant"; content: string }[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return "";
}

export const googleProvider: LLMProvider = {
  async stream({ systemPrompt, messages, config, onChunk }): Promise<CompletionResult> {
    const modelId = config.model ?? "gemini-2.5-flash-preview-04-17";
    const temperature = config.temperature ?? 0.7;
    const maxTokens = config.max_tokens ?? 1024;

    const model = genAI.getGenerativeModel({
      model: modelId,
      ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    });

    const chat = model.startChat({ history: buildHistory(messages) });
    const result = await chat.sendMessageStream(lastUserMessage(messages));

    let fullText = "";
    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullText += text;
      onChunk(text);
    }

    const finalResponse = await result.response;
    const usage = finalResponse.usageMetadata;
    return {
      text: fullText,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
    };
  },

  async complete({ systemPrompt, messages, config }): Promise<CompletionResult> {
    const modelId = config.model ?? "gemini-2.5-flash-preview-04-17";
    const temperature = config.temperature ?? 0.7;
    const maxTokens = config.max_tokens ?? 1024;

    const model = genAI.getGenerativeModel({
      model: modelId,
      ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    });

    const chat = model.startChat({ history: buildHistory(messages) });
    const result = await chat.sendMessage(lastUserMessage(messages));

    const text = result.response.text();
    const usage = result.response.usageMetadata;
    return {
      text,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
    };
  },
};
