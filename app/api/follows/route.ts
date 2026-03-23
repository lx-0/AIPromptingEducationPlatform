// GET /api/follows — list instructors the current trainee follows
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    `SELECT f.instructor_id, f.created_at,
            p.display_name AS instructor_name, p.avatar_url AS instructor_avatar,
            p.bio AS instructor_bio,
            COUNT(DISTINCT w.id)::int AS workshop_count
     FROM follows f
     JOIN profiles p ON p.id = f.instructor_id
     LEFT JOIN workshops w ON w.instructor_id = f.instructor_id AND w.status = 'published'
     WHERE f.follower_id = $1
     GROUP BY f.instructor_id, f.created_at, p.display_name, p.avatar_url, p.bio
     ORDER BY f.created_at DESC`,
    [session.userId]
  );

  return NextResponse.json({ follows: result.rows });
}
