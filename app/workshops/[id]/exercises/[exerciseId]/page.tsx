import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import ExerciseClient from "./ExerciseClient";

type Exercise = {
  id: string;
  title: string;
  instructions: string;
  rubric: { criterion: string; max_points: number; description?: string }[];
  workshop_id: string;
};

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string; exerciseId: string }>;
}) {
  const { id, exerciseId } = await params;
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  const result = await pool.query<Exercise>(
    "SELECT id, title, instructions, rubric, workshop_id FROM exercises WHERE id = $1 AND workshop_id = $2",
    [exerciseId, id]
  );
  const exercise = result.rows[0];

  if (!exercise) {
    notFound();
  }

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

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-2 flex gap-2 text-sm text-blue-600">
          <Link href="/workshops" className="hover:underline">Workshops</Link>
          <span className="text-gray-400">/</span>
          <Link href={`/workshops/${id}`} className="hover:underline">Workshop</Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          {exercise.title}
        </h1>

        <ExerciseClient exercise={exercise} workshopId={id} />
      </div>
    </main>
  );
}
