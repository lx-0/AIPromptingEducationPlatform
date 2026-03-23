import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session.userId || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "pending";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const validStatuses = ["pending", "approved", "rejected", "all"];
  const statusFilter = validStatuses.includes(status) ? status : "pending";

  const result = await pool.query(
    `SELECT
       f.id,
       f.content_type,
       f.content_id,
       f.reason,
       f.status,
       f.created_at,
       f.reviewed_at,
       reporter.display_name AS reporter_name,
       reporter.email AS reporter_email,
       reviewer.display_name AS reviewer_name
     FROM flagged_content f
     LEFT JOIN users reporter ON reporter.id = f.reporter_id
     LEFT JOIN users reviewer ON reviewer.id = f.reviewed_by
     WHERE ($1 = 'all' OR f.status = $1)
     ORDER BY f.created_at DESC
     LIMIT $2 OFFSET $3`,
    [statusFilter, limit, offset]
  );

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM flagged_content
     WHERE ($1 = 'all' OR status = $1)`,
    [statusFilter]
  );

  return NextResponse.json({
    items: result.rows,
    total: countResult.rows[0].total,
  });
}

// Report content (any authenticated user)
export async function POST(request: Request) {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { contentType, contentId, reason } = body;

  if (!contentType || !contentId || !reason) {
    return NextResponse.json(
      { error: "contentType, contentId, and reason are required" },
      { status: 400 }
    );
  }

  const validTypes = ["submission", "workshop", "exercise"];
  if (!validTypes.includes(contentType)) {
    return NextResponse.json({ error: "Invalid contentType" }, { status: 400 });
  }

  const result = await pool.query(
    `INSERT INTO flagged_content (reporter_id, content_type, content_id, reason)
     VALUES ($1, $2, $3, $4)
     RETURNING id, content_type, content_id, reason, status, created_at`,
    [session.userId, contentType, contentId, reason]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
