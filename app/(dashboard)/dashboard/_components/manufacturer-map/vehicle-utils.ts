import { buildShippingRoute, type ShippingRoute } from "./arc-utils";
import type { MapVehicle } from "./types";

function getVehicleType(shippingMethod: string | null, route: ShippingRoute): "ship" | "plane" | "truck" {
  if (shippingMethod === "AIR") return "plane";
  if (shippingMethod === "ROAD" || shippingMethod === "RAIL") return "truck";
  const hasShip = route.segments.some((s) => s.transportMethod === "ship");
  return hasShip ? "ship" : "truck";
}

function getVehiclePosition(
  order: any,
  route: ShippingRoute
): { coords: [number, number]; bearing: number } {
  if (order.currentLat != null && order.currentLng != null) {
    return { coords: [order.currentLng, order.currentLat], bearing: 0 };
  }

  const stops = route.stops;
  if (stops.length === 0) {
    return { coords: [order.factory.longitude, order.factory.latitude], bearing: 0 };
  }

  let stopIndex = 0;
  switch (order.status) {
    case "PENDING":
    case "IN_PROGRESS":
      stopIndex = 0;
      break;
    case "SHIPPED":
      stopIndex = Math.min(1, stops.length - 1);
      break;
    case "IN_TRANSIT":
      stopIndex = Math.floor(stops.length / 2);
      break;
    case "CUSTOMS": {
      const harborIdx = stops.findIndex((s) => s.type === "harbor");
      stopIndex = harborIdx >= 0 ? harborIdx : stops.length - 2;
      break;
    }
    case "DELAYED":
    case "DISRUPTED":
      stopIndex = Math.min(1, stops.length - 1);
      break;
    default:
      stopIndex = 0;
  }

  stopIndex = Math.max(0, Math.min(stopIndex, stops.length - 1));
  const stop = stops[stopIndex];

  let bearing = 0;
  if (stopIndex < stops.length - 1) {
    const next = stops[stopIndex + 1];
    bearing = calculateBearing(stop.coords, next.coords);
  }

  return { coords: stop.coords, bearing };
}

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
