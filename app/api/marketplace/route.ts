import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Public marketplace endpoint - no auth required
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const difficulty = searchParams.get("difficulty") ?? "";
  const sort = searchParams.get("sort") ?? "trending";
  const minRating = parseFloat(searchParams.get("minRating") ?? "0");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions: string[] = ["w.status = 'published'"];
  const values: unknown[] = [];
  let idx = 1;

  if (q) {
    conditions.push(`(w.title ILIKE $${idx} OR w.description ILIKE $${idx})`);
    values.push(`%${q}%`);
    idx++;
  }
  if (category) {
    conditions.push(`wc.slug = $${idx++}`);
    values.push(category);
  }
  if (difficulty) {
    // difficulty is stored on exercises; find workshops that have exercises of this difficulty
    conditions.push(`EXISTS (
      SELECT 1 FROM exercises e
      WHERE e.workshop_id = w.id AND e.difficulty = $${idx++}
    )`);
    values.push(difficulty);
  }
  if (minRating > 0) {
    conditions.push(`COALESCE(AVG(wr.rating), 0) >= $${idx++}`);
    values.push(minRating);
  }

  const where = conditions.join(" AND ");

  const orderMap: Record<string, string> = {
    trending:   "w.trending_score DESC",
    newest:     "w.created_at DESC",
    rating:     "avg_rating DESC NULLS LAST",
    popularity: "enrollment_count DESC",
  };
  const orderBy = orderMap[sort] ?? orderMap.trending;

  const sql = `
    SELECT
      w.id,
      w.title,
      w.description,
      w.created_at,
      w.is_featured,
      w.trending_score,
      wc.id          AS category_id,
      wc.name        AS category_name,
      wc.slug        AS category_slug,
      wc.icon        AS category_icon,
      p.id           AS instructor_id,
      p.display_name AS instructor_name,
      p.avatar_url   AS instructor_avatar,
      COALESCE(AVG(wr.rating), 0)::NUMERIC(3,2) AS avg_rating,
      COUNT(DISTINCT wr.id)::INT                AS review_count,
      COUNT(DISTINCT sub.trainee_id)::INT       AS enrollment_count,
      COUNT(DISTINCT ex.id)::INT                AS exercise_count,
      ARRAY_AGG(DISTINCT wt.name) FILTER (WHERE wt.name IS NOT NULL) AS tags,
      -- difficulty: most common difficulty across exercises
      (
        SELECT ex2.difficulty
        FROM exercises ex2
        WHERE ex2.workshop_id = w.id AND ex2.difficulty IS NOT NULL
        GROUP BY ex2.difficulty
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS difficulty
    FROM workshops w
    LEFT JOIN workshop_categories wc ON wc.id = w.category_id
    LEFT JOIN profiles p              ON p.id  = w.instructor_id
    LEFT JOIN workshop_reviews wr     ON wr.workshop_id = w.id
    LEFT JOIN exercises ex            ON ex.workshop_id = w.id
    LEFT JOIN submissions sub         ON sub.exercise_id = ex.id
    LEFT JOIN workshop_tag_links wtl  ON wtl.workshop_id = w.id
    LEFT JOIN workshop_tags wt        ON wt.id = wtl.tag_id
    WHERE ${where}
    GROUP BY w.id, wc.id, p.id, p.display_name, p.avatar_url
    HAVING ${minRating > 0 ? `COALESCE(AVG(wr.rating), 0) >= ${minRating}` : "TRUE"}
    ORDER BY ${orderBy}
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  values.push(limit, offset);

  const [rows, countResult] = await Promise.all([
    pool.query(sql, values),
    pool.query(
      `SELECT COUNT(DISTINCT w.id) FROM workshops w
       LEFT JOIN workshop_categories wc ON wc.id = w.category_id
       LEFT JOIN workshop_reviews wr ON wr.workshop_id = w.id
       LEFT JOIN exercises ex ON ex.workshop_id = w.id
       WHERE ${where}`,
      values.slice(0, -2) // exclude limit/offset
    ),
  ]);

  const total = parseInt(countResult.rows[0].count, 10);

  return NextResponse.json(
    {
      workshops: rows.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
    {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=30" },
    }
  );
}
