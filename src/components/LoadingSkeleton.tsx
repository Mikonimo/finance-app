export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Date selector skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Chart skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
        <div className="h-[300px] bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Recent transactions skeleton */}
      <ListSkeleton rows={5} />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
      </div>
      <ListSkeleton rows={6} />
    </div>
  );
}
