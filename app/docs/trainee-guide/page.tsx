import Link from "next/link";

export const metadata = {
  title: "Trainee Guide – PromptingSchool",
  description: "How to join workshops, submit prompts, interpret scores, and track your progress on PromptingSchool.",
};

export default function TraineeGuidePage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Trainee Guide
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Learn how to join workshops, complete exercises, and improve your prompting skills with AI-powered feedback.
      </p>

      {/* Table of Contents */}
      <nav aria-label="Page contents" className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">On this page</p>
        <ol className="text-sm space-y-1 list-decimal list-inside text-blue-600 dark:text-blue-400">
          <li><a href="#getting-started" className="hover:underline">Getting started</a></li>
          <li><a href="#joining-workshop" className="hover:underline">Joining a workshop</a></li>
          <li><a href="#submitting-prompts" className="hover:underline">Submitting prompts</a></li>
          <li><a href="#understanding-scores" className="hover:underline">Understanding your scores</a></li>
          <li><a href="#tracking-progress" className="hover:underline">Tracking your progress</a></li>
          <li><a href="#gamification" className="hover:underline">Badges and leaderboards</a></li>
        </ol>
      </nav>

      {/* Getting Started */}
      <section id="getting-started" className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          1. Getting started
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            Visit{" "}
            <Link href="/auth/sign-up" className="text-blue-600 hover:underline dark:text-blue-400">/auth/sign-up</Link>{" "}
            and choose the <em>Trainee</em> role.
          </li>
          <li>
            Enter your name, email address, and a password, then click <strong>Create account</strong>.
          </li>
          <li>
            Sign in and land on your{" "}
            <Link href="/dashboard" className="text-blue-600 hover:underline dark:text-blue-400">Dashboard</Link>,
            where you will see all your enrolled workshops.
          </li>
        </ol>
      </section>

      {/* Joining a Workshop */}
      <section id="joining-workshop" className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          2. Joining a workshop
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
          There are two ways to join a workshop:
        </p>
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">Via an invite code</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Your instructor gives you an invite code. Go to{" "}
              <code className="bg-gray-100 dark:bg-gray-800 rounded px-1">/join/[code]</code>{" "}
              or paste the code on the <strong>Join</strong> page. You are enrolled instantly.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">Via the workshop browser</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Browse publicly listed workshops at{" "}
              <Link href="/workshops" className="text-blue-600 hover:underline dark:text-blue-400">/workshops</Link>,
              find one that interests you, and click <strong>Enroll</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Submitting Prompts */}
      <section id="submitting-prompts" className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          3. Submitting prompts
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            Open a workshop from your dashboard and select the first exercise.
          </li>
          <li>
            Read the exercise instructions carefully — they describe the task you need to prompt the AI to perform.
          </li>
          <li>
            Write your prompt in the text area and click <strong>Submit</strong>.
          </li>
          <li>
            The AI scorer evaluates your submission against the exercise rubric and returns feedback within a few seconds.
          </li>
          <li>
            You can re-submit as many times as you like. Each attempt is saved and your best score is tracked.
          </li>
        </ol>
        <div className="mt-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
          <strong>Tip:</strong> Read the rubric criteria shown below the instructions before writing your prompt. Each criterion tells you exactly what the scorer is looking for.
        </div>
      </section>

      {/* Understanding Scores */}
      <section id="understanding-scores" className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          4. Understanding your scores
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
          After submission, you see a detailed scorecard:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            <strong>Total score</strong> — your points out of the maximum for this exercise, shown as a percentage.
          </li>
          <li>
            <strong>Per-criterion breakdown</strong> — points and feedback for each rubric criterion. This tells you exactly where you lost marks and why.
          </li>
          <li>
            <strong>Score delta</strong> — if you have re-submitted, you will see how your latest score compares to your first attempt (e.g. +12 points).
          </li>
          <li>
            <strong>Submission timestamp</strong> — each submission is timestamped so you can review your history.
          </li>
        </ul>
      </section>

      {/* Tracking Progress */}
      <section id="tracking-progress" className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          5. Tracking your progress
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
          Your dashboard gives you a full picture of your learning progress:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            <strong>Workshop completion</strong> — a progress bar shows how many exercises you have completed in each enrolled workshop.
          </li>
          <li>
            <strong>Best scores</strong> — for each exercise, your highest score across all attempts is displayed.
          </li>
          <li>
            <strong>Exercise status</strong> — exercises are marked as <em>Not started</em>, <em>Submitted</em> (awaiting score), or <em>Scored</em>.
          </li>
        </ul>
      </section>

      {/* Gamification */}
      <section id="gamification" className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          6. Badges and leaderboards
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
          PromptingSchool rewards consistent effort and improvement:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            <strong>Badges</strong> — earned for milestones like completing your first exercise, hitting 100% on a rubric criterion, or completing an entire workshop. A celebration animation plays when you earn a badge.
          </li>
          <li>
            <strong>Leaderboard</strong> — each workshop has a leaderboard that ranks enrolled trainees by their cumulative best scores. Use it to benchmark your progress against peers.
          </li>
          <li>
            <strong>XP and levels</strong> — every submission earns you experience points. Level up by submitting and improving your scores consistently.
          </li>
        </ul>
      </section>

      <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 flex gap-4 text-sm">
        <Link href="/docs" className="text-blue-600 hover:underline dark:text-blue-400">← Back to docs</Link>
        <Link href="/docs/faq" className="text-blue-600 hover:underline dark:text-blue-400">FAQ →</Link>
      </div>
    </article>
  );
}
