import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (session.userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <nav
          aria-label="Site navigation"
          className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6"
        >
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            PromptingSchool
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/auth/sign-in"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-6">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
            AI-powered prompt engineering training
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl lg:text-6xl max-w-3xl mx-auto leading-tight">
            Master AI prompting with{" "}
            <span className="text-blue-600 dark:text-blue-400">
              instant scored feedback
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            PromptingSchool is an interactive platform where you practise prompt
            engineering through guided workshops, get rubric-based AI scoring,
            and track your improvement over time.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/sign-up"
              className="w-full sm:w-auto rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Sign up free
            </Link>
            <Link
              href="/auth/sign-in"
              className="w-full sm:w-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section
          aria-label="Platform stats"
          className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
        >
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
              {[
                { value: "500+", label: "Prompting exercises" },
                { value: "1,000+", label: "Students trained" },
                { value: "20+", label: "Workshops available" },
                { value: "95%", label: "Satisfaction rate" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <dt className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {value}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Feature highlights */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Everything you need to improve
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              A complete toolkit for learning prompt engineering — whether
              you&apos;re a trainee practising or an instructor managing cohorts.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                ),
                title: "AI-powered scoring",
                body: "Every submission is evaluated by an AI judge that scores your prompt against a detailed rubric, giving you objective, consistent results.",
              },
              {
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                ),
                title: "Real-time feedback",
                body: "See the AI model response stream in real time as your prompt runs, then get scored feedback immediately — no waiting.",
              },
              {
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                  </svg>
                ),
                title: "Rubric-based evaluation",
                body: "Instructors define clear scoring rubrics per exercise. Trainees know exactly what is being measured so they can improve purposefully.",
              },
              {
                icon: (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                  </svg>
                ),
                title: "Workshop management",
                body: "Instructors create and publish workshops, manage exercises, invite trainees via link, and monitor cohort progress on a leaderboard.",
              },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  {icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-gray-50 dark:bg-gray-900">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                How it works
              </h2>
              <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                From setup to measurable improvement in three steps.
              </p>
            </div>
            <ol className="grid gap-8 sm:grid-cols-3" aria-label="Steps">
              {[
                {
                  step: "1",
                  title: "Create a workshop",
                  body: "Instructors design a workshop with targeted exercises and scoring rubrics tailored to their team's prompting goals.",
                },
                {
                  step: "2",
                  title: "Invite trainees",
                  body: "Share an invite link. Trainees join instantly and start working through exercises at their own pace.",
                },
                {
                  step: "3",
                  title: "Track progress",
                  body: "View per-exercise scores, attempt histories, streaks, and leaderboard rankings to see who is improving and where.",
                },
              ].map(({ step, title, body }) => (
                <li key={step} className="flex flex-col items-center text-center">
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white text-lg font-bold">
                    {step}
                  </span>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs">
                    {body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA banner */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 text-center">
          <div className="rounded-2xl bg-blue-600 px-8 py-14">
            <h2 className="text-3xl font-bold text-white mb-3">
              Ready to level up your prompts?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-lg mx-auto">
              Join PromptingSchool today and start getting scored feedback on
              your AI prompts within minutes.
            </p>
            <Link
              href="/auth/sign-up"
              className="inline-block rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
            >
              Get started free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            PromptingSchool
          </span>
          <nav aria-label="Footer navigation" className="flex items-center gap-6">
            <Link
              href="/auth/sign-up"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Sign up
            </Link>
            <Link
              href="/auth/sign-in"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/workshops"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Workshops
            </Link>
          </nav>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} PromptingSchool
          </p>
        </div>
      </footer>
    </div>
  );
}
