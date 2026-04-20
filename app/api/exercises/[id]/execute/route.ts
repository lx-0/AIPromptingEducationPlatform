import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { scoreSubmission } from "@/lib/scorer";
import { updateStreak, checkAndAwardBadges } from "@/lib/badges";
import { sendScoreNotification } from "@/lib/email";
import { getProvider } from "@/lib/llm-providers";
import { getScoringQueue } from "@/lib/queue";
import type { ModelConfig } from "@/lib/llm-providers";

// Rate limit: max 10 executions per user per 60 seconds
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60;

type ExerciseType = "standard" | "multi_step" | "comparison" | "constrained";

type ExerciseConstraints = {
  char_limit?: number;
  forbidden_words?: string[];
  required_keywords?: string[];
};

type ExerciseStep = {
  step_number: number;
  instructions: string;
  system_prompt: string | null;
};

type Exercise = {
  id: string;
  title: string;
  system_prompt: string | null;
  model_config: ModelConfig;
  exercise_type: ExerciseType;
  constraints: ExerciseConstraints;
  workshop_default_provider?: string;
};

const encoder = new TextEncoder();

function sse(data: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

function streamResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

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
  const {
    prompt_text,
    // multi_step extras
    step_number,
    previous_outputs,
    // comparison extras
    prompt_text_a,
    prompt_text_b,
  } = body;

  // Load exercise with its workshop's default_provider
  const exerciseResult = await pool.query<Exercise>(
    `SELECT e.id, e.title, e.system_prompt, e.model_config, e.exercise_type,
            COALESCE(e.constraints, '{}') AS constraints,
            w.default_provider AS workshop_default_provider
     FROM exercises e
     JOIN workshops w ON w.id = e.workshop_id
     WHERE e.id = $1`,
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
       AND submitted_at > NOW() - ($2 * INTERVAL '1 second')`,
    [session.userId, RATE_LIMIT_WINDOW_SECONDS]
  );
  const recentCount = parseInt(rateResult.rows[0].count, 10);
  if (recentCount >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before submitting again." },
      { status: 429 }
    );
  }

  const config = exercise.model_config ?? {};
  // Fall back to workshop-level default provider when exercise has none set
  if (!config.provider && exercise.workshop_default_provider) {
    config.provider = exercise.workshop_default_provider as ModelConfig["provider"];
  }
  const provider = getProvider(config.provider);

  // ─── Route by exercise type ───────────────────────────────────────────────

  switch (exercise.exercise_type) {
    case "constrained":
      return handleConstrained(
        exercise,
        id,
        session.userId,
        prompt_text,
        config,
        provider
      );

    case "comparison":
      return handleComparison(
        exercise,
        id,
        session.userId,
        prompt_text_a,
        prompt_text_b,
        config,
        provider
      );

    case "multi_step":
      return handleMultiStep(
        exercise,
        id,
        session.userId,
        prompt_text,
        step_number ?? 0,
        previous_outputs ?? [],
        config,
        provider
      );

    default:
      return handleStandard(
        exercise,
        id,
        session.userId,
        prompt_text,
        config,
        provider
      );
  }
}

// ─── Standard execution ─────────────────────────────────────────────────────

async function handleStandard(
  exercise: Exercise,
  exerciseId: string,
  userId: string,
  promptText: string,
  config: ModelConfig,
  provider: ReturnType<typeof getProvider>
) {
  if (!promptText?.trim()) {
    return NextResponse.json({ error: "prompt_text is required" }, { status: 400 });
  }

  const submissionResult = await pool.query(
    `INSERT INTO submissions (exercise_id, trainee_id, prompt_text)
     VALUES ($1, $2, $3) RETURNING id`,
    [exerciseId, userId, promptText.trim()]
  );
  const submissionId = submissionResult.rows[0].id;

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      try {
        const result = await provider.stream({
          systemPrompt: exercise.system_prompt,
          messages: [{ role: "user", content: promptText.trim() }],
          config,
          onChunk(text) {
            fullResponse += text;
            controller.enqueue(sse({ text }));
          },
        });

        await pool.query(
          "UPDATE submissions SET llm_response = $1 WHERE id = $2",
          [fullResponse, submissionId]
        );

        logTokens(submissionId, config, result).catch(() => {});

        const scoringQueue = getScoringQueue();
        if (scoringQueue) {
          // Async scoring via BullMQ — respond immediately, score arrives via polling
          await scoringQueue.add("score-submission", {
            submissionId,
            userId,
            exerciseTitle: exercise.title,
            exerciseId,
          });
          controller.enqueue(sse({ done: true, submissionId }));
        } else {
          // Fallback: inline scoring when Redis is not configured
          controller.enqueue(sse({ scoring: true }));
          const { score, newBadges, currentStreak } = await runScoringAndGamification(
            submissionId,
            userId,
            exercise.title,
            exerciseId
          );
          controller.enqueue(
            sse({ done: true, submissionId, score, newBadges: newBadges.length > 0 ? newBadges : undefined, currentStreak: currentStreak > 0 ? currentStreak : undefined })
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "LLM provider error";
        await pool.query("UPDATE submissions SET llm_response = $1 WHERE id = $2", [`[Error] ${message}`, submissionId]);
        controller.enqueue(sse({ error: message, submissionId }));
      } finally {
        controller.close();
      }
    },
  });

  return streamResponse(stream);
}

// ─── Constrained execution ──────────────────────────────────────────────────

async function handleConstrained(
  exercise: Exercise,
  exerciseId: string,
  userId: string,
  promptText: string,
  config: ModelConfig,
  provider: ReturnType<typeof getProvider>
) {
  if (!promptText?.trim()) {
    return NextResponse.json({ error: "prompt_text is required" }, { status: 400 });
  }

  const constraints = exercise.constraints ?? {};
  const violations: string[] = [];

  if (constraints.char_limit && promptText.trim().length > constraints.char_limit) {
    violations.push(
      `Prompt exceeds character limit (${promptText.trim().length}/${constraints.char_limit} chars)`
    );
  }

  if (constraints.forbidden_words && constraints.forbidden_words.length > 0) {
    const lower = promptText.toLowerCase();
    for (const word of constraints.forbidden_words) {
      const re = new RegExp(`\\b${word.toLowerCase()}\\b`);
      if (re.test(lower)) {
        violations.push(`Forbidden word used: "${word}"`);
      }
    }
  }

  if (constraints.required_keywords && constraints.required_keywords.length > 0) {
    const lower = promptText.toLowerCase();
    for (const kw of constraints.required_keywords) {
      if (!lower.includes(kw.toLowerCase())) {
        violations.push(`Required keyword missing: "${kw}"`);
      }
    }
  }

  if (violations.length > 0) {
    return NextResponse.json(
      { error: "Constraint violations", violations, code: "CONSTRAINT_VIOLATION" },
      { status: 422 }
    );
  }

  // Passes all constraints — run as standard
  return handleStandard(exercise, exerciseId, userId, promptText, config, provider);
}

// ─── Comparison execution ────────────────────────────────────────────────────

async function handleComparison(
  exercise: Exercise,
  exerciseId: string,
  userId: string,
  promptTextA: string,
  promptTextB: string,
  config: ModelConfig,
  provider: ReturnType<typeof getProvider>
) {
  if (!promptTextA?.trim() || !promptTextB?.trim()) {
    return NextResponse.json(
      { error: "prompt_text_a and prompt_text_b are both required for comparison exercises" },
      { status: 400 }
    );
  }

  const submissionResult = await pool.query(
    `INSERT INTO submissions (exercise_id, trainee_id, prompt_text)
     VALUES ($1, $2, $3) RETURNING id`,
    [exerciseId, userId, JSON.stringify({ a: promptTextA.trim(), b: promptTextB.trim() })]
  );
  const submissionId = submissionResult.rows[0].id;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(sse({ phase: "running_a" }));

        // Run prompt A
        let responseA = "";
        await provider.stream({
          systemPrompt: exercise.system_prompt,
          messages: [{ role: "user", content: promptTextA.trim() }],
          config,
          onChunk(text) {
            responseA += text;
            controller.enqueue(sse({ text_a: text }));
          },
        });

        controller.enqueue(sse({ phase: "running_b" }));

        // Run prompt B
        let responseB = "";
        await provider.stream({
          systemPrompt: exercise.system_prompt,
          messages: [{ role: "user", content: promptTextB.trim() }],
          config,
          onChunk(text) {
            responseB += text;
            controller.enqueue(sse({ text_b: text }));
          },
        });

        const combinedResponse = JSON.stringify({
          prompt_a: promptTextA.trim(),
          response_a: responseA,
          prompt_b: promptTextB.trim(),
          response_b: responseB,
        });

        await pool.query(
          "UPDATE submissions SET llm_response = $1 WHERE id = $2",
          [combinedResponse, submissionId]
        );

        controller.enqueue(sse({ scoring: true }));

        // AI judge compares the two
        const judgeVerdict = await compareResponses(
          exercise,
          promptTextA.trim(),
          responseA,
          promptTextB.trim(),
          responseB
        );

        // Store score
        const { score } = await runScoringWithVerdict(submissionId, judgeVerdict);

        controller.enqueue(
          sse({
            done: true,
            submissionId,
            score,
            comparison: judgeVerdict,
          })
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "LLM provider error";
        await pool.query(
          "UPDATE submissions SET llm_response = $1 WHERE id = $2",
          [`[Error] ${message}`, submissionId]
        );
        controller.enqueue(sse({ error: message, submissionId }));
      } finally {
        controller.close();
      }
    },
  });

  return streamResponse(stream);
}

// ─── Multi-step execution ────────────────────────────────────────────────────

async function handleMultiStep(
  exercise: Exercise,
  exerciseId: string,
  userId: string,
  promptText: string,
  stepNumber: number,
  previousOutputs: string[],
  config: ModelConfig,
  provider: ReturnType<typeof getProvider>
) {
  if (!promptText?.trim()) {
    return NextResponse.json({ error: "prompt_text is required" }, { status: 400 });
  }

  // Load all steps for the exercise
  const stepsResult = await pool.query<ExerciseStep>(
    "SELECT step_number, instructions, system_prompt FROM exercise_steps WHERE exercise_id = $1 ORDER BY step_number ASC",
    [exerciseId]
  );
  const steps = stepsResult.rows;

  if (steps.length === 0) {
    // No steps defined — fall back to standard
    return handleStandard(exercise, exerciseId, userId, promptText, config, provider);
  }

  const currentStep = steps[stepNumber] ?? steps[0];
  const isLastStep = stepNumber >= steps.length - 1;

  // Build messages with interleaved user/assistant turns so the first message is always user-role
  const messages: { role: "user" | "assistant"; content: string }[] = [];
  for (let i = 0; i < previousOutputs.length; i++) {
    const priorStepContext = steps[i]?.instructions ?? `Step ${i + 1}`;
    messages.push({ role: "user", content: priorStepContext });
    messages.push({ role: "assistant", content: previousOutputs[i] });
  }
  messages.push({ role: "user", content: promptText.trim() });

  // Use this step's system prompt if available, otherwise fall back to exercise-level
  const systemPrompt = currentStep.system_prompt ?? exercise.system_prompt;

  const submissionResult = await pool.query(
    `INSERT INTO submissions (exercise_id, trainee_id, prompt_text)
     VALUES ($1, $2, $3) RETURNING id`,
    [
      exerciseId,
      userId,
      JSON.stringify({ step: stepNumber, prompt: promptText.trim() }),
    ]
  );
  const submissionId = submissionResult.rows[0].id;

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      try {
        const result = await provider.stream({
          systemPrompt,
          messages,
          config,
          onChunk(text) {
            fullResponse += text;
            controller.enqueue(sse({ text }));
          },
        });

        await pool.query(
          "UPDATE submissions SET llm_response = $1 WHERE id = $2",
          [fullResponse, submissionId]
        );

        logTokens(submissionId, config, result).catch(() => {});

        const finalPayload: Record<string, unknown> = {
          done: true,
          submissionId,
          stepNumber,
          totalSteps: steps.length,
          isLastStep,
          stepResponse: fullResponse,
        };

        if (isLastStep) {
          const scoringQueue = getScoringQueue();
          if (scoringQueue) {
            await scoringQueue.add("score-submission", {
              submissionId,
              userId,
              exerciseTitle: exercise.title,
              exerciseId,
            });
            // score will be fetched via polling
          } else {
            controller.enqueue(sse({ scoring: true }));
            const { score, newBadges, currentStreak } = await runScoringAndGamification(
              submissionId,
              userId,
              exercise.title,
              exerciseId
            );
            finalPayload.score = score;
            finalPayload.newBadges = newBadges.length > 0 ? newBadges : undefined;
            finalPayload.currentStreak = currentStreak > 0 ? currentStreak : undefined;
          }
        }

        controller.enqueue(sse(finalPayload));
      } catch (err) {
        const message = err instanceof Error ? err.message : "LLM provider error";
        await pool.query(
          "UPDATE submissions SET llm_response = $1 WHERE id = $2",
          [`[Error] ${message}`, submissionId]
        );
        controller.enqueue(sse({ error: message, submissionId }));
      } finally {
        controller.close();
      }
    },
  });

  return streamResponse(stream);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function logTokens(
  submissionId: string,
  config: ModelConfig,
  result: { inputTokens?: number; outputTokens?: number }
) {
  await pool.query(
    `INSERT INTO llm_call_logs (submission_id, provider, model, input_tokens, output_tokens)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      submissionId,
      config.provider ?? "anthropic",
      config.model ?? "claude-sonnet-4-6",
      result.inputTokens,
      result.outputTokens,
    ]
  );
}

