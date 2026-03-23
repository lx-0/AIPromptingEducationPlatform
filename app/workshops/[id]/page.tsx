import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import ThemeToggle from "@/components/ThemeToggle";
import SocialShareButtons from "@/components/SocialShareButtons";
import InstructorPowerTools from "@/components/InstructorPowerTools";

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
    enrollment_count: string;
  }>(
    `SELECT w.title, w.description, w.status,
            u.display_name AS instructor_name,
            COUNT(DISTINCT e.user_id)::text AS enrollment_count
     FROM workshops w
     LEFT JOIN users u ON u.id = w.instructor_id
     LEFT JOIN enrollments e ON e.workshop_id = w.id
     WHERE w.id = $1
     GROUP BY w.id, u.display_name`,
    [id]
  );
  const w = result.rows[0];
  if (!w || w.status !== "published") return {};

  const stat = `${w.enrollment_count} enrolled`;
  const ogImageUrl = `${APP_URL}/api/og?title=${encodeURIComponent(w.title)}&subtitle=${encodeURIComponent(`by ${w.instructor_name}`)}&type=workshop&stat=${encodeURIComponent(stat)}`;

  return {
    title: `${w.title} — Prompting School`,
    description: w.description ?? `Learn ${w.title} on Prompting School.`,
    openGraph: {
      title: w.title,
      description: w.description ?? `Learn ${w.title} on Prompting School.`,
      url: `${APP_URL}/workshops/${id}`,
      siteName: "Prompting School",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: w.title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: w.title,
      description: w.description ?? `Learn ${w.title} on Prompting School.`,
      images: [ogImageUrl],
    },
  };
}

const PublishPanel = dynamic(() => import("./PublishPanel"), {
  loading: () => (
    <div className="mt-6 h-24 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 animate-pulse" />
  ),
});

const ReviewSection = dynamic(() => import("./ReviewSection"), { ssr: false });

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

type Cohort = {
  id: string;
  name: string;
  member_count: number;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  instructor_name: string;
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

  // Load instructor power tools data
  let cohorts: Cohort[] = [];
  let announcements: Announcement[] = [];
  if (isOwner) {
    const [cohortsResult, announcementsResult] = await Promise.all([
      pool.query<Cohort>(
        `SELECT c.id, c.name, COUNT(cm.trainee_id)::int AS member_count
         FROM cohorts c
         LEFT JOIN cohort_members cm ON cm.cohort_id = c.id
         WHERE c.workshop_id = $1
         GROUP BY c.id
         ORDER BY c.created_at ASC`,
        [id]
      ),
      pool.query<Announcement>(
        `SELECT a.id, a.title, a.body, a.created_at, p.display_name AS instructor_name
         FROM announcements a
         JOIN profiles p ON p.id = a.instructor_id
         WHERE a.workshop_id = $1
         ORDER BY a.created_at DESC`,
        [id]
      ),
    ]);
    cohorts = cohortsResult.rows;
    announcements = announcementsResult.rows;
  }

  // Check if current trainee has any submissions in this workshop
  let traineeHasSubmissions = false;
  if (session.role === "trainee") {
    const subCheck = await pool.query(
      `SELECT 1 FROM submissions sub
       JOIN exercises ex ON ex.id = sub.exercise_id
       WHERE ex.workshop_id = $1 AND sub.trainee_id = $2
       LIMIT 1`,
      [id, session.userId]
    );
    traineeHasSubmissions = subCheck.rows.length > 0;
  }

  const enrolledCount = workshopStats ? Number(workshopStats.enrolled_count) : 0;
  const completionPct =
    workshopStats && enrolledCount > 0
      ? Math.round((Number(workshopStats.unique_trainees) / enrolledCount) * 100)
      : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: workshop.title,
    description: workshop.description ?? undefined,
    url: `${APP_URL}/workshops/${id}`,
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
            <Link
              href="/docs"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
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

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-2">
          <Link href="/workshops" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← All workshops
          </Link>
        </div>

        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{workshop.title}</h1>
              <WorkshopStatusBadge status={workshop.status} />
            </div>
            {workshop.description && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{workshop.description}</p>
            )}
            {workshop.status === "published" && (
              <div className="mt-3">
                <SocialShareButtons
                  url={`${APP_URL}/workshops/${id}`}
                  title={workshop.title}
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/workshops/${id}/leaderboard`}
              className="shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
            >
              🏆 Leaderboard
            </Link>
            {isOwner && (
              <>
                <Link
                  href={`/workshops/${id}/analytics`}
                  className="shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  Analytics →
                </Link>
                <Link
                  href={`/workshops/${id}/submissions`}
                  className="shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  View submissions →
                </Link>
              </>
            )}
          </div>
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Analytics</h2>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Total submissions</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">{workshopStats.total_submissions}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Avg score</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {workshopStats.avg_score_pct != null ? `${workshopStats.avg_score_pct}%` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Completion</p>
                <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {completionPct != null ? `${completionPct}%` : "—"}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {workshopStats.unique_trainees} of {enrolledCount} enrolled
                </p>
              </div>
            </div>

            {/* Per-exercise stats */}
            {exerciseStats.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">#</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Exercise</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Submissions</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Unique trainees</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Avg score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {exerciseStats.map((stat, index) => (
                      <tr key={stat.exercise_id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{stat.exercise_title}</td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{stat.submission_count}</td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{stat.unique_submitters}</td>
                        <td className="px-4 py-3 text-right">
                          {stat.avg_score_pct != null ? (
                            <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                              {stat.avg_score_pct}%
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">—</span>
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Exercises</h2>
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
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No exercises in this workshop yet.</p>
              {isOwner && (
                <Link
                  href={`/workshops/${id}/exercises/new`}
                  className="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
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
                      className="flex flex-1 items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950 text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {index + 1}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{exercise.title}</span>
                      <span className="ml-auto text-xs text-blue-600 dark:text-blue-400">Start →</span>
                    </Link>
                    {isOwner && (
                      <Link
                        href={`/workshops/${id}/exercises/${exercise.id}/edit`}
                        className="shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
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

        {/* Instructor power tools */}
        {isOwner && (
          <InstructorPowerTools
            workshopId={id}
            cohorts={cohorts}
            announcements={announcements}
          />
        )}

        {/* Reviews */}
        {workshop.status === "published" && (
          <ReviewSection
            workshopId={id}
            isTrainee={session.role === "trainee"}
            hasSubmissions={traineeHasSubmissions}
          />
        )}
      </div>
    </main>
  );
}

function WorkshopStatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
        Published
      </span>
    );
  }
  if (status === "archived") {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
        Archived
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-300">
      Draft
    </span>
  );
}
