import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import GamificationPanel from "@/components/GamificationPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { getSubscription } from "@/lib/billing";
import ActivityFeed from "@/components/ActivityFeed";
import PeerReviewPanel from "@/components/PeerReviewPanel";
import NotificationBell from "@/components/NotificationBell";

type InstructorWorkshop = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  exercise_count: string;
  enrolled_count: string;
  created_at: string;
};

type FeaturedWorkshop = {
  id: string;
  title: string;
  description: string | null;
  instructor_name: string;
  category_name: string | null;
  category_icon: string | null;
  exercise_count: number;
};

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

  const subscription = session.role === "instructor"
    ? await getSubscription(session.userId)
    : null;

  let workshopProgress: WorkshopProgress[] = [];
  let instructorWorkshops: InstructorWorkshop[] = [];
  let featuredWorkshops: FeaturedWorkshop[] = [];

  if (session.role === "instructor") {
    const [ownResult, featuredResult] = await Promise.all([
      pool.query<InstructorWorkshop>(
        `SELECT
           w.id, w.title, w.description, w.status, w.created_at,
           COUNT(DISTINCT e.id)::text AS exercise_count,
           COUNT(DISTINCT en.trainee_id)::text AS enrolled_count
         FROM workshops w
         LEFT JOIN exercises e ON e.workshop_id = w.id
         LEFT JOIN enrollments en ON en.workshop_id = w.id
         WHERE w.instructor_id = $1
         GROUP BY w.id
         ORDER BY w.created_at DESC`,
        [session.userId]
      ),
      pool.query<FeaturedWorkshop>(
        `SELECT
           w.id, w.title, w.description,
           u.display_name AS instructor_name,
           wc.name AS category_name,
           wc.icon AS category_icon,
           COUNT(DISTINCT e.id)::int AS exercise_count
         FROM workshops w
         JOIN users u ON u.id = w.instructor_id
         LEFT JOIN workshop_categories wc ON wc.id = w.category_id
         LEFT JOIN exercises e ON e.workshop_id = w.id
         WHERE w.status = 'published' AND w.instructor_id <> $1
         GROUP BY w.id, u.display_name, wc.name, wc.icon
         ORDER BY w.is_featured DESC, w.trending_score DESC
         LIMIT 8`,
        [session.userId]
      ),
    ]);
    instructorWorkshops = ownResult.rows;
    featuredWorkshops = featuredResult.rows;
  }

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
    <main id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav aria-label="Main navigation" className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            PromptingSchool
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />
            <Link
              href="/docs"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Help
            </Link>
            {session.role === "instructor" && (
              <Link
                href="/billing"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              >
                {subscription?.isActive ? "Billing" : "Upgrade"}
              </Link>
            )}
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome, {session.displayName ?? session.email}
        </h1>
        {session.role && (
          <p className="mt-1 text-sm capitalize text-gray-500 dark:text-gray-400">
            Role: {session.role}
          </p>
        )}

        <div className="mt-8 space-y-8">
          {session.role === "instructor" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My workshops</h2>
                <div className="flex items-center gap-2">
                  <Link
                    href="/paths"
                    className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Learning paths
                  </Link>
                  <Link
                    href="/workshops/new"
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    + Create workshop
                  </Link>
                </div>
              </div>

              {instructorWorkshops.length === 0 ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No workshops yet.</p>
                  <Link
                    href="/workshops/new"
                    className="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Create your first workshop →
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {instructorWorkshops.map((w) => (
                    <li key={w.id}>
                      <Link
                        href={`/workshops/${w.id}`}
                        className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{w.title}</p>
                          {w.description && (
                            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">{w.description}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {w.exercise_count} exercise{w.exercise_count !== "1" ? "s" : ""} · {w.enrolled_count} enrolled
                          </p>
                        </div>
                        <WorkshopStatusBadge status={w.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {session.role === "instructor" && featuredWorkshops.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Featured workshops</h2>
                <Link
                  href="/marketplace"
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Browse marketplace →
                </Link>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featuredWorkshops.map((w) => (
                  <li key={w.id}>
                    <Link
                      href={`/workshops/${w.id}`}
                      className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
                    >
                      <div className="flex items-start gap-3">
                        {w.category_icon && (
                          <span className="text-xl mt-0.5">{w.category_icon}</span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{w.title}</p>
                          {w.description && (
                            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{w.description}</p>
                          )}
                          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                            {w.category_name} · {w.exercise_count} exercises · by {w.instructor_name}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {session.role === "trainee" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/workshops"
                className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
              >
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Browse workshops →</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">View available workshops and start practising prompts.</p>
              </Link>
              <Link
                href="/paths"
                className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-sm transition-all text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
              >
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Learning paths →</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Follow a guided curriculum across multiple workshops.</p>
              </Link>
              <Link
                href="/dashboard/certificates"
                className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 hover:border-yellow-300 dark:hover:border-yellow-600 hover:shadow-sm transition-all text-center focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
              >
                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">My certificates →</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">View and download certificates you&apos;ve earned.</p>
              </Link>
            </div>
          )}

          {session.role === "trainee" && (
            <GamificationPanel />
          )}

          {/* Peer review assignments for trainees */}
          {session.role === "trainee" && workshopProgress.length > 0 && (
            <PeerReviewPanel
              workshopId={workshopProgress[0].id}
              isInstructor={false}
            />
          )}

          {/* Activity feed */}
          <ActivityFeed />

          {session.role === "trainee" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">My progress</h2>
              {workshopProgress.length === 0 ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-sm">You haven&apos;t joined any workshops yet.</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Use an invite link to join one.</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {workshopProgress.map((workshop) => (
                    <li key={workshop.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                      {/* Workshop header */}
                      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Link
                              href={`/workshops/${workshop.id}`}
                              className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {workshop.title}
                            </Link>
                            {workshop.description && (
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">{workshop.description}</p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {workshop.completion_pct}%
                            </span>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {workshop.completed_exercises}/{workshop.total_exercises} exercises
                            </p>
                          </div>
                        </div>
                        {/* Overall completion bar */}
                        <div className="mt-3">
                          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-blue-500 transition-all"
                              style={{ width: `${workshop.completion_pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Exercise list */}
                      {workshop.exercises.length > 0 && (
                        <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                          {workshop.exercises.map((ex) => (
                            <li key={ex.exercise_id}>
                              <Link
                                href={`/workshops/${workshop.id}/exercises/${ex.exercise_id}`}
                                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                              >
                                {/* Status icon */}
                                <StatusBadge status={ex.status} />

                                <span className="flex-1 min-w-0 text-sm text-gray-700 dark:text-gray-300 truncate">
                                  {ex.exercise_title}
                                </span>

                                {/* Score */}
                                {ex.status === "scored" && ex.best_score_pct != null ? (
                                  <span
                                    className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                      ex.best_score_pct >= 80
                                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                                        : ex.best_score_pct >= 50
                                        ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
                                        : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                                    }`}
                                  >
                                    {ex.best_score_pct}%
                                  </span>
                                ) : ex.status === "submitted" ? (
                                  <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">Pending score</span>
                                ) : (
                                  <span className="shrink-0 text-xs text-gray-300 dark:text-gray-600">Not started</span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}

                      {workshop.exercises.length === 0 && (
                        <p className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500">No exercises yet.</p>
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
      <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
        <svg className="h-3 w-3 text-green-600 dark:text-green-400" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (status === "submitted") {
    return (
      <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
        <svg className="h-3 w-3 text-blue-500 dark:text-blue-400" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="6" cy="6" r="2.5" />
        </svg>
      </span>
    );
  }
  return (
    <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
    </span>
  );
}

function WorkshopStatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="shrink-0 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
        Published
      </span>
    );
  }
  if (status === "archived") {
    return (
      <span className="shrink-0 inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
        Archived
      </span>
    );
  }
  return (
    <span className="shrink-0 inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-300">
      Draft
    </span>
  );
}
