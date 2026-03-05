import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as api from "@/lib/api";
import { geocodeFactory } from "@/lib/geo";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return api.unauthorized();
    }

    const factories = await prisma.factory.findMany({
      where: {
        ...api.projectScope(session),
        OR: [{ latitude: null }, { longitude: null }],
      },
    });

    let geocoded = 0;
    let failed = 0;

    for (const factory of factories) {
      const coords = await geocodeFactory(factory.location, factory.address);
      if (coords) {
        await prisma.factory.update({
          where: { id: factory.id },
          data: { latitude: coords[0], longitude: coords[1] },
        });
        geocoded++;
      } else {
        failed++;
      }
    }

    return api.success({ geocoded, failed, total: factories.length });
  } catch (error) {
    console.error("Batch geocode error:", error);
    return api.error("Failed to batch geocode factories");
  }
}
