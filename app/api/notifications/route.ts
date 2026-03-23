import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);

  const result = await pool.query(
    `SELECT id, type, payload, read, created_at
     FROM notifications
     WHERE user_id = $1 ${unreadOnly ? "AND read = FALSE" : ""}
     ORDER BY created_at DESC
     LIMIT $2`,
    [session.userId, limit]
  );

  const unreadCount = await pool.query(
    "SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read = FALSE",
    [session.userId]
  );

  return NextResponse.json({
    notifications: result.rows,
    unread_count: unreadCount.rows[0].count,
  });
}

// PATCH /api/notifications — mark all as read
export async function PATCH(_request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await pool.query(
    "UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE",
    [session.userId]
  );

  return NextResponse.json({ success: true });
}
