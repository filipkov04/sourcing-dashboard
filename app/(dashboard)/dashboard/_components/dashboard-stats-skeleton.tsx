export function DashboardStatsSkeleton() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 p-4"
          style={{ minHeight: "110px" }}
        >
          <div className="flex items-start justify-between">
            <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="mt-3">
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </>
  );
}
