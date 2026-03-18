import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import PublishPanel from "./PublishPanel";

type Exercise = {
  id: string;
  title: string;
  sort_order: number;
};

type Workshop = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  instructor_id: string;
  invite_code: string | null;
};

type WorkshopStats = {
  total_submissions: string;
  unique_trainees: string;
  avg_score_pct: string | null;
  enrolled_count: string;
};

type ExerciseStat = {
  exercise_id: string;
  exercise_title: string;
  sort_order: number;
  submission_count: string;
  unique_submitters: string;
  avg_score_pct: string | null;
};

export default async function WorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  const workshopResult = await pool.query<Workshop>(
    "SELECT id, title, description, status, instructor_id, invite_code FROM workshops WHERE id = $1",
    [id]
  );
  const workshop = workshopResult.rows[0];

  if (!workshop) {
    notFound();
  }

  const isOwner = session.role === "instructor" && workshop.instructor_id === session.userId;

  const exercisesResult = await pool.query<Exercise>(
    "SELECT id, title, sort_order FROM exercises WHERE workshop_id = $1 ORDER BY sort_order ASC",
    [id]
  );
  const exercises = exercisesResult.rows;

  let workshopStats: WorkshopStats | null = null;
  let exerciseStats: ExerciseStat[] = [];

  if (isOwner) {
    const [statsResult, exerciseStatsResult] = await Promise.all([
      pool.query<WorkshopStats>(
        `SELECT
           COUNT(DISTINCT s.id)::text AS total_submissions,
           COUNT(DISTINCT s.trainee_id)::text AS unique_trainees,
           ROUND(AVG(sc.total_score / NULLIF(sc.max_score, 0) * 100), 1)::text AS avg_score_pct,
           (SELECT COUNT(*)::text FROM enrollments WHERE workshop_id = $1) AS enrolled_count
         FROM exercises e
         LEFT JOIN submissions s ON s.exercise_id = e.id
         LEFT JOIN scores sc ON sc.submission_id = s.id
         WHERE e.workshop_id = $1`,
        [id]
      ),
      pool.query<ExerciseStat>(
        `SELECT
           e.id AS exercise_id,
           e.title AS exercise_title,
           e.sort_order,
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
    ]);
    workshopStats = statsResult.rows[0] ?? null;
    exerciseStats = exerciseStatsResult.rows;
  }

  const enrolledCount = workshopStats ? Number(workshopStats.enrolled_count) : 0;
  const completionPct =
    workshopStats && enrolledCount > 0
      ? Math.round((Number(workshopStats.unique_trainees) / enrolledCount) * 100)
      : null;

  return (
    <main id="main-content" className="min-h-screen bg-gray-50">
      <nav aria-label="Main navigation" className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold text-gray-900 hover:text-gray-700">
            PromptingSchool
          </Link>
          <form action="/auth/sign-out" method="POST">
            <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-2">
          <Link href="/workshops" className="text-sm text-blue-600 hover:underline">
            ← All workshops
          </Link>
        </div>

        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{workshop.title}</h1>
              <WorkshopStatusBadge status={workshop.status} />
            </div>
            {workshop.description && (
              <p className="mt-2 text-sm text-gray-600">{workshop.description}</p>
            )}
          </div>
          {isOwner && (
            <Link
              href={`/workshops/${id}/submissions`}
              className="shrink-0 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              View submissions →
            </Link>
          )}
        </div>

        {isOwner && (workshop.status === "draft" || workshop.status === "published") && (
          <div className="mt-6">
            <PublishPanel
              workshopId={id}
              status={workshop.status}
              inviteCode={workshop.invite_code}
            />
          </div>
        )}

        {isOwner && workshopStats && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h2>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total submissions</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{workshopStats.total_submissions}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Avg score</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {workshopStats.avg_score_pct != null ? `${workshopStats.avg_score_pct}%` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Completion</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {completionPct != null ? `${completionPct}%` : "—"}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {workshopStats.unique_trainees} of {enrolledCount} enrolled
                </p>
              </div>
            </div>

            {/* Per-exercise stats */}
            {exerciseStats.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Exercise</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Submissions</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Unique trainees</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Avg score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {exerciseStats.map((stat, index) => (
                      <tr key={stat.exercise_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{stat.exercise_title}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{stat.submission_count}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{stat.unique_submitters}</td>
                        <td className="px-4 py-3 text-right">
                          {stat.avg_score_pct != null ? (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              {stat.avg_score_pct}%
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Exercises</h2>
            {isOwner && (
              <Link
                href={`/workshops/${id}/exercises/new`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                + Add exercise
              </Link>
            )}
          </div>

          {exercises.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
              <p className="text-sm">No exercises in this workshop yet.</p>
              {isOwner && (
                <Link
                  href={`/workshops/${id}/exercises/new`}
                  className="mt-3 inline-block text-sm text-blue-600 hover:underline"
                >
                  Add the first exercise →
                </Link>
              )}
            </div>
          ) : (
            <ol className="space-y-3">
              {exercises.map((exercise, index) => (
                <li key={exercise.id}>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/workshops/${id}/exercises/${exercise.id}`}
                      className="flex flex-1 items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-4 hover:border-blue-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                        {index + 1}
                      </span>
                      <span className="text-gray-900 font-medium">{exercise.title}</span>
                      <span className="ml-auto text-xs text-blue-600">Start →</span>
                    </Link>
                    {isOwner && (
                      <Link
                        href={`/workshops/${id}/exercises/${exercise.id}/edit`}
                        className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </main>
  );
}

function WorkshopStatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        Published
      </span>
    );
  }
  if (status === "archived") {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        Archived
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
      Draft
    </span>
  );
}
