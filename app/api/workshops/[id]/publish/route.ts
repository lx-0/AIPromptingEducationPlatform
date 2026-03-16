import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate a unique invite code (8 hex chars) if not already set
  const inviteCode = randomBytes(4).toString("hex");

  const result = await pool.query(
    `UPDATE workshops
     SET status = 'published',
         invite_code = COALESCE(invite_code, $1)
     WHERE id = $2
     RETURNING *`,
    [inviteCode, id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
