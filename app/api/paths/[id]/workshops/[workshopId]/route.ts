import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string; workshopId: string }> };

// PATCH /api/paths/[id]/workshops/[workshopId] — update sort_order or prerequisite
export async function PATCH(request: Request, { params }: Params) {
  const { id, workshopId } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pathResult = await pool.query(
    "SELECT instructor_id FROM learning_paths WHERE id = $1",
    [id]
  );

  if (pathResult.rows.length === 0) {
    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }

  if (pathResult.rows[0].instructor_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { sort_order, prerequisite_workshop_id } = body;

  const result = await pool.query(
    `UPDATE learning_path_workshops
     SET sort_order = COALESCE($1, sort_order),
         prerequisite_workshop_id = CASE WHEN $2::text IS NULL THEN prerequisite_workshop_id
                                         WHEN $2::text = 'null' THEN NULL
                                         ELSE $2::uuid END
     WHERE path_id = $3 AND workshop_id = $4
     RETURNING *`,
    [sort_order ?? null, prerequisite_workshop_id !== undefined ? (prerequisite_workshop_id === null ? "null" : prerequisite_workshop_id) : null, id, workshopId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Workshop not in path" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

// DELETE /api/paths/[id]/workshops/[workshopId] — remove workshop from path
export async function DELETE(_req: Request, { params }: Params) {
  const { id, workshopId } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pathResult = await pool.query(
    "SELECT instructor_id FROM learning_paths WHERE id = $1",
    [id]
  );

  if (pathResult.rows.length === 0) {
    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }

  if (pathResult.rows[0].instructor_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await pool.query(
    "DELETE FROM learning_path_workshops WHERE path_id = $1 AND workshop_id = $2",
    [id, workshopId]
  );

  return NextResponse.json({ deleted: true });
}
