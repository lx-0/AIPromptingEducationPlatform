import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import CreateWorkshopForm from "./CreateWorkshopForm";

export default async function NewWorkshopPage() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  if (session.role !== "instructor") {
    redirect("/dashboard");
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

      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-2">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Dashboard
          </Link>
        </div>

        <h1 className="mb-8 text-2xl font-bold text-gray-900">Create workshop</h1>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <CreateWorkshopForm />
        </div>
      </div>
    </main>
  );
}
