import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session.userId || !session.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [users, workshops, submissions, revenue, recentActivity] = await Promise.all([
    // User counts by role
    pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE role = 'instructor')::int AS instructors,
        COUNT(*) FILTER (WHERE role = 'trainee')::int AS trainees,
        COUNT(*) FILTER (WHERE is_disabled = TRUE)::int AS disabled,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS new_last_7d
      FROM users
    `),

    // Workshop counts
    pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'published')::int AS published,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
        COUNT(*) FILTER (WHERE status = 'archived')::int AS archived
      FROM workshops
    `),

    // Submission counts
    pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE submitted_at > NOW() - INTERVAL '7 days')::int AS last_7d,
        COUNT(*) FILTER (WHERE submitted_at > NOW() - INTERVAL '30 days')::int AS last_30d
      FROM submissions
    `),

    // Revenue (active subscriptions)
    pool.query(`
      SELECT
        COUNT(*)::int AS active_subscriptions,
        COUNT(*) FILTER (WHERE plan = 'pro')::int AS pro_count,
        COUNT(*) FILTER (WHERE plan = 'team')::int AS team_count
      FROM subscriptions
      WHERE status = 'active'
    `),

    // Recent activity (last 10 events: new users + new submissions)
    pool.query(`
      SELECT * FROM (
        SELECT
          'new_user' AS event_type,
          id AS entity_id,
          display_name AS label,
          created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      ) u
      UNION ALL
      SELECT * FROM (
        SELECT
          'submission' AS event_type,
          s.id AS entity_id,
          e.title AS label,
          s.submitted_at AS created_at
        FROM submissions s
        JOIN exercises e ON e.id = s.exercise_id
        ORDER BY s.submitted_at DESC
        LIMIT 5
      ) sub
      ORDER BY created_at DESC
      LIMIT 10
    `),
  ]);

  return NextResponse.json({
    users: users.rows[0],
    workshops: workshops.rows[0],
    submissions: submissions.rows[0],
    revenue: revenue.rows[0],
    recentActivity: recentActivity.rows,
  });
}
