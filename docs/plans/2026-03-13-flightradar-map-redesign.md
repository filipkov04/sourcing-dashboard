# FlightRadar-Style Map Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the manufacturer map from always-visible static routes into a FlightRadar24-style interface where vehicle icons (ships/planes/trucks) are the primary visual, routes appear only on click, and a slide-in panel shows full shipment details.

**Architecture:** Replace route-first rendering with vehicle-first rendering. Each factory's orders get a vehicle icon positioned at the last known stop. Clicking a vehicle reveals its route line (magenta), stop dots (blue), and opens a left slide-in panel with order/tracking details. Factory dots are hidden by default. User geolocation shown as pulsing blue dot.

**Tech Stack:** MapLibre GL JS, Next.js 16, TypeScript, Tailwind, Framer Motion (existing)

---

## Task 1: New API — Vehicle Positions

Extend the existing shipments API to return ALL orders with shipping data (not just those with GPS tracking), so we can position vehicles based on order status.

**Files:**
- Create: `app/api/dashboard/map-vehicles/route.ts`

**Step 1: Create the vehicles API endpoint**

```typescript
// app/api/dashboard/map-vehicles/route.ts
import { prisma } from "@/lib/db";
import { success, unauthorized, handleError, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const orders = await prisma.order.findMany({
      where: {
        ...projectScope(session),
        status: {
          in: ["PENDING", "IN_PROGRESS", "DELAYED", "DISRUPTED", "SHIPPED", "IN_TRANSIT", "CUSTOMS"],
        },
      },
      select: {
        id: true,
        orderNumber: true,
        productName: true,
        status: true,
        quantity: true,
        unit: true,
        trackingNumber: true,
        carrier: true,
        carrierCode: true,
        shippingMethod: true,
        currentLat: true,
        currentLng: true,
        currentLocation: true,
        trackingStatus: true,
        estimatedArrival: true,
        lastTrackingSync: true,
        orderDate: true,
        expectedDate: true,
        factoryId: true,
        factory: {
          select: {
            id: true,
            name: true,
            latitude: true,
            longitude: true,
            location: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
        trackingEvents: {
          orderBy: { timestamp: "desc" },
          take: 10,
          select: {
            id: true,
            timestamp: true,
            location: true,
            description: true,
            trackingStatus: true,
          },
        },
      },
    });

    return success(orders);
  } catch (err) {
    return handleError(err);
  }
}
```

**Step 2: Verify endpoint works**

Run: `curl -s http://localhost:3000/api/dashboard/map-vehicles | head -c 200`
Expected: JSON response with orders data (or 307 redirect if not authenticated)

**Step 3: Commit**

```bash
git add app/api/dashboard/map-vehicles/route.ts
git commit -m "feat: add map-vehicles API endpoint for FlightRadar-style map"
```

---

## Task 2: New Types & Vehicle Position Logic

Add new types for the vehicle-based map and a utility function to compute vehicle positions from order status.

**Files:**
- Modify: `app/(dashboard)/dashboard/_components/manufacturer-map/types.ts`
- Create: `app/(dashboard)/dashboard/_components/manufacturer-map/vehicle-utils.ts`

**Step 1: Add new types to types.ts**

Add these types AFTER the existing `LiveShipment` type:

```typescript
export type MapVehicle = {
  orderId: string;
  orderNumber: string;
  productName: string;
  status: string;
  quantity: number;
  unit: string;
  trackingNumber: string | null;
  carrier: string | null;
  shippingMethod: string | null;
  trackingStatus: string | null;
  estimatedArrival: string | null;
  lastTrackingSync: string | null;
  orderDate: string;
  expectedDate: string | null;
  currentLocation: string | null;
  // Computed position
  lat: number;
  lng: number;
  // Bearing for icon rotation (degrees, 0 = north)
  bearing: number;
  // Vehicle type determines icon
  vehicleType: "ship" | "plane" | "truck";
  // Factory info
  factoryId: string;
  factoryName: string;
  factoryLat: number;
  factoryLng: number;
  factoryLocation: string;
  factoryContact: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  // Tracking events
  trackingEvents: Array<{
    id: string;
    timestamp: string;
    location: string | null;
    description: string;
    trackingStatus: string;
  }>;
  // Route info (computed)
  routeStops: Array<{
    name: string;
    coords: [number, number];
    type: string;
    description: string;
    icon: string;
  }>;
  routeSegments: Array<{
    coordinates: [number, number][];
    transportMethod: "ship" | "truck";
  }>;
};
```

**Step 2: Create vehicle-utils.ts**

