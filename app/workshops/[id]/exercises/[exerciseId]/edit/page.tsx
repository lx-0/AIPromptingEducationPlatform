import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import ExerciseForm from "@/components/ExerciseForm";

type Exercise = {
  id: string;
  title: string;
  instructions: string;
  system_prompt: string | null;
  rubric: { criterion: string; max_points: number; description?: string }[];
  sort_order: number;
  workshop_id: string;
};

type Workshop = {
  id: string;
  title: string;
  instructor_id: string;
};

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string; exerciseId: string }>;
}) {
  const { id, exerciseId } = await params;
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  if (session.role !== "instructor") {
    redirect(`/workshops/${id}`);
  }

  const [workshopResult, exerciseResult] = await Promise.all([
    pool.query<Workshop>(
      "SELECT id, title, instructor_id FROM workshops WHERE id = $1",
      [id]
    ),
    pool.query<Exercise>(
      "SELECT id, title, instructions, system_prompt, rubric, sort_order, workshop_id FROM exercises WHERE id = $1 AND workshop_id = $2",
      [exerciseId, id]
    ),
  ]);

  const workshop = workshopResult.rows[0];
  const exercise = exerciseResult.rows[0];

  if (!workshop || !exercise) {
    notFound();
  }

  if (workshop.instructor_id !== session.userId) {
    redirect(`/workshops/${id}`);
  }

  const rubric = (exercise.rubric ?? []).map((c) => ({
    criterion: c.criterion,
    max_points: c.max_points,
    description: c.description ?? "",
  }));

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
          <span className="text-gray-400">/</span>
          <Link
            href={`/workshops/${id}/exercises/${exerciseId}`}
            className="hover:underline"
          >
            {exercise.title}
          </Link>
        </div>

        <h1 className="mb-8 text-2xl font-bold text-gray-900">Edit exercise</h1>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ExerciseForm
            workshopId={id}
            exerciseId={exerciseId}
            initialValues={{
              title: exercise.title,
              instructions: exercise.instructions,
              system_prompt: exercise.system_prompt ?? "",
              rubric,
              sort_order: exercise.sort_order,
            }}
          />
        </div>
      </div>
    </main>
  );
}
