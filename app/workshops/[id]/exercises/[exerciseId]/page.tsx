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
  instructor_id: string;
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
    `SELECT e.id, e.title, e.instructions, e.rubric, e.workshop_id, w.instructor_id
     FROM exercises e
     JOIN workshops w ON w.id = e.workshop_id
     WHERE e.id = $1 AND e.workshop_id = $2`,
    [exerciseId, id]
  );
  const exercise = result.rows[0];

  if (!exercise) {
    notFound();
  }

  const isOwner =
    session.role === "instructor" &&
    exercise.instructor_id === session.userId;

  return (
    <main id="main-content" className="min-h-screen bg-gray-50">
      <nav aria-label="Main navigation" className="bg-white shadow-sm">
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
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-1 text-sm text-blue-600">
            <li><Link href="/workshops" className="hover:underline">Workshops</Link></li>
            <li aria-hidden="true" className="text-gray-400">/</li>
            <li><Link href={`/workshops/${id}`} className="hover:underline">Workshop</Link></li>
            <li aria-hidden="true" className="text-gray-400">/</li>
            <li aria-current="page" className="text-gray-500">{exercise.title}</li>
          </ol>
        </nav>

        <div className="mb-8 flex flex-wrap items-start gap-3">
          <h1 className="flex-1 min-w-0 text-2xl font-bold text-gray-900">
            {exercise.title}
          </h1>
          {isOwner && (
            <Link
              href={`/workshops/${id}/exercises/${exerciseId}/edit`}
              className="shrink-0 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              Edit exercise
            </Link>
          )}
        </div>

        <ExerciseClient exercise={exercise} workshopId={id} />
      </div>
    </main>
  );
}
