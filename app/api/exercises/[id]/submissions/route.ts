import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

type SubmissionRow = {
  id: string;
  prompt_text: string;
  llm_response: string | null;
  submitted_at: string;
  total_score: number | null;
  max_score: number | null;
  feedback: {
    criteria?: { criterion: string; score: number; comment?: string }[];
    overall?: string;
  } | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query<SubmissionRow>(
    `SELECT
       s.id,
       s.prompt_text,
       s.llm_response,
       s.submitted_at,
       sc.total_score,
       sc.max_score,
       sc.feedback
     FROM submissions s
     LEFT JOIN scores sc ON sc.submission_id = s.id
     WHERE s.exercise_id = $1 AND s.trainee_id = $2
     ORDER BY s.submitted_at DESC`,
    [id, session.userId]
  );

  return NextResponse.json(result.rows);
}
