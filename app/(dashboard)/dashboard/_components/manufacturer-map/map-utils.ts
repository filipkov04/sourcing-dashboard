import type { MapFactory } from "./types";

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
