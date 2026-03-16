import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";

type Workshop = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
};

export default async function WorkshopsPage() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  const result = await pool.query<Workshop>(
    "SELECT id, title, description, status, created_at FROM workshops WHERE status = 'published' ORDER BY created_at DESC"
  );
  const workshops = result.rows;

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
        <h1 className="text-2xl font-bold text-gray-900">Workshops</h1>
        <p className="mt-1 text-sm text-gray-500">Browse available workshops and start practising.</p>

        {workshops.length === 0 ? (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
            <p className="text-sm">No published workshops yet. Check back soon.</p>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {workshops.map((workshop) => (
              <li key={workshop.id}>
                <Link
                  href={`/workshops/${workshop.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <h2 className="text-lg font-semibold text-gray-900">{workshop.title}</h2>
                  {workshop.description && (
                    <p className="mt-1 text-sm text-gray-600">{workshop.description}</p>
                  )}
                  <p className="mt-3 text-xs text-blue-600 font-medium">View exercises →</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
