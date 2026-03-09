"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequestDeleteDialog } from "@/components/request-delete-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Factory as FactoryIcon,
  MapPin,
  User,
  Mail,
  Phone,
  Edit,
  Package,
  Calendar,
  Loader2,
  Trash2,
  Activity,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import { useBreadcrumb } from "@/lib/breadcrumb-context";

type OrderStage = {
  id: string;
  progress: number;
  status: string;
};

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  priority: string;
  expectedDate: string;
  overallProgress: number;
  stages: OrderStage[];
};

type Factory = {
  id: string;
  name: string;
  location: string;
  address: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  orders: Order[];
  createdAt: string;
  updatedAt: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  IN_PROGRESS: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  DELAYED: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
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

const statusBarFills: Record<string, string> = {
  PENDING: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  DELAYED: "#f97316",
  DISRUPTED: "#ef4444",
  COMPLETED: "#22c55e",
  SHIPPED: "#a855f7",
  DELIVERED: "#71717a",
  CANCELLED: "#a1a1aa",
};

const ACTIVE_STATUSES = ["IN_PROGRESS", "PENDING", "DELAYED", "DISRUPTED"];

export default function FactoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { setDetail } = useBreadcrumb();
  const isAdminOrOwner = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";
  const [factory, setFactory] = useState<Factory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteRequestOpen, setDeleteRequestOpen] = useState(false);

  useEffect(() => {
    async function fetchFactory() {
      try {
        const response = await fetch(`/api/factories/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load factory");
          return;
        }

        if (data.success) {
          setFactory(data.data);
          setDetail(data.data.name);
        }
      } catch (err) {
        setError("Failed to load factory");
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchFactory();
    }
  }, [params.id, setDetail]);

  const handleDeleteClick = () => {
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!factory) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/factories/${factory.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || "Failed to delete factory");
        setIsDeleting(false);
        return;
      }

      // Success - redirect to factories list
      router.push("/factories");
    } catch (err) {
      setDeleteError("Failed to delete factory");
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-zinc-400" />
      </div>
    );
  }

  if (error || !factory) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:text-zinc-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <FactoryIcon className="h-12 w-12 text-gray-500 dark:text-zinc-500" />
            <p className="text-gray-600 dark:text-zinc-400">{error || "Factory not found"}</p>
            <Link href="/factories">
              <Button variant="outline" className="border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300">
                View All Factories
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Back</span>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{factory.name}</h1>
            <p className="text-sm text-gray-600 dark:text-zinc-400 flex items-center mt-1">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{factory.location}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {isAdminOrOwner ? (
            <>
              <Button
                variant="outline"
                onClick={handleDeleteClick}
                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-400 justify-center"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Link href={`/factories/${factory.id}/edit`} className="flex-1 sm:flex-initial">
                <Button className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 text-white">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Factory
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setDeleteRequestOpen(true)}
                className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-400 justify-center"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Request Delete
              </Button>
              <Link href={`/factories/${factory.id}/request-edit`} className="flex-1 sm:flex-initial">
                <Button className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 text-white">
                  <Edit className="mr-2 h-4 w-4" />
                  Request Edit
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      {(() => {
        const totalOrders = factory.orders.length;
        const activeOrders = factory.orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
        const completedOrders = factory.orders.filter((o) => ["COMPLETED", "SHIPPED", "DELIVERED"].includes(o.status));
        const delayedCompleted = completedOrders.filter((o) => o.status === "DELAYED").length;
        const onTimeRate = completedOrders.length > 0
          ? Math.round(((completedOrders.length - delayedCompleted) / completedOrders.length) * 100)
          : null;
        const activeOrdersList = factory.orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
        const avgProgress = activeOrdersList.length > 0
          ? Math.round(activeOrdersList.reduce((sum, o) => sum + o.overallProgress, 0) / activeOrdersList.length)
          : null;

        return (
          <>
          <p className="hud-section-label font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-4">
            Performance
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Orders */}
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">TOT</span>
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Total Orders</p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF4D15]/10">
                  <Package className="h-4 w-4 text-[#FF4D15]" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white"><AnimatedNumber value={totalOrders} /></p>
              <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">all time</p>
            </div>

            {/* Active Orders */}
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">ACT</span>
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Active</p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <Activity className="h-4 w-4 text-blue-500" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white"><AnimatedNumber value={activeOrders} /></p>
              <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">in production</p>
            </div>

            {/* On-Time Rate */}
            <div className={`rounded-xl border p-5 card-hover-glow hud-corners ${
              onTimeRate !== null && onTimeRate < 80
                ? "border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20"
                : "border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13]"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">OTR</span>
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">On-Time Rate</p>
                </div>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  onTimeRate !== null && onTimeRate < 80
                    ? "bg-red-500/10"
                    : "bg-green-500/10"
                }`}>
                  <CheckCircle2 className={`h-4 w-4 ${
                    onTimeRate !== null && onTimeRate < 80 ? "text-red-500" : "text-green-500"
                  }`} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {onTimeRate !== null ? <><AnimatedNumber value={onTimeRate} />%</> : "—"}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                {completedOrders.length > 0 ? `${completedOrders.length} completed` : "no completed orders"}
              </p>
            </div>

            {/* Avg Progress */}
            <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-5 card-hover-glow hud-corners">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">PRG</span>
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Avg Progress</p>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {avgProgress !== null ? <><AnimatedNumber value={avgProgress} />%</> : "—"}
              </p>
              {avgProgress !== null && (
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-zinc-700">
                  <div
                    className="h-1.5 rounded-full bg-purple-500 transition-all"
                    style={{ width: `${avgProgress}%` }}
                  />
                </div>
              )}
              {avgProgress === null && (
                <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">no active orders</p>
              )}
            </div>
          </div>
          </>
        );
      })()}

      {/* Factory & Contact Info — single condensed card */}
      <p className="hud-section-label font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-4">
        Details
      </p>
      <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] card-hover-glow hud-corners">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-zinc-800/60">
          {/* Factory Info */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">MFG</span>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Factory</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FactoryIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                <span className="text-sm text-gray-900 dark:text-white">{factory.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-zinc-300">{factory.location}</span>
              </div>
              {factory.address && (
                <p className="text-sm text-gray-500 dark:text-zinc-400 pl-6">{factory.address}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">CON</span>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Contact</h3>
            </div>
            {factory.contactName || factory.contactEmail || factory.contactPhone ? (
              <div className="space-y-2">
                {factory.contactName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                    <span className="text-sm text-gray-900 dark:text-white">{factory.contactName}</span>
                  </div>
                )}
                {factory.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                    <a
                      href={`mailto:${factory.contactEmail}`}
                      className="text-sm text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {factory.contactEmail}
                    </a>
                  </div>
                )}
                {factory.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400 dark:text-zinc-500 flex-shrink-0" />
                    <a
                      href={`tel:${factory.contactPhone}`}
                      className="text-sm text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {factory.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-zinc-500">No contact information</p>
            )}
          </div>
        </div>
      </div>

      {/* Orders from this Factory */}
      <p className="hud-section-label font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mb-4">
        Production
      </p>
      <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">ORD</span>
              <div>
                <CardTitle className="text-gray-900 dark:text-white">Orders</CardTitle>
                <CardDescription className="text-gray-600 dark:text-zinc-400">
                  All orders from this factory
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300">
              {factory.orders.length} {factory.orders.length === 1 ? "Order" : "Orders"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {factory.orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Package className="h-12 w-12 text-gray-400 dark:text-zinc-600" />
              <p className="text-gray-500 dark:text-zinc-500">No orders from this factory yet</p>
              {isAdminOrOwner ? (
                <Link href="/orders/new">
                  <Button className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">
                    Create First Order
                  </Button>
                </Link>
              ) : (
                <Link href="/orders/request">
                  <Button className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">
                    Request an Order
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status distribution bar */}
              {(() => {
                const counts: Record<string, number> = {};
                for (const order of factory.orders) {
                  counts[order.status] = (counts[order.status] || 0) + 1;
                }
                const total = factory.orders.length;
                return (
                  <div className="space-y-2">
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-700">
                      {Object.entries(counts).map(([status, count]) => (
                        <div
                          key={status}
                          style={{
                            width: `${(count / total) * 100}%`,
                            backgroundColor: statusBarFills[status] || "#71717a",
                          }}
                          title={`${status.replace("_", " ")}: ${count}`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {Object.entries(counts).map(([status, count]) => (
                        <div key={status} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: statusBarFills[status] || "#71717a" }}
                          />
                          {status.replace("_", " ")} ({count})
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Orders table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                        Order #
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                        Product
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                        Quantity
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                        Priority
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                        Progress
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                        Due Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {factory.orders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="border-b border-gray-200 dark:border-zinc-700/50 hover:bg-gray-50 dark:hover:bg-zinc-700/30 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-zinc-300">
                          {order.productName}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-zinc-300">
                          {order.quantity} {order.unit}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="secondary"
                            className={statusColors[order.status] || ""}
                          >
                            {order.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="secondary"
                            className={priorityColors[order.priority] || ""}
                          >
                            {order.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-100 dark:bg-zinc-700 rounded-full h-2 max-w-[100px]">
                              <div
                                className={`h-2 rounded-full ${
                                  order.overallProgress === 100
                                    ? "bg-green-500"
                                    : order.overallProgress > 0
                                    ? "bg-blue-500"
                                    : "bg-zinc-600"
                                }`}
                                style={{ width: `${order.overallProgress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-zinc-400 min-w-[40px]">
                              {order.overallProgress}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-zinc-300">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-500 dark:text-zinc-500" />
                            {formatDate(order.expectedDate)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="text-sm text-gray-500 dark:text-zinc-500">
        Created {formatDateTime(factory.createdAt)} • Last updated{" "}
        {formatDateTime(factory.updatedAt)}
      </div>

      {/* Delete Confirmation Dialog (Admin only) */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Delete Factory</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{factory.name}</span>?
              This action cannot be undone.
              {factory.orders.length > 0 && (
                <span className="block mt-2 text-red-400">
                  This factory has {factory.orders.length} order
                  {factory.orders.length === 1 ? "" : "s"}.
                </span>
              )}
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
              className="border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:bg-zinc-700"
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

      {/* Delete Request Dialog (non-admin users) */}
      {!isAdminOrOwner && (
        <RequestDeleteDialog
          entityType="factory"
          entityId={factory.id}
          entityName={factory.name}
          open={deleteRequestOpen}
          onOpenChange={setDeleteRequestOpen}
        />
      )}
    </div>
  );
}
