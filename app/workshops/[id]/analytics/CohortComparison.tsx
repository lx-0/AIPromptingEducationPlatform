"use client";

import { useState, useEffect } from "react";

export type CohortStat = {
  cohort_id: string;
  cohort_name: string;
  enrolled: number;
  submitted: number;
  completed: number;
  avg_score_pct: number | null;
};

function useDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function ComparisonBar({
  value,
  max,
  color,
  label,
  dark,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  dark: boolean;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-24 truncate text-right ${dark ? "text-gray-400" : "text-gray-500"}`}>{label}</span>
      <div className="flex-1 h-4 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className={`w-8 text-right tabular-nums ${dark ? "text-gray-300" : "text-gray-700"}`}>{value}</span>
    </div>
  );
}

export default function CohortComparison({ cohorts, totalExercises }: { cohorts: CohortStat[]; totalExercises: number }) {
  const dark = useDark();

  if (cohorts.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center">
        <p className="text-sm text-gray-400">
          No cohorts defined yet. Create cohorts in the workshop settings to compare them here.
        </p>
      </div>
    );
  }

  const maxEnrolled = Math.max(...cohorts.map((c) => c.enrolled), 1);
  const maxSubmitted = Math.max(...cohorts.map((c) => c.submitted), 1);
  const maxCompleted = Math.max(...cohorts.map((c) => c.completed), 1);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-6">
      {/* Table summary */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">Cohort</th>
              <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">Enrolled</th>
              <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">Submitted</th>
              <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">Completed</th>
              <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">Avg Score</th>
              <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">Completion %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {cohorts.map((c, i) => {
              const compPct = c.enrolled > 0 ? Math.round((c.completed / c.enrolled) * 100) : 0;
              return (
                <tr key={c.cohort_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2.5 pr-4">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="font-medium text-gray-800 dark:text-gray-200">{c.cohort_name}</span>
                    </span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{c.enrolled}</td>
                  <td className="py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{c.submitted}</td>
                  <td className="py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{c.completed}</td>
                  <td className="py-2.5 text-right">
                    {c.avg_score_pct != null ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.avg_score_pct >= 80
                            ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                            : c.avg_score_pct >= 60
                            ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                            : c.avg_score_pct >= 40
                            ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
                            : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
                        }`}
                      >
                        {c.avg_score_pct}%
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${compPct}%`,
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300 w-8 text-right tabular-nums">
                        {compPct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Visual comparison bars */}
      <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Enrollment comparison</p>
          <div className="space-y-1.5">
            {cohorts.map((c, i) => (
              <ComparisonBar
                key={c.cohort_id}
                value={c.enrolled}
                max={maxEnrolled}
                color={COLORS[i % COLORS.length]}
                label={c.cohort_name}
                dark={dark}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Submission comparison</p>
          <div className="space-y-1.5">
            {cohorts.map((c, i) => (
              <ComparisonBar
                key={c.cohort_id}
                value={c.submitted}
                max={maxSubmitted}
                color={COLORS[i % COLORS.length]}
                label={c.cohort_name}
                dark={dark}
              />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Completion comparison</p>
          <div className="space-y-1.5">
            {cohorts.map((c, i) => (
              <ComparisonBar
                key={c.cohort_id}
                value={c.completed}
                max={maxCompleted}
                color={COLORS[i % COLORS.length]}
                label={c.cohort_name}
                dark={dark}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
