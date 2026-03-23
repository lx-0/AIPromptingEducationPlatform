import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/paths — list learning paths
// Instructors: their own paths (all statuses)
// Trainees: published paths with enrollment status
export async function GET() {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role === "instructor") {
    const result = await pool.query(
      `SELECT
         lp.*,
         COUNT(DISTINCT lpw.id)::int AS workshop_count
       FROM learning_paths lp
       LEFT JOIN learning_path_workshops lpw ON lpw.path_id = lp.id
       WHERE lp.instructor_id = $1
       GROUP BY lp.id
       ORDER BY lp.created_at DESC`,
      [session.userId]
    );
    return NextResponse.json(result.rows);
  }

  // Trainees see published paths with enrollment status
  const result = await pool.query(
    `SELECT
       lp.*,
       COUNT(DISTINCT lpw.id)::int AS workshop_count,
       u.display_name AS instructor_name,
       EXISTS(
         SELECT 1 FROM learning_path_enrollments lpe
         WHERE lpe.path_id = lp.id AND lpe.trainee_id = $1
       ) AS is_enrolled
     FROM learning_paths lp
     JOIN users u ON u.id = lp.instructor_id
     LEFT JOIN learning_path_workshops lpw ON lpw.path_id = lp.id
     WHERE lp.status = 'published'
     GROUP BY lp.id, u.display_name
     ORDER BY lp.created_at DESC`,
    [session.userId]
  );

  return NextResponse.json(result.rows);
}

// POST /api/paths — create a new learning path (instructor only)
export async function POST(request: Request) {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description } = body;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const result = await pool.query(
    `INSERT INTO learning_paths (title, description, instructor_id)
     VALUES ($1, $2, $3) RETURNING *`,
    [title, description ?? null, session.userId]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
