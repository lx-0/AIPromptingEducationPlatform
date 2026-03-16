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
  const { title, instructions, system_prompt, model_config, rubric, sort_order } = body;

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (title !== undefined) { setClauses.push(`title = $${paramIdx++}`); values.push(title); }
  if (instructions !== undefined) { setClauses.push(`instructions = $${paramIdx++}`); values.push(instructions); }
  if (system_prompt !== undefined) { setClauses.push(`system_prompt = $${paramIdx++}`); values.push(system_prompt); }
  if (model_config !== undefined) { setClauses.push(`model_config = $${paramIdx++}`); values.push(JSON.stringify(model_config)); }
  if (rubric !== undefined) { setClauses.push(`rubric = $${paramIdx++}`); values.push(JSON.stringify(rubric)); }
  if (sort_order !== undefined) { setClauses.push(`sort_order = $${paramIdx++}`); values.push(sort_order); }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE exercises SET ${setClauses.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
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
