import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// GET /api/paths/[id]/workshops — list workshops in a path
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    `SELECT
       lpw.id AS lpw_id,
       lpw.sort_order,
       lpw.prerequisite_workshop_id,
       w.id AS workshop_id,
       w.title,
       w.description,
       w.status
     FROM learning_path_workshops lpw
     JOIN workshops w ON w.id = lpw.workshop_id
     WHERE lpw.path_id = $1
     ORDER BY lpw.sort_order ASC`,
    [id]
  );

  return NextResponse.json(result.rows);
}

// POST /api/paths/[id]/workshops — add a workshop to a path
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify path ownership
  const pathResult = await pool.query(
    "SELECT id, instructor_id FROM learning_paths WHERE id = $1",
    [id]
  );

  if (pathResult.rows.length === 0) {
    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }

  if (pathResult.rows[0].instructor_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { workshop_id, sort_order, prerequisite_workshop_id } = body;

  if (!workshop_id) {
    return NextResponse.json({ error: "workshop_id is required" }, { status: 400 });
  }

  // Determine sort_order if not provided (append to end)
  let finalSortOrder = sort_order;
  if (finalSortOrder == null) {
    const maxResult = await pool.query(
      "SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM learning_path_workshops WHERE path_id = $1",
      [id]
    );
    finalSortOrder = maxResult.rows[0].max_order + 1;
  }

  const result = await pool.query(
    `INSERT INTO learning_path_workshops (path_id, workshop_id, sort_order, prerequisite_workshop_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (path_id, workshop_id) DO UPDATE
       SET sort_order = EXCLUDED.sort_order,
           prerequisite_workshop_id = EXCLUDED.prerequisite_workshop_id
     RETURNING *`,
    [id, workshop_id, finalSortOrder, prerequisite_workshop_id ?? null]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
