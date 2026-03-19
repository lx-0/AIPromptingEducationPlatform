import Link from "next/link";
import { getSession } from "@/lib/session";
import { getSubscription } from "@/lib/billing";
import PricingCheckoutButton from "./PricingCheckoutButton";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started and explore the platform.",
    features: [
      "Up to 3 workshops",
      "Up to 5 exercises per workshop",
      "Unlimited trainees",
      "AI-powered scoring",
      "Basic analytics",
    ],
    plan: "free" as const,
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For instructors running active cohorts.",
    features: [
      "Unlimited workshops",
      "Unlimited exercises per workshop",
      "Unlimited trainees",
      "AI-powered scoring",
      "Advanced analytics & exports",
      "Priority support",
    ],
    plan: "pro" as const,
    highlight: true,
  },
  {
    name: "Team",
    price: "$79",
    period: "per month",
    description: "For organisations with multiple instructors.",
    features: [
      "Everything in Pro",
      "Up to 10 instructor seats",
      "Team analytics dashboard",
      "Custom rubric templates",
      "Dedicated onboarding",
    ],
    plan: "team" as const,
    highlight: false,
  },
];

export default async function PricingPage() {
  const session = await getSession();
  const subscription = session.userId ? await getSubscription(session.userId) : null;
  const currentPlan = subscription?.plan ?? "free";

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <nav
          aria-label="Site navigation"
          className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6"
        >
          <Link href="/" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            PromptingSchool
          </Link>
          <div className="flex items-center gap-3">
            {session.userId ? (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
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
              </>
            )}
          </div>
        </nav>
      </header>

      <main id="main-content" className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center mb-14">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Start free. Upgrade when you need more workshops or exercises.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.plan;
              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border p-8 ${
                    plan.highlight
                      ? "border-blue-500 bg-blue-600 text-white shadow-xl"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 border-2 border-white dark:border-gray-950 px-4 py-1 text-xs font-semibold text-white">
                      Most popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h2
                      className={`text-lg font-bold ${
                        plan.highlight ? "text-white" : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {plan.name}
                    </h2>
                    <div className="mt-2 flex items-end gap-1">
                      <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : ""}`}>
                        {plan.price}
                      </span>
                      <span
                        className={`mb-1 text-sm ${
                          plan.highlight ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        /{plan.period}
                      </span>
                    </div>
                    <p
                      className={`mt-2 text-sm ${
                        plan.highlight ? "text-blue-100" : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm">
                        <svg
                          className={`h-4 w-4 shrink-0 ${
                            plan.highlight ? "text-blue-200" : "text-blue-600 dark:text-blue-400"
                          }`}
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M2.5 8l4 4 7-7"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className={plan.highlight ? "text-blue-50" : ""}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.plan === "free" ? (
                    isCurrent ? (
                      <span
                        className={`block text-center rounded-lg px-6 py-3 text-sm font-semibold ${
                          plan.highlight
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        Current plan
                      </span>
                    ) : (
                      <Link
                        href="/auth/sign-up"
                        className="block text-center rounded-lg border border-gray-200 dark:border-gray-700 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        Get started free
                      </Link>
                    )
                  ) : (
                    <PricingCheckoutButton
                      plan={plan.plan}
                      isCurrent={isCurrent}
                      isHighlight={plan.highlight}
                      isSignedIn={!!session.userId}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
            All prices in USD. Cancel any time — no lock-in.
          </p>
        </section>
      </main>
    </div>
  );
}
