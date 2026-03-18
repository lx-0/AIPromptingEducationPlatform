export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 animate-pulse ${className}`}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-5 animate-pulse">
      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
      <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export function SkeletonWorkshopCard() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export function NavSkeleton() {
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="h-5 w-36 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </nav>
  );
}
