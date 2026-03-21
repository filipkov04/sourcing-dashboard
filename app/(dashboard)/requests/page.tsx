"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MessageSquare,
  RefreshCw,
  Send,
  Loader2,
} from "lucide-react";

interface RequestUser {
  id: string;
  name: string | null;
  email: string;
}

interface RequestItem {
  id: string;
  type: string;
  status: string;
  data: Record<string, unknown>;
  requester: RequestUser;
  reviewedBy: RequestUser | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  targetOrderId: string | null;
  targetFactoryId: string | null;
  targetOrder: { id: string; orderNumber: string | null; productName: string } | null;
  targetFactory: { id: string; name: string; location: string } | null;
  conversationId: string | null;
  createdAt: string;
}

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
type TypeFilter = "ALL" | "ORDER" | "FACTORY" | "EDIT" | "DELETE";

function getTypeBadge(type: string) {
  if (type.includes("DELETE")) return { label: "Delete", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" };
  if (type.includes("EDIT")) return { label: "Edit", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" };
  return { label: "Create", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" };
}

function getEntityType(type: string): string {
  if (type.startsWith("ORDER")) return "Order";
  if (type.startsWith("FACTORY")) return "Factory";
  return "Unknown";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING": return { color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" };
    case "APPROVED": return { color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" };
    case "REJECTED": return { color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" };
    case "NEEDS_INFO": return { color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800" };
    default: return { color: "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-400 border-gray-200 dark:border-zinc-700" };
  }
}

function getSummary(request: RequestItem): string {
  const { type, data, targetOrder, targetFactory } = request;
  if (type === "ORDER_REQUEST") return `New order: ${data.productName || "Untitled"}`;
  if (type === "FACTORY_REQUEST") return `New factory: ${data.name || "Untitled"}`;
  const orderLabel = targetOrder ? `${targetOrder.productName} (${targetOrder.orderNumber || "No PO#"})` : "order";
  const factoryLabel = targetFactory ? targetFactory.name : "factory";
  if (type === "ORDER_EDIT_REQUEST") return `Edit ${orderLabel}`;
  if (type === "FACTORY_EDIT_REQUEST") return `Edit ${factoryLabel}`;
  if (type === "ORDER_DELETE_REQUEST") return `Delete ${orderLabel}`;
  if (type === "FACTORY_DELETE_REQUEST") return `Delete ${factoryLabel}`;
  return "Unknown request";
}

function formatTimestamp(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export default function RequestsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = userRole === "ADMIN" || userRole === "OWNER";

  const searchParams = useSearchParams();
  const ridParam = searchParams.get("rid");

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(ridParam);
  const [reviewNote, setReviewNote] = useState("");
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openingChat, setOpeningChat] = useState<string | null>(null);

  // Auto-scroll to the request specified by ?rid= after data loads
  const scrolledRef = useRef(false);
  useEffect(() => {
    if (ridParam && requests.length > 0 && !scrolledRef.current) {
      scrolledRef.current = true;
      // Wait a tick for DOM to render
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-request-id="${ridParam}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [ridParam, requests]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/requests");
      if (res.ok) {
        const json = await res.json();
        setRequests(json.data);
      }
    } catch {
      console.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchRequests();
    }
  }, [fetchRequests, sessionStatus]);

  async function handleReview(id: string, status: "APPROVED" | "REJECTED" | "NEEDS_INFO") {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: reviewNote || undefined }),
      });
      if (res.ok) {
        setExpandedId(null);
        setReviewNote("");
        await fetchRequests();
      }
    } catch {
      console.error("Failed to review request");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRespond(id: string) {
    if (!responseText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond", response: responseText.trim() }),
      });
      if (res.ok) {
        setExpandedId(null);
        setResponseText("");
        await fetchRequests();
      }
    } catch {
      console.error("Failed to respond to request");
    } finally {
      setSubmitting(false);
    }
  }

  async function openChat(requestId: string, existingConversationId: string | null) {
    setOpeningChat(requestId);
    try {
      let cid = existingConversationId;

      if (!cid) {
        const res = await fetch(`/api/requests/${requestId}/conversation`, { method: "POST" });
        if (!res.ok) {
          const text = await res.text();
          console.error(`Failed to create conversation: ${res.status} ${res.statusText}`, text);
          return;
        }
        const json = await res.json();
        cid = json.data?.conversationId;
      }

      if (cid) {
        window.location.href = `/messages?cid=${cid}&rid=${requestId}`;
      }
    } catch (err) {
      console.error("Failed to open chat:", err);
    } finally {
      setOpeningChat(null);
    }
  }

  // For non-admins, only show their own requests
  const visibleRequests = useMemo(
    () => isAdmin ? requests : requests.filter((r) => r.requester.id === userId),
    [requests, isAdmin, userId]
  );

  // Apply filters
  const filteredRequests = useMemo(() => visibleRequests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (typeFilter === "ORDER" && !r.type.startsWith("ORDER")) return false;
    if (typeFilter === "FACTORY" && !r.type.startsWith("FACTORY")) return false;
    if (typeFilter === "EDIT" && !r.type.includes("EDIT")) return false;
    if (typeFilter === "DELETE" && !r.type.includes("DELETE")) return false;
    return true;
  }), [visibleRequests, statusFilter, typeFilter]);

  const pendingCount = useMemo(
    () => isAdmin
      ? visibleRequests.filter((r) => r.status === "PENDING").length
      : visibleRequests.filter((r) => r.status === "NEEDS_INFO").length,
    [visibleRequests, isAdmin]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
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
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            {isAdmin ? "Requests" : "My Requests"}
            {pendingCount > 0 && (
              <Badge variant="outline" className={isAdmin
                ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 text-sm"
                : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 text-sm"
              }>
                {pendingCount} {isAdmin ? "pending" : "needs info"}
              </Badge>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            {isAdmin
              ? "Review and approve order & factory requests"
              : "Track your submitted requests"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => { setLoading(true); fetchRequests(); }}
          className="border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[150px] bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="NEEDS_INFO">Needs Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
          <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            <SelectItem value="ORDER">Order</SelectItem>
            <SelectItem value="FACTORY">Factory</SelectItem>
            <SelectItem value="EDIT">Edit</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-400 dark:text-zinc-500">
          {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Request List */}
      {filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-gray-200 dark:text-zinc-700 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-zinc-400">No requests</h3>
          <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1">
            {visibleRequests.length > 0
              ? "No requests match the current filters"
              : isAdmin
                ? "No requests have been submitted yet"
                : "You haven't submitted any requests yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const typeBadge = getTypeBadge(request.type);
            const statusBadge = getStatusBadge(request.status);
            const isExpanded = expandedId === request.id;
            const isOwnRequest = request.requester.id === userId;
            const needsInfo = request.status === "NEEDS_INFO" && isOwnRequest;
            const canReview = isAdmin && (request.status === "PENDING" || request.status === "NEEDS_INFO");
            const canExpand = canReview || needsInfo;

            return (
              <div
                key={request.id}
                data-request-id={request.id}
                className="rounded-xl border border-gray-100 dark:border-zinc-800/60 bg-white dark:bg-[#0d0f13] overflow-hidden card-hover-glow"
              >
                {/* Card Header — clickable to expand/collapse */}
                <button
                  type="button"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : request.id);
                    setReviewNote("");
                    setResponseText("");
                  }}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/50 dark:hover:bg-zinc-700/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant="outline" className={typeBadge.color + " text-xs"}>
                        {typeBadge.label} {getEntityType(request.type)}
                      </Badge>
                      <Badge variant="outline" className={statusBadge.color + " text-xs"}>
                        {request.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {getSummary(request)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Entity identifiers */}
                      {request.targetOrder && (
                        <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded px-1.5 py-0.5">
                          {request.targetOrder.orderNumber ? `#${request.targetOrder.orderNumber}` : "No PO#"}
                        </span>
                      )}
                      {!request.targetOrder && request.type === "ORDER_REQUEST" && !!request.data.orderNumber && (
                        <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded px-1.5 py-0.5">
                          #{String(request.data.orderNumber)}
                        </span>
                      )}
                      {request.targetFactory && (
                        <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded px-1.5 py-0.5">
                          {request.targetFactory.name} — {request.targetFactory.location}
                        </span>
                      )}
                      {/* For create requests, show priority if not normal */}
                      {request.type === "ORDER_REQUEST" && request.data.priority && request.data.priority !== "NORMAL" ? (
                        <span className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded px-1.5 py-0.5">
                          {String(request.data.priority)}
                        </span>
                      ) : null}
                      {request.type === "FACTORY_REQUEST" && request.data.location ? (
                        <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded px-1.5 py-0.5">
                          {String(request.data.location)}
                        </span>
                      ) : null}
                      <span className="text-xs text-gray-300 dark:text-zinc-600">·</span>
                      {isAdmin && (
                        <span className="text-xs text-gray-500 dark:text-zinc-400">
                          by {request.requester.name || request.requester.email}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-zinc-500">
                        {formatTimestamp(request.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {request.reviewedBy && (
                      <span className="text-xs text-gray-400 dark:text-zinc-500">
                        Reviewed by {request.reviewedBy.name || request.reviewedBy.email}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                    )}
                  </div>
                </button>

                {/* Expanded Panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 px-5 py-4 space-y-4">
                    {/* Chat button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openChat(request.id, request.conversationId);
                      }}
                      disabled={openingChat === request.id}
                      className="border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-[#FF4D15]/50 hover:text-[#FF4D15]"
                    >
                      {openingChat === request.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-2" />
                      )}
                      Discuss in Chat
                    </Button>

                    {/* Request Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                        Request Details
                      </h4>
                      <RequestDetails type={request.type} data={request.data} request={request} />
                    </div>

                    {/* Previous responses from requester */}
                    {(request.data._responses as string[] | undefined)?.length ? (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                          Requester Responses
                        </h4>
                        <div className="space-y-2">
                          {(request.data._responses as string[]).map((resp, i) => (
                            <div key={i} className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                              <p className="text-sm text-blue-800 dark:text-blue-300">{resp}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Admin review note */}
                    {request.reviewNote && (
                      <div className="rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">
                          {request.reviewedBy
                            ? `Note from ${request.reviewedBy.name || request.reviewedBy.email}`
                            : "Review Note"}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-zinc-300">{request.reviewNote}</p>
                      </div>
                    )}

                    {/* Admin review controls */}
                    {canReview && (
                      <>
                        <div>
                          <label htmlFor="review-note" className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1 block">
                            Review Note (optional)
                          </label>
                          <Textarea
                            id="review-note"
                            name="review-note"
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Add a note about your decision..."
                            className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white"
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            onClick={() => handleReview(request.id, "APPROVED")}
                            disabled={submitting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReview(request.id, "REJECTED")}
                            disabled={submitting}
                            variant="destructive"
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleReview(request.id, "NEEDS_INFO")}
                            disabled={submitting}
                            variant="outline"
                            size="sm"
                            className="border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Request Info
                          </Button>
                        </div>
                      </>
                    )}

                    {/* Requester respond controls (NEEDS_INFO) */}
                    {needsInfo && !isAdmin && (
                      <>
                        <div>
                          <label htmlFor="response-text" className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1 block">
                            Your Response
                          </label>
                          <Textarea
                            id="response-text"
                            name="response-text"
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Provide the additional information requested..."
                            className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white"
                            rows={3}
                          />
                        </div>
                        <Button
                          onClick={() => handleRespond(request.id)}
                          disabled={submitting || !responseText.trim()}
                          className="bg-[#FF4D15] hover:bg-[#d4522a] text-white"
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Send Response
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RequestDetails({ type, data, request }: { type: string; data: Record<string, unknown>; request: RequestItem }) {
  if (type === "ORDER_REQUEST") {
    return <OrderRequestDetails data={data} />;
  }

  if (type === "FACTORY_REQUEST") {
    return (
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Detail label="Factory Name" value={data.name as string} />
        <Detail label="Location" value={data.location as string} />
        {data.address ? <Detail label="Address" value={data.address as string} className="col-span-2" /> : null}
        {data.contactName ? <Detail label="Contact" value={data.contactName as string} /> : null}
        {data.contactEmail ? <Detail label="Email" value={data.contactEmail as string} /> : null}
        {data.contactPhone ? <Detail label="Phone" value={data.contactPhone as string} /> : null}
      </div>
    );
  }

  if (type.includes("EDIT")) {
    return <EditRequestDetails type={type} data={data} request={request} />;
  }

  if (type.includes("DELETE")) {
    return (
      <div className="space-y-2 text-sm">
        {type === "ORDER_DELETE_REQUEST" && request.targetOrder && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <Detail label="Order Number" value={request.targetOrder.orderNumber || "No PO#"} />
            <Detail label="Product" value={request.targetOrder.productName} />
          </div>
        )}
        {type === "FACTORY_DELETE_REQUEST" && request.targetFactory && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <Detail label="Factory" value={request.targetFactory.name} />
            <Detail label="Location" value={request.targetFactory.location} />
          </div>
        )}
        <Detail label="Reason" value={data.reason as string} />
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
          <p className="text-red-700 dark:text-red-400 text-xs font-medium">
            This action will permanently delete the {type.startsWith("ORDER") ? "order" : "factory"} and all associated data.
          </p>
        </div>
      </div>
    );
  }

  // Fallback: show raw JSON
  return (
    <pre className="text-xs text-gray-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 rounded-lg p-3 overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function EditRequestDetails({ type, data, request }: { type: string; data: Record<string, unknown>; request?: RequestItem }) {
  const changes = data.changes as Record<string, unknown> | undefined;
  const previousValues = data._previousValues as Record<string, unknown> | undefined;
  const entityId = type === "ORDER_EDIT_REQUEST" ? data.orderId : data.factoryId;
  const endpoint = type === "ORDER_EDIT_REQUEST" ? `/api/orders/${entityId}` : `/api/factories/${entityId}`;
  const isPending = request?.status === "PENDING" || request?.status === "NEEDS_INFO";

  const [liveValues, setLiveValues] = useState<Record<string, unknown> | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);

  // Always fetch the live entity so we can filter out unchanged fields
  useEffect(() => {
    if (!entityId || !changes || Object.keys(changes).length === 0) return;
    setLoadingLive(true);
    fetch(endpoint)
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (json?.data) setLiveValues(json.data);
      })
      .catch(() => {})
      .finally(() => setLoadingLive(false));
  }, [entityId, endpoint, changes]);

  function formatValue(key: string, val: unknown): string {
    if (val === null || val === undefined) return "—";
    if (key.toLowerCase().includes("date") && typeof val === "string") {
      try { return new Date(val).toLocaleDateString(); } catch { return String(val); }
    }
    if (Array.isArray(val)) return val.join(", ");
    return String(val);
  }

  // "Before" display column: use stored snapshot if available, otherwise live values for pending
  const beforeValues = previousValues ?? (isPending ? liveValues : null);
  const hasBeforeData = beforeValues !== null;
  // Defer table rendering while fetching
  const isLoadingLive = loadingLive && !liveValues;

  /** Check if a field was actually changed (differs from live entity) */
  function isFieldChanged(key: string, newVal: unknown): boolean {
    if (!liveValues || !(key in liveValues)) return true;
    // For approved requests the live value equals the proposed value — use _previousValues instead
    if (previousValues && key in previousValues) {
      return formatValue(key, previousValues[key]) !== formatValue(key, newVal);
    }
    return formatValue(key, liveValues[key]) !== formatValue(key, newVal);
  }

  return (
    <div className="space-y-3 text-sm">
      {type === "ORDER_EDIT_REQUEST" && request?.targetOrder && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <Detail label="Order Number" value={request.targetOrder.orderNumber || "No PO#"} />
          <Detail label="Product" value={request.targetOrder.productName} />
        </div>
      )}
      {type === "FACTORY_EDIT_REQUEST" && request?.targetFactory && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <Detail label="Factory" value={request.targetFactory.name} />
          <Detail label="Location" value={request.targetFactory.location} />
        </div>
      )}
      <Detail label="Reason" value={data.reason as string} />
      {changes && Object.keys(changes).length > 0 && (
        <div>
          <span className="text-gray-500 dark:text-zinc-400 font-medium">Proposed Changes:</span>
          {isLoadingLive ? (
            <div className="mt-2 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-4">
              <p className="text-xs text-gray-400 dark:text-zinc-500 italic">Loading current values...</p>
            </div>
          ) : (
          <div className="mt-2 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-zinc-400">Field</th>
                  {hasBeforeData && (
                    <>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-zinc-400">Before</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-400 dark:text-zinc-500 w-8"></th>
                    </>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-zinc-400">
                    {hasBeforeData ? "After" : "Proposed Value"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-700/50">
                {Object.entries(changes).map(([key, newVal]) => {
                  // Skip fields that weren't actually changed
                  if (liveValues && !isFieldChanged(key, newVal)) return null;
                  return (
                    <tr key={key}>
                      <td className="px-3 py-2 text-gray-500 dark:text-zinc-400 font-medium">
                        {formatFieldName(key)}
                      </td>
                      {hasBeforeData && (
                        <>
                          <td className="px-3 py-2">
                            <span className="text-red-500 dark:text-red-400 line-through">
                              {formatValue(key, beforeValues[key])}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-400 dark:text-zinc-500">
                            →
                          </td>
                        </>
                      )}
                      <td className="px-3 py-2">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {formatValue(key, newVal)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderRequestDetails({ data }: { data: Record<string, unknown> }) {
  const [factoryName, setFactoryName] = useState<string | null>(null);

  useEffect(() => {
    if (!data.factoryId) return;
    fetch(`/api/factories/${data.factoryId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.name) setFactoryName(json.data.name);
      })
      .catch(() => {});
  }, [data.factoryId]);

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
      <Detail label="Product Name" value={data.productName as string} />
      {data.orderNumber ? <Detail label="Order Number" value={data.orderNumber as string} /> : null}
      {data.productSKU ? <Detail label="SKU" value={data.productSKU as string} /> : null}
      <Detail label="Quantity" value={`${data.quantity} ${data.unit || "pieces"}`} />
      {data.factoryId ? (
        <Detail label="Supplier" value={factoryName || "Loading..."} />
      ) : null}
      {data.priority ? <Detail label="Priority" value={data.priority as string} /> : null}
      {data.expectedStartDate ? <Detail label="Expected Start Date" value={new Date(data.expectedStartDate as string).toLocaleDateString()} /> : null}
      {data.expectedDate ? <Detail label="Expected Date" value={new Date(data.expectedDate as string).toLocaleDateString()} /> : null}
      {data.notes ? <Detail label="Notes" value={data.notes as string} className="col-span-2" /> : null}
      {data.stages ? (
        <div className="col-span-2">
          <span className="text-gray-500 dark:text-zinc-400">Stages:</span>{" "}
          <span className="text-gray-900 dark:text-white">
            {(data.stages as Array<{ name: string }>).map((s) => s.name).join(" \u2192 ")}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <span className="text-gray-500 dark:text-zinc-400">{label}:</span>{" "}
      <span className="text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}
