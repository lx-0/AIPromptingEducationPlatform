import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/session";

type LeaderboardRow = {
  trainee_id: string;
  display_name: string;
  avg_score_pct: number;
  exercises_completed: number;
  badge_count: number;
  current_streak: number;
  rank: number;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workshopId } = await params;
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Leaderboard: trainees enrolled in this workshop ranked by avg score
  // Opt-in: only include trainees who have at least one scored submission
  const result = await pool.query<{
    trainee_id: string;
    display_name: string;
    avg_score_pct: string;
    exercises_completed: string;
    badge_count: string;
    current_streak: string | null;
  }>(
    `SELECT
       u.id                                               AS trainee_id,
       u.display_name,
       ROUND(AVG(sc.total_score / sc.max_score * 100), 1)::text AS avg_score_pct,
       COUNT(DISTINCT s.exercise_id)::text               AS exercises_completed,
       COUNT(DISTINCT ub.id)::text                       AS badge_count,
       st.current_streak::text                           AS current_streak
     FROM enrollments en
     JOIN users u        ON u.id = en.trainee_id
     JOIN exercises ex   ON ex.workshop_id = en.workshop_id
     JOIN submissions s  ON s.exercise_id = ex.id AND s.trainee_id = u.id
     JOIN scores sc      ON sc.submission_id = s.id
     LEFT JOIN user_badges ub ON ub.trainee_id = u.id
     LEFT JOIN streaks st     ON st.trainee_id = u.id
     WHERE en.workshop_id = $1
     GROUP BY u.id, u.display_name, st.current_streak
     ORDER BY AVG(sc.total_score / sc.max_score) DESC, COUNT(DISTINCT s.exercise_id) DESC`,
    [workshopId]
  );

  const rows: LeaderboardRow[] = result.rows.map((row, idx) => ({
    trainee_id: row.trainee_id,
    display_name: row.display_name,
    avg_score_pct: parseFloat(row.avg_score_pct),
    exercises_completed: parseInt(row.exercises_completed, 10),
    badge_count: parseInt(row.badge_count, 10),
    current_streak: row.current_streak ? parseInt(row.current_streak, 10) : 0,
    rank: idx + 1,
  }));

  return NextResponse.json({ leaderboard: rows, currentUserId: session.userId });
}
