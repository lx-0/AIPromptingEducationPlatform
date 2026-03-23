import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session.userId || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const result = await pool.query(
    `SELECT
       u.id,
       u.email,
       u.display_name,
       u.role,
       u.is_admin,
       u.is_disabled,
       u.created_at,
       s.plan AS subscription_plan,
       s.status AS subscription_status,
       COUNT(DISTINCT w.id)::int AS workshop_count,
       COUNT(DISTINCT sub.id)::int AS submission_count
     FROM users u
     LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
     LEFT JOIN workshops w ON w.instructor_id = u.id
     LEFT JOIN submissions sub ON sub.trainee_id = u.id
     WHERE ($1 = '' OR u.email ILIKE $1 OR u.display_name ILIKE $1)
     GROUP BY u.id, s.plan, s.status
     ORDER BY u.created_at DESC
     LIMIT $2 OFFSET $3`,
    [q ? `%${q}%` : "", limit, offset]
  );

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM users
     WHERE ($1 = '' OR email ILIKE $1 OR display_name ILIKE $1)`,
    [q ? `%${q}%` : ""]
  );

  return NextResponse.json({
    users: result.rows,
    total: countResult.rows[0].total,
  });
}
