import Link from "next/link";

export const metadata = {
  title: "Documentation – PromptingSchool",
  description: "Guides and help for PromptingSchool instructors and trainees.",
};

export default function DocsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
        Documentation
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Welcome to the PromptingSchool documentation. Find step-by-step guides,
        tutorials, and answers to common questions.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/docs/instructor-guide"
          className="block rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all bg-white dark:bg-gray-900"
        >
          <div className="mb-2 text-2xl">🎓</div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Instructor Guide
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create workshops, build exercises, set rubrics, invite trainees, and
            view analytics.
          </p>
        </Link>

        <Link
          href="/docs/trainee-guide"
          className="block rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all bg-white dark:bg-gray-900"
        >
          <div className="mb-2 text-2xl">📚</div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Trainee Guide
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Join workshops, submit prompts, interpret AI scores, track your
            progress, and earn badges.
          </p>
        </Link>

        <Link
          href="/docs/faq"
          className="block rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm transition-all bg-white dark:bg-gray-900"
        >
          <div className="mb-2 text-2xl">❓</div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            FAQ
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Answers to common questions about the platform, scoring, privacy,
            and subscriptions.
          </p>
        </Link>
      </div>
    </div>
  );
}
