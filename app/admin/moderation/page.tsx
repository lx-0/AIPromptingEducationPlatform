"use client";

import { useEffect, useState, useCallback } from "react";

type FlaggedItem = {
  id: string;
  content_type: string;
  content_id: string;
  reason: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  reviewer_name: string | null;
};

const STATUS_TABS = ["pending", "approved", "rejected", "all"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export default function AdminModerationPage() {
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async (status: StatusTab) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/moderation?status=${status}&limit=50`);
      if (!res.ok) throw new Error("Failed to load moderation queue");
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(activeTab);
  }, [activeTab, fetchItems]);

  async function resolve(item: FlaggedItem, status: "approved" | "rejected") {
    setUpdating(item.id);
    try {
      const res = await fetch(`/api/admin/moderation/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      // Remove from pending view or refresh
      setItems((prev) =>
        activeTab === "all"
          ? prev.map((i) => (i.id === item.id ? { ...i, status } : i))
          : prev.filter((i) => i.id !== item.id)
      );
      setTotal((t) => (activeTab === "all" ? t : Math.max(0, t - 1)));
    } catch {
      setError("Failed to update item");
    } finally {
      setUpdating(null);
    }
  }

  const contentTypeColor: Record<string, string> = {
    submission:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    workshop:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    exercise:
      "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Content Moderation
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review flagged submissions, workshops, and exercises.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab}
            {tab === activeTab && !loading && (
              <span className="ml-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-xs text-gray-600 dark:text-gray-300">
                {total}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          {activeTab === "pending" ? "No pending items — queue is clear." : "No items."}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        contentTypeColor[item.content_type] ?? ""
                      }`}
                    >
                      {item.content_type}
                    </span>
                    <span className="text-xs text-gray-400 font-mono truncate">
                      {item.content_id}
                    </span>
                    {item.status !== "pending" && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.status === "approved"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {item.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">{item.reason}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      Reported by{" "}
                      <span className="font-medium">
                        {item.reporter_name ?? "anonymous"}
                      </span>
                      {item.reporter_email && ` (${item.reporter_email})`}
                    </span>
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                    {item.reviewer_name && (
                      <span>Reviewed by {item.reviewer_name}</span>
                    )}
                  </div>
                </div>

                {item.status === "pending" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => resolve(item, "approved")}
                      disabled={updating === item.id}
                      className="rounded px-3 py-1.5 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => resolve(item, "rejected")}
                      disabled={updating === item.id}
                      className="rounded px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
