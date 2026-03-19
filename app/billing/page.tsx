import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getSubscription } from "@/lib/billing";
import BillingPortalButton from "./BillingPortalButton";
import ThemeToggle from "@/components/ThemeToggle";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await getSession();

  if (!session.userId) {
    redirect("/auth/sign-in");
  }

  const subscription = await getSubscription(session.userId);
  const { success } = await searchParams;
  const showSuccess = success === "1";

  const planLabel: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    team: "Team",
  };

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav aria-label="Main navigation" className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            PromptingSchool
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action="/auth/sign-out" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Billing</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your subscription and billing information.
        </p>

        {showSuccess && (
          <div className="mt-6 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-4">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
              Subscription activated! Welcome to {planLabel[subscription.plan]}.
            </p>
          </div>
        )}

        {/* Current plan card */}
        <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Current plan
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {planLabel[subscription.plan] ?? subscription.plan}
              </p>
              {subscription.isActive && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400 font-medium">
                  Active
                </p>
              )}
              {!subscription.isActive && subscription.plan === "free" && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Upgrade to unlock unlimited workshops and exercises
                </p>
              )}
              {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                  Cancels on{" "}
                  {subscription.currentPeriodEnd.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
              {subscription.isActive && !subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Renews on{" "}
                  {subscription.currentPeriodEnd.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              {subscription.plan === "free" ? (
                <Link
                  href="/pricing"
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Upgrade
                </Link>
              ) : (
                <BillingPortalButton />
              )}
            </div>
          </div>
        </div>

        {/* Free tier usage (only shown on free plan) */}
        {subscription.plan === "free" && (
          <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Free tier limits
            </h2>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                Up to 3 workshops
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                Up to 5 exercises per workshop
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                Unlimited trainees and submissions
              </li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
