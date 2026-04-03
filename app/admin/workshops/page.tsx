"use client";

import { useEffect, useState, useCallback } from "react";

type AdminWorkshop = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  created_at: string;
  instructor_id: string;
  instructor_name: string;
  instructor_email: string;
  exercise_count: number;
  submission_count: number;
};

const STATUS_COLORS: Record<string, string> = {
  published:
    "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  draft: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
  archived: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

export default function AdminWorkshopsPage() {
  const [workshops, setWorkshops] = useState<AdminWorkshop[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkshops = useCallback(
    async (q: string, status: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: "50", offset: "0" });
        if (q) params.set("q", q);
        if (status) params.set("status", status);
        const res = await fetch(`/api/admin/workshops?${params}`);
        if (!res.ok) throw new Error("Failed to load workshops");
        const data = await res.json();
        setWorkshops(data.workshops);
        setTotal(data.total);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchWorkshops(query, statusFilter);
  }, [query, statusFilter, fetchWorkshops]);

  async function updateWorkshop(id: string, patch: Partial<Pick<AdminWorkshop, "status" | "is_featured">>) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/workshops/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setWorkshops((prev) =>
        prev.map((w) => (w.id === updated.id ? { ...w, ...updated } : w))
      );
    } catch {
      setError("Failed to update workshop");
    } finally {
      setUpdating(null);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workshop Oversight
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} workshop{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, instructor…"
            className="flex-1 min-w-0 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Search
          </button>
          {query && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setQuery("");
              }}
              className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          )}
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {["Workshop", "Instructor", "Status", "Exercises", "Submissions", "Created", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : workshops.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  No workshops found.
                </td>
              </tr>
            ) : (
              workshops.map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {w.title}
                      {w.is_featured && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                          featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 dark:text-white">{w.instructor_name}</div>
                    <div className="text-xs text-gray-400">{w.instructor_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[w.status] ?? ""}`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {w.exercise_count}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {w.submission_count}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(w.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {w.status !== "archived" && (
                        <button
                          onClick={() => updateWorkshop(w.id, { status: "archived" })}
                          disabled={updating === w.id}
                          className="rounded bg-red-100 dark:bg-red-900/40 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 disabled:opacity-50"
                        >
                          Archive
                        </button>
                      )}
                      {w.status === "archived" && (
                        <button
                          onClick={() => updateWorkshop(w.id, { status: "draft" })}
                          disabled={updating === w.id}
                          className="rounded bg-green-100 dark:bg-green-900/40 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 disabled:opacity-50"
                        >
                          Restore
                        </button>
                      )}
                      <button
                        onClick={() => updateWorkshop(w.id, { is_featured: !w.is_featured })}
                        disabled={updating === w.id}
                        className="rounded bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        {w.is_featured ? "Unfeature" : "Feature"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