async function runScoringAndGamification(
  submissionId: string,
  userId: string,
  exerciseTitle: string,
  exerciseId: string
) {
  let score = null;
  let newBadges: import("@/lib/badges").BadgeMeta[] = [];
  let currentStreak = 0;

  try {
    score = await scoreSubmission(submissionId);

    try {
      currentStreak = await updateStreak(userId);
      if (score) {
        const scorePct =
          score.max_score > 0
            ? Math.round((score.total_score / score.max_score) * 100)
            : 0;
        newBadges = await checkAndAwardBadges(userId, submissionId, scorePct, currentStreak);
      }
    } catch {
      // Gamification failure is non-fatal
    }

    if (score) {
      pool
        .query<{ email: string; display_name: string; score_notify: boolean }>(
          `SELECT u.email, u.display_name,
                  COALESCE(ep.score_notify, TRUE) AS score_notify
           FROM users u
           LEFT JOIN email_preferences ep ON ep.user_id = u.id
           WHERE u.id = $1`,
          [userId]
        )
        .then((r) => {
          const row = r.rows[0];
          if (row?.score_notify) {
            const overall =
              typeof score!.feedback?.overall === "string"
                ? score!.feedback.overall
                : "";
            sendScoreNotification(
              row.email,
              row.display_name,
              exerciseTitle,
              score!.total_score,
              score!.max_score,
              overall,
              submissionId
            ).catch(() => {});
          }
        })
        .catch(() => {});
    }
  } catch {
    // Scoring failure is non-fatal
  }

  return { score, newBadges, currentStreak };
}

