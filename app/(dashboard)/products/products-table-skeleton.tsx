export function ProductsTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats skeleton */}
      <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                <div className="h-7 w-16 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
              </div>
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-700" />
            </div>
          </div>
        ))}
      </div>

      {/* Search bar skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700" />
        <div className="flex items-center gap-2">
          <div className="h-10 w-[140px] animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700" />
          <div className="h-10 w-[140px] animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700" />
          <div className="h-10 w-[140px] animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13]">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
          <thead className="bg-gray-50/50 dark:bg-zinc-800/50">
            <tr>
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">Product Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">COGS</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">Tags</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-4">
                  <div className="h-4 w-4 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-36 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-1">
                    <div className="h-5 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-700" />
                    <div className="h-5 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-700" />
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-6 w-6 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                    <div className="h-6 w-6 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                    <div className="h-6 w-6 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
