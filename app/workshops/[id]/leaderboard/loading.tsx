import { NavSkeleton, SkeletonLine, SkeletonTableRow } from "@/components/Skeleton";

export default function LeaderboardLoading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <NavSkeleton />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <SkeletonLine className="h-7 w-36 mb-2" />
        <SkeletonLine className="h-4 w-48 mb-8" />

        {/* Current user rank placeholder */}
        <div className="mb-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 px-6 py-4 flex items-center gap-4 animate-pulse">
          <div className="h-8 w-8 rounded-full bg-blue-200 dark:bg-blue-700" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-28 rounded bg-blue-200 dark:bg-blue-700" />
            <div className="h-3 w-48 rounded bg-blue-200 dark:bg-blue-700" />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden animate-pulse">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                {["Rank", "Name", "Avg Score", "Exercises", "Badges", "Streak"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">
                    <div className="h-3 w-12 rounded bg-gray-300 dark:bg-gray-600" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonTableRow key={i} cols={6} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