```typescript
// app/(dashboard)/dashboard/_components/manufacturer-map/vehicle-utils.ts
import { buildShippingRoute, type RouteStop, type ShippingRoute } from "./arc-utils";
import type { MapVehicle } from "./types";

/**
 * Determine vehicle type from shipping method and route.
 */
function getVehicleType(shippingMethod: string | null, route: ShippingRoute): "ship" | "plane" | "truck" {
  if (shippingMethod === "AIR") return "plane";
  if (shippingMethod === "ROAD" || shippingMethod === "RAIL") return "truck";
  // Ocean or multimodal — check if route has ship segments
  const hasShip = route.segments.some((s) => s.transportMethod === "ship");
  return hasShip ? "ship" : "truck";
}

/**
 * Position the vehicle at the appropriate stop based on order status.
 * Returns [lng, lat] coordinates.
 */
function getVehiclePosition(
  order: any,
  route: ShippingRoute
): { coords: [number, number]; bearing: number } {
  // If we have real GPS from tracking, use it
  if (order.currentLat != null && order.currentLng != null) {
    return {
      coords: [order.currentLng, order.currentLat],
      bearing: 0,
    };
  }

  const stops = route.stops;
  if (stops.length === 0) {
    return { coords: [order.factory.longitude, order.factory.latitude], bearing: 0 };
  }

  // Map order status to a stop position
  let stopIndex = 0;
  switch (order.status) {
    case "PENDING":
    case "IN_PROGRESS":
      // At factory
      stopIndex = 0;
      break;
    case "SHIPPED":
      // At departure port (second stop usually)
      stopIndex = Math.min(1, stops.length - 1);
      break;
    case "IN_TRANSIT":
      // Midway through route
      stopIndex = Math.floor(stops.length / 2);
      break;
    case "CUSTOMS":
      // At arrival port (second to last or last harbor)
      const harborIdx = stops.findIndex((s) => s.type === "harbor");
      stopIndex = harborIdx >= 0 ? harborIdx : stops.length - 2;
      break;
    case "DELAYED":
    case "DISRUPTED":
      // At departure port area
      stopIndex = Math.min(1, stops.length - 1);
      break;
    default:
      stopIndex = 0;
  }

  stopIndex = Math.max(0, Math.min(stopIndex, stops.length - 1));
  const stop = stops[stopIndex];

  // Calculate bearing to next stop
  let bearing = 0;
  if (stopIndex < stops.length - 1) {
    const next = stops[stopIndex + 1];
    bearing = calculateBearing(stop.coords, next.coords);
  }

  return { coords: stop.coords, bearing };
}

/**
 * Calculate bearing between two [lng, lat] points in degrees.
 */
function calculateBearing(from: [number, number], to: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const dLng = toRad(to[0] - from[0]);
  const lat1 = toRad(from[1]);
  const lat2 = toRad(to[1]);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Transform raw API order data into MapVehicle objects with computed positions.
 */
export function ordersToVehicles(orders: any[]): MapVehicle[] {
  return orders
    .filter((o) => o.factory?.latitude != null && o.factory?.longitude != null)
    .map((order) => {
      const route = buildShippingRoute(order.factory.longitude, order.factory.latitude);
      const vehicleType = getVehicleType(order.shippingMethod, route);
      const { coords, bearing } = getVehiclePosition(order, route);

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        productName: order.productName,
        status: order.status,
        quantity: order.quantity,
        unit: order.unit,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        shippingMethod: order.shippingMethod,
        trackingStatus: order.trackingStatus,
        estimatedArrival: order.estimatedArrival,
        lastTrackingSync: order.lastTrackingSync,
        orderDate: order.orderDate,
        expectedDate: order.expectedDate,
        currentLocation: order.currentLocation,
        lat: coords[1],
        lng: coords[0],
        bearing,
        vehicleType,
        factoryId: order.factory.id,
        factoryName: order.factory.name,
        factoryLat: order.factory.latitude,
        factoryLng: order.factory.longitude,
        factoryLocation: order.factory.location,
        factoryContact: {
          name: order.factory.contactName,
          email: order.factory.contactEmail,
          phone: order.factory.contactPhone,
        },
        trackingEvents: order.trackingEvents ?? [],
        routeStops: route.stops.map((s) => ({
          name: s.name,
          coords: s.coords,
          type: s.type,
          description: s.description,
          icon: s.icon,
        })),
        routeSegments: route.segments,
      };
    });
}
```

**Step 3: Export RouteStop and ShippingRoute types from arc-utils.ts**

In `arc-utils.ts`, the types `RouteStop` and `ShippingRoute` are already exported. Verify this.

**Step 4: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -v ".next/types" | head -20`
Expected: No errors

**Step 5: Commit**

```bash
git add app/(dashboard)/dashboard/_components/manufacturer-map/types.ts \
       app/(dashboard)/dashboard/_components/manufacturer-map/vehicle-utils.ts
git commit -m "feat: add MapVehicle type and vehicle positioning logic"
```

---

## Task 3: SVG Vehicle Icons

Create SVG icon strings for ship, plane, and truck silhouettes that can be used as MapLibre symbol images.

**Files:**
- Create: `app/(dashboard)/dashboard/_components/manufacturer-map/vehicle-icons.ts`

**Step 1: Create vehicle icon SVGs**

```typescript
// app/(dashboard)/dashboard/_components/manufacturer-map/vehicle-icons.ts
import maplibregl from "maplibre-gl";

/**
 * Monochrome vehicle silhouette SVGs for map markers.
 * Each returns an HTMLImageElement that MapLibre can use as a symbol icon.
 */

function svgToImage(svg: string, size: number = 24): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image(size, size);
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

const SHIP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 20a1 1 0 0 0 1.02.17l4.48-1.79a1 1 0 0 1 .74 0l4.52 1.81a1 1 0 0 0 .74 0l4.52-1.81a1 1 0 0 1 .74 0l4.48 1.79A1 1 0 0 0 22 20" stroke="STROKE_COLOR"/>
  <path d="M4 18l-1-5h18l-1 5" stroke="STROKE_COLOR"/>
  <path d="M12 2v7" stroke="STROKE_COLOR"/>
  <path d="M7 9h10l-2-4H9z" stroke="STROKE_COLOR" fill="FILL_COLOR"/>
</svg>`;

const PLANE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" stroke="STROKE_COLOR" fill="FILL_COLOR"/>
</svg>`;

const TRUCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" stroke="STROKE_COLOR"/>
  <path d="M15 18H9" stroke="STROKE_COLOR"/>
  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" stroke="STROKE_COLOR"/>
  <circle cx="17" cy="18" r="2" stroke="STROKE_COLOR" fill="FILL_COLOR"/>
  <circle cx="7" cy="18" r="2" stroke="STROKE_COLOR" fill="FILL_COLOR"/>
</svg>`;

// Color variants
function colorize(svg: string, stroke: string, fill: string): string {
  return svg.replace(/STROKE_COLOR/g, stroke).replace(/FILL_COLOR/g, fill);
}

/**
 * Register all vehicle icon variants on the map.
 * Call this once after map load.
 */
export async function registerVehicleIcons(map: maplibregl.Map) {
  const variants = [
    { suffix: "default", stroke: "#475569", fill: "#475569" },    // slate-600 (normal)
    { suffix: "selected", stroke: "#e11d48", fill: "#e11d48" },   // rose-600 (selected/highlighted)
  ];

  const vehicles = [
    { name: "ship", svg: SHIP_SVG },
    { name: "plane", svg: PLANE_SVG },
    { name: "truck", svg: TRUCK_SVG },
  ];

  for (const v of vehicles) {
    for (const c of variants) {
      const id = `vehicle-${v.name}-${c.suffix}`;
      if (map.hasImage(id)) continue;
      const colored = colorize(v.svg, c.stroke, c.fill);
      const img = await svgToImage(colored, 28);
      map.addImage(id, img, { sdf: false });
    }
  }
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -v ".next/types" | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add app/(dashboard)/dashboard/_components/manufacturer-map/vehicle-icons.ts
git commit -m "feat: add SVG vehicle icons for map markers (ship, plane, truck)"
```

