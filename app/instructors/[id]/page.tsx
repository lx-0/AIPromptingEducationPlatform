import { notFound } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import ThemeToggle from "@/components/ThemeToggle";
import FollowButton from "@/components/FollowButton";
import { getSession } from "@/lib/session";

interface InstructorProfile {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface InstructorWorkshop {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  is_featured: boolean;
  category_name: string | null;
  category_icon: string | null;
  avg_rating: number;
  review_count: number;
  enrollment_count: number;
  exercise_count: number;
  tags: string[];
}

interface InstructorStats {
  total_workshops: number;
  total_trainees: number;
  avg_rating: number;
  total_reviews: number;
}

interface PageData {
  instructor: InstructorProfile;
  workshops: InstructorWorkshop[];
  stats: InstructorStats;
}

async function getInstructorData(id: string): Promise<PageData | null> {
  const profileResult = await pool.query<InstructorProfile>(
    `SELECT p.id, p.display_name, p.bio, p.avatar_url, p.created_at
     FROM profiles p
     WHERE p.id = $1 AND p.role = 'instructor'`,
    [id]
  );

  if (profileResult.rows.length === 0) return null;

  const instructor = profileResult.rows[0];

  const [workshopsResult, statsResult] = await Promise.all([
    pool.query<InstructorWorkshop>(
      `SELECT
         w.id, w.title, w.description, w.created_at, w.is_featured,
         wc.name        AS category_name,
         wc.icon        AS category_icon,
         COALESCE(AVG(wr.rating), 0)::NUMERIC(3,2) AS avg_rating,
         COUNT(DISTINCT wr.id)::INT                AS review_count,
         COUNT(DISTINCT sub.trainee_id)::INT       AS enrollment_count,
         COUNT(DISTINCT ex.id)::INT                AS exercise_count,
         ARRAY_AGG(DISTINCT wt.name) FILTER (WHERE wt.name IS NOT NULL) AS tags
       FROM workshops w
       LEFT JOIN workshop_categories wc ON wc.id = w.category_id
       LEFT JOIN workshop_reviews wr     ON wr.workshop_id = w.id
       LEFT JOIN exercises ex            ON ex.workshop_id = w.id
       LEFT JOIN submissions sub         ON sub.exercise_id = ex.id
       LEFT JOIN workshop_tag_links wtl  ON wtl.workshop_id = w.id
       LEFT JOIN workshop_tags wt        ON wt.id = wtl.tag_id
       WHERE w.instructor_id = $1 AND w.status = 'published'
       GROUP BY w.id, wc.id
       ORDER BY w.created_at DESC`,
      [id]
    ),
    pool.query<InstructorStats>(
      `SELECT
         COUNT(DISTINCT w.id)::INT                    AS total_workshops,
         COUNT(DISTINCT sub.trainee_id)::INT          AS total_trainees,
         COALESCE(AVG(wr.rating), 0)::NUMERIC(3,2)   AS avg_rating,
         COUNT(DISTINCT wr.id)::INT                   AS total_reviews
       FROM workshops w
       LEFT JOIN exercises ex  ON ex.workshop_id = w.id
       LEFT JOIN submissions sub ON sub.exercise_id = ex.id
       LEFT JOIN workshop_reviews wr ON wr.workshop_id = w.id
       WHERE w.instructor_id = $1 AND w.status = 'published'`,
      [id]
    ),
  ]);

  return {
    instructor,
    workshops: workshopsResult.rows,
    stats: statsResult.rows[0],
  };
}

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, session] = await Promise.all([
    getInstructorData(id),
    getSession(),
  ]);

  if (!data) notFound();

  const { instructor, workshops, stats } = data;
  const isTrainee = session.userId && session.role === "trainee";

  const initials = instructor.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/marketplace"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300"
          >
            PromptingSchool
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth/sign-in"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-4">
          <Link
            href="/marketplace"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Marketplace
          </Link>
        </div>

        {/* Instructor header */}
        <div className="mb-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-start gap-5">
            {instructor.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={instructor.avatar_url}
                alt={instructor.display_name}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                {initials}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {instructor.display_name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Instructor since {new Date(instructor.created_at).getFullYear()}
                  </p>
                </div>
                {isTrainee && (
                  <FollowButton instructorId={instructor.id} />
                )}
              </div>
              {instructor.bio && (
                <p className="mt-3 text-gray-700 dark:text-gray-300">{instructor.bio}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total_workshops}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Workshops</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total_trainees}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Trainees</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Number(stats.avg_rating).toFixed(1)} ★
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total_reviews}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reviews</p>
            </div>
          </div>
        </div>

        {/* Workshops */}
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Published Workshops
        </h2>

        {workshops.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No published workshops yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {workshops.map((w) => (
              <div
                key={w.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm"
              >
                {w.is_featured && (
                  <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-200">
                    ⭐ Featured
                  </span>
                )}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {w.title}
                </h3>
                {w.category_name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {w.category_icon} {w.category_name}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {w.description || "No description."}
                </p>

                {w.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {w.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={
                          n <= Math.round(Number(w.avg_rating))
                            ? "text-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }
                      >
                        ★
                      </span>
                    ))}
                    <span>
                      {Number(w.avg_rating).toFixed(1)} ({w.review_count})
                    </span>
                  </span>
                  <span>
                    {w.exercise_count} exercises · {w.enrollment_count} enrolled
                  </span>
                </div>

                <Link
                  href="/auth/sign-in"
                  className="mt-4 block w-full rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Enroll
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
