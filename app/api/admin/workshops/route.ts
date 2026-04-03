import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/admin/workshops
// List all workshops on the platform (admin only).
// Query params: q, status, limit, offset
export async function GET(request: Request) {
  const session = await getSession();

  if (!session.userId || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const statusFilter = ["draft", "published", "archived"].includes(status) ? status : "";

  const result = await pool.query(
    `SELECT
       w.id,
       w.title,
       w.description,
       w.status,
       w.is_featured,
       w.created_at,
       w.instructor_id,
       u.display_name AS instructor_name,
       u.email AS instructor_email,
       COUNT(DISTINCT e.id)::int AS exercise_count,
       COUNT(DISTINCT s.id)::int AS submission_count
     FROM workshops w
     JOIN users u ON u.id = w.instructor_id
     LEFT JOIN exercises e ON e.workshop_id = w.id
     LEFT JOIN submissions s ON s.exercise_id = e.id
     WHERE ($1 = '' OR w.title ILIKE $1 OR u.email ILIKE $1 OR u.display_name ILIKE $1)
       AND ($2 = '' OR w.status = $2)
     GROUP BY w.id, u.display_name, u.email
     ORDER BY w.created_at DESC
     LIMIT $3 OFFSET $4`,
    [q ? `%${q}%` : "", statusFilter, limit, offset]
  );

  const countResult = await pool.query(
    `SELECT COUNT(DISTINCT w.id)::int AS total
     FROM workshops w
     JOIN users u ON u.id = w.instructor_id
     WHERE ($1 = '' OR w.title ILIKE $1 OR u.email ILIKE $1 OR u.display_name ILIKE $1)
       AND ($2 = '' OR w.status = $2)`,
    [q ? `%${q}%` : "", statusFilter]
  );

  return NextResponse.json({
    workshops: result.rows,
    total: countResult.rows[0].total,
  });
}
