"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Activity = {
  type: "submission" | "discussion" | "new_workshop" | "enrollment" | "review";
  entity_id: string;
  created_at: string;
  exercise_title: string | null;
  exercise_id: string | null;
  workshop_id: string | null;
  workshop_title: string | null;
  instructor_name: string | null;
  trainee_name: string | null;
  score_pct: number | null;
  body: string | null;
};

const TYPE_ICONS: Record<string, string> = {
  submission: "📝",
  discussion: "💬",
  new_workshop: "🆕",
  enrollment: "👤",
  review: "⭐",
};

function ActivityItem({ item }: { item: Activity }) {
  const icon = TYPE_ICONS[item.type] ?? "•";
  const time = new Date(item.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  let content: React.ReactNode;

  switch (item.type) {
    case "submission":
      content = (
        <span>
          You submitted{" "}
          {item.exercise_id && item.workshop_id ? (
            <Link
              href={`/workshops/${item.workshop_id}/exercises/${item.exercise_id}`}
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {item.exercise_title}
            </Link>
          ) : (
            <span className="font-medium">{item.exercise_title}</span>
          )}
          {item.score_pct !== null && (
            <span
              className={`ml-1 text-xs font-bold ${
                item.score_pct >= 80
                  ? "text-green-600 dark:text-green-400"
                  : item.score_pct >= 50
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              — {item.score_pct}%
            </span>
          )}
        </span>
      );
      break;
    case "discussion":
      content = (
        <span>
          You posted in{" "}
          {item.exercise_id && item.workshop_id ? (
            <Link
              href={`/workshops/${item.workshop_id}/exercises/${item.exercise_id}`}
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {item.exercise_title ?? item.workshop_title}
            </Link>
          ) : (
            <span className="font-medium">{item.exercise_title ?? item.workshop_title}</span>
          )}
          {item.body && (
            <span className="text-gray-400 dark:text-gray-500 ml-1 italic text-xs">
              &ldquo;{item.body}&rdquo;
            </span>
          )}
        </span>
      );
      break;
    case "new_workshop":
      content = (
        <span>
          <span className="font-medium">{item.instructor_name}</span> published a new workshop:{" "}
          {item.workshop_id ? (
            <Link
              href="/marketplace"
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {item.workshop_title}
            </Link>
          ) : (
            <span className="font-medium">{item.workshop_title}</span>
          )}
        </span>
      );
      break;
    case "enrollment":
      content = (
        <span>
          <span className="font-medium">{item.trainee_name}</span> enrolled in{" "}
          <span className="font-medium">{item.workshop_title}</span>
        </span>
      );
      break;
    case "review":
      content = (
        <span>
          <span className="font-medium">{item.trainee_name}</span> left a{" "}
          <span className="font-medium">{item.score_pct}-star</span> review on{" "}
          <span className="font-medium">{item.workshop_title}</span>
          {item.body && (
            <span className="text-gray-400 dark:text-gray-500 ml-1 italic text-xs">
              &ldquo;{item.body}&rdquo;
            </span>
          )}
        </span>
      );
      break;
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-lg shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{content}</p>
      </div>
      <span className="text-xs text-gray-400 shrink-0 mt-0.5">{time}</span>
    </div>
  );
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity?limit=20")
      .then((r) => r.json())
      .then((d) => setActivities(d.activities ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Activity</h2>
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Activity</h2>
      {activities.length === 0 ? (
        <p className="text-sm text-gray-400 mt-3">No recent activity yet.</p>
      ) : (
        <div>
          {activities.map((item) => (
            <ActivityItem key={`${item.type}-${item.entity_id}-${item.created_at}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
