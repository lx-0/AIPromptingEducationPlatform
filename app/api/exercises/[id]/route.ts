import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

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
    "SELECT * FROM exercises WHERE id = $1",
    [id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    open_at,
    close_at,
    criterion_weights,
  } = body;

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (title !== undefined) { setClauses.push(`title = $${paramIdx++}`); values.push(title); }
  if (instructions !== undefined) { setClauses.push(`instructions = $${paramIdx++}`); values.push(instructions); }
  if (system_prompt !== undefined) { setClauses.push(`system_prompt = $${paramIdx++}`); values.push(system_prompt); }
  if (model_config !== undefined) { setClauses.push(`model_config = $${paramIdx++}`); values.push(JSON.stringify(model_config)); }
  if (rubric !== undefined) { setClauses.push(`rubric = $${paramIdx++}`); values.push(JSON.stringify(rubric)); }
  if (sort_order !== undefined) { setClauses.push(`sort_order = $${paramIdx++}`); values.push(sort_order); }
  if (exercise_type !== undefined) { setClauses.push(`exercise_type = $${paramIdx++}`); values.push(exercise_type); }
  if (difficulty !== undefined) { setClauses.push(`difficulty = $${paramIdx++}`); values.push(difficulty); }
  if (constraints !== undefined) { setClauses.push(`constraints = $${paramIdx++}`); values.push(JSON.stringify(constraints)); }
  if (open_at !== undefined) { setClauses.push(`open_at = $${paramIdx++}`); values.push(open_at ?? null); }
  if (close_at !== undefined) { setClauses.push(`close_at = $${paramIdx++}`); values.push(close_at ?? null); }
  if (criterion_weights !== undefined) { setClauses.push(`criterion_weights = $${paramIdx++}`); values.push(JSON.stringify(criterion_weights)); }

  if (setClauses.length === 0 && steps === undefined) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let exerciseRow = null;
    if (setClauses.length > 0) {
      values.push(id);
      const result = await client.query(
        `UPDATE exercises SET ${setClauses.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
        values
      );
      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      exerciseRow = result.rows[0];
    } else {
      const result = await client.query("SELECT * FROM exercises WHERE id = $1", [id]);
      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      exerciseRow = result.rows[0];
    }

    // Replace steps if provided (multi_step exercises)
    if (steps !== undefined && Array.isArray(steps)) {
      await client.query("DELETE FROM exercise_steps WHERE exercise_id = $1", [id]);
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await client.query(
          `INSERT INTO exercise_steps (exercise_id, step_number, instructions, system_prompt)
           VALUES ($1, $2, $3, $4)`,
          [id, i, step.instructions, step.system_prompt ?? null]
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json(exerciseRow);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await pool.query("DELETE FROM exercises WHERE id = $1", [id]);

  return new NextResponse(null, { status: 204 });
}
