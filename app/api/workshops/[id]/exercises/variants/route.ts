import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/workshops/:id/exercises/variants
// Returns all variant groups for this workshop with per-variant performance stats
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id: workshopId } = await params;
  const session = await getSession();
  if (!session.userId || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify ownership
  const wRes = await pool.query("SELECT id FROM workshops WHERE id = $1 AND instructor_id = $2", [
    workshopId,
    session.userId,
  ]);
  if (!wRes.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await pool.query(
    `SELECT
       e.id,
       e.title,
       e.variant_group,
       e.variant_key,
       COUNT(DISTINCT s.id)::int AS submission_count,
       COUNT(DISTINCT s.trainee_id)::int AS unique_trainees,
       ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1) AS avg_score_pct
     FROM exercises e
     LEFT JOIN submissions s ON s.exercise_id = e.id
     LEFT JOIN scores sc ON sc.submission_id = s.id
     WHERE e.workshop_id = $1
       AND e.variant_group IS NOT NULL
     GROUP BY e.id, e.title, e.variant_group, e.variant_key
     ORDER BY e.variant_group ASC, e.variant_key ASC`,
    [workshopId]
  );

  // Group by variant_group
  const grouped: Record<
    string,
    Array<{
      id: string;
      title: string;
      variant_key: string;
      submission_count: number;
      unique_trainees: number;
      avg_score_pct: number | null;
    }>
  > = {};
  for (const row of result.rows) {
    if (!grouped[row.variant_group]) grouped[row.variant_group] = [];
    grouped[row.variant_group].push({
      id: row.id,
      title: row.title,
      variant_key: row.variant_key ?? "?",
      submission_count: row.submission_count,
      unique_trainees: row.unique_trainees,
      avg_score_pct: row.avg_score_pct != null ? Number(row.avg_score_pct) : null,
    });
  }

  return NextResponse.json({ groups: grouped });
}

// PATCH /api/workshops/:id/exercises/variants
// Set variant_group + variant_key on an exercise
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id: workshopId } = await params;
  const session = await getSession();
  if (!session.userId || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { exercise_id, variant_group, variant_key } = body as {
    exercise_id: string;
    variant_group: string | null;
    variant_key: string | null;
  };

  if (!exercise_id) return NextResponse.json({ error: "exercise_id required" }, { status: 400 });

  // Verify ownership
  const wRes = await pool.query(
    `SELECT e.id FROM exercises e
     JOIN workshops w ON w.id = e.workshop_id
     WHERE e.id = $1 AND e.workshop_id = $2 AND w.instructor_id = $3`,
    [exercise_id, workshopId, session.userId]
  );
  if (!wRes.rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await pool.query(
    "UPDATE exercises SET variant_group = $1, variant_key = $2 WHERE id = $3",
    [variant_group ?? null, variant_key ?? null, exercise_id]
  );

  return NextResponse.json({ ok: true });
}
