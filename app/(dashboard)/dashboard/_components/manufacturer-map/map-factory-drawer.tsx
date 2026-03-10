"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  ShieldCheck,
  ShieldAlert,
  Package,
  Clock,
  AlertTriangle,
  MapPin,
  Mail,
  Phone,
  User,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { MapFactory, FactoryOrder } from "./types";

type MapFactoryDrawerProps = {
  factory: MapFactory | null;
  onClose: () => void;
};

const verificationBadge: Record<string, { label: string; className: string }> = {
  VERIFIED: { label: "Verified", className: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30" },
  PENDING: { label: "Pending", className: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30" },
  UNVERIFIED: { label: "Unverified", className: "text-gray-500 bg-gray-100 dark:text-zinc-400 dark:bg-zinc-800" },
};

const riskBadge: Record<string, { label: string; className: string }> = {
  LOW: { label: "Low Risk", className: "text-green-600 dark:text-green-400" },
  MEDIUM: { label: "Medium Risk", className: "text-amber-600 dark:text-amber-400" },
  HIGH: { label: "High Risk", className: "text-orange-600 dark:text-orange-400" },
  CRITICAL: { label: "Critical Risk", className: "text-red-600 dark:text-red-400" },
};

const statusBadge: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  DELAYED: { label: "Delayed", className: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  DISRUPTED: { label: "Disrupted", className: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
};

export function MapFactoryDrawer({ factory, onClose }: MapFactoryDrawerProps) {
  const [orders, setOrders] = useState<FactoryOrder[]>([]);
  const [contact, setContact] = useState<{ name: string | null; email: string | null; phone: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!factory) {
      setOrders([]);
      setContact(null);
      return;
    }

    setIsLoading(true);
    fetch(`/api/dashboard/factory-orders/${factory.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.data.orders);
          setContact(data.data.contact);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [factory?.id]);

  return (
    <AnimatePresence>
      {factory && (
        <motion.div
          key={factory.id}
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="absolute top-0 right-0 bottom-0 z-20 w-[380px] max-w-full bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-700 overflow-y-auto shadow-xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-zinc-800 px-4 pt-3 pb-2 z-10">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {factory.name}
                  </h4>
                  {factory.isPreferred && (
                    <Star className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 fill-amber-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {factory.city}, {factory.country}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Badges */}
          <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${verificationBadge[factory.verificationStatus].className}`}>
              <ShieldCheck className="h-3 w-3 inline mr-0.5 -mt-0.5" />
              {verificationBadge[factory.verificationStatus].label}
            </span>
            {factory.riskLevel !== "LOW" && (
              <span className={`text-[10px] font-medium ${riskBadge[factory.riskLevel].className}`}>
                <ShieldAlert className="h-3 w-3 inline mr-0.5 -mt-0.5" />
                {riskBadge[factory.riskLevel].label}
              </span>
            )}
          </div>

          {/* Orders Section */}
          <div className="px-4 pb-3">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">
              Active Orders ({factory.orderCount})
            </h5>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg bg-gray-50 dark:bg-zinc-800/50 p-3 animate-pulse">
                    <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-2/3 mb-2" />
                    <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-1/2 mb-2" />
                    <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500 py-2">No active orders</p>
            ) : (
              <div className="space-y-1.5">
                {orders.map((order) => {
                  const sb = statusBadge[order.status] ?? statusBadge.PENDING;
                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="block rounded-lg bg-gray-50 dark:bg-zinc-800/50 p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {order.orderNumber}
                        </span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${sb.className}`}>
                          {sb.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mb-1.5">
                        {order.productName} · {order.quantity.toLocaleString()} {order.unit}
                      </p>
                      {/* Progress bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              order.status === "DISRUPTED"
                                ? "bg-red-500"
                                : order.status === "DELAYED"
                                ? "bg-amber-500"
                                : "bg-[#FF4D15]"
                            }`}
                            style={{ width: `${order.overallProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 tabular-nums w-7 text-right">
                          {order.overallProgress}%
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                        Expected {new Date(order.expectedDate).toLocaleDateString()}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="px-4 pb-3 border-t border-gray-100 dark:border-zinc-800 pt-3">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">
              Factory Stats
            </h5>
            <div className="grid grid-cols-2 gap-2">
              {factory.moqMin != null && (
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-2">
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500">MOQ</p>
                  <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">
                    <Package className="h-3 w-3 inline mr-0.5 -mt-0.5 text-gray-400" />
                    {factory.moqMin.toLocaleString()}
                  </p>
                </div>
              )}
              {factory.leadTimeDays != null && (
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-2">
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500">Lead Time</p>
                  <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">
                    <Clock className="h-3 w-3 inline mr-0.5 -mt-0.5 text-gray-400" />
                    {factory.leadTimeDays}d
                  </p>
                </div>
              )}
              {factory.reliabilityScore != null && (
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-2">
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500">Reliability</p>
                  <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">
                    {factory.reliabilityScore.toFixed(0)}%
                  </p>
                </div>
              )}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-2">
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">Active Orders</p>
                <p className="text-xs font-medium text-gray-800 dark:text-zinc-200">
                  {factory.orderCount}
                </p>
              </div>
            </div>
          </div>

          {/* Categories & Capabilities */}
          {(factory.categories.length > 0 || factory.capabilities.length > 0) && (
            <div className="px-4 pb-3 border-t border-gray-100 dark:border-zinc-800 pt-3">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">
                Capabilities
              </h5>
              <div className="flex flex-wrap gap-1">
                {factory.categories.map((c) => (
                  <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {c}
                  </span>
                ))}
                {factory.capabilities.map((c) => (
                  <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact Section */}
          {contact && (contact.name || contact.email || contact.phone) && (
            <div className="px-4 pb-3 border-t border-gray-100 dark:border-zinc-800 pt-3">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">
                Contact
              </h5>
              <div className="space-y-1.5">
                {contact.name && (
                  <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-zinc-300">
                    <User className="h-3 w-3 text-gray-400 dark:text-zinc-500" />
                    {contact.name}
                  </div>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-xs text-gray-700 dark:text-zinc-300 hover:text-[#FF4D15] transition-colors"
                  >
                    <Mail className="h-3 w-3 text-gray-400 dark:text-zinc-500" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-xs text-gray-700 dark:text-zinc-300 hover:text-[#FF4D15] transition-colors"
                  >
                    <Phone className="h-3 w-3 text-gray-400 dark:text-zinc-500" />
                    {contact.phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
            <Link
              href={`/factories/${factory.id}`}
              className="text-xs font-medium text-[#FF4D15] hover:text-[#e0440f] transition-colors"
            >
              View Factory Profile →
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
