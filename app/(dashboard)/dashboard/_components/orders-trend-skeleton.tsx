export function OrdersTrendSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-6">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        <div className="mt-1 h-4 w-24 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="h-[280px] w-full animate-pulse rounded bg-gray-100" />
    </div>
  );
}
