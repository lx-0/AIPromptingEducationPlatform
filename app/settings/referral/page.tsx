import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import pool from "@/lib/db";
import ReferralPanel from "./ReferralPanel";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata = {
  title: "Referral Program — Prompting School",
};

export default async function ReferralSettingsPage() {
  const session = await getSession();
  if (!session.userId) redirect("/auth/sign-in");

  const result = await pool.query<{
    referral_code: string;
    referral_credits: number;
    total_referrals: string;
    rewarded_referrals: string;
  }>(
    `SELECT u.referral_code, u.referral_credits,
            COUNT(r.id)::text AS total_referrals,
            COUNT(r.id) FILTER (WHERE r.rewarded = TRUE)::text AS rewarded_referrals
     FROM users u
     LEFT JOIN referrals r ON r.referrer_id = u.id
     WHERE u.id = $1
     GROUP BY u.referral_code, u.referral_credits`,
    [session.userId]
  );

  const row = result.rows[0];
  const totalReferrals = Number(row?.total_referrals ?? 0);
  const rewardedReferrals = Number(row?.rewarded_referrals ?? 0);
  const pendingTowardNext = totalReferrals % 3;

  const referralCode = row?.referral_code ?? "";
  const referralUrl = `${APP_URL}/auth/sign-up?ref=${referralCode}`;

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            PromptingSchool
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form action="/auth/sign-out" method="POST">
              <button type="submit" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-2">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Referral Program</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Earn 1 free Pro month for every 3 friends you refer.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalReferrals}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total referrals</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{row?.referral_credits ?? 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Free Pro months earned</p>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{pendingTowardNext}/3</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Until next reward</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progress to next reward</span>
            <span>{pendingTowardNext} of 3</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{ width: `${(pendingTowardNext / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Share panel */}
        <ReferralPanel referralCode={referralCode} referralUrl={referralUrl} />

        {/* How it works */}
        <div className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">How it works</h2>
          <ol className="space-y-3">
            {[
              "Share your unique referral link with friends.",
              "They sign up using your link.",
              "For every 3 friends who join, you get 1 free Pro month.",
              "Credits are applied automatically to your next billing cycle.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
}
