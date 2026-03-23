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
  const body = await request.json();
  const { status } = body;

  const validStatuses = ["approved", "rejected"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "status must be 'approved' or 'rejected'" },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `UPDATE flagged_content
     SET status = $1, reviewed_by = $2, reviewed_at = NOW()
     WHERE id = $3
     RETURNING id, content_type, content_id, reason, status, reviewed_at`,
    [status, session.userId, id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
