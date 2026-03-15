import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
};

export default async function WorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: workshop, error: workshopError } = await supabase
    .from("workshops")
    .select("id, title, description, status")
    .eq("id", id)
    .single();

  if (workshopError || !workshop) {
    notFound();
  }

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, title, sort_order")
    .eq("workshop_id", id)
    .order("sort_order", { ascending: true });

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
          <Link href="/workshops" className="text-sm text-blue-600 hover:underline">
            ← All workshops
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">{(workshop as Workshop).title}</h1>
        {(workshop as Workshop).description && (
          <p className="mt-2 text-sm text-gray-600">{(workshop as Workshop).description}</p>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Exercises</h2>

          {!exercises || exercises.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
              <p className="text-sm">No exercises in this workshop yet.</p>
            </div>
          ) : (
            <ol className="space-y-3">
              {(exercises as Exercise[]).map((exercise, index) => (
                <li key={exercise.id}>
                  <Link
                    href={`/workshops/${id}/exercises/${exercise.id}`}
                    className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-4 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                      {index + 1}
                    </span>
                    <span className="text-gray-900 font-medium">{exercise.title}</span>
                    <span className="ml-auto text-xs text-blue-600">Start →</span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </main>
  );
}
