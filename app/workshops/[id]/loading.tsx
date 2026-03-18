import { NavSkeleton, SkeletonLine, SkeletonStatCard } from "@/components/Skeleton";

export default function WorkshopDetailLoading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <NavSkeleton />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <SkeletonLine className="h-4 w-28 mb-4" />

        {/* Title row */}
        <div className="flex flex-wrap items-start gap-3 mb-6">
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-7 w-64" />
            <SkeletonLine className="h-4 w-80" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>

        {/* Exercises section */}
        <SkeletonLine className="h-5 w-24 mb-4" />
        <ol className="space-y-3">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 h-4 rounded bg-gray-200 dark:bg-gray-700" />
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
