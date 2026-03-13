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
  Repeat,
  Copy,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AnimatedNumber } from "@/components/animated-number";
import { useBreadcrumb } from "@/lib/breadcrumb-context";
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
import { RequestDeleteDialog } from "@/components/request-delete-dialog";
import { TrackingCard } from "@/components/tracking-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  recurrenceEnabled: boolean;
  recurrenceIntervalDays: number | null;
  recurrenceNextDate: string | null;
  recurrenceLastAlertAt: string | null;
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
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  IN_PROGRESS: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  DELAYED: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  DISRUPTED: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  COMPLETED: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  SHIPPED: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  IN_TRANSIT: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
  CUSTOMS: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  DELIVERED: "bg-gray-50 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300",
  CANCELLED: "bg-gray-50 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-50 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400",
  NORMAL: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  HIGH: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  URGENT: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
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
  NOT_STARTED: "bg-gray-50 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400",
  IN_PROGRESS: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  COMPLETED: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  SKIPPED: "bg-gray-50 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400",
  DELAYED: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  BLOCKED: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

const stageBorderColors: Record<string, string> = {
  NOT_STARTED: "!border-l-zinc-300 dark:!border-l-zinc-600",
  IN_PROGRESS: "!border-l-blue-500",
  COMPLETED: "!border-l-green-500",
  SKIPPED: "!border-l-zinc-300 dark:!border-l-zinc-600",
  DELAYED: "!border-l-amber-500",
  BLOCKED: "!border-l-red-500",
};

