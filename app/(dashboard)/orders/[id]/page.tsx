"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  History,
  Shield,
  ClipboardList,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HorizontalTimeline } from "@/components/timeline";
import { StageAdminPanel } from "@/components/stage-admin-panel";
import { OrderAttachments } from "@/components/order-attachments";
import { OrderComments } from "@/components/order-comments";

type OrderStage = {
  id: string;
  name: string;
  sequence: number;
  progress: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  expectedStartDate: string | null;
  expectedEndDate: string | null;
  notes: string | null;
  metadata?: Record<string, unknown> | null;
};

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
  DELAYED: "bg-orange-100 text-orange-800",
  DISRUPTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-200",
  CANCELLED: "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400",
  NORMAL: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
};

const stageStatusColors: Record<string, string> = {
  NOT_STARTED: "text-zinc-500",
  IN_PROGRESS: "text-blue-600",
  COMPLETED: "text-green-600",
  SKIPPED: "text-zinc-500",
  DELAYED: "text-yellow-600",
  BLOCKED: "text-red-600",
};

const stageStatusBadgeColors: Record<string, string> = {
  NOT_STARTED: "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  SKIPPED: "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400",
  DELAYED: "bg-orange-100 text-orange-700",
  BLOCKED: "bg-red-100 text-red-700",
};

