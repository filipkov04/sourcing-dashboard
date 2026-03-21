import type { MapVehicle } from "./types";

/**
 * Determine vehicle type from shipping method or carrier name.
 */
function getVehicleType(order: any): "ship" | "plane" | "truck" {
  if (order.shippingMethod === "AIR") return "plane";
  if (order.shippingMethod === "OCEAN") return "ship";
  if (order.shippingMethod === "ROAD" || order.shippingMethod === "RAIL") return "truck";

  // Infer from carrier name
  const carrier = (order.carrier ?? "").toLowerCase();
  if (carrier.includes("maersk") || carrier.includes("cma") || carrier.includes("msc") || carrier.includes("cosco") || carrier.includes("evergreen")) return "ship";
  if (carrier.includes("fedex") || carrier.includes("ups") || carrier.includes("dhl") || carrier.includes("tnt")) return "truck";
  if (carrier.includes("yunexpress") || carrier.includes("yanwen")) return "plane";

  // Infer from tracking events — if any mention "airport" or "flight"
  const events = order.trackingEvents ?? [];
  for (const e of events) {
    const desc = (e.description ?? "").toLowerCase();
    if (desc.includes("airport") || desc.includes("flight") || desc.includes("airline")) return "plane";
    if (desc.includes("port") || desc.includes("vessel") || desc.includes("ship")) return "ship";
  }

  return "truck";
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
 * Build route stops from real tracking events (oldest → newest).
 * Each unique location becomes a stop on the map.
 */
function buildRouteFromEvents(
  order: any,
  factoryCoords: [number, number]
): { stops: MapVehicle["routeStops"]; segments: MapVehicle["routeSegments"] } {
  const events = [...(order.trackingEvents ?? [])].sort(
    (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (events.length === 0) {
    // No events — just show factory as single stop
    return {
      stops: [
        {
          name: order.factory?.name ?? "Factory",
          coords: factoryCoords,
          type: "factory",
          description: "Order origin",
          icon: "🏭",
        },
      ],
      segments: [],
    };
  }

  // Deduplicate by location string
  const seen = new Set<string>();
  const stops: MapVehicle["routeStops"] = [];

  // Always start with factory
  stops.push({
    name: order.factory?.name ?? "Factory",
    coords: factoryCoords,
    type: "factory",
    description: "Order origin",
    icon: "🏭",
  });
  seen.add("factory");

  for (const evt of events) {
    const loc = evt.location;
    if (!loc || seen.has(loc)) continue;
    seen.add(loc);

    // Determine icon from event description
    const desc = (evt.description ?? "").toLowerCase();
    let icon = "📍";
    let type = "checkpoint";
    if (desc.includes("airport")) { icon = "✈️"; type = "airport"; }
    else if (desc.includes("port") || desc.includes("vessel")) { icon = "🚢"; type = "port"; }
    else if (desc.includes("customs") || desc.includes("clearance")) { icon = "🛃"; type = "customs"; }
    else if (desc.includes("delivered") || desc.includes("picked up")) { icon = "🏁"; type = "destination"; }
    else if (desc.includes("sort") || desc.includes("hub") || desc.includes("facility")) { icon = "📦"; type = "hub"; }
    else if (desc.includes("transit")) { icon = "🚛"; type = "transit"; }

    stops.push({
      name: loc,
      coords: factoryCoords, // We don't have per-event coords — position will be interpolated
      type,
      description: evt.description,
      icon,
    });
  }

  // No real coordinate-based segments since tracking events don't have lat/lng per event
  return { stops, segments: [] };
}

/**
 * Get vehicle position — uses only real coordinates from 17Track.
 * Returns null if 17Track provides no coordinates (vehicle won't appear on map).
 */
function getVehiclePosition(
  order: any,
  factoryCoords: [number, number]
): { coords: [number, number]; bearing: number } | null {
  // 1. Real GPS position from 17Track (set by tracking adapter from misc_info or latest event)
  if (order.currentLat != null && order.currentLng != null) {
    const bearing = calculateBearing(factoryCoords, [order.currentLng, order.currentLat]);
    return { coords: [order.currentLng, order.currentLat], bearing };
  }

  // 2. Check tracking events for per-event coordinates from 17Track
  const events = order.trackingEvents ?? [];
  for (const evt of events) {
    if (evt.latitude != null && evt.longitude != null) {
      const coords: [number, number] = [evt.longitude, evt.latitude];
      const bearing = calculateBearing(factoryCoords, coords);
      return { coords, bearing };
    }
  }

  // 3. No real coordinates — don't show on map (better than showing wrong location)
  return null;
}

/**
 * Transform raw API order data into MapVehicle objects.
 * Uses real 17Track data — no hardcoded routes.
 */
export function ordersToVehicles(orders: any[]): MapVehicle[] {
  return orders
    .filter((o) => o.factory?.latitude != null && o.factory?.longitude != null)
    .flatMap((order) => {
      const factoryCoords: [number, number] = [order.factory.longitude, order.factory.latitude];
      const vehicleType = getVehicleType(order);
      const position = getVehiclePosition(order, factoryCoords);

      // No real coordinates from 17Track — skip this order on the map
      if (!position) return [];

      const { coords, bearing } = position;
      const { stops, segments } = buildRouteFromEvents(order, factoryCoords);

      return [{
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
        expectedStartDate: order.expectedStartDate,
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
        routeStops: stops,
        routeSegments: segments,
      }];
    });
}
