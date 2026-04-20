import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { isPaidSubscriber, FREE_TIER_LIMITS } from "@/lib/billing";
import { z } from "zod";

const createExerciseSchema = z.object({
  title: z.string().min(1, "title is required").max(255),
  instructions: z.string().min(1, "instructions is required"),
  system_prompt: z.string().optional(),
  model_config: z.record(z.unknown()).optional(),
  rubric: z.array(z.unknown()).optional(),
  sort_order: z.number().int().optional(),
  exercise_type: z.enum(["standard", "multi_step", "comparison", "constrained"]).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  constraints: z.record(z.unknown()).optional(),
  steps: z.array(z.object({
    instructions: z.string(),
    system_prompt: z.string().optional(),
  })).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    "SELECT * FROM exercises WHERE workshop_id = $1 ORDER BY sort_order ASC",
    [id]
  );

  return NextResponse.json(result.rows);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerCheck = await pool.query(
    "SELECT instructor_id FROM workshops WHERE id = $1",
    [id]
  );
  if (ownerCheck.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (ownerCheck.rows[0].instructor_id !== session.userId && !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Enforce free-tier exercises-per-workshop limit
  const paid = await isPaidSubscriber(session.userId);
  if (!paid) {
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM exercises WHERE workshop_id = $1",
      [id]
    );
    const count = parseInt(countResult.rows[0].count, 10);
    if (count >= FREE_TIER_LIMITS.maxExercisesPerWorkshop) {
      return NextResponse.json(
        {
          error: `Free tier is limited to ${FREE_TIER_LIMITS.maxExercisesPerWorkshop} exercises per workshop. Upgrade to Pro to add more.`,
          code: "FREE_TIER_LIMIT",
        },
        { status: 402 }
      );
    }
  }

  const raw = await request.json();
  const parsed = createExerciseSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const {
    title,
    instructions,
    system_prompt,
    model_config,
    rubric,
    sort_order,
    exercise_type,
    difficulty,
    constraints,
    steps,
  } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO exercises
         (workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order,
          exercise_type, difficulty, constraints)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        id,
        title,
        instructions,
        system_prompt ?? null,
        JSON.stringify(model_config ?? {}),
        JSON.stringify(rubric ?? []),
        sort_order ?? 0,
        exercise_type ?? "standard",
        difficulty ?? "beginner",
        JSON.stringify(constraints ?? {}),
      ]
    );

    const exercise = result.rows[0];

    // Insert steps for multi_step exercises
    if (
      (exercise_type === "multi_step" || exercise.exercise_type === "multi_step") &&
      Array.isArray(steps) &&
      steps.length > 0
    ) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await client.query(
          `INSERT INTO exercise_steps (exercise_id, step_number, instructions, system_prompt)
           VALUES ($1, $2, $3, $4)`,
          [exercise.id, i, step.instructions, step.system_prompt ?? null]
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json(exercise, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
