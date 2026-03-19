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
  const { title, instructions, system_prompt, model_config, rubric, sort_order } = body;

  if (!title || !instructions) {
    return NextResponse.json(
      { error: "title and instructions are required" },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `INSERT INTO exercises (workshop_id, title, instructions, system_prompt, model_config, rubric, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      id,
      title,
      instructions,
      system_prompt ?? null,
      JSON.stringify(model_config ?? {}),
      JSON.stringify(rubric ?? []),
      sort_order ?? 0,
    ]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
