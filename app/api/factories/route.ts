import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { success, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";

// GET /api/factories - Get all factories for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
      ];
    }

    const factories = await prisma.factory.findMany({
      where,
      include: {
        _count: {
          select: { orders: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return success(factories);
  } catch (err) {
    return handleError(err);
  }
}