---

## Task 4: Vehicle GeoJSON Generator

Add a function to convert MapVehicle array into GeoJSON for the vehicle layer.

**Files:**
- Modify: `app/(dashboard)/dashboard/_components/manufacturer-map/map-utils.ts`

**Step 1: Add vehiclesToGeoJSON function**

Add this at the END of `map-utils.ts`, after the existing `liveShipmentsGeoJSON` function:

```typescript
import type { MapVehicle } from "./types";

/**
 * Generate GeoJSON points for vehicle markers (FlightRadar style).
 * Each vehicle is a point at its computed position with bearing for rotation.
 */
export function vehiclesToGeoJSON(vehicles: MapVehicle[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: vehicles.map((v) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [v.lng, v.lat],
      },
      properties: {
        orderId: v.orderId,
        orderNumber: v.orderNumber,
        vehicleType: v.vehicleType,
        bearing: v.bearing,
        status: v.status,
        carrier: v.carrier ?? "",
        trackingNumber: v.trackingNumber ?? "",
        isSelected: false,
      },
    })),
  };
}

/**
 * Generate GeoJSON for a selected vehicle's route (magenta line + blue stop dots).
 * Only called when a vehicle is clicked.
 */
export function selectedRouteGeoJSON(vehicle: MapVehicle): {
  lines: GeoJSON.FeatureCollection;
  stops: GeoJSON.FeatureCollection;
} {
  const lineFeatures: GeoJSON.Feature[] = vehicle.routeSegments.map((seg) => ({
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: seg.coordinates,
    },
    properties: {
      transportMethod: seg.transportMethod,
    },
  }));

  const stopFeatures: GeoJSON.Feature[] = vehicle.routeStops.map((stop) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: stop.coords,
    },
    properties: {
      name: stop.name,
      type: stop.type,
      description: stop.description,
      icon: stop.icon,
    },
  }));

  return {
    lines: { type: "FeatureCollection", features: lineFeatures },
    stops: { type: "FeatureCollection", features: stopFeatures },
  };
}
```

Note: You need to add `MapVehicle` to the import at the top of the file. Change line 1 from:
```typescript
import type { MapFactory, LiveShipment } from "./types";
```
to:
```typescript
import type { MapFactory, LiveShipment, MapVehicle } from "./types";
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -v ".next/types" | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add app/(dashboard)/dashboard/_components/manufacturer-map/map-utils.ts
git commit -m "feat: add vehicle and selected-route GeoJSON generators"
```

---

## Task 5: Shipment Detail Panel (Slide-in)

Create the left slide-in panel that shows full shipment details when a vehicle is clicked.

**Files:**
- Create: `app/(dashboard)/dashboard/_components/manufacturer-map/shipment-panel.tsx`

**Step 1: Create the panel component**

