import { NavSkeleton, SkeletonLine, SkeletonStatCard, SkeletonTableRow } from "@/components/Skeleton";

export default function AnalyticsLoading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <NavSkeleton />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <SkeletonLine className="h-4 w-28 mb-4" />
        <SkeletonLine className="h-7 w-48 mb-2" />
        <SkeletonLine className="h-4 w-32 mb-8" />

        {/* Overview stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>

        {/* Chart placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 animate-pulse">
            <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
            <div className="h-48 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 animate-pulse">
            <div className="h-4 w-36 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
            <div className="h-48 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 animate-pulse">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                {["#", "Exercise", "Submissions", "Trainees", "Avg Score"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">
                    <div className="h-3 w-16 rounded bg-gray-300 dark:bg-gray-600" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {[1, 2, 3].map((i) => (
                <SkeletonTableRow key={i} cols={5} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
