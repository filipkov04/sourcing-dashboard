"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, User, Package, Eye, Pencil, Trash2, Loader2, X, SlidersHorizontal, ArrowUpDown, Factory, TrendingUp, PauseCircle } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FactoryListItem } from "@/lib/types";

interface FactoriesTableProps {
  factories: FactoryListItem[];
  userRole: string;
}

type OrderFilter = "all" | "none" | "has-orders" | "5-plus";
type SortOption = "name-asc" | "name-desc" | "orders-desc" | "orders-asc" | "newest" | "oldest";

export function FactoriesTable({ factories, userRole }: FactoriesTableProps) {
  const isAdminOrOwner = userRole === "ADMIN" || userRole === "OWNER";
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
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

  // Client-side search filtering and sorting
  const filteredAndSortedFactories = factories
    .filter((factory) => {
      // Search filter
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        factory.name.toLowerCase().includes(query) ||
        factory.location.toLowerCase().includes(query) ||
        factory.contactName?.toLowerCase().includes(query) ||
        factory.contactEmail?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // Order count filter
      const orderCount = factory._count.orders;
      switch (orderFilter) {
        case "none":
          return orderCount === 0;
        case "has-orders":
          return orderCount > 0;
        case "5-plus":
          return orderCount >= 5;
        case "all":
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "orders-desc":
          return b._count.orders - a._count.orders;
        case "orders-asc":
          return a._count.orders - b._count.orders;
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

  const hasActiveFilters = searchQuery !== "" || orderFilter !== "all" || sortBy !== "name-asc";
  const clearAllFilters = () => {
    setSearchQuery("");
    setOrderFilter("all");
    setSortBy("name-asc");
  };

  // Empty state - no factories at all
  if (factories.length === 0) {
    return (
      <div className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FF4D15]/10 dark:bg-[#FF4D15]/10">
          <Package className="h-8 w-8 text-[#FF4D15] dark:text-[#FF4D15]" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          No factories yet
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
          Get started by adding your first manufacturing partner
        </p>
        {isAdminOrOwner ? (
          <Link
            href="/factories/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 px-4 py-2 text-sm font-semibold text-white"
          >
            <Package className="h-4 w-4" />
            Add Your First Factory
          </Link>
        ) : (
          <Link
            href="/factories/request"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 px-4 py-2 text-sm font-semibold text-white"
          >
            <Package className="h-4 w-4" />
            Request a Factory
          </Link>
        )}
      </div>
    );
  }

  // Compute stats
  const totalFactories = factories.length;
  const totalOrders = factories.reduce((sum, f) => sum + f._count.orders, 0);
  const avgOrdersNum = totalFactories > 0 ? totalOrders / totalFactories : 0;
  const avgOrders = avgOrdersNum.toFixed(1);
  const idleCount = factories.filter((f) => f.orders.length === 0).length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm card-hover-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Total Factories</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white"><AnimatedNumber value={totalFactories} /></p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
              <Factory className="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm card-hover-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Total Orders</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white"><AnimatedNumber value={totalOrders} /></p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm card-hover-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Avg Orders / Factory</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white"><AnimatedNumber value={avgOrdersNum} formatFn={(n) => n.toFixed(1)} /></p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm card-hover-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Idle Factories</p>
              <p className={`mt-1 text-2xl font-bold ${idleCount > 0 ? "text-amber-500" : "text-gray-900 dark:text-white"}`}><AnimatedNumber value={idleCount} /></p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <PauseCircle className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search factories by name, location, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800 py-2 pl-10 pr-10 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-400 focus:border-[#FF4D15] focus:outline-none focus:ring-1 focus:ring-[#FF4D15]/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-2">
          {/* Order Filter */}
          <Select value={orderFilter} onValueChange={(value) => setOrderFilter(value as OrderFilter)}>
            <SelectTrigger className="w-[160px] border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <SelectValue placeholder="Filter" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
              <SelectItem value="all" className="text-gray-900 dark:text-zinc-100">All Factories</SelectItem>
              <SelectItem value="none" className="text-gray-900 dark:text-zinc-100">No Orders</SelectItem>
              <SelectItem value="has-orders" className="text-gray-900 dark:text-zinc-100">Has Orders</SelectItem>
              <SelectItem value="5-plus" className="text-gray-900 dark:text-zinc-100">5+ Orders</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[160px] border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <SelectValue placeholder="Sort" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
              <SelectItem value="name-asc" className="text-gray-900 dark:text-zinc-100">Name A-Z</SelectItem>
              <SelectItem value="name-desc" className="text-gray-900 dark:text-zinc-100">Name Z-A</SelectItem>
              <SelectItem value="orders-desc" className="text-gray-900 dark:text-zinc-100">Most Orders</SelectItem>
              <SelectItem value="orders-asc" className="text-gray-900 dark:text-zinc-100">Least Orders</SelectItem>
              <SelectItem value="newest" className="text-gray-900 dark:text-zinc-100">Newest First</SelectItem>
              <SelectItem value="oldest" className="text-gray-900 dark:text-zinc-100">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
          <span>Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="bg-[#FF4D15]/10 dark:bg-[#FF4D15]/10 text-[#FF4D15] dark:text-[#FF4D15]">
              Search: {searchQuery}
            </Badge>
          )}
          {orderFilter !== "all" && (
            <Badge variant="secondary" className="bg-[#FF4D15]/10 dark:bg-[#FF4D15]/10 text-[#FF4D15] dark:text-[#FF4D15]">
              {orderFilter === "none" && "No Orders"}
              {orderFilter === "has-orders" && "Has Orders"}
              {orderFilter === "5-plus" && "5+ Orders"}
            </Badge>
          )}
          {sortBy !== "name-asc" && (
            <Badge variant="secondary" className="bg-[#FF4D15]/10 dark:bg-[#FF4D15]/10 text-[#FF4D15] dark:text-[#FF4D15]">
              Sort: {sortBy === "name-desc" && "Name Z-A"}
              {sortBy === "orders-desc" && "Most Orders"}
              {sortBy === "orders-asc" && "Least Orders"}
              {sortBy === "newest" && "Newest"}
              {sortBy === "oldest" && "Oldest"}
            </Badge>
          )}
        </div>
      )}

      {/* No results */}
      {filteredAndSortedFactories.length === 0 && (
        <div className="rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            {hasActiveFilters
              ? "No factories found matching your filters"
              : "No factories found"}
          </p>
        </div>
      )}

      {/* Factories Table */}
      {filteredAndSortedFactories.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
            <thead className="bg-gray-50/50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Factory Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Orders
                </th>
                {isAdminOrOwner && (
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700 bg-white dark:bg-zinc-900">
              {filteredAndSortedFactories.map((factory) => (
                <tr
                  key={factory.id}
                  onClick={() => router.push(`/factories/${factory.id}`)}
                  className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#FF4D15]/10">
                        <Package className="h-5 w-5 text-[#FF4D15]" />
                      </div>
                      <div className="ml-4">
                        <Link
                          href={`/factories/${factory.id}`}
                          className="text-sm font-medium text-gray-900 dark:text-white hover:text-[#FF4D15]"
                        >
                          {factory.name}
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                      <MapPin className="h-4 w-4" />
                      {factory.location}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {factory.contactName ? (
                      <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                        <User className="h-4 w-4 text-gray-500 dark:text-zinc-500" />
                        {factory.contactName}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-zinc-500">No contact</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-zinc-700 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-zinc-300">
                      {factory._count.orders} {factory._count.orders === 1 ? "order" : "orders"}
                    </span>
                  </td>
                  {isAdminOrOwner && (
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/factories/${factory.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded p-1 text-gray-500 dark:text-zinc-500 hover:bg-gray-50 dark:bg-zinc-700 hover:text-blue-600"
                          title="Edit factory"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          className="rounded p-1 text-gray-500 dark:text-zinc-500 hover:bg-gray-50 dark:bg-zinc-700 hover:text-red-600"
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
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results count */}
      {filteredAndSortedFactories.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-zinc-400">
          Showing {filteredAndSortedFactories.length} of {factories.length}{" "}
          {factories.length === 1 ? "factory" : "factories"}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Delete Factory</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
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
              className="border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
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
