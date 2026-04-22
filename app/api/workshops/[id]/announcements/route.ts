import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/workshops/:id/announcements — visible to enrolled trainees and instructor
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Instructor must own; trainee must be enrolled
  if (session.role === "instructor") {
    const ownerCheck = await pool.query(
      "SELECT instructor_id FROM workshops WHERE id = $1",
      [id]
    );
    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (ownerCheck.rows[0].instructor_id !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    const enrollCheck = await pool.query(
      "SELECT 1 FROM enrollments WHERE workshop_id = $1 AND trainee_id = $2",
      [id, session.userId]
    );
    if (enrollCheck.rows.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const result = await pool.query(
    `SELECT a.id, a.title, a.body, a.created_at, p.display_name AS instructor_name
     FROM announcements a
     JOIN profiles p ON p.id = a.instructor_id
     WHERE a.workshop_id = $1
     ORDER BY a.created_at DESC`,
    [id]
  );

  return NextResponse.json(result.rows);
}

// POST /api/workshops/:id/announcements — instructor only
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

  const ownerCheck = await pool.query(
    "SELECT instructor_id FROM workshops WHERE id = $1",
    [id]
  );
  if (ownerCheck.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (ownerCheck.rows[0].instructor_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, body } = await request.json();
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!body || typeof body !== "string") {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const result = await pool.query(
    `INSERT INTO announcements (workshop_id, instructor_id, title, body)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, session.userId, title.trim(), body.trim()]
  );

  // Queue notification email for enrolled trainees via background job
  // (enqueue_job is a pg function that writes to a background_jobs table)
  try {
    await pool.query(
      `SELECT enqueue_job('send_announcement_emails', $1::jsonb)`,
      [JSON.stringify({ announcement_id: result.rows[0].id, workshop_id: id })]
    );
  } catch {
    // Non-critical: announcement is saved even if notification queueing fails
  }

  return NextResponse.json(result.rows[0], { status: 201 });
}
