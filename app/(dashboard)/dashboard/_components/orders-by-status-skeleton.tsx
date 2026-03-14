export function OrdersByStatusSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="mb-6">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-1 h-4 w-28 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="space-y-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-full animate-pulse rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
