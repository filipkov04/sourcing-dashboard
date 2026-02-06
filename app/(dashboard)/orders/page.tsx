"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Plus, Search, Package, Filter, X } from "lucide-react";

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  productSKU: string | null;
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
};

type Factory = {
  id: string;
  name: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  IN_PROGRESS: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  DELAYED: "bg-orange-50 text-[#EB5D2E] dark:bg-orange-900/20 dark:text-[#EB5D2E]",
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [factoryFilter, setFactoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
        <Link href="/orders/new" className="sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </Link>
      </div>

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

          {/* Factory Filter */}
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

          {/* Priority Filter */}
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
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EB5D2E]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600 dark:text-zinc-400">
            <Package className="h-12 w-12 mb-4 text-zinc-600" />
            <p className="text-lg font-medium text-gray-700 dark:text-zinc-300">No orders found</p>
            <p className="text-sm">
              {hasActiveFilters
                ? "Try adjusting your filters"
                : "Create your first order to get started"}
            </p>
            {!hasActiveFilters && (
              <Link href="/orders/new" className="mt-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="min-w-max">
            <Table>
            <TableHeader>
              <TableRow>
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
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-zinc-800/50"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <TableCell>
                    <span className="font-medium text-[#EB5D2E]">
                      {order.orderNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-zinc-100">{order.productName}</div>
                      {order.productSKU && (
                        <div className="text-sm text-gray-600 dark:text-zinc-400">
                          SKU: {order.productSKU}
                        </div>
                      )}
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
                      {order.status.replace("_", " ")}
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
                            order.status === "COMPLETED"
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
                          : "text-zinc-400"
                      }`}>
                        {order.overallProgress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-zinc-400">
                    {formatDate(order.expectedDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </div>

      {/* Summary */}
      {orders.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-zinc-400">
          Showing {orders.length} order{orders.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
