import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import AnalyticsChartsWrapper from "./AnalyticsChartsWrapper";
import ThemeToggle from "@/components/ThemeToggle";
import dynamic from "next/dynamic";
import type {
  SubmissionTrendPoint,
  ScoreBucket,
  ExerciseStat,
  RubricWeakness,
  LeaderboardEntry,
} from "./AnalyticsCharts";
import type { CohortStat } from "./CohortComparison";

const CohortComparisonWidget = dynamic(() => import("./CohortComparison"), {
  loading: () => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center text-sm text-gray-400">
      Loading cohort data…
    </div>
  ),
});

type Workshop = {
  id: string;
  title: string;
  status: string;
  instructor_id: string;
};

type OverviewStats = {
  enrolled_count: string;
  total_submissions: string;
  unique_trainees: string;
  avg_score_pct: string | null;
  total_exercises: string;
};

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  if (session.role !== "instructor") {
    redirect("/dashboard");
  }

  const workshopResult = await pool.query<Workshop>(
    "SELECT id, title, status, instructor_id FROM workshops WHERE id = $1 AND instructor_id = $2",
    [id, session.userId]
  );

  const workshop = workshopResult.rows[0];
  if (!workshop) {
    notFound();
  }

  // Run all analytics queries in parallel
  const [
    overviewResult,
    trendResult,
    distributionResult,
    exerciseStatsResult,
    rubricResult,
    leaderboardResult,
    cohortResult,
  ] = await Promise.all([
    // Overview
    pool.query<OverviewStats>(
      `SELECT
         (SELECT COUNT(*)::text FROM enrollments WHERE workshop_id = $1) AS enrolled_count,
         COUNT(DISTINCT s.id)::text AS total_submissions,
         COUNT(DISTINCT s.trainee_id)::text AS unique_trainees,
         ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1)::text AS avg_score_pct,
         (SELECT COUNT(*)::text FROM exercises WHERE workshop_id = $1) AS total_exercises
       FROM exercises e
       LEFT JOIN submissions s ON s.exercise_id = e.id
       LEFT JOIN scores sc ON sc.submission_id = s.id
       WHERE e.workshop_id = $1`,
      [id]
    ),

    // Submissions per day
    pool.query<{ date: string; count: string }>(
      `SELECT
         DATE_TRUNC('day', s.submitted_at)::date::text AS date,
         COUNT(*)::text AS count
       FROM submissions s
       JOIN exercises e ON s.exercise_id = e.id
       WHERE e.workshop_id = $1
       GROUP BY DATE_TRUNC('day', s.submitted_at)
       ORDER BY date ASC`,
      [id]
    ),

    // Score distribution in 20-point buckets
    pool.query<{ bucket: string; count: string }>(
      `SELECT
         CASE
           WHEN (sc.total_score / NULLIF(sc.max_score, 0) * 100) < 20 THEN '0–20%'
           WHEN (sc.total_score / NULLIF(sc.max_score, 0) * 100) < 40 THEN '20–40%'
           WHEN (sc.total_score / NULLIF(sc.max_score, 0) * 100) < 60 THEN '40–60%'
           WHEN (sc.total_score / NULLIF(sc.max_score, 0) * 100) < 80 THEN '60–80%'
           ELSE '80–100%'
         END AS bucket,
         COUNT(*)::text AS count
       FROM scores sc
       JOIN submissions s ON sc.submission_id = s.id
       JOIN exercises e ON s.exercise_id = e.id
       WHERE e.workshop_id = $1
       GROUP BY bucket
       ORDER BY bucket ASC`,
      [id]
    ),

    // Per-exercise stats
    pool.query<{
      exercise_id: string;
      exercise_title: string;
      sort_order: string;
      submission_count: string;
      unique_submitters: string;
      avg_score_pct: string | null;
    }>(
      `SELECT
         e.id AS exercise_id,
         e.title AS exercise_title,
         e.sort_order::text AS sort_order,
         COUNT(DISTINCT s.id)::text AS submission_count,
         COUNT(DISTINCT s.trainee_id)::text AS unique_submitters,
         ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1)::text AS avg_score_pct
       FROM exercises e
       LEFT JOIN submissions s ON s.exercise_id = e.id
       LEFT JOIN scores sc ON sc.submission_id = s.id
       WHERE e.workshop_id = $1
       GROUP BY e.id, e.title, e.sort_order
       ORDER BY e.sort_order ASC`,
      [id]
    ),

    // Rubric criterion averages per exercise
    pool.query<{
      exercise_id: string;
      exercise_title: string;
      criterion: string;
      max_points: string;
      avg_score: string;
    }>(
      `SELECT
         e.id AS exercise_id,
         e.title AS exercise_title,
         (crit->>'criterion') AS criterion,
         (rubric_item->>'max_points')::numeric AS max_points,
         ROUND(AVG((crit->>'score')::numeric), 2) AS avg_score
       FROM exercises e
       JOIN submissions s ON s.exercise_id = e.id
       JOIN scores sc ON sc.submission_id = s.id
       JOIN LATERAL jsonb_array_elements(sc.feedback->'criteria') AS crit ON true
       JOIN LATERAL jsonb_array_elements(e.rubric) AS rubric_item
         ON rubric_item->>'criterion' = crit->>'criterion'
       WHERE e.workshop_id = $1
       GROUP BY e.id, e.title, e.sort_order, crit->>'criterion', rubric_item->>'max_points'
       ORDER BY e.sort_order ASC, avg_score / NULLIF((rubric_item->>'max_points')::numeric, 0) ASC`,
      [id]
    ),

    // Trainee leaderboard
    pool.query<{
      trainee_id: string;
      display_name: string;
      avg_score_pct: string;
      exercises_completed: string;
    }>(
      `SELECT
         u.id AS trainee_id,
         u.display_name,
         ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1)::text AS avg_score_pct,
         COUNT(DISTINCT s.exercise_id)::text AS exercises_completed
       FROM users u
       JOIN submissions s ON s.trainee_id = u.id
       JOIN exercises e ON s.exercise_id = e.id
       JOIN scores sc ON sc.submission_id = s.id
       WHERE e.workshop_id = $1
       GROUP BY u.id, u.display_name
       ORDER BY avg_score_pct DESC`,
      [id]
    ),

    // Cohort comparison
    pool.query<{
      cohort_id: string;
      cohort_name: string;
      enrolled: string;
      submitted: string;
      completed: string;
      avg_score_pct: string | null;
    }>(
      `SELECT
         c.id AS cohort_id,
         c.name AS cohort_name,
         COUNT(DISTINCT cm.trainee_id)::text AS enrolled,
         COUNT(DISTINCT s.trainee_id)::text AS submitted,
         COALESCE((
           SELECT COUNT(DISTINCT s2.trainee_id)::text
           FROM cohort_members cm2
           JOIN submissions s2 ON s2.trainee_id = cm2.trainee_id
           JOIN exercises e2 ON s2.exercise_id = e2.id
           WHERE cm2.cohort_id = c.id AND e2.workshop_id = $1
           GROUP BY cm2.trainee_id
           HAVING COUNT(DISTINCT s2.exercise_id) >= (
             SELECT COUNT(*) FROM exercises WHERE workshop_id = $1
           )
         ), '0') AS completed,
         ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1)::text AS avg_score_pct
       FROM cohorts c
       JOIN cohort_members cm ON cm.cohort_id = c.id
       LEFT JOIN submissions s ON s.trainee_id = cm.trainee_id
         AND s.exercise_id IN (SELECT id FROM exercises WHERE workshop_id = $1)
       LEFT JOIN scores sc ON sc.submission_id = s.id
       WHERE c.workshop_id = $1
       GROUP BY c.id, c.name
       ORDER BY c.created_at ASC`,
      [id]
    ),
  ]);

  const overview = overviewResult.rows[0];
  const enrolledCount = Number(overview?.enrolled_count ?? 0);
  const uniqueTrainees = Number(overview?.unique_trainees ?? 0);
  const totalExercises = Number(overview?.total_exercises ?? 0);
  const completionPct =
    enrolledCount > 0 && totalExercises > 0
      ? Math.round(
          (leaderboardResult.rows.filter(
            (r) => Number(r.exercises_completed) >= totalExercises
          ).length /
            enrolledCount) *
            100
        )
      : null;

  const submissionTrend: SubmissionTrendPoint[] = trendResult.rows.map(
    (r) => ({ date: r.date, count: Number(r.count) })
  );

  const scoreDistribution: ScoreBucket[] = [
    "0–20%",
    "20–40%",
    "40–60%",
    "60–80%",
    "80–100%",
  ].map((bucket) => {
    const found = distributionResult.rows.find((r) => r.bucket === bucket);
    return { bucket, count: found ? Number(found.count) : 0 };
  });

  const exerciseStats: ExerciseStat[] = exerciseStatsResult.rows.map((r) => ({
    exercise_id: r.exercise_id,
    exercise_title: r.exercise_title,
    sort_order: Number(r.sort_order),
    submission_count: Number(r.submission_count),
    unique_submitters: Number(r.unique_submitters),
    avg_score_pct: r.avg_score_pct != null ? Number(r.avg_score_pct) : null,
  }));

  const rubricWeaknesses: RubricWeakness[] = rubricResult.rows.map((r) => {
    const maxPoints = Number(r.max_points);
    const avgScore = Number(r.avg_score);
    return {
      exercise_id: r.exercise_id,
      exercise_title: r.exercise_title,
      criterion: r.criterion,
      max_points: maxPoints,
      avg_score: avgScore,
      avg_pct: maxPoints > 0 ? Math.round((avgScore / maxPoints) * 100) : 0,
    };
  });

  const leaderboard: LeaderboardEntry[] = leaderboardResult.rows.map((r) => ({
    trainee_id: r.trainee_id,
    display_name: r.display_name,
    avg_score_pct: Number(r.avg_score_pct),
    exercises_completed: Number(r.exercises_completed),
  }));

  const cohortStats: CohortStat[] = cohortResult.rows.map((r) => ({
    cohort_id: r.cohort_id,
    cohort_name: r.cohort_name,
    enrolled: Number(r.enrolled),
    submitted: Number(r.submitted),
    completed: Number(r.completed),
    avg_score_pct: r.avg_score_pct != null ? Number(r.avg_score_pct) : null,
  }));

  const hasData = Number(overview?.total_submissions ?? 0) > 0;

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav aria-label="Main navigation" className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300"
          >
            PromptingSchool
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/docs"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Help
            </Link>
            <form action="/auth/sign-out" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-2">
          <Link
            href={`/workshops/${id}`}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← {workshop.title}
          </Link>
        </div>

        <div className="flex flex-wrap items-start gap-3 mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Workshop performance overview and trainee insights.
            </p>
          </div>
          <a
            href={`/api/workshops/${id}/analytics`}
            download
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Export CSV
          </a>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Enrolled
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {enrolledCount}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Submissions
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {overview?.total_submissions ?? "0"}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Avg score
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {overview?.avg_score_pct != null
                ? `${overview.avg_score_pct}%`
                : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Completion
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {completionPct != null ? `${completionPct}%` : "—"}
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {uniqueTrainees} of {enrolledCount} active
            </p>
          </div>
        </div>

        {!hasData ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No submissions yet. Charts will appear once trainees start
              submitting.
            </p>
          </div>
        ) : (
          <AnalyticsChartsWrapper
            workshopId={id}
            submissionTrend={submissionTrend}
            scoreDistribution={scoreDistribution}
            exerciseStats={exerciseStats}
            rubricWeaknesses={rubricWeaknesses}
            leaderboard={leaderboard}
          />
        )}

        {/* Cohort comparison */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Cohort Comparison
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Compare score distributions and completion rates across cohorts in this workshop.
          </p>
          <CohortComparisonWidget cohorts={cohortStats} totalExercises={totalExercises} />
        </section>

        {/* PDF report link */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <a
            href={`/api/workshops/${id}/report`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            Download PDF Report
          </a>
        </div>
      </div>
    </main>
  );
}
