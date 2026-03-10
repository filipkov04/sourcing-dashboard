// Destination: Suché Miesto 20, Chorvatský Grob, Bratislava, Slovakia
export const DESTINATION_COORDS: [number, number] = [17.2895, 48.2252]; // [lng, lat]

/**
 * Generate a great-circle arc between two points using spherical interpolation.
 * Returns an array of [lng, lat] coordinate pairs.
 */
export function generateGreatCircleArc(
  start: [number, number], // [lng, lat]
  end: [number, number],   // [lng, lat]
  numPoints: number = 64
): [number, number][] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(start[1]);
  const lng1 = toRad(start[0]);
  const lat2 = toRad(end[1]);
  const lng2 = toRad(end[0]);

  // Angular distance between points
  const d = Math.acos(
    Math.sin(lat1) * Math.sin(lat2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)
  );

  // If points are nearly coincident, return straight line
  if (d < 0.0001) {
    return [start, end];
  }

  const points: [number, number][] = [];

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lng = Math.atan2(y, x);

    points.push([toDeg(lng), toDeg(lat)]);
  }

  return points;
}

/**
 * Haversine distance in km between two [lng, lat] points.
 */
function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Rough continent buckets by longitude/latitude ranges
function getContinent(lat: number, lng: number): string {
  if (lat > 35 && lng > -25 && lng < 45) return "europe";
  if (lat > 10 && lng > 45 && lng < 145) return "asia";
  if (lat < 10 && lat > -40 && lng > 95 && lng < 180) return "oceania";
  if (lat > 15 && lng > -170 && lng < -50) return "north_america";
  if (lat < 15 && lng > -90 && lng < -30) return "south_america";
  if (lat < 35 && lng > -20 && lng < 55) return "africa";
  return "other";
}

/**
 * Detect likely transport method based on geography.
 */
export function detectTransportMethod(
  factoryLng: number,
  factoryLat: number
): "road" | "air" | "sea" {
  const factoryPoint: [number, number] = [factoryLng, factoryLat];
  const distance = haversineKm(factoryPoint, DESTINATION_COORDS);
  const factoryContinent = getContinent(factoryLat, factoryLng);
  const destContinent = getContinent(DESTINATION_COORDS[1], DESTINATION_COORDS[0]);

  if (factoryContinent !== destContinent) {
    return "sea";
  }

  if (factoryContinent === "europe" && distance < 2000) {
    return "road";
  }

  return "air";
}

/**
 * Get route color by worst order status.
 */
export function getRouteColor(worstStatus: string | null): string {
  switch (worstStatus) {
    case "DISRUPTED":
      return "#ef4444"; // red
    case "DELAYED":
      return "#f59e0b"; // orange
    default:
      return "#22c55e"; // green
  }
}

/**
 * Get route line width scaled by total quantity.
 */
export function getRouteWidth(totalQuantity: number): number {
  if (totalQuantity <= 100) return 1.5;
  if (totalQuantity <= 1000) return 2;
  if (totalQuantity <= 5000) return 3;
  return 4;
}
