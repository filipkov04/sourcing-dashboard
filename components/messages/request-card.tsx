"use client";

import { ClipboardList, Package, Factory, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RequestCardData {
  id: string;
  type: string;
  status: string;
  data: Record<string, unknown>;
  requester: { id: string; name: string | null; email: string };
  targetOrder?: { orderNumber: string; productName: string } | null;
  targetFactory?: { name: string; location: string } | null;
}

function getRequestIcon(type: string) {
  if (type.includes("DELETE")) return Trash2;
  if (type.includes("EDIT")) return Pencil;
  if (type.startsWith("FACTORY")) return Factory;
  return Package;
}

function getRequestLabel(type: string): string {
  if (type === "ORDER_REQUEST") return "New Order Request";
  if (type === "FACTORY_REQUEST") return "New Factory Request";
  if (type === "ORDER_EDIT_REQUEST") return "Edit Order Request";
  if (type === "FACTORY_EDIT_REQUEST") return "Edit Factory Request";
  if (type === "ORDER_DELETE_REQUEST") return "Delete Order Request";
  if (type === "FACTORY_DELETE_REQUEST") return "Delete Factory Request";
  return "Request";
}

function getRequestAccent(type: string) {
  if (type.includes("DELETE")) return "border-red-500/30 bg-red-500/5";
  if (type.includes("EDIT")) return "border-amber-500/30 bg-amber-500/5";
  return "border-[#FF4D15]/30 bg-[#FF4D15]/5";
}

function getIconAccent(type: string) {
  if (type.includes("DELETE")) return "text-red-500 bg-red-500/10";
  if (type.includes("EDIT")) return "text-amber-500 bg-amber-500/10";
  return "text-[#FF4D15] bg-[#FF4D15]/10";
}

function getSummaryLine(request: RequestCardData): string {
  const { type, data, targetOrder, targetFactory } = request;
  if (type === "ORDER_REQUEST") return String(data.productName || "Untitled");
  if (type === "FACTORY_REQUEST") return String(data.name || "Untitled");
  if (type === "ORDER_EDIT_REQUEST" && targetOrder) return `${targetOrder.productName} (#${targetOrder.orderNumber})`;
  if (type === "FACTORY_EDIT_REQUEST" && targetFactory) return targetFactory.name;
  if (type === "ORDER_DELETE_REQUEST" && targetOrder) return `${targetOrder.productName} (#${targetOrder.orderNumber})`;
  if (type === "FACTORY_DELETE_REQUEST" && targetFactory) return targetFactory.name;
  return "Request";
}

function getDetailFields(request: RequestCardData): { label: string; value: string }[] {
  const { type, data } = request;
  const fields: { label: string; value: string }[] = [];

  if (type === "ORDER_REQUEST") {
    if (data.quantity) fields.push({ label: "Qty", value: `${data.quantity} ${data.unit || "pcs"}` });
    if (data.priority && data.priority !== "NORMAL") fields.push({ label: "Priority", value: String(data.priority) });
    if (data.expectedDate) {
      try { fields.push({ label: "Expected", value: new Date(data.expectedDate as string).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }); } catch {}
    }
  } else if (type === "FACTORY_REQUEST") {
    if (data.location) fields.push({ label: "Location", value: String(data.location) });
    if (data.contactName) fields.push({ label: "Contact", value: String(data.contactName) });
  } else if (type.includes("EDIT") && data.changes) {
    const changes = data.changes as Record<string, unknown>;
    const keys = Object.keys(changes).slice(0, 3);
    keys.forEach((k) => {
      fields.push({ label: k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim(), value: String(changes[k]) });
    });
  } else if (type.includes("DELETE") && data.reason) {
    fields.push({ label: "Reason", value: String(data.reason) });
  }

  return fields.slice(0, 3);
}

/** Compact request card for message input preview (with dismiss) */
export function RequestCardPreview({
  request,
  onDismiss,
}: {
  request: RequestCardData;
  onDismiss: () => void;
}) {
  const Icon = getRequestIcon(request.type);
  const fields = getDetailFields(request);

  return (
    <div className={cn("relative rounded-lg border px-3 py-2.5", getRequestAccent(request.type))}>
      <button
        onClick={onDismiss}
        className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200/80 dark:bg-zinc-700/80 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
      >
        <X className="h-3 w-3 text-gray-600 dark:text-zinc-300" />
      </button>
      <div className="flex items-start gap-2.5">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", getIconAccent(request.type))}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 pr-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            {getRequestLabel(request.type)}
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate mt-0.5">
            {getSummaryLine(request)}
          </p>
          {fields.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {fields.map((f) => (
                <span key={f.label} className="text-[11px] text-gray-500 dark:text-zinc-400">
                  <span className="text-gray-400 dark:text-zinc-500">{f.label}:</span> {f.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Request card rendered inside a message bubble */
export function RequestCardBubble({
  request,
  isOwn,
}: {
  request: RequestCardData;
  isOwn: boolean;
}) {
  const Icon = getRequestIcon(request.type);
  const fields = getDetailFields(request);

  return (
    <a
      href={`/requests?rid=${request.id}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "block rounded-xl border px-3.5 py-3 min-w-[220px] max-w-[320px] no-underline transition-all cursor-pointer",
        isOwn
          ? "border-black/10 bg-black/15 hover:bg-black/25"
          : "border-gray-200 dark:border-zinc-700/50 bg-gray-50/80 dark:bg-zinc-800/50 hover:bg-gray-100/80 dark:hover:bg-zinc-700/50"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            isOwn ? "bg-black/15 text-white" : getIconAccent(request.type)
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wider",
              isOwn ? "text-white/60" : "text-gray-400 dark:text-zinc-500"
            )}
          >
            {getRequestLabel(request.type)}
          </p>
          <p
            className={cn(
              "text-sm font-medium truncate mt-0.5",
              isOwn ? "text-white" : "text-gray-900 dark:text-white"
            )}
          >
            {getSummaryLine(request)}
          </p>
          {fields.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              {fields.map((f) => (
                <span
                  key={f.label}
                  className={cn(
                    "text-[11px]",
                    isOwn ? "text-white/70" : "text-gray-500 dark:text-zinc-400"
                  )}
                >
                  <span className={isOwn ? "text-white/50" : "text-gray-400 dark:text-zinc-500"}>
                    {f.label}:
                  </span>{" "}
                  {f.value}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <ClipboardList className={cn("h-3 w-3", isOwn ? "text-white/40" : "text-gray-300 dark:text-zinc-600")} />
              <span
                className={cn(
                  "text-[10px]",
                  isOwn ? "text-white/50" : "text-gray-400 dark:text-zinc-500"
                )}
              >
                from {request.requester.name || request.requester.email}
              </span>
            </div>
            <span className={cn("text-[10px]", isOwn ? "text-white/40" : "text-gray-400 dark:text-zinc-500")}>
              View →
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
