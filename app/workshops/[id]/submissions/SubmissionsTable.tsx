"use client";

import { useState } from "react";
import ScoreOverride from "@/components/ScoreOverride";

interface Submission {
  id: string;
  prompt_text: string;
  submitted_at: string;
  trainee_name: string;
  exercise_title: string;
  total_score: number | null;
  max_score: number | null;
  override_score: number | null;
  override_reason: string | null;
}

interface Props {
  submissions: Submission[];
}

export default function SubmissionsTable({ submissions: initialSubmissions }: Props) {
  const [submissions, setSubmissions] = useState(initialSubmissions);

  function handleOverrideSaved(
    subId: string,
    override: { total_score: number; reason: string } | null
  ) {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === subId
          ? {
              ...s,
              override_score: override?.total_score ?? null,
              override_reason: override?.reason ?? null,
            }
          : s
      )
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Trainee</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Exercise</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Prompt</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Score</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Submitted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {submissions.map((sub) => {
            const displayScore = sub.override_score ?? sub.total_score;
            const hasOverride = sub.override_score !== null;
            return (
              <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors align-top">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {sub.trainee_name}
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {sub.exercise_title}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs">
                  <span className="block truncate" title={sub.prompt_text}>
                    {sub.prompt_text}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {displayScore != null && sub.max_score != null ? (
                    <div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        hasOverride
                          ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      }`}>
                        {displayScore}/{sub.max_score}
                        {hasOverride && " ✎"}
                      </span>
                      <ScoreOverride
                        submissionId={sub.id}
                        currentOverride={
                          hasOverride
                            ? { total_score: sub.override_score!, reason: sub.override_reason! }
                            : null
                        }
                        maxScore={sub.max_score}
                        onSaved={(ov) => handleOverrideSaved(sub.id, ov)}
                      />
                    </div>
                  ) : (
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">Pending</span>
                      {sub.max_score != null && (
                        <ScoreOverride
                          submissionId={sub.id}
                          currentOverride={null}
                          maxScore={sub.max_score}
                          onSaved={(ov) => handleOverrideSaved(sub.id, ov)}
                        />
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {new Date(sub.submitted_at).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
