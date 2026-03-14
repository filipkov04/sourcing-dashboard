"use client";

import { Ship, Plane, Truck, Package, ChevronRight } from "lucide-react";
import type { MapVehicle } from "./types";

type ShipmentListProps = {
  vehicles: MapVehicle[];
  selectedVehicleId: string | null;
  onSelect: (vehicle: MapVehicle) => void;
};

const vehicleIcons = { ship: Ship, plane: Plane, truck: Truck };

const statusDot: Record<string, string> = {
  IN_TRANSIT: "bg-cyan-400",
  CUSTOMS: "bg-amber-400",
  SHIPPED: "bg-indigo-400",
  DELIVERED: "bg-green-400",
  DELAYED: "bg-amber-400",
  DISRUPTED: "bg-red-400",
  EXCEPTION: "bg-red-400",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ShipmentList({ vehicles, selectedVehicleId, onSelect }: ShipmentListProps) {
  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 px-3">
        <Package className="h-8 w-8 text-gray-300 dark:text-zinc-600 mb-2" />
        <p className="text-xs text-gray-400 dark:text-zinc-500 text-center">
          No tracked shipments with GPS data
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Shipments
          </h4>
          <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 tabular-nums">
            {vehicles.length}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {vehicles.map((v) => {
          const Icon = vehicleIcons[v.vehicleType];
          const isSelected = v.orderId === selectedVehicleId;
          const dot = statusDot[v.trackingStatus ?? v.status] ?? "bg-gray-400";
          const latestEvent = v.trackingEvents[0];

          return (
            <button
              key={v.orderId}
              onClick={() => onSelect(v)}
              className={`w-full text-left px-3 py-2.5 border-b border-gray-50 dark:border-zinc-800/50 transition-colors group ${
                isSelected
                  ? "bg-rose-50 dark:bg-rose-900/10 border-l-2 border-l-rose-500"
                  : "hover:bg-gray-50 dark:hover:bg-zinc-800/40 border-l-2 border-l-transparent"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 p-1 rounded ${isSelected ? "bg-rose-100 dark:bg-rose-900/30" : "bg-gray-100 dark:bg-zinc-800"}`}>
                  <Icon className={`h-3 w-3 ${isSelected ? "text-rose-500" : "text-gray-400 dark:text-zinc-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold truncate ${isSelected ? "text-rose-600 dark:text-rose-400" : "text-gray-900 dark:text-white"}`}>
                      {v.orderNumber}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                    {v.productName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {v.carrier && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 truncate">
                        {v.carrier}
                      </span>
                    )}
                    {latestEvent && (
                      <span className="text-[9px] text-gray-400 dark:text-zinc-500 truncate">
                        {latestEvent.location ?? ""}
                      </span>
                    )}
                  </div>
                  {v.lastTrackingSync && (
                    <p className="text-[9px] text-gray-300 dark:text-zinc-600 mt-1">
                      Synced {timeAgo(v.lastTrackingSync)}
                    </p>
                  )}
                </div>
                <ChevronRight className={`h-3 w-3 mt-1 flex-shrink-0 transition-colors ${isSelected ? "text-rose-400" : "text-gray-300 dark:text-zinc-600 group-hover:text-gray-400"}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
