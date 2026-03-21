"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Boxes,
  Tag,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Package,
  DollarSign,
  AlertTriangle,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
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
import type { ProductListItem } from "@/lib/types";
import {
  aggregateStock,
  runwayStatusColor,
  tagColor,
  formatCurrency,
} from "@/lib/inventory-utils";

interface ProductsTableProps {
  products: ProductListItem[];
  userRole: string;
}

type StockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock";
type SortOption =
  | "name-asc"
  | "name-desc"
  | "sku-asc"
  | "cogs-desc"
  | "stock-asc"
  | "newest"
  | "oldest";

export function ProductsTable({ products, userRole }: ProductsTableProps) {
  const isAdminOrOwner = userRole === "ADMIN" || userRole === "OWNER";
  const router = useRouter();

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk edit dialog
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkCogs, setBulkCogs] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkLeadTimeProd, setBulkLeadTimeProd] = useState("");
  const [bulkLeadTimeShip, setBulkLeadTimeShip] = useState("");
  const [bulkMoq, setBulkMoq] = useState("");
  const [bulkTagAction, setBulkTagAction] = useState("add");
  const [bulkTags, setBulkTags] = useState("");
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Computed: unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const p of products) {
      if (p.category) cats.add(p.category);
    }
    return Array.from(cats).sort();
  }, [products]);

  // Computed: unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const p of products) {
      for (const t of p.tags) tagSet.add(t);
    }
    return Array.from(tagSet).sort();
  }, [products]);

  // Precompute aggregated stock per product (for filtering/sorting)
  const stockMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof aggregateStock>>();
    for (const p of products) {
      map.set(p.id, aggregateStock(p.stockLevels));
    }
    return map;
  }, [products]);

  // Filtered & sorted
  const filteredAndSorted = useMemo(() => {
    return products
      .filter((product) => {
        // Search
        const q = searchQuery.toLowerCase();
        if (q) {
          const matchesSearch =
            product.name.toLowerCase().includes(q) ||
            product.sku.toLowerCase().includes(q) ||
            product.category?.toLowerCase().includes(q);
          if (!matchesSearch) return false;
        }

        // Stock filter
        if (stockFilter !== "all") {
          const agg = stockMap.get(product.id)!;
          switch (stockFilter) {
            case "in-stock":
              if (agg.totalOnHand <= 0) return false;
              break;
            case "low-stock":
              if (
                agg.worstRunwayStatus !== "WARNING" &&
                agg.worstRunwayStatus !== "CRITICAL"
              )
                return false;
              break;
            case "out-of-stock":
              if (agg.totalOnHand > 0) return false;
              break;
          }
        }

        // Category filter
        if (categoryFilter !== "all") {
          if (product.category !== categoryFilter) return false;
        }

        // Tag filter
        if (tagFilter !== "all") {
          if (!product.tags.includes(tagFilter)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name-asc":
            return a.name.localeCompare(b.name);
          case "name-desc":
            return b.name.localeCompare(a.name);
          case "sku-asc":
            return a.sku.localeCompare(b.sku);
          case "cogs-desc":
            return (b.cogs ?? 0) - (a.cogs ?? 0);
          case "stock-asc": {
            const aStock = stockMap.get(a.id)!.totalOnHand;
            const bStock = stockMap.get(b.id)!.totalOnHand;
            return aStock - bStock;
          }
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "oldest":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          default:
            return 0;
        }
      });
  }, [products, searchQuery, stockFilter, categoryFilter, tagFilter, sortBy, stockMap]);

  const hasActiveFilters =
    searchQuery !== "" ||
    stockFilter !== "all" ||
    categoryFilter !== "all" ||
    tagFilter !== "all" ||
    sortBy !== "name-asc";

  const clearAllFilters = () => {
    setSearchQuery("");
    setStockFilter("all");
    setCategoryFilter("all");
    setTagFilter("all");
    setSortBy("name-asc");
  };

  // Stats
  const totalProducts = products.length;
  const inStockCount = products.filter((p) => {
    const agg = stockMap.get(p.id)!;
    return agg.totalOnHand > 0;
  }).length;
  const lowStockCount = products.filter((p) => {
    const agg = stockMap.get(p.id)!;
    return agg.worstRunwayStatus === "WARNING" || agg.worstRunwayStatus === "CRITICAL";
  }).length;
  const totalValue = products.reduce((sum, p) => {
    const agg = stockMap.get(p.id)!;
    return sum + agg.totalValue;
  }, 0);

  // Bulk selection helpers
  const allVisibleSelected =
    filteredAndSorted.length > 0 &&
    filteredAndSorted.every((p) => selectedIds.has(p.id));
  const someVisibleSelected =
    filteredAndSorted.some((p) => selectedIds.has(p.id)) && !allVisibleSelected;

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSorted.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Delete handlers
  const handleDeleteClick = (product: ProductListItem) => {
    setProductToDelete(product);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete product");
        setIsDeleting(false);
        return;
      }
      setDeleteDialogOpen(false);
      setIsDeleting(false);
      setProductToDelete(null);
      router.refresh();
    } catch {
      setDeleteError("Failed to delete product");
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
    setDeleteError(null);
  };

  // Bulk edit handler
  const handleBulkEdit = async () => {
    setIsBulkEditing(true);
    setBulkError(null);
    try {
      const updates: Record<string, unknown> = {};
      if (bulkCogs) updates.cogs = parseFloat(bulkCogs);
      if (bulkCategory) updates.category = bulkCategory;
      if (bulkLeadTimeProd) updates.leadTimeProdDays = parseInt(bulkLeadTimeProd);
      if (bulkLeadTimeShip) updates.leadTimeShipDays = parseInt(bulkLeadTimeShip);
      if (bulkMoq) updates.moq = parseInt(bulkMoq);

      const body: Record<string, unknown> = {
        ids: Array.from(selectedIds),
        updates,
      };
      if (bulkTags) {
        updates.tags = bulkTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        body.tagAction = bulkTagAction;
      }

      const res = await fetch("/api/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setBulkError(data.error || "Failed to update");
        setIsBulkEditing(false);
        return;
      }

      setBulkEditOpen(false);
      setSelectedIds(new Set());
      // Reset form
      setBulkCogs("");
      setBulkCategory("");
      setBulkLeadTimeProd("");
      setBulkLeadTimeShip("");
      setBulkMoq("");
      setBulkTags("");
      router.refresh();
    } catch {
      setBulkError("Failed to update");
    }
    setIsBulkEditing(false);
  };

  // Empty state — no products at all
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FF4D15]/10 dark:bg-[#FF4D15]/10">
          <Boxes className="h-8 w-8 text-[#FF4D15] dark:text-[#FF4D15]" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          No products yet
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
          Get started by adding your first product to the catalog
        </p>
        {isAdminOrOwner && (
          <Link
            href="/products/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 px-4 py-2 text-sm font-semibold text-white"
          >
            <Boxes className="h-4 w-4" />
            Add Your First Product
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
        Overview
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">
                  PRD
                </span>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Total Products</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                <AnimatedNumber value={totalProducts} />
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
              <Boxes className="h-5 w-5 text-orange-500" />
            </div>
          </div>
        </div>

        {/* In Stock */}
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">
                  STK
                </span>
                <p className="text-sm text-gray-500 dark:text-zinc-400">In Stock</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                <AnimatedNumber value={inStockCount} />
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <Package className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">
                  LOW
                </span>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Low Stock</p>
              </div>
              <p
                className={`mt-1 text-2xl font-bold ${lowStockCount > 0 ? "text-amber-500" : "text-gray-900 dark:text-white"}`}
              >
                <AnimatedNumber value={lowStockCount} />
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">
                  VAL
                </span>
                <p className="text-sm text-gray-500 dark:text-zinc-400">Inventory Value</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                <AnimatedNumber
                  value={totalValue}
                  formatFn={(n) =>
                    new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(n)
                  }
                />
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <DollarSign className="h-5 w-5 text-blue-500" />
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
            id="product-search"
            name="product-search"
            type="text"
            placeholder="Search by name, SKU, or category..."
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
        <div className="flex flex-wrap items-center gap-2">
          {/* Stock Filter */}
          <Select
            name="product-stock-filter"
            value={stockFilter}
            onValueChange={(value) => setStockFilter(value as StockFilter)}
          >
            <SelectTrigger className="w-[140px] border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <SelectValue placeholder="Stock" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
              <SelectItem value="all" className="text-gray-900 dark:text-zinc-100">All Stock</SelectItem>
              <SelectItem value="in-stock" className="text-gray-900 dark:text-zinc-100">In Stock</SelectItem>
              <SelectItem value="low-stock" className="text-gray-900 dark:text-zinc-100">Low Stock</SelectItem>
              <SelectItem value="out-of-stock" className="text-gray-900 dark:text-zinc-100">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          {categories.length > 0 && (
            <Select
              name="product-category-filter"
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value)}
            >
              <SelectTrigger className="w-[150px] border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
                <SelectItem value="all" className="text-gray-900 dark:text-zinc-100">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-gray-900 dark:text-zinc-100">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <Select
              name="product-tag-filter"
              value={tagFilter}
              onValueChange={(value) => setTagFilter(value)}
            >
              <SelectTrigger className="w-[140px] border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <SelectValue placeholder="Tag" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
                <SelectItem value="all" className="text-gray-900 dark:text-zinc-100">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag} className="text-gray-900 dark:text-zinc-100">
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort */}
          <Select
            name="product-sort"
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger className="w-[150px] border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <SelectValue placeholder="Sort" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
              <SelectItem value="name-asc" className="text-gray-900 dark:text-zinc-100">Name A-Z</SelectItem>
              <SelectItem value="name-desc" className="text-gray-900 dark:text-zinc-100">Name Z-A</SelectItem>
              <SelectItem value="sku-asc" className="text-gray-900 dark:text-zinc-100">SKU A-Z</SelectItem>
              <SelectItem value="cogs-desc" className="text-gray-900 dark:text-zinc-100">COGS High-Low</SelectItem>
              <SelectItem value="stock-asc" className="text-gray-900 dark:text-zinc-100">Stock Low-High</SelectItem>
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
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
          <span>Active filters:</span>
          {searchQuery && (
            <Badge
              variant="secondary"
              className="bg-[#FF4D15]/10 dark:bg-[#FF4D15]/10 text-[#FF4D15] dark:text-[#FF4D15]"
            >
              Search: {searchQuery}
            </Badge>
          )}
          {stockFilter !== "all" && (
            <Badge
              variant="secondary"
              className="bg-[#FF4D15]/10 dark:bg-[#FF4D15]/10 text-[#FF4D15] dark:text-[#FF4D15]"
            >
              {stockFilter === "in-stock" && "In Stock"}
              {stockFilter === "low-stock" && "Low Stock"}
              {stockFilter === "out-of-stock" && "Out of Stock"}
            </Badge>
          )}
          {categoryFilter !== "all" && (
            <Badge
              variant="secondary"
              className="bg-[#FF4D15]/10 dark:bg-[#FF4D15]/10 text-[#FF4D15] dark:text-[#FF4D15]"
            >
              Category: {categoryFilter}
            </Badge>
          )}
          {tagFilter !== "all" && (
            <Badge
              variant="secondary"
              className="bg-[#FF4D15]/10 dark:bg-[#FF4D15]/10 text-[#FF4D15] dark:text-[#FF4D15]"
            >
              Tag: {tagFilter}
            </Badge>
          )}
          {sortBy !== "name-asc" && (
            <Badge
              variant="secondary"
              className="bg-[#FF4D15]/10 dark:bg-[#FF4D15]/10 text-[#FF4D15] dark:text-[#FF4D15]"
            >
              Sort:{" "}
              {sortBy === "name-desc" && "Name Z-A"}
              {sortBy === "sku-asc" && "SKU A-Z"}
              {sortBy === "cogs-desc" && "COGS High-Low"}
              {sortBy === "stock-asc" && "Stock Low-High"}
              {sortBy === "newest" && "Newest"}
              {sortBy === "oldest" && "Oldest"}
            </Badge>
          )}
        </div>
      )}

      {/* Bulk Selection Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[#FF4D15]/30 bg-[#FF4D15]/5 dark:bg-[#FF4D15]/10 px-4 py-3">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            {isAdminOrOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkEditOpen(true)}
                className="border-[#FF4D15]/30 text-[#FF4D15] hover:bg-[#FF4D15]/10"
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Bulk Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="text-gray-600 dark:text-zinc-400"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* No results after filter */}
      {filteredAndSorted.length === 0 && (
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-8 text-center">
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            No products match your filters
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="mt-3 border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Products Table */}
      {filteredAndSorted.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] card-hover-glow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
            <thead className="bg-gray-50/50 dark:bg-zinc-800/50">
              <tr>
                {/* Checkbox header */}
                <th className="w-10 px-4 py-3">
                  <button
                    onClick={toggleAll}
                    className="text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
                  >
                    {allVisibleSelected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : someVisibleSelected ? (
                      <MinusSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Product Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  COGS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Tags
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700 bg-white dark:bg-[#0d0f13]">
              {filteredAndSorted.map((product) => {
                const agg = stockMap.get(product.id)!;
                const statusColor = runwayStatusColor(agg.worstRunwayStatus);
                const isSelected = selectedIds.has(product.id);
                const visibleTags = product.tags.slice(0, 3);
                const overflowCount = product.tags.length - 3;

                return (
                  <tr
                    key={product.id}
                    onClick={() => router.push(`/products/${product.id}`)}
                    className={`hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors ${isSelected ? "bg-[#FF4D15]/5 dark:bg-[#FF4D15]/5" : ""}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleOne(product.id)}
                        className="text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-[#FF4D15]" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    {/* SKU */}
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="font-mono text-xs text-gray-700 dark:text-zinc-300 max-w-[100px] truncate block">
                        {product.sku}
                      </span>
                    </td>

                    {/* Product Name + Category */}
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-medium text-gray-900 dark:text-white hover:text-[#FF4D15]"
                        >
                          {product.name}
                        </Link>
                        {product.category && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-zinc-400">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* COGS */}
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="text-sm text-gray-700 dark:text-zinc-300">
                        {formatCurrency(product.cogs, product.currency)}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="whitespace-nowrap px-4 py-4">
                      {product.stockLevels.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${statusColor.dot}`} />
                          <span className={`text-sm font-medium ${statusColor.text}`}>
                            {agg.totalOnHand.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-zinc-600">
                          No stock
                        </span>
                      )}
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      {visibleTags.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          {visibleTags.map((tag) => {
                            const tc = tagColor(tag);
                            return (
                              <span
                                key={tag}
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tc.bg} ${tc.text}`}
                              >
                                {tag}
                              </span>
                            );
                          })}
                          {overflowCount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-zinc-400">
                              +{overflowCount}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-zinc-600">
                          --
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/products/${product.id}`}
                          className="rounded p-1 text-gray-500 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:text-blue-600"
                          title="View product"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {isAdminOrOwner && (
                          <>
                            <Link
                              href={`/products/${product.id}/edit`}
                              className="rounded p-1 text-gray-500 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:text-blue-600"
                              title="Edit product"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <button
                              className="rounded p-1 text-gray-500 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-700 hover:text-red-600"
                              title="Delete product"
                              onClick={() => handleDeleteClick(product)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Results count */}
      {filteredAndSorted.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-zinc-400">
          Showing {filteredAndSorted.length} of {products.length}{" "}
          {products.length === 1 ? "product" : "products"}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Delete Product
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {productToDelete?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {productToDelete &&
            stockMap.get(productToDelete.id)!.totalOnHand > 0 && (
              <div className="rounded-lg bg-amber-900/20 border border-amber-800 p-3">
                <p className="text-sm text-amber-400">
                  This product has{" "}
                  {stockMap.get(productToDelete.id)!.totalOnHand} units in stock.
                  Stock records will be deleted.
                </p>
              </div>
            )}

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
                  Delete Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              Bulk Edit {selectedIds.size} Products
            </DialogTitle>
            <DialogDescription className="dark:text-zinc-400">
              Only changed fields will be updated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* COGS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                COGS per unit
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={bulkCogs}
                onChange={(e) => setBulkCogs(e.target.value)}
                placeholder="Leave empty to skip"
                className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm dark:text-white placeholder-gray-400 dark:placeholder-zinc-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                placeholder="Leave empty to skip"
                className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm dark:text-white placeholder-gray-400 dark:placeholder-zinc-500"
              />
            </div>

            {/* Lead Time Production */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Lead Time &mdash; Production (days)
              </label>
              <input
                type="number"
                min="0"
                value={bulkLeadTimeProd}
                onChange={(e) => setBulkLeadTimeProd(e.target.value)}
                placeholder="Leave empty to skip"
                className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm dark:text-white placeholder-gray-400 dark:placeholder-zinc-500"
              />
            </div>

            {/* Lead Time Shipping */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Lead Time &mdash; Shipping (days)
              </label>
              <input
                type="number"
                min="0"
                value={bulkLeadTimeShip}
                onChange={(e) => setBulkLeadTimeShip(e.target.value)}
                placeholder="Leave empty to skip"
                className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm dark:text-white placeholder-gray-400 dark:placeholder-zinc-500"
              />
            </div>

            {/* MOQ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                MOQ
              </label>
              <input
                type="number"
                min="1"
                value={bulkMoq}
                onChange={(e) => setBulkMoq(e.target.value)}
                placeholder="Leave empty to skip"
                className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm dark:text-white placeholder-gray-400 dark:placeholder-zinc-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Tags
              </label>
              <Select value={bulkTagAction} onValueChange={setBulkTagAction}>
                <SelectTrigger className="w-full dark:bg-zinc-800 dark:border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-800 dark:border-zinc-700">
                  <SelectItem value="add">Add tags</SelectItem>
                  <SelectItem value="remove">Remove tags</SelectItem>
                  <SelectItem value="replace">Replace tags</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="text"
                placeholder="Comma-separated tags"
                value={bulkTags}
                onChange={(e) => setBulkTags(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm dark:text-white placeholder-gray-400 dark:placeholder-zinc-500"
              />
            </div>

            {bulkError && (
              <div className="rounded-lg bg-red-900/20 border border-red-800 p-3">
                <p className="text-sm text-red-400">{bulkError}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkEditOpen(false)}
              className="dark:border-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkEdit}
              disabled={isBulkEditing}
              className="bg-[#FF4D15] hover:bg-[#e5440f] text-white"
            >
              {isBulkEditing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Products"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
