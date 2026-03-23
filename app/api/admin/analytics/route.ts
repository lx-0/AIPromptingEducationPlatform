import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session.userId || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [funnel, dau, wau, mau, revenueOverTime] = await Promise.all([
    // Funnel: signups → enrollments → first submission → completions
    pool.query(`
      WITH signups AS (
        SELECT COUNT(*)::int AS cnt FROM users WHERE role = 'trainee'
      ),
      enrolled AS (
        SELECT COUNT(DISTINCT trainee_id)::int AS cnt FROM enrollments
      ),
      first_sub AS (
        SELECT COUNT(DISTINCT trainee_id)::int AS cnt FROM submissions
      ),
      completed AS (
        SELECT COUNT(DISTINCT s.trainee_id)::int AS cnt
        FROM submissions s
        JOIN exercises e ON s.exercise_id = e.id
        JOIN (
          SELECT workshop_id, COUNT(*)::int AS total_exercises
          FROM exercises
          GROUP BY workshop_id
        ) ex_counts ON e.workshop_id = ex_counts.workshop_id
        JOIN enrollments en ON en.trainee_id = s.trainee_id AND en.workshop_id = e.workshop_id
        GROUP BY s.trainee_id, ex_counts.total_exercises, en.workshop_id
        HAVING COUNT(DISTINCT s.exercise_id) >= ex_counts.total_exercises
      )
      SELECT
        signups.cnt   AS signups,
        enrolled.cnt  AS enrolled,
        first_sub.cnt AS submitted,
        completed.cnt AS completed
      FROM signups, enrolled, first_sub, completed
    `),

    // Daily active users (last 30 days)
    pool.query(`
      SELECT
        DATE_TRUNC('day', submitted_at)::date::text AS date,
        COUNT(DISTINCT trainee_id)::int AS dau
      FROM submissions
      WHERE submitted_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', submitted_at)
      ORDER BY date ASC
    `),

    // Weekly active users (last 12 weeks)
    pool.query(`
      SELECT
        DATE_TRUNC('week', submitted_at)::date::text AS week,
        COUNT(DISTINCT trainee_id)::int AS wau
      FROM submissions
      WHERE submitted_at > NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', submitted_at)
      ORDER BY week ASC
    `),

    // Monthly active users (last 12 months)
    pool.query(`
      SELECT
        DATE_TRUNC('month', submitted_at)::date::text AS month,
        COUNT(DISTINCT trainee_id)::int AS mau
      FROM submissions
      WHERE submitted_at > NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', submitted_at)
      ORDER BY month ASC
    `),

    // Revenue over time: new subscriptions per month (last 12 months)
    pool.query(`
      SELECT
        DATE_TRUNC('month', created_at)::date::text AS month,
        COUNT(*)::int AS new_subscriptions,
        COUNT(*) FILTER (WHERE plan = 'pro')::int  AS pro,
        COUNT(*) FILTER (WHERE plan = 'team')::int AS team
      FROM subscriptions
      WHERE created_at > NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `),
  ]);

  return NextResponse.json({
    funnel: funnel.rows[0] ?? { signups: 0, enrolled: 0, submitted: 0, completed: 0 },
    dau: dau.rows,
    wau: wau.rows,
    mau: mau.rows,
    revenueOverTime: revenueOverTime.rows,
  });
}
