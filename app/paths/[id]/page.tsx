import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import ThemeToggle from "@/components/ThemeToggle";
import PathEnrollButton from "./PathEnrollButton";
import SocialShareButtons from "@/components/SocialShareButtons";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await pool.query<{
    title: string;
    description: string | null;
    status: string;
    instructor_name: string;
  }>(
    `SELECT lp.title, lp.description, lp.status, u.display_name AS instructor_name
     FROM learning_paths lp
     LEFT JOIN users u ON u.id = lp.instructor_id
     WHERE lp.id = $1`,
    [id]
  );
  const p = result.rows[0];
  if (!p || p.status !== "published") return {};

  const ogImageUrl = `${APP_URL}/api/og?title=${encodeURIComponent(p.title)}&subtitle=${encodeURIComponent(`Learning Path · by ${p.instructor_name}`)}&type=path`;

  return {
    title: `${p.title} — Prompting School`,
    description: p.description ?? `Follow the ${p.title} learning path on Prompting School.`,
    openGraph: {
      title: p.title,
      description: p.description ?? `Follow the ${p.title} learning path on Prompting School.`,
      url: `${APP_URL}/paths/${id}`,
      siteName: "Prompting School",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: p.title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.description ?? `Follow the ${p.title} learning path on Prompting School.`,
      images: [ogImageUrl],
    },
  };
}

type WorkshopProgress = {
  workshop_id: string;
  workshop_title: string;
  sort_order: number;
  prerequisite_workshop_id: string | null;
  prerequisite_title: string | null;
  total_exercises: number;
  submitted_exercises: number;
  completion_pct: number;
  is_completed: boolean;
  is_unlocked: boolean;
  is_enrolled: boolean;
};

type PathDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  instructor_name: string;
  instructor_id: string;
};

