import Anthropic from "@anthropic-ai/sdk";
import pool from "@/lib/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type RubricCriterion = {
  criterion: string;
  max_points: number;
  description?: string;
};

type ScoredCriterion = {
  criterion: string;
  score: number;
  comment?: string;
};

type JudgeOutput = {
  criteria: ScoredCriterion[];
  overall: string;
};

export type ScoreResult = {
  id: string;
  submission_id: string;
  total_score: number;
  max_score: number;
  feedback: {
    criteria: ScoredCriterion[];
    overall: string;
  };
  scored_at: string;
};

export async function scoreSubmission(
  submissionId: string
): Promise<ScoreResult> {
  // Load submission with exercise rubric and instructions
  const result = await pool.query(
    `SELECT s.id, s.prompt_text, s.llm_response,
            e.instructions, e.rubric
     FROM submissions s
     JOIN exercises e ON e.id = s.exercise_id
     WHERE s.id = $1`,
    [submissionId]
  );

  if (result.rows.length === 0) {
    throw new Error("Submission not found");
  }

  const row = result.rows[0];
  const rubric: RubricCriterion[] = row.rubric ?? [];

  // If no rubric defined, return a default full score
  if (rubric.length === 0) {
    const scoreRow = await pool.query(
      `INSERT INTO scores (submission_id, total_score, max_score, feedback)
       VALUES ($1, 1, 1, $2)
       RETURNING id, submission_id, total_score, max_score, feedback, scored_at`,
      [submissionId, JSON.stringify({ criteria: [], overall: "No rubric defined." })]
    );
    return scoreRow.rows[0];
  }

  const maxScore = rubric.reduce((sum, c) => sum + c.max_points, 0);

  const rubricText = rubric
    .map(
      (c) =>
        `- ${c.criterion} (max ${c.max_points} pts)${c.description ? `: ${c.description}` : ""}`
    )
    .join("\n");

  const systemPrompt = `You are an expert AI judge evaluating trainee prompts for a prompting education platform.
Score each rubric criterion honestly and provide constructive feedback.
Respond ONLY with a valid JSON object — no markdown, no explanation outside JSON.`;

  const userPrompt = `## Exercise Instructions
${row.instructions}

## Rubric
${rubricText}

## Trainee Prompt
${row.prompt_text}

## LLM Response to the Trainee Prompt
${row.llm_response ?? "(no response)"}

## Task
Score the trainee prompt against each rubric criterion. Return a JSON object with this exact shape:
{
  "criteria": [
    { "criterion": "<name>", "score": <number>, "comment": "<brief feedback>" }
  ],
  "overall": "<one or two sentence overall assessment>"
}

Score each criterion from 0 to its max points. Be fair but rigorous.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText =
    message.content[0].type === "text" ? message.content[0].text : "";

  let judgeOutput: JudgeOutput;
  try {
    judgeOutput = JSON.parse(rawText) as JudgeOutput;
  } catch {
    // Fallback: extract JSON from text if wrapped in markdown
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI judge returned invalid JSON");
    }
    judgeOutput = JSON.parse(match[0]) as JudgeOutput;
  }

  const totalScore = (judgeOutput.criteria ?? []).reduce(
    (sum, c) => sum + (c.score ?? 0),
    0
  );

  const feedback = {
    criteria: judgeOutput.criteria ?? [],
    overall: judgeOutput.overall ?? "",
  };

  const scoreRow = await pool.query(
    `INSERT INTO scores (submission_id, total_score, max_score, feedback)
     VALUES ($1, $2, $3, $4)
     RETURNING id, submission_id, total_score, max_score, feedback, scored_at`,
    [submissionId, totalScore, maxScore, JSON.stringify(feedback)]
  );

  return scoreRow.rows[0];
}
