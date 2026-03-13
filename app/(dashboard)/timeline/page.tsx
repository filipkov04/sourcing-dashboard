"use client";

import { useEffect, useState, useMemo } from "react";
import { Filter, X, CalendarRange } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GanttChart } from "@/components/gantt/gantt-chart";
import { AnimatedNumber } from "@/components/animated-number";

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  status: string;
  overallProgress: number;
  orderDate: string;
  expectedDate: string;
  priority: string;
  factory: {
    id: string;
    name: string;
    location: string;
  };
};

type Factory = {
  id: string;
  name: string;
};

export default function TimelinePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [factoryFilter, setFactoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Fetch factories
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

  // Fetch orders with server-side filters
  useEffect(() => {
    async function fetchOrders() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("include", "stages");
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

    fetchOrders();
  }, [statusFilter, factoryFilter, priorityFilter]);

  // Client-side date range filter (orders overlap with selected range)
  const filteredOrders = useMemo(() => {
    if (!dateFrom && !dateTo) return orders;

    return orders.filter((order) => {
      const orderStart = new Date(order.orderDate);
      const orderEnd = new Date(order.expectedDate);

      if (dateFrom) {
        // First day of the selected month
        const rangeStart = new Date(dateFrom + "-01");
        // If order ends before range start, exclude
        if (orderEnd < rangeStart) return false;
      }

      if (dateTo) {
        // Last day of the selected month
        const [year, month] = dateTo.split("-").map(Number);
        const rangeEnd = new Date(year, month, 0, 23, 59, 59);
        // If order starts after range end, exclude
        if (orderStart > rangeEnd) return false;
      }

      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const stats = useMemo(() => ({
    total: filteredOrders.length,
    inProgress: filteredOrders.filter(o => o.status === "IN_PROGRESS").length,
    critical: filteredOrders.filter(o => ["DELAYED", "DISRUPTED"].includes(o.status)).length,
    done: filteredOrders.filter(o => ["COMPLETED", "SHIPPED", "DELIVERED"].includes(o.status)).length,
  }), [filteredOrders]);

  const clearFilters = () => {
    setStatusFilter("all");
    setFactoryFilter("all");
    setPriorityFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    factoryFilter !== "all" ||
    priorityFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  const activeFilterCount = [
    statusFilter !== "all",
    factoryFilter !== "all",
    priorityFilter !== "all",
    dateFrom !== "" || dateTo !== "",
  ].filter(Boolean).length;

  return (
    <div className="relative space-y-6">
      {/* HUD Grid Overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-0 dark:opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,77,21,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,21,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
          Production Timeline
        </h1>
        <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
          Gantt chart overview of all production orders
        </p>
      </div>

      {/* Stats Strip */}
      {!isLoading && orders.length > 0 && (
        <>
        <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
          Overview
        </p>
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Total",       tag: "TOT", value: stats.total,      color: "#71717a" },
            { label: "In Progress", tag: "WIP", value: stats.inProgress, color: "#3b82f6" },
            { label: "Critical",    tag: "CRT", value: stats.critical,   color: "#ef4444" },
            { label: "Done",        tag: "DON", value: stats.done,       color: "#22c55e" },
          ].map(({ label, tag, value, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-[#0d0f13] border border-gray-100 dark:border-zinc-800/60 card-hover-glow hud-corners"
              style={{ borderLeft: `3px solid ${color}` }}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">{tag}</span>
              <span className="text-base font-bold tabular-nums text-gray-900 dark:text-white">
                <AnimatedNumber value={value} />
              </span>
              <span className="text-sm text-gray-500 dark:text-zinc-400">
                {label}
              </span>
            </div>
          ))}
        </div>
        </>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-[#0d0f13] p-5 rounded-xl border border-gray-100 dark:border-zinc-800/60 space-y-4 card-hover-glow hud-corners">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-zinc-300">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">FLT</span>
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Status Filter */}
          <Select name="timeline-status-filter" value={statusFilter} onValueChange={setStatusFilter}>
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
          <Select name="timeline-factory-filter" value={factoryFilter} onValueChange={setFactoryFilter}>
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
          <Select name="timeline-priority-filter" value={priorityFilter} onValueChange={setPriorityFilter}>
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

          {/* Date Range: From */}
          <div>
            <label htmlFor="timeline-date-from" className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">From</label>
            <Input
              id="timeline-date-from"
              name="timeline-date-from"
              type="month"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Date Range: To */}
          <div>
            <label htmlFor="timeline-date-to" className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">To</label>
            <Input
              id="timeline-date-to"
              name="timeline-date-to"
              type="month"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
        Gantt View
      </p>
      <div className="bg-white dark:bg-[#0d0f13] rounded-xl border border-gray-100 dark:border-zinc-800/60 p-4 overflow-hidden card-hover-glow hud-corners">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF4D15]" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600 dark:text-zinc-400">
            <CalendarRange className="h-12 w-12 mb-4 text-zinc-600" />
            <p className="text-lg font-medium text-gray-700 dark:text-zinc-300">
              No orders to display
            </p>
            <p className="text-sm">
              {hasActiveFilters
                ? "Try adjusting your filters"
                : "Create orders to see them on the timeline"}
            </p>
          </div>
        ) : (
          <GanttChart orders={filteredOrders} />
        )}
      </div>

      {/* Summary */}
      {filteredOrders.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-zinc-400">
          Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} on timeline
          {filteredOrders.length !== orders.length && (
            <span> (filtered from {orders.length} total)</span>
          )}
        </div>
      )}
    </div>
  );
}
