/**
 * DEV ONLY — Seeds 2 orders with fake tracking data for testing.
 * Hit: POST /api/dev/seed-tracking
 */

import { prisma } from "@/lib/db";
import { success, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { TrackingStatus, OrderStatus, ShippingMethod } from "@prisma/client";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return unauthorized("Not available in production");
  }

  try {
    const session = await auth();
    if (!session) return unauthorized();

    const orders = await prisma.order.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: { notIn: ["DELIVERED", "CANCELLED"] },
      },
      take: 2,
      orderBy: { createdAt: "desc" },
      select: { id: true, orderNumber: true, productName: true },
    });

    if (orders.length === 0) {
      return success({ message: "No active orders found" });
    }

    const now = new Date();
    const results: string[] = [];

    // Order 1: In Transit through Suez Canal
    const o1 = orders[0];
    await prisma.order.update({
      where: { id: o1.id },
      data: {
        trackingNumber: "MAEU1234567890",
        carrier: "Maersk",
        carrierCode: "2151",
        shippingMethod: ShippingMethod.OCEAN,
        trackingStatus: TrackingStatus.IN_TRANSIT,
        currentLat: 30.0,
        currentLng: 32.3,
        currentLocation: "Suez Canal, EG",
        estimatedArrival: new Date(now.getTime() + 5 * 86400000),
        lastTrackingSync: now,
        status: OrderStatus.IN_TRANSIT,
      },
    });

    await prisma.trackingEvent.deleteMany({ where: { orderId: o1.id } });

    const events1 = [
      { d: 12, loc: "Shanghai, CN", desc: "Shipment picked up from factory", s: TrackingStatus.INFO_RECEIVED },
      { d: 10, loc: "Port of Shanghai, CN", desc: "Loaded on vessel MAERSK SALALAH", s: TrackingStatus.IN_TRANSIT },
      { d: 7, loc: "Singapore, SG", desc: "Transshipment — vessel MAERSK SALALAH", s: TrackingStatus.IN_TRANSIT },
      { d: 4, loc: "Colombo, LK", desc: "In transit to next port", s: TrackingStatus.IN_TRANSIT },
      { d: 1, loc: "Suez Canal, EG", desc: "Entering Suez Canal", s: TrackingStatus.IN_TRANSIT },
      { d: 0, loc: "Suez Canal, EG", desc: "Transiting Suez Canal", s: TrackingStatus.IN_TRANSIT },
    ];

    for (const e of events1) {
      await prisma.trackingEvent.create({
        data: {
          orderId: o1.id,
          timestamp: new Date(now.getTime() - e.d * 86400000),
          location: e.loc,
          description: e.desc,
          trackingStatus: e.s,
          source: "seed",
        },
      });
    }
    results.push(`${o1.orderNumber}: IN_TRANSIT at Suez Canal with ${events1.length} events`);

    // Order 2: Customs hold at Koper
    if (orders.length >= 2) {
      const o2 = orders[1];
      await prisma.order.update({
        where: { id: o2.id },
        data: {
          trackingNumber: "CMAU9876543210",
          carrier: "CMA CGM",
          carrierCode: "4025",
          shippingMethod: ShippingMethod.OCEAN,
          trackingStatus: TrackingStatus.CUSTOMS,
          currentLat: 45.55,
          currentLng: 13.73,
          currentLocation: "Port of Koper, SI",
          estimatedArrival: new Date(now.getTime() + 2 * 86400000),
          lastTrackingSync: now,
          status: OrderStatus.CUSTOMS,
        },
      });

      await prisma.trackingEvent.deleteMany({ where: { orderId: o2.id } });

      const events2 = [
        { d: 18, loc: "Guangzhou, CN", desc: "Shipment received from shipper", s: TrackingStatus.INFO_RECEIVED },
        { d: 16, loc: "Port of Nansha, CN", desc: "Loaded on vessel CMA CGM MARCO POLO", s: TrackingStatus.IN_TRANSIT },
        { d: 8, loc: "Port Said, EG", desc: "Transited Suez Canal", s: TrackingStatus.IN_TRANSIT },
        { d: 3, loc: "Port of Koper, SI", desc: "Arrived at port of destination", s: TrackingStatus.IN_TRANSIT },
        { d: 2, loc: "Port of Koper, SI", desc: "Customs inspection initiated", s: TrackingStatus.CUSTOMS },
        { d: 0, loc: "Port of Koper, SI", desc: "Held at customs — awaiting documentation", s: TrackingStatus.CUSTOMS },
      ];

      for (const e of events2) {
        await prisma.trackingEvent.create({
          data: {
            orderId: o2.id,
            timestamp: new Date(now.getTime() - e.d * 86400000),
            location: e.loc,
            description: e.desc,
            trackingStatus: e.s,
            source: "seed",
          },
        });
      }
      results.push(`${o2.orderNumber}: CUSTOMS at Port of Koper with ${events2.length} events`);
    }

    return success({ seeded: results });
  } catch (err) {
    return handleError(err);
  }
}
