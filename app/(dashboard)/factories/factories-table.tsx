"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, User, Package, Eye, Pencil, Trash2 } from "lucide-react";
import type { FactoryListItem } from "@/lib/types";

interface FactoriesTableProps {
  factories: FactoryListItem[];
}

export function FactoriesTable({ factories }: FactoriesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Client-side search filtering
  const filteredFactories = factories.filter((factory) => {
    const query = searchQuery.toLowerCase();
    return (
      factory.name.toLowerCase().includes(query) ||
      factory.location.toLowerCase().includes(query) ||
      factory.contactName?.toLowerCase().includes(query)
    );
  });

  // Empty state - no factories at all
  if (factories.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <Package className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          No factories yet
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Get started by adding your first manufacturing partner
        </p>
        <Link
          href="/factories/new"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Package className="h-4 w-4" />
          Add Your First Factory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search factories by name, location, or contact..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* No results after search */}
      {filteredFactories.length === 0 && searchQuery && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            No factories found matching "{searchQuery}"
          </p>
        </div>
      )}

      {/* Factories Table */}
      {filteredFactories.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Factory Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Orders
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredFactories.map((factory) => (
                <tr key={factory.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <Link
                          href={`/factories/${factory.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {factory.name}
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      {factory.location}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {factory.contactName ? (
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <User className="h-4 w-4 text-gray-400" />
                        {factory.contactName}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No contact</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      {factory._count.orders} {factory._count.orders === 1 ? "order" : "orders"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/factories/${factory.id}`}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                        title="View factory"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/factories/${factory.id}/edit`}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                        title="Edit factory"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                        title="Delete factory"
                        onClick={() => {
                          // TODO: Implement delete in future task
                          alert("Delete functionality coming soon!");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results count */}
      {filteredFactories.length > 0 && (
        <div className="text-sm text-gray-500">
          Showing {filteredFactories.length} of {factories.length}{" "}
          {factories.length === 1 ? "factory" : "factories"}
        </div>
      )}
    </div>
  );
}