export default async function LearningPathDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  // Get path metadata
  const pathResult = await pool.query<PathDetail>(
    `SELECT lp.*, u.display_name AS instructor_name
     FROM learning_paths lp
     JOIN users u ON u.id = lp.instructor_id
     WHERE lp.id = $1`,
    [id]
  );

  if (pathResult.rows.length === 0) {
    redirect("/paths");
  }

  const path = pathResult.rows[0];

  if (path.status !== "published" && path.instructor_id !== session.userId) {
    redirect("/paths");
  }

  // Check enrollment
  const enrollmentResult = await pool.query(
    "SELECT 1 FROM learning_path_enrollments WHERE path_id = $1 AND trainee_id = $2",
    [id, session.userId]
  );
  const isEnrolled = enrollmentResult.rows.length > 0;

  // Get per-workshop progress
  const workshopsResult = await pool.query<{
    sort_order: number;
    prerequisite_workshop_id: string | null;
    workshop_id: string;
    workshop_title: string;
    prerequisite_title: string | null;
    total_exercises: string;
    submitted_exercises: string;
    is_enrolled: boolean;
  }>(
    `SELECT
       lpw.sort_order,
       lpw.prerequisite_workshop_id,
       w.id AS workshop_id,
       w.title AS workshop_title,
       pw.title AS prerequisite_title,
       COUNT(DISTINCT e.id)::text AS total_exercises,
       COUNT(DISTINCT s.exercise_id)::text AS submitted_exercises,
       EXISTS(
         SELECT 1 FROM enrollments en
         WHERE en.workshop_id = w.id AND en.trainee_id = $2
       ) AS is_enrolled
     FROM learning_path_workshops lpw
     JOIN workshops w ON w.id = lpw.workshop_id
     LEFT JOIN workshops pw ON pw.id = lpw.prerequisite_workshop_id
     LEFT JOIN exercises e ON e.workshop_id = w.id
     LEFT JOIN submissions s ON s.exercise_id = e.id AND s.trainee_id = $2
     WHERE lpw.path_id = $1
     GROUP BY lpw.sort_order, lpw.prerequisite_workshop_id, w.id, pw.title
     ORDER BY lpw.sort_order ASC`,
    [id, session.userId]
  );

  // Compute locked/unlocked state
  const completedIds = new Set<string>();
  const rawWorkshops = workshopsResult.rows.map((row) => {
    const total = parseInt(row.total_exercises, 10);
    const submitted = parseInt(row.submitted_exercises, 10);
    const isCompleted = total > 0 && submitted >= total;
    if (isCompleted) completedIds.add(row.workshop_id);
    return { ...row, total, submitted, isCompleted };
  });

  const workshops: WorkshopProgress[] = rawWorkshops.map((row) => ({
    workshop_id: row.workshop_id,
    workshop_title: row.workshop_title,
    sort_order: row.sort_order,
    prerequisite_workshop_id: row.prerequisite_workshop_id,
    prerequisite_title: row.prerequisite_title,
    total_exercises: row.total,
    submitted_exercises: row.submitted,
    completion_pct:
      row.total > 0 ? Math.round((row.submitted / row.total) * 100) : 0,
    is_completed: row.isCompleted,
    is_unlocked:
      !row.prerequisite_workshop_id ||
      completedIds.has(row.prerequisite_workshop_id),
    is_enrolled: row.is_enrolled,
  }));

  const completedCount = workshops.filter((w) => w.is_completed).length;
  const overallPct =
    workshops.length > 0
      ? Math.round((completedCount / workshops.length) * 100)
      : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: path.title,
    description: path.description ?? undefined,
    url: `${APP_URL}/paths/${id}`,
    provider: {
      "@type": "Organization",
      name: "Prompting School",
      sameAs: APP_URL,
    },
  };

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <Link href="/paths" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← Learning paths
          </Link>
          {session.role === "instructor" && path.instructor_id === session.userId && (
            <Link
              href={`/paths/${id}/edit`}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Edit path
            </Link>
          )}
        </div>

        {/* Header */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {path.title}
              </h1>
              {path.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{path.description}</p>
              )}
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                By {path.instructor_name} · {workshops.length} workshop{workshops.length !== 1 ? "s" : ""}
              </p>
              {path.status === "published" && (
                <div className="mt-3">
                  <SocialShareButtons
                    url={`${APP_URL}/paths/${id}`}
                    title={path.title}
                  />
                </div>
              )}
            </div>

            {session.role === "trainee" && (
              <div className="shrink-0">
                {isEnrolled ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-300">
                    Enrolled
                  </span>
                ) : (
                  <PathEnrollButton pathId={id} />
                )}
              </div>
            )}
          </div>

          {isEnrolled && workshops.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Overall progress</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {completedCount}/{workshops.length} workshops · {overallPct}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Workshop list */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Curriculum
          </h2>

          {workshops.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center text-sm text-gray-400 dark:text-gray-500">
              No workshops in this path yet.
            </div>
          ) : (
            <ol className="space-y-3">
              {workshops.map((w, idx) => (
                <li
                  key={w.workshop_id}
                  className={`rounded-xl border bg-white dark:bg-gray-900 px-5 py-4 transition-all ${
                    w.is_completed
                      ? "border-green-200 dark:border-green-800"
                      : w.is_unlocked
                      ? "border-gray-200 dark:border-gray-700"
                      : "border-gray-100 dark:border-gray-800 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Step indicator */}
                    <div className="shrink-0 mt-0.5">
                      {w.is_completed ? (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                          <svg className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      ) : w.is_unlocked ? (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {idx + 1}
                        </span>
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                          <svg className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 1a3 3 0 0 0-3 3v1.5H4a1 1 0 0 0-1 1V14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6.5a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3zm0 1.5a1.5 1.5 0 0 1 1.5 1.5V5.5h-3V4A1.5 1.5 0 0 1 8 2.5z" />
                          </svg>
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          {w.is_unlocked ? (
                            <Link
                              href={`/workshops/${w.workshop_id}`}
                              className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {w.workshop_title}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-400 dark:text-gray-500">
                              {w.workshop_title}
                            </span>
                          )}
                          {w.prerequisite_title && !w.is_unlocked && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              Complete &ldquo;{w.prerequisite_title}&rdquo; to unlock
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {w.total_exercises} exercise{w.total_exercises !== 1 ? "s" : ""}
                            {w.is_enrolled ? ` · ${w.submitted_exercises}/${w.total_exercises} submitted` : ""}
                          </p>
                        </div>

                        {isEnrolled && w.is_unlocked && w.total_exercises > 0 && (
                          <div className="shrink-0 text-right">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {w.completion_pct}%
                            </span>
                          </div>
                        )}
                      </div>

                      {isEnrolled && w.is_unlocked && w.total_exercises > 0 && (
                        <div className="mt-2">
                          <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                w.is_completed ? "bg-green-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${w.completion_pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
