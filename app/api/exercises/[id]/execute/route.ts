import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Rate limit: max 10 executions per user per 60 seconds
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60;

type ModelConfig = {
  provider?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
};

type Exercise = {
  id: string;
  system_prompt: string | null;
  model_config: ModelConfig;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { prompt_text } = body;

  if (!prompt_text?.trim()) {
    return NextResponse.json(
      { error: "prompt_text is required" },
      { status: 400 }
    );
  }

  // Load exercise
  const exerciseResult = await pool.query<Exercise>(
    "SELECT id, system_prompt, model_config FROM exercises WHERE id = $1",
    [id]
  );
  const exercise = exerciseResult.rows[0];

  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  // Rate limiting: count recent submissions for this user
  const rateResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM submissions
     WHERE trainee_id = $1
       AND submitted_at > NOW() - INTERVAL '${RATE_LIMIT_WINDOW_SECONDS} seconds'`,
    [session.userId]
  );
  const recentCount = parseInt(rateResult.rows[0].count, 10);
  if (recentCount >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before submitting again." },
      { status: 429 }
    );
  }

  // Insert submission record first (llm_response populated after)
  const submissionResult = await pool.query(
    `INSERT INTO submissions (exercise_id, trainee_id, prompt_text)
     VALUES ($1, $2, $3) RETURNING id`,
    [id, session.userId, prompt_text.trim()]
  );
  const submissionId = submissionResult.rows[0].id;

  // Resolve model config
  const config = exercise.model_config ?? {};
  const provider = config.provider ?? "anthropic";
  const model = config.model ?? "claude-sonnet-4-6";
  const temperature = config.temperature ?? 0.7;
  const maxTokens = config.max_tokens ?? 1024;

  if (provider !== "anthropic") {
    await pool.query(
      "UPDATE submissions SET llm_response = $1 WHERE id = $2",
      [`Provider "${provider}" is not yet supported.`, submissionId]
    );
    return NextResponse.json(
      { error: `Provider "${provider}" is not yet supported.` },
      { status: 400 }
    );
  }

  // Build messages for Anthropic
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: prompt_text.trim() },
  ];

  // Streaming response
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";

      try {
        const anthropicStream = anthropic.messages.stream({
          model,
          max_tokens: maxTokens,
          temperature,
          ...(exercise.system_prompt
            ? { system: exercise.system_prompt }
            : {}),
          messages,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }

        // Store llm_response in DB
        await pool.query(
          "UPDATE submissions SET llm_response = $1 WHERE id = $2",
          [fullResponse, submissionId]
        );

        // Send final message with submission id
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, submissionId })}\n\n`
          )
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "LLM provider error";

        // Store error in DB
        await pool.query(
          "UPDATE submissions SET llm_response = $1 WHERE id = $2",
          [`[Error] ${message}`, submissionId]
        );

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: message, submissionId })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