```typescript
// app/(dashboard)/dashboard/_components/manufacturer-map/shipment-panel.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Ship,
  Plane,
  Truck,
  MapPin,
  Clock,
  Package,
  RefreshCw,
  ExternalLink,
  Navigation,
  Anchor,
  Building2,
  CircleDot,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { MapVehicle } from "./types";

type ShipmentPanelProps = {
  vehicle: MapVehicle | null;
  onClose: () => void;
};

const vehicleIcons = {
  ship: Ship,
  plane: Plane,
  truck: Truck,
};

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400",
  IN_PROGRESS: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  SHIPPED: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  IN_TRANSIT: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  CUSTOMS: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  DELAYED: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  DISRUPTED: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  DELIVERED: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
};

const stopIcons: Record<string, typeof MapPin> = {
  factory: Building2,
  port: Anchor,
  strait: Navigation,
  canal: Navigation,
  harbor: Anchor,
  customs: Flag,
  hub: Package,
  destination: Flag,
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
  const now = Date.now();
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
}

export function ShipmentPanel({ vehicle, onClose }: ShipmentPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!vehicle?.orderId) return;
    setIsRefreshing(true);
    try {
      await fetch(`/api/orders/${vehicle.orderId}/tracking/refresh`, { method: "POST" });
    } catch {}
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
                  {(() => {
                    const Icon = vehicleIcons[vehicle.vehicleType];
                    return <Icon className="h-4 w-4 text-rose-500 flex-shrink-0" />;
                  })()}
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {vehicle.orderNumber}
                  </h4>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${statusColors[vehicle.status] ?? statusColors.PENDING}`}>
                    {vehicle.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
                  {vehicle.productName}
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

          {/* Tracking Info */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">
              Tracking
            </h5>
            <div className="space-y-1.5 text-xs">
              {vehicle.carrier && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-zinc-400">Carrier</span>
                  <span className="text-gray-900 dark:text-white font-medium">{vehicle.carrier}</span>
                </div>
              )}
              {vehicle.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-zinc-400">Tracking #</span>
                  <span className="text-gray-900 dark:text-white font-mono text-[11px]">{vehicle.trackingNumber}</span>
                </div>
              )}
              {vehicle.shippingMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-zinc-400">Method</span>
                  <span className="text-gray-900 dark:text-white">{vehicle.shippingMethod}</span>
                </div>
              )}
              {vehicle.currentLocation && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-zinc-400">Location</span>
                  <span className="text-gray-900 dark:text-white">{vehicle.currentLocation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">
              Progress
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-400">Order Date</span>
                <span className="text-gray-900 dark:text-white">{formatDate(vehicle.orderDate)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-400">ETA</span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(vehicle.estimatedArrival ?? vehicle.expectedDate)}
                  <span className="text-gray-400 dark:text-zinc-500 ml-1 text-[10px]">
                    {daysUntil(vehicle.estimatedArrival ?? vehicle.expectedDate)}
                  </span>
                </span>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all"
                    style={{ width: `${progressPercent(vehicle.orderDate, vehicle.estimatedArrival ?? vehicle.expectedDate)}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500 tabular-nums">
                  {progressPercent(vehicle.orderDate, vehicle.estimatedArrival ?? vehicle.expectedDate)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500 dark:text-zinc-400">Quantity</span>
                <span className="text-gray-900 dark:text-white">{vehicle.quantity.toLocaleString()} {vehicle.unit}</span>
              </div>
            </div>
          </div>

          {/* Route Timeline */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">
              Route
            </h5>
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
                <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Live Events
                </h5>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 flex items-center gap-1"
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
              <div className="space-y-2">
                {vehicle.trackingEvents.map((evt) => (
                  <div key={evt.id} className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-600 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-700 dark:text-zinc-300 leading-tight">{evt.description}</p>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                        {evt.location && `${evt.location} · `}
                        {new Date(evt.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Factory Info */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">
              Origin Factory
            </h5>
            <p className="text-xs font-medium text-gray-900 dark:text-white">{vehicle.factoryName}</p>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">{vehicle.factoryLocation}</p>
            {vehicle.factoryContact.name && (
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">{vehicle.factoryContact.name}</p>
            )}
            {vehicle.factoryContact.email && (
              <a href={`mailto:${vehicle.factoryContact.email}`} className="text-[11px] text-blue-500 hover:text-blue-600 block mt-0.5">
                {vehicle.factoryContact.email}
              </a>
            )}
            {vehicle.factoryContact.phone && (
              <a href={`tel:${vehicle.factoryContact.phone}`} className="text-[11px] text-blue-500 hover:text-blue-600 block mt-0.5">
                {vehicle.factoryContact.phone}
              </a>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 py-3 bg-gray-50/50 dark:bg-zinc-800/30 flex items-center gap-3">
            <Link
              href={`/orders/${vehicle.orderId}`}
              className="flex-1 text-center text-xs font-medium py-2 px-3 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors"
            >
              View Order
              <ExternalLink className="h-3 w-3 inline ml-1 -mt-0.5" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -v ".next/types" | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add app/(dashboard)/dashboard/_components/manufacturer-map/shipment-panel.tsx
git commit -m "feat: add ShipmentPanel slide-in component for vehicle details"
```

---

## Task 6: Rewrite map-canvas.tsx — Vehicle-First Rendering

This is the core task. Replace the route-first rendering with vehicle-first rendering. Routes hidden by default, shown on vehicle click.

**Files:**
- Modify: `app/(dashboard)/dashboard/_components/manufacturer-map/map-canvas.tsx` (full rewrite)

**Step 1: Rewrite map-canvas.tsx**

The new version:
- Registers vehicle SVG icons on map load
- Renders vehicle symbols (rotated by bearing) instead of route lines
- On vehicle click: highlights vehicle (swap icon to selected variant), shows route + stops, calls `onSelectVehicle`
- On map background click: deselects vehicle, hides route
- Adds user geolocation blue pulsing dot
- Keeps factory point layers but hidden by default (no visible factory dots)
- Animated flowing dots along selected route (using `line-dasharray` animation)

Replace the ENTIRE content of `map-canvas.tsx` with:

```typescript
"use client";

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapStyle } from "./map-style";
import { vehiclesToGeoJSON, selectedRouteGeoJSON, getBounds } from "./map-utils";
import { registerVehicleIcons } from "./vehicle-icons";
import type { MapFactory, MapVehicle } from "./types";

// ─── Source & layer IDs ──────────────────────────────────────────────────────
const VEHICLES_SOURCE = "vehicles";
const VEHICLE_LAYER = "vehicle-icons";
const VEHICLE_LABELS = "vehicle-labels";
const SELECTED_ROUTE_SOURCE = "selected-route";
const SELECTED_STOPS_SOURCE = "selected-stops";
const SELECTED_ROUTE_LAYER = "selected-route-line";
const SELECTED_ROUTE_DASH = "selected-route-dash";
const SELECTED_STOPS_LAYER = "selected-stop-circles";
const SELECTED_STOPS_ICONS = "selected-stop-icons";
const USER_LOCATION_SOURCE = "user-location";
const USER_PULSE_LAYER = "user-location-pulse";
const USER_DOT_LAYER = "user-location-dot";

export type MapCanvasHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  fitToMarkers: () => void;
  easeTo: (lng: number, lat: number) => void;
};

type MapCanvasProps = {
  vehicles: MapVehicle[];
  factories: MapFactory[];
  theme: "light" | "dark";
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicle: MapVehicle | null) => void;
};

export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(
  function MapCanvas({ vehicles, factories, theme, selectedVehicleId, onSelectVehicle }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const vehiclesRef = useRef(vehicles);
    vehiclesRef.current = vehicles;
    const selectedRef = useRef(selectedVehicleId);
    selectedRef.current = selectedVehicleId;

    const fitToMarkers = useCallback(() => {
      const map = mapRef.current;
      if (!map || vehicles.length === 0) return;
      const bounds = getBounds(factories);
      if (!bounds) return;
      map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 800 });
    }, [factories, vehicles]);

    useImperativeHandle(ref, () => ({
      zoomIn: () => mapRef.current?.zoomIn({ duration: 300 }),
      zoomOut: () => mapRef.current?.zoomOut({ duration: 300 }),
      resetView: () => {
        mapRef.current?.flyTo({ center: [20, 20], zoom: 1.5, duration: 800 });
      },
      fitToMarkers,
      easeTo: (lng: number, lat: number) => {
        mapRef.current?.easeTo({
          center: [lng, lat],
          zoom: Math.max(mapRef.current.getZoom(), 5),
          duration: 600,
        });
      },
    }));

    // ─── Add vehicle layers ──────────────────────────────────────────────
    function addVehicleLayers(map: maplibregl.Map, vehicleData: MapVehicle[]) {
      const data = vehiclesToGeoJSON(vehicleData);

      if (map.getSource(VEHICLES_SOURCE)) {
        (map.getSource(VEHICLES_SOURCE) as maplibregl.GeoJSONSource).setData(data);
        return;
      }

      map.addSource(VEHICLES_SOURCE, { type: "geojson", data });

      // Vehicle icon symbols
      map.addLayer({
        id: VEHICLE_LAYER,
        type: "symbol",
        source: VEHICLES_SOURCE,
        layout: {
          "icon-image": [
            "case",
            ["==", ["get", "orderId"], selectedRef.current ?? ""],
            ["concat", "vehicle-", ["get", "vehicleType"], "-selected"],
            ["concat", "vehicle-", ["get", "vehicleType"], "-default"],
          ],
          "icon-size": 0.9,
          "icon-rotate": ["get", "bearing"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-padding": 2,
        },
      });

      // Order number labels
      map.addLayer({
        id: VEHICLE_LABELS,
        type: "symbol",
        source: VEHICLES_SOURCE,
        layout: {
          "text-field": ["get", "orderNumber"],
          "text-size": 9,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-offset": [0, 1.8],
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#475569",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      });
    }

    // ─── Show selected vehicle route ─────────────────────────────────────
    function showSelectedRoute(map: maplibregl.Map, vehicle: MapVehicle) {
      const { lines, stops } = selectedRouteGeoJSON(vehicle);

      // Route lines
      if (map.getSource(SELECTED_ROUTE_SOURCE)) {
        (map.getSource(SELECTED_ROUTE_SOURCE) as maplibregl.GeoJSONSource).setData(lines);
      } else {
        map.addSource(SELECTED_ROUTE_SOURCE, { type: "geojson", data: lines });
      }

      // Stop dots
      if (map.getSource(SELECTED_STOPS_SOURCE)) {
        (map.getSource(SELECTED_STOPS_SOURCE) as maplibregl.GeoJSONSource).setData(stops);
      } else {
        map.addSource(SELECTED_STOPS_SOURCE, { type: "geojson", data: stops });
      }

      // Magenta route line (solid base)
      if (!map.getLayer(SELECTED_ROUTE_LAYER)) {
        map.addLayer({
          id: SELECTED_ROUTE_LAYER,
          type: "line",
          source: SELECTED_ROUTE_SOURCE,
          paint: {
            "line-color": "#e11d9b",
            "line-width": 2.5,
            "line-opacity": 0.7,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        }, VEHICLE_LAYER); // render below vehicles
      }

      // Animated dash overlay
      if (!map.getLayer(SELECTED_ROUTE_DASH)) {
        map.addLayer({
          id: SELECTED_ROUTE_DASH,
          type: "line",
          source: SELECTED_ROUTE_SOURCE,
          paint: {
            "line-color": "#f472b6",
            "line-width": 2,
            "line-dasharray": [0, 4, 3],
            "line-opacity": 0.9,
          },
          layout: { "line-cap": "round", "line-join": "round" },
        }, VEHICLE_LAYER);
      }

      // Blue stop circles
      if (!map.getLayer(SELECTED_STOPS_LAYER)) {
        map.addLayer({
          id: SELECTED_STOPS_LAYER,
          type: "circle",
          source: SELECTED_STOPS_SOURCE,
          paint: {
            "circle-radius": 5,
            "circle-color": "#3b82f6",
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.9,
          },
        });
      }

      // Stop type labels (small, above dot)
      if (!map.getLayer(SELECTED_STOPS_ICONS)) {
        map.addLayer({
          id: SELECTED_STOPS_ICONS,
          type: "symbol",
          source: SELECTED_STOPS_SOURCE,
          layout: {
            "text-field": ["get", "icon"],
            "text-size": 10,
            "text-offset": [0, -1.3],
            "text-allow-overlap": true,
          },
        });
      }
    }

    // ─── Hide selected route ─────────────────────────────────────────────
    function hideSelectedRoute(map: maplibregl.Map) {
      for (const id of [SELECTED_ROUTE_LAYER, SELECTED_ROUTE_DASH, SELECTED_STOPS_LAYER, SELECTED_STOPS_ICONS]) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      if (map.getSource(SELECTED_ROUTE_SOURCE)) map.removeSource(SELECTED_ROUTE_SOURCE);
      if (map.getSource(SELECTED_STOPS_SOURCE)) map.removeSource(SELECTED_STOPS_SOURCE);
    }

    // ─── User geolocation ────────────────────────────────────────────────
    function addUserLocation(map: maplibregl.Map) {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { longitude, latitude } = pos.coords;
          const data: GeoJSON.FeatureCollection = {
            type: "FeatureCollection",
            features: [{
              type: "Feature",
              geometry: { type: "Point", coordinates: [longitude, latitude] },
              properties: {},
            }],
          };

          if (map.getSource(USER_LOCATION_SOURCE)) {
            (map.getSource(USER_LOCATION_SOURCE) as maplibregl.GeoJSONSource).setData(data);
            return;
          }

          map.addSource(USER_LOCATION_SOURCE, { type: "geojson", data });

          // Pulsing ring
          map.addLayer({
            id: USER_PULSE_LAYER,
            type: "circle",
            source: USER_LOCATION_SOURCE,
            paint: {
              "circle-radius": 14,
              "circle-color": "#3b82f6",
              "circle-opacity": 0.15,
              "circle-stroke-width": 0,
            },
          });

          // Solid dot
          map.addLayer({
            id: USER_DOT_LAYER,
            type: "circle",
            source: USER_LOCATION_SOURCE,
            paint: {
              "circle-radius": 5,
              "circle-color": "#3b82f6",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });
        },
        () => {
          // Permission denied or error — silently skip
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }

    // ─── Remove all custom layers ────────────────────────────────────────
    function removeAllLayers(map: maplibregl.Map) {
      const allLayers = [
        VEHICLE_LAYER, VEHICLE_LABELS,
        SELECTED_ROUTE_LAYER, SELECTED_ROUTE_DASH, SELECTED_STOPS_LAYER, SELECTED_STOPS_ICONS,
        USER_PULSE_LAYER, USER_DOT_LAYER,
      ];
      for (const id of allLayers) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      const allSources = [
        VEHICLES_SOURCE, SELECTED_ROUTE_SOURCE, SELECTED_STOPS_SOURCE, USER_LOCATION_SOURCE,
      ];
      for (const id of allSources) {
        if (map.getSource(id)) map.removeSource(id);
      }
    }

    // ─── Initialize map ──────────────────────────────────────────────────
    useEffect(() => {
      if (!containerRef.current) return;

      let map: maplibregl.Map;
      try {
        map = new maplibregl.Map({
          container: containerRef.current,
          style: getMapStyle(theme),
          center: [20, 20],
          zoom: 1.5,
          attributionControl: false,
        });
      } catch {
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#71717a;font-size:13px;">Map requires WebGL support</div>';
        }
        return;
      }

      mapRef.current = map;

      map.on("load", async () => {
        await registerVehicleIcons(map);
        addVehicleLayers(map, vehiclesRef.current);
        addUserLocation(map);

        // Fit to vehicle positions
        if (vehiclesRef.current.length > 0) {
          const coords = vehiclesRef.current.map((v) => [v.lng, v.lat] as [number, number]);
          const bounds = new maplibregl.LngLatBounds(coords[0], coords[0]);
          coords.forEach((c) => bounds.extend(c));
          map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 0 });
        } else {
          const bounds = getBounds(factories);
          if (bounds) map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 0 });
        }
      });

      // Click vehicle → select
      map.on("click", VEHICLE_LAYER, (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [VEHICLE_LAYER] });
        if (!features.length) return;

        const orderId = features[0].properties.orderId;
        const vehicle = vehiclesRef.current.find((v) => v.orderId === orderId);
        if (vehicle) {
          onSelectVehicle(vehicle);
        }

        e.originalEvent.stopPropagation();
      });

      // Click background → deselect
      map.on("click", (e) => {
        const vehicleHits = map.queryRenderedFeatures(e.point, { layers: [VEHICLE_LAYER] });
        const stopHits = map.getLayer(SELECTED_STOPS_LAYER)
          ? map.queryRenderedFeatures(e.point, { layers: [SELECTED_STOPS_LAYER] })
          : [];
        if (vehicleHits.length === 0 && stopHits.length === 0) {
          onSelectVehicle(null);
        }
      });

      // Cursor changes
      map.on("mouseenter", VEHICLE_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", VEHICLE_LAYER, () => { map.getCanvas().style.cursor = ""; });

      // Animate the dash offset for flowing dots effect
      let dashStep = 0;
      function animateDash() {
        dashStep = (dashStep + 1) % 24;
        if (map.getLayer(SELECTED_ROUTE_DASH)) {
          const t = dashStep / 24;
          map.setPaintProperty(SELECTED_ROUTE_DASH, "line-dasharray", [0, 4 + t * 3, 3 - t * 3 > 0 ? 3 - t * 3 : 0.1]);
        }
        requestAnimationFrame(animateDash);
      }
      requestAnimationFrame(animateDash);

      return () => {
        mapRef.current = null;
        map.remove();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Theme changes ───────────────────────────────────────────────────
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      map.setStyle(getMapStyle(theme));
      map.once("style.load", async () => {
        await registerVehicleIcons(map);
        addVehicleLayers(map, vehiclesRef.current);
        addUserLocation(map);

        if (selectedRef.current) {
          const v = vehiclesRef.current.find((v) => v.orderId === selectedRef.current);
          if (v) showSelectedRoute(map, v);
        }
      });
    }, [theme]);

    // ─── Update vehicles data ────────────────────────────────────────────
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      const data = vehiclesToGeoJSON(vehicles);
      if (map.getSource(VEHICLES_SOURCE)) {
        (map.getSource(VEHICLES_SOURCE) as maplibregl.GeoJSONSource).setData(data);
      }

      // Update icon expressions for selection state
      if (map.getLayer(VEHICLE_LAYER)) {
        map.setLayoutProperty(VEHICLE_LAYER, "icon-image", [
          "case",
          ["==", ["get", "orderId"], selectedVehicleId ?? ""],
          ["concat", "vehicle-", ["get", "vehicleType"], "-selected"],
          ["concat", "vehicle-", ["get", "vehicleType"], "-default"],
        ]);
      }
    }, [vehicles, selectedVehicleId]);

    // ─── Show/hide route on selection change ─────────────────────────────
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      hideSelectedRoute(map);

      if (selectedVehicleId) {
        const vehicle = vehicles.find((v) => v.orderId === selectedVehicleId);
        if (vehicle) {
          showSelectedRoute(map, vehicle);
          // Pan to vehicle
          map.easeTo({
            center: [vehicle.lng, vehicle.lat],
            zoom: Math.max(map.getZoom(), 4),
            duration: 600,
          });
        }
      }
    }, [selectedVehicleId, vehicles]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full min-h-[320px] rounded-lg overflow-hidden"
      />
    );
  }
);
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -v ".next/types" | head -20`
Expected: No errors (may need minor fixes)

**Step 3: Commit**

```bash
git add app/(dashboard)/dashboard/_components/manufacturer-map/map-canvas.tsx
git commit -m "feat: rewrite map-canvas for FlightRadar-style vehicle rendering"
```

---

## Task 7: Update manufacturer-map.tsx — Fetch Vehicles & Wire Up

Update the parent component to fetch from the new vehicles API and pass data to the rewritten MapCanvas + ShipmentPanel.

**Files:**
- Modify: `app/(dashboard)/dashboard/_components/manufacturer-map/manufacturer-map.tsx`

**Step 1: Update manufacturer-map.tsx**

Key changes:
- Fetch `/api/dashboard/map-vehicles` instead of (or alongside) factory-locations
- Import and use `ordersToVehicles` from `vehicle-utils.ts`
- Replace `routesEnabled` toggle with vehicle selection state
- Add `ShipmentPanel` component
- Remove `MapFactoryDrawer` (replaced by `ShipmentPanel`)
- Remove `liveShipments` state (vehicles replace this)
- Update `MapCanvas` props

Replace the import block and component body. The full rewrite:

```typescript
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Map, RefreshCw, Globe, Factory, ShieldCheck, Activity, Ship } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { AnimatedNumber } from "@/components/animated-number";
import { MapControls } from "./map-controls";
import { MapLegend } from "./map-legend";
import { ShipmentPanel } from "./shipment-panel";
import { MapSearch } from "./map-search";
import { ordersToVehicles } from "./vehicle-utils";
import type { MapFactory, MapStats, MapVehicle } from "./types";
import type { MapCanvasHandle } from "./map-canvas";

const MapCanvas = dynamic(
  () => import("./map-canvas").then((m) => m.MapCanvas),
  { ssr: false }
);

export function ManufacturerMap() {
  const { resolvedTheme } = useTheme();
  const mapTheme = resolvedTheme === "dark" ? "dark" : "light";
  const mapRef = useRef<MapCanvasHandle | null>(null);

  const [factories, setFactories] = useState<MapFactory[]>([]);
  const [vehicles, setVehicles] = useState<MapVehicle[]>([]);
  const [stats, setStats] = useState<MapStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<MapVehicle | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [locRes, vehRes] = await Promise.all([
        fetch("/api/dashboard/factory-locations"),
        fetch("/api/dashboard/map-vehicles"),
      ]);
      const locData = await locRes.json();
      if (locData.success) {
        setFactories(locData.data.factories);
        setStats(locData.data.stats);
      }
      const vehData = await vehRes.json();
      if (vehData.success) {
        setVehicles(ordersToVehicles(vehData.data));
      }
    } catch (error) {
      console.error("Failed to fetch map data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredVehicles = useMemo(() => {
    if (!searchQuery) return vehicles;
    const q = searchQuery.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.orderNumber.toLowerCase().includes(q) ||
        v.productName.toLowerCase().includes(q) ||
        v.factoryName.toLowerCase().includes(q) ||
        (v.carrier ?? "").toLowerCase().includes(q)
    );
  }, [vehicles, searchQuery]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Map className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
            Manufacturer Network
          </h3>
        </div>
        <div className="flex items-center justify-center h-[380px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF4D15]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Summary Rail */}
        <div className="lg:w-56 flex-shrink-0 p-5 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-5">
            <Map className="h-4 w-4 text-[#FF4D15]" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
              Manufacturer Network
            </h3>
          </div>

          <div className="space-y-4">
            <StatItem
              icon={<Factory className="h-3.5 w-3.5" />}
              label="Manufacturers"
              value={stats?.totalManufacturers ?? 0}
            />
            <StatItem
              icon={<Globe className="h-3.5 w-3.5" />}
              label="Countries"
              value={stats?.countriesCovered ?? 0}
            />
            <StatItem
              icon={<Ship className="h-3.5 w-3.5" />}
              label="Active Shipments"
              value={vehicles.length}
            />
            <StatItem
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Verified"
              value={stats?.verifiedPercent ?? 0}
              suffix="%"
            />
          </div>

          {stats?.lastUpdated && (
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-5">
              Updated {new Date(stats.lastUpdated).toLocaleTimeString()}
            </p>
          )}

          <button
            onClick={() => {
              setIsLoading(true);
              fetchData();
            }}
            className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative min-h-[420px]">
          <MapCanvas
            ref={mapRef}
            vehicles={filteredVehicles}
            factories={factories}
            theme={mapTheme}
            selectedVehicleId={selectedVehicle?.orderId ?? null}
            onSelectVehicle={(v) => {
              setSelectedVehicle(v);
              if (v) {
                mapRef.current?.easeTo(v.lng, v.lat);
              }
            }}
          />

          <MapSearch value={searchQuery} onChange={setSearchQuery} />

          <MapLegend />

          <ShipmentPanel
            vehicle={selectedVehicle}
            onClose={() => setSelectedVehicle(null)}
          />
        </div>
      </div>
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-gray-400 dark:text-zinc-500 mb-1">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-lg font-semibold text-gray-900 dark:text-white">
        <AnimatedNumber value={value} />
        {suffix && <span className="text-sm text-gray-400 dark:text-zinc-500 ml-0.5">{suffix}</span>}
      </p>
    </div>
  );
}
```

**Step 2: Update MapControls — remove routes toggle, keep zoom/reset**

In `map-controls.tsx`, remove the `routesEnabled`/`onToggleRoutes` prop and the Route toggle button. Also remove `clusteringEnabled`/`onToggleClustering` and `verifiedOnly`/`onToggleVerifiedOnly` since factories are hidden.

Simplify to just zoom controls:

```typescript
"use client";

import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import type { MapCanvasHandle } from "./map-canvas";

type MapControlsProps = {
  mapRef: React.RefObject<MapCanvasHandle | null>;
};

const btnClass =
  "p-1.5 rounded bg-white/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors";

export function MapControls({ mapRef }: MapControlsProps) {
  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
      <button onClick={() => mapRef.current?.zoomIn()} className={btnClass} title="Zoom in">
        <ZoomIn className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
      </button>
      <button onClick={() => mapRef.current?.zoomOut()} className={btnClass} title="Zoom out">
        <ZoomOut className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
      </button>
      <button onClick={() => mapRef.current?.resetView()} className={btnClass} title="Reset view">
        <RotateCcw className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
      </button>
      <button onClick={() => mapRef.current?.fitToMarkers()} className={btnClass} title="Fit to markers">
        <Maximize2 className="h-3.5 w-3.5 text-gray-600 dark:text-zinc-400" />
      </button>
    </div>
  );
}
```

**Step 3: Update MapLegend for new design**

```typescript
"use client";

export function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-10 bg-white/90 dark:bg-zinc-900/90 border border-gray-200/60 dark:border-zinc-700/60 rounded-lg px-3 py-2 backdrop-blur-sm">
      <p className="text-[10px] font-medium text-gray-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
        Vehicles
      </p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px]">🚢</span>
          <span className="text-[11px] text-gray-600 dark:text-zinc-300">Ocean freight</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]">✈️</span>
          <span className="text-[11px] text-gray-600 dark:text-zinc-300">Air freight</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]">🚛</span>
          <span className="text-[11px] text-gray-600 dark:text-zinc-300">Road freight</span>
        </div>
        <div className="h-px bg-gray-200 dark:bg-zinc-700 my-1" />
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[11px] text-gray-600 dark:text-zinc-300">Your location</span>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Update stress test**

In `scripts/stress-test.js`, add:
```javascript
{ name: 'Map Vehicles API', path: '/api/dashboard/map-vehicles', expectedStatus: [200, 307, 401] },
```

**Step 5: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep -v ".next/types" | head -20`
Expected: No errors

**Step 6: Commit**

```bash
git add app/(dashboard)/dashboard/_components/manufacturer-map/manufacturer-map.tsx \
       app/(dashboard)/dashboard/_components/manufacturer-map/map-controls.tsx \
       app/(dashboard)/dashboard/_components/manufacturer-map/map-legend.tsx \
       scripts/stress-test.js
git commit -m "feat: wire up FlightRadar map — vehicles, panel, simplified controls"
```

---

## Task 8: Stop Popup — Rich Card Style

Update the stop circle click handler to show a rich popup matching dashboard card style.

**Files:**
- Modify: `app/(dashboard)/dashboard/_components/manufacturer-map/map-canvas.tsx`

**Step 1: Add stop circle click handler**

In the `map.on("load")` callback, AFTER the vehicle click handler, add:

```typescript
// Click stop dot → show rich popup
map.on("click", SELECTED_STOPS_LAYER, (e) => {
  const features = map.queryRenderedFeatures(e.point, { layers: [SELECTED_STOPS_LAYER] });
  if (!features.length) return;

  const props = features[0].properties;
  const geometry = features[0].geometry;
  if (geometry.type !== "Point") return;

  const [lng, lat] = geometry.coordinates;
  const selectedV = vehiclesRef.current.find((v) => v.orderId === selectedRef.current);

  new maplibregl.Popup({
    closeButton: true,
    closeOnClick: true,
    maxWidth: "320px",
    className: "route-stop-popup",
  })
    .setLngLat([lng, lat])
    .setHTML(`
      <div style="font-family:system-ui,sans-serif;padding:6px 2px;">
        <div style="font-size:14px;font-weight:600;color:#f1f5f9;margin-bottom:4px;">${props.name}</div>
        <p style="font-size:11px;line-height:1.5;color:#94a3b8;margin:0 0 8px;">${props.description}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:10px;margin-bottom:6px;">
          <div style="color:#64748b;">Type</div>
          <div style="color:#cbd5e1;text-transform:uppercase;font-weight:600;">${props.type}</div>
          <div style="color:#64748b;">Coordinates</div>
          <div style="color:#cbd5e1;font-family:monospace;">${lat.toFixed(2)}°, ${lng.toFixed(2)}°</div>
          ${selectedV?.trackingNumber ? `
          <div style="color:#64748b;">Tracking</div>
          <div style="color:#cbd5e1;font-family:monospace;font-size:9px;">${selectedV.trackingNumber}</div>
          ` : ""}
          ${selectedV?.carrier ? `
          <div style="color:#64748b;">Carrier</div>
          <div style="color:#cbd5e1;">${selectedV.carrier}</div>
          ` : ""}
          ${selectedV?.estimatedArrival ? `
          <div style="color:#64748b;">ETA</div>
          <div style="color:#cbd5e1;">${new Date(selectedV.estimatedArrival).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
          ` : ""}
        </div>
      </div>
    `)
    .addTo(map);

  e.originalEvent.stopPropagation();
});

map.on("mouseenter", SELECTED_STOPS_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
map.on("mouseleave", SELECTED_STOPS_LAYER, () => { map.getCanvas().style.cursor = ""; });
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | grep -v ".next/types" | head -20`

**Step 3: Commit**

```bash
git add app/(dashboard)/dashboard/_components/manufacturer-map/map-canvas.tsx
git commit -m "feat: add rich stop popup with tracking info and coordinates"
```

---

## Task 9: Final Verification & Cleanup

**Step 1: Remove unused files**

The old `MapFactoryDrawer` is no longer imported by `manufacturer-map.tsx`. It can stay for now (still used if we want to show factory details later) — but verify it doesn't cause import errors.

**Step 2: Full type check**

Run: `npx tsc --noEmit 2>&1 | grep -v ".next/types"`
Expected: No errors

**Step 3: Run stress test**

Run: `node scripts/stress-test.js`
Expected: All endpoints pass

**Step 4: Manual testing checklist**

Open `http://localhost:3000/dashboard` and verify:
- [ ] Vehicle icons (ship/plane/truck silhouettes) appear at positions along routes
- [ ] Order number labels appear below each vehicle
- [ ] Clicking a vehicle: icon turns red, magenta route line appears, blue stop dots appear
- [ ] Slide-in panel opens from left with full shipment details
- [ ] Clicking a blue stop dot shows rich popup with name, description, coordinates, tracking info
- [ ] Clicking map background deselects vehicle, hides route and panel
- [ ] Blue pulsing dot at user location (after allowing geolocation)
- [ ] No factory dots visible by default
- [ ] Zoom/reset controls work
- [ ] Dark mode and light mode both work
- [ ] Search filters vehicles by order number, product, factory, carrier

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: FlightRadar map redesign — final cleanup and verification"
```

---

## Files Summary

| File | Action |
|------|--------|
| `app/api/dashboard/map-vehicles/route.ts` | CREATE — API for all orders with factory+tracking data |
| `manufacturer-map/types.ts` | MODIFY — add `MapVehicle` type |
| `manufacturer-map/vehicle-utils.ts` | CREATE — position logic, `ordersToVehicles()` |
| `manufacturer-map/vehicle-icons.ts` | CREATE — SVG icons for ship/plane/truck |
| `manufacturer-map/map-utils.ts` | MODIFY — add `vehiclesToGeoJSON`, `selectedRouteGeoJSON` |
| `manufacturer-map/shipment-panel.tsx` | CREATE — slide-in detail panel |
| `manufacturer-map/map-canvas.tsx` | REWRITE — vehicle-first rendering |
| `manufacturer-map/manufacturer-map.tsx` | REWRITE — fetch vehicles, wire up panel |
| `manufacturer-map/map-controls.tsx` | SIMPLIFY — zoom only |
| `manufacturer-map/map-legend.tsx` | REWRITE — vehicle legend |
| `scripts/stress-test.js` | MODIFY — add map-vehicles endpoint |

## Execution Order

1. Task 1 — API endpoint
2. Task 2 — Types + vehicle positioning
3. Task 3 — SVG vehicle icons
4. Task 4 — GeoJSON generators
5. Task 5 — Shipment detail panel
6. Task 6 — Map canvas rewrite
7. Task 7 — Parent component + controls + legend
8. Task 8 — Rich stop popups
9. Task 9 — Verification & cleanup
