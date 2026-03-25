import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import dynamic from "next/dynamic";
import ThemeToggle from "@/components/ThemeToggle";
import type { ScoreTrendPoint, CriterionStrength, WorkshopProgress } from "./ProgressCharts";

const ProgressCharts = dynamic(() => import("./ProgressCharts"), {
  loading: () => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 text-center text-sm text-gray-400">
      Loading your report…
    </div>
  ),
});

export const metadata = { title: "My Progress — AI Prompting Education Platform" };

export default async function ProgressPage() {
  const session = await getSession();
  if (!session.userId) redirect("/auth/sign-in");
  if (session.role !== "trainee") redirect("/dashboard");

  const userId = session.userId;

  const [overviewResult, scoreTrendResult, criterionResult, workshopProgressResult] =
    await Promise.all([
      // Overall stats
      pool.query<{ total_submissions: string; scored_submissions: string; avg_score_pct: string | null; workshops_enrolled: string }>(
        `SELECT
           COUNT(DISTINCT s.id)::text AS total_submissions,
           COUNT(DISTINCT sc.id)::text AS scored_submissions,
           ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1)::text AS avg_score_pct,
           COUNT(DISTINCT e2.workshop_id)::text AS workshops_enrolled
         FROM submissions s
         LEFT JOIN scores sc ON sc.submission_id = s.id
         LEFT JOIN exercises e2 ON e2.id = s.exercise_id
         WHERE s.trainee_id = $1`,
        [userId]
      ),

      // Score trend: daily avg over last 90 days
      pool.query<{ date: string; avg_score_pct: string }>(
        `SELECT
           DATE_TRUNC('day', s.submitted_at)::date::text AS date,
           ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1)::text AS avg_score_pct
         FROM submissions s
         JOIN scores sc ON sc.submission_id = s.id
         WHERE s.trainee_id = $1
           AND s.submitted_at > NOW() - INTERVAL '90 days'
         GROUP BY DATE_TRUNC('day', s.submitted_at)
         ORDER BY date ASC`,
        [userId]
      ),

      // Criterion performance (strengths & weaknesses)
      pool.query<{ criterion: string; avg_pct: string; submission_count: string }>(
        `SELECT
           (crit->>'criterion') AS criterion,
           ROUND(AVG((crit->>'score')::numeric / NULLIF((rubric_item->>'max_points')::numeric, 0) * 100), 1)::text AS avg_pct,
           COUNT(*)::text AS submission_count
         FROM submissions s
         JOIN scores sc ON sc.submission_id = s.id
         JOIN exercises e ON s.exercise_id = e.id
         JOIN LATERAL jsonb_array_elements(sc.feedback->'criteria') AS crit ON true
         JOIN LATERAL jsonb_array_elements(e.rubric) AS rubric_item
           ON rubric_item->>'criterion' = crit->>'criterion'
         WHERE s.trainee_id = $1
         GROUP BY crit->>'criterion'
         ORDER BY avg_pct DESC`,
        [userId]
      ),

      // Per-workshop progress
      pool.query<{
        workshop_id: string;
        workshop_title: string;
        completed: string;
        total: string;
        avg_score_pct: string | null;
      }>(
        `SELECT
           w.id AS workshop_id,
           w.title AS workshop_title,
           COUNT(DISTINCT s.exercise_id)::text AS completed,
           (SELECT COUNT(*)::text FROM exercises WHERE workshop_id = w.id) AS total,
           ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1)::text AS avg_score_pct
         FROM enrollments en
         JOIN workshops w ON w.id = en.workshop_id
         LEFT JOIN exercises ex ON ex.workshop_id = w.id
         LEFT JOIN submissions s ON s.exercise_id = ex.id AND s.trainee_id = en.trainee_id
         LEFT JOIN scores sc ON sc.submission_id = s.id
         WHERE en.trainee_id = $1
         GROUP BY w.id, w.title
         ORDER BY w.title ASC`,
        [userId]
      ),
    ]);

  const overview = overviewResult.rows[0];
  const scoreTrend: ScoreTrendPoint[] = scoreTrendResult.rows.map((r) => ({
    date: r.date,
    avg_score_pct: Number(r.avg_score_pct),
  }));

  const allCriteria: CriterionStrength[] = criterionResult.rows.map((r) => ({
    criterion: r.criterion,
    avg_pct: Number(r.avg_pct),
    submission_count: Number(r.submission_count),
  }));

  const strengths = allCriteria.slice(0, 5);
  const weaknesses = [...allCriteria].sort((a, b) => a.avg_pct - b.avg_pct).slice(0, 5);

  const workshopProgress: WorkshopProgress[] = workshopProgressResult.rows.map((r) => ({
    workshop_id: r.workshop_id,
    workshop_title: r.workshop_title,
    completed: Number(r.completed),
    total: Number(r.total),
    avg_score_pct: r.avg_score_pct != null ? Number(r.avg_score_pct) : null,
  }));

  const overallScore = overview?.avg_score_pct ? Number(overview.avg_score_pct) : null;
  const scoreColor =
    overallScore == null
      ? "text-gray-900 dark:text-white"
      : overallScore >= 80
      ? "text-green-600 dark:text-green-400"
      : overallScore >= 60
      ? "text-blue-600 dark:text-blue-400"
      : overallScore >= 40
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-red-600 dark:text-red-400";

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav aria-label="Main navigation" className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300">
            PromptingSchool
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/docs" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
              Help
            </Link>
            <form action="/auth/sign-out" method="POST">
              <button type="submit" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-2">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← Dashboard
          </Link>
        </div>

        <div className="flex flex-wrap items-start gap-3 mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Progress</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Your personal performance report — strengths, areas to improve, and trends.
            </p>
          </div>
          <a
            href="/api/progress/report/pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Download PDF
          </a>
        </div>

        {/* Overview stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Submissions</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {overview?.total_submissions ?? "0"}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Scored</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {overview?.scored_submissions ?? "0"}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Avg score</p>
            <p className={`mt-1 text-3xl font-bold ${scoreColor}`}>
              {overallScore != null ? `${overallScore}%` : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Workshops</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {overview?.workshops_enrolled ?? "0"}
            </p>
          </div>
        </div>

        {Number(overview?.total_submissions ?? 0) === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No submissions yet. Enroll in a workshop and start submitting to see your progress here.
            </p>
          </div>
        ) : (
          <ProgressCharts
            scoreTrend={scoreTrend}
            strengths={strengths}
            weaknesses={weaknesses}
            workshopProgress={workshopProgress}
          />
        )}
      </div>
    </main>
  );
}
