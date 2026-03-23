import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await pool.query(
    `SELECT wr.id, wr.rating, wr.review_text, wr.created_at,
            p.display_name AS trainee_name, p.avatar_url AS trainee_avatar
     FROM workshop_reviews wr
     JOIN profiles p ON p.id = wr.trainee_id
     WHERE wr.workshop_id = $1
     ORDER BY wr.created_at DESC`,
    [id]
  );

  const statsResult = await pool.query(
    `SELECT
       COALESCE(AVG(rating), 0)::NUMERIC(3,2) AS avg_rating,
       COUNT(*)::INT AS total_reviews,
       COUNT(*) FILTER (WHERE rating = 5)::INT AS five_star,
       COUNT(*) FILTER (WHERE rating = 4)::INT AS four_star,
       COUNT(*) FILTER (WHERE rating = 3)::INT AS three_star,
       COUNT(*) FILTER (WHERE rating = 2)::INT AS two_star,
       COUNT(*) FILTER (WHERE rating = 1)::INT AS one_star
     FROM workshop_reviews WHERE workshop_id = $1`,
    [id]
  );

  return NextResponse.json({
    reviews: result.rows,
    stats: statsResult.rows[0],
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "trainee") {
    return NextResponse.json(
      { error: "Only trainees can leave reviews" },
      { status: 403 }
    );
  }

  // Verify the trainee has at least one submission in this workshop
  const hasSubmission = await pool.query(
    `SELECT 1 FROM submissions sub
     JOIN exercises ex ON ex.id = sub.exercise_id
     WHERE ex.workshop_id = $1 AND sub.trainee_id = $2
     LIMIT 1`,
    [id, session.userId]
  );
  if (hasSubmission.rows.length === 0) {
    return NextResponse.json(
      { error: "You must complete at least one exercise before reviewing" },
      { status: 403 }
    );
  }

  const { rating, review_text } = await request.json();
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `INSERT INTO workshop_reviews (workshop_id, trainee_id, rating, review_text)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (workshop_id, trainee_id) DO NOTHING
     RETURNING *`,
    [id, session.userId, rating, review_text ?? null]
  );

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: "You have already reviewed this workshop" },
      { status: 409 }
    );
  }

  // Recalculate trending score async-style (fire and forget update)
  pool.query(
    `UPDATE workshops SET trending_score = (
       SELECT
         COUNT(DISTINCT sub.trainee_id) * 1.0
         + COUNT(DISTINCT wr.id) * 2.0
         + COALESCE(AVG(wr.rating), 0) * 5.0
         + (
           SELECT COUNT(*) * 3.0
           FROM workshop_reviews wr2
           WHERE wr2.workshop_id = $1
             AND wr2.created_at > NOW() - INTERVAL '7 days'
         )
       FROM workshops w2
       LEFT JOIN exercises ex ON ex.workshop_id = w2.id
       LEFT JOIN submissions sub ON sub.exercise_id = ex.id
       LEFT JOIN workshop_reviews wr ON wr.workshop_id = w2.id
       WHERE w2.id = $1
     )
     WHERE id = $1`,
    [id]
  ).catch(() => {});

  return NextResponse.json(result.rows[0], { status: 201 });
}
