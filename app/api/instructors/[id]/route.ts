import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Public instructor profile - no auth required
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const profileResult = await pool.query(
    `SELECT p.id, p.display_name, p.bio, p.avatar_url, p.created_at
     FROM profiles p
     WHERE p.id = $1 AND p.role = 'instructor'`,
    [id]
  );

  if (profileResult.rows.length === 0) {
    return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
  }

  const instructor = profileResult.rows[0];

  const workshopsResult = await pool.query(
    `SELECT
       w.id, w.title, w.description, w.created_at, w.is_featured,
       wc.name        AS category_name,
       wc.slug        AS category_slug,
       wc.icon        AS category_icon,
       COALESCE(AVG(wr.rating), 0)::NUMERIC(3,2) AS avg_rating,
       COUNT(DISTINCT wr.id)::INT                AS review_count,
       COUNT(DISTINCT sub.trainee_id)::INT       AS enrollment_count,
       COUNT(DISTINCT ex.id)::INT                AS exercise_count,
       ARRAY_AGG(DISTINCT wt.name) FILTER (WHERE wt.name IS NOT NULL) AS tags
     FROM workshops w
     LEFT JOIN workshop_categories wc ON wc.id = w.category_id
     LEFT JOIN workshop_reviews wr     ON wr.workshop_id = w.id
     LEFT JOIN exercises ex            ON ex.workshop_id = w.id
     LEFT JOIN submissions sub         ON sub.exercise_id = ex.id
     LEFT JOIN workshop_tag_links wtl  ON wtl.workshop_id = w.id
     LEFT JOIN workshop_tags wt        ON wt.id = wtl.tag_id
     WHERE w.instructor_id = $1 AND w.status = 'published'
     GROUP BY w.id, wc.id
     ORDER BY w.created_at DESC`,
    [id]
  );

  const statsResult = await pool.query(
    `SELECT
       COUNT(DISTINCT w.id)::INT                    AS total_workshops,
       COUNT(DISTINCT sub.trainee_id)::INT          AS total_trainees,
       COALESCE(AVG(wr.rating), 0)::NUMERIC(3,2)   AS avg_rating,
       COUNT(DISTINCT wr.id)::INT                   AS total_reviews
     FROM workshops w
     LEFT JOIN exercises ex  ON ex.workshop_id = w.id
     LEFT JOIN submissions sub ON sub.exercise_id = ex.id
     LEFT JOIN workshop_reviews wr ON wr.workshop_id = w.id
     WHERE w.instructor_id = $1 AND w.status = 'published'`,
    [id]
  );

  return NextResponse.json(
    {
      instructor,
      workshops: workshopsResult.rows,
      stats: statsResult.rows[0],
    },
    {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" },
    }
  );
}
