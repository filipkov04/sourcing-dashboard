"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X, Ship, Plane, Truck, MapPin, Clock, Package, RefreshCw,
  ExternalLink, Navigation, Anchor, Building2, CircleDot, Flag,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { MapVehicle } from "./types";

type ShipmentPanelProps = {
  vehicle: MapVehicle | null;
  onClose: () => void;
};

const vehicleIcons = { ship: Ship, plane: Plane, truck: Truck };

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400",
  IN_PROGRESS: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  BEHIND_SCHEDULE: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  SHIPPED: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  IN_TRANSIT: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  CUSTOMS: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  DELAYED: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  DISRUPTED: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  DELIVERED: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
};

const stopIcons: Record<string, typeof MapPin> = {
  factory: Building2, port: Anchor, strait: Navigation, canal: Navigation,
  harbor: Anchor, customs: Flag, hub: Package, destination: Flag,
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(d: string | null): string {
  if (!d) return "";
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  if (diff === 0) return "today";
  return `in ${diff}d`;
}

function progressPercent(orderDate: string, expectedDate: string | null): number {
  if (!expectedDate) return 0;
  const start = new Date(orderDate).getTime();
  const end = new Date(expectedDate).getTime();
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (end - start)) * 100)));
}

export function ShipmentPanel({ vehicle, onClose }: ShipmentPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!vehicle?.orderId) return;
    setIsRefreshing(true);
    try { await fetch(`/api/orders/${vehicle.orderId}/tracking/refresh`, { method: "POST" }); } catch {}
    setIsRefreshing(false);
  };

  return (
    <AnimatePresence>
      {vehicle && (
        <motion.div
          key={vehicle.orderId}
          initial={{ x: -380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -380, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="absolute top-0 left-0 bottom-0 z-20 w-[360px] max-w-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700 overflow-y-auto shadow-xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-zinc-800 px-4 pt-3 pb-2 z-10">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {(() => { const Icon = vehicleIcons[vehicle.vehicleType]; return <Icon className="h-4 w-4 text-rose-500 flex-shrink-0" />; })()}
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{vehicle.orderNumber}</h4>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${statusColors[vehicle.status] ?? statusColors.PENDING}`}>
                    {vehicle.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">{vehicle.productName}</p>
              </div>
              <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Tracking Info */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">Tracking</h5>
            <div className="space-y-1.5 text-xs">
              {vehicle.carrier && <div className="flex justify-between"><span className="text-gray-500 dark:text-zinc-400">Carrier</span><span className="text-gray-900 dark:text-white font-medium">{vehicle.carrier}</span></div>}
              {vehicle.trackingNumber && <div className="flex justify-between"><span className="text-gray-500 dark:text-zinc-400">Tracking #</span><span className="text-gray-900 dark:text-white font-mono text-[11px]">{vehicle.trackingNumber}</span></div>}
              {vehicle.shippingMethod && <div className="flex justify-between"><span className="text-gray-500 dark:text-zinc-400">Method</span><span className="text-gray-900 dark:text-white">{vehicle.shippingMethod}</span></div>}
              {vehicle.currentLocation && <div className="flex justify-between"><span className="text-gray-500 dark:text-zinc-400">Location</span><span className="text-gray-900 dark:text-white">{vehicle.currentLocation}</span></div>}
            </div>
          </div>

          {/* Progress */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">Progress</h5>
            <div className="space-y-2">
              <div className="flex justify-between text-xs"><span className="text-gray-500 dark:text-zinc-400">Order Date</span><span className="text-gray-900 dark:text-white">{formatDate(vehicle.orderDate)}</span></div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-400">ETA</span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(vehicle.estimatedArrival ?? vehicle.expectedDate)}
                  <span className="text-gray-400 dark:text-zinc-500 ml-1 text-[10px]">{daysUntil(vehicle.estimatedArrival ?? vehicle.expectedDate)}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${progressPercent(vehicle.orderDate, vehicle.estimatedArrival ?? vehicle.expectedDate)}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500 tabular-nums">{progressPercent(vehicle.orderDate, vehicle.estimatedArrival ?? vehicle.expectedDate)}%</span>
              </div>
              <div className="flex justify-between text-xs"><span className="text-gray-500 dark:text-zinc-400">Quantity</span><span className="text-gray-900 dark:text-white">{vehicle.quantity.toLocaleString()} {vehicle.unit}</span></div>
            </div>
          </div>

          {/* Route Timeline */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">Route</h5>
            <div className="space-y-0">
              {vehicle.routeStops.map((stop, i) => {
                const StopIcon = stopIcons[stop.type] ?? CircleDot;
                const isLast = i === vehicle.routeStops.length - 1;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <StopIcon className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-blue-200 dark:bg-blue-800/50 my-0.5 min-h-[16px]" />}
                    </div>
                    <div className="pb-3 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white leading-tight">{stop.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-snug mt-0.5">{stop.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tracking Events */}
          {vehicle.trackingEvents.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Live Events</h5>
                <button onClick={handleRefresh} disabled={isRefreshing} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 flex items-center gap-1">
                  <RefreshCw className={`h-2.5 w-2.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
                </button>
              </div>
              <div className="space-y-2">
                {vehicle.trackingEvents.map((evt) => (
                  <div key={evt.id} className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-600 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-700 dark:text-zinc-300 leading-tight">{evt.description}</p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500">{evt.location && `${evt.location} · `}{new Date(evt.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Factory Info */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">Origin Factory</h5>
            <p className="text-xs font-medium text-gray-900 dark:text-white">{vehicle.factoryName}</p>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">{vehicle.factoryLocation}</p>
            {vehicle.factoryContact.name && <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">{vehicle.factoryContact.name}</p>}
            {vehicle.factoryContact.email && <a href={`mailto:${vehicle.factoryContact.email}`} className="text-[11px] text-blue-500 hover:text-blue-600 block mt-0.5">{vehicle.factoryContact.email}</a>}
            {vehicle.factoryContact.phone && <a href={`tel:${vehicle.factoryContact.phone}`} className="text-[11px] text-blue-500 hover:text-blue-600 block mt-0.5">{vehicle.factoryContact.phone}</a>}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50/50 dark:bg-zinc-800/30 flex items-center gap-3">
            <Link href={`/orders/${vehicle.orderId}`} className="flex-1 text-center text-xs font-medium py-2 px-3 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors">
              View Order <ExternalLink className="h-3 w-3 inline ml-1 -mt-0.5" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
