import type { MapFactory } from "./types";
import {
  DESTINATION_COORDS,
  generateGreatCircleArc,
  detectTransportMethod,
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
 * Generate GeoJSON LineStrings for shipping routes from factories to destination.
 */
export function factoriesToRoutesGeoJSON(factories: MapFactory[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const f of factories) {
    if (f.orderCount === 0) continue;

    const start: [number, number] = [f.lng, f.lat];
    const arc = generateGreatCircleArc(start, DESTINATION_COORDS);
    const transportMethod = detectTransportMethod(f.lng, f.lat);
    const routeColor = getRouteColor(f.worstOrderStatus);
    const routeWidth = getRouteWidth(f.totalOrderQuantity);

    features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: arc,
      },
      properties: {
        factoryId: f.id,
        routeStatus: f.worstOrderStatus ?? "PENDING",
        routeColor,
        routeWidth,
        totalQuantity: f.totalOrderQuantity,
        transportMethod,
      },
    });
  }

  return { type: "FeatureCollection", features };
}

/**
 * Generate GeoJSON points at the midpoint of each shipping arc for transport icons.
 */
export function routeMidpointsGeoJSON(factories: MapFactory[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const f of factories) {
    if (f.orderCount === 0) continue;

    const start: [number, number] = [f.lng, f.lat];
    const arc = generateGreatCircleArc(start, DESTINATION_COORDS);
    const midIdx = Math.floor(arc.length / 2);
    const midpoint = arc[midIdx];
    const transportMethod = detectTransportMethod(f.lng, f.lat);

    let icon: string;
    switch (transportMethod) {
      case "sea":
        icon = "🚢";
        break;
      case "air":
        icon = "✈️";
        break;
      case "road":
        icon = "🚛";
        break;
    }

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: midpoint,
      },
      properties: {
        factoryId: f.id,
        transportMethod,
        icon,
      },
    });
  }

  return { type: "FeatureCollection", features };
}
