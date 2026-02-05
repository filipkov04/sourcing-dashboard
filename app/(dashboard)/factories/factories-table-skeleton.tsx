export function FactoriesTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search bar skeleton */}
      <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-700" />

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
        <table className="min-w-full divide-y divide-zinc-700">
          <thead className="bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Factory Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                Orders
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700 bg-zinc-800">
            {[...Array(3)].map((_, i) => (
              <tr key={i}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-zinc-700" />
                    <div className="ml-4 h-4 w-32 animate-pulse rounded bg-zinc-700" />
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-zinc-700" />
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-zinc-700" />
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-700" />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-6 w-6 animate-pulse rounded bg-zinc-700" />
                    <div className="h-6 w-6 animate-pulse rounded bg-zinc-700" />
                    <div className="h-6 w-6 animate-pulse rounded bg-zinc-700" />
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