function SortableMetadataDisplayItem({
  id,
  entry,
  onRemove,
}: {
  id: string;
  entry: { key: string; value: string };
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 group/row rounded px-1 -mx-1 ${isDragging ? "opacity-50 bg-gray-100 dark:bg-zinc-700/50" : "hover:bg-gray-100/50 dark:hover:bg-zinc-700/30"}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-0.5 text-gray-300 dark:text-zinc-600 hover:text-gray-500 dark:hover:text-zinc-400 touch-none flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <p className="text-sm text-gray-900 dark:text-zinc-200 flex-1 min-w-0 truncate">
        <span className="font-medium text-gray-600 dark:text-zinc-400">{entry.key}:</span>{" "}
        {entry.value || "—"}
      </p>
      <button
        type="button"
        className="flex-shrink-0 p-0.5 text-gray-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdminOrOwner = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin panel state
  const [showOrderInfoAdmin, setShowOrderInfoAdmin] = useState(false);
  const [adminPanelStages, setAdminPanelStages] = useState<Set<string>>(new Set());
  const [stageAdminNotes, setStageAdminNotes] = useState<Record<string, { id: string; content: string; authorName: string | null; createdAt: string; type: string }[]>>({});

  // Stage editing state
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingProgress, setEditingProgress] = useState<number>(0);
  const [editingStatus, setEditingStatus] = useState<string>("");
  const [editingNotes, setEditingNotes] = useState<string>("");
  const [editingMetadata, setEditingMetadata] = useState<{ key: string; value: string }[]>([]);
  const [editingExpectedStart, setEditingExpectedStart] = useState<string>("");
  const [editingExpectedEnd, setEditingExpectedEnd] = useState<string>("");
  const [isSavingStage, setIsSavingStage] = useState(false);

  // Expanded stages (for viewing notes/delay info)
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  // Timeline refresh trigger — increment to refetch timeline events
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);

  // Order status quick-update
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Error state for stage saves (replaces alert())
  const [stageSaveError, setStageSaveError] = useState<string | null>(null);

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

  // Fetch admin notes for all stages (visible to everyone as updates)
  useEffect(() => {
    async function fetchAdminNotes() {
      try {
        const response = await fetch(`/api/orders/${params.id}/admin-notes`);
        const data = await response.json();
        if (data.success) {
          // Group notes by stageId
          const grouped: Record<string, typeof data.data> = {};
          for (const note of data.data) {
            if (!grouped[note.stageId]) grouped[note.stageId] = [];
            grouped[note.stageId].push(note);
          }
          setStageAdminNotes(grouped);
        }
      } catch (err) {
        // Silently fail — notes are supplementary
      }
    }

    if (params.id) {
      fetchAdminNotes();
    }
  }, [params.id]);

  // Drag-and-drop for metadata field reordering (hooks must be before early returns)
  const metadataSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const metadataIds = editingMetadata.map((_, idx) => `meta-${idx}`);

  const handleMetadataDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = metadataIds.indexOf(String(active.id));
      const newIndex = metadataIds.indexOf(String(over.id));
      setEditingMetadata(arrayMove(editingMetadata, oldIndex, newIndex));
    }
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
      case "DELAYED":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "BLOCKED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400 dark:text-zinc-600" />;
    }
  };

  const toggleStageExpanded = (stageId: string) => {
    setExpandedStages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  // Stage progress editing functions (Admin only - role check will be added in Week 5)
  const startEditingStage = (stage: OrderStage) => {
    setEditingStageId(stage.id);
    setEditingProgress(stage.progress);
    setEditingStatus(stage.status);
    setEditingNotes(stage.notes || "");
    let meta: { key: string; value: string }[] = [];
    if (stage.metadata && typeof stage.metadata === "object") {
      if (Array.isArray(stage.metadata)) {
        // New array format — preserves insertion order
        meta = (stage.metadata as { key: string; value: unknown }[]).map(({ key, value }) => ({ key, value: String(value) }));
      } else {
        // Legacy object format — convert to array
        meta = Object.entries(stage.metadata as Record<string, unknown>).map(([key, value]) => ({ key, value: String(value) }));
      }
    }
    setEditingMetadata(meta);
    // Initialize expected dates (convert ISO to YYYY-MM-DD for date input)
    setEditingExpectedStart(stage.expectedStartDate ? new Date(stage.expectedStartDate).toISOString().split("T")[0] : "");
    setEditingExpectedEnd(stage.expectedEndDate ? new Date(stage.expectedEndDate).toISOString().split("T")[0] : "");
  };

  const cancelEditingStage = () => {
    setEditingStageId(null);
    setEditingProgress(0);
    setEditingStatus("");
    setEditingNotes("");
    setEditingMetadata([]);
    setEditingExpectedStart("");
    setEditingExpectedEnd("");
  };

  const saveStageProgress = async (stageId: string) => {
    if (!order) return;

    setIsSavingStage(true);
    try {
      // Build metadata array from key-value pairs (skip empty keys, preserve order)
      const metadataArr = editingMetadata
        .filter(({ key }) => key.trim())
        .map(({ key, value }) => ({ key: key.trim(), value }));

      const response = await fetch(
        `/api/orders/${order.id}/stages/${stageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            progress: editingProgress,
            status: editingStatus,
            notes: editingNotes,
            metadata: metadataArr,
            expectedStartDate: editingExpectedStart || "",
            expectedEndDate: editingExpectedEnd || "",
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local state including order status
        setOrder({
          ...order,
          overallProgress: data.data.overallProgress,
          status: data.data.orderStatus || order.status,
          stages: order.stages.map((s) =>
            s.id === stageId
              ? {
                  ...s,
                  progress: data.data.stage.progress,
                  status: data.data.stage.status,
                  startedAt: data.data.stage.startedAt,
                  completedAt: data.data.stage.completedAt,
                  expectedStartDate: data.data.stage.expectedStartDate,
                  expectedEndDate: data.data.stage.expectedEndDate,
                  notes: data.data.stage.notes,
                  metadata: data.data.stage.metadata,
                }
              : s
          ),
        });
        // Trigger timeline refresh to show new events
        setTimelineRefreshKey((k) => k + 1);
        setStageSaveError(null);
        // Close the editing panel
        setEditingStageId(null);
        setEditingProgress(0);
        setEditingStatus("");
        setEditingNotes("");
        setEditingMetadata([]);
        setEditingExpectedStart("");
        setEditingExpectedEnd("");
      } else {
        console.error("Failed to save stage:", data.error || "Unknown error");
        setStageSaveError(data.error || "Failed to save changes. Please try again.");
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
      setStageSaveError("Failed to save changes. Please try again.");
    } finally {
      setIsSavingStage(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order || newStatus === order.status) return;

    setIsUpdatingStatus(true);
    try {
      const body: Record<string, unknown> = { status: newStatus };

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOrder({
          ...order,
          status: data.data.status,
          overallProgress: data.data.overallProgress,
          actualDate: data.data.actualDate,
        });
        setTimelineRefreshKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdatingStatus(false);
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
        // Trigger timeline refresh to show new events
        setTimelineRefreshKey((k) => k + 1);
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
        <div className="flex flex-col items-center justify-center h-64 text-gray-600 dark:text-zinc-400">
          <Package className="h-12 w-12 mb-4 text-gray-400 dark:text-zinc-600" />
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

  // Check if any stage is delayed or blocked
  const hasBlockedStage = order.stages?.some((s) => s.status === "BLOCKED");
  const hasDelayedStage = order.stages?.some((s) => s.status === "DELAYED");

  // Determine overall progress bar color based on stage statuses
  const getOverallProgressColor = () => {
    if (["COMPLETED", "SHIPPED", "DELIVERED"].includes(order.status)) return "bg-green-600";
    if (hasBlockedStage) return "bg-red-500";
    if (hasDelayedStage) return "bg-orange-500";
    if (order.status === "DELAYED") return "bg-orange-500";
    return "bg-blue-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {order.orderNumber}
            </h1>
            {isAdminOrOwner ? (
              <Select
                value={order.status}
                onValueChange={updateOrderStatus}
                disabled={isUpdatingStatus}
              >
                <SelectTrigger className={`h-6 w-auto gap-1 border-0 px-2.5 py-0 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                  {isUpdatingStatus ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <SelectValue />
                  )}
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
            ) : (
              <Badge className={statusColors[order.status]}>
                {order.status.replace("_", " ")}
              </Badge>
            )}
            <Badge className={priorityColors[order.priority]}>
              {order.priority}
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-zinc-400 ml-10">{order.productName}</p>
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
              <span className="text-gray-600 dark:text-zinc-400">
                {order.overallProgress}% Complete
              </span>
              <span
                className={`font-medium ${
                  daysUntilDue < 0
                    ? "text-red-600"
                    : daysUntilDue <= 7
                    ? "text-yellow-600"
                    : "text-zinc-400"
                }`}
              >
                {daysUntilDue < 0
                  ? `${Math.abs(daysUntilDue)} days overdue`
                  : daysUntilDue === 0
                  ? "Due today"
                  : `${daysUntilDue} days remaining`}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-zinc-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getOverallProgressColor()}`}
                style={{ width: `${order.overallProgress}%` }}
              />
            </div>
            {/* Show warning if any stage is delayed or blocked */}
            {(hasDelayedStage || hasBlockedStage) && (
              <div className={`flex items-center gap-2 text-xs mt-2 ${hasBlockedStage ? "text-red-600" : "text-yellow-600"}`}>
                {hasBlockedStage ? (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    <span>One or more stages are blocked</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>One or more stages are delayed</span>
                  </>
                )}
              </div>
            )}
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
            <div className="flex items-start gap-5">
              {order.productImage && (
                <img
                  src={order.productImage}
                  alt={order.productName}
                  className="w-40 h-40 rounded-lg object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className="space-y-1.5">
                <p className="text-lg font-semibold">{order.productName}</p>
                {order.productSKU && (
                  <p className="text-sm text-gray-600 dark:text-zinc-400">SKU: {order.productSKU}</p>
                )}
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                  Quantity: {order.quantity.toLocaleString()} {order.unit}
                </p>
                {order.tags && order.tags.length > 0 && (
                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                    Category: {order.tags.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <hr className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Order Number</p>
                <p className="font-medium">{order.orderNumber}</p>
              </div>
            </div>

            <hr className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-gray-500 dark:text-zinc-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Order Date</p>
                  <p className="font-medium">{formatDate(order.orderDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-gray-500 dark:text-zinc-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Expected Date</p>
                  <p className="font-medium">{formatDate(order.expectedDate)}</p>
                </div>
              </div>
              {order.actualDate && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Actual Completion</p>
                    <p className="font-medium">{formatDate(order.actualDate)}</p>
                  </div>
                </div>
              )}
            </div>

            {order.tags && order.tags.length > 0 && (
              <>
                <hr className="my-4" />
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 mt-0.5 text-gray-500 dark:text-zinc-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mb-2">Tags</p>
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
                  <FileText className="h-4 w-4 mt-0.5 text-gray-500 dark:text-zinc-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Notes</p>
                    <p className="mt-1 text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">
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
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-zinc-400 mt-1">
                <MapPin className="h-4 w-4" />
                {order.factory.location}
              </div>
            </div>

            {order.factory.address && (
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Address</p>
                <p className="text-sm">{order.factory.address}</p>
              </div>
            )}

            {(order.factory.contactName ||
              order.factory.contactEmail ||
              order.factory.contactPhone) && (
              <>
                <hr />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Contact</p>
                  {order.factory.contactName && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500 dark:text-zinc-500" />
                      {order.factory.contactName}
                    </div>
                  )}
                  {order.factory.contactEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500 dark:text-zinc-500" />
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
                      <Phone className="h-4 w-4 text-gray-500 dark:text-zinc-500" />
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

      {/* Attachments */}
      <OrderAttachments orderId={order.id} isAdmin={isAdminOrOwner} />

      {/* Comments */}
      <OrderComments
        orderId={order.id}
        currentUserId={session?.user?.id}
        userRole={session?.user?.role}
      />

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
              {/* Stage save error banner */}
              {stageSaveError && (
                <div className="flex items-center justify-between rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-3 text-sm text-red-600 dark:text-red-300">
                  <span>{stageSaveError}</span>
                  <Button variant="ghost" size="sm" onClick={() => setStageSaveError(null)} className="h-6 w-6 p-0">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* Order Information Changes — admin-only notes section */}
              {isAdminOrOwner && (
                <div className="p-4 rounded-lg border border-dashed border-purple-200 dark:border-zinc-600 bg-purple-50/50 dark:bg-zinc-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                      <h4 className="font-medium text-purple-600 dark:text-purple-300">Order Information Changes</h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOrderInfoAdmin((prev) => !prev)}
                      className={`h-7 w-7 p-0 ${showOrderInfoAdmin ? "text-purple-400" : ""}`}
                      title="Admin notes for order-level changes"
                    >
                      <Shield className="h-3.5 w-3.5 text-gray-500 dark:text-zinc-500 hover:text-purple-400" />
                    </Button>
                  </div>
                  {showOrderInfoAdmin && (
                    <StageAdminPanel
                      orderId={order.id}
                      stageId="order-info"
                      stageName="Order Information Changes"
                      variant="full"
                      currentUserId={session?.user?.id}
                      onNoteAdded={() => setTimelineRefreshKey((k) => k + 1)}
                      onNoteUpdated={() => setTimelineRefreshKey((k) => k + 1)}
                      onNoteDeleted={() => setTimelineRefreshKey((k) => k + 1)}
                      onClose={() => setShowOrderInfoAdmin(false)}
                    />
                  )}
                </div>
              )}

              {order.stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-white dark:bg-zinc-800"
                >
                  {/* Stage Icon */}
                  <div className="flex flex-col items-center">
                    {getStageIcon(stage.status)}
                    {index < order.stages.length - 1 && (
                      <div
                        className={`w-0.5 h-8 mt-2 ${
                          stage.status === "COMPLETED"
                            ? "bg-green-300"
                            : "bg-zinc-600"
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
                          className={stageStatusBadgeColors[stage.status] || "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"}
                        >
                          {stage.status.replace("_", " ")}
                        </Badge>
                        {/* Expand button for stages with notes or metadata */}
                        {(stage.notes || (stage.metadata && typeof stage.metadata === "object" && (
                          Array.isArray(stage.metadata) ? (stage.metadata as { key: string; value: unknown }[]).length > 0 : Object.keys(stage.metadata as Record<string, unknown>).length > 0
                        ))) && editingStageId !== stage.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStageExpanded(stage.id)}
                            className="h-6 px-1"
                          >
                            {expandedStages.has(stage.id) ? (
                              <ChevronUp className="h-4 w-4 text-gray-500 dark:text-zinc-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500 dark:text-zinc-500" />
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {stage.progress}%
                        </span>
                        {isAdminOrOwner && editingStageId !== stage.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingStage(stage)}
                            disabled={isSavingStage}
                            className="h-7 w-7 p-0"
                            title="Edit stage (Admin)"
                          >
                            <Pencil className="h-3.5 w-3.5 text-gray-500 dark:text-zinc-500 hover:text-gray-600 dark:text-zinc-400" />
                          </Button>
                        )}
                        {isAdminOrOwner && editingStageId !== stage.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAdminPanelStages((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(stage.id)) {
                                  newSet.delete(stage.id);
                                } else {
                                  newSet.add(stage.id);
                                }
                                return newSet;
                              });
                            }}
                            className={`h-7 w-7 p-0 ${adminPanelStages.has(stage.id) ? "text-purple-400" : ""}`}
                            title="Admin notes"
                          >
                            <Shield className="h-3.5 w-3.5 text-gray-500 dark:text-zinc-500 hover:text-purple-400" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar or Editor */}
                    {editingStageId === stage.id ? (
                      <div className="space-y-3 mb-2 p-3 bg-white dark:bg-zinc-800 rounded-lg border">
                        {/* Status Selector */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 dark:text-zinc-400 w-16">Status:</span>
                          <Select
                            value={editingStatus}
                            onValueChange={(value) => {
                              setEditingStatus(value);
                              // Auto-set progress based on status
                              if (value === "NOT_STARTED") {
                                setEditingProgress(0);
                              } else if (value === "COMPLETED") {
                                setEditingProgress(100);
                              }
                            }}
                          >
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="DELAYED">
                                <span className="flex items-center gap-2">
                                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                  Delayed
                                </span>
                              </SelectItem>
                              <SelectItem value="BLOCKED">
                                <span className="flex items-center gap-2">
                                  <XCircle className="h-3 w-3 text-red-500" />
                                  Blocked
                                </span>
                              </SelectItem>
                              <SelectItem value="SKIPPED">Skipped</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Progress Slider */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 dark:text-zinc-400 w-16">Progress:</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingProgress}
                            onChange={(e) =>
                              setEditingProgress(parseInt(e.target.value))
                            }
                            className="flex-1 h-2 bg-gray-200 dark:bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
                          <span className="text-sm text-gray-600 dark:text-zinc-400">%</span>
                        </div>

                        {/* Quick buttons */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 dark:text-zinc-400">Quick set:</span>
                          {[0, 25, 50, 75, 100].map((val) => (
                            <Button
                              key={val}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingProgress(val)}
                              className={`h-6 px-2 text-xs ${
                                editingProgress === val
                                  ? "bg-blue-900/50 border-blue-500"
                                  : ""
                              }`}
                            >
                              {val}%
                            </Button>
                          ))}
                        </div>

                        {/* Notes/Reason - especially useful for DELAYED/BLOCKED */}
                        <div className="space-y-1">
                          <label className="text-sm text-gray-600 dark:text-zinc-400">
                            Notes / Reason {(editingStatus === "DELAYED" || editingStatus === "BLOCKED") && (
                              <span className="text-yellow-600">(explain the issue)</span>
                            )}
                          </label>
                          <Textarea
                            value={editingNotes}
                            onChange={(e) => setEditingNotes(e.target.value)}
                            placeholder={
                              editingStatus === "DELAYED"
                                ? "Explain what's causing the delay..."
                                : editingStatus === "BLOCKED"
                                ? "Explain what's blocking this stage..."
                                : "Optional notes about this stage..."
                            }
                            rows={2}
                            className="text-sm"
                          />
                        </div>

                        {/* Expected Start/End Dates */}
                        <div className="flex items-center gap-4">
                          <div className="flex-1 space-y-1">
                            <label className="text-sm text-gray-600 dark:text-zinc-400">Expected Start</label>
                            <Input
                              type="date"
                              value={editingExpectedStart}
                              onChange={(e) => setEditingExpectedStart(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-sm text-gray-600 dark:text-zinc-400">Expected End</label>
                            <Input
                              type="date"
                              value={editingExpectedEnd}
                              onChange={(e) => setEditingExpectedEnd(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        {editingExpectedStart && editingExpectedEnd && new Date(editingExpectedEnd) <= new Date(editingExpectedStart) && (
                          <p className="text-xs text-red-500">Expected end date must be after start date</p>
                        )}

                        {/* Stage Metadata (Key-Value Details) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-600 dark:text-zinc-400">
                              Details
                            </label>
                            <div className="flex items-center gap-1">
                              {editingMetadata.length === 0 && (() => {
                                const name = stage.name.toLowerCase();
                                const presets: Record<string, { key: string; value: string }[]> = {
                                  cutting: [{ key: "Responsible", value: "" }, { key: "Machine", value: "" }, { key: "Fabric Type", value: "" }],
                                  sewing: [{ key: "Responsible", value: "" }, { key: "Line #", value: "" }, { key: "Operators", value: "" }],
                                  qc: [{ key: "Inspector", value: "" }, { key: "Sample Count", value: "" }, { key: "Defect Rate", value: "" }],
                                  quality: [{ key: "Inspector", value: "" }, { key: "Sample Count", value: "" }, { key: "Defect Rate", value: "" }],
                                  dyeing: [{ key: "Responsible", value: "" }, { key: "Color Code", value: "" }, { key: "Batch #", value: "" }],
                                  printing: [{ key: "Responsible", value: "" }, { key: "Method", value: "" }, { key: "Colors", value: "" }],
                                  packing: [{ key: "Responsible", value: "" }, { key: "Box Count", value: "" }, { key: "Label Type", value: "" }],
                                  shipping: [{ key: "Carrier", value: "" }, { key: "Tracking #", value: "" }, { key: "Delivery Time", value: "" }],
                                };
                                const matchedPreset = Object.entries(presets).find(([k]) => name.includes(k));
                                if (!matchedPreset) return null;
                                return (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-blue-600 dark:text-blue-400"
                                    onClick={() => setEditingMetadata(matchedPreset[1])}
                                  >
                                    Use {matchedPreset[0]} preset
                                  </Button>
                                );
                              })()}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => setEditingMetadata([...editingMetadata, { key: "", value: "" }])}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add field
                              </Button>
                            </div>
                          </div>
                          {editingMetadata.length > 0 && (
                            <div className="space-y-1.5">
                              {editingMetadata.map((entry, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <Input
                                    value={entry.key}
                                    onChange={(e) => {
                                      const updated = [...editingMetadata];
                                      updated[idx] = { ...updated[idx], key: e.target.value };
                                      setEditingMetadata(updated);
                                    }}
                                    placeholder="Field name"
                                    className="w-32 h-7 text-xs"
                                  />
                                  <Input
                                    value={entry.value}
                                    onChange={(e) => {
                                      const updated = [...editingMetadata];
                                      updated[idx] = { ...updated[idx], value: e.target.value };
                                      setEditingMetadata(updated);
                                    }}
                                    placeholder="Value"
                                    className="flex-1 h-7 text-xs"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                                    onClick={() => setEditingMetadata(editingMetadata.filter((_, i) => i !== idx))}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Save/Cancel */}
                        <div className="flex items-center gap-2 pt-2 border-t">
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
                                Save Changes
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
                          className="w-full h-2 bg-gray-200 dark:bg-zinc-600 rounded-full overflow-hidden mb-2 cursor-pointer hover:bg-gray-300 dark:hover:bg-zinc-500 transition-colors"
                          onClick={() => startEditingStage(stage)}
                          title="Click to edit progress"
                        >
                          <div
                            className={`h-full rounded-full transition-all ${
                              stage.status === "COMPLETED"
                                ? "bg-green-500"
                                : stage.status === "DELAYED"
                                ? "bg-yellow-500"
                                : stage.status === "BLOCKED"
                                ? "bg-red-500"
                                : stage.status === "IN_PROGRESS"
                                ? "bg-blue-500"
                                : "bg-zinc-500"
                            }`}
                            style={{ width: `${stage.progress}%` }}
                          />
                        </div>

                        {/* Expandable notes section (for delay/block reasons) */}
                        {stage.notes && expandedStages.has(stage.id) && (
                          <div
                            className={`p-3 rounded-md mb-2 text-sm ${
                              stage.status === "DELAYED"
                                ? "bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700"
                                : stage.status === "BLOCKED"
                                ? "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700"
                                : "bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {stage.status === "DELAYED" && (
                                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              )}
                              {stage.status === "BLOCKED" && (
                                <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              )}
                              <p className="text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">
                                {stage.notes}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Auto-expand for delayed/blocked stages with notes */}
                        {stage.notes &&
                          !expandedStages.has(stage.id) &&
                          (stage.status === "DELAYED" || stage.status === "BLOCKED") && (
                            <button
                              onClick={() => toggleStageExpanded(stage.id)}
                              className={`text-xs mb-2 flex items-center gap-1 ${
                                stage.status === "DELAYED"
                                  ? "text-yellow-600 hover:text-yellow-700"
                                  : "text-red-600 hover:text-red-700"
                              }`}
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Click to see reason
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          )}

                        {/* Quick progress buttons (visible on hover via group) */}
                        {stage.status !== "COMPLETED" &&
                          stage.status !== "BLOCKED" && (
                            <div className="flex items-center gap-1 mb-2">
                              <span className="text-xs text-gray-500 dark:text-zinc-500 mr-1">
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
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-zinc-400 flex-wrap">
                      {stage.startedAt && (
                        <span>Started: {formatDateTime(stage.startedAt)}</span>
                      )}
                      {stage.completedAt && (
                        <span>
                          Completed: {formatDateTime(stage.completedAt)}
                        </span>
                      )}
                      {stage.expectedStartDate && stage.expectedEndDate && (
                        <span>
                          Expected: {new Date(stage.expectedStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(stage.expectedEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      {/* Schedule indicator pill */}
                      {stage.expectedEndDate && stage.status !== "COMPLETED" && stage.status !== "SKIPPED" && (() => {
                        const now = new Date();
                        const expectedEnd = new Date(stage.expectedEndDate);
                        const expectedStart = stage.expectedStartDate ? new Date(stage.expectedStartDate) : null;
                        const daysOverdue = Math.floor((now.getTime() - expectedEnd.getTime()) / (1000 * 60 * 60 * 24));

                        if (daysOverdue >= 3) {
                          return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">Overdue</span>;
                        } else if (daysOverdue > 0) {
                          return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">Behind Schedule</span>;
                        } else if (stage.startedAt && expectedStart && new Date(stage.startedAt) > expectedStart) {
                          return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">Behind Schedule</span>;
                        } else {
                          return <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">On Track</span>;
                        }
                      })()}
                    </div>

                    {/* Stage Metadata — shown when expanded or editing */}
                    {(expandedStages.has(stage.id) || editingStageId === stage.id) && (() => {
                      const isEditingThis = editingStageId === stage.id;
                      // When editing, use live editingMetadata state; otherwise use saved data
                      const entries: { key: string; value: string }[] = isEditingThis
                        ? editingMetadata
                        : (() => {
                            if (!stage.metadata || typeof stage.metadata !== "object") return [];
                            if (Array.isArray(stage.metadata)) {
                              return (stage.metadata as { key: string; value: unknown }[]).map(({ key, value }) => ({ key, value: String(value) }));
                            }
                            return Object.entries(stage.metadata as Record<string, unknown>).map(([key, value]) => ({ key, value: String(value) }));
                          })();
                      if (entries.length === 0 && !isEditingThis) return null;
                      return (
                        <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50">
                          <div className="flex items-center gap-1.5 mb-2">
                            <ClipboardList className="h-3.5 w-3.5 text-gray-500 dark:text-zinc-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">Production Stage Details</span>
                          </div>
                          {isEditingThis && isAdminOrOwner ? (
                            <DndContext
                              sensors={metadataSensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleMetadataDragEnd}
                            >
                              <SortableContext items={metadataIds} strategy={rectSortingStrategy}>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                  {entries.map((entry, idx) => (
                                    <SortableMetadataDisplayItem
                                      key={metadataIds[idx]}
                                      id={metadataIds[idx]}
                                      entry={entry}
                                      onRemove={() => setEditingMetadata(editingMetadata.filter((_, i) => i !== idx))}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                              {entries.map(({ key, value }, idx) => (
                                <p key={`${key}-${idx}`} className="text-sm text-gray-900 dark:text-zinc-200">
                                  <span className="font-medium text-gray-600 dark:text-zinc-400">{key}:</span>{" "}
                                  {value || "—"}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Stage updates from admin notes (visible to everyone) */}
                    {!isAdminOrOwner && stageAdminNotes[stage.id]?.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        {stageAdminNotes[stage.id].map((note) => (
                          <div
                            key={note.id}
                            className="flex items-start gap-2 text-xs text-gray-600 dark:text-zinc-400"
                          >
                            <FileText className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400 dark:text-zinc-500" />
                            <div>
                              <p className="text-gray-700 dark:text-zinc-300">{note.content}</p>
                              <span className="text-gray-500 dark:text-zinc-500">
                                {note.authorName || "Team"} &middot;{" "}
                                {new Date(note.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Admin Notes Panel */}
                    {isAdminOrOwner && adminPanelStages.has(stage.id) && (
                      <StageAdminPanel
                        orderId={order.id}
                        stageId={stage.id}
                        stageName={stage.name}
                        variant="full"
                        currentUserId={session?.user?.id}
                        onNoteAdded={() => setTimelineRefreshKey((k) => k + 1)}
                        onNoteUpdated={() => setTimelineRefreshKey((k) => k + 1)}
                        onNoteDeleted={() => setTimelineRefreshKey((k) => k + 1)}
                        onClose={() => {
                          setAdminPanelStages((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(stage.id);
                            return newSet;
                          });
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            Click on any stage to see its history of changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HorizontalTimeline
            orderId={order.id}
            stages={order.stages}
            orderStatus={order.status}
            orderPriority={order.priority}
            orderDate={order.orderDate}
            expectedDate={order.expectedDate}
            isAdmin={isAdminOrOwner}
            currentUserId={session?.user?.id}
            refreshTrigger={timelineRefreshKey}
          />
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="text-xs text-gray-500 dark:text-zinc-500 flex items-center gap-4">
        <span>Created: {formatDateTime(order.createdAt)}</span>
        <span>Last updated: {formatDateTime(order.updatedAt)}</span>
      </div>
    </div>
  );
}
