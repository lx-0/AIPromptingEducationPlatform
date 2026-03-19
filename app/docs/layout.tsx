import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "Documentation – PromptingSchool",
  description: "Guides and help for PromptingSchool instructors and trainees.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav aria-label="Documentation navigation" className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300"
          >
            PromptingSchool
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-10 flex gap-8">
        {/* Sidebar */}
        <aside className="w-48 shrink-0">
          <nav aria-label="Docs sections">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Documentation
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href="/docs"
                  className="block rounded px-2 py-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                  Overview
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/instructor-guide"
                  className="block rounded px-2 py-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                  Instructor Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/trainee-guide"
                  className="block rounded px-2 py-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                  Trainee Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/faq"
                  className="block rounded px-2 py-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main id="main-content" className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
