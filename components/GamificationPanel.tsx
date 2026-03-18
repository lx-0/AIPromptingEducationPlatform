"use client";

import { useEffect, useState } from "react";

type BadgeMeta = {
  type: string;
  label: string;
  description: string;
  emoji: string;
  earned_at: string;
};

type Streak = {
  current_streak: number;
  longest_streak: number;
  last_sub_date: string | null;
};

type GamificationData = {
  badges: BadgeMeta[];
  streak: Streak;
};

export default function GamificationPanel() {
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/badges")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 animate-pulse">
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-4" />
        <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    );
  }

  if (!data) return null;

  const { badges, streak } = data;

  return (
    <div className="space-y-4">
      {/* Streak card */}
      <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 px-6 py-4 flex items-center gap-4">
        <span className="text-3xl" aria-hidden="true">
          {streak.current_streak >= 7
            ? "⚡"
            : streak.current_streak >= 3
            ? "🔥"
            : "📅"}
        </span>
        <div>
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
            {streak.current_streak > 0
              ? `${streak.current_streak}-day streak!`
              : "No active streak"}
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Best: {streak.longest_streak} day
            {streak.longest_streak !== 1 ? "s" : ""}
            {streak.last_sub_date && (
              <> · Last submission: {new Date(streak.last_sub_date).toLocaleDateString()}</>
            )}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Badges
          {badges.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
              {badges.length}
            </span>
          )}
        </h2>

        {badges.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Complete exercises to earn your first badge!
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {badges.map((badge) => (
              <li
                key={badge.type}
                title={badge.description}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-3 py-4 text-center"
              >
                <span className="text-3xl" aria-hidden="true">
                  {badge.emoji}
                </span>
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                  {badge.label}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(badge.earned_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
