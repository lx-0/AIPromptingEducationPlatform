import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { scoreSubmission } from "@/lib/scorer";
import { getScoringQueue } from "@/lib/queue";
import pool from "@/lib/db";

// GET /api/submissions/:id/score — poll for async score result
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    `SELECT s.id, s.submission_id, s.total_score, s.max_score, s.feedback, s.scored_at
     FROM scores s
     JOIN submissions sub ON sub.id = s.submission_id
     WHERE sub.id = $1 AND sub.trainee_id = $2
     ORDER BY s.scored_at DESC
     LIMIT 1`,
    [id, session.userId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ pending: true });
  }

  return NextResponse.json(result.rows[0]);
}

// POST /api/submissions/:id/score — trigger scoring (enqueues job or runs inline)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up submission to get exercise context for job data
  const submissionResult = await pool.query(
    `SELECT s.id, s.trainee_id, e.title AS exercise_title, e.id AS exercise_id
     FROM submissions s
     JOIN exercises e ON e.id = s.exercise_id
     WHERE s.id = $1`,
    [id]
  );

  if (submissionResult.rows.length === 0) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const sub = submissionResult.rows[0];

  const queue = getScoringQueue();
  if (queue) {
    const job = await queue.add("score-submission", {
      submissionId: id,
      userId: sub.trainee_id as string,
      exerciseTitle: sub.exercise_title as string,
      exerciseId: sub.exercise_id as string,
    });
    return NextResponse.json({ queued: true, jobId: job.id });
  }

  // Fallback: inline scoring
  try {
    const score = await scoreSubmission(id);
    return NextResponse.json(score);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scoring failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
