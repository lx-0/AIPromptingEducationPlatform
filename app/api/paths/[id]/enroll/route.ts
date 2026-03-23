import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// POST /api/paths/[id]/enroll — enroll trainee in a learning path
// Also enrolls them in the first unlocked workshop if not already enrolled.
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pathResult = await pool.query(
    "SELECT id, status FROM learning_paths WHERE id = $1",
    [id]
  );

  if (pathResult.rows.length === 0) {
    return NextResponse.json({ error: "Path not found" }, { status: 404 });
  }

  if (pathResult.rows[0].status !== "published") {
    return NextResponse.json({ error: "Path is not available" }, { status: 404 });
  }

  // Enroll in path (idempotent)
  await pool.query(
    `INSERT INTO learning_path_enrollments (path_id, trainee_id)
     VALUES ($1, $2)
     ON CONFLICT (path_id, trainee_id) DO NOTHING`,
    [id, session.userId]
  );

  // Find the first workshop with no prerequisite and auto-enroll if published
  const firstWorkshopResult = await pool.query(
    `SELECT w.id, w.status
     FROM learning_path_workshops lpw
     JOIN workshops w ON w.id = lpw.workshop_id
     WHERE lpw.path_id = $1
       AND lpw.prerequisite_workshop_id IS NULL
     ORDER BY lpw.sort_order ASC
     LIMIT 1`,
    [id]
  );

  if (
    firstWorkshopResult.rows.length > 0 &&
    firstWorkshopResult.rows[0].status === "published"
  ) {
    await pool.query(
      `INSERT INTO enrollments (workshop_id, trainee_id)
       VALUES ($1, $2)
       ON CONFLICT (workshop_id, trainee_id) DO NOTHING`,
      [firstWorkshopResult.rows[0].id, session.userId]
    );
  }

  return NextResponse.json({ pathId: id });
}
