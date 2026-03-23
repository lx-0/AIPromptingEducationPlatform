"use client";

import { useEffect, useState, useCallback } from "react";

type AdminUser = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_admin: boolean;
  is_disabled: boolean;
  created_at: string;
  subscription_plan: string | null;
  workshop_count: number;
  submission_count: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50", offset: "0" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(query);
  }, [query, fetchUsers]);

  async function toggleDisabled(user: AdminUser) {
    setUpdating(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_disabled: !user.is_disabled }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    } catch {
      setError("Failed to update user");
    } finally {
      setUpdating(null);
    }
  }

  async function toggleAdmin(user: AdminUser) {
    setUpdating(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_admin: !user.is_admin }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    } catch {
      setError("Failed to update user");
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} user{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or name…"
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            onClick={() => { setSearch(""); setQuery(""); }}
            className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Clear
          </button>
        )}
      </form>

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
              {["User", "Role", "Workshops", "Submissions", "Subscription", "Joined", "Actions"].map(
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
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className={user.is_disabled ? "opacity-50" : ""}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.display_name}
                      {user.is_admin && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/40 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300">
                          admin
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {user.workshop_count}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {user.submission_count}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {user.subscription_plan ?? "free"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleDisabled(user)}
                        disabled={updating === user.id}
                        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                          user.is_disabled
                            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60"
                            : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60"
                        }`}
                      >
                        {user.is_disabled ? "Enable" : "Disable"}
                      </button>
                      <button
                        onClick={() => toggleAdmin(user)}
                        disabled={updating === user.id}
                        className="rounded bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        {user.is_admin ? "Revoke Admin" : "Make Admin"}
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
