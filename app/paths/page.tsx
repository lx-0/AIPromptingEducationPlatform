import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import ThemeToggle from "@/components/ThemeToggle";
import PathDiscovery from "./PathDiscovery";

export type PathSummary = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  workshop_count: number;
  instructor_name?: string;
  is_enrolled?: boolean;
  created_at: string;
};

export default async function LearningPathsPage() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  let paths: PathSummary[] = [];
  let publishedPaths: PathSummary[] = [];

  if (session.role === "instructor") {
    const [ownResult, pubResult] = await Promise.all([
      pool.query<PathSummary>(
        `SELECT
           lp.id, lp.title, lp.description, lp.status, lp.created_at,
           COUNT(DISTINCT lpw.id)::int AS workshop_count
         FROM learning_paths lp
         LEFT JOIN learning_path_workshops lpw ON lpw.path_id = lp.id
         WHERE lp.instructor_id = $1
         GROUP BY lp.id
         ORDER BY lp.created_at DESC`,
        [session.userId]
      ),
      pool.query<PathSummary>(
        `SELECT
           lp.id, lp.title, lp.description, lp.status, lp.created_at,
           COUNT(DISTINCT lpw.id)::int AS workshop_count,
           u.display_name AS instructor_name
         FROM learning_paths lp
         JOIN users u ON u.id = lp.instructor_id
         LEFT JOIN learning_path_workshops lpw ON lpw.path_id = lp.id
         WHERE lp.status = 'published' AND lp.instructor_id <> $1
         GROUP BY lp.id, u.display_name
         ORDER BY lp.created_at DESC`,
        [session.userId]
      ),
    ]);
    paths = ownResult.rows;
    publishedPaths = pubResult.rows;
  } else {
    const result = await pool.query<PathSummary>(
      `SELECT
         lp.id, lp.title, lp.description, lp.status, lp.created_at,
         COUNT(DISTINCT lpw.id)::int AS workshop_count,
         u.display_name AS instructor_name,
         EXISTS(
           SELECT 1 FROM learning_path_enrollments lpe
           WHERE lpe.path_id = lp.id AND lpe.trainee_id = $1
         ) AS is_enrolled
       FROM learning_paths lp
       JOIN users u ON u.id = lp.instructor_id
       LEFT JOIN learning_path_workshops lpw ON lpw.path_id = lp.id
       WHERE lp.status = 'published'
       GROUP BY lp.id, u.display_name
       ORDER BY lp.created_at DESC`,
      [session.userId]
    );
    paths = result.rows;
  }

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav aria-label="Main navigation" className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300">
            PromptingSchool
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action="/auth/sign-out" method="POST">
              <button type="submit" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-2">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← Dashboard
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Learning Paths</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {session.role === "instructor"
                ? "Create and manage structured learning journeys."
                : "Enroll in a guided curriculum across multiple workshops."}
            </p>
          </div>
          {session.role === "instructor" && (
            <Link
              href="/paths/new"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              + New path
            </Link>
          )}
        </div>

        <PathDiscovery paths={paths} role={session.role} />

        {session.role === "instructor" && publishedPaths.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Published learning paths
            </h2>
            <ul className="space-y-3">
              {publishedPaths.map((path) => (
                <li key={path.id}>
                  <Link
                    href={`/paths/${path.id}`}
                    className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {path.title}
                      </p>
                      {path.description && (
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {path.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {path.workshop_count} workshop{path.workshop_count !== 1 ? "s" : ""}
                        {path.instructor_name ? ` · by ${path.instructor_name}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                      Published
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
