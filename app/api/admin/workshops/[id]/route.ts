import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// PATCH /api/admin/workshops/[id]
// Update a workshop's status or featured flag (admin only).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session.userId || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const allowed = ["status", "is_featured"] as const;
  const validStatuses = ["draft", "published", "archived"];
  const updates: Record<string, unknown> = {};

  for (const field of allowed) {
    if (field in body) {
      if (field === "status" && !validStatuses.includes(body[field])) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
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
    `UPDATE workshops SET ${setClauses} WHERE id = $1
     RETURNING id, title, status, is_featured`,
    values
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Workshop not found" }, { status: 404 });
  }

  // Audit log
  await pool.query(
    `INSERT INTO admin_audit_log (admin_id, action, entity_type, entity_id, changes)
     VALUES ($1, $2, 'workshop', $3, $4)`,
    [session.userId, "update_workshop", id, JSON.stringify(updates)]
  ).catch(() => {
    // Non-fatal: log failure should not block the response
  });

  return NextResponse.json(result.rows[0]);
}
