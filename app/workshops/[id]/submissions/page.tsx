import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

type Submission = {
  id: string;
  prompt_text: string;
  submitted_at: string;
  trainee_name: string;
  exercise_title: string;
  total_score: number | null;
  max_score: number | null;
};

type Workshop = {
  id: string;
  title: string;
};

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  if (session.role !== "instructor") {
    redirect("/dashboard");
  }

  const workshopResult = await pool.query<Workshop>(
    "SELECT id, title FROM workshops WHERE id = $1 AND instructor_id = $2",
    [id, session.userId]
  );
  const workshop = workshopResult.rows[0];

  if (!workshop) {
    notFound();
  }

  const submissionsResult = await pool.query<Submission>(
    `SELECT
       s.id,
       s.prompt_text,
       s.submitted_at,
       u.display_name AS trainee_name,
       e.title AS exercise_title,
       sc.total_score,
       sc.max_score
     FROM submissions s
     JOIN exercises e ON s.exercise_id = e.id
     JOIN users u ON s.trainee_id = u.id
     LEFT JOIN scores sc ON sc.submission_id = s.id
     WHERE e.workshop_id = $1
     ORDER BY s.submitted_at DESC`,
    [id]
  );
  const submissions = submissionsResult.rows;

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
          <Link href={`/workshops/${id}`} className="text-sm text-blue-600 hover:underline">
            ← {workshop.title}
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
        <p className="mt-1 text-sm text-gray-500">All trainee submissions for this workshop.</p>

        {submissions.length === 0 ? (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
            <p className="text-sm">No submissions yet.</p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Trainee</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Exercise</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Prompt</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {sub.trainee_name}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {sub.exercise_title}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      <span className="block truncate" title={sub.prompt_text}>
                        {sub.prompt_text}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {sub.total_score != null && sub.max_score != null ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {sub.total_score}/{sub.max_score}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(sub.submitted_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
