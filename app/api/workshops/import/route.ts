import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { isPaidSubscriber, FREE_TIER_LIMITS } from "@/lib/billing";
import { WORKSHOP_EXPORT_SCHEMA_VERSION } from "@/lib/workshop-schema";

interface ExerciseStep {
  step_number: number;
  instructions: string;
  system_prompt?: string | null;
}

interface ExercisePayload {
  title: string;
  instructions: string;
  system_prompt?: string | null;
  model_config?: Record<string, unknown>;
  rubric?: unknown[];
  sort_order?: number;
  criterion_weights?: Record<string, number>;
  exercise_type?: string;
  difficulty?: string;
  constraints?: Record<string, unknown>;
  open_at?: string | null;
  close_at?: string | null;
  variant_group?: string | null;
  variant_key?: string | null;
  steps?: ExerciseStep[];
}

interface WorkshopPayload {
  title: string;
  description?: string | null;
  status?: string;
  category_id?: string | null;
  peer_review_enabled?: boolean;
}

interface ImportBody {
  schema_version?: string;
  workshop: WorkshopPayload;
  exercises: ExercisePayload[];
}

const VALID_EXERCISE_TYPES = ["standard", "multi_step", "comparison", "constrained"];
const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"];

function validateImportBody(body: unknown): { error: string } | { data: ImportBody } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }
  const obj = body as Record<string, unknown>;

  if (obj.schema_version && obj.schema_version !== WORKSHOP_EXPORT_SCHEMA_VERSION) {
    return { error: `Unsupported schema_version. Expected ${WORKSHOP_EXPORT_SCHEMA_VERSION}` };
  }

  const workshop = obj.workshop as WorkshopPayload | undefined;
  if (!workshop || typeof workshop !== "object") {
    return { error: "workshop field is required" };
  }
  if (!workshop.title || typeof workshop.title !== "string") {
    return { error: "workshop.title is required" };
  }

  const exercises = obj.exercises as ExercisePayload[] | undefined;
  if (!Array.isArray(exercises)) {
    return { error: "exercises field must be an array" };
  }

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    if (!ex.title || typeof ex.title !== "string") {
      return { error: `exercises[${i}].title is required` };
    }
    if (!ex.instructions || typeof ex.instructions !== "string") {
      return { error: `exercises[${i}].instructions is required` };
    }
    if (ex.exercise_type && !VALID_EXERCISE_TYPES.includes(ex.exercise_type)) {
      return { error: `exercises[${i}].exercise_type is invalid` };
    }
    if (ex.difficulty && !VALID_DIFFICULTIES.includes(ex.difficulty)) {
      return { error: `exercises[${i}].difficulty is invalid` };
    }
  }

  return { data: obj as unknown as ImportBody };
}

// POST /api/workshops/import
// Body: JSON export object as produced by GET /api/workshops/:id/export
//
// Query params:
//   ?preview=true  — validate and return a summary without persisting anything
//
// Without preview: creates a new workshop (draft status) and returns the created workshop + exercises.
export async function POST(request: Request) {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const preview = searchParams.get("preview") === "true";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = validateImportBody(body);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { workshop: workshopPayload, exercises } = validation.data;

  // Preview: return what would be imported without persisting
  if (preview) {
    return NextResponse.json({
      preview: true,
      workshop: {
        title: workshopPayload.title,
        description: workshopPayload.description ?? null,
        status: "draft",
        peer_review_enabled: workshopPayload.peer_review_enabled ?? false,
      },
      exercise_count: exercises.length,
      exercises: exercises.map((ex, i) => ({
        title: ex.title,
        exercise_type: ex.exercise_type ?? "standard",
        difficulty: ex.difficulty ?? "beginner",
        sort_order: i,
        step_count: ex.steps?.length ?? 0,
      })),
    });
  }

  // Check free-tier workshop limit
  const paid = await isPaidSubscriber(session.userId);
  if (!paid) {
    const workshopCount = await pool.query(
      "SELECT COUNT(*) FROM workshops WHERE instructor_id = $1",
      [session.userId]
    );
    const count = parseInt(workshopCount.rows[0].count, 10);
    if (count >= FREE_TIER_LIMITS.maxWorkshops) {
      return NextResponse.json(
        {
          error: `Free tier is limited to ${FREE_TIER_LIMITS.maxWorkshops} workshops. Upgrade to Pro to import more.`,
          code: "FREE_TIER_LIMIT",
        },
        { status: 402 }
      );
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create workshop in draft status (strip invite_code — DB default generates one)
    const workshopResult = await client.query(
      `INSERT INTO workshops (title, description, instructor_id, status, category_id, peer_review_enabled)
       VALUES ($1, $2, $3, 'draft', $4, $5)
       RETURNING *`,
      [
        workshopPayload.title,
        workshopPayload.description ?? null,
        session.userId,
        workshopPayload.category_id ?? null,
        workshopPayload.peer_review_enabled ?? false,
      ]
    );
    const newWorkshop = workshopResult.rows[0];

    // Insert exercises
    const createdExercises = [];
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const sortOrder = ex.sort_order !== undefined ? ex.sort_order : i;
      const exResult = await client.query(
        `INSERT INTO exercises
           (workshop_id, title, instructions, system_prompt, model_config, rubric,
            sort_order, criterion_weights, exercise_type, difficulty, constraints,
            open_at, close_at, variant_group, variant_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          newWorkshop.id,
          ex.title,
          ex.instructions,
          ex.system_prompt ?? null,
          JSON.stringify(ex.model_config ?? {}),
          JSON.stringify(ex.rubric ?? []),
          sortOrder,
          JSON.stringify(ex.criterion_weights ?? {}),
          ex.exercise_type ?? "standard",
          ex.difficulty ?? "beginner",
          JSON.stringify(ex.constraints ?? {}),
          ex.open_at ?? null,
          ex.close_at ?? null,
          ex.variant_group ?? null,
          ex.variant_key ?? null,
        ]
      );
      const newExercise = exResult.rows[0];
      createdExercises.push(newExercise);

      // Insert steps for multi_step exercises
      if (
        (ex.exercise_type === "multi_step" || newExercise.exercise_type === "multi_step") &&
        Array.isArray(ex.steps) &&
        ex.steps.length > 0
      ) {
        for (const step of ex.steps) {
          await client.query(
            `INSERT INTO exercise_steps (exercise_id, step_number, instructions, system_prompt)
             VALUES ($1, $2, $3, $4)`,
            [newExercise.id, step.step_number, step.instructions, step.system_prompt ?? null]
          );
        }
      }
    }

    await client.query("COMMIT");
    return NextResponse.json(
      { workshop: newWorkshop, exercises: createdExercises },
      { status: 201 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Workshop import error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}