type JudgeVerdict = {
  winner: "a" | "b" | "tie";
  reasoning: string;
  score_a: number;
  score_b: number;
};

async function compareResponses(
  exercise: Exercise,
  promptA: string,
  responseA: string,
  promptB: string,
  responseB: string
): Promise<JudgeVerdict> {
  const judgeProvider = getProvider("anthropic");

  const systemPrompt = `You are an expert AI judge evaluating two prompts for a prompting education platform.
Compare both prompts and their AI-generated responses, then pick the better one.
Respond ONLY with a valid JSON object — no markdown, no explanation outside JSON.`;

  const userPrompt = `## Exercise Context
${exercise.system_prompt ? `System prompt: ${exercise.system_prompt}\n` : ""}

## Prompt A
${promptA}

## Response A
${responseA}

## Prompt B
${promptB}

## Response B
${responseB}

## Task
Compare Prompt A and Prompt B. Which produces a better AI response?
Return a JSON object with this shape:
{
  "winner": "a" | "b" | "tie",
  "reasoning": "<2-3 sentence explanation of why one is better>",
  "score_a": <0-100>,
  "score_b": <0-100>
}`;

  const result = await judgeProvider.complete({
    systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    config: { provider: "anthropic", model: "claude-haiku-4-5-20251001", max_tokens: 512 },
  });

  const rawText = result.text;
  try {
    return JSON.parse(rawText) as JudgeVerdict;
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI judge returned invalid JSON");
    return JSON.parse(match[0]) as JudgeVerdict;
  }
}

async function runScoringWithVerdict(
  submissionId: string,
  verdict: JudgeVerdict
): Promise<{ score: import("@/lib/scorer").ScoreResult }> {
  const maxScore = 100;
  const totalScore = verdict.winner === "a"
    ? verdict.score_a
    : verdict.winner === "b"
    ? verdict.score_b
    : Math.round((verdict.score_a + verdict.score_b) / 2);

  const feedback = {
    criteria: [
      { criterion: "Prompt A", score: verdict.score_a, comment: "" },
      { criterion: "Prompt B", score: verdict.score_b, comment: "" },
    ],
    overall: `Winner: ${verdict.winner.toUpperCase()}. ${verdict.reasoning}`,
  };

  const scoreRow = await pool.query(
    `INSERT INTO scores (submission_id, total_score, max_score, feedback)
     VALUES ($1, $2, $3, $4)
     RETURNING id, submission_id, total_score, max_score, feedback, scored_at`,
    [submissionId, totalScore, maxScore, JSON.stringify(feedback)]
  );

  return { score: scoreRow.rows[0] };
}
