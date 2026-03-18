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
};

type SortOption = "newest" | "popular" | "alphabetical";

export default function WorkshopDiscovery({
  workshops: initialWorkshops,
}: {
  workshops: WorkshopSummary[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
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

    if (sort === "newest") {
      result.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (sort === "popular") {
      result.sort((a, b) => b.enrollment_count - a.enrollment_count);
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [initialWorkshops, query, sort]);

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
      {/* Search and sort bar */}
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
            placeholder="Search workshops…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-xs text-gray-500 shrink-0">
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most popular</option>
            <option value="alphabetical">A–Z</option>
          </select>
        </div>
      </div>

      {error && (
        <div role="alert" aria-live="polite" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Workshop grid */}
      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">
            {query ? `No workshops match "${query}".` : "No published workshops yet. Check back soon."}
          </p>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="mt-3 text-sm text-blue-600 hover:underline"
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
              <li key={workshop.id} className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <Link
                  href={`/workshops/${workshop.id}`}
                  className="flex flex-1 flex-col p-5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-t-xl"
                >
                  <h2 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">
                    {workshop.title}
                  </h2>
                  {workshop.description && (
                    <p className="mt-2 text-sm text-gray-500 line-clamp-3 flex-1">
                      {workshop.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
                    <span className="font-medium text-gray-600">{workshop.instructor_name}</span>
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

                <div className="border-t border-gray-100 px-5 py-3">
                  {isEnrolled ? (
                    <Link
                      href={`/workshops/${workshop.id}`}
                      className="flex w-full items-center justify-center rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                    >
                      Continue →
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(workshop.id)}
                      disabled={isLoading}
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

      <p className="mt-6 text-center text-xs text-gray-400">
        {filtered.length} {filtered.length === 1 ? "workshop" : "workshops"} found
      </p>
    </div>
  );
}
