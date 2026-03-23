import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { getProvider } from "@/lib/llm-providers";

type Exercise = {
  id: string;
  instructions: string;
  exercise_type: string;
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
  const { current_prompt } = body;

  // Load exercise instructions
  const exerciseResult = await pool.query<Exercise>(
    "SELECT id, instructions, exercise_type FROM exercises WHERE id = $1",
    [id]
  );
  const exercise = exerciseResult.rows[0];

  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  const provider = getProvider("anthropic");

  const systemPrompt = `You are a helpful teaching assistant for an AI prompting education platform.
Your job is to give trainees a helpful hint about how to improve their prompt without revealing the answer.
Be encouraging and specific. Focus on technique, not the exact solution.
Keep your hint to 2-3 sentences.`;

  const userPrompt = `## Exercise Instructions
${exercise.instructions}

## Trainee's Current Prompt
${current_prompt?.trim() || "(no prompt written yet)"}

## Task
Give the trainee a helpful hint that guides them toward a better prompt without revealing the answer.
Focus on what's missing or could be improved in their current approach.`;

  try {
    const result = await provider.complete({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      config: {
        provider: "anthropic",
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
      },
    });

    return NextResponse.json({ hint: result.text.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate hint";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
