import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

interface ExerciseImport {
  title: string;
  instructions: string;
  system_prompt?: string;
  model_config?: Record<string, unknown>;
  rubric?: unknown[];
  sort_order?: number;
  criterion_weights?: Record<string, number>;
}

// POST /api/workshops/:id/exercises/import
// Body: JSON array of exercise objects (as produced by the export endpoint).
// Appends exercises after existing ones.
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

  let exercises: ExerciseImport[];
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Body must be a JSON array" }, { status: 400 });
    }
    exercises = body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (exercises.length === 0) {
    return NextResponse.json({ error: "No exercises to import" }, { status: 400 });
  }

  // Validate each exercise
  for (const ex of exercises) {
    if (!ex.title || typeof ex.title !== "string") {
      return NextResponse.json({ error: "Each exercise must have a title" }, { status: 400 });
    }
    if (!ex.instructions || typeof ex.instructions !== "string") {
      return NextResponse.json({ error: "Each exercise must have instructions" }, { status: 400 });
    }
  }

  // Get current max sort_order so imported exercises are appended
  const maxResult = await pool.query(
    "SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM exercises WHERE workshop_id = $1",
    [id]
  );
  let nextOrder = (maxResult.rows[0].max_order as number) + 1;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const created = [];
    for (const ex of exercises) {
      const res = await client.query(
        `INSERT INTO exercises (workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order, criterion_weights)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          id,
          ex.title,
          ex.instructions,
          ex.system_prompt ?? null,
          JSON.stringify(ex.model_config ?? {}),
          JSON.stringify(ex.rubric ?? []),
          nextOrder++,
          JSON.stringify(ex.criterion_weights ?? {}),
        ]
      );
      created.push(res.rows[0]);
    }
    await client.query("COMMIT");
    return NextResponse.json({ imported: created.length, exercises: created }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Exercise import error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
