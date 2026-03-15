import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single();

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
          Welcome,{" "}
          {profile?.display_name ?? user.email}
        </h1>
        {profile?.role && (
          <p className="mt-1 text-sm capitalize text-gray-500">
            Role: {profile.role}
          </p>
        )}

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
          <p className="text-sm">
            Workshops and exercises are coming soon.
          </p>
        </div>
      </div>
    </main>
  );
}