const stageBgColors: Record<string, string> = {
  NOT_STARTED: "",
  IN_PROGRESS: "bg-blue-50/30 dark:bg-blue-950/10",
  COMPLETED: "bg-green-50/30 dark:bg-green-950/10",
  SKIPPED: "",
  DELAYED: "bg-amber-50/30 dark:bg-amber-950/10",
  BLOCKED: "bg-red-50/30 dark:bg-red-950/10",
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

function RecurrenceCard({ order, onUpdate }: {
  order: Order;
  onUpdate: (fields: Partial<Order>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [enabled, setEnabled] = useState(order.recurrenceEnabled);
  const [interval, setInterval] = useState(() => {
    const days = order.recurrenceIntervalDays;
    if (!days) return "60";
    if ([30, 60, 90, 120].includes(days)) return String(days);
    return "custom";
  });
  const [customDays, setCustomDays] = useState(() => {
    const days = order.recurrenceIntervalDays;
    return days && ![30, 60, 90, 120].includes(days) ? String(days) : "";
  });
  const [nextDate, setNextDate] = useState(
    order.recurrenceNextDate ? new Date(order.recurrenceNextDate).toISOString().split("T")[0] : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const intervalDays = enabled
        ? parseInt(interval === "custom" ? customDays : interval) || null
        : null;
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recurrenceEnabled: enabled,
          recurrenceIntervalDays: intervalDays,
          recurrenceNextDate: enabled && nextDate ? nextDate : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUpdate({
          recurrenceEnabled: data.data.recurrenceEnabled,
          recurrenceIntervalDays: data.data.recurrenceIntervalDays,
          recurrenceNextDate: data.data.recurrenceNextDate,
          recurrenceLastAlertAt: data.data.recurrenceLastAlertAt,
        });
        setEditing(false);
      }
    } catch {
      console.error("Failed to update recurrence");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">REC</span>
              <Repeat className="h-5 w-5 text-indigo-500" />
              Recurrence
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {order.recurrenceEnabled ? (
            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="text-gray-600 dark:text-zinc-400">Status</p>
                <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">Active</Badge>
              </div>
              <div>
                <p className="text-gray-600 dark:text-zinc-400">Interval</p>
                <p className="font-medium">Every {order.recurrenceIntervalDays} days</p>
              </div>
              {order.recurrenceNextDate && (
                <div>
                  <p className="text-gray-600 dark:text-zinc-400">Next Order Date</p>
                  <p className="font-medium">{new Date(order.recurrenceNextDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-zinc-400">Recurrence is not enabled for this order.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-[#0d0f13] border-indigo-200 dark:border-indigo-800 rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">REC</span>
          <Repeat className="h-5 w-5 text-indigo-500" />
          Edit Recurrence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="recurrence-toggle" className="text-sm font-medium cursor-pointer">Repeat this order</label>
          <Switch
            id="recurrence-toggle"
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={saving}
          />
        </div>
        {enabled && (
          <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-zinc-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-zinc-400">Reorder Interval</label>
                <Select
                  value={interval}
                  onValueChange={(val) => {
                    setInterval(val);
                    if (val !== "custom") {
                      const d = new Date(order.orderDate);
                      d.setDate(d.getDate() + parseInt(val));
                      setNextDate(d.toISOString().split("T")[0]);
                    }
                  }}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Every 30 days</SelectItem>
                    <SelectItem value="60">Every 60 days</SelectItem>
                    <SelectItem value="90">Every 90 days</SelectItem>
                    <SelectItem value="120">Every 120 days</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {interval === "custom" && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-600 dark:text-zinc-400">Custom Interval (days)</label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    placeholder="e.g. 45"
                    value={customDays}
                    onChange={(e) => {
                      setCustomDays(e.target.value);
                      if (e.target.value) {
                        const d = new Date(order.orderDate);
                        d.setDate(d.getDate() + parseInt(e.target.value));
                        setNextDate(d.toISOString().split("T")[0]);
                      }
                    }}
                    disabled={saving}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-600 dark:text-zinc-400">Next Order Date</label>
              <Input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                disabled={saving}
              />
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                You&apos;ll receive a notification 7 days before this date to reorder.
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-3.5 w-3.5 mr-1" /> Save</>}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            setEditing(false);
            setEnabled(order.recurrenceEnabled);
          }} disabled={saving}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { setDetail } = useBreadcrumb();
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

  // Delay reason state
  const [delayReasons, setDelayReasons] = useState<Record<string, Array<{ id: string; content: string; authorId: string; authorName: string | null; createdAt: string }>>>({});
  const [delayReasonInput, setDelayReasonInput] = useState<Record<string, string>>({});
  const [isSavingDelayReason, setIsSavingDelayReason] = useState(false);
  const [editingDelayReasonId, setEditingDelayReasonId] = useState<string | null>(null);
  const [editingDelayReasonContent, setEditingDelayReasonContent] = useState("");

  // Timeline refresh trigger — increment to refetch timeline events
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);

  // Delete request dialog (non-admin)
  const [deleteRequestOpen, setDeleteRequestOpen] = useState(false);

  // Direct delete dialog (admin/owner)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Order status quick-update
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Error state for stage saves (replaces alert())
  const [stageSaveError, setStageSaveError] = useState<string | null>(null);

  async function handleDeleteOrder() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        router.push("/orders");
      }
    } catch {
      console.error("Failed to delete order");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

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
          setDetail(`${data.data.orderNumber} — ${data.data.productName}`);
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
  }, [params.id, setDetail]);

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

  // Fetch delay reasons for DELAYED/BLOCKED stages
  useEffect(() => {
    async function fetchDelayReasons() {
      if (!order) return;
      const delayedStages = order.stages.filter(
        (s) => s.status === "DELAYED" || s.status === "BLOCKED"
      );
      if (delayedStages.length === 0) return;

      const results: Record<string, Array<{ id: string; content: string; authorId: string; authorName: string | null; createdAt: string }>> = {};
      await Promise.all(
        delayedStages.map(async (stage) => {
          try {
            const res = await fetch(`/api/orders/${order.id}/stages/${stage.id}/delay-reason`);
            const data = await res.json();
            if (data.success) {
              results[stage.id] = data.data;
            }
          } catch {
            // Silently fail
          }
        })
      );
      setDelayReasons(results);
    }
    fetchDelayReasons();
  }, [order?.id, order?.stages]);

  // Delay reason error feedback
  const [delayReasonError, setDelayReasonError] = useState<string | null>(null);

  async function submitDelayReason(stageId: string) {
    const content = delayReasonInput[stageId]?.trim();
    if (!content || !order) return;

    setIsSavingDelayReason(true);
    setDelayReasonError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/stages/${stageId}/delay-reason`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        setDelayReasons((prev) => ({
          ...prev,
          [stageId]: [data.data, ...(prev[stageId] || [])],
        }));
        setDelayReasonInput((prev) => ({ ...prev, [stageId]: "" }));
      } else {
        console.error("Delay reason API error:", data);
        setDelayReasonError(data.error || "Failed to submit delay reason");
      }
    } catch (err) {
      console.error("Failed to submit delay reason:", err);
      setDelayReasonError("Network error — failed to submit");
    } finally {
      setIsSavingDelayReason(false);
    }
  }

  async function updateDelayReason(stageId: string, noteId: string) {
    const content = editingDelayReasonContent.trim();
    if (!content || !order) return;

    setIsSavingDelayReason(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/stages/${stageId}/delay-reason`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, content }),
      });
      const data = await res.json();
      if (data.success) {
        setDelayReasons((prev) => ({
          ...prev,
          [stageId]: prev[stageId].map((r) => r.id === noteId ? { ...r, content } : r),
        }));
        setEditingDelayReasonId(null);
        setEditingDelayReasonContent("");
      }
    } catch {
      console.error("Failed to update delay reason");
    } finally {
      setIsSavingDelayReason(false);
    }
  }

  async function deleteDelayReason(stageId: string, noteId: string) {
    if (!order) return;

    setIsSavingDelayReason(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/stages/${stageId}/delay-reason?noteId=${noteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDelayReasons((prev) => ({
          ...prev,
          [stageId]: prev[stageId].filter((r) => r.id !== noteId),
        }));
      }
    } catch {
      console.error("Failed to delete delay reason");
    } finally {
      setIsSavingDelayReason(false);
    }
  }

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

  const formatDateShort = (dateString: string) => {
    const d = new Date(dateString);
    return {
      main: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      year: d.getFullYear().toString(),
    };
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
      // When setting 100%, explicitly mark as COMPLETED so it works
      // even if the stage was previously DELAYED/BLOCKED
      const payload: Record<string, unknown> = { progress };
      if (progress === 100) payload.status = "COMPLETED";

      const response = await fetch(
        `/api/orders/${order.id}/stages/${stageId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-zinc-400" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <Package className="h-12 w-12 text-gray-500 dark:text-zinc-500" />
            <p className="text-gray-600 dark:text-zinc-400">{error || "Order not found"}</p>
            <Link href="/orders">
              <Button variant="outline" className="border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300">
                View All Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOrderDone = ["COMPLETED", "SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status);
  const referenceDate = isOrderDone && order.actualDate ? new Date(order.actualDate) : new Date();
  const daysUntilDue = Math.ceil(
    (new Date(order.expectedDate).getTime() - referenceDate.getTime()) /
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

  const completedStages = order.stages?.filter((s) => s.status === "COMPLETED" || s.status === "SKIPPED").length ?? 0;
  const totalStages = order.stages?.length ?? 0;
  const orderDateShort = formatDateShort(order.orderDate);
  const expectedDateShort = formatDateShort(order.expectedDate);
  const isDueOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;

  return (
    <div className="relative space-y-8">
      {/* HUD Grid Overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-0 dark:opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,77,21,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,21,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Back nav */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {/* Hero Card */}
      <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] p-6 space-y-5 card-hover-glow hud-corners">
        {/* Identity row */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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
              {order.recurrenceEnabled && (
                <Badge
                  className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                  title={`Repeats every ${order.recurrenceIntervalDays} days${order.recurrenceNextDate ? ` — next: ${new Date(order.recurrenceNextDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}`}
                >
                  <Repeat className="h-3 w-3 mr-1" />
                  Recurring
                </Badge>
              )}
            </div>
            <p className="text-gray-600 dark:text-zinc-400">{order.productName}</p>
          </div>
          <div className="flex items-center gap-2">
            {order.recurrenceEnabled && (
              <Link href={`/orders/new?reorderId=${order.id}`}>
                <Button variant="outline" className="border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950">
                  <Copy className="h-4 w-4 mr-2" />
                  Reorder Now
                </Button>
              </Link>
            )}
            {isAdminOrOwner ? (
              <>
                <Link href={`/orders/${order.id}/edit`}>
                  <Button variant="outline" className="border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Order
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Link href={`/orders/${order.id}/request-edit`}>
                  <Button variant="outline" className="border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300">
                    <Edit className="h-4 w-4 mr-2" />
                    Request Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setDeleteRequestOpen(true)}
                  className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Request Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-zinc-400">
              {order.overallProgress}% Complete
            </span>
            <span
              className={`font-medium ${
                isOrderDone
                  ? daysUntilDue < 0
                    ? "text-red-600"
                    : "text-green-600"
                  : daysUntilDue < 0
                  ? "text-red-600"
                  : daysUntilDue <= 7
                  ? "text-yellow-600"
                  : "text-zinc-400"
              }`}
            >
              {isOrderDone
                ? daysUntilDue < 0
                  ? `Delivered ${Math.abs(daysUntilDue)} days late`
                  : daysUntilDue === 0
                  ? "Delivered on time"
                  : `Delivered ${daysUntilDue} days early`
                : daysUntilDue < 0
                ? `${Math.abs(daysUntilDue)} days overdue`
                : daysUntilDue === 0
                ? "Due today"
                : `${daysUntilDue} days remaining`}
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getOverallProgressColor()}`}
              style={{ width: `${order.overallProgress}%` }}
            />
          </div>
          {(hasDelayedStage || hasBlockedStage) && (
            <div className={`flex items-center gap-2 text-xs ${hasBlockedStage ? "text-red-600" : "text-yellow-600"}`}>
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

        {/* Summary stat mini-cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Stages */}
          <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/30 border border-transparent dark:border-zinc-800/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">STG</span>
                <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Stages</p>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              </span>
            </div>
            <p className="mt-1.5 text-xl font-bold text-gray-900 dark:text-white">{completedStages}/{totalStages}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">completed</p>
          </div>

          {/* Quantity */}
          <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/30 border border-transparent dark:border-zinc-800/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">QTY</span>
                <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Quantity</p>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10">
                <Package className="h-3.5 w-3.5 text-orange-500" />
              </span>
            </div>
            <p className="mt-1.5 text-xl font-bold text-gray-900 dark:text-white"><AnimatedNumber value={order.quantity} /></p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{order.unit}</p>
          </div>

          {/* Ordered */}
          <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/30 border border-transparent dark:border-zinc-800/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">ORD</span>
                <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Ordered</p>
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
              </span>
            </div>
            <p className="mt-1.5 text-xl font-bold text-gray-900 dark:text-white">{orderDateShort.main}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{orderDateShort.year}</p>
          </div>

          {/* Due */}
          <div className={`rounded-lg border border-transparent p-4 ${
            isDueOverdue
              ? "bg-red-50 dark:bg-red-950/20 ring-1 ring-red-200 dark:ring-red-900/40"
              : isDueSoon
              ? "bg-amber-50 dark:bg-amber-950/20 ring-1 ring-amber-200 dark:ring-amber-900/40"
              : "bg-gray-50 dark:bg-zinc-800/30 dark:border-zinc-800/40"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">DUE</span>
                <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Due</p>
              </div>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                isDueOverdue ? "bg-red-500/10" : isDueSoon ? "bg-amber-500/10" : "bg-gray-500/10 dark:bg-zinc-600/20"
              }`}>
                <Clock className={`h-3.5 w-3.5 ${
                  isDueOverdue ? "text-red-500" : isDueSoon ? "text-amber-500" : "text-gray-500 dark:text-zinc-400"
                }`} />
              </span>
            </div>
            <p className={`mt-1.5 text-xl font-bold ${
              isDueOverdue ? "text-red-700 dark:text-red-400" : isDueSoon ? "text-amber-700 dark:text-amber-400" : "text-gray-900 dark:text-white"
            }`}>{expectedDateShort.main}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{expectedDateShort.year}</p>
          </div>
        </div>
      </div>

      <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
        Details
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <Card className="lg:col-span-2 bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">INF</span>
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

            <hr className="my-4 border-gray-100 dark:border-zinc-800" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Order Number</p>
                <p className="font-medium">{order.orderNumber}</p>
              </div>
            </div>

            <hr className="my-4 border-gray-100 dark:border-zinc-800" />

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
                <hr className="my-4 border-gray-100 dark:border-zinc-800" />
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
                <hr className="my-4 border-gray-100 dark:border-zinc-800" />
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
        <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">MFG</span>
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
                <hr className="border-gray-100 dark:border-zinc-800" />
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

      {/* Shipping & Tracking */}
      <TrackingCard orderId={order.id} />

      {/* Recurrence Settings (admin edit) */}
      {isAdminOrOwner && (
        <RecurrenceCard order={order} onUpdate={(updated) => {
          setOrder({ ...order, ...updated });
          setTimelineRefreshKey((k) => k + 1);
        }} />
      )}

      {/* Recurrence Info (non-admin view) */}
      {!isAdminOrOwner && order.recurrenceEnabled && (
        <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">REC</span>
              <Repeat className="h-5 w-5 text-indigo-500" />
              Recurrence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="text-gray-600 dark:text-zinc-400">Interval</p>
                <p className="font-medium">Every {order.recurrenceIntervalDays} days</p>
              </div>
              {order.recurrenceNextDate && (
                <div>
                  <p className="text-gray-600 dark:text-zinc-400">Next Order Date</p>
                  <p className="font-medium">{new Date(order.recurrenceNextDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      <OrderAttachments orderId={order.id} isAdmin={isAdminOrOwner} />

      {/* Comments */}
      <OrderComments
        orderId={order.id}
        currentUserId={session?.user?.id}
        userRole={session?.user?.role}
      />

      {/* Production Pipeline */}
      {order.stages && order.stages.length > 0 && (
        <>
        <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
          Production
        </p>
        <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">PIP</span>
              Production Pipeline
            </CardTitle>
            <CardDescription>
              {completedStages} of {totalStages} stages complete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
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
                <div key={stage.id} className="relative">
                  {/* Connector line between stages */}
                  {index < order.stages.length - 1 && (
                    <div className={`absolute left-6 top-full w-0.5 h-3 z-0 ${
                      stage.status === "COMPLETED" ? "bg-green-300 dark:bg-green-700" : "bg-gray-200 dark:bg-zinc-700"
                    }`} />
                  )}
                  <div
                    className={`flex items-start gap-4 p-4 rounded-lg border border-l-[3px] ${stageBorderColors[stage.status] || "border-l-zinc-300 dark:border-l-zinc-600"} ${stageBgColors[stage.status] || ""} bg-white dark:bg-zinc-800/80 border-gray-100 dark:border-zinc-700/60`}
                  >
                    {/* Stage Icon */}
                    <div className="flex flex-col items-center">
                      {getStageIcon(stage.status)}
                    </div>

                    {/* Stage Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 dark:bg-zinc-700 text-xs font-semibold font-mono text-gray-600 dark:text-zinc-300">{String(index + 1).padStart(2, "0")}</span>
                          <h4 className="font-medium">{stage.name}</h4>
                        <Badge
                          className={stageStatusBadgeColors[stage.status] || "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"}
                        >
                          {stage.status.replace("_", " ")}
                        </Badge>
                        {/* Expand button — always visible so users can view/add metadata */}
                        {editingStageId !== stage.id && (
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
                        <span className={`text-sm font-medium ${stageStatusColors[stage.status] || "text-zinc-500"}`}>
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
                              onClick={() => {
                                setEditingProgress(val);
                                // Auto-sync status with progress for non-problem states
                                if (editingStatus !== "DELAYED" && editingStatus !== "BLOCKED") {
                                  if (val === 0) setEditingStatus("NOT_STARTED");
                                  else if (val === 100) setEditingStatus("COMPLETED");
                                  else setEditingStatus("IN_PROGRESS");
                                }
                              }}
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
                          className="w-full h-2.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden mb-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
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

                        {/* Delay Reason Section — visible to MEMBER+ on DELAYED/BLOCKED stages */}
                        {(stage.status === "DELAYED" || stage.status === "BLOCKED") && (
                          <div
                            className={`p-4 rounded-lg mb-3 ${
                              stage.status === "DELAYED"
                                ? "bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-300 dark:border-orange-700/60"
                                : "bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-700/60"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className={`h-4.5 w-4.5 ${stage.status === "DELAYED" ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400"}`} />
                              <span className={`text-sm font-semibold ${stage.status === "DELAYED" ? "text-orange-800 dark:text-orange-300" : "text-red-800 dark:text-red-300"}`}>
                                {stage.status === "DELAYED" ? "Delay" : "Blocker"} Reasons
                              </span>
                            </div>

                            {/* Existing delay reasons */}
                            {delayReasons[stage.id]?.length > 0 ? (
                              <div className="space-y-2.5 mb-3">
                                {delayReasons[stage.id].map((reason) => {
                                  const isOwn = reason.authorId === session?.user?.id;
                                  const canModify = isOwn || isAdminOrOwner;
                                  const isEditing = editingDelayReasonId === reason.id;

                                  return (
                                    <div
                                      key={reason.id}
                                      className={`group/reason flex items-start gap-2.5 p-2.5 rounded-md ${
                                        stage.status === "DELAYED"
                                          ? "bg-orange-100/60 dark:bg-orange-900/20"
                                          : "bg-red-100/60 dark:bg-red-900/20"
                                      }`}
                                    >
                                      <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                        stage.status === "DELAYED"
                                          ? "bg-orange-200 dark:bg-orange-800/40"
                                          : "bg-red-200 dark:bg-red-800/40"
                                      }`}>
                                        <User className={`h-3.5 w-3.5 ${
                                          stage.status === "DELAYED"
                                            ? "text-orange-700 dark:text-orange-300"
                                            : "text-red-700 dark:text-red-300"
                                        }`} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        {isEditing ? (
                                          <div className="space-y-2">
                                            <Textarea
                                              value={editingDelayReasonContent}
                                              onChange={(e) => setEditingDelayReasonContent(e.target.value)}
                                              className="text-sm min-h-[50px] resize-none bg-white dark:bg-zinc-900/60"
                                              rows={2}
                                              autoFocus
                                            />
                                            <div className="flex items-center gap-1.5">
                                              <Button
                                                size="sm"
                                                onClick={() => updateDelayReason(stage.id, reason.id)}
                                                disabled={isSavingDelayReason || !editingDelayReasonContent.trim()}
                                                className="h-7 px-3 text-xs"
                                              >
                                                {isSavingDelayReason ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => { setEditingDelayReasonId(null); setEditingDelayReasonContent(""); }}
                                                className="h-7 px-2 text-xs"
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <p className="text-sm text-gray-900 dark:text-zinc-100 leading-snug">{reason.content}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <p className="text-xs text-gray-500 dark:text-zinc-400">
                                                {reason.authorName || "Team"} &middot;{" "}
                                                {new Date(reason.createdAt).toLocaleDateString("en-US", {
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "numeric",
                                                  minute: "2-digit",
                                                })}
                                              </p>
                                              {canModify && (
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover/reason:opacity-100 transition-opacity">
                                                  <button
                                                    onClick={() => {
                                                      setEditingDelayReasonId(reason.id);
                                                      setEditingDelayReasonContent(reason.content);
                                                    }}
                                                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                                                    title="Edit"
                                                  >
                                                    <Pencil className="h-3 w-3" />
                                                  </button>
                                                  <button
                                                    onClick={() => deleteDelayReason(stage.id, reason.id)}
                                                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
                                                    title="Delete"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className={`text-sm mb-3 ${
                                stage.status === "DELAYED"
                                  ? "text-orange-700 dark:text-orange-300/80"
                                  : "text-red-700 dark:text-red-300/80"
                              }`}>
                                This stage was flagged as {stage.status === "DELAYED" ? "delayed" : "blocked"}. If you know the cause, please add a reason below.
                              </p>
                            )}

                            {/* Delay reason input — visible to MEMBER+ (not VIEWER) */}
                            {session?.user?.role !== "VIEWER" && (
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <Textarea
                                    placeholder="What caused this delay?"
                                    value={delayReasonInput[stage.id] || ""}
                                    onChange={(e) =>
                                      setDelayReasonInput((prev) => ({
                                        ...prev,
                                        [stage.id]: e.target.value,
                                      }))
                                    }
                                    className="text-sm min-h-[70px] resize-none bg-white dark:bg-zinc-900/60 border-gray-300 dark:border-zinc-600"
                                    rows={2}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => submitDelayReason(stage.id)}
                                    disabled={isSavingDelayReason || !delayReasonInput[stage.id]?.trim()}
                                    className={`flex-shrink-0 text-sm h-9 px-4 ${
                                      stage.status === "DELAYED"
                                        ? "bg-orange-600 hover:bg-orange-700 text-white"
                                        : "bg-red-600 hover:bg-red-700 text-white"
                                    }`}
                                  >
                                    {isSavingDelayReason ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Submit Reason"
                                    )}
                                  </Button>
                                </div>
                                {delayReasonError && (
                                  <p className="text-sm text-red-600 dark:text-red-400">{delayReasonError}</p>
                                )}
                              </div>
                            )}
                          </div>
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
                      const hasNotes = !!stage.notes;
                      if (entries.length === 0 && !isEditingThis && !hasNotes) {
                        return (
                          <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50">
                            <p className="text-sm text-gray-400 dark:text-zinc-500 italic">No additional information added yet.</p>
                          </div>
                        );
                      }
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Activity Timeline */}
      <p className="hud-section-label font-mono text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
        History
      </p>
      <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">LOG</span>
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
      <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 text-xs text-gray-500 dark:text-zinc-500 flex items-center gap-2">
        <span>Created {formatDateTime(order.createdAt)}</span>
        <span className="text-gray-300 dark:text-zinc-700">|</span>
        <span>Last updated {formatDateTime(order.updatedAt)}</span>
      </div>

      {/* Delete Request Dialog (non-admin users) */}
      {!isAdminOrOwner && (
        <RequestDeleteDialog
          entityType="order"
          entityId={order.id}
          entityName={order.orderNumber}
          open={deleteRequestOpen}
          onOpenChange={setDeleteRequestOpen}
        />
      )}

      {/* Direct Delete Dialog (admin/owner) */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{order.orderNumber}</strong> ({order.productName})? This will permanently remove the order and all associated stages, events, and attachments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
