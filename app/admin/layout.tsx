import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";

export const metadata = { title: "Admin — AI Prompting Education Platform" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  if (!session.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top nav */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400"
              >
                Admin Panel
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link
                  href="/admin"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Overview
                </Link>
                <Link
                  href="/admin/users"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Users
                </Link>
                <Link
                  href="/admin/moderation"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Moderation
                </Link>
                <Link
                  href="/admin/analytics"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Analytics
                </Link>
                <Link
                  href="/admin/workshops"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Workshops
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {session.displayName}
              </span>
              <Link
                href="/dashboard"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ← Back to app
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
