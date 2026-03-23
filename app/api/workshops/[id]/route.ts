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
    "SELECT * FROM workshops WHERE id = $1",
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
  const { title, description, category_id, is_featured } = body;

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (title !== undefined) {
    setClauses.push(`title = $${paramIdx++}`);
    values.push(title);
  }
  if (description !== undefined) {
    setClauses.push(`description = $${paramIdx++}`);
    values.push(description);
  }
  if (category_id !== undefined) {
    setClauses.push(`category_id = $${paramIdx++}`);
    values.push(category_id || null);
  }
  if (is_featured !== undefined) {
    setClauses.push(`is_featured = $${paramIdx++}`);
    values.push(Boolean(is_featured));
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE workshops SET ${setClauses.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
