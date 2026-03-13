import type { MapFactory, LiveShipment } from "./types";
import {
  buildShippingRoute,
  getRouteColor,
  getRouteWidth,
} from "./arc-utils";

export function factoriesToGeoJSON(factories: MapFactory[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: factories.map((f) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [f.lng, f.lat],
      },
      properties: {
        id: f.id,
        name: f.name,
        city: f.city,
        country: f.country,
        orderCount: f.orderCount,
        verificationStatus: f.verificationStatus,
        riskLevel: f.riskLevel,
        isPreferred: f.isPreferred,
        categories: f.categories.join(", "),
        capabilities: f.capabilities.join(", "),
        moqMin: f.moqMin,
        leadTimeDays: f.leadTimeDays,
        reliabilityScore: f.reliabilityScore,
        lastQcAt: f.lastQcAt,
      },
    })),
  };
}

export function getBounds(
  factories: MapFactory[]
): [[number, number], [number, number]] | null {
  if (factories.length === 0) return null;

  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;

  for (const f of factories) {
    if (f.lng < minLng) minLng = f.lng;
    if (f.lat < minLat) minLat = f.lat;
    if (f.lng > maxLng) maxLng = f.lng;
    if (f.lat > maxLat) maxLat = f.lat;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/**
 * Generate GeoJSON LineStrings for realistic multi-segment shipping routes.
 * Each factory produces multiple features: truck segments + ship segment.
 */
export function factoriesToRoutesGeoJSON(factories: MapFactory[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const f of factories) {
    if (f.orderCount === 0) continue;

    const route = buildShippingRoute(f.lng, f.lat);
    const routeWidth = getRouteWidth(f.totalOrderQuantity);

    for (const segment of route.segments) {
      if (segment.coordinates.length < 2) continue;

      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: segment.coordinates,
        },
        properties: {
          factoryId: f.id,
          routeStatus: f.worstOrderStatus ?? "PENDING",
          routeWidth,
          totalQuantity: f.totalOrderQuantity,
          transportMethod: segment.transportMethod,
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}

/**
 * Generate GeoJSON points for transport method icons.
 * Places ship icon at midpoint of sea segments, truck icon at start of truck-to-destination segments.
 */
export function routeMidpointsGeoJSON(factories: MapFactory[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const f of factories) {
    if (f.orderCount === 0) continue;

    const route = buildShippingRoute(f.lng, f.lat);

    for (const segment of route.segments) {
      if (segment.coordinates.length < 2) continue;

      const midIdx = Math.floor(segment.coordinates.length / 2);
      const midpoint = segment.coordinates[midIdx];

      const icon = segment.transportMethod === "ship" ? "🚢" : "🚛";

      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: midpoint,
        },
        properties: {
          factoryId: f.id,
          transportMethod: segment.transportMethod,
          icon,
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}

/**
 * Generate GeoJSON points for route stops (factory, port, strait, canal, harbor, hub, destination).
 * Each stop has a name, description, type, and icon for popup display.
 */
export function routeStopsGeoJSON(factories: MapFactory[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  const seen = new Set<string>();

  for (const f of factories) {
    if (f.orderCount === 0) continue;

    const route = buildShippingRoute(f.lng, f.lat);

    for (const stop of route.stops) {
      const key = stop.type === "factory"
        ? `${f.id}-${stop.coords[0]}-${stop.coords[1]}`
        : `${stop.coords[0]}-${stop.coords[1]}`;

      if (seen.has(key)) continue;
      seen.add(key);

      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: stop.coords,
        },
        properties: {
          name: stop.name,
          description: stop.description,
          stopType: stop.type,
          icon: stop.icon,
          factoryId: f.id,
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}

/**
 * Generate GeoJSON points for live tracked shipments.
 * Each shipment is a point at the current GPS position.
 */
export function liveShipmentsGeoJSON(shipments: LiveShipment[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: shipments.map((s) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [s.currentLng, s.currentLat],
      },
      properties: {
        orderId: s.orderId,
        orderNumber: s.orderNumber,
        trackingNumber: s.trackingNumber,
        carrier: s.carrier ?? "",
        currentLocation: s.currentLocation ?? "",
        trackingStatus: s.trackingStatus ?? "IN_TRANSIT",
        estimatedArrival: s.estimatedArrival ?? "",
        factoryId: s.factoryId,
      },
    })),
  };
}
