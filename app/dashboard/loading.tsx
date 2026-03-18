import { NavSkeleton, SkeletonLine, SkeletonWorkshopCard } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <NavSkeleton />
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Heading */}
        <SkeletonLine className="h-7 w-48 mb-2" />
        <SkeletonLine className="h-4 w-24 mt-1" />

        <div className="mt-8 space-y-8">
          {/* Section header */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <SkeletonLine className="h-5 w-32" />
              <div className="h-9 w-32 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <ul className="space-y-3">
              {[1, 2, 3].map((i) => (
                <li key={i}>
                  <SkeletonWorkshopCard />
                </li>
              ))}
            </ul>
          </div>

          {/* Gamification skeleton */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 animate-pulse">
            <SkeletonLine className="h-4 w-1/3 mb-4" />
            <div className="h-16 rounded bg-gray-100 dark:bg-gray-800" />
          </div>

          {/* Progress section */}
          <div>
            <SkeletonLine className="h-5 w-28 mb-3" />
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden animate-pulse">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 space-y-3">
                <SkeletonLine className="h-4 w-1/2" />
                <SkeletonLine className="h-3 w-1/3" />
                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800" />
              </div>
              {[1, 2].map((i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3 border-b border-gray-50 dark:border-gray-800">
                  <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
