import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify the workshop belongs to this instructor
  const workshopResult = await pool.query(
    "SELECT id FROM workshops WHERE id = $1 AND instructor_id = $2",
    [id, session.userId]
  );

  if (workshopResult.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await pool.query(
    `SELECT
       s.id,
       s.prompt_text,
       s.submitted_at,
       u.display_name AS trainee_name,
       e.title AS exercise_title,
       sc.total_score,
       sc.max_score
     FROM submissions s
     JOIN exercises e ON s.exercise_id = e.id
     JOIN users u ON s.trainee_id = u.id
     LEFT JOIN scores sc ON sc.submission_id = s.id
     WHERE e.workshop_id = $1
     ORDER BY s.submitted_at DESC`,
    [id]
  );

  return NextResponse.json(result.rows);
}
