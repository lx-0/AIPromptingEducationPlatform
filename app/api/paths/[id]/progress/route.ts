import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// GET /api/paths/[id]/progress — get trainee progress for a learning path
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify path exists and is accessible
  const pathResult = await pool.query(
    "SELECT id, status FROM learning_paths WHERE id = $1",
    [id]
  );

  if (pathResult.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get workshops in the path with per-workshop completion for this trainee
  const result = await pool.query(
    `SELECT
       lpw.sort_order,
       lpw.prerequisite_workshop_id,
       w.id AS workshop_id,
       w.title AS workshop_title,
       pw.title AS prerequisite_title,
       COUNT(DISTINCT e.id)::int AS total_exercises,
       COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN e.id END)::int AS submitted_exercises,
       EXISTS(
         SELECT 1 FROM enrollments en
         WHERE en.workshop_id = w.id AND en.trainee_id = $2
       ) AS is_enrolled
     FROM learning_path_workshops lpw
     JOIN workshops w ON w.id = lpw.workshop_id
     LEFT JOIN workshops pw ON pw.id = lpw.prerequisite_workshop_id
     LEFT JOIN exercises e ON e.workshop_id = w.id
     LEFT JOIN submissions s ON s.exercise_id = e.id AND s.trainee_id = $2
     WHERE lpw.path_id = $1
     GROUP BY lpw.sort_order, lpw.prerequisite_workshop_id, w.id, pw.title
     ORDER BY lpw.sort_order ASC`,
    [id, session.userId]
  );

  // Build a set of completed workshop IDs for unlock logic
  const completedWorkshopIds = new Set<string>();
  for (const row of result.rows) {
    if (row.total_exercises > 0 && row.submitted_exercises >= row.total_exercises) {
      completedWorkshopIds.add(row.workshop_id);
    }
  }

  const workshops = result.rows.map((row) => {
    const isCompleted = completedWorkshopIds.has(row.workshop_id);
    const isUnlocked =
      !row.prerequisite_workshop_id ||
      completedWorkshopIds.has(row.prerequisite_workshop_id);

    return {
      workshop_id: row.workshop_id,
      workshop_title: row.workshop_title,
      sort_order: row.sort_order,
      prerequisite_workshop_id: row.prerequisite_workshop_id,
      prerequisite_title: row.prerequisite_title,
      total_exercises: row.total_exercises,
      submitted_exercises: row.submitted_exercises,
      completion_pct:
        row.total_exercises > 0
          ? Math.round((row.submitted_exercises / row.total_exercises) * 100)
          : 0,
      is_completed: isCompleted,
      is_unlocked: isUnlocked,
      is_enrolled: row.is_enrolled,
    };
  });

  const totalWorkshops = workshops.length;
  const completedWorkshops = workshops.filter((w) => w.is_completed).length;

  return NextResponse.json({
    path_id: id,
    total_workshops: totalWorkshops,
    completed_workshops: completedWorkshops,
    completion_pct:
      totalWorkshops > 0
        ? Math.round((completedWorkshops / totalWorkshops) * 100)
        : 0,
    workshops,
  });
}
