import pool from "@/lib/db";
import { getProvider } from "@/lib/llm-providers";
import {
  maybeIssueWorkshopCertificate,
  maybeIssueLearningPathCertificates,
} from "@/lib/certificates";
import { sendCertificateEmail } from "@/lib/email";

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
    `SELECT s.id, s.prompt_text, s.llm_response, s.trainee_id,
            e.instructions, e.rubric, e.workshop_id
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
    void maybeIssueCertificatesAfterScore(
      row.trainee_id as string,
      row.workshop_id as string,
      1,
      1
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

  // Always use Anthropic Claude for the AI judge (reliable JSON output)
  const provider = getProvider("anthropic");
  const completionResult = await provider.complete({
    systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    config: { provider: "anthropic", model: "claude-haiku-4-5-20251001", max_tokens: 1024 },
  });

  const rawText = completionResult.text;

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

  // After scoring, try to auto-issue a certificate (fire-and-forget, non-blocking)
  void maybeIssueCertificatesAfterScore(
    row.trainee_id as string,
    row.workshop_id as string,
    totalScore,
    maxScore
  );

  return scoreRow.rows[0];
}

async function maybeIssueCertificatesAfterScore(
  traineeId: string,
  workshopId: string,
  totalScore: number,
  maxScore: number
): Promise<void> {
  try {
    // Attempt workshop certificate
    const workshopCert = await maybeIssueWorkshopCertificate(
      traineeId,
      workshopId
    );

    if (workshopCert) {
      // Notify trainee via email
      const traineeResult = await pool.query<{ email: string; display_name: string }>(
        "SELECT email, display_name FROM users WHERE id = $1",
        [traineeId]
      );
      if (traineeResult.rows.length > 0) {
        const { email, display_name } = traineeResult.rows[0];
        const scorePct =
          maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : null;
        await sendCertificateEmail(
          email,
          display_name,
          workshopCert.entity_title,
          "workshop",
          workshopCert.verification_code,
          scorePct
        );
      }

      // Also try to issue learning path certificates
      const pathCerts = await maybeIssueLearningPathCertificates(traineeId);
      for (const pathCert of pathCerts) {
        if (traineeResult.rows.length > 0) {
          const { email, display_name } = traineeResult.rows[0];
          await sendCertificateEmail(
            email,
            display_name,
            pathCert.entity_title,
            "learning_path",
            pathCert.verification_code,
            null
          );
        }
      }
    }
  } catch (err) {
    // Certificate issuance is best-effort — never fail a score because of this
    console.error("[certificates] Failed to auto-issue certificate:", err);
  }
}
