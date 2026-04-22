import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { WORKSHOP_EXPORT_SCHEMA_VERSION } from "@/lib/workshop-schema";

// GET /api/workshops/:id/export
// Downloads the full workshop as a JSON file (metadata + exercises + exercise steps).
// Excludes submission/score data.
export async function GET(
  _request: Request,
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

  const workshopResult = await pool.query(
    `SELECT id, title, description, status, category_id, peer_review_enabled, instructor_id
     FROM workshops WHERE id = $1`,
    [id]
  );
  if (workshopResult.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const workshop = workshopResult.rows[0];
  if (workshop.instructor_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch exercises (excluding user-specific and submission data)
  const exercisesResult = await pool.query(
    `SELECT id, title, instructions, system_prompt, model_config, rubric, sort_order,
            criterion_weights, exercise_type, difficulty, constraints, open_at, close_at,
            variant_group, variant_key
     FROM exercises WHERE workshop_id = $1 ORDER BY sort_order ASC`,
    [id]
  );
  const exercises = exercisesResult.rows;

  // Fetch exercise steps for multi_step exercises
  const exerciseIds = exercises.map((e) => e.id);
  const stepsByExercise: Record<string, { step_number: number; instructions: string; system_prompt: string | null }[]> = {};

  if (exerciseIds.length > 0) {
    const stepsResult = await pool.query(
      `SELECT exercise_id, step_number, instructions, system_prompt
       FROM exercise_steps WHERE exercise_id = ANY($1) ORDER BY exercise_id, step_number ASC`,
      [exerciseIds]
    );
    for (const step of stepsResult.rows) {
      if (!stepsByExercise[step.exercise_id]) {
        stepsByExercise[step.exercise_id] = [];
      }
      stepsByExercise[step.exercise_id].push({
        step_number: step.step_number,
        instructions: step.instructions,
        system_prompt: step.system_prompt,
      });
    }
  }

  // Build export payload
  const exportPayload = {
    schema_version: WORKSHOP_EXPORT_SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    workshop: {
      title: workshop.title,
      description: workshop.description,
      status: workshop.status,
      category_id: workshop.category_id ?? null,
      peer_review_enabled: workshop.peer_review_enabled ?? false,
    },
    exercises: exercises.map((ex) => ({
      title: ex.title,
      instructions: ex.instructions,
      system_prompt: ex.system_prompt ?? null,
      model_config: ex.model_config ?? {},
      rubric: ex.rubric ?? [],
      sort_order: ex.sort_order,
      criterion_weights: ex.criterion_weights ?? {},
      exercise_type: ex.exercise_type ?? "standard",
      difficulty: ex.difficulty ?? "beginner",
      constraints: ex.constraints ?? {},
      open_at: ex.open_at ?? null,
      close_at: ex.close_at ?? null,
      variant_group: ex.variant_group ?? null,
      variant_key: ex.variant_key ?? null,
      steps: stepsByExercise[ex.id] ?? [],
    })),
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="workshop-${id}.json"`,
    },
  });
}
