import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import WorkshopDiscovery, { WorkshopSummary } from "./WorkshopDiscovery";

export default async function WorkshopsPage() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  const result = await pool.query<WorkshopSummary>(
    `SELECT
       w.id,
       w.title,
       w.description,
       w.created_at,
       u.display_name AS instructor_name,
       COUNT(DISTINCT e.id)::int AS exercise_count,
       COUNT(DISTINCT en.trainee_id)::int AS enrollment_count,
       EXISTS(
         SELECT 1 FROM enrollments
         WHERE workshop_id = w.id AND trainee_id = $1
       ) AS is_enrolled
     FROM workshops w
     JOIN users u ON u.id = w.instructor_id
     LEFT JOIN exercises e ON e.workshop_id = w.id
     LEFT JOIN enrollments en ON en.workshop_id = w.id
     WHERE w.status = 'published'
     GROUP BY w.id, w.title, w.description, w.created_at, u.display_name
     ORDER BY w.created_at DESC`,
    [session.userId]
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
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
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Browse Workshops</h1>
        <p className="mt-1 text-sm text-gray-500">
          Discover and enroll in published workshops to start practising.
        </p>

        <WorkshopDiscovery workshops={result.rows} />
      </div>
    </main>
  );
}
