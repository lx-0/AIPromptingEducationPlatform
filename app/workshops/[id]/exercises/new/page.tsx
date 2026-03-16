import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import ExerciseForm from "@/components/ExerciseForm";

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
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-gray-900 hover:text-gray-700"
          >
            PromptingSchool
          </Link>
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

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-2 flex gap-2 text-sm text-blue-600">
          <Link href="/workshops" className="hover:underline">
            Workshops
          </Link>
          <span className="text-gray-400">/</span>
          <Link href={`/workshops/${id}`} className="hover:underline">
            {workshop.title}
          </Link>
        </div>

        <h1 className="mb-8 text-2xl font-bold text-gray-900">
          New exercise
        </h1>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ExerciseForm workshopId={id} />
        </div>
      </div>
    </main>
  );
}
