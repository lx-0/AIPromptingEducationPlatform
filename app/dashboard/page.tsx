import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

type ExerciseProgress = {
  exercise_id: string;
  exercise_title: string;
  sort_order: number;
  status: "not_started" | "submitted" | "scored";
  best_score: number | null;
  max_score: number | null;
  best_score_pct: number | null;
};

type WorkshopProgress = {
  id: string;
  title: string;
  description: string | null;
  enrolled_at: string;
  total_exercises: number;
  completed_exercises: number;
  completion_pct: number;
  exercises: ExerciseProgress[];
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  let workshopProgress: WorkshopProgress[] = [];

  if (session.role === "trainee") {
    // Fetch enrolled workshops
    const workshopsResult = await pool.query<{
      id: string;
      title: string;
      description: string | null;
      enrolled_at: string;
    }>(
      `SELECT w.id, w.title, w.description, e.enrolled_at
       FROM enrollments e
       JOIN workshops w ON w.id = e.workshop_id
       WHERE e.trainee_id = $1
       ORDER BY e.enrolled_at DESC`,
      [session.userId]
    );

    if (workshopsResult.rows.length > 0) {
      const workshopIds = workshopsResult.rows.map((w) => w.id);

      // Fetch per-exercise progress for all enrolled workshops in one query
      const progressResult = await pool.query<{
        workshop_id: string;
        exercise_id: string;
        exercise_title: string;
        sort_order: number;
        submission_id: string | null;
        score_id: string | null;
        best_total_score: string | null;
        best_max_score: string | null;
      }>(
        `SELECT
           e.workshop_id,
           e.id AS exercise_id,
           e.title AS exercise_title,
           e.sort_order,
           s.id AS submission_id,
           sc.id AS score_id,
           CASE WHEN sc.id IS NOT NULL
             THEN MAX(sc.total_score)::text
             ELSE NULL
           END AS best_total_score,
           CASE WHEN sc.id IS NOT NULL
             THEN MAX(sc.max_score)::text
             ELSE NULL
           END AS best_max_score
         FROM exercises e
         LEFT JOIN submissions s ON s.exercise_id = e.id AND s.trainee_id = $1
         LEFT JOIN scores sc ON sc.submission_id = s.id
         WHERE e.workshop_id = ANY($2::uuid[])
         GROUP BY e.workshop_id, e.id, e.title, e.sort_order, s.id, sc.id
         ORDER BY e.workshop_id, e.sort_order ASC`,
        [session.userId, workshopIds]
      );

      // Group exercises by workshop and compute best scores
      const exercisesByWorkshop: Record<string, Map<string, ExerciseProgress>> = {};

      for (const row of progressResult.rows) {
        if (!exercisesByWorkshop[row.workshop_id]) {
          exercisesByWorkshop[row.workshop_id] = new Map();
        }

        const existing = exercisesByWorkshop[row.workshop_id].get(row.exercise_id);
        const rowBestScore = row.best_total_score != null ? parseFloat(row.best_total_score) : null;
        const rowMaxScore = row.best_max_score != null ? parseFloat(row.best_max_score) : null;

        let status: ExerciseProgress["status"] = "not_started";
        if (row.score_id != null) status = "scored";
        else if (row.submission_id != null) status = "submitted";

        if (!existing) {
          exercisesByWorkshop[row.workshop_id].set(row.exercise_id, {
            exercise_id: row.exercise_id,
            exercise_title: row.exercise_title,
            sort_order: row.sort_order,
            status,
            best_score: rowBestScore,
            max_score: rowMaxScore,
            best_score_pct:
              rowBestScore != null && rowMaxScore != null && rowMaxScore > 0
                ? Math.round((rowBestScore / rowMaxScore) * 100)
                : null,
          });
        } else {
          // Keep highest scoring attempt
          if (rowBestScore != null) {
            if (existing.best_score == null || rowBestScore > existing.best_score) {
              existing.best_score = rowBestScore;
              existing.max_score = rowMaxScore;
              existing.best_score_pct =
                rowMaxScore != null && rowMaxScore > 0
                  ? Math.round((rowBestScore / rowMaxScore) * 100)
                  : null;
            }
          }
          // Upgrade status: scored > submitted > not_started
          const rank = { not_started: 0, submitted: 1, scored: 2 };
          if (rank[status] > rank[existing.status]) {
            existing.status = status;
          }
        }
      }

      workshopProgress = workshopsResult.rows.map((w) => {
        const exMap = exercisesByWorkshop[w.id] ?? new Map();
        const exercises = Array.from(exMap.values()).sort(
          (a, b) => a.sort_order - b.sort_order
        );
        const total = exercises.length;
        const completed = exercises.filter((e) => e.status !== "not_started").length;
        return {
          ...w,
          total_exercises: total,
          completed_exercises: completed,
          completion_pct: total > 0 ? Math.round((completed / total) * 100) : 0,
          exercises,
        };
      });
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold text-gray-900">
            PromptingSchool
          </span>
          <form action="/auth/sign-out" method="POST">
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {session.displayName ?? session.email}
        </h1>
        {session.role && (
          <p className="mt-1 text-sm capitalize text-gray-500">
            Role: {session.role}
          </p>
        )}

        <div className="mt-8 space-y-4">
          <Link
            href="/workshops"
            className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300 hover:shadow-sm transition-all text-center"
          >
            <p className="text-sm font-semibold text-blue-600">Browse workshops →</p>
            <p className="mt-1 text-xs text-gray-500">View available workshops and start practising prompts.</p>
          </Link>

          {session.role === "trainee" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">My progress</h2>
              {workshopProgress.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
                  <p className="text-sm">You haven&apos;t joined any workshops yet.</p>
                  <p className="mt-1 text-xs text-gray-400">Use an invite link to join one.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {workshopProgress.map((workshop) => (
                    <li key={workshop.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      {/* Workshop header */}
                      <div className="p-5 border-b border-gray-100">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Link
                              href={`/workshops/${workshop.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {workshop.title}
                            </Link>
                            {workshop.description && (
                              <p className="mt-1 text-sm text-gray-500 truncate">{workshop.description}</p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-sm font-semibold text-gray-900">
                              {workshop.completion_pct}%
                            </span>
                            <p className="text-xs text-gray-400">
                              {workshop.completed_exercises}/{workshop.total_exercises} exercises
                            </p>
                          </div>
                        </div>
                        {/* Overall completion bar */}
                        <div className="mt-3">
                          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-blue-500 transition-all"
                              style={{ width: `${workshop.completion_pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Exercise list */}
                      {workshop.exercises.length > 0 && (
                        <ul className="divide-y divide-gray-50">
                          {workshop.exercises.map((ex) => (
                            <li key={ex.exercise_id}>
                              <Link
                                href={`/workshops/${workshop.id}/exercises/${ex.exercise_id}`}
                                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                              >
                                {/* Status icon */}
                                <StatusBadge status={ex.status} />

                                <span className="flex-1 min-w-0 text-sm text-gray-700 truncate">
                                  {ex.exercise_title}
                                </span>

                                {/* Score */}
                                {ex.status === "scored" && ex.best_score_pct != null ? (
                                  <span
                                    className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                      ex.best_score_pct >= 80
                                        ? "bg-green-100 text-green-700"
                                        : ex.best_score_pct >= 50
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {ex.best_score_pct}%
                                  </span>
                                ) : ex.status === "submitted" ? (
                                  <span className="shrink-0 text-xs text-gray-400">Pending score</span>
                                ) : (
                                  <span className="shrink-0 text-xs text-gray-300">Not started</span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}

                      {workshop.exercises.length === 0 && (
                        <p className="px-5 py-4 text-sm text-gray-400">No exercises yet.</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: ExerciseProgress["status"] }) {
  if (status === "scored") {
    return (
      <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
        <svg className="h-3 w-3 text-green-600" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (status === "submitted") {
    return (
      <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
        <svg className="h-3 w-3 text-blue-500" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="6" cy="6" r="2.5" />
        </svg>
      </span>
    );
  }
  return (
    <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
    </span>
  );
}
