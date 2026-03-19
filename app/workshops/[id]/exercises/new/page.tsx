import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import ExerciseForm from "@/components/ExerciseForm";
import ThemeToggle from "@/components/ThemeToggle";

export default async function NewExercisePage({
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
    redirect(`/workshops/${id}`);
  }

  const result = await pool.query(
    "SELECT id, title, instructor_id FROM workshops WHERE id = $1",
    [id]
  );
  const workshop = result.rows[0];

  if (!workshop) {
    notFound();
  }

  if (workshop.instructor_id !== session.userId) {
    redirect(`/workshops/${id}`);
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300"
          >
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

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-2 flex gap-2 text-sm text-blue-600 dark:text-blue-400">
          <Link href="/workshops" className="hover:underline">
            Workshops
          </Link>
          <span className="text-gray-400 dark:text-gray-600">/</span>
          <Link href={`/workshops/${id}`} className="hover:underline">
            {workshop.title}
          </Link>
        </div>

        <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-gray-100">
          New exercise
        </h1>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <ExerciseForm workshopId={id} />
        </div>
      </div>
    </main>
  );
}
