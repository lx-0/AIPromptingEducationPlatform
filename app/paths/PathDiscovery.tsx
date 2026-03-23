"use client";

import { useState } from "react";
import Link from "next/link";
import { type PathSummary } from "./page";

type Props = {
  paths: PathSummary[];
  role: string;
};

export default function PathDiscovery({ paths, role }: Props) {
  const [search, setSearch] = useState("");

  const filtered = paths.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (paths.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {role === "instructor"
            ? "No learning paths yet."
            : "No learning paths available."}
        </p>
        {role === "instructor" && (
          <Link
            href="/paths/new"
            className="mt-3 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create your first path →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search paths…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
          No paths match &ldquo;{search}&rdquo;
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((path) => (
            <li key={path.id}>
              <div className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/paths/${path.id}`}
                    className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {path.title}
                  </Link>
                  {path.description && (
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">
                      {path.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {path.workshop_count} workshop{path.workshop_count !== 1 ? "s" : ""}
                    {path.instructor_name ? ` · by ${path.instructor_name}` : ""}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {path.is_enrolled && (
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                      Enrolled
                    </span>
                  )}
                  <PathStatusBadge status={path.status} />
                  {role === "instructor" && (
                    <Link
                      href={`/paths/${path.id}/edit`}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PathStatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
        Published
      </span>
    );
  }
  if (status === "archived") {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
        Archived
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-300">
      Draft
    </span>
  );
}
