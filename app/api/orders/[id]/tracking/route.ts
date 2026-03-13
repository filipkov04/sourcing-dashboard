import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, handleError, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";
import { detectCarrier } from "@/lib/integrations/adapters/tracking-adapter";

// GET /api/orders/[id]/tracking — Get tracking data + events
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, ...projectScope(session) },
      select: {
        id: true,
        trackingNumber: true,
        carrier: true,
        carrierCode: true,
        shippingMethod: true,
        trackingStatus: true,
        currentLat: true,
        currentLng: true,
        currentLocation: true,
        estimatedArrival: true,
        lastTrackingSync: true,
        trackingEvents: {
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!order) return notFound("Order");

    return success({
      trackingNumber: order.trackingNumber,
      carrier: order.carrier,
      carrierCode: order.carrierCode,
      shippingMethod: order.shippingMethod,
      trackingStatus: order.trackingStatus,
      currentLocation: order.currentLat
        ? { lat: order.currentLat, lng: order.currentLng, name: order.currentLocation }
        : null,
      estimatedArrival: order.estimatedArrival,
      lastSync: order.lastTrackingSync,
      events: order.trackingEvents,
    });
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/orders/[id]/tracking — Set/update tracking number
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const { trackingNumber, carrier, shippingMethod } = body;

    const order = await prisma.order.findFirst({
      where: { id, ...projectScope(session) },
      select: { id: true },
    });

    if (!order) return notFound("Order");

    const updates: Record<string, unknown> = {};

    if (trackingNumber !== undefined) {
      updates.trackingNumber = trackingNumber || null;

      // Auto-detect carrier via 17Track if trackingNumber is set
      if (trackingNumber && !carrier) {
        const detected = await detectCarrier(trackingNumber);
        if (detected) {
          updates.carrier = detected.carrierName;
          updates.carrierCode = detected.carrierCode;
        }
      }

      // Reset tracking state when number changes
      if (trackingNumber) {
        updates.trackingStatus = null;
        updates.lastTrackingSync = null;
        updates.currentLat = null;
        updates.currentLng = null;
        updates.currentLocation = null;
      }
    }

    if (carrier !== undefined) updates.carrier = carrier || null;
    if (shippingMethod !== undefined) updates.shippingMethod = shippingMethod || null;

    const updated = await prisma.order.update({
      where: { id },
      data: updates,
      select: {
        trackingNumber: true,
        carrier: true,
        carrierCode: true,
        shippingMethod: true,
        trackingStatus: true,
      },
    });

    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}
