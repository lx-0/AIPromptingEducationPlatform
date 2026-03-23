import pool from "@/lib/db";

type Metrics = {
  users: {
    total: number;
    instructors: number;
    trainees: number;
    disabled: number;
    new_last_7d: number;
  };
  workshops: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  submissions: {
    total: number;
    last_7d: number;
    last_30d: number;
  };
  revenue: {
    active_subscriptions: number;
    pro_count: number;
    team_count: number;
  };
  recentActivity: Array<{
    event_type: string;
    entity_id: string;
    label: string;
    created_at: string;
  }>;
  systemHealth: {
    db_latency_ms: number;
    pending_flags: number;
    api_errors_1h: number;
  };
};

async function getMetrics(): Promise<Metrics> {
  const [users, workshops, submissions, revenue, recentActivity, systemHealth] =
    await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE role = 'instructor')::int AS instructors,
          COUNT(*) FILTER (WHERE role = 'trainee')::int AS trainees,
          COUNT(*) FILTER (WHERE is_disabled = TRUE)::int AS disabled,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS new_last_7d
        FROM users
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'published')::int AS published,
          COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
          COUNT(*) FILTER (WHERE status = 'archived')::int AS archived
        FROM workshops
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE submitted_at > NOW() - INTERVAL '7 days')::int AS last_7d,
          COUNT(*) FILTER (WHERE submitted_at > NOW() - INTERVAL '30 days')::int AS last_30d
        FROM submissions
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS active_subscriptions,
          COUNT(*) FILTER (WHERE plan = 'pro')::int AS pro_count,
          COUNT(*) FILTER (WHERE plan = 'team')::int AS team_count
        FROM subscriptions
        WHERE status = 'active'
      `),
      pool.query(`
        SELECT * FROM (
          SELECT 'new_user' AS event_type, id AS entity_id, display_name AS label, created_at
          FROM users ORDER BY created_at DESC LIMIT 5
        ) u
        UNION ALL
        SELECT * FROM (
          SELECT 'submission' AS event_type, s.id AS entity_id, e.title AS label, s.submitted_at AS created_at
          FROM submissions s JOIN exercises e ON e.id = s.exercise_id
          ORDER BY s.submitted_at DESC LIMIT 5
        ) sub
        ORDER BY created_at DESC LIMIT 10
      `),
      // System health: DB ping + pending flags
      (async () => {
        const start = Date.now();
        const [ping, flags] = await Promise.all([
          pool.query("SELECT 1"),
          pool.query("SELECT COUNT(*)::int AS cnt FROM flagged_content WHERE status = 'pending'"),
        ]);
        void ping;
        return {
          db_latency_ms: Date.now() - start,
          pending_flags: flags.rows[0].cnt,
          api_errors_1h: 0, // placeholder — extend with real error tracking
        };
      })(),
    ]);

  return {
    users: users.rows[0],
    workshops: workshops.rows[0],
    submissions: submissions.rows[0],
    revenue: revenue.rows[0],
    recentActivity: recentActivity.rows,
    systemHealth,
  };
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color ?? "text-gray-900 dark:text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const m = await getMetrics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Live metrics as of {new Date().toLocaleString()}
        </p>
      </div>

      {/* Users */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">Users</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={m.users.total} sub={`+${m.users.new_last_7d} this week`} />
          <StatCard label="Instructors" value={m.users.instructors} />
          <StatCard label="Trainees" value={m.users.trainees} />
          <StatCard
            label="Disabled"
            value={m.users.disabled}
            color={m.users.disabled > 0 ? "text-red-600 dark:text-red-400" : undefined}
          />
        </div>
      </section>

      {/* Workshops */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">Workshops</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Workshops" value={m.workshops.total} />
          <StatCard label="Published" value={m.workshops.published} color="text-green-600 dark:text-green-400" />
          <StatCard label="Draft" value={m.workshops.draft} />
          <StatCard label="Archived" value={m.workshops.archived} />
        </div>
      </section>

      {/* Submissions & Revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <section>
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Submissions
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total" value={m.submissions.total} />
            <StatCard label="Last 7 days" value={m.submissions.last_7d} />
            <StatCard label="Last 30 days" value={m.submissions.last_30d} />
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Revenue / Subscriptions
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Active Subs" value={m.revenue.active_subscriptions} />
            <StatCard label="Pro" value={m.revenue.pro_count} />
            <StatCard label="Team" value={m.revenue.team_count} />
          </div>
        </section>
      </div>

      {/* System Health */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
          System Health
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard
            label="DB Latency"
            value={`${m.systemHealth.db_latency_ms} ms`}
            color={
              m.systemHealth.db_latency_ms < 100
                ? "text-green-600 dark:text-green-400"
                : "text-yellow-600 dark:text-yellow-400"
            }
          />
          <StatCard
            label="Pending Flags"
            value={m.systemHealth.pending_flags}
            color={
              m.systemHealth.pending_flags > 0
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-green-600 dark:text-green-400"
            }
            sub={m.systemHealth.pending_flags > 0 ? "Needs review" : "All clear"}
          />
          <StatCard label="API Errors (1h)" value={m.systemHealth.api_errors_1h} />
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Recent Activity
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {m.recentActivity.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400">No recent activity.</p>
          ) : (
            m.recentActivity.map((ev) => (
              <div key={ev.entity_id + ev.event_type} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      ev.event_type === "new_user"
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    }`}
                  >
                    {ev.event_type === "new_user" ? "New User" : "Submission"}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ev.label}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(ev.created_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
