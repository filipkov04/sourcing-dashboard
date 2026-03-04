"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Package, Filter, X, Loader2, CheckSquare, Download, ChevronDown, FileSpreadsheet, FileText, Repeat, Archive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  productSKU: string | null;
  productImage: string | null;
  quantity: number;
  unit: string;
  overallProgress: number;
  status: string;
  priority: string;
  orderDate: string;
  expectedDate: string;
  factory: {
    id: string;
    name: string;
    location: string;
  };
  _count: {
    stages: number;
  };
  hasBlockedStage?: boolean;
  hasDelayedStage?: boolean;
  recurrenceEnabled?: boolean;
  recurrenceNextDate?: string | null;
};

type Factory = {
  id: string;
  name: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  IN_PROGRESS: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  DELAYED: "bg-orange-50 text-[#FF4D15] dark:bg-orange-900/20 dark:text-[#FF4D15]",
  DISRUPTED: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  COMPLETED: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  SHIPPED: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  DELIVERED: "bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  CANCELLED: "bg-gray-50 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-50 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400",
  NORMAL: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  HIGH: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  URGENT: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
};

export default function OrdersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdminOrOwner = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";
  const [orders, setOrders] = useState<Order[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [factoryFilter, setFactoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch factories for filter dropdown
  useEffect(() => {
    async function fetchFactories() {
      try {
        const response = await fetch("/api/factories");
        const data = await response.json();
        if (data.success) {
          setFactories(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch factories:", error);
      }
    }
    fetchFactories();
  }, []);

  // Fetch orders with filters
  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
        if (factoryFilter && factoryFilter !== "all") params.set("factoryId", factoryFilter);
        if (priorityFilter && priorityFilter !== "all") params.set("priority", priorityFilter);

        const response = await fetch(`/api/orders?${params.toString()}`);
        const data = await response.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setIsLoading(false);
      }
    }

    const debounce = setTimeout(fetchOrders, 300);
    return () => clearTimeout(debounce);
  }, [search, statusFilter, factoryFilter, priorityFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setFactoryFilter("all");
    setPriorityFilter("all");
  };

  const hasActiveFilters = search || statusFilter !== "all" || factoryFilter !== "all" || priorityFilter !== "all";

  const DONE_STATUSES = ["COMPLETED", "SHIPPED", "DELIVERED", "CANCELLED"];
  const visibleOrders = !showCompleted && statusFilter === "all"
    ? orders.filter((o) => !DONE_STATUSES.includes(o.status))
    : orders;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Bulk selection handlers
  const toggleSelect = (orderId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleOrders.map((o) => o.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkStatus("");
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;

    setActionError(null);
    setIsBulkUpdating(true);
    try {
      const res = await fetch("/api/orders/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: Array.from(selectedIds),
          status: bulkStatus,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Update local state to reflect changes
        const progressForStatus = ["COMPLETED", "SHIPPED", "DELIVERED"].includes(bulkStatus)
          ? 100
          : bulkStatus === "PENDING"
          ? 0
          : undefined;

        setOrders((prev) =>
          prev.map((o) =>
            selectedIds.has(o.id)
              ? {
                  ...o,
                  status: bulkStatus,
                  ...(progressForStatus !== undefined
                    ? { overallProgress: progressForStatus }
                    : {}),
                }
              : o
          )
        );
        clearSelection();
      } else {
        setActionError(data.error || "Failed to update orders");
      }
    } catch {
      setActionError("Failed to update orders. Please try again.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const getExportParams = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (factoryFilter && factoryFilter !== "all") params.set("factoryId", factoryFilter);
    if (priorityFilter && priorityFilter !== "all") params.set("priority", priorityFilter);
    return params.toString();
  };

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    setIsExporting(true);
    setActionError(null);
    try {
      const queryStr = getExportParams();
      const endpoints = {
        csv: `/api/orders/export?${queryStr}`,
        xlsx: `/api/orders/export-xlsx?${queryStr}`,
        pdf: `/api/orders/export-pdf?${queryStr}`,
      };
      const extensions = { csv: "csv", xlsx: "xlsx", pdf: "pdf" };

      const res = await fetch(endpoints[format]);
      if (!res.ok) {
        setActionError(`Failed to export orders as ${format.toUpperCase()}`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().split("T")[0]}.${extensions[format]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setActionError("Failed to export orders. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            Manage and track all your production orders
          </p>
        </div>
        <div className="flex gap-2">
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("xlsx")}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              Export
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          )}
          {isAdminOrOwner ? (
            <Link href="/orders/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </Link>
          ) : (
            <Link href="/orders/request">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Request Order
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400 flex-1">{actionError}</p>
          <Button variant="ghost" size="sm" onClick={() => setActionError(null)} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300">
          <Filter className="h-4 w-4" />
          Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          {mounted ? (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="DELAYED">Delayed</SelectItem>
                <SelectItem value="DISRUPTED">Disrupted</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 rounded-md border border-input bg-transparent" />
          )}

          {/* Factory Filter */}
          {mounted ? (
            <Select value={factoryFilter} onValueChange={setFactoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Factory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Factories</SelectItem>
                {factories.map((factory) => (
                  <SelectItem key={factory.id} value={factory.id}>
                    {factory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 rounded-md border border-input bg-transparent" />
          )}

          {/* Priority Filter */}
          {mounted ? (
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 rounded-md border border-input bg-transparent" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              showCompleted
                ? "border-[#EB5D2E] bg-[#EB5D2E]/10 text-[#EB5D2E]"
                : "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600"
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            {showCompleted ? "Showing all orders" : "Show completed"}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {isAdminOrOwner && selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
          <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedIds.size} order{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="Set status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DELAYED">Delayed</SelectItem>
              <SelectItem value="DISRUPTED">Disrupted</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleBulkUpdate}
            disabled={!bulkStatus || isBulkUpdating}
          >
            {isBulkUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Apply"
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF4D15]" />
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600 dark:text-zinc-400">
            <Package className="h-12 w-12 mb-4 text-zinc-600" />
            <p className="text-lg font-medium text-gray-700 dark:text-zinc-300">No orders found</p>
            <p className="text-sm">
              {hasActiveFilters
                ? "Try adjusting your filters"
                : !showCompleted && orders.length > 0
                ? "All orders are completed — toggle \"Show completed\" to see them"
                : "Create your first order to get started"}
            </p>
            {!hasActiveFilters && (
              isAdminOrOwner ? (
                <Link href="/orders/new" className="mt-4">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Order
                  </Button>
                </Link>
              ) : (
                <Link href="/orders/request" className="mt-4">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Request Order
                  </Button>
                </Link>
              )
            )}
          </div>
        ) : (
          <div className="min-w-max">
            <Table>
            <TableHeader>
              <TableRow>
                {isAdminOrOwner && (
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={visibleOrders.length > 0 && selectedIds.size === visibleOrders.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 accent-blue-600"
                    />
                  </TableHead>
                )}
                <TableHead>Order #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Factory</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Expected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className={`cursor-pointer hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 ${
                    selectedIds.has(order.id) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                  }`}
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  {isAdminOrOwner && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 accent-blue-600"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="font-medium text-[#FF4D15]">
                      {order.orderNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {order.productImage ? (
                        <img
                          src={order.productImage}
                          alt={order.productName}
                          className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0${order.productImage ? " hidden" : ""}`}>
                        <Package className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-zinc-100">{order.productName}</div>
                        {order.productSKU && (
                          <div className="text-sm text-gray-600 dark:text-zinc-400">
                            SKU: {order.productSKU}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-gray-900 dark:text-zinc-100">{order.factory.name}</div>
                      <div className="text-sm text-gray-600 dark:text-zinc-400">
                        {order.factory.location}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.quantity.toLocaleString()} {order.unit}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status] || ""}>
                      {order.status.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[order.priority] || ""}>
                      {order.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            ["COMPLETED", "SHIPPED", "DELIVERED"].includes(order.status)
                              ? "bg-green-600"
                              : order.hasBlockedStage
                              ? "bg-red-500"
                              : order.hasDelayedStage
                              ? "bg-orange-500"
                              : "bg-blue-600"
                          }`}
                          style={{ width: `${order.overallProgress}%` }}
                        />
                      </div>
                      <span className={`text-sm ${
                        order.hasBlockedStage
                          ? "text-red-600"
                          : order.hasDelayedStage
                          ? "text-orange-600"
                          : "text-gray-400 dark:text-zinc-400"
                      }`}>
                        {order.overallProgress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-zinc-400">
                    <div>{formatDate(order.expectedDate)}</div>
                    {order.recurrenceEnabled && order.recurrenceNextDate && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-indigo-600 dark:text-indigo-400">
                        <Repeat className="h-3 w-3" />
                        <span>Next: {formatDate(order.recurrenceNextDate)}</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </div>

      {/* Summary */}
      {visibleOrders.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-zinc-400">
          Showing {visibleOrders.length} order{visibleOrders.length !== 1 ? "s" : ""}{!showCompleted && orders.length > visibleOrders.length ? ` (${orders.length - visibleOrders.length} completed hidden)` : ""}
        </div>
      )}
    </div>
  );
}
