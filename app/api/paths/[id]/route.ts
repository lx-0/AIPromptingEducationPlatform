import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// GET /api/paths/[id] — get path detail with workshops
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pathResult = await pool.query(
    "SELECT lp.*, u.display_name AS instructor_name FROM learning_paths lp JOIN users u ON u.id = lp.instructor_id WHERE lp.id = $1",
    [id]
  );

  if (pathResult.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const path = pathResult.rows[0];

  // Only instructors can see draft/archived paths they don't own
  if (path.status !== "published" && path.instructor_id !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const workshopsResult = await pool.query(
    `SELECT
       lpw.id AS lpw_id,
       lpw.sort_order,
       lpw.prerequisite_workshop_id,
       w.id AS workshop_id,
       w.title AS workshop_title,
       w.description AS workshop_description,
       w.status AS workshop_status,
       pw.title AS prerequisite_title,
       COUNT(DISTINCT e.id)::int AS exercise_count
     FROM learning_path_workshops lpw
     JOIN workshops w ON w.id = lpw.workshop_id
     LEFT JOIN workshops pw ON pw.id = lpw.prerequisite_workshop_id
     LEFT JOIN exercises e ON e.workshop_id = w.id
     WHERE lpw.path_id = $1
     GROUP BY lpw.id, w.id, pw.title
     ORDER BY lpw.sort_order ASC`,
    [id]
  );

  return NextResponse.json({ ...path, workshops: workshopsResult.rows });
}

// PUT /api/paths/[id] — update path metadata (instructor only)
export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pathResult = await pool.query(
    "SELECT id, instructor_id FROM learning_paths WHERE id = $1",
    [id]
  );

  if (pathResult.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (pathResult.rows[0].instructor_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, status } = body;

  const result = await pool.query(
    `UPDATE learning_paths
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         status = COALESCE($3, status),
         updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [title ?? null, description ?? null, status ?? null, id]
  );

  return NextResponse.json(result.rows[0]);
}

// DELETE /api/paths/[id] — delete path (instructor only)
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pathResult = await pool.query(
    "SELECT id, instructor_id FROM learning_paths WHERE id = $1",
    [id]
  );

  if (pathResult.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (pathResult.rows[0].instructor_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await pool.query("DELETE FROM learning_paths WHERE id = $1", [id]);
  return NextResponse.json({ deleted: true });
}
