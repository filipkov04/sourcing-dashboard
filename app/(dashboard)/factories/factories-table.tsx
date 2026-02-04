"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, User, Package, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FactoryListItem } from "@/lib/types";

interface FactoriesTableProps {
  factories: FactoryListItem[];
}

export function FactoriesTable({ factories }: FactoriesTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [factoryToDelete, setFactoryToDelete] = useState<FactoryListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteClick = (factory: FactoryListItem) => {
    setFactoryToDelete(factory);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!factoryToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/factories/${factoryToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || "Failed to delete factory");
        setIsDeleting(false);
        return;
      }

      // Success - close dialog and refresh
      setDeleteDialogOpen(false);
      setIsDeleting(false);
      setFactoryToDelete(null);
      router.refresh();
    } catch (err) {
      setDeleteError("Failed to delete factory");
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFactoryToDelete(null);
    setDeleteError(null);
  };

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
      <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <Package className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">
          No factories yet
        </h3>
        <p className="mt-2 text-sm text-zinc-400">
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search factories by name, location, or contact..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-800 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* No results after search */}
      {filteredFactories.length === 0 && searchQuery && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-8 text-center">
          <p className="text-sm text-zinc-400">
            No factories found matching "{searchQuery}"
          </p>
        </div>
      )}

      {/* Factories Table */}
      {filteredFactories.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
          <table className="min-w-full divide-y divide-zinc-700">
            <thead className="bg-zinc-700">
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
              {filteredFactories.map((factory) => (
                <tr
                  key={factory.id}
                  onClick={() => router.push(`/factories/${factory.id}`)}
                  className="hover:bg-zinc-700/50 cursor-pointer transition-colors"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-900/30">
                        <Package className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-4">
                        <Link
                          href={`/factories/${factory.id}`}
                          className="text-sm font-medium text-white hover:text-blue-600"
                        >
                          {factory.name}
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <MapPin className="h-4 w-4" />
                      {factory.location}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {factory.contactName ? (
                      <div className="flex items-center gap-2 text-sm text-white">
                        <User className="h-4 w-4 text-zinc-500" />
                        {factory.contactName}
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-500">No contact</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-zinc-700 px-2.5 py-0.5 text-xs font-medium text-zinc-200">
                      {factory._count.orders} {factory._count.orders === 1 ? "order" : "orders"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/factories/${factory.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-blue-600"
                        title="Edit factory"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        className="rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-red-600"
                        title="Delete factory"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(factory);
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
        <div className="text-sm text-zinc-400">
          Showing {filteredFactories.length} of {factories.length}{" "}
          {factories.length === 1 ? "factory" : "factories"}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-zinc-800 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Factory</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {factoryToDelete?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="rounded-lg bg-red-900/20 border border-red-800 p-3">
              <p className="text-sm text-red-400">{deleteError}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Factory
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
