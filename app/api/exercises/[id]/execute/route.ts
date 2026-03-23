import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { scoreSubmission } from "@/lib/scorer";
import { updateStreak, checkAndAwardBadges } from "@/lib/badges";
import { sendScoreNotification } from "@/lib/email";
import { getProvider } from "@/lib/llm-providers";
import type { ModelConfig } from "@/lib/llm-providers";

// Rate limit: max 10 executions per user per 60 seconds
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60;

type Exercise = {
  id: string;
  title: string;
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
    "SELECT id, title, system_prompt, model_config FROM exercises WHERE id = $1",
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
  const provider = getProvider(config.provider);

  // Streaming response
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";

      try {
        const result = await provider.stream({
          systemPrompt: exercise.system_prompt,
          messages: [{ role: "user", content: prompt_text.trim() }],
          config,
          onChunk(text) {
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          },
        });

        // Store llm_response in DB
        await pool.query(
          "UPDATE submissions SET llm_response = $1 WHERE id = $2",
          [fullResponse, submissionId]
        );

        // Log cost/token usage
        await pool.query(
          `INSERT INTO llm_call_logs
             (submission_id, provider, model, input_tokens, output_tokens)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            submissionId,
            config.provider ?? "anthropic",
            config.model ?? "claude-sonnet-4-6",
            result.inputTokens,
            result.outputTokens,
          ]
        ).catch(() => {}); // non-fatal

        // Notify client that scoring is starting
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ scoring: true })}\n\n`)
        );

        // Run AI judge scoring
        let score = null;
        let newBadges: import("@/lib/badges").BadgeMeta[] = [];
        let currentStreak = 0;
        try {
          score = await scoreSubmission(submissionId);

          // Update streak and check for new badges (non-fatal)
          try {
            currentStreak = await updateStreak(session.userId);
            if (score) {
              const scorePct =
                score.max_score > 0
                  ? Math.round((score.total_score / score.max_score) * 100)
                  : 0;
              newBadges = await checkAndAwardBadges(
                session.userId,
                submissionId,
                scorePct,
                currentStreak
              );
            }
          } catch {
            // Gamification failure is non-fatal
          }

          // Fire-and-forget score notification (check preference first)
          if (score) {
            pool
              .query<{ email: string; display_name: string; score_notify: boolean }>(
                `SELECT u.email, u.display_name,
                        COALESCE(ep.score_notify, TRUE) AS score_notify
                 FROM users u
                 LEFT JOIN email_preferences ep ON ep.user_id = u.id
                 WHERE u.id = $1`,
                [session.userId]
              )
              .then((r) => {
                const row = r.rows[0];
                if (row?.score_notify) {
                  const overall =
                    typeof score.feedback?.overall === "string"
                      ? score.feedback.overall
                      : "";
                  sendScoreNotification(
                    row.email,
                    row.display_name,
                    exercise.title,
                    score.total_score,
                    score.max_score,
                    overall,
                    submissionId
                  ).catch(() => {});
                }
              })
              .catch(() => {});
          }
        } catch {
          // Scoring failure is non-fatal; client can retry via POST /api/submissions/[id]/score
        }

        // Send final message with submission id, score, and any new badges
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              submissionId,
              score,
              newBadges: newBadges.length > 0 ? newBadges : undefined,
              currentStreak: currentStreak > 0 ? currentStreak : undefined,
            })}\n\n`
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
