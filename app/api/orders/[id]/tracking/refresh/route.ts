import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, notFound, unauthorized, error, handleError, projectScope } from "@/lib/api";
import { auth } from "@/lib/auth";
import { TrackingStatus } from "@prisma/client";

// POST /api/orders/[id]/tracking/refresh — Force poll 17Track for this order
export async function POST(
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
        status: true,
        trackingStatus: true,
        estimatedArrival: true,
        organizationId: true,
      },
    });

    if (!order) return notFound("Order");
    if (!order.trackingNumber) {
      return error("No tracking number set on this order", 400);
    }

    const apiKey = process.env.SEVENTEENTRACK_API_KEY;
    if (!apiKey) {
      return error("Tracking API not configured", 503);
    }

    // Call 17Track directly for this single order
    const res = await fetch("https://api.17track.net/track/v2.2/gettrackinfo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "17token": apiKey,
      },
      body: JSON.stringify([{ number: order.trackingNumber }]),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return error(`17Track API returned ${res.status}`, 502);
    }

    const json = await res.json();
    const trackInfo = json?.data?.accepted?.[0];

    if (!trackInfo) {
      // Mark as NOT_FOUND
      await prisma.order.update({
        where: { id },
        data: { trackingStatus: TrackingStatus.NOT_FOUND, lastTrackingSync: new Date() },
      });
      return success({ trackingStatus: "NOT_FOUND", events: [] });
    }

    // Process using the adapter's logic (import dynamically to avoid circular deps)
    const { TrackingAdapter } = await import("@/lib/integrations/adapters/tracking-adapter");
    const adapter = new TrackingAdapter();
    // Use the private method via a direct sync for this order
    // We'll clear lastTrackingSync so it gets picked up
    await prisma.order.update({
      where: { id },
      data: { lastTrackingSync: null },
    });

    const syncResult = await adapter.sync({
      integration: {
        id: "manual-refresh",
        name: "Manual Refresh",
        type: "CARRIER_TRACKING",
        status: "ACTIVE",
        credentials: null,
        config: null,
        syncFrequency: 0,
        lastSyncAt: null,
        lastSyncStatus: "NEVER",
        lastSyncError: null,
        factoryId: "",
        organizationId: order.organizationId,
        projectId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      factoryId: "",
      organizationId: order.organizationId,
    });

    // Fetch updated data
    const updated = await prisma.order.findUnique({
      where: { id },
      select: {
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
        trackingEvents: { orderBy: { timestamp: "desc" } },
      },
    });

    return success({
      trackingNumber: updated?.trackingNumber,
      carrier: updated?.carrier,
      trackingStatus: updated?.trackingStatus,
      currentLocation: updated?.currentLat
        ? { lat: updated.currentLat, lng: updated.currentLng, name: updated.currentLocation }
        : null,
      estimatedArrival: updated?.estimatedArrival,
      lastSync: updated?.lastTrackingSync,
      events: updated?.trackingEvents ?? [],
      syncResult,
    });
  } catch (err) {
    return handleError(err);
  }
}
