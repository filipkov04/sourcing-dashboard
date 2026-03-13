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
