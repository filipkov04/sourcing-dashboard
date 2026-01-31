"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  Factory,
  Package,
  Edit,
  MapPin,
  User,
  Mail,
  Phone,
  Clock,
  Tag,
  FileText,
  CheckCircle2,
  Circle,
  Loader2,
  Pencil,
  Save,
  X,
} from "lucide-react";

type OrderStage = {
  id: string;
  name: string;
  sequence: number;
  progress: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
};

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
  actualDate: string | null;
  notes: string | null;
  tags: string[];
  factory: {
    id: string;
    name: string;
    location: string;
    address: string | null;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
  };
  stages: OrderStage[];
  createdAt: string;
  updatedAt: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  DELAYED: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  NORMAL: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
};

const stageStatusColors: Record<string, string> = {
  NOT_STARTED: "text-gray-400",
  IN_PROGRESS: "text-blue-600",
  COMPLETED: "text-green-600",
  SKIPPED: "text-gray-400",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stage editing state
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingProgress, setEditingProgress] = useState<number>(0);
  const [isSavingStage, setIsSavingStage] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load order");
          return;
        }

        if (data.success) {
          setOrder(data.data);
        }
      } catch (err) {
        setError("Failed to load order");
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStageIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "IN_PROGRESS":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  // Stage progress editing functions (Admin only - role check will be added in Week 5)
  const startEditingStage = (stage: OrderStage) => {
    setEditingStageId(stage.id);
    setEditingProgress(stage.progress);
  };

  const cancelEditingStage = () => {
    setEditingStageId(null);
    setEditingProgress(0);
  };

  const saveStageProgress = async (stageId: string) => {
    if (!order) return;

    setIsSavingStage(true);
    try {
      const response = await fetch(
        `/api/orders/${order.id}/stages/${stageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ progress: editingProgress }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state
        setOrder({
          ...order,
          overallProgress: data.data.overallProgress,
          stages: order.stages.map((s) =>
            s.id === stageId
              ? {
                  ...s,
                  progress: data.data.stage.progress,
                  status: data.data.stage.status,
                  startedAt: data.data.stage.startedAt,
                  completedAt: data.data.stage.completedAt,
                }
              : s
          ),
        });
        setEditingStageId(null);
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
    } finally {
      setIsSavingStage(false);
    }
  };

  const quickSetProgress = async (stageId: string, progress: number) => {
    if (!order) return;

    setIsSavingStage(true);
    try {
      const response = await fetch(
        `/api/orders/${order.id}/stages/${stageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ progress }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setOrder({
          ...order,
          overallProgress: data.data.overallProgress,
          stages: order.stages.map((s) =>
            s.id === stageId
              ? {
                  ...s,
                  progress: data.data.stage.progress,
                  status: data.data.stage.status,
                  startedAt: data.data.stage.startedAt,
                  completedAt: data.data.stage.completedAt,
                }
              : s
          ),
        });
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
    } finally {
      setIsSavingStage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Package className="h-12 w-12 mb-4 text-gray-300" />
          <p className="text-lg font-medium">{error || "Order not found"}</p>
          <Link href="/orders" className="mt-4">
            <Button>View All Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const daysUntilDue = Math.ceil(
    (new Date(order.expectedDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {order.orderNumber}
            </h1>
            <Badge className={statusColors[order.status]}>
              {order.status.replace("_", " ")}
            </Badge>
            <Badge className={priorityColors[order.priority]}>
              {order.priority}
            </Badge>
          </div>
          <p className="text-gray-500 ml-10">{order.productName}</p>
        </div>
        <Link href={`/orders/${order.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Order
          </Button>
        </Link>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {order.overallProgress}% Complete
              </span>
              <span
                className={`font-medium ${
                  daysUntilDue < 0
                    ? "text-red-600"
                    : daysUntilDue <= 7
                    ? "text-yellow-600"
                    : "text-gray-600"
                }`}
              >
                {daysUntilDue < 0
                  ? `${Math.abs(daysUntilDue)} days overdue`
                  : daysUntilDue === 0
                  ? "Due today"
                  : `${daysUntilDue} days remaining`}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  order.status === "COMPLETED"
                    ? "bg-green-600"
                    : order.status === "DELAYED"
                    ? "bg-red-500"
                    : "bg-blue-600"
                }`}
                style={{ width: `${order.overallProgress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Product Name</p>
                <p className="font-medium">{order.productName}</p>
              </div>
              {order.productSKU && (
                <div>
                  <p className="text-sm text-gray-500">SKU</p>
                  <p className="font-medium">{order.productSKU}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-medium">
                  {order.quantity.toLocaleString()} {order.unit}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-medium">{order.orderNumber}</p>
              </div>
            </div>

            <hr className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">{formatDate(order.orderDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Expected Date</p>
                  <p className="font-medium">{formatDate(order.expectedDate)}</p>
                </div>
              </div>
              {order.actualDate && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Actual Completion</p>
                    <p className="font-medium">{formatDate(order.actualDate)}</p>
                  </div>
                </div>
              )}
            </div>

            {order.tags && order.tags.length > 0 && (
              <>
                <hr className="my-4" />
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {order.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {order.notes && (
              <>
                <hr className="my-4" />
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                      {order.notes}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Factory Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Factory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Link
                href={`/factories/${order.factory.id}`}
                className="text-lg font-medium text-blue-600 hover:underline"
              >
                {order.factory.name}
              </Link>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <MapPin className="h-4 w-4" />
                {order.factory.location}
              </div>
            </div>

            {order.factory.address && (
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-sm">{order.factory.address}</p>
              </div>
            )}

            {(order.factory.contactName ||
              order.factory.contactEmail ||
              order.factory.contactPhone) && (
              <>
                <hr />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Contact</p>
                  {order.factory.contactName && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      {order.factory.contactName}
                    </div>
                  )}
                  {order.factory.contactEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a
                        href={`mailto:${order.factory.contactEmail}`}
                        className="text-blue-600 hover:underline"
                      >
                        {order.factory.contactEmail}
                      </a>
                    </div>
                  )}
                  {order.factory.contactPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a
                        href={`tel:${order.factory.contactPhone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {order.factory.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Production Stages */}
      {order.stages && order.stages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Production Stages</CardTitle>
            <CardDescription>
              Track and update progress through each stage of production
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-gray-50"
                >
                  {/* Stage Icon */}
                  <div className="flex flex-col items-center">
                    {getStageIcon(stage.status)}
                    {index < order.stages.length - 1 && (
                      <div
                        className={`w-0.5 h-8 mt-2 ${
                          stage.status === "COMPLETED"
                            ? "bg-green-300"
                            : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>

                  {/* Stage Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{stage.name}</h4>
                        <Badge
                          variant="outline"
                          className={stageStatusColors[stage.status]}
                        >
                          {stage.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {stage.progress}%
                        </span>
                        {editingStageId !== stage.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingStage(stage)}
                            disabled={isSavingStage}
                            className="h-7 w-7 p-0"
                          >
                            <Pencil className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar or Editor */}
                    {editingStageId === stage.id ? (
                      <div className="space-y-3 mb-2">
                        {/* Slider */}
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingProgress}
                            onChange={(e) =>
                              setEditingProgress(parseInt(e.target.value))
                            }
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editingProgress}
                            onChange={(e) =>
                              setEditingProgress(
                                Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                              )
                            }
                            className="w-16 h-8 text-center text-sm"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>

                        {/* Quick buttons */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Quick set:</span>
                          {[0, 25, 50, 75, 100].map((val) => (
                            <Button
                              key={val}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingProgress(val)}
                              className={`h-6 px-2 text-xs ${
                                editingProgress === val
                                  ? "bg-blue-50 border-blue-300"
                                  : ""
                              }`}
                            >
                              {val}%
                            </Button>
                          ))}
                        </div>

                        {/* Save/Cancel */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveStageProgress(stage.id)}
                            disabled={isSavingStage}
                          >
                            {isSavingStage ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="h-3.5 w-3.5 mr-1" />
                                Save
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditingStage}
                            disabled={isSavingStage}
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Progress Bar */}
                        <div
                          className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2 cursor-pointer hover:bg-gray-300 transition-colors"
                          onClick={() => startEditingStage(stage)}
                          title="Click to edit progress"
                        >
                          <div
                            className={`h-full rounded-full transition-all ${
                              stage.status === "COMPLETED"
                                ? "bg-green-500"
                                : stage.status === "IN_PROGRESS"
                                ? "bg-blue-500"
                                : "bg-gray-300"
                            }`}
                            style={{ width: `${stage.progress}%` }}
                          />
                        </div>

                        {/* Quick progress buttons (visible on hover via group) */}
                        {stage.status !== "COMPLETED" && (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-xs text-gray-400 mr-1">
                              Quick update:
                            </span>
                            {stage.progress < 100 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  quickSetProgress(
                                    stage.id,
                                    Math.min(100, stage.progress + 25)
                                  )
                                }
                                disabled={isSavingStage}
                                className="h-6 px-2 text-xs"
                              >
                                +25%
                              </Button>
                            )}
                            {stage.progress < 100 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => quickSetProgress(stage.id, 100)}
                                disabled={isSavingStage}
                                className="h-6 px-2 text-xs text-green-600 hover:text-green-700"
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Stage Dates */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {stage.startedAt && (
                        <span>Started: {formatDateTime(stage.startedAt)}</span>
                      )}
                      {stage.completedAt && (
                        <span>
                          Completed: {formatDateTime(stage.completedAt)}
                        </span>
                      )}
                    </div>

                    {/* Stage Notes */}
                    {stage.notes && (
                      <p className="mt-2 text-sm text-gray-600">{stage.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-400 flex items-center gap-4">
        <span>Created: {formatDateTime(order.createdAt)}</span>
        <span>Last updated: {formatDateTime(order.updatedAt)}</span>
      </div>
    </div>
  );
}
