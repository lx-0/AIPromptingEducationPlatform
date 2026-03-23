"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface Workshop {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_featured: boolean;
  instructor_id: string;
  instructor_name: string;
  instructor_avatar: string | null;
  category_name: string | null;
  category_slug: string | null;
  category_icon: string | null;
  avg_rating: number;
  review_count: number;
  enrollment_count: number;
  exercise_count: number;
  difficulty: string | null;
  tags: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const SORT_OPTIONS = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Top Rated" },
  { value: "popularity", label: "Most Popular" },
];

function StarRating({ rating, count }: { rating: number; count: number }) {
  const stars = Math.round(rating);
  return (
    <span className="flex items-center gap-1 text-sm">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= stars ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}>
          ★
        </span>
      ))}
      <span className="text-gray-500 dark:text-gray-400">
        {Number(rating).toFixed(1)} ({count})
      </span>
    </span>
  );
}

function WorkshopCard({ w }: { w: Workshop }) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-shadow">
      {w.is_featured && (
        <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-200">
          ⭐ Featured
        </span>
      )}

      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">
          {w.title}
        </h3>
        {w.difficulty && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              w.difficulty === "beginner"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : w.difficulty === "intermediate"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
            }`}
          >
            {w.difficulty}
          </span>
        )}
      </div>

      {w.category_name && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {w.category_icon} {w.category_name}
        </p>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 flex-1">
        {w.description || "No description provided."}
      </p>

      {w.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {w.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
          {w.tags.length > 4 && (
            <span className="text-xs text-gray-400">+{w.tags.length - 4}</span>
          )}
        </div>
      )}

      <StarRating rating={w.avg_rating} count={w.review_count} />

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {w.exercise_count} exercise{w.exercise_count !== 1 ? "s" : ""} ·{" "}
          {w.enrollment_count} enrolled
        </span>
        <Link
          href={`/instructors/${w.instructor_id}`}
          className="hover:underline text-blue-600 dark:text-blue-400"
        >
          {w.instructor_name}
        </Link>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/auth/sign-in`}
          className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Enroll
        </Link>
        <Link
          href={`/instructors/${w.instructor_id}`}
          className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Instructor
        </Link>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("trending");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const fetchWorkshops = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, page: String(page) });
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (difficulty) params.set("difficulty", difficulty);

      const res = await fetch(`/api/marketplace?${params}`);
      const data = await res.json();
      setWorkshops(data.workshops ?? []);
      setPagination(data.pagination ?? null);
    } finally {
      setLoading(false);
    }
  }, [q, category, difficulty, sort, page]);

  useEffect(() => {
    fetchWorkshops();
  }, [fetchWorkshops]);

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const featured = workshops.filter((w) => w.is_featured);
  const rest = workshops.filter((w) => !w.is_featured);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300"
          >
            PromptingSchool
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/docs"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Docs
            </Link>
            <Link
              href="/auth/sign-in"
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Workshop Marketplace
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Discover AI prompting workshops taught by expert instructors
          </p>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Search workshops…"
            value={q}
            onChange={(e) => handleFilterChange(setQ)(e.target.value)}
            className="flex-1 min-w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={category}
            onChange={(e) => handleFilterChange(setCategory)(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(e) => handleFilterChange(setDifficulty)(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All levels</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => handleFilterChange(setSort)(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category pills */}
        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange(setCategory)("")}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                category === ""
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400"
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => handleFilterChange(setCategory)(c.slug)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  category === c.slug
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400"
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : workshops.length === 0 ? (
          <div className="py-20 text-center text-gray-500 dark:text-gray-400">
            No workshops found. Try adjusting your filters.
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && page === 1 && (
              <section className="mb-10" aria-label="Featured workshops">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  ⭐ Featured
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((w) => (
                    <WorkshopCard key={w.id} w={w} />
                  ))}
                </div>
              </section>
            )}

            {/* All workshops */}
            <section aria-label="All workshops">
              {featured.length > 0 && page === 1 && (
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  All Workshops
                </h2>
              )}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((w) => (
                  <WorkshopCard key={w.id} w={w} />
                ))}
              </div>
            </section>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-2xl bg-blue-600 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Ready to level up your prompt engineering?</h2>
          <p className="mt-2 text-blue-100">
            Join thousands of learners mastering AI prompting on PromptingSchool.
          </p>
          <Link
            href="/auth/sign-up"
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Start for free
          </Link>
        </div>
      </main>
    </div>
  );
}
