import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/workshops/:id/variant-assign
// Body: { variant_group: string }
// Returns the exercise assigned to this trainee for the given variant group.
// Creates an assignment if none exists (randomly picks among variants).
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id: workshopId } = await params;
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { variant_group } = (await req.json()) as { variant_group: string };
  if (!variant_group) return NextResponse.json({ error: "variant_group required" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check existing assignment
    const existing = await client.query(
      `SELECT eva.exercise_id, e.title, e.variant_key
       FROM exercise_variant_assignments eva
       JOIN exercises e ON e.id = eva.exercise_id
       WHERE eva.workshop_id = $1 AND eva.trainee_id = $2 AND eva.variant_group = $3`,
      [workshopId, session.userId, variant_group]
    );

    if (existing.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.json({
        exercise_id: existing.rows[0].exercise_id,
        title: existing.rows[0].title,
        variant_key: existing.rows[0].variant_key,
        assigned: false,
      });
    }

    // Pick a random variant
    const variants = await client.query(
      `SELECT id, title, variant_key FROM exercises
       WHERE workshop_id = $1 AND variant_group = $2`,
      [workshopId, variant_group]
    );

    if (variants.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "No variants found" }, { status: 404 });
    }

    const picked = variants.rows[Math.floor(Math.random() * variants.rows.length)];

    await client.query(
      `INSERT INTO exercise_variant_assignments (workshop_id, trainee_id, variant_group, exercise_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (workshop_id, trainee_id, variant_group) DO NOTHING`,
      [workshopId, session.userId, variant_group, picked.id]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      exercise_id: picked.id,
      title: picked.title,
      variant_key: picked.variant_key,
      assigned: true,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
