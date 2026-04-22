// GET /api/activity — activity feed for the current user's dashboard
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);

  if (session.role === "trainee") {
    // Feed for trainees: own submissions, achievements, discussions, new workshops from followed instructors
    const result = await pool.query(
      `-- Recent submissions by this trainee
       SELECT
         'submission' AS type,
         s.id AS entity_id,
         s.submitted_at AS created_at,
         e.title AS exercise_title,
         e.id AS exercise_id,
         e.workshop_id,
         w.title AS workshop_title,
         NULL AS instructor_name,
         CASE WHEN sc.id IS NOT NULL
           THEN ROUND((sc.total_score / NULLIF(sc.max_score, 0)) * 100)::int
           ELSE NULL
         END AS score_pct,
         NULL::text AS body
       FROM submissions s
       JOIN exercises e ON e.id = s.exercise_id
       JOIN workshops w ON w.id = e.workshop_id
       LEFT JOIN scores sc ON sc.submission_id = s.id
       WHERE s.trainee_id = $1

       UNION ALL

       -- Discussions created by this trainee
       SELECT
         'discussion' AS type,
         d.id AS entity_id,
         d.created_at,
         e.title AS exercise_title,
         e.id AS exercise_id,
         e.workshop_id,
         w.title AS workshop_title,
         NULL AS instructor_name,
         NULL::int AS score_pct,
         LEFT(d.body, 120) AS body
       FROM discussions d
       JOIN exercises e ON e.id = d.exercise_id
       JOIN workshops w ON w.id = e.workshop_id
       WHERE d.author_id = $1

       UNION ALL

       -- New workshops from followed instructors
       SELECT
         'new_workshop' AS type,
         w.id AS entity_id,
         w.created_at,
         NULL AS exercise_title,
         NULL::uuid AS exercise_id,
         w.id AS workshop_id,
         w.title AS workshop_title,
         p.display_name AS instructor_name,
         NULL::int AS score_pct,
         LEFT(w.description, 120) AS body
       FROM follows f
       JOIN workshops w ON w.instructor_id = f.instructor_id AND w.status = 'published'
       JOIN profiles p ON p.id = w.instructor_id
       WHERE f.follower_id = $1

       ORDER BY created_at DESC
       LIMIT $2`,
      [session.userId, limit]
    );

    return NextResponse.json({ activities: result.rows });
  }

  // Feed for instructors: enrollments, submissions, reviews of their workshops
  const result = await pool.query(
    `-- New enrollments in instructor's workshops
     SELECT
       'enrollment' AS type,
       en.workshop_id AS entity_id,
       en.enrolled_at AS created_at,
       NULL AS exercise_title,
       NULL::uuid AS exercise_id,
       en.workshop_id,
       w.title AS workshop_title,
       p.display_name AS trainee_name,
       NULL::int AS score_pct,
       NULL::text AS body
     FROM enrollments en
     JOIN workshops w ON w.id = en.workshop_id
     JOIN profiles p ON p.id = en.trainee_id
     WHERE w.instructor_id = $1

     UNION ALL

     -- Recent workshop reviews
     SELECT
       'review' AS type,
       wr.id AS entity_id,
       wr.created_at,
       NULL AS exercise_title,
       NULL::uuid AS exercise_id,
       wr.workshop_id,
       w.title AS workshop_title,
       p.display_name AS trainee_name,
       wr.rating AS score_pct,
       LEFT(wr.review_text, 120) AS body
     FROM workshop_reviews wr
     JOIN workshops w ON w.id = wr.workshop_id
     JOIN profiles p ON p.id = wr.trainee_id
     WHERE w.instructor_id = $1

     UNION ALL

     -- Discussions on instructor's exercises
     SELECT
       'discussion' AS type,
       d.id AS entity_id,
       d.created_at,
       e.title AS exercise_title,
       e.id AS exercise_id,
       e.workshop_id,
       w.title AS workshop_title,
       p.display_name AS trainee_name,
       NULL AS score_pct,
       LEFT(d.body, 120) AS body
     FROM discussions d
     JOIN exercises e ON e.id = d.exercise_id
     JOIN workshops w ON w.id = e.workshop_id
     JOIN profiles p ON p.id = d.author_id
     WHERE w.instructor_id = $1 AND d.author_id <> $1

     ORDER BY created_at DESC
     LIMIT $2`,
    [session.userId, limit]
  );

  return NextResponse.json({ activities: result.rows });
}
