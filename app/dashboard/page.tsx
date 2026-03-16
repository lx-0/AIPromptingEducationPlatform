import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
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

        <div className="mt-8">
          <a
            href="/workshops"
            className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300 hover:shadow-sm transition-all text-center"
          >
            <p className="text-sm font-semibold text-blue-600">Browse workshops →</p>
            <p className="mt-1 text-xs text-gray-500">View available workshops and start practising prompts.</p>
          </a>
        </div>
      </div>
    </main>
  );
}
