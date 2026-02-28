"use client";

import { X, Factory, Package, MapPin, Mail, Phone, User, Users, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ConversationDetail, ConversationParticipant } from "@/lib/use-conversations";
import type { PresenceStatus } from "@/lib/use-presence";
import { StatusDot } from "./status-dot";

interface ConversationProfilePopupProps {
  conversation: ConversationDetail;
  onClose: () => void;
  statusMap: Record<string, PresenceStatus>;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function ParticipantRow({ p, status }: { p: ConversationParticipant; status: PresenceStatus }) {
  const statusLabel =
    status === "online" ? "Online"
    : status === "busy" ? "On a call"
    : status === "away" ? "Away"
    : "Offline";

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-600 dark:to-zinc-700">
          <span className="text-[10px] font-bold text-gray-600 dark:text-zinc-300">
            {getInitials(p.user.name)}
          </span>
        </div>
        <StatusDot status={status} ringClass="ring-white dark:ring-zinc-800" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {p.user.name || p.user.email}
        </p>
        <p className="truncate text-xs text-gray-400 dark:text-zinc-500">
          {statusLabel}{p.user.email ? ` · ${p.user.email}` : ""}
        </p>
      </div>
    </div>
  );
}

export function ConversationProfilePopup({ conversation, onClose, statusMap }: ConversationProfilePopupProps) {
  const hasFactory = !!conversation.factory;
  const hasOrder = !!conversation.order;
  const factory = conversation.factory;
  const order = conversation.order;

  const displayName = conversation.subject
    || factory?.name
    || order?.orderNumber
    || "Conversation";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-sm rounded-2xl bg-white shadow-xl dark:bg-zinc-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-950 dark:from-zinc-700 dark:to-zinc-900 px-6 pt-6 pb-10">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              {hasFactory ? (
                <Factory className="h-6 w-6 text-white" />
              ) : hasOrder ? (
                <Package className="h-6 w-6 text-white" />
              ) : (
                <Users className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-white">{displayName}</h3>
              <p className="text-sm text-white/60">
                {hasFactory ? "Factory" : hasOrder ? "Order" : "Conversation"}
                {" · "}
                {conversation.participants.length} member{conversation.participants.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="-mt-4 rounded-t-2xl bg-white dark:bg-zinc-800 relative px-6 pt-5 pb-6 space-y-5">
          {/* Factory details */}
          {factory && (
            <div className="space-y-3">
              {factory.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Location</p>
                    <p className="text-sm text-gray-900 dark:text-white">{factory.location}</p>
                  </div>
                </div>
              )}
              {factory.contactName && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Contact</p>
                    <p className="text-sm text-gray-900 dark:text-white">{factory.contactName}</p>
                  </div>
                </div>
              )}
              {factory.contactEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Email</p>
                    <a href={`mailto:${factory.contactEmail}`} className="text-sm text-[#F97316] hover:underline">
                      {factory.contactEmail}
                    </a>
                  </div>
                </div>
              )}
              {factory.contactPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Phone</p>
                    <a href={`tel:${factory.contactPhone}`} className="text-sm text-[#F97316] hover:underline">
                      {factory.contactPhone}
                    </a>
                  </div>
                </div>
              )}

              <Link
                href={`/factories/${factory.id}`}
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[#F97316] hover:text-[#EA580C] transition-colors"
              >
                View factory page
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Order details */}
          {order && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Package className="h-4 w-4 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                <div>
                  <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Order</p>
                  <p className="text-sm text-gray-900 dark:text-white">{order.orderNumber}</p>
                </div>
              </div>
              {order.productName && (
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Product</p>
                    <p className="text-sm text-gray-900 dark:text-white">{order.productName}</p>
                  </div>
                </div>
              )}
              <Link
                href={`/orders/${order.id}`}
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[#F97316] hover:text-[#EA580C] transition-colors"
              >
                View order page
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Divider if there's content above */}
          {(hasFactory || hasOrder) && (
            <div className="border-t border-gray-100 dark:border-zinc-700" />
          )}

          {/* Participants */}
          <div>
            <p className="mb-2 text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
              Members ({conversation.participants.length})
            </p>
            <div className="max-h-48 overflow-y-auto -mx-1 px-1">
              {conversation.participants.map((p) => (
                <ParticipantRow
                  key={p.id}
                  p={p}
                  status={statusMap[p.userId] ?? "offline"}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
