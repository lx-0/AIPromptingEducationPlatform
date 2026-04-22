"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type WorkshopSummary = {
  id: string;
  title: string;
  description: string | null;
  instructor_name: string;
  exercise_count: number;
  enrollment_count: number;
  is_enrolled: boolean;
  created_at: string;
  difficulties: ("beginner" | "intermediate" | "advanced")[];
};

type SortOption = "newest" | "popular" | "alphabetical";
type DifficultyFilter = "all" | "beginner" | "intermediate" | "advanced";

const DIFFICULTY_COLORS = {
  beginner: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
  intermediate: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
  advanced: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
} as const;

export default function WorkshopDiscovery({
  workshops: initialWorkshops,
}: {
  workshops: WorkshopSummary[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(
    () => new Set(initialWorkshops.filter((w) => w.is_enrolled).map((w) => w.id))
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = q
      ? initialWorkshops.filter(
          (w) =>
            w.title.toLowerCase().includes(q) ||
            (w.description ?? "").toLowerCase().includes(q)
        )
      : [...initialWorkshops];

    if (difficultyFilter !== "all") {
      result = result.filter((w) =>
        w.difficulties && w.difficulties.includes(difficultyFilter)
      );
    }

    if (sort === "newest") {
      result.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (sort === "popular") {
      result.sort((a, b) => b.enrollment_count - a.enrollment_count);
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [initialWorkshops, query, sort, difficultyFilter]);

  async function handleEnroll(workshopId: string) {
    setEnrolling(workshopId);
    setError(null);
    try {
      const res = await fetch(`/api/workshops/${workshopId}/enroll`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to enroll");
        return;
      }
      setEnrolledIds((prev) => new Set([...prev, workshopId]));
      startTransition(() => router.push(`/workshops/${workshopId}`));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setEnrolling(null);
    }
  }

  return (
    <div>
      {/* Search, filter, and sort bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            aria-label="Search workshops"
            placeholder="Search workshops…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2 pl-9 pr-4 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Difficulty filter chips */}
          <div className="flex items-center gap-1.5" role="group" aria-label="Filter by difficulty">
            {(["all", "beginner", "intermediate", "advanced"] as const).map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={difficultyFilter === level}
                onClick={() => setDifficultyFilter(level)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  difficultyFilter === level
                    ? level === "all"
                      ? "bg-gray-700 text-white dark:bg-gray-200 dark:text-gray-900"
                      : level === "beginner"
                      ? "bg-green-600 text-white"
                      : level === "intermediate"
                      ? "bg-yellow-500 text-white"
                      : "bg-red-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {level === "all" ? "All levels" : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-xs text-gray-500 shrink-0">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2 pl-3 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most popular</option>
              <option value="alphabetical">A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" aria-live="polite" className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Workshop grid */}
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {query ? `No workshops match "${query}".` : "No published workshops yet. Check back soon."}
          </p>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="mt-3 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((workshop) => {
            const isEnrolled = enrolledIds.has(workshop.id);
            const isLoading = enrolling === workshop.id;

            return (
              <li key={workshop.id} className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md dark:hover:shadow-gray-800 transition-shadow">
                <Link
                  href={`/workshops/${workshop.id}`}
                  className="flex flex-1 flex-col p-5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-t-xl"
                >
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
                    {workshop.title}
                  </h2>
                  {workshop.description && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-3 flex-1">
                      {workshop.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(workshop.difficulties ?? []).map((d) => (
                      <span
                        key={d}
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DIFFICULTY_COLORS[d]}`}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span className="font-medium text-gray-600 dark:text-gray-400">{workshop.instructor_name}</span>
                    <span>·</span>
                    <span>
                      {workshop.exercise_count}{" "}
                      {workshop.exercise_count === 1 ? "exercise" : "exercises"}
                    </span>
                    <span>·</span>
                    <span>
                      {workshop.enrollment_count}{" "}
                      {workshop.enrollment_count === 1 ? "learner" : "learners"}
                    </span>
                  </div>
                </Link>

                <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3">
                  {isEnrolled ? (
                    <Link
                      href={`/workshops/${workshop.id}`}
                      className="flex w-full items-center justify-center rounded-lg bg-green-50 dark:bg-green-950 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
                    >
                      Continue →
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(workshop.id)}
                      disabled={isLoading}
                      aria-label={`Enroll in ${workshop.title}`}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                      {isLoading ? "Enrolling…" : "Enroll"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
        {filtered.length} {filtered.length === 1 ? "workshop" : "workshops"} found
      </p>
    </div>
  );
}
