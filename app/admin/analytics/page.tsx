import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import dynamic from "next/dynamic";

const AdminAnalyticsCharts = dynamic(() => import("./AdminAnalyticsCharts"), {
  loading: () => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 text-center text-sm text-gray-400">
      Loading charts…
    </div>
  ),
});

async function getAnalyticsData() {
  const [funnel, dau, wau, mau, revenueOverTime] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE role = 'trainee') AS signups,
        (SELECT COUNT(DISTINCT trainee_id)::int FROM enrollments) AS enrolled,
        (SELECT COUNT(DISTINCT trainee_id)::int FROM submissions) AS submitted,
        COALESCE((
          SELECT COUNT(DISTINCT sub_agg.trainee_id)::int
          FROM (
            SELECT s.trainee_id, e.workshop_id,
                   COUNT(DISTINCT s.exercise_id) AS submitted_count,
                   COUNT(DISTINCT e2.id) AS total_count
            FROM submissions s
            JOIN exercises e ON s.exercise_id = e.id
            JOIN exercises e2 ON e2.workshop_id = e.workshop_id
            GROUP BY s.trainee_id, e.workshop_id
            HAVING COUNT(DISTINCT s.exercise_id) >= COUNT(DISTINCT e2.id)
          ) sub_agg
        ), 0) AS completed
    `),
    pool.query(`
      SELECT DATE_TRUNC('day', submitted_at)::date::text AS date,
             COUNT(DISTINCT trainee_id)::int AS dau
      FROM submissions WHERE submitted_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', submitted_at) ORDER BY date ASC
    `),
    pool.query(`
      SELECT DATE_TRUNC('week', submitted_at)::date::text AS week,
             COUNT(DISTINCT trainee_id)::int AS wau
      FROM submissions WHERE submitted_at > NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', submitted_at) ORDER BY week ASC
    `),
    pool.query(`
      SELECT DATE_TRUNC('month', submitted_at)::date::text AS month,
             COUNT(DISTINCT trainee_id)::int AS mau
      FROM submissions WHERE submitted_at > NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', submitted_at) ORDER BY month ASC
    `),
    pool.query(`
      SELECT DATE_TRUNC('month', created_at)::date::text AS month,
             COUNT(*)::int AS new_subscriptions,
             COUNT(*) FILTER (WHERE plan = 'pro')::int  AS pro,
             COUNT(*) FILTER (WHERE plan = 'team')::int AS team
      FROM subscriptions
      WHERE created_at > NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at) ORDER BY month ASC
    `),
  ]);

  return {
    funnel: funnel.rows[0] ?? { signups: 0, enrolled: 0, submitted: 0, completed: 0 },
    dau: dau.rows,
    wau: wau.rows,
    mau: mau.rows,
    revenueOverTime: revenueOverTime.rows,
  };
}

export const metadata = { title: "Analytics — Admin" };

export default async function AdminAnalyticsPage() {
  const session = await getSession();
  if (!session.userId || !session.isAdmin) redirect("/auth/sign-in");

  const data = await getAnalyticsData();
  const { funnel } = data;

  const funnelSteps = [
    { label: "Signed up", value: funnel.signups },
    { label: "Enrolled", value: funnel.enrolled },
    { label: "Submitted once", value: funnel.submitted },
    { label: "Completed a workshop", value: funnel.completed },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Funnel analysis, active users, and revenue trends.
        </p>
      </div>

      {/* Funnel summary cards */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {funnelSteps.map((step, i) => {
            const prev = i > 0 ? funnelSteps[i - 1].value : null;
            const dropPct = prev && prev > 0 ? Math.round((1 - step.value / prev) * 100) : null;
            return (
              <div
                key={step.label}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {step.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {step.value.toLocaleString()}
                </p>
                {dropPct !== null && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                    -{dropPct}% drop-off
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Charts */}
      <AdminAnalyticsCharts
        funnel={data.funnel}
        dau={data.dau}
        wau={data.wau}
        mau={data.mau}
        revenueOverTime={data.revenueOverTime}
      />
    </div>
  );
}
