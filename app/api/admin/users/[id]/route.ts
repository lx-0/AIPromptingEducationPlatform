import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session.userId || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent admins from disabling themselves
  if (id === session.userId) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
  }

  const body = await request.json();
  const allowed = ["is_disabled", "is_admin"] as const;
  const updates: Record<string, unknown> = {};

  for (const field of allowed) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const setClauses = Object.keys(updates)
    .map((key, i) => `${key} = $${i + 2}`)
    .join(", ");
  const values = [id, ...Object.values(updates)];

  const result = await pool.query(
    `UPDATE users SET ${setClauses} WHERE id = $1
     RETURNING id, email, display_name, role, is_admin, is_disabled`,
    values
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
