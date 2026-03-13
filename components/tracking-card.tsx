"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Ship,
  Plane,
  Truck,
  Train,
  RefreshCw,
  MapPin,
  Clock,
  Loader2,
  ExternalLink,
} from "lucide-react";

type TrackingEvent = {
  id: string;
  timestamp: string;
  location: string | null;
  description: string;
  trackingStatus: string;
};

type TrackingData = {
  trackingNumber: string | null;
  carrier: string | null;
  carrierCode: string | null;
  shippingMethod: string | null;
  trackingStatus: string | null;
  currentLocation: { lat: number; lng: number; name: string | null } | null;
  estimatedArrival: string | null;
  lastSync: string | null;
  events: TrackingEvent[];
};

const trackingStatusColors: Record<string, string> = {
  NOT_FOUND: "bg-gray-50 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400",
  INFO_RECEIVED: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  IN_TRANSIT: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
  CUSTOMS: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  EXCEPTION: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  DELIVERED: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  EXPIRED: "bg-gray-50 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const trackingStatusLabels: Record<string, string> = {
  NOT_FOUND: "Not Found",
  INFO_RECEIVED: "Info Received",
  IN_TRANSIT: "In Transit",
  CUSTOMS: "Customs",
  EXCEPTION: "Exception",
  DELIVERED: "Delivered",
  EXPIRED: "Expired",
};

const shippingMethodIcons: Record<string, typeof Ship> = {
  OCEAN: Ship,
  AIR: Plane,
  ROAD: Truck,
  RAIL: Train,
  MULTIMODAL: Ship,
};

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function TrackingCard({ orderId }: { orderId: string }) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTracking = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/tracking`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [orderId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/tracking/refresh`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        // Refetch to get updated data
        await fetchTracking();
      }
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.trackingNumber) {
    return (
      <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">TRK</span>
            <Ship className="h-5 w-5 text-cyan-500" />
            Shipping & Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Awaiting tracking number from factory integration
          </p>
        </CardContent>
      </Card>
    );
  }

  const ShippingIcon = data.shippingMethod
    ? shippingMethodIcons[data.shippingMethod] ?? Ship
    : Ship;

  const etaDays = data.estimatedArrival ? daysUntil(data.estimatedArrival) : null;

  return (
    <Card className="bg-white dark:bg-[#0d0f13] border-gray-100 dark:border-zinc-800/60 rounded-xl card-hover-glow hud-corners">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-600">TRK</span>
            <ShippingIcon className="h-5 w-5 text-cyan-500" />
            Shipping & Tracking
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="ml-1.5 text-xs">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tracking header row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
              {data.trackingNumber}
            </span>
            {data.carrier && (
              <Badge variant="outline" className="text-xs font-normal">
                {data.carrier}
              </Badge>
            )}
          </div>
          {data.trackingStatus && (
            <Badge className={`text-xs ${trackingStatusColors[data.trackingStatus] ?? ""}`}>
              {trackingStatusLabels[data.trackingStatus] ?? data.trackingStatus}
            </Badge>
          )}
          {data.shippingMethod && (
            <Badge variant="outline" className="text-xs font-normal">
              {data.shippingMethod.charAt(0) + data.shippingMethod.slice(1).toLowerCase()}
            </Badge>
          )}
        </div>

        {/* Location + ETA row */}
        <div className="flex flex-wrap gap-6 text-sm">
          {data.currentLocation?.name && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-400">
              <MapPin className="h-3.5 w-3.5" />
              <span>{data.currentLocation.name}</span>
            </div>
          )}
          {data.estimatedArrival && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-400">
              <Clock className="h-3.5 w-3.5" />
              <span>
                ETA{" "}
                {new Date(data.estimatedArrival).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                {etaDays !== null && etaDays > 0 && (
                  <span className="text-gray-400 dark:text-zinc-500">
                    {" "}({etaDays}d)
                  </span>
                )}
                {etaDays !== null && etaDays <= 0 && (
                  <span className="text-green-500"> (arrived)</span>
                )}
              </span>
            </div>
          )}
          {data.lastSync && (
            <div className="text-xs text-gray-400 dark:text-zinc-600">
              Last synced{" "}
              {new Date(data.lastSync).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>

        {/* Tracking events timeline */}
        {data.events.length > 0 && (
          <div className="border-t border-gray-100 dark:border-zinc-800 pt-3">
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-3">
              Tracking History
            </p>
            <div className="space-y-0">
              {data.events.slice(0, 8).map((event, i) => (
                <div key={event.id} className="flex gap-3 pb-3 last:pb-0">
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        i === 0
                          ? "bg-cyan-500"
                          : "bg-gray-300 dark:bg-zinc-600"
                      }`}
                    />
                    {i < data.events.slice(0, 8).length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 dark:bg-zinc-700 mt-1" />
                    )}
                  </div>
                  {/* Event content */}
                  <div className="flex-1 min-w-0 pb-1">
                    <p className={`text-sm ${i === 0 ? "font-medium text-gray-900 dark:text-white" : "text-gray-600 dark:text-zinc-400"}`}>
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 dark:text-zinc-500">
                        {new Date(event.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {event.location && (
                        <span className="text-xs text-gray-400 dark:text-zinc-500">
                          · {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {data.events.length > 8 && (
                <p className="text-xs text-gray-400 dark:text-zinc-500 pl-5">
                  +{data.events.length - 8} more events
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
