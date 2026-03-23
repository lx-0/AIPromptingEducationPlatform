import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// POST /api/submissions/:id/override
// Instructor manually overrides a submission's score.
export async function POST(
  request: Request,
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

  // Verify instructor owns the workshop this submission belongs to
  const submissionResult = await pool.query(
    `SELECT s.id, e.workshop_id
     FROM submissions s
     JOIN exercises e ON e.id = s.exercise_id
     WHERE s.id = $1`,
    [id]
  );
  if (submissionResult.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { workshop_id } = submissionResult.rows[0];

  const ownerCheck = await pool.query(
    "SELECT instructor_id FROM workshops WHERE id = $1",
    [workshop_id]
  );
  if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].instructor_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { total_score, reason } = await request.json();
  if (typeof total_score !== "number" || total_score < 0) {
    return NextResponse.json({ error: "total_score must be a non-negative number" }, { status: 400 });
  }
  if (!reason || typeof reason !== "string") {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }

  const result = await pool.query(
    `INSERT INTO score_overrides (submission_id, instructor_id, total_score, reason)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (submission_id) DO UPDATE
       SET total_score = EXCLUDED.total_score,
           reason = EXCLUDED.reason,
           instructor_id = EXCLUDED.instructor_id,
           overridden_at = NOW()
     RETURNING *`,
    [id, session.userId, total_score, reason.trim()]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}

// DELETE /api/submissions/:id/override — remove override, restore automated score
export async function DELETE(
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

  const submissionResult = await pool.query(
    `SELECT s.id, e.workshop_id
     FROM submissions s
     JOIN exercises e ON e.id = s.exercise_id
     WHERE s.id = $1`,
    [id]
  );
  if (submissionResult.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { workshop_id } = submissionResult.rows[0];

  const ownerCheck = await pool.query(
    "SELECT instructor_id FROM workshops WHERE id = $1",
    [workshop_id]
  );
  if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].instructor_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await pool.query("DELETE FROM score_overrides WHERE submission_id = $1", [id]);
  return new NextResponse(null, { status: 204 });
}
