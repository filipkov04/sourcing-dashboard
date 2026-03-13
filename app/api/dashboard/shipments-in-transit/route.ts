import { prisma } from "@/lib/db";
import { success, unauthorized, handleError, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

// GET /api/dashboard/shipments-in-transit — Active tracked shipments for map
export async function GET() {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const orders = await prisma.order.findMany({
      where: {
        ...projectScope(session),
        trackingNumber: { not: null },
        currentLat: { not: null },
        currentLng: { not: null },
        status: { in: [OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.CUSTOMS] },
      },
      select: {
        id: true,
        orderNumber: true,
        trackingNumber: true,
        carrier: true,
        currentLat: true,
        currentLng: true,
        currentLocation: true,
        trackingStatus: true,
        estimatedArrival: true,
        factoryId: true,
        factory: {
          select: {
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    const shipments = orders.map((o) => ({
      orderId: o.id,
      orderNumber: o.orderNumber,
      trackingNumber: o.trackingNumber,
      carrier: o.carrier,
      currentLat: o.currentLat,
      currentLng: o.currentLng,
      currentLocation: o.currentLocation,
      trackingStatus: o.trackingStatus,
      estimatedArrival: o.estimatedArrival,
      factoryId: o.factoryId,
      factoryLat: o.factory.latitude,
      factoryLng: o.factory.longitude,
    }));

    return success(shipments);
  } catch (err) {
    return handleError(err);
  }
}
