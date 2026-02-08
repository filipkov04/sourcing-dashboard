import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";
import { geocodeFactory } from "@/lib/geo";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const { id } = await params;

    const factory = await prisma.factory.findFirst({
      where: { id, organizationId: session.user.organizationId },
    });

    if (!factory) {
      return api.notFound("Factory");
    }

    const coords = await geocodeFactory(factory.location, factory.address);
    if (!coords) {
      return api.error("Could not geocode factory location");
    }

    const updated = await prisma.factory.update({
      where: { id },
      data: { latitude: coords[0], longitude: coords[1] },
      select: { id: true, name: true, latitude: true, longitude: true },
    });

    return api.success(updated);
  } catch (error) {
    console.error("Factory geocode error:", error);
    return api.error("Failed to geocode factory");
  }
}
