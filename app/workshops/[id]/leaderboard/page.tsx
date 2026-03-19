import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import ThemeToggle from "@/components/ThemeToggle";

type LeaderboardRow = {
  trainee_id: string;
  display_name: string;
  avg_score_pct: number;
  exercises_completed: number;
  badge_count: number;
  current_streak: number;
  rank: number;
};

export default async function WorkshopLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: workshopId } = await params;
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  // Verify the workshop exists
  const workshopResult = await pool.query<{ id: string; title: string; status: string }>(
    "SELECT id, title, status FROM workshops WHERE id = $1",
    [workshopId]
  );
  const workshop = workshopResult.rows[0];
  if (!workshop) notFound();

  // Only trainees enrolled or instructors of this workshop can view
  if (session.role === "trainee") {
    const enrolled = await pool.query(
      "SELECT 1 FROM enrollments WHERE workshop_id = $1 AND trainee_id = $2",
      [workshopId, session.userId]
    );
    if (enrolled.rows.length === 0) {
      redirect(`/workshops/${workshopId}`);
    }
  }

  // Fetch leaderboard data
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

  const leaderboard: LeaderboardRow[] = result.rows.map((row, idx) => ({
    trainee_id: row.trainee_id,
    display_name: row.display_name,
    avg_score_pct: parseFloat(row.avg_score_pct),
    exercises_completed: parseInt(row.exercises_completed, 10),
    badge_count: parseInt(row.badge_count, 10),
    current_streak: row.current_streak ? parseInt(row.current_streak, 10) : 0,
    rank: idx + 1,
  }));

  const currentUserRank = leaderboard.find((r) => r.trainee_id === session.userId);

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav aria-label="Main navigation" className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href={`/workshops/${workshopId}`}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← {workshop.title}
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/docs"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Help
            </Link>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leaderboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{workshop.title}</p>
        </div>

        {/* Current user's rank summary */}
        {currentUserRank && (
          <div className="mb-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 px-6 py-4 flex items-center gap-4">
            <RankBadge rank={currentUserRank.rank} />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Your ranking</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Avg score: {currentUserRank.avg_score_pct}% ·{" "}
                {currentUserRank.exercises_completed} exercise
                {currentUserRank.exercises_completed !== 1 ? "s" : ""} completed ·{" "}
                {currentUserRank.badge_count} badge
                {currentUserRank.badge_count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {leaderboard.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No scores yet. Complete exercises to appear on the leaderboard!
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left w-12">Rank</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-right">Avg Score</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Exercises</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Badges</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {leaderboard.map((row) => {
                  const isMe = row.trainee_id === session.userId;
                  return (
                    <tr
                      key={row.trainee_id}
                      className={isMe ? "bg-blue-50 dark:bg-blue-950" : "hover:bg-gray-50 dark:hover:bg-gray-800"}
                    >
                      <td className="px-4 py-3">
                        <RankBadge rank={row.rank} />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {row.display_name}
                        {isMe && (
                          <span className="ml-2 text-xs text-blue-500 dark:text-blue-400 font-normal">(you)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.avg_score_pct >= 80
                              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                              : row.avg_score_pct >= 50
                              ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                              : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {row.avg_score_pct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                        {row.exercises_completed}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                        {row.badge_count > 0 ? (
                          <span className="text-sm">
                            🏅 {row.badge_count}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                        {row.current_streak > 0 ? (
                          <span className="text-sm">
                            {row.current_streak >= 7 ? "⚡" : "🔥"} {row.current_streak}d
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
          Leaderboard shows trainees with at least one scored submission. Rankings are public to all workshop participants.
        </p>
      </div>
    </main>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <span className="text-lg" aria-label="1st place">🥇</span>;
  }
  if (rank === 2) {
    return <span className="text-lg" aria-label="2nd place">🥈</span>;
  }
  if (rank === 3) {
    return <span className="text-lg" aria-label="3rd place">🥉</span>;
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400">
      {rank}
    </span>
  );
}
