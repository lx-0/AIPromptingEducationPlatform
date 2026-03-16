import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

type Workshop = {
  id: string;
  title: string;
  description: string | null;
  enrolled_at: string;
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  let enrolledWorkshops: Workshop[] = [];
  if (session.role === "trainee") {
    const result = await pool.query<Workshop>(
      `SELECT w.id, w.title, w.description, e.enrolled_at
       FROM enrollments e
       JOIN workshops w ON w.id = e.workshop_id
       WHERE e.trainee_id = $1
       ORDER BY e.enrolled_at DESC`,
      [session.userId]
    );
    enrolledWorkshops = result.rows;
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
              <h2 className="text-lg font-semibold text-gray-900 mb-3">My workshops</h2>
              {enrolledWorkshops.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
                  <p className="text-sm">You haven&apos;t joined any workshops yet.</p>
                  <p className="mt-1 text-xs text-gray-400">Use an invite link to join one.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {enrolledWorkshops.map((workshop) => (
                    <li key={workshop.id}>
                      <Link
                        href={`/workshops/${workshop.id}`}
                        className="block rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <h3 className="font-semibold text-gray-900">{workshop.title}</h3>
                        {workshop.description && (
                          <p className="mt-1 text-sm text-gray-500">{workshop.description}</p>
                        )}
                        <p className="mt-2 text-xs text-blue-600 font-medium">Continue →</p>
                      </Link>
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
