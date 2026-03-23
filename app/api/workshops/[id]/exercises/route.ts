import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";
import { isPaidSubscriber, FREE_TIER_LIMITS } from "@/lib/billing";

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

  const body = await request.json();
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
  } = body;

  if (!title || !instructions) {
    return NextResponse.json(
      { error: "title and instructions are required" },
      { status: 400 }
    );
  }

  const validTypes = ["standard", "multi_step", "comparison", "constrained"];
  if (exercise_type && !validTypes.includes(exercise_type)) {
    return NextResponse.json({ error: "Invalid exercise_type" }, { status: 400 });
  }

  const validDifficulties = ["beginner", "intermediate", "advanced"];
  if (difficulty && !validDifficulties.includes(difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
  }

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
