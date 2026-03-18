import { NavSkeleton, SkeletonLine, SkeletonWorkshopCard } from "@/components/Skeleton";

export default function WorkshopsLoading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <NavSkeleton />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <SkeletonLine className="h-4 w-20 mb-4" />
        <SkeletonLine className="h-7 w-44 mb-2" />
        <SkeletonLine className="h-4 w-72 mb-8" />
        <ul className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <li key={i}>
              <SkeletonWorkshopCard />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
