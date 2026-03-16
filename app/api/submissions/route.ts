import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { exercise_id, prompt_text } = body;

  if (!exercise_id || !prompt_text) {
    return NextResponse.json(
      { error: "exercise_id and prompt_text are required" },
      { status: 400 }
    );
  }

  // Verify exercise exists
  const exerciseResult = await pool.query(
    "SELECT id FROM exercises WHERE id = $1",
    [exercise_id]
  );

  if (exerciseResult.rows.length === 0) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  const result = await pool.query(
    `INSERT INTO submissions (exercise_id, trainee_id, prompt_text)
     VALUES ($1, $2, $3) RETURNING *`,
    [exercise_id, session.userId, prompt_text]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
