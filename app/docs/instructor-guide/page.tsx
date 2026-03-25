import Link from "next/link";

export const metadata = {
  title: "Instructor Guide – PromptingSchool",
  description: "Step-by-step guide for instructors: create workshops, build exercises, and manage trainees.",
};

export default function InstructorGuidePage() {
  return (
    <article className="prose prose-gray dark:prose-invert max-w-none">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Instructor Guide
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Everything you need to go from sign-up to a live, published workshop with enrolled trainees.
      </p>

      {/* Table of Contents */}
      <nav aria-label="Page contents" className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">On this page</p>
        <ol className="text-sm space-y-1 list-decimal list-inside text-blue-600 dark:text-blue-400">
          <li><a href="#getting-started" className="hover:underline">Getting started</a></li>
          <li><a href="#subscription" className="hover:underline">Activating your subscription</a></li>
          <li><a href="#create-workshop" className="hover:underline">Creating a workshop</a></li>
          <li><a href="#build-exercises" className="hover:underline">Building exercises</a></li>
          <li><a href="#rubric-setup" className="hover:underline">Setting up rubrics</a></li>
          <li><a href="#invite-trainees" className="hover:underline">Inviting trainees</a></li>
          <li><a href="#analytics" className="hover:underline">Viewing analytics</a></li>
        </ol>
      </nav>

      {/* Getting Started */}
      <section id="getting-started" className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          1. Getting started
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          To get started as an instructor:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            <strong>Create an account</strong> — visit{" "}
            <Link href="/auth/sign-up" className="text-blue-600 hover:underline dark:text-blue-400">/auth/sign-up</Link>{" "}
            and choose the <em>Instructor</em> role.
          </li>
          <li>
            <strong>Verify your email</strong> — check your inbox and click the confirmation link.
          </li>
          <li>
            <strong>Sign in</strong> — go to your{" "}
            <Link href="/dashboard" className="text-blue-600 hover:underline dark:text-blue-400">Dashboard</Link>{" "}
            to see your workspace.
          </li>
        </ol>
      </section>

      {/* Subscription */}
      <section id="subscription" className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          2. Activating your subscription
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
          Creating and publishing workshops requires an active instructor subscription.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            From your dashboard, click <strong>Upgrade</strong> in the top navigation.
          </li>
          <li>
            Select a plan on the{" "}
            <Link href="/billing" className="text-blue-600 hover:underline dark:text-blue-400">Billing page</Link>{" "}
            and complete checkout via Stripe.
          </li>
          <li>
            Once payment is confirmed, the <em>Create workshop</em> button becomes available.
          </li>
        </ol>
        <div className="mt-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> You can cancel or update your subscription at any time from the Billing page without losing your existing workshops.
        </div>
      </section>

      {/* Create Workshop */}
      <section id="create-workshop" className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          3. Creating a workshop
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            Go to your <Link href="/dashboard" className="text-blue-600 hover:underline dark:text-blue-400">Dashboard</Link> and click <strong>Create workshop</strong>.
          </li>
          <li>
            Enter a <strong>title</strong> and optional <strong>description</strong>. You can also pick a starter template from the template selector to pre-populate exercises.
          </li>
          <li>
            Click <strong>Create</strong>. Your workshop is saved as a <em>draft</em> — it is not visible to trainees yet.
          </li>
          <li>
            Once you have added exercises (see below), click <strong>Publish</strong> to make the workshop discoverable.
          </li>
        </ol>
      </section>

      {/* Build Exercises */}
      <section id="build-exercises" className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          4. Building exercises
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
          Each workshop contains one or more exercises. Trainees complete exercises in order.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            Open your workshop and click <strong>Add exercise</strong>.
          </li>
          <li>
            Fill in the exercise <strong>title</strong>, <strong>instructions</strong>, and an optional <strong>system prompt</strong> that frames the AI model for scoring.
          </li>
          <li>
            Set the maximum points for this exercise (used to calculate percentage scores).
          </li>
          <li>
            Save the exercise — you can edit it at any time before submission.
          </li>
          <li>
            Drag exercises to reorder them. Trainees see them in sort order.
          </li>
        </ol>
      </section>

      {/* Rubric Setup */}
      <section id="rubric-setup" className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          5. Setting up rubrics
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
          Rubrics tell the AI scorer exactly what to look for in a trainee&apos;s prompt response.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            Inside the exercise editor, scroll to the <strong>Rubric</strong> section and click <strong>Add criterion</strong>.
          </li>
          <li>
            Enter a <strong>criterion label</strong> (e.g. &quot;Clarity&quot;), a brief <strong>description</strong> of what good looks like, and the <strong>weight</strong> (points) for this criterion.
          </li>
          <li>
            Add as many criteria as needed. The weights are summed to produce the total score.
          </li>
          <li>
            The AI scorer evaluates each criterion independently and provides per-criterion feedback.
          </li>
        </ol>
        <div className="mt-3 rounded-md bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Tip:</strong> Write criteria descriptions that a human expert would use. Specific, observable criteria produce more consistent AI scores.
        </div>
      </section>

      {/* Invite Trainees */}
      <section id="invite-trainees" className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          6. Inviting trainees
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            Open your published workshop and go to the <strong>Settings</strong> or workshop detail view.
          </li>
          <li>
            Copy the <strong>invite code</strong> shown on the page.
          </li>
          <li>
            Share the code with trainees. They visit <code className="bg-gray-100 dark:bg-gray-800 rounded px-1">/join/[code]</code> and are immediately enrolled.
          </li>
          <li>
            Enrolled trainees appear in the <strong>Submissions</strong> tab of your workshop.
          </li>
        </ol>
      </section>

      {/* Analytics */}
      <section id="analytics" className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          7. Viewing analytics
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
          The analytics dashboard gives you a real-time view of trainee progress.
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          <li>
            <strong>Completion rate</strong> — percentage of enrolled trainees who have submitted every exercise.
          </li>
          <li>
            <strong>Score distribution</strong> — histogram of scores across all submissions.
          </li>
          <li>
            <strong>Per-exercise breakdown</strong> — average score and submission count for each exercise.
          </li>
          <li>
            <strong>Score delta</strong> — how much trainees improved between their first and latest attempt.
          </li>
        </ul>
        <p className="mt-3 text-gray-700 dark:text-gray-300 text-sm">
          Access analytics by clicking the <strong>Analytics</strong> link inside any published workshop.
        </p>
      </section>

      <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 flex gap-4 text-sm">
        <Link href="/docs" className="text-blue-600 hover:underline dark:text-blue-400">← Back to docs</Link>
        <Link href="/docs/faq" className="text-blue-600 hover:underline dark:text-blue-400">FAQ →</Link>
      </div>
    </article>
  );
}
