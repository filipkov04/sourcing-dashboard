export function FactoriesTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search bar skeleton */}
      <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700" />

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-700">
          <thead className="bg-gray-50/50 dark:bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-400">
                Factory Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-400">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-400">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-400">
                Orders
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700 bg-white dark:bg-zinc-900">
            {[...Array(3)].map((_, i) => (
              <tr key={i}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700" />
                    <div className="ml-4 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-zinc-700" />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
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
